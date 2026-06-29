const siteData = window.__HILOKI_DATA__ || {
  brand: { siteName: "HiLoki.ai", author: "Loki", tagline: "AI creator, vibe coder, speaker" },
  hero: {},
  about: {},
  products: [],
  talks: [],
  contact: {},
  posts: [],
  stats: { articleCount: 0, totalAssets: 0, categories: [] },
  recovery: { articleCount: 0, talkCount: 0, productCount: 0 },
};

function articlePostDataPath(postOrSlug) {
  if (typeof postOrSlug === "object" && postOrSlug?.cached?.contentPath) {
    const configuredPath = String(postOrSlug.cached.contentPath || "");
    return configuredPath.startsWith("/") ? configuredPath : `/${configuredPath.replace(/^\/+/, "")}`;
  }
  const slug = typeof postOrSlug === "string" ? postOrSlug : postOrSlug?.slug || "";
  return slug ? `/data/posts/${encodeURIComponent(slug)}.json` : "";
}

async function loadPostDetail(metadataPost) {
  if (!metadataPost?.slug) return metadataPost;
  const detailPath = articlePostDataPath(metadataPost);
  if (!detailPath) return metadataPost;

  try {
    const response = await fetch(detailPath, { cache: "force-cache" });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const detail = await response.json();
    return {
      ...metadataPost,
      ...detail,
      gallery: Array.isArray(detail.gallery) ? detail.gallery : metadataPost.gallery || [],
      cached: {
        ...(metadataPost.cached || {}),
        ...(detail.cached || {}),
        contentPath: detailPath,
      },
    };
  } catch (error) {
    console.warn(`文章详情数据加载失败：${metadataPost.slug}`, error);
    return metadataPost;
  }
}

function byId(id) {
  return document.getElementById(id);
}

