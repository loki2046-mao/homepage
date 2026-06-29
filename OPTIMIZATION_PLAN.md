# HiLoki.ai 优化计划

> 2026-06-27 · 按优先级排列，从上到下逐个实施。每完成一项在 `[ ]` 中打 `[x]`。

---

## P0 — 性能 / 可访问性（必须先做）

### [x] 1. 拆分 `articles-data.js`，按文章独立加载

**现状：** `src/data/articles-data.js` 24.7 MB，包含全部文章全文 HTML。`articles.html` 和 `article.html` 每页都加载整个文件。

**目标：** 文章列表页只加载元数据（标题、摘要、日期、分类），文章详情页只加载当前文章的正文。

**具体步骤：**

1. 修改 `scripts/site-data.mjs`：
   - 新增函数 `createPostFiles(sourceData)`，遍历 `data.posts`，为每个文章生成独立的 JSON 文件写入 `dist/data/posts/<slug>.json`，内容只包含该文章的：`title`, `slug`, `publishDate`, `category`, `summary`, `cached.html`（全文）, `image/cover`, `gallery`, `url`
   - `createArticleData()` 中去掉 `posts` 数组里的 `cached.html` 正文（列表页不需要正文），只保留元数据

2. 修改 `scripts/build-site.mjs`：
   - 在构建流程中调用 `createPostFiles()`
   - 确保 `dist/data/posts/` 目录被创建并写入各文章 JSON

3. 修改 `src/scripts/articles.js`：
   - 文章列表页（`renderArchivePageV3`）继续使用 `window.__HILOKI_DATA__` 中的 posts 元数据数组（已经没有正文了，只用于列表展示）
   - 文章详情页（`renderArticlePageV3`）去掉对 `post.cached.html` 的依赖，改为 `fetch(/data/posts/<slug>.json)` 加载当前文章的正文

4. 修改 `src/article.html`：去掉 `<script src="/assets/data/articles-data.js">`，改为只加载 articles.js（不再需要把全部数据预加载）

5. 修改 `src/articles.html`：同上

**验证：** 打开文章列表页，检查浏览器 Network 面板中 `articles-data.js` 的大小应大幅缩小（不含正文）。打开任意文章详情页，确认正文正常显示，且只加载了当前文章的 JSON。

---

### [x] 2. 构建时预渲染首页 HTML

**现状：** 首页 `<main id="venue-root">` 是空标签，所有内容由 `home.js` 在浏览器端注入。搜索引擎看不到任何实际内容。

**目标：** `dist/index.html` 在构建时就包含完整的首页 HTML，JS 只负责交互（点击、动画、对话框等）。

**具体步骤：**

1. 新建 `scripts/render-home.mjs`：
   - 导入 `site-data.mjs` 中的 `loadSourceData`, `createSiteIndex`
   - 读取 `src/index.html` 模板
   - 把当前 `home.js` 中 `root.innerHTML = ...` 这段模板替换逻辑在 Node 端执行一遍
   - 注意：Node 端渲染时不需要 `<script src="/assets/data/site-index.js">` 中的 `window.__HILOKI_SITE_INDEX__`，可以直接把 `createSiteIndex()` 的结果作为 JS 变量传入渲染函数
   - 把 `skill-pedals.js` 的内容也同步加载进来（`import` 或 `readFile` + parse）
   - 生成完整的 HTML 字符串，把 `<main id="venue-root">...</main>` 替换为预渲染后的内容
   - 输出到 `dist/index.html`

2. 修改 `scripts/build-site.mjs`：
   - 在现有构建流程中调用 `renderHome()`
   - 不再直接 copy `src/index.html`，而是用渲染后的版本

3. 修改 `src/scripts/home.js`：
   - 检测 `#venue-root` 是否已有内容（`root.innerHTML.trim()` 非空）
   - 如果已有内容，跳过 `root.innerHTML = ...`，只绑定事件监听器
   - 如果为空（开发模式直接打开 src/index.html），则走原来的客户端渲染路径

**注意：** 这一步的关键是把 `home.js` 中的 HTML 模板逻辑提取为**可复用函数**（`renderHomeHTML(siteIndex, skillPedals)`），供 Node 端和浏览器端共用。避免维护两份 HTML 模板。

**验证：** `curl http://127.0.0.1:4173/ | grep -c '<article'` 应返回 > 0，确认首页 HTML 中包含文章卡片等实际内容。

---

### [x] 3. 首页图片压缩和 WebP 化

**现状：** 首页 PNG 装饰图合计约 12MB 未压缩。

```
loki-ip-new.png      4.6 MB  ← 头像翻转卡片正面
loki-sign.png        1.9 MB
loki-headphones.png  1.8 MB
loki-glowstick.png   1.4 MB
loki-plain.png       1.7 MB
loki-broom.png       1.3 MB
loki-drumstool.png   1.2 MB
share-cover.png      500 KB
```

