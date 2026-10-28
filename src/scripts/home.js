import { renderHomeHTML } from "./home-template.js";

(function () {
  "use strict";

  const data = window.__HILOKI_SITE_INDEX__ || {};
  const hero = data.hero || {};
  const posts = Array.isArray(data.posts) ? data.posts : [];
  const products = Array.isArray(data.products) ? data.products : [];
  const talks = Array.isArray(data.talks) ? data.talks : [];
  const skillPedalData = Array.isArray(window.__HILOKI_SKILL_PEDALS__) ? window.__HILOKI_SKILL_PEDALS__ : [];
  const clientConfig = window.__HILOKI_CONFIG__ || {};
  const protectedTalkCode = String(clientConfig.protectedTalkCode || "").trim();
  const stats = data.stats || {};
  const fallbackCover = "/assets/images/article-fallback.svg";
  const root = document.getElementById("venue-root");
  if (!root) return;

  function escapeHtml(value) {
    return String(value || "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function compact(value, max = 110) {
    const text = String(value || "").replace(/\s+/g, " ").trim();
    return text.length > max ? `${text.slice(0, max).trim()}…` : text;
  }

  function articleHref(post) {
    return post.href || `/article?slug=${encodeURIComponent(post.slug || "")}`;
  }

  function formatDate(value) {
    if (!value) return "ONGOING";
    const date = new Date(`${value}T00:00:00`);
    if (Number.isNaN(date.getTime())) return value;
    return new Intl.DateTimeFormat("zh-CN", { year: "numeric", month: "2-digit", day: "2-digit" }).format(date);
  }

  function albumMark(label) {
    const marks = {
      AI观察: "观察",
      模型测评: "实测",
      图像生成: "视觉",
      效率方法: "流程",
      教育实践: "课堂",
      产品实验: "造物",
      AI工具: "工具",
    };
    return marks[label] || String(label || "LOKI").slice(0, 4).toUpperCase();
  }

  function latestPosts(limit = 10) {
    return [...posts]
      .filter((post) => post?.title && post?.slug)
      .sort((a, b) => String(b.publishDate || "").localeCompare(String(a.publishDate || "")))
      .slice(0, limit);
  }

  function firstPostByCategory(category) {
    return latestPosts(200).find((post) => post.category === category) || posts.find((post) => post.category === category);
  }

  const latest = latestPosts(1)[0];
  const featuredSetlistTitles = new Set(["HiLoki.ai", "小熊猫写作", "恋之上上签", "PLEASURE", "球盲嘴替"]);
  const setlist = [
    {
      title: "HiLoki.ai",
      desc: "个人主页 · 内容仓库 · 这座场馆本身",
      href: "#headliner",
      label: "HOME SHOW",
      image: "/assets/images/setlist/hiloki-home.jpg",
      imageFit: "cover",
    },
    {
      title: "小熊猫写作",
      desc: "长篇写作平台 · 把故事真正写下去",
      href: "https://inkxiaoxiongmao.hiloki.ai",
      label: "LIVE PRODUCT",
      image: "/assets/images/setlist/inkpanda.jpg",
      imageFit: "cover",
    },
    {
      title: "恋之上上签",
      desc: "刘恋歌词答案书 · 44 首 147 句",
      href: "https://lian.hiloki.ai",
      label: "SIDE PROJECT",
      image: "/assets/images/setlist/lian.jpg",
      imageFit: "cover",
    },
    {
      title: "PLEASURE",
      desc: "鸟巢演唱会全记录 · 服装、装置与飞马",
      href: "https://loki2046-mao.github.io/cola-pages/hiloki/",
      label: "LIVE ARCHIVE",
      image: "/assets/images/setlist/pleasure.jpg",
      imageFit: "cover",
    },
    {
      title: "球盲嘴替",
      desc: "世界杯 AI 嘴替 · 零服务端实验",
      href: "https://qiumang.hiloki.ai",
      label: "VIBE CODING",
      image: "/assets/images/setlist/qiumang.jpg",
      imageFit: "cover",
    },
    latest
      ? {
          title: latest.title,
          desc: compact(latest.summary || latest.excerpt || "最近更新的内容", 74),
          href: articleHref(latest),
          label: "TONIGHT ENCORE",
          image: "/assets/images/setlist/tonight-encore.jpg",
          imageFit: "cover",
          encore: true,
        }
      : null,
  ].filter(Boolean);

  const categories = (stats.categories || []).filter((item) => item.count > 1).slice(0, 6);
  const albumColors = ["#a9482c", "#446172", "#847037", "#6c4d6f", "#4d6d55", "#8e5940"];
  const publicProducts = products.filter((item) => item.href && item.href !== "./index.html");
  const rehearsalProducts = publicProducts.filter((item) => !featuredSetlistTitles.has(item.title));
  const skillColors = ["#8a432b", "#365b68", "#78612f", "#67446a", "#4f6f59", "#8b5935", "#3f596f", "#7e3f3a", "#67704b", "#75527a", "#a26239", "#49686d"];
  const skills = (skillPedalData.length
    ? skillPedalData
    : [
        { name: "公众号写作", type: "CONTENT", category: "AI观察", quote: "写得多了，声音自己会出来。" },
        { name: "AI 工具测评", type: "REVIEW", category: "模型测评", quote: "不是参数对比，是真实任务下的体验。" },
        { name: "Prompt 工程", type: "PROMPT", category: "AI工具", quote: "把感觉变成可复制的方法。" },
        { name: "AI 图像生成", type: "VISUAL", category: "图像生成", quote: "从会描述开始，然后会设计。" },
        { name: "排版与视觉", type: "DESIGN", category: "效率方法", quote: "视觉不是加分项，是基本功。" },
        { name: "前端开发", type: "BUILD", category: "产品实验", quote: "想法能打开，才算真的做过。" },
        { name: "工作流搭建", type: "FLOW", category: "效率方法", quote: "重复的事情不应该第二遍。" },
        { name: "Skill 开发", type: "AGENT", category: "AI工具", quote: "把会的东西写成说明书。" },
        { name: "阅读笔记整理", type: "KNOWLEDGE", category: "AI观察", quote: "积累不是收藏，是能找回来。" },
        { name: "AI 新闻雷达", type: "RADAR", category: "AI观察", quote: "盯着那些真在做东西的人。" },
        { name: "社交卡片", type: "SOCIAL", category: "图像生成", quote: "内容做好了，还要能被人看到。" },
        { name: "飞书转公众号", type: "PUBLISH", category: "效率方法", quote: "写作和发布之间，不应该有排版这道坎。" },
      ]).map((skill, index) => ({ ...skill, color: skill.color || skillColors[index % skillColors.length] }));
  const wardrobeRoles = [
    {
      role: "主唱",
      prop: "笔",
      icon: "🎙️",
      label: "LEAD VOCAL / WRITING",
      line: "站到立麦前，拿起笔，把长期写作变成能被听见的声音。",
      items: [
        { title: "公众号文章精选", meta: "AI 观察 / 模型测评 / 效率方法", desc: "长期更新的 AI 观察、工具实测和方法论文章。", href: "/articles" },
        { title: "写作声音", meta: "三年公众号", desc: "从工具使用记录，到带着情绪和判断的个人表达。" },
        { title: "代表曲目", meta: "Tonight Encore", desc: latest ? latest.title : "最近更新的内容", href: latest ? articleHref(latest) : "/articles" },
      ],
    },
    {
      role: "制作人",
      prop: "扳手",
      icon: "🎛️",
      label: "PRODUCER / PRODUCT",
      line: "把反复出现的需求做成产品，把一次灵感调成可复用的工作流。",
      items: publicProducts.map((product) => ({
        title: product.title,
        meta: product.status || "Live Product",
        desc: product.description || "公开产品入口",
        href: product.href,
      })),
    },
    {
      role: "导演",
      prop: "场记板",
      icon: "🎬",
      label: "DIRECTOR / EDUCATION",
      line: "教育现场、内容生产和培训体系，是另一条更长的片场调度线。",
      items: [
        { title: "K12 教育实践", meta: "Education", desc: "把 AI 工具放到真实教学和学习任务里，而不是只停在演示。", href: "/articles" },
        { title: "视频中台", meta: "Content Ops", desc: "从素材、脚本、审核到发布，把内容生产组织成流程。" },
        { title: "培训体系", meta: "Internal Enablement", desc: "让非技术同事理解工具、用上工具，再把经验留下来。" },
      ],
    },
    {
      role: "编剧",
      prop: "打字机",
      icon: "✒️",
      label: "SCREENWRITER / FICTION",
      line: "故事不是副业，是一直藏在后台的另一套叙事肌肉。",
      items: [
        { title: "小熊猫写作", meta: "NovelFlow", desc: "长篇写作平台，把故事真正写下去。", href: "https://inkxiaoxiongmao.hiloki.ai" },
        { title: "同人文与长篇写作", meta: "Fiction Archive", desc: "那些不一定放在台前，但一直影响表达方式的练习。" },
        { title: "角色、伏笔、世界观", meta: "Story Bible", desc: "写作不只是灵感，也是一套持续维护的系统。" },
      ],
    },
    {
      role: "乐迷",
      prop: "票根",
      icon: "🎫",
      label: "FAN / LIVE MEMORY",
      line: "追星、现场、票根和舞台记忆，是这个场馆最早的灯。",
      items: [
        { title: "PLEASURE 鸟巢记录", meta: "Live Archive", desc: "蔡依林 PLEASURE、飞马、服装、装置和现场记忆。", href: "https://loki2046-mao.github.io/cola-pages/hiloki/" },
        { title: "恋之上上签", meta: "Lyric Oracle", desc: "刘恋歌词答案书，44 首歌、147 句歌词。", href: "https://lian.hiloki.ai" },
        { title: "追星 BOX", meta: "Audience Notes", desc: "从 2005 超女到 LIVE 现场，台下记录也是人格底色。" },
      ],
    },
  ];

  function posterMarkup(item, index) {
    const style = item.image ? ` style="--poster-image:url('${escapeHtml(item.image)}');--poster-fit:${escapeHtml(item.imageFit || "cover")}"` : "";
    return `
      <article class="show-poster poster-designed ${item.encore ? "poster-encore" : ""} reveal" data-project-index="${index}"${style}>
        <div class="poster-top">
          <span>${escapeHtml(item.label)}</span>
          <span class="poster-number">${String(index + 1).padStart(2, "0")}</span>
        </div>
        <div class="poster-bottom">
          <h3>${escapeHtml(item.title)}</h3>
          <p>${escapeHtml(item.desc)}</p>
          <span class="poster-ticket">ADMIT ONE · VIEW VCR</span>
        </div>
      </article>
    `;
  }

  function albumMarkup(category, index) {
    const post = firstPostByCategory(category.label);
    const image = post?.cover
      ? `<img src="${escapeHtml(post.cover)}" alt="" loading="lazy" data-fallback="${fallbackCover}" />`
      : "";
    return `
      <article class="album-card reveal" data-category="${escapeHtml(category.label)}" style="--album-color:${albumColors[index % albumColors.length]}">
        <div class="vinyl-wrap">
          <div class="vinyl-disc"></div>
          <div class="album-cover" data-mark="${escapeHtml(albumMark(category.label))}">${image}</div>
        </div>
        <div class="album-info">
          <div><small>HILOKI RECORDS · VOL.${String(index + 1).padStart(2, "0")}</small><h3>${escapeHtml(category.label)}</h3></div>
          <div class="album-count"><strong>${escapeHtml(category.count)}</strong><span>TRACKS</span></div>
        </div>
      </article>
    `;
  }

  function trackMarkup(post, index) {
    return `
      <a class="track-row" href="${articleHref(post)}" data-search="${escapeHtml(`${post.title} ${post.category || ""}`.toLowerCase())}">
        <i>${String(index + 1).padStart(2, "0")}</i>
        <strong>${escapeHtml(post.title)}</strong>
        <time>${escapeHtml(formatDate(post.publishDate))}</time>
        <span>${escapeHtml(post.category || "Loki")}</span>
      </a>
    `;
  }

  function productMarkup(product, index) {
    const image = product.cover
      ? `<img src="${escapeHtml(product.cover)}" alt="${escapeHtml(product.title)}" loading="lazy" data-fallback="${fallbackCover}" />`
      : "";
    return `
      <article class="music-stand reveal" data-product-index="${index}">
        <div class="sheet">
          <div class="sheet-cover">${image}</div>
          <small>SCORE NO.${String(index + 1).padStart(2, "0")} · ${escapeHtml(product.status || "ONGOING")}</small>
          <h3>${escapeHtml(product.title)}</h3>
          <p>${escapeHtml(compact(product.description, 100))}</p>
        </div>
        <span class="stand-pole"></span>
      </article>
    `;
  }

  function wardrobeRoleMarkup(role, index) {
    return `
      <button class="wardrobe-role-card reveal" type="button" data-wardrobe-index="${index}">
        <span class="wardrobe-spotlight" aria-hidden="true"></span>
        <span class="wardrobe-prop">${escapeHtml(role.icon)}</span>
        <small>${escapeHtml(role.label)}</small>
        <h3>${escapeHtml(role.role)}</h3>
        <p>${escapeHtml(role.prop)} · ${escapeHtml(role.line)}</p>
      </button>
    `;
  }

  function pressMarkup(talk, index) {
    const protectedTalk = /提示词工程/.test(talk.title || "");
    const available = Boolean(talk.href);
    return `
      <article class="press-note ${available ? "is-available" : "is-rehearsing"} reveal" data-talk-index="${index}">
        <small>PRESS CALL · ${escapeHtml(available ? "READY" : talk.status || "REHEARSING")}</small>
        <h3>${escapeHtml(talk.title || "下一场分享")}</h3>
        <p>${escapeHtml(talk.description || "更多公开分享、培训与讲稿会继续贴到这里。")}</p>
        <span class="press-meta">${escapeHtml(talk.audience || talk.date || "PUBLIC NOTE")}</span>
        ${protectedTalk ? `<span class="lock-stamp">ACCESS CODE REQUIRED</span>` : ""}
        ${!available ? `<span class="lock-stamp">IN REHEARSAL</span>` : ""}
      </article>
    `;
  }

  const hasCrawlFallback = Boolean(root.querySelector(".crawl-fallback"));
  if (hasCrawlFallback || !root.innerHTML.trim()) {
    root.innerHTML = renderHomeHTML(data, skillPedalData);
  }
  const body = document.body;
  document.querySelectorAll("img[data-fallback]").forEach((image) => {
    image.addEventListener(
      "error",
      () => {
        if (image.src.endsWith(image.dataset.fallback)) return;
        image.src = image.dataset.fallback;
      },
      { once: true },
    );
  });

  const portrait = document.querySelector(".headliner-portrait");
  function togglePortrait() {
    const flipped = portrait?.classList.toggle("is-flipped") || false;
    portrait?.setAttribute("aria-pressed", String(flipped));
  }
  portrait?.addEventListener("click", togglePortrait);
  portrait?.addEventListener("keydown", (event) => {
    if (event.key !== "Enter" && event.key !== " ") return;
    event.preventDefault();
    togglePortrait();
  });

  const switchButton = document.querySelector(".light-switch");
  const switchLabel = document.querySelector(".switch-copy strong");
  const metaTheme = document.querySelector('meta[name="theme-color"]');

  function setTheme(theme, animate = false) {
    const apply = () => {
      body.dataset.theme = theme;
      switchLabel.textContent = theme === "backstage" ? "后台" : "演出中";
      metaTheme?.setAttribute("content", theme === "backstage" ? "#0d0b0a" : "#f6efe4");
      localStorage.setItem("hiloki-venue-theme", theme);
    };
    if (!animate) {
      apply();
      return;
    }
    body.classList.add("is-lighting");
    window.setTimeout(apply, 410);
    window.setTimeout(() => body.classList.remove("is-lighting"), 820);
  }

  setTheme(localStorage.getItem("hiloki-venue-theme") || "backstage");
  switchButton?.addEventListener("click", () => {
    setTheme(body.dataset.theme === "backstage" ? "showtime" : "backstage", true);
  });

  const backstageCorridor = document.getElementById("backstage-corridor");
  const backstageDoorConfigs = [
    { href: "#dressing-room", target: document.getElementById("dressing-room") },
    { href: "#broadcast-booth", target: document.getElementById("broadcast-booth") },
    { href: "#wardrobe", target: document.getElementById("wardrobe") },
  ];

  if (backstageCorridor) {
    backstageCorridor.querySelectorAll(".reveal").forEach((element) => element.classList.add("is-visible"));

    let doorTimer;
    let activeDoor;
    let activeStage;

    function openRoom(door, roomStage) {
      window.clearTimeout(doorTimer);
      activeDoor = door;
      activeStage = roomStage;
      backstageCorridor.classList.remove("is-leaving");
      backstageCorridor.classList.add("is-entering");
      door.classList.add("is-active-door");
      door.setAttribute("aria-expanded", "true");
      roomStage.classList.add("is-active-room");
      roomStage.setAttribute("aria-hidden", "false");
      body.classList.add("is-backstage-room-open");
      void backstageCorridor.offsetWidth;
      backstageCorridor.classList.add("is-room-open");
    }

    function closeRoom() {
      if (!activeDoor || !activeStage) return;
      window.clearTimeout(doorTimer);
      backstageCorridor.classList.add("is-leaving");
      backstageCorridor.classList.remove("is-room-open");
      activeDoor.setAttribute("aria-expanded", "false");
      activeStage.setAttribute("aria-hidden", "true");
      body.classList.remove("is-backstage-room-open");
      doorTimer = window.setTimeout(() => {
        backstageCorridor.classList.remove("is-entering", "is-leaving");
        activeDoor?.classList.remove("is-active-door");
        activeStage?.classList.remove("is-active-room");
        activeDoor = null;
        activeStage = null;
      }, 820);
    }

    backstageDoorConfigs.forEach(({ href, target }) => {
      const door = backstageCorridor.querySelector(`a[href="${href}"]`);
      if (!door || !target) return;

      const doorPanel = door.querySelector(".corridor-door");
      const leftLeaf = document.createElement("span");
      const rightLeaf = document.createElement("span");
      leftLeaf.className = "corridor-door-leaf is-left";
      rightLeaf.className = "corridor-door-leaf is-right";
      leftLeaf.setAttribute("aria-hidden", "true");
      rightLeaf.setAttribute("aria-hidden", "true");
      doorPanel?.append(leftLeaf, rightLeaf);

      const roomStage = document.createElement("div");
      roomStage.className = "corridor-room-stage";
      roomStage.setAttribute("aria-hidden", "true");

      const roomCopy = target.cloneNode(true);
      roomCopy.removeAttribute("id");
      roomCopy.classList.add("corridor-room-copy");
      roomCopy.querySelector(".back-to-corridor")?.remove();
      roomCopy.querySelectorAll("[id]").forEach((element) => element.removeAttribute("id"));
      roomCopy.querySelectorAll(".reveal").forEach((element) => element.classList.add("is-visible"));

      // 固定在层的关闭按钮（不随内容滚动）
      const closeButton = document.createElement("button");
      closeButton.className = "corridor-close-btn";
      closeButton.type = "button";
      closeButton.setAttribute("aria-label", "返回走廊");
      closeButton.innerHTML = `← 返回`;
      roomStage.append(closeButton);
      roomStage.append(roomCopy);
      backstageCorridor.append(roomStage);

      door.setAttribute("aria-expanded", "false");
      door.addEventListener("click", (event) => {
        event.preventDefault();
        if (!backstageCorridor.classList.contains("is-room-open")) openRoom(door, roomStage);
      });
      closeButton.addEventListener("click", closeRoom);
    });

    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && backstageCorridor.classList.contains("is-room-open")) {
        closeRoom();
      }
    });
  }

  const spotlight = document.getElementById("spotlight-dialog");
  const spotlightContent = document.getElementById("spotlight-content");
  document.querySelector(".spotlight-close")?.addEventListener("click", () => spotlight.close());

  function showSpotlight() {
    if (!spotlight.open) spotlight.showModal();
  }

  function openWardrobeRole(role) {
    if (!role) return;
    const items = Array.isArray(role.items) ? role.items : [];
    spotlightContent.innerHTML = `
      <div class="spotlight-inner">
        <div class="wardrobe-dialog">
          <span class="scene-label">${escapeHtml(role.label || "WARDROBE ROLE")}</span>
          <h2>${escapeHtml(role.icon)} ${escapeHtml(role.role)} · ${escapeHtml(role.prop)}</h2>
          <p>${escapeHtml(role.line || "")}</p>
          <div class="wardrobe-item-list">
            ${items.map((item) => `
              ${item.href ? `<a class="wardrobe-item" href="${escapeHtml(item.href)}" ${/^https?:/.test(item.href) ? 'target="_blank" rel="noopener noreferrer"' : ""}>` : `<article class="wardrobe-item">`}
                <small>${escapeHtml(item.meta || "ARCHIVE")}</small>
                <strong>${escapeHtml(item.title)}</strong>
                <span>${escapeHtml(item.desc || "")}</span>
              ${item.href ? `</a>` : `</article>`}
            `).join("")}
          </div>
        </div>
      </div>
    `;
    showSpotlight();
  }

  document.addEventListener("click", (event) => {
    const roleCard = event.target.closest("[data-wardrobe-index]");
    if (!roleCard) return;
    event.preventDefault();
    openWardrobeRole(wardrobeRoles[Number(roleCard.dataset.wardrobeIndex)]);
  });

  function openProject(item) {
    const image = item.image
      ? `<div class="spotlight-visual"><img src="${escapeHtml(item.image)}" alt="${escapeHtml(item.title)}" data-fallback="${fallbackCover}" /></div>`
      : `<div class="spotlight-visual"></div>`;
    spotlightContent.innerHTML = `
      <div class="spotlight-inner spotlight-hero">
        ${image}
        <div class="spotlight-copy">
          <span class="scene-label">${escapeHtml(item.label)} / VCR</span>
          <h2>${escapeHtml(item.title)}</h2>
          <p>${escapeHtml(item.desc)}</p>
          <a class="spotlight-action" href="${escapeHtml(item.href)}" ${/^https?:/.test(item.href) ? 'target="_blank" rel="noopener noreferrer"' : ""}>进入项目 ↗</a>
        </div>
      </div>
    `;
    spotlightContent.querySelectorAll("img[data-fallback]").forEach((imageElement) => {
      imageElement.addEventListener("error", () => {
        imageElement.src = imageElement.dataset.fallback;
      }, { once: true });
    });
    showSpotlight();
  }

  document.querySelectorAll("[data-project-index]").forEach((card) => {
    card.addEventListener("click", () => openProject(setlist[Number(card.dataset.projectIndex)]));
  });

  function categoryPosts(category) {
    return latestPosts(500).filter((post) => post.category === category);
  }

  function openAlbum(category) {
    const tracks = categoryPosts(category);
    spotlightContent.innerHTML = `
      <div class="spotlight-inner">
        <div class="album-detail-head">
          <span class="scene-label">HILOKI RECORDS / ${escapeHtml(tracks.length)} TRACKS</span>
          <h2>${escapeHtml(category)}</h2>
        </div>
        <div class="album-track-list">
          ${tracks.map((post, index) => `
            <a class="album-track" href="${articleHref(post)}">
              <i>${String(index + 1).padStart(2, "0")}</i>
              <strong>${escapeHtml(post.title)}</strong>
              <time>${escapeHtml(formatDate(post.publishDate))}</time>
            </a>
          `).join("")}
        </div>
      </div>
    `;
    showSpotlight();
  }

  document.querySelectorAll(".album-card").forEach((card) => {
    card.addEventListener("click", () => openAlbum(card.dataset.category));
  });

  const albumWall = document.getElementById("album-wall");
  const trackTable = document.getElementById("track-table");
  document.querySelectorAll("[data-album-view]").forEach((button) => {
    button.addEventListener("click", () => {
      document.querySelectorAll("[data-album-view]").forEach((item) => item.classList.remove("is-active"));
      button.classList.add("is-active");
      const tracks = button.dataset.albumView === "tracks";
      albumWall.classList.toggle("is-hidden", tracks);
      trackTable.classList.toggle("is-active", tracks);
    });
  });

  const albumSearch = document.getElementById("album-search-input");
  albumSearch?.addEventListener("input", () => {
    const query = albumSearch.value.trim().toLowerCase();
    if (query && !trackTable.classList.contains("is-active")) {
      document.querySelector('[data-album-view="tracks"]')?.click();
    }
    document.querySelectorAll(".track-row").forEach((row) => {
      row.hidden = Boolean(query) && !row.dataset.search.includes(query);
    });
  });

  function openProduct(product) {
    const image = product.cover
      ? `<div class="spotlight-visual"><img src="${escapeHtml(product.cover)}" alt="${escapeHtml(product.title)}" data-fallback="${fallbackCover}" /></div>`
      : `<div class="spotlight-visual"></div>`;
    spotlightContent.innerHTML = `
      <div class="spotlight-inner spotlight-hero">
        ${image}
        <div class="spotlight-copy">
          <span class="scene-label">REHEARSAL SCORE / ${escapeHtml(product.status || "ONGOING")}</span>
          <h2>${escapeHtml(product.title)}</h2>
          <p>${escapeHtml(product.description || "")}</p>
          <a class="spotlight-action" href="${escapeHtml(product.href)}" ${/^https?:/.test(product.href || "") ? 'target="_blank" rel="noopener noreferrer"' : ""}>打开产品 ↗</a>
        </div>
      </div>
    `;
    spotlightContent.querySelectorAll("img[data-fallback]").forEach((imageElement) => {
      imageElement.addEventListener("error", () => {
        imageElement.src = imageElement.dataset.fallback;
      }, { once: true });
    });
    showSpotlight();
  }

  document.querySelectorAll("[data-product-index]").forEach((card) => {
    card.addEventListener("click", () => openProduct(rehearsalProducts[Number(card.dataset.productIndex)]));
  });

  function skillArticleMatches(skill) {
    const preferredTitles = Array.isArray(skill.articles) ? skill.articles : [];
    const exactMatches = preferredTitles
      .map((title) => posts.find((post) => post.title === title || String(post.title || "").includes(title)))
      .filter(Boolean);
    if (exactMatches.length) {
      return exactMatches
        .filter((post, index, list) => post.slug && list.findIndex((item) => item.slug === post.slug) === index)
        .slice(0, 4);
    }
    const keywords = [skill.name, ...(skill.keywords || [])]
      .filter(Boolean)
      .map((item) => String(item).toLowerCase());
    if (!keywords.length) return [];
    const keywordMatches = latestPosts(120).filter((post) => {
      const haystack = `${post.title || ""} ${post.summary || ""} ${post.excerpt || ""} ${post.category || ""}`.toLowerCase();
      return keywords.some((keyword) => haystack.includes(keyword));
    });
    return keywordMatches
      .filter((post, index, list) => post.slug && list.findIndex((item) => item.slug === post.slug) === index)
      .slice(0, 4);
  }

  function skillProduct(skill) {
    if (!skill.product) return null;
    return products.find((product) => product.title === skill.product || product.slug === skill.product) || null;
  }

  function openSkillPedal(skill) {
    if (!skill) return;
    const representativePosts = skillArticleMatches(skill);
    const relatedProduct = skillProduct(skill);
    const relatedItems = Array.isArray(skill.related) ? skill.related : [];
    const relatedLinks = [
      ...(relatedProduct ? [{ label: `打开产品 · ${relatedProduct.title}`, href: relatedProduct.href }] : []),
      ...(Array.isArray(skill.links) ? skill.links : []),
    ].filter((item) => item?.href);
    spotlightContent.innerHTML = `
      <div class="spotlight-inner">
        <div class="skill-spotlight">
          <div class="skill-spotlight-head">
            <span class="scene-label">REHEARSAL PEDAL / ${escapeHtml(skill.type || "SKILL")}</span>
            <h2>🎛️ ${escapeHtml(skill.name || "能力踏板")}</h2>
            <p>${escapeHtml(skill.quote || "这块踏板还在继续调音。")}</p>
          </div>
          <div class="skill-spotlight-grid">
            <section>
              <h3>代表作</h3>
              <div class="skill-link-list">
                ${representativePosts.length
                  ? representativePosts.map((post) => `<a href="${articleHref(post)}"><strong>${escapeHtml(post.title)}</strong><span>${escapeHtml(post.category || "Loki")} · ${escapeHtml(formatDate(post.publishDate))}</span></a>`).join("")
                  : `<p class="skill-empty">这块踏板的代表作还在整理，先听听它的声音。</p>`}
              </div>
            </section>
            <section>
              <h3>相关产出</h3>
              <div class="skill-chip-list">
                ${relatedItems.map((item) => `<span>${escapeHtml(item)}</span>`).join("") || `<span>${escapeHtml(skill.category || "Live Workflow")}</span>`}
              </div>
              <div class="skill-action-list">
                ${relatedLinks.map((item) => `<a class="spotlight-action" href="${escapeHtml(item.href)}" ${/^https?:/.test(item.href) ? 'target="_blank" rel="noopener noreferrer"' : ""}>${escapeHtml(item.label || "打开入口")} ↗</a>`).join("")}
              </div>
            </section>
          </div>
        </div>
      </div>
    `;
    showSpotlight();
  }

  document.addEventListener("click", (event) => {
    const pedal = event.target.closest("[data-skill-index]");
    if (!pedal) return;
    event.preventDefault();
    openSkillPedal(skills[Number(pedal.dataset.skillIndex)]);
  });

  function openTalk(talk) {
    const protectedTalk = Boolean(protectedTalkCode) && /提示词工程/.test(talk.title || "");
    if (protectedTalk) {
      const code = window.prompt("请输入通行码");
      if (String(code || "").trim() !== protectedTalkCode) {
        if (code !== null) window.alert("通行码不对，这张通告暂时还不能揭开。");
        return;
      }
    }
    spotlightContent.innerHTML = `
      <div class="spotlight-inner">
        <span class="scene-label">PRESS CALL / ${escapeHtml(talk.status || "ARCHIVE")}</span>
        <div class="spotlight-copy">
          <h2>${escapeHtml(talk.title || "下一场分享")}</h2>
          <p>${escapeHtml(talk.description || "")}</p>
          ${talk.audience ? `<p class="press-dialog-meta">适合观众：${escapeHtml(talk.audience)}</p>` : ""}
          ${talk.href ? `<a class="spotlight-action" href="${escapeHtml(talk.href)}" target="_blank" rel="noopener noreferrer">查看讲稿 ↗</a>` : ""}
        </div>
      </div>
    `;
    showSpotlight();
  }

  document.querySelectorAll("[data-talk-index]").forEach((note) => {
    note.addEventListener("click", () => openTalk((talks.length ? talks : [])[Number(note.dataset.talkIndex)] || {}));
  });

  const ticketDialog = document.getElementById("ticket-dialog");
  const printedTicket = document.getElementById("printed-ticket");
  const channels = [
    { name: "微信", qr: "/assets/images/qr-wechat.jpg", line: "来后台找我", href: "" },
    { name: "公众号", qr: "/assets/images/wechat-qr.jpg", line: "每次更新，都从这里登台", href: "" },
    { name: "小红书", qr: "/assets/images/qr-xiaohongshu.jpg", line: "看图、看工具，也看日常碎片", href: "" },
    { name: "邮箱", qr: "", line: data.contact?.email || "lokimao2046@gmail.com", href: `mailto:${data.contact?.email || "lokimao2046@gmail.com"}` },
  ];
  document.getElementById("channel-grid").innerHTML = channels
    .map((channel, index) => `<button class="channel-button" type="button" data-channel-index="${index}">${escapeHtml(channel.name)}</button>`)
    .join("");

  function printTicket(channel, index) {
    const qr = channel.qr
      ? `<img src="${escapeHtml(channel.qr)}" alt="${escapeHtml(channel.name)}二维码" />`
      : `<span>${escapeHtml(channel.href ? "EMAIL" : "HILOKI")}</span>`;
    printedTicket.classList.remove("is-printing");
    void printedTicket.offsetWidth;
    printedTicket.innerHTML = `
      <div class="ticket-main">
        <small>LOKI LIVE HOUSE · ADMIT ONE · ${String(index + 1).padStart(2, "0")}</small>
        <h3>${escapeHtml(channel.name)} · 赛博小熊猫 Loki</h3>
        <p>${escapeHtml(channel.line)}</p>
        <div class="ticket-meta"><span>场次：无限期</span><span>座位：你说了算</span></div>
      </div>
      <div class="ticket-qr">${channel.href ? `<a href="${escapeHtml(channel.href)}">${qr}</a>` : qr}</div>
    `;
    printedTicket.classList.add("is-printing");
  }

  document.querySelector(".ticket-trigger")?.addEventListener("click", () => ticketDialog.showModal());
  document.querySelector(".ticket-close")?.addEventListener("click", () => ticketDialog.close());
  document.querySelectorAll("[data-channel-index]").forEach((button) => {
    button.addEventListener("click", () => {
      document.querySelectorAll(".channel-button").forEach((item) => item.classList.remove("is-active"));
      button.classList.add("is-active");
      const index = Number(button.dataset.channelIndex);
      printTicket(channels[index], index);
    });
  });

  [spotlight, ticketDialog].forEach((dialog) => {
    dialog?.addEventListener("click", (event) => {
      if (event.target === dialog) dialog.close();
    });
  });

  function observeReveals() {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.1 }
    );
    document.querySelectorAll(".reveal:not(.is-visible)").forEach((element) => observer.observe(element));
  }
  observeReveals();
})();