function escapeHtml(value) {
  return String(value || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function escapeAttribute(value) {
  return escapeHtml(value).replaceAll("`", "&#96;");
}

function clampText(value, maxLength = 120) {
  const source = String(value || "").trim();
  if (source.length <= maxLength) return source;
  return `${source.slice(0, maxLength).trim()}…`;
}

function absoluteSiteUrl(path = "/") {
  const source = String(path || "/").trim() || "/";
  try {
    return new URL(source, "https://hiloki.ai").href;
  } catch {
    return "https://hiloki.ai/";
  }
}

function setMetaContent(selector, attributeName, attributeValue, content) {
  if (!content) return;
  let meta = document.querySelector(selector);
  if (!meta) {
    meta = document.createElement("meta");
    meta.setAttribute(attributeName, attributeValue);
    document.head.appendChild(meta);
  }
  meta.setAttribute("content", content);
}

function setMetaProperty(property, content) {
  setMetaContent(`meta[property="${property}"]`, "property", property, content);
}

function setMetaName(name, content) {
  setMetaContent(`meta[name="${name}"]`, "name", name, content);
}

function setPageDescription(description) {
  setMetaName("description", description);
}

function updateArticleShareMeta(post) {
  const title = `${post.title} | HiLoki.ai`;
  const description = clampText(post.summary || post.excerpt || "HiLoki.ai 的文章与长期创作记录。", 150);
  const rawImage = post.image || post.cover || "";
  const shareImage = rawImage && !rawImage.includes("article-fallback.svg") ? rawImage : "/assets/images/share-cover.png";
  const image = absoluteSiteUrl(shareImage);
  const url = absoluteSiteUrl(`/article?slug=${encodeURIComponent(post.slug)}`);

  setPageDescription(description);
  setMetaProperty("og:title", title);
  setMetaProperty("og:description", description);
  setMetaProperty("og:image", image);
  setMetaProperty("og:url", url);
  setMetaProperty("og:type", "article");
  setMetaProperty("og:site_name", "HiLoki.ai");
  setMetaName("twitter:card", "summary_large_image");
  setMetaName("twitter:title", title);
  setMetaName("twitter:description", description);
  setMetaName("twitter:image", image);
}

function createArticleHref(post, context = {}) {
  const params = new URLSearchParams();
  params.set("slug", post.slug);
  if (context.category && context.category !== "全部") params.set("category", context.category);
  if (context.page && Number(context.page) > 1) params.set("page", String(context.page));
  if (context.from) params.set("from", context.from);
  return `/article?${params.toString()}`;
}

function articleHref(post, context = {}) {
  return createArticleHref(post, context);
}

function backToArchiveHref(category = "全部", page = 1) {
  const params = new URLSearchParams();
  if (category && category !== "全部") params.set("category", category);
  if (Number(page) > 1) params.set("page", String(page));
  const query = params.toString();
  return `/articles${query ? `?${query}` : ""}`;
}

function getPageQueryInt(name, fallback = 1) {
  const params = new URLSearchParams(window.location.search);
  const value = Number(params.get(name) || fallback);
  return Number.isFinite(value) && value > 0 ? Math.floor(value) : fallback;
}

function updateQueryParams(next = {}) {
  const params = new URLSearchParams(window.location.search);
  Object.entries(next).forEach(([key, value]) => {
    if (value === "" || value === null || value === undefined || value === false) {
      params.delete(key);
      return;
    }
    params.set(key, String(value));
  });
  const query = params.toString();
  window.history.replaceState({}, "", `${window.location.pathname}${query ? `?${query}` : ""}`);
}

function formatDisplayDate(value, fallback) {
  const source = String(value || "").trim();
  if (!source) return fallback || "";
  const match = source.match(/\d{4}-\d{2}-\d{2}/);
  return match ? match[0] : source;
}

function dateRank(value) {
  const display = formatDisplayDate(value, "");
  const stamp = Date.parse(display);
  return Number.isNaN(stamp) ? 0 : stamp;
}

function renderGalleryRailMarkup(images, title, lightboxGroup = "", compact = false) {
  if (!(images || []).length) return "";
  return `
    <div class="article-gallery-flow ${compact ? "article-gallery-flow-compact" : ""}">
      <div class="section-heading section-heading-tight article-gallery-flow-heading">
        <div>
          <p class="section-kicker">Gallery</p>
          <h2>图片全览</h2>
        </div>
      </div>
      <div class="article-gallery-rail-shell">
        <button type="button" class="gallery-rail-button" data-gallery-step="-1" aria-label="上一张">‹</button>
        <div class="article-gallery-rail" data-gallery-rail="true">
          ${images
            .map(
              (imagePath, index) => `
                <button type="button" class="article-gallery-card ${index === 0 ? "is-active" : ""}" data-gallery-index="${index}">
                  <img src="${escapeHtml(imagePath)}" alt="${escapeHtml(title)}" loading="lazy" data-lightboxable="true" ${lightboxGroup ? `data-lightbox-group="${escapeHtml(lightboxGroup)}"` : ""} />
                </button>
              `
            )
            .join("")}
        </div>
        <button type="button" class="gallery-rail-button" data-gallery-step="1" aria-label="下一张">›</button>
      </div>
    </div>
  `;
}

function categoryHref(label) {
  return `/articles?category=${encodeURIComponent(label)}`;
}

function renderArchiveListItemV3(post, context = {}) {
  const metaDate = formatDisplayDate(post.publishDate, `#${post.id}`);
  return `
    <a class="luxe-archive-card" href="${articleHref(post, context)}">
      <div class="luxe-cover-stage luxe-cover-stage-wide" style="${post.image ? `--cover:url('${escapeAttribute(post.image)}')` : ""}">
        ${
          post.image
            ? `<img src="${escapeHtml(post.image)}" alt="${escapeHtml(post.title)}" loading="lazy" />`
            : `<div class="media-placeholder media-placeholder-large"><strong>${escapeHtml(post.category)}</strong><span>${escapeHtml(post.title)}</span></div>`
        }
      </div>
      <div class="luxe-archive-copy">
        <div class="luxe-chip-row">
          <span class="luxe-chip">${escapeHtml(post.category)} · ${escapeHtml(metaDate)}</span>
          <span class="luxe-chip">${escapeHtml(post.cached?.available ? "站内全文" : "外链文章")}</span>
        </div>
        <h3>${escapeHtml(post.title)}</h3>
        <p>${escapeHtml(clampText(post.summary, 116))}</p>
        <div class="luxe-archive-actions">
          <span class="luxe-chip">21:9 封面完整展示</span>
          <span class="luxe-archive-link">阅读全文</span>
        </div>
      </div>
    </a>
  `;
}

function renderArchivePage() {
  const root = byId("app-root");
  if (!root) return;

  root.innerHTML = `
    <section class="luxe-section luxe-archive-top">
      <div class="luxe-section-head">
        <div>
          <span class="luxe-eyebrow">Articles</span>
          <h1>全部文章</h1>
          <p>按主题筛选、搜索关键词，或者从最新更新开始浏览。</p>
        </div>
      </div>
      <div class="luxe-search-row">
        <div id="archive-categories" class="luxe-filter-row"></div>
        <div class="luxe-search-shell">
          <label class="sr-only" for="archive-search">搜索标题或分类</label>
          <input id="archive-search" class="luxe-search-input" type="search" placeholder="搜索标题或分类" />
        </div>
      </div>
      <p id="archive-result-count" class="luxe-result-copy"></p>
    </section>

    <section class="luxe-archive-layout">
      <div id="archive-list" class="luxe-archive-grid"></div>

      <aside class="luxe-archive-note">
        <span class="luxe-eyebrow">Browse</span>
        <h3>你可以这样看</h3>
        <ol class="luxe-path-list">
          <li>想快速了解我，可以先看最新更新和 AI 观察。</li>
          <li>想找工具与方法，可以直接筛选效率方法或模型测评。</li>
          <li>想看视觉方向内容，可以进入图像生成栏目。</li>
        </ol>
        <div class="luxe-archive-note-actions">
          <a class="luxe-button luxe-button-primary" href="/">返回首页</a>
          <a class="luxe-button luxe-button-secondary" href="/#rehearsal">查看公开产品</a>
        </div>
      </aside>
    </section>

    <section class="luxe-section">
      <div id="archive-pagination" class="luxe-pagination-bar"></div>
    </section>
  `;

  const input = byId("archive-search");
  const list = byId("archive-list");
  const categoriesWrap = byId("archive-categories");
  const resultCount = byId("archive-result-count");
  const pagination = byId("archive-pagination");
  const categories = ["全部", ...(siteData.stats?.categories || []).map((item) => item.label)];
  const queryParams = new URLSearchParams(window.location.search);
  const pageSize = 10;

  let activeCategory = queryParams.get("category") || "全部";
  if (!categories.includes(activeCategory)) activeCategory = "全部";
  let activePage = getPageQueryInt("page", 1);

  function currentPosts() {
    const query = (input?.value || "").trim().toLowerCase();
    return (siteData.posts || []).filter((post) => {
      const categoryMatch = activeCategory === "全部" || post.category === activeCategory;
      if (!categoryMatch) return false;
      if (!query) return true;
      return [post.title, post.category, post.slug].join(" ").toLowerCase().includes(query);
    });
  }

  function renderFilters() {
    if (!categoriesWrap) return;
    categoriesWrap.innerHTML = categories
      .map(
        (label) => `
          <button class="luxe-filter-chip ${label === activeCategory ? "is-active" : ""}" type="button" data-category="${escapeHtml(label)}">
            ${escapeHtml(label)}
          </button>
        `
      )
      .join("");

    categoriesWrap.querySelectorAll("[data-category]").forEach((button) => {
      button.addEventListener("click", () => {
        activeCategory = button.dataset.category || "全部";
        activePage = 1;
        updateQueryParams({
          category: activeCategory === "全部" ? "" : activeCategory,
          page: "",
        });
        renderFilters();
        renderList();
      });
    });
  }

  function buildPaginationTokens(totalPages) {
    if (totalPages <= 5) return Array.from({ length: totalPages }, (_, index) => index + 1);
    if (activePage <= 3) return [1, 2, 3, "…", totalPages];
    if (activePage >= totalPages - 2) return [1, "…", totalPages - 2, totalPages - 1, totalPages];
    return [1, "…", activePage - 1, activePage, activePage + 1, "…", totalPages];
  }

  function renderPagination(totalPages) {
    if (!pagination) return;
    if (totalPages <= 1) {
      pagination.innerHTML = "";
      return;
    }

    const tokens = buildPaginationTokens(totalPages);
    pagination.innerHTML = `
      <div class="luxe-pagination-copy">继续翻页，查看更多文章。</div>
      <div class="luxe-pagination-links">
        <button type="button" class="luxe-page-link" data-page-action="first" ${activePage <= 1 ? "disabled" : ""}>首页</button>
        <button type="button" class="luxe-page-link" data-page-action="prev" ${activePage <= 1 ? "disabled" : ""}>上一页</button>
        ${tokens
          .map((token) =>
            token === "…"
              ? `<span class="luxe-page-link luxe-page-ellipsis">…</span>`
              : `<button type="button" class="luxe-page-link ${token === activePage ? "is-active" : ""}" data-page-number="${token}">${token}</button>`
          )
          .join("")}
        <button type="button" class="luxe-page-link" data-page-action="next" ${activePage >= totalPages ? "disabled" : ""}>下一页</button>
        <button type="button" class="luxe-page-link" data-page-action="last" ${activePage >= totalPages ? "disabled" : ""}>尾页</button>
      </div>
    `;

    pagination.querySelectorAll("[data-page-action]").forEach((button) => {
      button.addEventListener("click", () => {
        const direction = button.dataset.pageAction;
        if (direction === "first") activePage = 1;
        if (direction === "last") activePage = totalPages;
        if (direction === "prev") activePage -= 1;
        if (direction === "next") activePage += 1;
        activePage = Math.max(1, Math.min(totalPages, activePage));
        updateQueryParams({
          category: activeCategory === "全部" ? "" : activeCategory,
          page: activePage > 1 ? activePage : "",
        });
        renderList();
      });
    });

    pagination.querySelectorAll("[data-page-number]").forEach((button) => {
      button.addEventListener("click", () => {
        activePage = Number(button.dataset.pageNumber || activePage);
        updateQueryParams({
          category: activeCategory === "全部" ? "" : activeCategory,
          page: activePage > 1 ? activePage : "",
        });
        renderList();
      });
    });
  }

  function renderList() {
    const posts = currentPosts();
    const totalPages = Math.max(1, Math.ceil(posts.length / pageSize));
    activePage = Math.min(activePage, totalPages);
    const start = (activePage - 1) * pageSize;
    const pagePosts = posts.slice(start, start + pageSize);
    if (list) {
      list.innerHTML = posts.length
        ? pagePosts.map((post) => renderArchiveListItemV3(post, { category: activeCategory, page: activePage, from: "archive" })).join("")
        : `<div class="empty-state">没有匹配结果，换个关键词试试。</div>`;
    }
    if (resultCount) {
      resultCount.textContent = posts.length
        ? `当前第 ${activePage} / ${totalPages} 页，共 ${posts.length} 篇内容。`
        : "没有匹配结果。";
    }
    renderPagination(totalPages);
    queueMicrotask(syncScrollBambooProgress);
  }

  input?.addEventListener("input", () => {
    activePage = 1;
    updateQueryParams({
      category: activeCategory === "全部" ? "" : activeCategory,
      page: "",
    });
    renderList();
  });

  renderFilters();
  renderList();
}

async function renderArticlePage() {
  const root = byId("app-root");
  if (!root) return;

  const params = new URLSearchParams(window.location.search);
  const slug = params.get("slug");
  const activeCategory = params.get("category") || "全部";
  const currentPage = getPageQueryInt("page", 1);
  const metadataPost = (siteData.posts || []).find((item) => item.slug === slug);

  if (!metadataPost) {
    root.innerHTML = `
      <section class="luxe-section">
        <div class="empty-state">
          没找到这篇文章。可以先回 <a class="text-link" href="/articles">文章归档</a> 看其他内容。
        </div>
      </section>
    `;
    return;
  }

  const post = await loadPostDetail(metadataPost);
  document.title = `${post.title} | HiLoki.ai`;
  updateArticleShareMeta(post);
  const scopedPosts = (siteData.posts || []).filter((item) => activeCategory === "全部" || item.category === activeCategory);
  const currentIndex = scopedPosts.findIndex((item) => item.slug === post.slug);
  const previousPost = currentIndex >= 0 ? scopedPosts[currentIndex - 1] || null : null;
  const nextPost = currentIndex >= 0 ? scopedPosts[currentIndex + 1] || null : null;
  const related = (siteData.posts || [])
    .filter((item) => item.slug !== post.slug && item.category === post.category)
    .slice(0, 3);
  const lightboxGroup = `article-${post.slug}`;
  const galleryItems = post.gallery || [];
  const cachedHtml = post.cached?.html || "";
  const showGalleryRail = post.displayMode === "image-gallery" ? galleryItems.length > 1 : !post.cached?.available && galleryItems.length > 1;

  root.innerHTML = `
    <section class="luxe-article-hero">
      <article class="luxe-section luxe-article-cover-card">
        <div class="luxe-cover-stage luxe-cover-stage-wide" style="${post.image ? `--cover:url('${escapeAttribute(post.image)}')` : ""}" id="article-cover">
          ${
            post.image
              ? `<img src="${escapeHtml(post.image)}" alt="${escapeHtml(post.title)}" loading="eager" data-lightboxable="true" data-lightbox-group="${escapeHtml(lightboxGroup)}" />`
              : `<div class="media-placeholder media-placeholder-large"><strong>${escapeHtml(post.category)}</strong><span>${escapeHtml(post.title)}</span></div>`
          }
        </div>
      </article>

      <article class="luxe-section luxe-article-intro-card">
        <div class="luxe-article-intro-main">
          <span class="luxe-eyebrow">Article</span>
          <h1 class="luxe-article-title">${escapeHtml(post.title)}</h1>
          <p class="luxe-article-deck">${escapeHtml(post.summary)}</p>
        </div>
        <div class="luxe-article-intro-side">
          <div class="luxe-chip-row">
            <a class="luxe-chip" href="${categoryHref(post.category)}">${escapeHtml(post.category)}</a>
            <span class="luxe-chip">${escapeHtml(formatDisplayDate(post.publishDate, ""))}</span>
            <span class="luxe-chip">${escapeHtml(post.cached?.available ? "站内全文" : "外链原文")}</span>
          </div>
          <div class="luxe-button-row">
            <a class="luxe-button luxe-button-primary" href="${backToArchiveHref(activeCategory, currentPage)}">返回文章列表</a>
            <a class="luxe-button luxe-button-secondary" href="/">返回首页</a>
          </div>
          <div class="luxe-article-jump-row">
            <a class="luxe-button luxe-button-secondary" href="${categoryHref(post.category)}">更多 ${escapeHtml(post.category)}</a>
            ${
              post.url
                ? `<a class="luxe-button luxe-button-secondary" href="${escapeHtml(post.url)}" target="_blank" rel="noopener noreferrer">公众号原文</a>`
                : `<a class="luxe-button luxe-button-secondary" href="/articles">全部文章</a>`
            }
          </div>
        </div>
      </article>
    </section>

    ${showGalleryRail ? `<section class="luxe-section">${renderGalleryRailMarkup(galleryItems, post.title, lightboxGroup)}</section>` : ""}

    <section class="luxe-article-layout">
      <div class="luxe-article-body">
        <article class="cached-article-shell article-body-shell luxe-cached-shell">
          ${
            post.cached?.available
              ? `<div id="cached-article-content" class="cached-article-content" data-content-path="${escapeHtml(post.cached.contentPath)}" data-gallery='${escapeAttribute(JSON.stringify(galleryItems))}' data-title="${escapeAttribute(post.title)}"></div>`
              : galleryItems.length
                ? `<div class="article-inline-gallery article-inline-gallery-standalone">
                    ${galleryItems
                      .map(
                        (imagePath) => `
                          <figure class="gallery-item gallery-item-free">
                            <img src="${escapeHtml(imagePath)}" alt="${escapeHtml(post.title)}" loading="lazy" data-lightboxable="true" data-lightbox-group="${escapeHtml(lightboxGroup)}" />
                          </figure>
                        `
                      )
                      .join("")}
                  </div>`
                : `<div class="empty-state">这篇内容目前只恢复到基础信息，正文和图片还在继续补。</div>`
          }
        </article>
      </div>

      <aside class="luxe-article-sidecol">
        <article class="luxe-article-sidecard">
          <span class="luxe-eyebrow">Info</span>
          <h3>阅读说明</h3>
          <p>${escapeHtml(post.cached?.available ? "这篇文章支持站内阅读全文，也可以继续浏览同栏目内容。" : "这篇文章目前展示封面与摘要，如需完整内容可打开原始链接。")}</p>
        </article>

        <article class="luxe-article-sidecard">
          <span class="luxe-eyebrow">Related</span>
          <h3>同类文章</h3>
          <div class="luxe-related-list">
            ${
              related.length
                ? related
                    .map(
                      (item) => `
                        <a class="luxe-related-card" href="${articleHref(item, { category: activeCategory, page: currentPage, from: "archive" })}">
                          <div class="luxe-chip-row"><span class="luxe-chip">${escapeHtml(item.category)} · ${escapeHtml(formatDisplayDate(item.publishDate, ""))}</span></div>
                          <h3>${escapeHtml(item.title)}</h3>
                          <p>${escapeHtml(clampText(item.summary, 74))}</p>
                        </a>
                      `
                    )
                    .join("")
                : `<div class="empty-state">暂时没有更多同类文章。</div>`
            }
          </div>
        </article>
      </aside>
    </section>

    <section class="luxe-section">
      <div class="luxe-pagination-bar">
        <div class="luxe-pagination-copy">看完这篇之后，你也可以回到栏目页，或者继续读上一篇 / 下一篇。</div>
        <div class="luxe-pagination-links">
          <a class="luxe-page-link" href="/">首页</a>
          <a class="luxe-page-link" href="${categoryHref(post.category)}">同类文章</a>
          ${
            previousPost
              ? `<a class="luxe-page-link" href="${articleHref(previousPost, { category: activeCategory, page: currentPage, from: "archive" })}">上一篇</a>`
              : `<span class="luxe-page-link luxe-page-ellipsis">上一篇</span>`
          }
          ${
            nextPost
              ? `<a class="luxe-page-link" href="${articleHref(nextPost, { category: activeCategory, page: currentPage, from: "archive" })}">下一篇</a>`
              : `<span class="luxe-page-link luxe-page-ellipsis">下一篇</span>`
          }
        </div>
      </div>
    </section>
  `;

  const cachedContent = byId("cached-article-content");
  if (cachedContent) {
    const renderCachedHtml = (html) => {
      cachedContent.innerHTML = html
        ? normalizeCachedArticleHtml(html, cachedContent.dataset.contentPath || "", post.title, {
            removeInlineImages: post.displayMode === "image-gallery",
            convertImageRuns: post.displayMode !== "image-gallery",
            lightboxGroup,
          })
        : `<div class="empty-state">缓存文件读取失败，你仍然可以查看公众号原文。</div>`;
      if (!showGalleryRail) appendSupplementalGallery(cachedContent, galleryItems, post.title, lightboxGroup);
      initArticleGalleryRail();
      queueMicrotask(syncScrollBambooProgress);
    };

    if (cachedHtml) {
      renderCachedHtml(cachedHtml);
    } else if (cachedContent.dataset.contentPath) {
      fetch(cachedContent.dataset.contentPath)
        .then((response) => (response.ok ? response.json() : null))
        .then((detail) => renderCachedHtml(detail?.cached?.html || ""))
        .catch(() => {
          cachedContent.innerHTML = `<div class="empty-state">缓存文件读取失败，你仍然可以查看公众号原文。</div>`;
          queueMicrotask(syncScrollBambooProgress);
        });
    }
  }

  queueMicrotask(syncScrollBambooProgress);
}

function normalizeCachedArticleHtml(html, contentPath, title = "", options = {}) {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, "text/html");
  const removableSelectors = [
    "script",
    "style",
    "link",
    "meta",
    ".reward_area",
    ".reward_dialog",
    ".reward_list_dialog",
    ".reward_pop_panel",
    ".wx_bottom_modal_wrp",
    ".author_profile-articles",
    ".author_profile-pay_area",
    ".author_profile-info",
    "[style*='display: none']",
  ];

  removableSelectors.forEach((selector) => {
    doc.querySelectorAll(selector).forEach((node) => node.remove());
  });

  const contentRoot =
    doc.querySelector("#js_content") ||
    doc.querySelector("#js_image_content") ||
    doc.querySelector(".rich_media_content") ||
    doc.body;

  const wrapper = document.createElement("div");
  wrapper.innerHTML = contentRoot?.innerHTML || html;
  const baseDir = (contentPath || "").split("/").slice(0, -1).join("/");

  wrapper.querySelectorAll("mp-common-sticker").forEach((node) => {
    const gifSource =
      node.getAttribute("data-emoji_url") ||
      node.getAttribute("data-cdn_url") ||
      node.getAttribute("data-src") ||
      "";
    if (!gifSource) {
      node.remove();
      return;
    }

    const image = document.createElement("img");
    image.setAttribute("src", gifSource);
    image.setAttribute("alt", title || "GIF");
    image.setAttribute("loading", "lazy");
    image.setAttribute("data-lightboxable", "true");
    if (options.lightboxGroup) {
      image.setAttribute("data-lightbox-group", options.lightboxGroup);
    }
    image.className = "article-inline-image article-inline-gif";

    const figure = document.createElement("figure");
    figure.className = "article-inline-gif-shell";
    figure.appendChild(image);
    node.replaceWith(figure);
  });

  wrapper.querySelectorAll("*").forEach((node) => {
    if (node.tagName !== "IMG") {
      node.removeAttribute("style");
    }
    node.removeAttribute("width");
    node.removeAttribute("height");
    if (node.tagName === "IMG") {
      const rawSrc = node.getAttribute("src") || "";
      const rawDataSrc = node.getAttribute("data-src") || "";
      // 微信文章图片：src 是 base64 SVG 占位符，真实图片在 data-src
      const isPlaceholder = rawSrc.startsWith("data:");
      const originalSource = (!isPlaceholder && rawSrc) || rawDataSrc || rawSrc;
      const src = originalSource;
      const normalizedSource = /^\/\//.test(src)
        ? `https:${src}`
        : /^https?:|^data:/i.test(src)
          ? src
          : src
            ? `${baseDir}/${src.replace(/^\.\//, "")}`
            : "";
      if (normalizedSource) node.setAttribute("src", normalizedSource);
      node.setAttribute("loading", "lazy");
      node.setAttribute("data-lightboxable", "true");
      if (options.lightboxGroup) {
        node.setAttribute("data-lightbox-group", options.lightboxGroup);
      }
      node.classList.add("article-inline-image");
      node.removeAttribute("style");
      node.removeAttribute("data-src");
    }
    if (node.tagName === "A") {
      const href = node.getAttribute("href") || "";
      if (href && !/^https?:|^#|^javascript:/i.test(href)) {
        node.setAttribute("href", `${baseDir}/${href.replace(/^\.\//, "")}`);
      }
      if (/^https?:\/\//i.test(href)) {
        node.setAttribute("target", "_blank");
        node.setAttribute("rel", "noopener noreferrer");
      }
    }
  });

  wrapper.querySelectorAll("h1.rich_media_title, #activity-name").forEach((node) => node.remove());
  wrapper.querySelectorAll("p, section, div").forEach((node) => {
    const text = (node.textContent || "").replace(/\s+/g, "").trim();
    if (!text && !node.querySelector("img, video, iframe")) {
      node.remove();
    }
  });

  const inlineImages = [...wrapper.querySelectorAll("img")];
  if (options.removeInlineImages) {
    inlineImages.forEach((img) => {
      const holder = img.closest("section, figure, p, div");
      if (holder && holder !== wrapper) {
        holder.remove();
      } else {
        img.remove();
      }
    });
  }

  wrapper.querySelectorAll("section, div, p").forEach((node) => {
    const text = (node.textContent || "").replace(/\s+/g, "").trim();
    if (!text && !node.querySelector("img, video, iframe, a")) {
      node.remove();
    }
  });

  if (options.convertImageRuns !== false) {
    transformContinuousImageRuns(wrapper, title, options.lightboxGroup || "");
  }

  if (title && !wrapper.querySelector("p, h2, h3, img")) {
    return `<p>${escapeHtml(title)}</p>`;
  }

  return wrapper.innerHTML;
}

function extractNodeTextWithoutMedia(node) {
  const clone = node.cloneNode(true);
  clone.querySelectorAll("img, video, iframe, br").forEach((child) => child.remove());
  return (clone.textContent || "").replace(/\s+/g, "").trim();
}

function collectNodeImages(node) {
  return [...node.querySelectorAll("img")]
    .map((img) => img.getAttribute("src") || "")
    .filter(Boolean);
}

function isContinuousImageBlock(node) {
  if (!(node instanceof Element)) return false;
  const images = collectNodeImages(node);
  if (!images.length) return false;
  return extractNodeTextWithoutMedia(node) === "";
}

function dedupeImageList(items) {
  const seen = new Set();
  return items.filter((item) => {
    const key = item.split("?")[0];
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function transformContinuousImageRuns(wrapper, title, lightboxGroup = "") {
  const children = [...wrapper.children];
  let index = 0;

  while (index < children.length) {
    const current = children[index];
    if (!isContinuousImageBlock(current)) {
      index += 1;
      continue;
    }

    let tail = index;
    while (tail < children.length && isContinuousImageBlock(children[tail])) {
      tail += 1;
    }

    const run = children.slice(index, tail);
    if (run.length >= 4) {
      const images = dedupeImageList(run.flatMap((node) => collectNodeImages(node)));
      if (images.length) {
        const section = document.createElement("section");
        section.className = "article-gallery-inline-section";
        section.innerHTML = renderGalleryRailMarkup(images, title, lightboxGroup, true);
        run[0].before(section);
        run.forEach((node) => node.remove());
      }
    }

    index = tail;
  }
}

function appendSupplementalGallery(container, galleryItems, title, lightboxGroup = "") {
  if (!container || !galleryItems?.length) return;
  const existing = new Set(
    [...container.querySelectorAll("img")]
      .map((img) => img.getAttribute("src") || "")
      .filter(Boolean)
      .map((src) => src.split("?")[0])
  );

  const extras = galleryItems.filter((src) => !existing.has(src.split("?")[0]));
  if (!extras.length) return;

  const gallery = document.createElement("div");
  gallery.className = "article-inline-gallery";
  gallery.innerHTML = extras
    .map(
      (imagePath) => `
        <figure class="gallery-item gallery-item-free">
          <img src="${escapeHtml(imagePath)}" alt="${escapeHtml(title)}" loading="lazy" data-lightboxable="true" ${lightboxGroup ? `data-lightbox-group="${escapeHtml(lightboxGroup)}"` : ""} />
        </figure>
      `
    )
    .join("");
  container.appendChild(gallery);
}

function ensureLightbox() {
  if (document.querySelector(".media-lightbox")) return;
  const lightbox = document.createElement("div");
  lightbox.className = "media-lightbox";
  lightbox.innerHTML = `
    <button type="button" class="media-lightbox-close" aria-label="关闭预览">关闭</button>
    <button type="button" class="media-lightbox-nav media-lightbox-prev" aria-label="上一张">‹</button>
    <button type="button" class="media-lightbox-nav media-lightbox-next" aria-label="下一张">›</button>
    <div class="media-lightbox-stage">
      <img class="media-lightbox-image" alt="" />
    </div>
  `;
  document.body.appendChild(lightbox);
}

const lightboxState = {
  items: [],
  index: 0,
  group: "",
};

function collectLightboxItems(group = "") {
  return [...document.querySelectorAll("[data-lightboxable='true']")]
    .filter((node) => node instanceof HTMLImageElement)
    .filter((node) => {
      const nodeGroup = node.getAttribute("data-lightbox-group") || "";
      return group ? nodeGroup === group : true;
    })
    .map((node) => ({ src: node.currentSrc || node.src, alt: node.alt || "" }));
}

function openLightbox(src, alt = "", group = "") {
  const lightbox = document.querySelector(".media-lightbox");
  if (!lightbox) return;
  const image = lightbox.querySelector(".media-lightbox-image");
  if (!image) return;
  lightboxState.group = group;
  lightboxState.items = collectLightboxItems(group);
  lightboxState.index = Math.max(0, lightboxState.items.findIndex((item) => item.src === src));
  image.setAttribute("src", src);
  image.setAttribute("alt", alt);
  image.style.width = "auto";
  image.style.height = "auto";
  lightbox.classList.add("is-open");
  lightbox.classList.toggle("is-single", lightboxState.items.length <= 1);
  document.body.classList.add("has-lightbox-open");
}

function closeLightbox() {
  const lightbox = document.querySelector(".media-lightbox");
  if (!lightbox) return;
  lightbox.classList.remove("is-open");
  lightbox.classList.remove("is-single");
  document.body.classList.remove("has-lightbox-open");
}

function stepLightbox(direction = 1) {
  if (!lightboxState.items.length) return;
  lightboxState.index = (lightboxState.index + direction + lightboxState.items.length) % lightboxState.items.length;
  const current = lightboxState.items[lightboxState.index];
  const image = document.querySelector(".media-lightbox-image");
  if (!image || !current) return;
  image.setAttribute("src", current.src);
  image.setAttribute("alt", current.alt || "");
}

function initLightbox() {
  ensureLightbox();
  document.addEventListener("click", (event) => {
    const target = event.target;
    const image = target instanceof Element ? target.closest("[data-lightboxable='true']") : null;
    if (image instanceof HTMLImageElement) {
      event.preventDefault();
      openLightbox(image.currentSrc || image.src, image.alt || "", image.getAttribute("data-lightbox-group") || "");
      return;
    }

    if (target instanceof Element && target.closest(".media-lightbox-prev")) {
      stepLightbox(-1);
      return;
    }

    if (target instanceof Element && target.closest(".media-lightbox-next")) {
      stepLightbox(1);
      return;
    }

    if (
      target instanceof Element &&
      (target.closest(".media-lightbox-close") ||
        (target.closest(".media-lightbox") && !target.closest(".media-lightbox-image") && !target.closest(".media-lightbox-nav")))
    ) {
      closeLightbox();
    }
  });

  window.addEventListener("keydown", (event) => {
    if (event.key === "Escape") closeLightbox();
    if (event.key === "ArrowLeft") stepLightbox(-1);
    if (event.key === "ArrowRight") stepLightbox(1);
  });
}

function initArticleGalleryRail() {
  document.querySelectorAll(".article-gallery-rail-shell").forEach((shell) => {
    const rail = shell.querySelector("[data-gallery-rail='true'], .article-gallery-rail");
    if (!(rail instanceof HTMLElement) || rail.dataset.galleryBound === "true") return;
    rail.dataset.galleryBound = "true";

    shell.querySelectorAll("[data-gallery-index]").forEach((button) => {
      button.addEventListener("click", () => {
        const index = Number(button.getAttribute("data-gallery-index") || 0);
        const target = rail.querySelector(`[data-gallery-index="${index}"]`);
        target?.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
        rail.querySelectorAll(".article-gallery-card").forEach((card) => card.classList.toggle("is-active", card === target));
      });
    });

    shell.querySelectorAll("[data-gallery-step]").forEach((button) => {
      button.addEventListener("click", () => {
        const cards = [...rail.querySelectorAll(".article-gallery-card")];
        const currentIndex = Math.max(0, cards.findIndex((card) => card.classList.contains("is-active")));
        const nextIndex = Math.min(cards.length - 1, Math.max(0, currentIndex + Number(button.getAttribute("data-gallery-step") || 0)));
        const next = cards[nextIndex];
        if (!next) return;
        cards.forEach((card) => card.classList.toggle("is-active", card === next));
        next.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
      });
    });
  });
}

function ensureThemeToggle() {
  const header = document.querySelector(".site-header");
  if (!header || header.querySelector(".theme-toggle")) return;

  const toggle = document.createElement("div");
  toggle.className = "theme-toggle";
  toggle.innerHTML = `
    <button type="button" class="theme-toggle-button theme-toggle-button-single" data-theme-toggle aria-label="切换昼夜主题">
      <span class="sr-only">切换昼夜主题</span>
      <span class="theme-toggle-track" aria-hidden="true">
        <span class="theme-toggle-orb"></span>
      </span>
    </button>
  `;
  header.appendChild(toggle);
}

function normalizeArticleTheme(theme) {
  if (theme === "backstage") return "dark";
  if (theme === "showtime") return "light";
  return theme === "dark" ? "dark" : "light";
}

function articleVenueTheme(theme) {
  return normalizeArticleTheme(theme) === "dark" ? "backstage" : "showtime";
}

function applyTheme(theme) {
  const nextTheme = normalizeArticleTheme(theme);
  const venueTheme = articleVenueTheme(nextTheme);
  document.body.dataset.theme = nextTheme;
  document.body.dataset.venueTheme = venueTheme;
  try {
    window.localStorage.setItem("hiloki-theme", nextTheme);
    window.localStorage.setItem("hiloki-venue-theme", venueTheme);
  } catch {}

  const toggle = document.querySelector("[data-theme-toggle]");
  if (toggle) {
    toggle.classList.toggle("is-dark", nextTheme === "dark");
    toggle.setAttribute("aria-label", "切换昼夜主题");
    toggle.setAttribute("title", "昼夜主题");
  }
}

function initTheme() {
  ensureThemeToggle();
  let savedTheme = "light";
  try {
    savedTheme =
      window.localStorage.getItem("hiloki-venue-theme") ||
      window.localStorage.getItem("hiloki-theme") ||
      "light";
  } catch {}
  applyTheme(savedTheme);

  document.querySelector("[data-theme-toggle]")?.addEventListener("click", () => {
    applyTheme(document.body.dataset.theme === "dark" ? "showtime" : "backstage");
  });
}

function initSurfaceMotion() {
  document.documentElement.style.setProperty("--pointer-x", "50%");
  document.documentElement.style.setProperty("--pointer-y", "30%");
  window.addEventListener("pointermove", (event) => {
    document.documentElement.style.setProperty("--pointer-x", `${event.clientX}px`);
    document.documentElement.style.setProperty("--pointer-y", `${event.clientY}px`);
  });
}

function initScrollState() {
  const syncState = () => {
    document.body.classList.toggle("is-scrolled", window.scrollY > 24);
  };
  syncState();
  window.addEventListener("scroll", syncState, { passive: true });
}

function ensureScrollBamboo() {
  if (document.querySelector(".scroll-bamboo")) return;
  const shell = document.createElement("div");
  shell.className = "scroll-bamboo";
  shell.innerHTML = `
    <div class="scroll-bamboo-track">
      <span class="scroll-bamboo-fill"></span>
    </div>
  `;
  document.body.appendChild(shell);
}

function syncScrollBambooProgress() {
  const shell = document.querySelector(".scroll-bamboo");
  if (!(shell instanceof HTMLElement)) return;
  const fill = shell.querySelector(".scroll-bamboo-fill");
  if (!(fill instanceof HTMLElement)) return;
  const doc = document.documentElement;
  const scrollable = Math.max(0, doc.scrollHeight - window.innerHeight);
  const ratio = scrollable > 0 ? window.scrollY / scrollable : 0;
  const percent = Math.max(6, Math.min(100, Math.round(ratio * 100)));
  fill.style.height = `${percent}%`;
  shell.classList.toggle("is-hidden", scrollable < 120);
}

function initScrollBamboo() {
  ensureScrollBamboo();
  syncScrollBambooProgress();
  window.addEventListener("scroll", syncScrollBambooProgress, { passive: true });
  window.addEventListener("resize", syncScrollBambooProgress, { passive: true });
}

function init() {
  initSurfaceMotion();
  initScrollState();
  initScrollBamboo();
  initTheme();
  initLightbox();
  const page = document.body.dataset.page;
  if (page === "archive") {
    renderArchivePage();
    queueMicrotask(syncScrollBambooProgress);
    return;
  }
  if (page === "article") {
    renderArticlePage();
    initArticleGalleryRail();
    queueMicrotask(syncScrollBambooProgress);
    return;
  }
}

init();

// ── hiloki analytics ──────────────────────────────────────────────────────────
(function() {
  const ANALYTICS_URL = "https://analytics.hiloki.ai";
  if (window.location.hostname !== "hiloki.ai") return;

  // 埋点：上报本次访问
  function track() {
    try {
      fetch(ANALYTICS_URL + "/track", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          path: location.pathname + location.hash,
          referer: document.referrer || "",
        }),
        keepalive: true,
      }).catch(() => {});
    } catch(e) {}
  }

  // 读取统计数据并更新首页计数器
  function loadStats() {
    fetch(ANALYTICS_URL + "/stats")
      .then(r => r.json())
      .then(data => {
        const todayEl = document.getElementById("stat-today-pv");
        const totalEl = document.getElementById("stat-total-pv");
        if (todayEl) todayEl.textContent = (data.today?.pv || 0).toLocaleString();
        if (totalEl) totalEl.textContent = (data.total?.pv || 0).toLocaleString();
      })
      .catch(() => {});
  }

  // 页面加载后执行
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", function() { track(); loadStats(); });
  } else {
    track();
    loadStats();
  }
})();