**目标：** 全部转 WebP + 原尺寸 PNG 作为 fallback，目标减少 65-80% 体积。

**具体步骤：**

1. 在 `scripts/build-site.mjs` 中增加图片转换步骤：
   - 安装 `sharp`（`npm install sharp --save-dev`）
   - 遍历 `public/assets/images/` 下所有 `.png` 和 `.jpg`
   - 调用 `sharp(input).webp({ quality: 80 }).toFile(output)` 生成 `.webp` 版本
   - 对于 > 500KB 的图片，额外生成 50% 缩略版本（`-sm.webp`）供移动端使用

2. 修改 `src/index.html` / `src/scripts/home.js` 中的 `<img>` 标签：
   - 将 `<img src="/assets/images/loki-ip-new.png">` 改为：
     ```html
     <picture>
       <source srcset="/assets/images/loki-ip-new.webp" type="image/webp">
       <img src="/assets/images/loki-ip-new.png" ...>
     </picture>
     ```
   - 对于需要多分辨率的图片（如头像 `loki-ip-new.png`），增加 `srcset`：
     ```html
     <source srcset="/assets/images/loki-ip-new.webp 1x, /assets/images/loki-ip-new@2x.webp 2x" type="image/webp">
     ```

3. 或者更简单的方法（推荐，因为改动最小）：
   - 构建时只生成 WebP，在 HTML 模板中写一个辅助函数来生成 `<picture>` 标签
   - 对于装饰性小熊猫 PNG（broom, drumstool, glowstick, headphones, plain, sign），考虑改成内联 SVG（这些是 IP 角色图，不是照片），体积可从 1-2MB 降到 5-15KB

**验证：** 构建后 `dist/assets/images/` 中每个 PNG/JPG 都有对应的 `.webp` 文件。在浏览器中打开首页，Network 面板确认加载的是 WebP 格式。

---

## P1 — 视觉一致性 / 代码清理

### [x] 4. 统一首页和文章页的视觉系统

**现状：** 首页和文章页使用完全独立的设计 token、字体和色彩体系，视觉风格不一致。

**具体步骤：**

1. 新建 `src/styles/base.css`（约 5-8KB），提取两套系统中的共同部分：
   - CSS reset / `box-sizing`
   - 色彩 tokens（合并为统一命名，同时支持 backstage / showtime 两套主题）
   - 排版基础（`--serif`, `--sans`, `--mono` 字体栈统一）
   - 间距和圆角

2. 修改 `src/index.html`：在 `<head>` 中增加 `<link rel="stylesheet" href="/assets/styles/base.css">`
3. 修改 `src/articles.html` 和 `src/article.html`：同上，增加 base.css 引用

4. 字体统一：
   - 文章页当前加载 Manrope + Noto Sans SC + Sora（~200KB 额外字体下载）
   - 改为复用首页的字体栈：Noto Serif SC（正文）+ Noto Sans SC（UI）+ IBM Plex Mono（代码/标签）
   - `articles.css` 中的 `--font-sans` 和 `--font-serif` 变量改指向共享变量

5. 文章页增加 theme 支持：在 `articles.js` 中读取 `localStorage.getItem("hiloki-venue-theme")`，给 `<body>` 加上 `data-theme="backstage/showtime"` 属性，让文章页也响应主题切换

**验证：** 从首页点进文章页，字体风格一致，色彩体系可主题切换。Google Fonts 请求从 7 个字体文件减少到 4 个。

---

### [x] 5. 删除 V2 渲染系统的死代码

**现状：** `articles.js` 中包含 `renderHome()` 和 `renderHomeV3()` 两套完整渲染函数，以及 `renderArticlePage()` 和 `renderArticlePageV3()`。实际只用 V3（`data-variant="luxe"`），V2 是死代码。`articles.css` 中也有对应的 V2 样式遗留。

**具体步骤：**

1. 在 `src/scripts/articles.js` 中：
   - 删除 `renderHome()` 函数（约 400+ 行）
   - 删除 `renderArticleCard()` 函数（V2 文章卡片）
   - 删除 `renderProductCard()` 函数（V2 产品卡片）
   - 删除 `renderTalkCard()` 函数（V2 分享卡片）
   - 删除 `renderArchiveListItem()` 函数（V2 列表项）
   - 删除 `renderQrCard()`, `renderContactMiniCard()` 等 V2 辅助函数
   - 删除 `buildLuxeProductCards()`, `heroGridHome()` 等 V2 入口（如果存在）
   - 删除 `renderHomeV3` 等函数名中的 `V3` 后缀，重命名为 `renderHome`, `renderArticlePage` 等
   - 保留所有以 `luxe` 开头的 CSS 类名（别改 class 名，只改函数名）