/* ── 荧光棒光标 ── */
(function initGlowCursor() {
  // 不在触摸设备上启用
  if (window.matchMedia("(pointer: coarse)").matches) return;

  const stick = document.createElement("div");
  stick.id = "glow-stick";
  stick.setAttribute("aria-hidden", "true");
  // 挂在 body 上，确保在所有层叠上下文之上
  document.body.appendChild(stick);

  let cx = -200, cy = -200;
  let tx = -200, ty = -200;
  let raf;

  function lerp(a, b, t) { return a + (b - a) * t; }

  function tick() {
    cx = lerp(cx, tx, 0.18);
    cy = lerp(cy, ty, 0.18);
    stick.style.left = cx + "px";
    stick.style.top = cy + "px";
    raf = requestAnimationFrame(tick);
  }

  // 用 window 级监听，覆盖所有 overflow:auto 容器内的事件
  window.addEventListener("mousemove", (e) => {
    tx = e.clientX;
    ty = e.clientY;
    if (!raf) raf = requestAnimationFrame(tick);
  }, { passive: true });

  window.addEventListener("mouseleave", () => {
    tx = -200; ty = -200;
  });

  // 点击时闪烁
  window.addEventListener("mousedown", () => stick.classList.add("is-clicking"));
  window.addEventListener("mouseup", () => stick.classList.remove("is-clicking"));
})();
