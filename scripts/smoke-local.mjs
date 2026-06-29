import fs from "node:fs";
import http from "node:http";
import https from "node:https";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const BASE_URL = process.env.HILOKI_SMOKE_URL || "http://127.0.0.1:4173";
const CHROME_CANDIDATES = [
  process.env.CHROME_PATH,
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  "/Applications/Chromium.app/Contents/MacOS/Chromium",
  "/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge",
].filter(Boolean);

function findChrome() {
  return CHROME_CANDIDATES.find((candidate) => fs.existsSync(candidate));
}

function assertCheck(checks, name, ok, details = {}) {
  checks.push({ name, ok, ...details });
}

async function probe(url) {
  return new Promise((resolve) => {
    const target = new URL(url);
    const client = target.protocol === "https:" ? https : http;
    const request = client.get(
      {
        hostname: target.hostname,
        port: target.port || (target.protocol === "https:" ? 443 : 80),
        path: `${target.pathname}${target.search}`,
        timeout: 5000,
      },
      (response) => {
        response.resume();
        response.on("end", () => resolve({ ok: response.statusCode >= 200 && response.statusCode < 400, status: response.statusCode }));
      },
    );
    request.on("error", (error) => resolve({ ok: false, error: error.message }));
    request.on("timeout", () => {
      request.destroy(new Error("timeout"));
    });
  });
}

async function loadPlaywright() {
  try {
    return require("playwright");
  } catch (error) {
    throw new Error(`无法加载 playwright。请先确认本机 Codex 运行时或项目依赖中有 playwright：${error.message}`);
  }
}

const availability = await probe(`${BASE_URL}/`);
if (!availability.ok) {
  console.error(`预览地址不可访问：${BASE_URL}/`);
  if (BASE_URL.includes("127.0.0.1") || BASE_URL.includes("localhost")) {
    console.error(`请先运行：npm run preview`);
  }
  if (availability.status) console.error(`HTTP status: ${availability.status}`);
  if (availability.error) console.error(`Error: ${availability.error}`);
  process.exit(1);
}

const executablePath = findChrome();
if (!executablePath) {
  console.error("找不到本机 Chrome/Chromium。可通过 CHROME_PATH=/path/to/chrome npm run smoke:local 指定。");
  process.exit(1);
}

const { chromium } = await loadPlaywright();
const report = { checks: [], console: [] };
const browser = await chromium.launch({ headless: true, executablePath });
const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });

page.on("console", (message) => {
  if (["error", "warning"].includes(message.type())) {
    report.console.push({ type: message.type(), text: message.text().slice(0, 300) });
  }
});
page.on("pageerror", (error) => report.console.push({ type: "pageerror", text: error.message }));
page.on("response", (response) => {
  if (response.status() >= 400) report.console.push({ type: "response", text: `${response.status()} ${response.url()}` });
});

