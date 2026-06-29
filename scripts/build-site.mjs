import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";
import {
  createArticleData,
  createPostFiles,
  createSiteIndex,
  loadSourceData,
  serializeWindowData,
} from "./site-data.mjs";
import { loadSkillPedals, renderIndexHTML } from "./render-home.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SRC = path.join(ROOT, "src");
const PUBLIC = path.join(ROOT, "public");
const DIST = path.join(ROOT, "dist");

async function copyFile(source, destination) {
  await fs.mkdir(path.dirname(destination), { recursive: true });
  await fs.copyFile(source, destination);
}

async function copyDirectory(source, destination) {
  await fs.cp(source, destination, { recursive: true });
}

async function writeFile(destination, content) {
  await fs.mkdir(path.dirname(destination), { recursive: true });
  await fs.writeFile(destination, content);
}

async function assertFiles(paths) {
  const missing = [];
  for (const file of paths) {
    try {
      await fs.access(file);
    } catch {
      missing.push(path.relative(ROOT, file));
    }
  }
  if (missing.length) {
    throw new Error(`构建缺少关键文件：\n- ${missing.join("\n- ")}`);
  }
}

async function collectImageFiles(directory) {
  const entries = await fs.readdir(directory, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const absolute = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await collectImageFiles(absolute)));
      continue;
    }
    if (/\.(png|jpe?g)$/i.test(entry.name)) files.push(absolute);
  }
  return files;
}

async function generateWebpImages() {
  const imageRoot = path.join(DIST, "assets/images");
  const images = await collectImageFiles(imageRoot);
  let generated = 0;
  let generatedSmall = 0;

  await Promise.all(
    images.map(async (input) => {
      const parsed = path.parse(input);
      const output = path.join(parsed.dir, `${parsed.name}.webp`);
      const stat = await fs.stat(input);
      const pipeline = sharp(input).rotate();
      await pipeline.webp({ quality: 80 }).toFile(output);
      generated += 1;

      if (stat.size > 500 * 1024) {
        const metadata = await sharp(input).metadata();
        const width = metadata.width ? Math.max(1, Math.round(metadata.width * 0.5)) : undefined;
        if (width) {
          await sharp(input)
            .rotate()
            .resize({ width, withoutEnlargement: true })
            .webp({ quality: 78 })
            .toFile(path.join(parsed.dir, `${parsed.name}-sm.webp`));
          generatedSmall += 1;
        }
      }
    }),
  );

  return { generated, generatedSmall };
}

function createIcoBuffer(pngBuffer, size = 32) {
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(1, 4);

  const entry = Buffer.alloc(16);
  entry.writeUInt8(size >= 256 ? 0 : size, 0);
  entry.writeUInt8(size >= 256 ? 0 : size, 1);
  entry.writeUInt8(0, 2);
  entry.writeUInt8(0, 3);
  entry.writeUInt16LE(1, 4);
  entry.writeUInt16LE(32, 6);
  entry.writeUInt32LE(pngBuffer.length, 8);
  entry.writeUInt32LE(header.length + entry.length, 12);

  return Buffer.concat([header, entry, pngBuffer]);
}

async function generateAppIcons() {
  const source = path.join(DIST, "assets/images/loki-ip-new.png");
  const icon32 = await sharp(source).rotate().resize(32, 32, { fit: "cover" }).png().toBuffer();
  const icon192 = await sharp(source).rotate().resize(192, 192, { fit: "cover" }).png().toBuffer();
  const icon512 = await sharp(source).rotate().resize(512, 512, { fit: "cover" }).png().toBuffer();
  const appleTouchIcon = await sharp(source).rotate().resize(180, 180, { fit: "cover" }).png().toBuffer();

  await Promise.all([
    writeFile(path.join(DIST, "favicon.ico"), createIcoBuffer(icon32, 32)),
    writeFile(path.join(DIST, "favicon-32x32.png"), icon32),
    writeFile(path.join(DIST, "icon-192.png"), icon192),
    writeFile(path.join(DIST, "icon-512.png"), icon512),
    writeFile(path.join(DIST, "apple-touch-icon.png"), appleTouchIcon),
    writeFile(
      path.join(DIST, "site.webmanifest"),
      `${JSON.stringify(
        {
          name: "HiLoki.ai · Loki Live House",
          short_name: "HiLoki.ai",
          description: "走进 Loki 的场馆：认识赛博小熊猫 Loki，浏览她的文章、产品、教程、分享与长期创作。",
          start_url: "/",
          scope: "/",
          display: "standalone",
          background_color: "#0d0b0a",
          theme_color: "#0d0b0a",
          icons: [
            { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
            { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
          ],
        },
        null,
        2,
      )}\n`,
    ),
  ]);

  return { generated: 6 };
}

function createClientConfig() {
  const protectedTalkCode = process.env.PROTECTED_TALK_CODE || process.env.HILOKI_PROTECTED_TALK_CODE || "";
  return {
    protectedTalkCode,
    protectedTalksEnabled: Boolean(protectedTalkCode),
  };
}

function minifyCss(css) {
  return css
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/\s+/g, " ")
    .replace(/\s*([{}:;,>+~])\s*/g, "$1")
    .replace(/;}/g, "}")
    .trim();
}

async function minifyCssAssets() {
  const cssFiles = [
    path.join(DIST, "assets/styles/base.css"),
    path.join(DIST, "assets/styles/home.css"),
    path.join(DIST, "assets/styles/articles.css"),
  ];
  let before = 0;
  let after = 0;

  await Promise.all(
    cssFiles.map(async (file) => {
      const source = await fs.readFile(file, "utf8");
      const minified = minifyCss(source);
      before += Buffer.byteLength(source);
      after += Buffer.byteLength(minified);
      await fs.writeFile(file, `${minified}\n`);
    }),
  );

  return { before, after };
}

