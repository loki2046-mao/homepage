# HiLoki.ai · 人工验收清单

> 用于 Cloudflare preview 之前的最后人工检查。不要在这一步切正式域名。

## 先跑自动检查

```bash
npm run check
npm run preflight:pages
npm run preview
```

另开一个终端，保持 preview 运行，再跑：

```bash
NODE_PATH=/Users/kude/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules npm run smoke:local
```

## 浏览器人工检查

打开：

```text
http://127.0.0.1:4173/
```

### 1. 首屏

- [ ] 首屏不是纯 HTML 原始样式
- [ ] Headliner 主视觉、头像、小熊猫形象正常显示
- [ ] 点击头像，头像能翻转到二维码；再次点击能翻回
- [ ] 顶部导航和取票按钮视觉正常

### 2. Light Switch

- [ ] 点击 `HOUSE LIGHT`，主题从 Backstage / Showtime 切换
- [ ] 切换过程中没有明显闪白或布局跳动
- [ ] 刷新后主题状态符合预期

### 3. Setlist

- [ ] 6 张横向海报卡正常显示
- [ ] 点击任意卡片，先打开聚光灯弹窗
- [ ] 弹窗里的图片完整可见，不被强裁切
- [ ] 弹窗按钮链接符合预期

### 4. Album Wall

- [ ] 专辑墙分类能显示
- [ ] 切换“曲目总表”正常
- [ ] 搜索关键词 `AI` 后，自动进入曲目总表并过滤结果
- [ ] 点击任意文章能进入 `/article?slug=...`

### 5. Press Call

- [ ] 3 条通告正常显示
- [ ] 普通通告能打开弹窗
- [ ] 受保护通告在未配置通行码时给出明确提示
- [ ] 没有把通行码明文写在页面源码里

### 6. Rehearsal Room

- [ ] 12 个踏板正常显示
- [ ] 默认状态下踏板灯不亮，hover/focus 后才亮
- [ ] 点击踏板后打开详情弹窗
- [ ] 产品型踏板出现产品/GitHub/相关入口，不是全部跳公众号

### 7. Backstage Corridor

- [ ] 点击 DOOR 01 不发生锚点滚动，而是门动画打开
- [ ] 点击「← 返回走廊」后门关闭，走廊恢复
- [ ] DOOR 02 排练室同样正常
- [ ] 390px 手机宽度下，房间以全屏 overlay 打开

### 8. Articles

打开：

```text
http://127.0.0.1:4173/articles
```

- [ ] 列表页加载正常
- [ ] 每页 10 篇
- [ ] 搜索/分类/分页正常
- [ ] 无横向滚动

### 9. Article detail

从列表点一篇文章：

- [ ] URL 是 `/article?slug=...`
- [ ] 正文能加载
- [ ] 封面在 390px 下不撑出横向滚动
- [ ] OG 标题/描述能动态变成当前文章

兼容旧入口：

```text
http://127.0.0.1:4173/articles.html
http://127.0.0.1:4173/article.html?slug=天呐-我好像爱上我的ai了
```

- [ ] 本地静态服务能打开
- [ ] Cloudflare Pages 上会通过 `_redirects` 归一到新路径

### 10. 移动端

用浏览器设备模拟 390px 宽：

- [ ] 首页无横向滚动
- [ ] 头像 halo 不溢出
- [ ] Ticket Machine 可关闭
- [ ] Backstage overlay 可返回
- [ ] 文章详情无横向滚动

## 若准备创建 Cloudflare preview

只在上面全部通过后再执行：

```bash
npx wrangler whoami
npx wrangler pages deploy ./dist --project-name=hiloki-ai --branch=preview
```

不要在 preview 验收前切换正式域名。
