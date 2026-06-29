import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createSiteIndex, loadSourceData } from "./site-data.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const errors = [];

async function exists(relativePath) {
  try {
    await fs.access(path.join(ROOT, relativePath));
    return true;
  } catch {
    errors.push(`缺少文件：${relativePath}`);
    return false;
  }
}

async function read(relativePath) {
  return fs.readFile(path.join(ROOT, relativePath), "utf8");
}

const required = [
  "package.json",
  "wrangler.toml",
  "src/index.html",
  "src/articles.html",
  "src/article.html",
  "src/styles/base.css",
  "src/styles/home.css",
  "src/scripts/home.js",
  "src/scripts/articles.js",
  "src/data/articles-data.js",
  "public/assets/images/avatar.jpg",
  "public/assets/images/qr-official.jpg",
  "public/assets/images/qr-wechat.jpg",
  "public/assets/images/qr-xiaohongshu.jpg",
  "public/assets/images/share-cover.png",
  "public/assets/images/article-fallback.svg",
];

await Promise.all(required.map(exists));

const homepage = await read("src/index.html");
const homeScript = await read("src/scripts/home.js");
const homeStyles = await read("src/styles/home.css");

if (/articles-data\.js/.test(homepage)) {
  errors.push("首页仍然引用完整 articles-data.js");
}
if (!/site-index\.js/.test(homepage)) {
  errors.push("首页没有引用轻量 site-index.js");
}
if (/article\.html\?slug/.test(homeScript)) {
  errors.push("首页脚本仍然生成 /article.html?slug 路径");
}
if (!/headliner-portrait\.is-flipped/.test(homeStyles)) {
  errors.push("头像缺少点击翻转状态样式");
}
if (!/@media \(max-width: 720px\)[\s\S]*?\.portrait-halo/.test(homeStyles)) {
  errors.push("移动端缺少 portrait-halo 专项修复");
}

const sourceData = await loadSourceData();
const siteIndex = createSiteIndex(sourceData);
if (siteIndex.posts.length !== 155) errors.push(`文章数量应为 155，实际为 ${siteIndex.posts.length}`);
if (siteIndex.products.length !== 5) errors.push(`公开产品应为 5，实际为 ${siteIndex.products.length}`);
if (siteIndex.talks.length !== 3) errors.push(`Talks 应为 3，实际为 ${siteIndex.talks.length}`);

try {
  const distIndex = await read("dist/index.html");
  const distSiteIndex = await fs.stat(path.join(ROOT, "dist/assets/data/site-index.js"));
  if (/articles-data\.js/.test(distIndex)) errors.push("构建后首页仍引用完整文章数据");
  if (distSiteIndex.size > 1024 * 1024) {
    errors.push(`轻量首页数据超过 1MB：${distSiteIndex.size} bytes`);
  }
} catch {
  // dist 尚未生成时，只检查源码。
}

if (errors.length) {
  console.error(`检查失败（${errors.length} 项）：`);
  errors.forEach((error) => console.error(`- ${error}`));
  process.exitCode = 1;
} else {
  console.log("HiLoki.ai source check passed");
  console.log(`- articles: ${siteIndex.posts.length}`);
  console.log(`- public products: ${siteIndex.products.length}`);
  console.log(`- talks: ${siteIndex.talks.length}`);
  console.log("- homepage uses lightweight data only");
}