2. 在 `src/styles/articles.css` 中：
   - 搜索 `hero-grid`, `hero-panel-main`, `hero-wordcloud`, `hero-copy-cluster`, `hero-bottom-row`, `profile-panel`, `hero-link-card`, `hero-stat-panel`, `article-card`, `panel-card`, `archive-list-item`, `qr-card` 等 V2 类名
   - 确认这些类名没有被 V3 使用后，删除对应的 CSS 规则
   - 注意：`.luxe-*` 系列是 V3 的，不要删

**验证：** `npm run build` 成功，`wc -c` 检查 `articles.js` 和 `articles.css` 体积明显减少。在浏览器中浏览文章列表和详情页，功能正常。

---

### [x] 6. 添加 Open Graph / Twitter Card  meta 标签

**现状：** 没有任何社交分享预览标签。

**具体步骤：**

1. 修改 `src/index.html`，在 `<head>` 中增加：
   ```html
   <meta property="og:title" content="HiLoki.ai · Loki Live House">
   <meta property="og:description" content="走进 Loki 的场馆：认识赛博小熊猫 Loki，浏览她的文章、产品、教程、分享与长期创作。">
   <meta property="og:image" content="https://hiloki.ai/assets/images/share-cover.png">
   <meta property="og:url" content="https://hiloki.ai">
   <meta property="og:type" content="website">
   <meta name="twitter:card" content="summary_large_image">
   <meta name="twitter:title" content="HiLoki.ai · Loki Live House">
   <meta name="twitter:image" content="https://hiloki.ai/assets/images/share-cover.png">
   ```

2. 修改 `src/article.html`（因为是 JS 渲染的文章详情，需要在 JS 中动态设置）：
   - 在 `renderArticlePageV3` 中找到文章数据后，用 `document.querySelector('meta[property="og:title"]')` 或 `setAttribute` 动态更新 OG 标签
   - 或者在 `article.html` 的 `<head>` 中预留空的 OG 标签，由 JS 动态填充

