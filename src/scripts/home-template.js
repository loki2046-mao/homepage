export const HOME_FALLBACK_COVER = "/assets/images/article-fallback.svg";

export function escapeHtml(value) {
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

function webpSrc(src) {
  const value = String(src || "");
  if (!/^\/assets\/images\/.+\.(png|jpe?g)$/i.test(value)) return value;
  return value.replace(/\.(png|jpe?g)$/i, ".webp");
}

function imageTag(src, { alt = "", attrs = "" } = {}) {
  const optimized = webpSrc(src);
  const fallback = optimized !== src ? ` data-fallback="${escapeHtml(src)}"` : "";
  const attributeText = attrs ? ` ${attrs.trim()}` : "";
  return `<img src="${escapeHtml(optimized)}" alt="${escapeHtml(alt)}"${attributeText}${fallback} />`;
}

export function articleHref(post) {
  return post?.href || `/article?slug=${encodeURIComponent(post?.slug || "")}`;
}

export function formatDate(value) {
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

export function createHomeModel(data = {}, skillPedalData = []) {
  const posts = Array.isArray(data.posts) ? data.posts : [];
  const products = Array.isArray(data.products) ? data.products : [];
  const talks = Array.isArray(data.talks) ? data.talks : [];
  const stats = data.stats || {};

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
  const skillColors = ["#8a432b", "#365b68", "#78612f", "#4f6f59", "#8b5935", "#3f596f", "#7e3f3a", "#67704b", "#75527a", "#a26239", "#49686d"];
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

  return {
    posts,
    products,
    talks,
    stats,
    latestPosts,
    firstPostByCategory,
    setlist,
    categories,
    albumColors,
    publicProducts,
    rehearsalProducts,
    skills,
    wardrobeRoles,
  };
}

export function renderHomeHTML(data = {}, skillPedalData = []) {
  const {
    posts,
    talks,
    stats,
    latestPosts,
    firstPostByCategory,
    setlist,
    categories,
    albumColors,
    publicProducts,
    rehearsalProducts,
    skills,
    wardrobeRoles,
  } = createHomeModel(data, skillPedalData);

  function posterMarkup(item, index) {
    const style = item.image
      ? ` style="--poster-image:url('${escapeHtml(item.image)}');--poster-fit:${escapeHtml(item.imageFit || "cover")}"`
      : "";
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
      ? imageTag(post.cover, { alt: "", attrs: "loading=\"lazy\"" })
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
      ? imageTag(product.cover, { alt: product.title, attrs: "loading=\"lazy\"" })
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

  return `
    <section class="scene headliner" id="headliner">
      <div class="headliner-portrait reveal" role="button" tabindex="0" aria-label="翻转头像查看公众号二维码" aria-pressed="false">
        <div class="portrait-halo"></div>
        <div class="portrait-card">
          <div class="portrait-face portrait-front">
            ${imageTag("/assets/images/loki-ip-new.png", { alt: "赛博小熊猫 Loki" })}
          </div>
          <div class="portrait-face portrait-back">
            ${imageTag("/assets/images/wechat-qr.jpg", { alt: "赛博小熊猫 Loki 公众号二维码" })}
            <p>翻到后台了。扫码来找我。</p>
          </div>
        </div>
        <span class="portrait-caption">HOVER · BACKSTAGE PASS</span>
      </div>

      <div class="headliner-copy reveal">
        <span class="admitted-badge">🎫 已入场 · TONIGHT</span>
        <h1 class="headliner-title">
          <span class="headliner-title-top">赛博小熊猫</span>
          <span class="headliner-title-name">Loki</span>
        </h1>
        <p class="headliner-role">EDUCATOR / AI CREATOR / WRITER / PRODUCT BUILDER</p>
        <div class="headliner-manifesto">
          <p>中传广电硕士，做过综艺编导。<br />现在是 K12 教育机构的视频中台负责人。<br />23 年开始接触 AI，25 年开始写 AI 公众号。<br />纯文科生，ISTJ，靠 AI 学会了写代码，误打误撞的 vibe coder。</p>
          <p>公众号「赛博小熊猫 Loki」主理人。<br />三年 155 篇，长文为主，很多篇过万字。<br />每一个工具都自己跑过，不贩卖焦虑，不追热点废话。<br />这个习惯从学习到工作到 AI 一直没变。</p>
          <p>这个网站是我这一阶段的思考和小成果的展示——<br />文章、vibe coding 出来的产品、真实生活的切片，<br />还有这些年沉淀下来的东西。</p>
        </div>
        <a class="headliner-github" href="https://github.com/loki2046-mao" target="_blank" rel="noopener noreferrer">
          <span class="github-mark">⌘</span>
          <span class="github-address"><small>GITHUB</small><strong>github.com/loki2046-mao</strong></span>
          <span class="github-purpose">公开项目、Skill 源码、本网站全部代码</span>
          <span class="github-arrow">→</span>
        </a>

        <nav class="headliner-portals" aria-label="站群入口">
          <a href="https://loki-os.hiloki.ai/" target="_blank" rel="noopener noreferrer">作品场刊 loki-os</a>
          <a href="https://kaigong-loki.pages.dev/" target="_blank" rel="noopener noreferrer">开弓试玩</a>
          <a href="https://loki-os.hiloki.ai/methods/travel-memory/" target="_blank" rel="noopener noreferrer">旅行回忆方法</a>
          <a href="https://blog.hiloki.ai/" target="_blank" rel="noopener noreferrer">Blog</a>
        </nav>
        <div class="headliner-stats">
          <div><strong>${escapeHtml(stats.articleCount || posts.length)}</strong><span>篇内容</span></div>
          <div><strong>${escapeHtml(publicProducts.length)}+</strong><span>公开产品</span></div>
          <div><strong>∞</strong><span>还没写完</span></div>
        </div>
      </div>
      <a class="scroll-cue" href="#setlist">SCROLL TO ACT I</a>
    </section>

    <section class="scene" id="setlist">
      <div class="scene-intro reveal">
        <div><span class="scene-label">ACT I / SETLIST</span><h2 class="scene-title">今晚曲目<br /><em>精选代表作，不是全部库存。</em></h2></div>
        <p>每一张海报都是我做过的一件事。点开不会立刻把你赶去别的网站，先在聚光灯里看看它为什么出现。</p>
      </div>
      <div class="poster-rail">${setlist.map(posterMarkup).join("")}</div>
      ${imageTag("/assets/images/loki-glowstick.png", { alt: "", attrs: "class=\"loki-mascot setlist-mascot\" aria-hidden=\"true\" loading=\"lazy\" decoding=\"async\"" })}
    </section>

    <section class="scene" id="albums">
      <div class="scene-intro reveal">
        <div><span class="scene-label">ACT II / ALBUM WALL</span><h2 class="scene-title">专辑墙<br /><em>${escapeHtml(stats.articleCount || posts.length)} 篇内容，按声音而不是库存摆放。</em></h2></div>
        <p>拿下一张唱片，会看到这个主题下的全部曲目。也可以切换总表，按时间从最近一首往回听。</p>
        ${imageTag("/assets/images/loki-headphones.png", { alt: "", attrs: "class=\"loki-mascot album-mascot\" aria-hidden=\"true\" loading=\"lazy\" decoding=\"async\"" })}
      </div>
      <div class="album-controls reveal">
        <div class="view-switch">
          <button class="is-active" type="button" data-album-view="wall">唱片墙</button>
          <button type="button" data-album-view="tracks">曲目总表</button>
        </div>
        <label class="album-search"><span>⌕ 搜歌</span><input id="album-search-input" type="search" placeholder="输入文章标题或主题" /></label>
      </div>
      <div class="album-wall" id="album-wall">${categories.map(albumMarkup).join("")}</div>
      <div class="track-table" id="track-table">${latestPosts(60).map(trackMarkup).join("")}</div>
    </section>

    <section class="scene" id="press">
      <div class="scene-intro reveal">
        <div><span class="scene-label">ACT III / PRESS CALL</span><h2 class="scene-title">通告栏<br /><em>公开分享、讲稿和下一场见面。</em></h2></div>
        <p>已恢复 ${escapeHtml(talks.length || 0)} 条分享线索，目前 ${escapeHtml(talks.filter((talk) => talk.href).length)} 条可以直接交付；没放链接的不是假入口，而是还在补材料。</p>
      </div>
      <div class="cork-board">
        ${(talks.length ? talks : [{ title: "更多分享正在准备", description: "团队培训、演讲和公开讲稿会逐步补到这里。", status: "COMING" }]).slice(0, 3).map(pressMarkup).join("")}
      </div>
    </section>

    <section class="scene" id="rehearsal">
      <div class="scene-intro reveal">
        <div><span class="scene-label">ACT IV / REHEARSAL ROOM</span><h2 class="scene-title">排练室<br /><em>文章说完以后，我还会把方法做成东西。</em></h2></div>
        <p>谱架上是可以直接打开的产品；墙上的效果器，是这些年慢慢练出来、又被做成工作流的能力。</p>
      </div>
      <div class="rehearsal-room">
        <div class="music-stands">${rehearsalProducts.map(productMarkup).join("")}</div>
        <div class="skill-pedals">
          ${skills.map((skill, index) => `<button class="skill-pedal reveal" type="button" data-skill-index="${index}" style="--pedal:${escapeHtml(skill.color)}"><i></i><strong>${escapeHtml(skill.name)}</strong><small>${escapeHtml(skill.type)}</small></button>`).join("")}
        </div>
        ${imageTag("/assets/images/loki-drumstool.png", { alt: "", attrs: "class=\"loki-mascot rehearsal-mascot\" aria-hidden=\"true\" loading=\"lazy\" decoding=\"async\"" })}
      </div>
    </section>

    <section class="scene backstage-corridor" id="backstage-corridor">
      <div class="corridor-sign reveal">
        <span>🚪 后台走廊</span>
        <small>BACKSTAGE · AUTHORIZED CREW ONLY</small>
      </div>
      <div class="corridor-depth" aria-hidden="true"></div>
      ${imageTag("/assets/images/loki-sign.png", { alt: "", attrs: "class=\"loki-mascot corridor-mascot\" aria-hidden=\"true\" loading=\"lazy\" decoding=\"async\"" })}
      <div class="corridor-doors">
        <a class="corridor-door-slot reveal" href="#dressing-room">
          <span class="corridor-door"><small>DOOR 01</small><i class="door-icon-img"><img src="/assets/images/corridor-icons/icon-dressing.png" alt="" /></i><strong>DRESSING<br />ROOM</strong><b aria-hidden="true"></b></span>
          <span class="corridor-nameplate">化妆间</span>
        </a>
        <a class="corridor-door-slot reveal" href="#broadcast-booth">
          <span class="corridor-door"><small>DOOR 02</small><i class="door-icon-img"><img src="/assets/images/corridor-icons/icon-broadcast.png" alt="" /></i><strong>BROADCAST<br />BOOTH</strong><b aria-hidden="true"></b></span>
          <span class="corridor-nameplate">导播间</span>
        </a>
        <a class="corridor-door-slot reveal" href="#wardrobe">
          <span class="corridor-door"><small>DOOR 03</small><i class="door-icon-img"><img src="/assets/images/corridor-icons/icon-wardrobe.png" alt="" /></i><strong>WARDROBE</strong><b aria-hidden="true"></b></span>
          <span class="corridor-nameplate">服装间</span>
        </a>
        <div class="corridor-door-slot is-disabled reveal" aria-disabled="true" data-tooltip="COMING SOON">
          <span class="corridor-door"><small>DOOR 04</small><i class="door-icon-img"><img src="/assets/images/corridor-icons/icon-vip.png" alt="" /></i><strong>VIP BOX</strong><b aria-hidden="true"></b></span>
          <span class="corridor-nameplate">VIP 包厢 · 即将开放</span>
        </div>
      </div>
      <div class="corridor-footer">
        ${imageTag("/assets/images/loki-sign.png", { alt: "", attrs: 'class="loki-mascot corridor-mascot" aria-hidden="true" loading="lazy" decoding="async"' })}
        <p class="corridor-whisper reveal">演出结束以后，真正的故事才从这条走廊开始。</p>
      </div>
    </section>

    <section class="scene wardrobe-room" id="wardrobe">
      <div class="wardrobe-head reveal">
        <span class="scene-label">BACKSTAGE / WARDROBE</span>
        <h2 class="scene-title">服装间<br /><em>同一个人，换五套站位上台。</em></h2>
        <p>这里不是简历分类，而是五个角色的换装架：主唱、制作人、导演、编剧、乐迷。Phase A 先开门，点一张站位卡看它背后的作品和线索。</p>
      </div>
      <div class="wardrobe-arc">
        ${wardrobeRoles.map(wardrobeRoleMarkup).join("")}
      </div>
      <a class="back-to-corridor reveal" href="#backstage-corridor">← 返回后台走廊</a>
    </section>

    <section class="scene broadcast-booth" id="broadcast-booth">
      <div class="broadcast-head reveal">
        <span class="scene-label">BACKSTAGE / BROADCAST BOOTH</span>
        <h2 class="scene-title">导播间<br /><em>幕后的信号台，控制整场演出的节奏。</em></h2>
        <p>这里放的是内容创作的底层逻辑——选题怎么来的、文章怎么写的、工作流是什么样的。都是跑通之后才整理出来的，不是方法论，是操作手册。</p>
      </div>
      <div class="broadcast-grid reveal">
        <div class="broadcast-card">
          <small>WORKFLOW 01</small>
          <h3>公众号内容工作流</h3>
          <p>选题 → 跑模型 → 测评 → 写稿 → 排版 → 发布。每个环节的判断标准和常用工具。</p>
        </div>
        <div class="broadcast-card">
          <small>WORKFLOW 02</small>
          <h3>Prompt 工程方法论</h3>
          <p>不是技巧集锦，是从反复试错里提炼出来的可复用结构。配合提示词工厂使用。</p>
          <a href="/prompt-factory.html" target="_blank" rel="noopener noreferrer">打开提示词工厂 ↗</a>
        </div>
        <div class="broadcast-card">
          <small>WORKFLOW 03</small>
          <h3>AI 工具选用逻辑</h3>
          <p>不追热点，按任务类型选模型。图像/文字/代码/视频各有各的判断维度。</p>
        </div>
        <div class="broadcast-card">
          <small>METHOD</small>
          <h3>方法论文章</h3>
          <p>「效率方法」分类下的文章，是这些年沉淀下来最值得反复看的那些。</p>
          <a href="/articles?category=%E6%95%88%E7%8E%87%E6%96%B9%E6%B3%95">查看全部 →</a>
        </div>
      </div>
      <a class="back-to-corridor reveal" href="#backstage-corridor">← 返回后台走廊</a>
    </section>

    <section class="scene dressing-room" id="dressing-room">
      <div class="dressing-atmosphere reveal" aria-hidden="true">
        <div class="mirror-lamp"><i></i></div>
        <div class="dressing-mirror"><span>LOKI</span><small>STILL HERE</small>${imageTag("/assets/images/loki-plain.png", { alt: "", attrs: "class=\"loki-mascot mirror-mascot\" loading=\"lazy\" decoding=\"async\"" })}</div>
        <p>卸了妆还是我 · NO FILTER</p>
      </div>
      <div class="dressing-content">
        <div class="dressing-heading reveal">
          <span class="scene-label">BACKSTAGE / DRESSING ROOM</span>
          <h2>关于我</h2>
          <p>台上的身份会换，台下的习惯和偏爱倒是一直没怎么变。</p>
        </div>
        <div class="personality-tags reveal">
          <span>ISTJ · 金牛座</span><span>秩序控，慢热持久</span><span>冰美式续命 ☕</span>
          <span>白芽奇兰 🍵</span><span>壁球菜鸟 🏃</span><span>深夜灵感 🌙</span>
        </div>
        <blockquote class="dressing-quote reveal">
          <p>愤怒是表达方式，不是放弃的理由。</p>
          <p>人可能终其一生，还是在寻找一个可以理解自己的东西。</p>
        </blockquote>
        <div class="audience-notes">
          <div class="audience-notes-head reveal"><span>台下记录</span><small>AUDIENCE NOTES · PERSONAL ARCHIVE</small></div>
          <div class="audience-boxes">
            <article class="audience-box reveal"><small>BOX A</small><h3>2005</h3><p>李宇春 · 周笔畅 · 万人空巷 · 街头拉票</p></article>
            <article class="audience-box reveal"><small>BOX B</small><h3>浪姐</h3><p>陈昊宇 浪五 · 刘恋 浪三 · 于文文 浪三 · 初舞台入坑 · 佳人</p></article>
            <article class="audience-box reveal"><small>BOX C</small><h3>LIVE 现场</h3><p>五月天 · 张学友 · 杨千嬅 · 莫文蔚 · 林忆莲 · 万人场馆 · 全勤记录</p></article>
            <article class="audience-box reveal"><small>BOX D</small><h3>2026</h3><p>鸟巢 · PLEASURE · 七层楼装置 · 飞马 · 这不是舞美这是魔术</p></article>
          </div>
        </div>
        <a class="back-to-corridor reveal" href="#backstage-corridor">← 返回后台走廊</a>
      </div>
    </section>
  `;
}
