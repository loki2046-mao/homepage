# HiLoki.ai · Cloudflare Pages 部署前检查清单

> 只用于部署前自检。当前阶段不要直接发布正式域名。

## 本地必跑检查

```bash
npm run check
npm run preflight:pages
npm run preview
```

打开本地预览：

```text
http://127.0.0.1:4173/
```

重点确认：

- 首页不加载完整 `articles-data.js`
- `/articles` 可打开
- `/article?slug=...` 可打开
- `/articles.html` 和 `/article.html?slug=...` 旧入口可用
- 390px 宽度无横向滚动
- Light Switch、Ticket Machine、Album 搜索、后台门交互可用

## Cloudflare Pages 项目配置

推荐使用 Pages 静态站点：

```text
Project name: hiloki-ai
Build command: npm run build
Build output directory: dist
Node version: >= 20
```

当前 `wrangler.toml` 已声明：

```toml
name = "hiloki-ai"
pages_build_output_dir = "./dist"
```

## Pages 静态规则

源码规则位于：

- `public/_headers`
- `public/_redirects`

构建后会输出到：

- `dist/_headers`
- `dist/_redirects`

当前兼容规则：

```text
/index.html / 301
/articles.html /articles 301
/article.html /article 301
```

> Cloudflare Pages 通常会保留原 query string，所以 `/article.html?slug=...` 会进入 `/article?slug=...`。

## 环境变量

当前通行码不是安全保护，只是前端临时门禁。若仍需临时启用：

```bash
PROTECTED_TALK_CODE=你的通行码 npm run build
```

正式发布前更建议使用 Cloudflare Access / Worker / 服务端校验。

## 预览部署命令模板

仅在明确要创建 Cloudflare 预览部署时使用，不要直接当作正式发布：

```bash
npx wrangler whoami
npx wrangler pages deploy ./dist --project-name=hiloki-ai --branch=preview
```

正式上线前不要绑定或切换 `hiloki.ai` 域名。

## 正式发布前最后确认

- `npm run preflight:pages` 通过
- 无未记录的大文件或缓存目录
- `dist/assets/data/site-index.js` 小于 1MB
- `dist/assets/data/articles-data.js` 不包含正文 HTML
- `dist/data/posts/` 有 155 个 JSON
- 首页核心图片无 404
- `PROTECTED_TALK_CODE` 或 Cloudflare Access 策略已确认
- 预览部署人工检查通过后，再考虑域名切换