export async function build() {
  await assertFiles([
    path.join(SRC, "index.html"),
    path.join(SRC, "articles.html"),
    path.join(SRC, "article.html"),
    path.join(SRC, "styles/base.css"),
    path.join(SRC, "styles/home.css"),
    path.join(SRC, "styles/articles.css"),
    path.join(SRC, "scripts/home.js"),
    path.join(SRC, "scripts/home-template.js"),
    path.join(SRC, "scripts/articles.js"),
    path.join(SRC, "data/skill-pedals.js"),
    path.join(SRC, "data/articles-data.js"),
    path.join(PUBLIC, "assets/images/avatar.jpg"),
    path.join(PUBLIC, "assets/images/article-fallback.svg"),
  ]);

  await fs.rm(DIST, { recursive: true, force: true });
  await fs.mkdir(DIST, { recursive: true });

  await copyDirectory(PUBLIC, DIST);
  await copyFile(path.join(SRC, "index.html"), path.join(DIST, "index.html"));
  await copyFile(path.join(SRC, "styles/base.css"), path.join(DIST, "assets/styles/base.css"));
  await copyFile(path.join(SRC, "styles/home.css"), path.join(DIST, "assets/styles/home.css"));
  await copyFile(path.join(SRC, "styles/articles.css"), path.join(DIST, "assets/styles/articles.css"));
  await copyFile(path.join(SRC, "scripts/home.js"), path.join(DIST, "assets/scripts/home.js"));
  await copyFile(path.join(SRC, "scripts/home-template.js"), path.join(DIST, "assets/scripts/home-template.js"));
  await copyFile(path.join(SRC, "scripts/articles.js"), path.join(DIST, "assets/scripts/articles.js"));
  await copyFile(path.join(SRC, "data/skill-pedals.js"), path.join(DIST, "assets/data/skill-pedals.js"));

  const articleTemplate = await fs.readFile(path.join(SRC, "article.html"), "utf8");
  const articlesTemplate = await fs.readFile(path.join(SRC, "articles.html"), "utf8");
  await writeFile(path.join(DIST, "article/index.html"), articleTemplate);
  await writeFile(path.join(DIST, "articles/index.html"), articlesTemplate);
  await writeFile(path.join(DIST, "article.html"), articleTemplate);
  await writeFile(path.join(DIST, "articles.html"), articlesTemplate);

  for (const compatibilityPage of ["prompt-factory.html", "talk.html"]) {
    await copyFile(path.join(SRC, compatibilityPage), path.join(DIST, compatibilityPage));
  }
  await writeFile(
    path.join(DIST, "talks/ai-material-engineering-talk/index.html"),
    await fs.readFile(path.join(SRC, "talk.html"), "utf8"),
  );

  const sourceData = await loadSourceData();
  const siteIndex = createSiteIndex(sourceData);
  const articleData = createArticleData(sourceData);
  const postFiles = createPostFiles(sourceData);
  const skillPedals = await loadSkillPedals();
  const clientConfig = createClientConfig();
  const siteIndexSource = serializeWindowData("__HILOKI_SITE_INDEX__", siteIndex);
  const articleDataSource = serializeWindowData("__HILOKI_DATA__", articleData);
  const clientConfigSource = serializeWindowData("__HILOKI_CONFIG__", clientConfig);
  const renderedIndex = renderIndexHTML(await fs.readFile(path.join(SRC, "index.html"), "utf8"), siteIndex, skillPedals);

  await writeFile(path.join(DIST, "index.html"), renderedIndex);
  await writeFile(path.join(DIST, "assets/data/site-index.js"), siteIndexSource);
  await writeFile(path.join(DIST, "assets/data/articles-data.js"), articleDataSource);
  await writeFile(path.join(DIST, "assets/data/site-config.js"), clientConfigSource);
  await Promise.all(
    postFiles.map((postFile) =>
      writeFile(path.join(DIST, "data/posts", `${postFile.slug}.json`), `${JSON.stringify(postFile.data)}\n`),
    ),
  );
  const webpStats = await generateWebpImages();
  const iconStats = await generateAppIcons();
  const cssStats = await minifyCssAssets();

  const siteIndexBytes = Buffer.byteLength(siteIndexSource);
  const articleDataBytes = Buffer.byteLength(articleDataSource);
  console.log("HiLoki.ai build complete");
  console.log(`- articles: ${siteIndex.posts.length}`);
  console.log(`- post json files: ${postFiles.length}`);
  console.log(`- public products: ${siteIndex.products.length}`);
  console.log(`- talks: ${siteIndex.talks.length}`);
  console.log("- homepage: pre-rendered");
  console.log(`- webp images: ${webpStats.generated} generated, ${webpStats.generatedSmall} small variants`);
  console.log(`- app icons: ${iconStats.generated} generated`);
  console.log(`- css minified: ${(cssStats.before / 1024).toFixed(1)} KB → ${(cssStats.after / 1024).toFixed(1)} KB`);
  console.log(`- protected talks: ${clientConfig.protectedTalksEnabled ? "configured" : "not configured"}`);
  console.log(`- homepage data: ${(siteIndexBytes / 1024).toFixed(1)} KB`);
  console.log(`- article index data: ${(articleDataBytes / 1024).toFixed(1)} KB`);
  console.log(`- output: ${path.relative(ROOT, DIST)}/`);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  build().catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
}
