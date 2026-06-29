# HiLoki.ai / Loki Live House 迁移记录

## 当前目标

- 新仓库：`/Users/kude/Documents/新的hiloki.ai`
- 输出目录：`dist/`
- 技术结构：静态 HTML + CSS + JavaScript + Node.js 构建脚本
- 目标托管：Cloudflare Pages
- 本阶段不执行线上部署

## 迁移来源

### V5 首页

- `/Users/kude/Downloads/.cola/hiloki-deploy-20260420/index.html`
- `/Users/kude/Downloads/.cola/hiloki-deploy-20260420/home-v5.css`
- `/Users/kude/Downloads/.cola/hiloki-deploy-20260420/home-v5.js`

### 文章系统

- `/Users/kude/Downloads/.cola/hiloki-deploy-20260420/articles.html`
- `/Users/kude/Downloads/.cola/hiloki-deploy-20260420/article.html`
- `/Users/kude/Downloads/.cola/hiloki-deploy-20260420/app.js`
- `/Users/kude/Downloads/.cola/hiloki-deploy-20260420/styles.css`
- `/Users/kude/Downloads/.cola/hiloki-deploy-20260420/articles-data.js`

完整文章数据仅由文章页加载。构建时会移除无法随 MVP 携带的本地正文图片引用，并使用统一封面回退；不会复制 `wechat-cache/` 或 7.4GB 历史素材。

## 首页资源映射

| 新路径 | 来源 |
| --- | --- |
| `/assets/images/avatar.jpg` | `头像.jpg` |
| `/assets/images/qr-official.jpg` | `公众号二维码.jpg` |
| `/assets/images/qr-wechat.jpg` | `微信二维码.jpg` |
| `/assets/images/qr-xiaohongshu.jpg` | `小红书二维码.jpg` |
| `/assets/images/share-cover.png` | `分享封面.png` |
| `/assets/images/articles/dev-story.png` | `generated-previews/articles/当一个文科生决定去做开发-结果.png` |
| `/assets/images/products/prompt-factory.jpg` | `generated-previews/products/ai-测评提示词工厂.jpg` |
| `/assets/images/products/image-toolbox.png` | `generated-previews/products/loki-s-multi-functional-image-toolbox.png` |
| `/assets/images/products/image-compressor.png` | `generated-previews/products/妙搭应用.png` |
| `/assets/images/products/wechat-editor.jpg` | `generated-previews/products/微信公众号排版编辑器.jpg` |
| `/assets/images/products/fortune.png` | `generated-previews/products/小能苗气运指南.png` |

## 路由

- `/`：Loki Live House V5 首页
- `/articles`：文章列表
- `/article?slug=...`：文章详情
- `/articles.html`：兼容旧入口
- `/article.html?slug=...`：兼容旧入口
- `/prompt-factory.html`：本阶段保留入口，完整产品待独立恢复
- `/talks/ai-material-engineering-talk/`：本阶段保留入口，完整讲稿待独立恢复

## 数据分层

- 首页：`/assets/data/site-index.js`，只含轻量文章索引、5 个公开产品、3 条 Talks、联系信息和统计。
- 文章页：`/assets/data/articles-data.js`，保留完整正文 HTML，但不携带旧缓存目录。

## 后续待办

- 恢复文章正文图片到对象存储或独立静态资源层。
- 恢复 AI 测评提示词工厂完整页面。
- 恢复 AI 生图提示词工程完整讲稿和下载资源。
- 通行码已从 `home.js` 明文移到构建配置：本地可用 `PROTECTED_TALK_CODE=... npm run build` 生成 `dist/assets/data/site-config.js`；正式上线仍建议升级为 Cloudflare Access、Worker 或服务端校验。
- 增加正式预览部署检查，再决定域名切换。
