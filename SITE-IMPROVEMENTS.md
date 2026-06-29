# HiLoki.ai 改进清单

> 按优先级排列。**必须修**先做，**可以改进**后做。  
> 每一条都注明了改哪个文件、改什么。

---

## 🔴 P0 — 必须修（先做这几条，影响第一印象）

---

### P0-1｜曲目单海报：换专门设计的海报封面图（最重要）

**问题**  
`/assets/images/setlist/` 里的图片都是产品界面截图（深色 UI、信息密集），放进深色海报卡片里之后，因为亮度接近、`background-size: contain` 留边，几乎看不出内容，用户没有点击欲。

**解法**  
为 6 张海报分别生成专门的封面图。每张图用 **竖幅（900×1125）**，不要放截图，而是放**一句大字 + 品牌色底图**，设计方向如下：

| 项目 | 封面思路 |
|------|---------|
| HiLoki.ai | 「这座场馆本身」，暗色背景 + 大型 L 字母标志 + 场馆灯光氛围 |
| 小熊猫写作 | 「把故事真正写下去」，纸张质感 + 手写字迹 + 熊猫图标 |
| 恋之上上签 | 「刘恋歌词答案书」，粉紫渐变 + 签票样式 + 抒情感 |
| PLEASURE | 「鸟巢全记录」，演唱会光束 + 深蓝 + 观众视角 |
| 球盲嘴替 | 「世界杯 AI 嘴替」，绿色草皮纹理 + 足球元素 + 赛博感 |
| TONIGHT ENCORE | 保持现状（已经最有点击欲，因为有小熊猫图标） |

> 图片换完之后，同步把 `home.js` / `home-template.js` 里 setlist 的 `imageFit` 从 `"contain"` 改为 `"cover"`，让图片铺满卡片。

**涉及文件**
- `/public/assets/images/setlist/*.jpg`（替换图片）
- `src/scripts/home.js` 和 `src/scripts/home-template.js` 里 setlist 数组，每项 `imageFit: "contain"` → `imageFit: "cover"`

---

### P0-2｜专辑墙黑胶唱片不可见

**问题**  
`.vinyl-disc` 的 radial-gradient 颜色和深色背景太接近，在深色模式下唱片效果几乎消失。

**解法**  
在 `src/styles/home.css` 里找到 `.vinyl-disc`，调整 gradient，让唱片纹路和中心亮点更可见：

```css
/* 原来 */
.vinyl-disc {
  background:
    radial-gradient(circle, var(--album-color) 0 7%, #111 7.5% 12%, transparent 12.5%),
    repeating-radial-gradient(circle, #1a1714 0 2px, #050505 3px 5px);
}

/* 改成：提亮唱片纹路，加边缘高光 */
.vinyl-disc {
  background:
    radial-gradient(circle, var(--album-color) 0 7%, #222 7.5% 12%, transparent 12.5%),
    repeating-radial-gradient(circle, #2a2420 0 2px, #0d0a09 3px 5px);
  box-shadow: 0 0 0 1px rgba(255,255,255,0.06), 0 16px 35px rgba(0,0,0,0.35);
}
```

同时给 `.album-card` 加一点背景提亮：

```css
/* 原来 */
.album-card {
  background: var(--surface);
}

/* 改成 */
.album-card {
  background: color-mix(in srgb, var(--surface) 100%, rgba(255,255,255,0.02));
  border: 1px solid var(--line-strong); /* 加强边框，让卡片从背景里"出来" */
}
```

**涉及文件**  
- `src/styles/home.css` → `.vinyl-disc`、`.album-card`

---

## 🟠 P1 — 可以改进（P0 改完再做）

---

### P1-1｜后台走廊：「VIP 包厢」disabled 状态不够明显

**问题**  
`is-disabled` 的门只有 `opacity: 0.4`，没有明显的"锁住"视觉提示，用户点了没反应会以为 bug。

**解法**  
在 CSS 里给 disabled 门加灰色滤镜 + 锁图标提示：

