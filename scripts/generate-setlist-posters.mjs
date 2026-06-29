import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const OUT_DIR = path.join(ROOT, "public/assets/images/setlist");
const LOKI_ICON = path.join(ROOT, "public/assets/images/loki-ip-new.png");

const width = 900;
const height = 1125;

function esc(value) {
  return String(value || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function textLines(lines, { x, y, size, gap = 1.08, family = "display", fill = "#fff3e4", weight = 900, anchor = "start", opacity = 1, letterSpacing = "-0.05em" }) {
  const fontFamily =
    family === "mono"
      ? `"IBM Plex Mono", "SFMono-Regular", monospace`
      : family === "serif"
        ? `"Noto Serif SC", "Songti SC", serif`
        : `"Noto Serif SC", "PingFang SC", "Heiti SC", serif`;
  return lines
    .map(
      (line, index) =>
        `<text x="${x}" y="${y + index * size * gap}" text-anchor="${anchor}" fill="${fill}" opacity="${opacity}" font-size="${size}" font-weight="${weight}" letter-spacing="${letterSpacing}" font-family='${fontFamily}'>${esc(line)}</text>`,
    )
    .join("\n");
}

function posterSvg({
  title,
  subtitle,
  kicker,
  palette,
  lines,
  bigMark,
  background,
  foreground = "",
  icon = false,
}) {
  const [a, b, c, d] = palette;
  return `
  <svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
    <defs>
      <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="${a}"/>
        <stop offset="45%" stop-color="${b}"/>
        <stop offset="100%" stop-color="${c}"/>
      </linearGradient>
      <radialGradient id="glow" cx="50%" cy="18%" r="70%">
        <stop offset="0%" stop-color="${d}" stop-opacity=".72"/>
        <stop offset="54%" stop-color="${d}" stop-opacity=".15"/>
        <stop offset="100%" stop-color="${d}" stop-opacity="0"/>
      </radialGradient>
      <pattern id="grain" width="54" height="54" patternUnits="userSpaceOnUse">
        <circle cx="5" cy="8" r="1" fill="#fff" opacity=".09"/>
        <circle cx="24" cy="31" r="1.2" fill="#fff" opacity=".05"/>
        <circle cx="44" cy="18" r=".8" fill="#000" opacity=".12"/>
        <path d="M0 53.5H54" stroke="#fff" opacity=".035"/>
      </pattern>
      <filter id="soft" x="-20%" y="-20%" width="140%" height="140%">
        <feGaussianBlur stdDeviation="18"/>
      </filter>
    </defs>
    <rect width="900" height="1125" fill="url(#bg)"/>
    <rect width="900" height="1125" fill="url(#glow)"/>
    <rect width="900" height="1125" fill="url(#grain)"/>
    <path d="M-80 930 C180 815 378 910 610 770 C746 688 850 622 996 646 L996 1220 L-80 1220 Z" fill="#000" opacity=".2"/>
    <text x="450" y="590" text-anchor="middle" fill="#fff" opacity=".075" font-size="560" font-weight="900" letter-spacing="-.08em" font-family='"Noto Serif SC", "PingFang SC", serif'>${esc(bigMark)}</text>
    ${background}
    <rect x="48" y="48" width="804" height="1029" fill="none" stroke="#fff" stroke-opacity=".16"/>
    <rect x="70" y="70" width="760" height="985" fill="none" stroke="#fff" stroke-opacity=".07" stroke-dasharray="10 12"/>
    <text x="86" y="116" fill="#ffe1b7" opacity=".88" font-size="22" font-weight="600" letter-spacing=".18em" font-family='"IBM Plex Mono", monospace'>${esc(kicker)}</text>
    <text x="814" y="116" text-anchor="end" fill="#ffe1b7" opacity=".72" font-size="22" font-weight="600" letter-spacing=".16em" font-family='"IBM Plex Mono", monospace'>LOKI LIVE HOUSE</text>
    ${textLines(lines, { x: 86, y: 730, size: 92, gap: 1.02 })}
    <text x="86" y="944" fill="#fff0dd" opacity=".86" font-size="30" font-weight="600" letter-spacing=".02em" font-family='"Noto Serif SC", "PingFang SC", serif'>${esc(title)}</text>
    <text x="86" y="998" fill="#ffe1b7" opacity=".76" font-size="22" letter-spacing=".05em" font-family='"Noto Serif SC", "PingFang SC", serif'>${esc(subtitle)}</text>
    ${foreground}
    ${icon ? `<image href="data:image/png;base64,${icon}" x="610" y="700" width="210" height="210" opacity=".94"/>` : ""}
  </svg>`;
}

const lokiIcon = await fs.readFile(LOKI_ICON, "base64");

const posters = [
  {
    file: "hiloki-home.jpg",
    svg: posterSvg({
      title: "HiLoki.ai",
      subtitle: "个人主页 · 内容仓库 · 场馆入口",
      kicker: "HOME SHOW",
      palette: ["#100c0a", "#271611", "#0a0807", "#c76a38"],
      lines: ["这座", "场馆", "本身"],
      bigMark: "L",
      background: `
        <path d="M106 675 L328 166 L418 675" fill="none" stroke="#f0a15e" stroke-width="5" opacity=".35"/>
        <path d="M568 675 L706 172 L804 675" fill="none" stroke="#75aeb9" stroke-width="4" opacity=".22"/>
        <ellipse cx="450" cy="770" rx="276" ry="48" fill="#ff9d5b" opacity=".13" filter="url(#soft)"/>
      `,
      icon: lokiIcon,
    }),
  },
  {
    file: "inkpanda.jpg",
    svg: posterSvg({
      title: "小熊猫写作",
      subtitle: "长篇写作平台 · 把故事真正写下去",
      kicker: "LIVE PRODUCT",
      palette: ["#f1e4c6", "#b6794e", "#281912", "#e0bd77"],
      lines: ["把故事", "真正", "写下去"],
      bigMark: "稿",
      background: `
        <rect x="150" y="160" width="560" height="610" rx="16" fill="#fff9e8" opacity=".22" transform="rotate(-4 430 465)"/>
        <path d="M204 250 C330 236 455 252 610 230 M190 330 C370 318 493 336 668 314 M175 412 C322 402 518 422 646 397 M192 496 C370 480 475 508 656 485" fill="none" stroke="#4f2a1c" stroke-width="6" stroke-linecap="round" opacity=".28"/>
        <path d="M190 848 C290 790 330 840 408 796 C470 760 512 780 586 740" fill="none" stroke="#fff7df" stroke-width="7" stroke-linecap="round" opacity=".38"/>
      `,
      icon: lokiIcon,
    }),
  },
  {
    file: "lian.jpg",
    svg: posterSvg({
      title: "恋之上上签",
      subtitle: "刘恋歌词答案书 · 44 首歌 147 句",
      kicker: "SIDE PROJECT",
      palette: ["#3b1c3e", "#b56a98", "#f0d4d7", "#fff0f6"],
      lines: ["刘恋", "歌词", "答案书"],
      bigMark: "签",
      background: `
        <rect x="204" y="180" width="492" height="122" rx="61" fill="#fff5fb" opacity=".22" transform="rotate(-7 450 241)"/>
        <rect x="258" y="346" width="384" height="118" rx="59" fill="#fff5fb" opacity=".18" transform="rotate(5 450 405)"/>
        <path d="M176 614 C306 520 396 686 522 590 C616 520 680 548 762 490" fill="none" stroke="#fff" stroke-width="5" stroke-linecap="round" opacity=".3"/>
      `,
      foreground: `<text x="450" y="270" text-anchor="middle" fill="#fff" opacity=".72" font-size="34" font-family='"Noto Serif SC", serif'>上上签</text>`,
    }),
  },
  {
    file: "pleasure.jpg",
    svg: posterSvg({
      title: "PLEASURE",
      subtitle: "鸟巢演唱会全记录 · 服装、装置与飞马",
      kicker: "LIVE ARCHIVE",
      palette: ["#061325", "#142e55", "#06080f", "#82b2ff"],
      lines: ["鸟巢", "全记录"],
      bigMark: "LIVE",
      background: `
        <path d="M96 850 C240 720 360 734 450 660 C552 574 680 580 810 476" fill="none" stroke="#c6d8ff" stroke-width="4" opacity=".28"/>
        <path d="M118 200 L322 760 M450 160 L450 760 M782 190 L578 760" stroke="#9dc6ff" stroke-width="7" stroke-linecap="round" opacity=".22"/>
        <g opacity=".34">
          <circle cx="188" cy="850" r="7" fill="#fff"/>
          <circle cx="242" cy="822" r="5" fill="#fff"/>
          <circle cx="704" cy="832" r="6" fill="#fff"/>
          <circle cx="744" cy="782" r="4" fill="#fff"/>
        </g>
      `,
    }),
  },
  {
    file: "qiumang.jpg",
    svg: posterSvg({
      title: "球盲嘴替",
      subtitle: "世界杯 AI 嘴替 · 零服务端实验",
      kicker: "VIBE CODING",
      palette: ["#082c18", "#1f7a42", "#07110b", "#88f0a5"],
      lines: ["世界杯", "AI", "嘴替"],
      bigMark: "GOAL",
      background: `
        <path d="M80 250 H820 M80 390 H820 M80 530 H820 M80 670 H820 M80 810 H820" stroke="#d8ffe4" stroke-width="2" opacity=".08"/>
        <circle cx="686" cy="284" r="84" fill="none" stroke="#f6fff6" stroke-width="10" opacity=".32"/>
        <path d="M650 232 L724 232 L748 304 L686 350 L624 304 Z" fill="none" stroke="#f6fff6" stroke-width="8" opacity=".28"/>
        <rect x="82" y="206" width="736" height="660" fill="none" stroke="#d8ffe4" stroke-width="5" opacity=".16"/>
      `,
      icon: lokiIcon,
    }),
  },
  {
    file: "tonight-encore.jpg",
    svg: posterSvg({
      title: "TONIGHT ENCORE",
      subtitle: "最近一篇文章 · 每次更新自动换场",
      kicker: "TONIGHT ENCORE",
      palette: ["#1c120d", "#66351f", "#120c0a", "#ffbd67"],
      lines: ["今晚", "加演"],
      bigMark: "新",
      background: `
        <rect x="134" y="172" width="632" height="410" rx="34" fill="#1a0d08" opacity=".45" stroke="#ffbf72" stroke-opacity=".28"/>
        <path d="M188 610 C300 548 400 640 510 574 C610 515 678 558 760 502" fill="none" stroke="#ffd08d" stroke-width="6" stroke-linecap="round" opacity=".34"/>
        <circle cx="704" cy="220" r="46" fill="#ffbd67" opacity=".25"/>
      `,
      icon: lokiIcon,
    }),
  },
];

await fs.mkdir(OUT_DIR, { recursive: true });

for (const poster of posters) {
  const output = path.join(OUT_DIR, poster.file);
  await sharp(Buffer.from(poster.svg)).jpeg({ quality: 90, mozjpeg: true }).toFile(output);
  const metadata = await sharp(output).metadata();
  console.log(`${poster.file}: ${metadata.width}x${metadata.height}`);
}