try {
  await page.goto(`${BASE_URL}/`, { waitUntil: "domcontentloaded", timeout: 15000 });
  await page.waitForTimeout(600);
  let state = await page.evaluate(() => ({
    rootChildren: document.querySelector("#venue-root")?.children.length || 0,
    overflowX: document.documentElement.scrollWidth - document.documentElement.clientWidth,
    setlistCards: document.querySelectorAll(".show-poster").length,
    pedalsOriginal: document.querySelectorAll("#rehearsal [data-skill-index]").length,
    talks: document.querySelectorAll("[data-talk-index]").length,
    doors: document.querySelectorAll('#backstage-corridor a[href^="#"]').length,
    hasFullArticleDataOnHome: [...document.scripts].some((script) => (script.src || "").includes("articles-data.js")),
  }));
  assertCheck(report.checks, "desktop home renders", state.rootChildren > 0 && state.setlistCards >= 6 && state.pedalsOriginal === 12 && !state.hasFullArticleDataOnHome, state);
  assertCheck(report.checks, "desktop no horizontal overflow", state.overflowX <= 1, { overflowX: state.overflowX });

  const beforeTheme = await page.evaluate(() => document.body.dataset.theme);
  await page.click(".light-switch");
  await page.waitForTimeout(900);
  const afterTheme = await page.evaluate(() => document.body.dataset.theme);
  assertCheck(report.checks, "light switch toggles theme", beforeTheme !== afterTheme, { beforeTheme, afterTheme });

  await page.click(".ticket-trigger");
  await page.waitForTimeout(250);
  let ticket = await page.evaluate(() => ({ open: document.querySelector("#ticket-dialog")?.open || false, channels: document.querySelectorAll(".channel-button").length }));
  assertCheck(report.checks, "ticket machine opens", ticket.open && ticket.channels >= 4, ticket);
  await page.click('.channel-button[data-channel-index="0"]');
  await page.waitForTimeout(250);
  ticket = await page.evaluate(() => ({ printed: Boolean(document.querySelector("#printed-ticket .ticket-main")), active: document.querySelectorAll(".channel-button.is-active").length }));
  assertCheck(report.checks, "ticket machine prints ticket", ticket.printed && ticket.active === 1, ticket);
  await page.click(".ticket-close");

  await page.fill("#album-search-input", "AI");
  await page.waitForTimeout(300);
  const album = await page.evaluate(() => ({
    tracksMode: document.querySelector("#track-table")?.classList.contains("is-active") || false,
    visibleRows: [...document.querySelectorAll(".track-row")].filter((row) => !row.hidden).length,
  }));
  assertCheck(report.checks, "album search switches to track table", album.tracksMode && album.visibleRows > 0, album);

  await page.click('#backstage-corridor a[href="#dressing-room"]');
  await page.waitForTimeout(1000);
  let door = await page.evaluate(() => ({
    open: document.querySelector("#backstage-corridor")?.classList.contains("is-room-open") || false,
    activeRooms: document.querySelectorAll(".corridor-room-stage.is-active-room").length,
    activeDoors: document.querySelectorAll(".corridor-door-slot.is-active-door").length,
  }));
  assertCheck(report.checks, "door 01 opens in-place room", door.open && door.activeRooms === 1 && door.activeDoors === 1, door);
  await page.click(".corridor-room-stage.is-active-room .corridor-return, .corridor-room-stage.is-active-room .corridor-close-btn");
  await page.waitForTimeout(1000);

  await page.click('#backstage-corridor a[href="#broadcast-booth"]');
  await page.waitForTimeout(1000);
  door = await page.evaluate(() => ({
    open: document.querySelector("#backstage-corridor")?.classList.contains("is-room-open") || false,
    hasBroadcastCopy: Boolean(document.querySelector(".corridor-room-stage.is-active-room .broadcast-booth")),
    activeRooms: document.querySelectorAll(".corridor-room-stage.is-active-room").length,
    rehearsalStillOnPage: Boolean(document.querySelector("#rehearsal .rehearsal-room")),
  }));
  assertCheck(report.checks, "door 02 opens broadcast booth", door.open && door.hasBroadcastCopy && door.activeRooms === 1 && door.rehearsalStillOnPage, door);

  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(`${BASE_URL}/`, { waitUntil: "domcontentloaded", timeout: 15000 });
  await page.waitForTimeout(700);
  const mobile = await page.evaluate(() => ({
    overflowX: document.documentElement.scrollWidth - document.documentElement.clientWidth,
    portraitWidth: Math.round(document.querySelector(".headliner-portrait")?.getBoundingClientRect().width || 0),
    haloWidth: Math.round(document.querySelector(".portrait-halo")?.getBoundingClientRect().width || 0),
    clientWidth: document.documentElement.clientWidth,
  }));
  assertCheck(report.checks, "390px home no horizontal overflow", mobile.overflowX <= 1, mobile);
  await page.click(".headliner-portrait");
  await page.waitForTimeout(150);
  const flipped = await page.evaluate(() => document.querySelector(".headliner-portrait")?.classList.contains("is-flipped") || false);
  assertCheck(report.checks, "mobile portrait click flips card", flipped, { flipped });

  await page.click('#backstage-corridor a[href="#broadcast-booth"]');
  await page.waitForTimeout(700);
  const mobileDoor = await page.evaluate(() => ({
    open: document.querySelector("#backstage-corridor")?.classList.contains("is-room-open") || false,
    activeRoom: document.querySelectorAll(".corridor-room-stage.is-active-room").length,
    overflowX: document.documentElement.scrollWidth - document.documentElement.clientWidth,
  }));
  assertCheck(report.checks, "mobile door overlay opens without overflow", mobileDoor.open && mobileDoor.activeRoom === 1 && mobileDoor.overflowX <= 1, mobileDoor);

  await page.goto(`${BASE_URL}/articles`, { waitUntil: "domcontentloaded", timeout: 15000 });
  await page.waitForTimeout(600);
  const archive = await page.evaluate(() => ({
    cards: document.querySelectorAll("a.luxe-archive-card").length,
    overflowX: document.documentElement.scrollWidth - document.documentElement.clientWidth,
    firstHref: document.querySelector("a.luxe-archive-card")?.getAttribute("href") || "",
  }));
  assertCheck(report.checks, "articles route renders", archive.cards === 10 && archive.overflowX <= 1, archive);

  await page.goto(`${BASE_URL}${archive.firstHref}`, { waitUntil: "domcontentloaded", timeout: 15000 });
  await page.waitForSelector("h1", { timeout: 15000 });
  await page.waitForFunction(
    () => (document.querySelector(".cached-article-content")?.textContent?.trim().length || 0) > 1000,
    { timeout: 15000 },
  );
  const article = await page.evaluate(() => ({
    h1: document.querySelector("h1")?.textContent?.trim() || "",
    bodyChars: document.querySelector(".cached-article-content")?.textContent?.trim().length || 0,
    contentPath: document.querySelector("[data-content-path]")?.getAttribute("data-content-path") || "",
    overflowX: document.documentElement.scrollWidth - document.documentElement.clientWidth,
    ogImage: document.querySelector('meta[property="og:image"]')?.getAttribute("content") || "",
  }));
  assertCheck(report.checks, "article route loads independent body json", article.bodyChars > 1000 && article.contentPath.startsWith("/data/posts/") && article.overflowX <= 1, article);
} finally {
  await browser.close();
}

const failed = report.checks.filter((check) => !check.ok);
if (failed.length || report.console.length) {
  console.error(JSON.stringify({ failed: failed.length, report }, null, 2));
  process.exit(1);
}

console.log("HiLoki.ai local smoke passed");
report.checks.forEach((check) => console.log(`- ${check.name}`));
