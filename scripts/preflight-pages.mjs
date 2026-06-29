import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const DIST = path.join(ROOT, "dist");
const errors = [];
const warnings = [];

async function exists(relativePath) {
  try {
    await fs.access(path.join(ROOT, relativePath));
    return true;
  } catch {
    errors.push(`缺少文件：${relativePath}`);
    return false;
  }
}

async function readText(relativePath) {
  return fs.readFile(path.join(ROOT, relativePath), "utf8");
}

async function fileSize(relativePath) {
  const stat = await fs.stat(path.join(ROOT, relativePath));
  return stat.size;
}

async function walk(directory) {
  const entries = await fs.readdir(directory, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const absolute = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...(await walk(absolute)));
    else files.push(absolute);
  }
  return files;
}

function decodeRef(ref) {
  try {
    return decodeURIComponent(ref);
  } catch {
    return ref;
  }
}

function assertCloudflareRules(name, content, { maxRules, maxLineLength }) {
  const lines = content.split(/\r?\n/);
  const rules = lines.filter((line) => {
    const trimmed = line.trim();
    return trimmed && !trimmed.startsWith("#");
  });
  if (rules.length > maxRules) {
    errors.push(`${name} 规则数量超过 Cloudflare Pages 限制：${rules.length} > ${maxRules}`);
  }
  lines.forEach((line, index) => {
    if (line.length > maxLineLength) {
      errors.push(`${name}:${index + 1} 单行过长：${line.length} > ${maxLineLength}`);
    }
  });
}

async function checkLocalRefs() {
  const files = (await walk(DIST)).filter((file) => /\.(html|css|js|webmanifest)$/.test(file));
  const refs = new Map();
  const patterns = [
    /(?:src|href)=['"](\/[^'"?#]+)(?:[?#][^'"]*)?['"]/g,
    /url\(['"]?(\/[^)'"?#]+)(?:[?#][^)'"]*)?['"]?\)/g,
    /['"](\/(?:assets|data|favicon|apple-touch-icon|icon-|site\.webmanifest)[^'"?#)]*)/g,
  ];

  for (const file of files) {
    const text = await fs.readFile(file, "utf8");
    for (const pattern of patterns) {
      for (const match of text.matchAll(pattern)) {
        const ref = match[1];
        if (ref.startsWith("//")) continue;
        if (!refs.has(ref)) refs.set(ref, new Set());
        refs.get(ref).add(path.relative(DIST, file));
      }
    }
  }

  const missing = [];
  for (const [ref, owners] of refs) {
    const clean = decodeRef(ref.replace(/^\/+/, ""));
    const absolute = path.join(DIST, clean);
    try {
      const stat = await fs.stat(absolute);
      if (stat.isFile()) continue;
    } catch {
      try {
        const stat = await fs.stat(path.join(absolute, "index.html"));
        if (stat.isFile()) continue;
      } catch {
        missing.push({ ref, owners: [...owners] });
      }
    }
  }

  if (missing.length) {
    errors.push(`构建产物存在缺失引用：${missing.length} 个，例如 ${missing[0].ref} <- ${missing[0].owners.join(", ")}`);
  }

  return { checkedFiles: files.length, refCount: refs.size, missingCount: missing.length };
}

await Promise.all([
  exists("wrangler.toml"),
  exists("dist/index.html"),
  exists("dist/articles/index.html"),
  exists("dist/article/index.html"),
  exists("dist/articles.html"),
  exists("dist/article.html"),
  exists("dist/_headers"),
  exists("dist/_redirects"),
  exists("dist/site.webmanifest"),
  exists("dist/favicon.ico"),
  exists("dist/assets/data/site-index.js"),
  exists("dist/assets/data/articles-data.js"),
]);

const wrangler = await readText("wrangler.toml");
if (!/pages_build_output_dir\s*=\s*["']\.\/dist["']/.test(wrangler)) {
  errors.push("wrangler.toml 未声明 pages_build_output_dir = \"./dist\"");
}
if (!/name\s*=\s*["']hiloki-ai["']/.test(wrangler)) {
  warnings.push("wrangler.toml project name 不是 hiloki-ai，请确认 Cloudflare Pages 项目名。");
}

const headers = await readText("dist/_headers");
assertCloudflareRules("_headers", headers, { maxRules: 100, maxLineLength: 2000 });
for (const required of [
  "/site.webmanifest",
  "Content-Type: application/manifest+json",
  "/favicon.ico",
  "Content-Type: image/x-icon",
  "/assets/images/*",
  "Cache-Control: public, max-age=31536000, immutable",
]) {
  if (!headers.includes(required)) errors.push(`_headers 缺少必要规则片段：${required}`);
}

const redirects = await readText("dist/_redirects");
assertCloudflareRules("_redirects", redirects, { maxRules: 2100, maxLineLength: 1000 });
for (const required of [
  "/index.html / 301",
  "/articles.html /articles 301",
  "/article.html /article 301",
]) {
  if (!redirects.includes(required)) errors.push(`_redirects 缺少兼容规则：${required}`);
}

const index = await readText("dist/index.html");
if (index.includes("articles-data.js")) errors.push("首页仍引用完整文章数据 articles-data.js");
if (!index.includes("site-index.js")) errors.push("首页没有引用轻量 site-index.js");

const siteIndexSize = await fileSize("dist/assets/data/site-index.js");
const articleIndexSize = await fileSize("dist/assets/data/articles-data.js");
const articleIndex = await readText("dist/assets/data/articles-data.js");
if (siteIndexSize > 1024 * 1024) errors.push(`首页轻量数据超过 1MB：${siteIndexSize} bytes`);
if (articleIndexSize > 1024 * 1024) errors.push(`文章索引数据超过 1MB：${articleIndexSize} bytes`);
if (articleIndex.includes('"html"')) errors.push("文章索引数据仍包含 cached.html 正文");

const postFiles = (await walk(path.join(DIST, "data/posts"))).filter((file) => file.endsWith(".json"));
if (postFiles.length !== 155) errors.push(`独立文章 JSON 数量应为 155，实际为 ${postFiles.length}`);

const refs = await checkLocalRefs();

if (warnings.length) {
  console.warn(`Cloudflare Pages preflight warnings（${warnings.length}）：`);
  warnings.forEach((warning) => console.warn(`- ${warning}`));
}

if (errors.length) {
  console.error(`Cloudflare Pages preflight failed（${errors.length}）：`);
  errors.forEach((error) => console.error(`- ${error}`));
  process.exitCode = 1;
} else {
  console.log("Cloudflare Pages preflight passed");
  console.log("- output: dist/");
  console.log("- routes: /, /articles, /article?slug=..., /articles.html, /article.html?slug=...");
  console.log(`- post json files: ${postFiles.length}`);
  console.log(`- homepage data: ${(siteIndexSize / 1024).toFixed(1)} KB`);
  console.log(`- article index data: ${(articleIndexSize / 1024).toFixed(1)} KB`);
  console.log(`- local refs: ${refs.refCount} checked, ${refs.missingCount} missing`);
}
