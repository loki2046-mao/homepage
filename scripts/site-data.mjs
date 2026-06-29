import fs from "node:fs/promises";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
export const SOURCE_DATA_FILE = path.join(ROOT, "src/data/articles-data.js");
export const FALLBACK_COVER = "/assets/images/article-fallback.svg";

const productCovers = new Map([
  ["AI 测评提示词工厂", "/assets/images/products/prompt-factory.jpg"],
  ["Loki's Multi-Functional Image Toolbox", "/assets/images/products/image-toolbox.png"],
  ["Loki 的图片压缩小助手", "/assets/images/products/image-compressor.png"],
  ["微信公众号排版编辑器", "/assets/images/products/wechat-editor.jpg"],
  ["小能苗气运指南", "/assets/images/products/fortune.png"],
]);

function slugify(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/['’]/g, "")
    .replace(/[^a-z0-9\u4e00-\u9fff]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export async function loadSourceData() {
  const source = await fs.readFile(SOURCE_DATA_FILE, "utf8");
  const context = { window: {} };
  vm.createContext(context);
  vm.runInContext(source, context, { filename: SOURCE_DATA_FILE });
  const data = context.window.__HILOKI_DATA__;
  if (!data || !Array.isArray(data.posts)) {
    throw new Error("无法从 src/data/articles-data.js 读取 window.__HILOKI_DATA__");
  }
  return data;
}

function postCover(post) {
  if (String(post.title || "").includes("当一个文科生决定去做开发")) {
    return "/assets/images/articles/dev-story.png";
  }
  return FALLBACK_COVER;
}

function postJsonPath(post) {
  return post?.slug ? `/data/posts/${encodeURIComponent(post.slug)}.json` : "";
}

function normalizeLocalHref(href) {
  if (!href) return "";
  if (/^(https?:|mailto:|#)/i.test(href)) return href;
  return `/${String(href).replace(/^\.?\//, "")}`;
}

export function createSiteIndex(data) {
  const posts = data.posts.map((post) => {
    const date = post.publishDate || post.cached?.publishDate || "";
    return {
      title: post.title || "",
      slug: post.slug || "",
      date,
      publishDate: date,
      category: post.category || "Loki",
      summary: post.summary || post.cached?.excerpt || "",
      excerpt: post.cached?.excerpt || post.summary || "",
      cover: postCover(post),
      href: `/article?slug=${encodeURIComponent(post.slug || "")}`,
    };
  });

  const products = (data.products || [])
    .filter((product) => product.href && product.href !== "./index.html")
    .map((product) => ({
      title: product.title || "",
      slug: slugify(product.title),
      description: product.summary || "",
      href: normalizeLocalHref(product.href),
      tags: product.tags || [],
      status: product.status || "Ongoing",
      cover: productCovers.get(product.title) || FALLBACK_COVER,
    }));

  const talks = (data.talks || []).map((talk) => ({
    title: talk.title || "",
    date: talk.date || "",
    href: normalizeLocalHref(talk.href),
    description: talk.summary || "",
    audience: talk.audience || "",
    status: talk.status || "Archive",
    cover: /提示词工程/.test(talk.title || "")
      ? "/assets/images/share-cover.png"
      : FALLBACK_COVER,
  }));

  return {
    brand: data.brand || {},
    hero: {
      ...(data.hero || {}),
      avatar: { path: "/assets/images/avatar.jpg", exists: true },
    },
    contact: {
      ...(data.contact || {}),
      wechatQr: { path: "/assets/images/qr-wechat.jpg", exists: true },
      officialQr: { path: "/assets/images/qr-official.jpg", exists: true },
      xiaohongshuQr: { path: "/assets/images/qr-xiaohongshu.jpg", exists: true },
    },
    posts,
    products,
    talks,
    stats: {
      ...(data.stats || {}),
      articleCount: posts.length,
    },
  };
}

function removeUnavailableInlineMedia(html) {
  if (!html) return "";
  return String(html)
    .replace(
      /<img\b(?=[^>]*(?:src|data-src)\s*=\s*["'](?:\.\/|images\/|\/?wechat-cache\/|\/?article-assets\/))[^>]*>/gi,
      "",
    )
    .replace(
      /<mp-common-sticker\b(?=[^>]*(?:data-src|data-cdn_url|data-emoji_url)\s*=\s*["'](?:\.\/|images\/))[^>]*>[\s\S]*?<\/mp-common-sticker>/gi,
      "",
    );
}

function createPostMetadata(post) {
  const date = post.publishDate || post.cached?.publishDate || "";
  const summary = post.summary || post.cached?.excerpt || "";
  const cover = postCover(post);

  return {
    slug: post.slug || "",
    title: post.title || "",
    id: post.id || "",
    category: post.category || "Loki",
    image: cover,
    gallery: [],
    sourceDir: "",
    assetCount: post.assetCount || 0,
    hasBody: Boolean(post.cached?.html || post.hasBody),
    summary,
    publishDate: date,
    url: post.url || "",
    canonicalRank: post.canonicalRank || 0,
    displayMode: post.displayMode || "",
    cached: {
      available: Boolean(post.cached?.html),
      contentPath: postJsonPath(post),
      coverPath: cover,
      excerpt: post.cached?.excerpt || summary,
      publishDate: post.cached?.publishDate || date,
    },
  };
}

export function createArticleData(data) {
  return {
    ...data,
    hero: {
      ...(data.hero || {}),
      avatar: { path: "/assets/images/avatar.jpg", exists: true },
    },
    contact: {
      ...(data.contact || {}),
      wechatQr: { path: "/assets/images/qr-wechat.jpg", exists: true },
      officialQr: { path: "/assets/images/qr-official.jpg", exists: true },
      xiaohongshuQr: { path: "/assets/images/qr-xiaohongshu.jpg", exists: true },
    },
    products: (data.products || []).map((product) => ({
      ...product,
      href: normalizeLocalHref(product.href),
      screenshot: productCovers.get(product.title) || FALLBACK_COVER,
    })),
    talks: (data.talks || []).map((talk) => ({
      ...talk,
      href: normalizeLocalHref(talk.href),
      audience: talk.audience || "",
      image: /提示词工程/.test(talk.title || "")
        ? "/assets/images/share-cover.png"
        : FALLBACK_COVER,
    })),
    posts: data.posts.map(createPostMetadata),
  };
}

export function createPostFiles(data) {
  return (data.posts || [])
    .filter((post) => post.slug)
    .map((post) => {
      const metadata = createPostMetadata(post);
      const html = removeUnavailableInlineMedia(post.cached?.html || "");
      return {
        slug: post.slug,
        data: {
          ...metadata,
          cached: {
            ...metadata.cached,
            available: Boolean(html || post.cached?.html),
            html,
          },
        },
      };
    });
}

export function serializeWindowData(name, value) {
  return `window.${name} = ${JSON.stringify(value)};\n`;
}
