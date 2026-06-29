import fs from "node:fs/promises";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";
import { renderHomeHTML } from "../src/scripts/home-template.js";
import { createSiteIndex, loadSourceData } from "./site-data.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const INDEX_TEMPLATE = path.join(ROOT, "src/index.html");
const SKILL_PEDALS_FILE = path.join(ROOT, "src/data/skill-pedals.js");

export async function loadSkillPedals(file = SKILL_PEDALS_FILE) {
  const source = await fs.readFile(file, "utf8");
  const context = { window: {} };
  vm.createContext(context);
  vm.runInContext(source, context, { filename: file });
  return Array.isArray(context.window.__HILOKI_SKILL_PEDALS__) ? context.window.__HILOKI_SKILL_PEDALS__ : [];
}

export function renderIndexHTML(indexHtml, siteIndex, skillPedals) {
  const homeMarkup = renderHomeHTML(siteIndex, skillPedals).trim();
  const mainMarkup = `<main id="venue-root">\n${homeMarkup}\n    </main>`;
  return indexHtml.replace(/<main id="venue-root">[\s\S]*?<\/main>/, mainMarkup);
}

export async function renderHomePage({ indexTemplate = INDEX_TEMPLATE, siteIndex, skillPedals } = {}) {
  const [indexHtml, resolvedSiteIndex, resolvedSkillPedals] = await Promise.all([
    fs.readFile(indexTemplate, "utf8"),
    siteIndex ? Promise.resolve(siteIndex) : loadSourceData().then(createSiteIndex),
    skillPedals ? Promise.resolve(skillPedals) : loadSkillPedals(),
  ]);
  return renderIndexHTML(indexHtml, resolvedSiteIndex, resolvedSkillPedals);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  renderHomePage()
    .then((html) => {
      process.stdout.write(html);
    })
    .catch((error) => {
      console.error(error.message);
      process.exitCode = 1;
    });
}