```css
/* home.css 里 .corridor-door-slot.is-disabled .corridor-door 加 */
.corridor-door-slot.is-disabled .corridor-door {
  filter: grayscale(0.85) brightness(0.7);
  cursor: not-allowed;
}
```

另外在 HTML 模板（`home-template.js` 的 corridor 部分）给 disabled 的门追加一个锁字：
在 `.corridor-door` 里加一个元素 `<span class="door-lock" aria-hidden="true">🔒</span>`，CSS 绝对定位到右上角，字体 12px，透明度 0.7。

**涉及文件**  
- `src/styles/home.css` → `.corridor-door-slot.is-disabled .corridor-door`
- `src/scripts/home-template.js` 或 `home.js` → corridor 渲染逻辑

---

### P1-2｜通告栏便利贴：旋转角度太规整

**问题**  
三张便利贴旋转角度 -1.2deg / 1.5deg / -0.4deg，间隔太均匀，看起来像机器排列的，失去手作感。

**解法**  
在 `home.css` 里调整，让角度差距更大、更随机：

```css
/* 原来 */
.press-note:nth-child(1) { transform: rotate(-1.2deg); }
.press-note:nth-child(2) { transform: rotate(1.5deg); }
.press-note:nth-child(3) { transform: rotate(-0.4deg); }

/* 改成 */
.press-note:nth-child(1) { transform: rotate(-2.8deg); }
.press-note:nth-child(2) { transform: rotate(3.2deg); }
.press-note:nth-child(3) { transform: rotate(-1.6deg); margin-top: -15px; } /* 加点高低错落 */
```

同时在每张便利贴上方加一个图钉效果（现有 `::before` 只是个圆点，改大一点、加颜色渐变模拟图钉钉入的立体感）：

```css
.press-note::before {
  width: 11px;
  height: 11px;
  background: radial-gradient(circle at 35% 35%, #c05030, #6b1c0c);
  box-shadow: 0 2px 6px rgba(45, 20, 12, 0.5), inset 0 1px rgba(255,160,120,0.3);
}
```

**涉及文件**  
- `src/styles/home.css` → `.press-note:nth-child(n)`、`.press-note::before`

---

### P1-3｜Headliner 底部统计数据悬浮感太强

**问题**  
`.headliner-stats` 里的 155/5+/∞ 三个数字直接漂在背景上，没有容器，和上下文脱节。

**解法**  
在 `.headliner-stats` 加一个微弱的分割线或背景胶囊：

```css
.headliner-stats {
  padding-top: 22px;
  border-top: 1px solid var(--line);
  margin-top: 28px; /* 从现有的 32px 调整，确保有呼吸感 */
}
```

这样三个数据有了"归属感"，不会像漂在空中。

**涉及文件**  
- `src/styles/home.css` → `.headliner-stats`

---

## 🟡 P2 — 锦上添花（时间够了再做）

---

### P2-1｜曲目单：海报悬停效果可以加文字高亮

现在 hover 只有卡片上浮 + 橙色光束，可以额外让 `.poster-bottom h3` 在 hover 时颜色从 `#fff5e7` 变成纯白，点击欲更强：

```css
.show-poster:hover .poster-bottom h3 {
  color: #ffffff;
  text-shadow: 0 0 18px rgba(255,255,255,0.2);
}
```

---

### P2-2｜专辑墙：专辑封面图片的混合模式

`.album-cover img` 现在是 `mix-blend-mode: luminosity`，把图片颜色都洗掉了，只剩亮度。如果换成 `mix-blend-mode: multiply` 或者直接去掉，会让专辑封面颜色更明显。具体效果需要在浏览器里对比。

---

## 关于构建和部署

所有改动在 `src/` 里完成之后，需要运行构建命令生成 `dist/`，再推送 Cloudflare Pages。查看 `package.json` 里的 build 命令确认流程。

---

*生成时间：2026-06-28 | 基于 preview.hiloki-ai-4t0.pages.dev 截图分析*