**验证：** 用 [opengraph.xyz](https://opengraph.xyz) 或 Twitter Card Validator 检查首页和文章页的预览效果。

---

### [x] 7. favicon 和 PWA 基础

**具体步骤：**

1. 用 `loki-ip-new.png` 生成 favicon：
   ```bash
   # 安装 sharp 后，在构建脚本中：
   sharp('public/assets/images/loki-ip-new.png')
     .resize(32, 32)
     .toFile('dist/favicon.ico')
   sharp('public/assets/images/loki-ip-new.png')
     .resize(180, 180)
     .toFile('dist/apple-touch-icon.png')
   ```

2. 在 `src/index.html` 和 `src/articles.html` / `src/article.html` 的 `<head>` 中增加：
   ```html
   <link rel="icon" href="/favicon.ico" sizes="32x32">
   <link rel="apple-touch-icon" href="/apple-touch-icon.png">
   ```

---

## P2 — 安全 / 构建优化

### [x] 8. 通行码移到环境变量 / 构建配置

**现状：** 提示词工程讲稿的通行码 `"0426"` 硬编码在 `home.js` 和 `articles.js` 中。

**具体步骤：**

1. 在 `wrangler.toml` 或 `.env` 中设置通行码：
   - 对于 Cloudflare Pages，可以用 [环境变量](https://developers.cloudflare.com/pages/configuration/build-configuration/#environment-variables) 或 [Cloudflare Access](https://developers.cloudflare.com/cloudflare-one/applications/) 做真正的前端验证
   - 短期方案：在构建脚本中读取环境变量 `PROTECTED_TALK_CODE`，通过模板注入到生成的 JS 中
   - **更好的方案**：把敏感内容放在 Cloudflare Access 后面，或者用 Cloudflare Workers 做简单的 JWT 验证

2. 如果只是临时保护（正式发布后会移除保护），在 `MIGRATION.md` 中标注「上线前移除前端通行码，改用 Cloudflare Access」

**验证：** 构建后 `grep "0426" dist/assets/scripts/home.js` 不应出现明文密码（或确认已通过环境变量替换）。

---

### [x] 9. CSS 最小化和构建优化

**具体步骤：**

1. 安装 `lightningcss` 或使用 `esbuild` 进行 CSS 压缩：
   ```bash
   npm install lightningcss --save-dev
   ```

2. 在 `scripts/build-site.mjs` 中：
   - 复制 CSS 到 dist 后，用 `lightningcss` 进行 minify
   - 输出为 `.min.css` 或直接覆盖原文件
   - HTML 中引用的 CSS 路径同步更新

3. JS 同理，可以用 `esbuild` 或 `terser` 对 `home.js` 和 `articles.js` 进行 minify

4. HTML 压缩：用 `html-minifier-terser` 对构建输出的 HTML 去除空白和注释

**验证：** 构建后的 CSS 单行无空白。`wc -c` 检查体积减少 30-50%。

---

### [ ] 10. 字体自托管

**现状：** 首页依赖 `fonts.googleapis.com`，国内加载可能极慢或失败。

**具体步骤：**

1. 用 [google-webfonts-helper](https://gwfh.mranftl.com/fonts) 下载需要的字体子集（只下载实际使用的字重）：
   - LXGW WenKai TC: 400, 700
   - Noto Serif SC: 500, 600, 700, 900
   - Noto Sans SC: 400, 500, 600, 700
   - IBM Plex Mono: 400, 500, 600

2. 放置到 `public/assets/fonts/`

3. 新建 `src/styles/fonts.css`，用 `@font-face` 声明本地字体

4. 在 `src/index.html` 中：
   - 删除 Google Fonts 的 `<link>` 标签
   - 改为 `<link rel="stylesheet" href="/assets/styles/fonts.css">`

5. 文章页同理，删除 Manrope + Sora 的 Google Fonts 引用（步骤 4 统一字体后自然完成）

**验证：** 打开首页，Network 面板中对 `fonts.googleapis.com` 的请求为 0。中文字体正常渲染。

---

### [ ] 11. 构建增量复制

**现状：** `build-site.mjs` 每次 `fs.rm(DIST)` 然后全量复制 `public/`。

**具体步骤：**

1. 修改 `build-site.mjs`：
   - 不再每次都 `rm -rf dist`
   - 改为检查文件哈希或 mtime，只复制变更的文件
   - 或者保留 `rm -rf dist` 但用 `fs.cp` 的 `{ filter }` 选项跳过未变更文件
   - 最简方案：如果只是为了开发迭代更快，可以在 `serve.mjs` 中直接从 `src/` 和 `public/` 提供文件，跳过构建步骤，`dist/` 只在需要部署时构建

2. 在 `package.json` 中增加 `"dev:fast": "node scripts/serve.mjs --port 4173 --root src"` 或在 serve.mjs 中增加多 root 支持

---

## P3 — 锦上添花

### [ ] 12. 文章详情页构建时预渲染（同 P0-2 的思路）

对文章详情页做同样的 SSR 处理。可以实现全部文章的静态 HTML 生成，彻底解决 SEO。

### [ ] 13. `<dialog>` 无障碍改进

- 给 `#spotlight-dialog` 添加 `aria-labelledby` 指向标题
- 给 `#ticket-dialog` 同样处理
- 焦点管理：打开 dialog 时 `focus` 第一个可交互元素，关闭时归还焦点

### [ ] 14. `prefers-reduced-motion` 覆盖 `scroll-behavior`

在 `@media (prefers-reduced-motion: reduce)` 中增加：
```css
html { scroll-behavior: auto !important; }
```

---

## 附录：修改文件清单

| 步骤 | 涉及文件 |
|------|---------|
| 1. 拆分 articles-data.js | `scripts/site-data.mjs`, `scripts/build-site.mjs`, `src/scripts/articles.js`, `src/article.html`, `src/articles.html` |
| 2. 首页 SSR | `scripts/render-home.mjs`(新), `scripts/build-site.mjs`, `src/scripts/home.js`, `src/index.html` |
| 3. 图片优化 | `scripts/build-site.mjs` , `src/scripts/home.js`, `src/index.html` |
| 4. 视觉统一 | `src/styles/base.css`(新), `src/styles/articles.css` , `src/index.html`, `src/articles.html`, `src/article.html`, `src/scripts/articles.js` |
| 5. 删除 V2 死代码 | `src/scripts/articles.js`, `src/styles/articles.css` |
| 6. OG 标签 | `src/index.html`, `src/article.html`, `src/scripts/articles.js` |
| 7. favicon | `scripts/build-site.mjs` , `src/index.html`, `src/articles.html`, `src/article.html` |
| 8. 通行码 | `src/scripts/home.js`, `src/scripts/articles.js`, `wrangler.toml` |
| 9. CSS/JS 压缩 | `scripts/build-site.mjs` , `package.json` |
| 10. 字体自托管 | `public/assets/fonts/`(新), `src/styles/fonts.css`(新), `src/index.html`, `src/articles.html`, `src/article.html` |
| 11. 增量构建 | `scripts/build-site.mjs` |

---

**最终目标蓝图：** 首页秒开（< 2s FCP）、文章页按需加载（< 500KB 首屏）、搜索引擎可完整收录、全站视觉一致、图片用 WebP 加载。
