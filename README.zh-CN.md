# HTML Anything

> **Markdown 是草稿, HTML 才是给人读的成品 —— 让本地 agent 直接写 HTML。** Agent 时代的 HTML 编辑器 —— 既然你已经不亲手改文档、全都让 Claude 改了, 那 agent 的输出就该是读者真正想看的 HTML, 而不是中间态的 markdown。本地优先、零 API Key、复用你已经登录好的 CLI session —— **8 个 coding-agent CLI** 在 `PATH` 上自动识别（Claude Code · Cursor Agent · Codex · Gemini CLI · GitHub Copilot CLI · OpenCode · Qwen Coder · Aider），驱动 **75 套 skill 模板** 和 **9 类可交付场景**（杂志文章 · Keynote PPT · 简历 · 海报 · 小红书 · 推特卡 · Web 原型 · 数据报告 · Hyperframes 视频）。一键复制到公众号 / 推特 / 知乎，或者下载 `.html` / `.png`。

<p align="center">
  <img src="docs/assets/banner.png" alt="HTML Anything — agent 时代的 HTML 编辑器，在你的笔记本上" width="100%" />
</p>

<p align="center">
  <a href="LICENSE"><img alt="License" src="https://img.shields.io/badge/license-Apache%202.0-blue.svg?style=flat-square" /></a>
  <a href="#-自动识别本地-agent"><img alt="Agents" src="https://img.shields.io/badge/agents-8%20CLIs-black?style=flat-square" /></a>
  <a href="#-skills"><img alt="Skills" src="https://img.shields.io/badge/skills-75-orange?style=flat-square" /></a>
  <a href="#一键发布到平台"><img alt="Export" src="https://img.shields.io/badge/export-WeChat%20%C2%B7%20X%20%C2%B7%20Zhihu%20%C2%B7%20PNG-9b59b6?style=flat-square" /></a>
  <a href="#-30-秒上手"><img alt="Quickstart" src="https://img.shields.io/badge/quickstart-30%20seconds-green?style=flat-square" /></a>
  <a href="#架构"><img alt="No API key" src="https://img.shields.io/badge/no-API%20key%20required-ff6b35?style=flat-square" /></a>
</p>

<!-- 本项目站在 nexu-io/open-design 的肩膀上 — 下面这一行的社群标签都指向它,顺道带流量。 -->
<p align="center">
  <a href="https://github.com/nexu-io/open-design#community"><img alt="Discord（open-design）" src="https://img.shields.io/badge/discord-join-5865f2?style=flat-square&logo=discord&logoColor=white" /></a>
  <a href="https://x.com/nexudotio"><img alt="X 关注 @nexudotio" src="https://img.shields.io/badge/follow-%40nexudotio-000000?style=flat-square&logo=x&logoColor=white" /></a>
  <a href="https://github.com/nexu-io/open-design/releases/latest"><img alt="open-design 最新版本" src="https://img.shields.io/github/v/release/nexu-io/open-design?style=flat-square&label=release&color=8e44ad" /></a>
  <a href="https://github.com/nexu-io/open-design/graphs/commit-activity"><img alt="open-design 月提交数" src="https://img.shields.io/github/commit-activity/m/nexu-io/open-design?style=flat-square&label=commits%2Fmonth&color=f39c12" /></a>
  <a href="#-看看效果"><img alt="设计系统" src="https://img.shields.io/badge/design%20systems-9-1abc9c?style=flat-square" /></a>
  <a href="https://github.com/nexu-io/open-design"><img alt="基于 open-design" src="https://img.shields.io/badge/built%20on-nexu--io%2Fopen--design-ff7043?style=flat-square&logo=github&logoColor=white" /></a>
</p>

<p align="center"><a href="README.md">English</a> · <b>简体中文</b></p>

---

## 🎨 看看效果

picker 顶部 **推荐 / Featured** 分组里默认置顶的 8 个 skill —— 对应 `SKILL.md` frontmatter 里的 `recommended:` 字段,数字越小排得越靠前。每个都附 `example.html`,repo 里双击就能看效果,不用登录、不用启服。

<table>
<tr>
<td width="50%" valign="top">
<a href="src/lib/templates/skills/deck-guizang-editorial/"><img src="docs/screenshots/skills/deck-guizang-editorial.png" alt="deck-guizang-editorial" /></a><br/>
<sub><b><a href="src/lib/templates/skills/deck-guizang-editorial/"><code>deck-guizang-editorial</code></a></b> · <i>deck</i> · <code>recommended: 1</code><br/>编辑墨水 PPT,灵感来自 <a href="https://github.com/op7418/guizang-ppt-skill"><code>op7418/guizang-ppt-skill</code></a> —— 10 套锁死版面 × 5 套调色板(墨水 / 靛蓝瓷 / 森林墨 / 牛皮纸 / 沙丘),纸感印刷质感,开起来像一本电子杂志而不是 PPT。</sub>
</td>
<td width="50%" valign="top">
<a href="src/lib/templates/skills/deck-swiss-international/"><img src="docs/screenshots/skills/deck-swiss-international.png" alt="deck-swiss-international" /></a><br/>
<sub><b><a href="src/lib/templates/skills/deck-swiss-international/"><code>deck-swiss-international</code></a></b> · <i>deck</i> · <code>recommended: 2</code><br/>瑞士国际主义 PPT —— 16 列网格 + 单一饱和 accent(Klein Blue / Lemon / Mint / Safety Orange),22 套锁死版面。冷静、理性、学院派,开会时让人觉得 "这一定是 designer 做的"。</sub>
</td>
</tr>
<tr>
<td width="50%" valign="top">
<a href="src/lib/templates/skills/doc-kami-parchment/"><img src="docs/screenshots/skills/doc-kami-parchment.png" alt="doc-kami-parchment" /></a><br/>
<sub><b><a href="src/lib/templates/skills/doc-kami-parchment/"><code>doc-kami-parchment</code></a></b> · <i>doc</i> · <code>recommended: 3</code><br/>暖羊皮纸 + 墨蓝单色 editorial 文档系统,灵感来自 <a href="https://github.com/tw93/kami"><code>tw93/kami</code></a>。<code>#f5f4ed</code> 底色 + 单一衬线字体,长报告、读书笔记、one-pager、简历都能套,比纯白 markdown 高一个量级。</sub>
</td>
<td width="50%" valign="top">
<a href="src/lib/templates/skills/magazine-poster/"><img src="docs/screenshots/skills/magazine-poster.png" alt="magazine-poster" /></a><br/>
<sub><b><a href="src/lib/templates/skills/magazine-poster/"><code>magazine-poster</code></a></b> · <i>poster</i> · <code>recommended: 4</code><br/>报纸风长图海报 —— 巨字 serif headline + 双栏正文 + 6 个编号小节 + cream 纸感底色,开起来像一份印好的 Sunday paper,不是网页。</sub>
</td>
</tr>
<tr>
<td width="50%" valign="top">
<a href="src/lib/templates/skills/video-hyperframes/"><img src="docs/screenshots/skills/video-hyperframes.png" alt="video-hyperframes" /></a><br/>
<sub><b><a href="src/lib/templates/skills/video-hyperframes/"><code>video-hyperframes</code></a></b> · <i>frame / video</i> · <code>recommended: 5</code><br/>Hyperframes / Remotion 兼容的视频脚本 —— 6–10 个连续 <code>1920×1080</code> 帧,自带 duration / transition 注释和自动播放脚本。直接交给 <a href="https://github.com/heygen-com/hyperframes"><code>heygen-com/hyperframes</code></a> 或 Remotion 渲 <code>.mp4</code>。</sub>
</td>
<td width="50%" valign="top">
<a href="src/lib/templates/skills/frame-glitch-title/"><img src="docs/screenshots/skills/frame-glitch-title.png" alt="frame-glitch-title" /></a><br/>
<sub><b><a href="src/lib/templates/skills/frame-glitch-title/"><code>frame-glitch-title</code></a></b> · <i>frame</i> · <code>recommended: 6</code><br/>故障艺术标题帧 —— cyan / magenta 像散偏移 + CRT 扫描线 + 数据腐败副标 + 角落 ASCII 噪点。Cyberpunk hero 或视频转场用。</sub>
</td>
</tr>
<tr>
<td width="50%" valign="top">
<a href="src/lib/templates/skills/vfx-text-cursor/"><img src="docs/screenshots/skills/vfx-text-cursor.png" alt="vfx-text-cursor" /></a><br/>
<sub><b><a href="src/lib/templates/skills/vfx-text-cursor/"><code>vfx-text-cursor</code></a></b> · <i>vfx</i> · <code>recommended: 7</code><br/>VFX 文字光标开场 —— 光标在画布上"打字",每个字带 hot pink × cyan 像散拖尾 + 定向光斑。丢一句金句进去,就是电影级的视频片头。</sub>
</td>
<td width="50%" valign="top">
<a href="src/lib/templates/skills/frame-logo-outro/"><img src="docs/screenshots/skills/frame-logo-outro.png" alt="frame-logo-outro" /></a><br/>
<sub><b><a href="src/lib/templates/skills/frame-logo-outro/"><code>frame-logo-outro</code></a></b> · <i>frame</i> · <code>recommended: 8</code><br/>品牌 Logo 收尾帧 —— Logo 分块装配 + glow bloom + tagline 上浮 + CTA。产品发布或品牌片的片尾闭幕镜头。</sub>
</td>
</tr>
</table>

完整 skill 目录(按 mode 分类)见下方 [🎨 Skills](#-skills) 章节。

## 🤔 为什么做这个？

[Claude Code 团队成员发了一条推](https://x.com/trq212/status/2052809885763747935)：他们**已经不用 markdown 写文档了，全部改成 HTML**。理由很简单 ——

| Markdown | HTML |
|---|---|
| 给作者爽 | 给读者爽 |
| 排版受模板限制 | 排版无限自由 |
| 截图发推丑得离谱 | 直接是好看的图 |
| 二次粘贴公众号要重排 | 一键格式转换 |

**HTML 是面向人的最终形态，Markdown 只是一段写作中的中间过程。**

但 "写 HTML" 在过去意味着写 CSS、调字号、对齐网格、做响应式 —— 普通用户不会，设计师懒得，作者更没耐心。我们做的事情，是让 **AI 在你按下 ⌘+Enter 之后**，把任何输入（Markdown / CSV / Excel / JSON / SQL / 草稿…）**立刻**变成一份**可交付**的 HTML，然后一键去到公众号 / 推特 / 知乎 / 任何地方。所谓 "可交付"：生成完就是受众实际看到的样子，不再需要 "我先这样、待会再调"。

我们站在四个开源项目的肩膀上：

- [**`nexu-io/open-design`**](https://github.com/nexu-io/open-design) —— Agent 检测层 + 设计 system 思路 + Skills protocol；本仓库的 `src/lib/agents/` 和 `src/lib/templates/skills/*` 直接借鉴这套模型。
- [**`mdnice/markdown-nice`**](https://github.com/mdnice/markdown-nice) —— `juice` 内联 CSS、公众号 / 知乎兼容粘贴的可行性证明。
- [**`gcui-art/markdown-to-image`**](https://github.com/gcui-art/markdown-to-image) —— iframe → 高 DPI PNG 的截图导出路径。
- [**`alchaincyf/huashu-md-html`**](https://github.com/alchaincyf/huashu-md-html) —— 反 AI-slop 的话术 / 设计哲学，对应我们模板里的硬约束（中文优先字体、8px 基线网格、对比 ≥ 4.5、必须用真实数据）。

## 一览

| | 你会拿到什么 |
|---|---|
| **本地 coding-agent CLI（8 个）** | Claude Code · Cursor Agent · OpenAI Codex · Gemini CLI · GitHub Copilot CLI · OpenCode · Qwen Coder · Aider —— 启动时扫描 `PATH`（含 `~/.local/bin` · `~/.bun/bin` · `/opt/homebrew/bin` · `~/.npm-global/bin` 这些 GUI 启动会漏掉的目录），顶栏一键切换。 |
| **零 API Key** | 直接复用你已经在终端登录好的 `claude login` · `cursor login` · `gemini auth` session。订阅复用 = **0 边际成本**。 |
| **Skill 模板（75 套）** | `prototype`（web / SaaS landing / dashboard / 数据报告） · `deck`（20 套 keynote PPT，含 Swiss International、Guizang Editorial、XHS Pastel、Hermes Cyber、Replit、Magazine Web 等） · `frame`（10 套 Hyperframes 视频帧：液态背景、NYT 数据图表、贴纸流程图、像素故障字幕、电影漏光、macOS 通知、品牌片尾…） · `social`（X / 小红书 / Spotify / Reddit 卡片） · `office`（PM 规格书 · 工程 runbook · 财务报告 · HR onboarding · 发票 · OKR · 周报 · 会议纪要 · 看板） · `doc`（Kami 暖羊皮纸 editorial） · `mockup`（3D 设备模型） · `vfx`（文本光标）。 |
| **9 类输出场景** | 📖 杂志文章 · 🎬 Keynote PPT · 📄 极简简历 · 🖼️ 营销海报 · 📱 小红书图文卡 · 🐦 推特分享卡 · 🛠️ Web 产品原型 · 📊 数据可视化报告 · 🎞️ Hyperframes 视频。每一类都有可挑选的具体 skill。 |
| **一键发布** | `juice` 内联 CSS → 公众号粘贴 0 调整 · `modern-screenshot` 2× PNG → 拖入推文 · `<mjx-container>` → `data-eeimg` 占位 → 知乎公式自动渲染 · 单文件 `.html` 下载 · 高 DPI `.png` 下载。 |
| **流式渲染** | `POST /api/convert` 走 SSE，agent stdout 的 JSON-line 流式抽出 text → 客户端 append → iframe `srcdoc` 实时刷新。等待时间 = 看 AI 现场写代码的体验。 |
| **沙箱预览** | `iframe[sandbox="allow-scripts allow-same-origin"]`，用户 HTML 隔离运行，宿主页面不受污染。 |
| **格式自动识别** | 编辑器一栏，粘 Markdown / CSV / TSV / JSON / SQL / 纯文本都识别，`papaparse` + `xlsx` 在浏览器端解析，不上传服务器。 |
| **部署** | 本地 `pnpm dev` / Vercel 一键部署 web 层（agent 永远跑在本地）。 |
| **License** | Apache-2.0 |

## Demo

<table>
<tr>
<td width="50%">
<img src="docs/screenshots/01-entry-view.png" alt="01 · 主界面" /><br/>
<sub><b>主界面</b> —— 顶栏自动识别你已装的 CLI，左侧粘内容，中间挑模板和设计 system，右侧 iframe 实时预览。同一个面板搞定杂志、PPT、海报、Web 原型、Hyperframes 帧脚本。</sub>
</td>
<td width="50%">
<img src="docs/screenshots/02-template-picker.png" alt="02 · 模板筛选" /><br/>
<sub><b>75 套模板可搜索可筛选</b> —— 按 mode（prototype / deck / frame / social / office / doc）与 scenario（design / marketing / engineering / product / personal）二维筛。每套模板都附 <code>example.html</code>，双击直接看效果。</sub>
</td>
</tr>
<tr>
<td width="50%">
<img src="docs/screenshots/03-streaming.png" alt="03 · 流式生成" /><br/>
<sub><b>SSE 流式</b> —— agent 的 stdout JSON-line 流式抽出文本，append 进 iframe <code>srcdoc</code>。你能看着它一行一行写出来，不满意可以中途打断重发，不浪费一整次生成。</sub>
</td>
<td width="50%">
<img src="docs/screenshots/04-export.png" alt="04 · 一键发布" /><br/>
<sub><b>一键发布到平台</b> —— 微信公众号（juice 内联 CSS）· 推特 / 微博 / 小红书（modern-screenshot 渲染成 2× PNG，写进 ClipboardItem）· 知乎（公式占位）· 下载 <code>.html</code> · 下载 <code>.png</code>。粘贴即用，0 二次排版。</sub>
</td>
</tr>
<tr>
<td width="50%">
<img src="docs/screenshots/05-deck-mode.png" alt="05 · Keynote PPT" /><br/>
<sub><b>Deck 模式</b> —— 20 套 PPT skill，含 Swiss International（瑞士国际主义）· Guizang Editorial（编辑墨水）· Open Slide Canvas（1920×1080 agent-native）· Magazine Web · XHS Pastel · Hermes Cyber · Replit Style 等。←/→ 切页，支持演讲者备注与打印 PDF。</sub>
</td>
<td width="50%">
<img src="docs/screenshots/06-hyperframes.png" alt="06 · Hyperframes 视频帧" /><br/>
<sub><b>Hyperframes 视频帧</b> —— 10 套帧脚本（液态背景 hero · NYT 数据图表 · 贴纸流程图 · 像素故障标题 · 电影漏光 · macOS 通知 · 品牌 logo 片尾 · 文本光标 VFX · 3D 设备模型 …）符合 <a href="https://github.com/heygen-com/hyperframes">heygen-com/hyperframes</a> 规范，可直送 Remotion 渲染 mp4。</sub>
</td>
</tr>
</table>

## ⚡ 30 秒上手

```bash
git clone https://github.com/nexu-io/html-anything
cd html-anything
pnpm install
pnpm dev
# → http://localhost:3000
```

打开浏览器 → 顶栏会自动列出你电脑上**已经登录好**的本地 code agent → 选一个模板 → 粘贴内容 → ⌘+Enter

**无需 API Key**。我们直接复用你已经在用的 Claude / Cursor / Codex 订阅，**0 边际成本**。

## 🧠 自动识别本地 agent

进入主页时，我们扫描你的 `PATH`（包括 `~/.local/bin`、`~/.bun/bin`、`/opt/homebrew/bin`、`~/.npm-global/bin` 等通过 GUI 启动会被过滤掉的目录），检测以下 CLI：

| Agent | 检测命令 | 调用方式 |
|---|---|---|
| **Claude Code** | `claude` | `claude -p --output-format stream-json` |
| **OpenAI Codex** | `codex` | `codex exec --json --sandbox workspace-write` |
| **Cursor Agent** | `cursor-agent` | `cursor-agent --print --output-format stream-json --force --trust` |
| **Gemini CLI** | `gemini` | `gemini --output-format stream-json --yolo` |
| **GitHub Copilot CLI** | `copilot` | `copilot --allow-all-tools --output-format json` |
| **OpenCode** | `opencode-cli` / `opencode` | `opencode run --format json --dangerously-skip-permissions -` |
| **Qwen Coder** | `qwen` | `qwen --yolo -` |
| **Aider** | `aider` | `aider --no-pretty --no-stream --yes-always --message-file -` |

> 这一层的设计直接借鉴了 [`nexu-io/open-design`](https://github.com/nexu-io/open-design) 和 [`multica-ai/multica`](https://github.com/multica-ai/multica) 的 agent 检测策略：唯一被 spawn 子进程的进程是 server route，业务进程不直接 spawn；CLI 的 stdin / stdout 用 JSON-line 协议复用，每个 CLI 一个轻 adapter，统一在 [`src/lib/agents/argv.ts`](src/lib/agents/argv.ts)。

只要你已经在终端里登录过对应的 CLI（例如 `claude login`、`cursor login`），HTML Anything 直接复用同一个 session，**不要求你再贴一遍 API Key**。

## 🎨 Skills

**75 套 skill 在 [`src/lib/templates/skills/`](src/lib/templates/skills/) 下开箱即用。** 每个 skill 是一个文件夹，遵循 Claude Code [`SKILL.md`](https://docs.anthropic.com/en/docs/claude-code/skills) 约定 + 扩展 frontmatter（`mode` · `scenario` · `surface` · `preview` · `design_system`）。

picker 用两个维度组织：

- **mode** —— `prototype`（web / SaaS landing / dashboard / 数据报告 / 简历 / 文档） · `deck`（20 套幻灯片 skill） · `frame`（10 套 Hyperframes 视频帧脚本） · `social`（4 套社交平台分享卡） · `office`（PM / 工程 / 财务 / HR / 行政 表格化文档）。
- **scenario** —— `design` / `marketing` / `engineering` / `product` / `finance` / `hr` / `sale` / `personal`，用于在 picker 里分组展示。

完整 skill 目录（按 mode 分类）请见 [English README](README.md#skills)，结构一一对应，链接也都是同一个 repo path。新增 skill 只需要 fork 一个 skill 文件夹、改 `SKILL.md` frontmatter、重启 dev server，picker 里就会出现；merge 标准见 [`CONTRIBUTING.zh-CN.md`](CONTRIBUTING.zh-CN.md)。

## 六个核心想法

### 1 · 我们不发 agent，你装的就够好

主界面进来时，浏览器调 `/api/agents`，server 端扫一遍 `PATH`（含 GUI 启动会丢的 `~/.local/bin` · `~/.bun/bin` · `/opt/homebrew/bin` · `~/.npm-global/bin`），识别到哪些 CLI 在场，就把哪些放进顶栏。每个 CLI 对应一个 adapter（参数 + stdin 协议 + 输出解析器），在 [`src/lib/agents/argv.ts`](src/lib/agents/argv.ts) 里集中维护。整套思路直接借鉴 [`nexu-io/open-design`](https://github.com/nexu-io/open-design) 和 [`multica-ai/multica`](https://github.com/multica-ai/multica) 的 agent-detection 模型。

### 2 · Skills 是文件夹，不是插件

遵循 Claude Code [`SKILL.md`](https://docs.anthropic.com/en/docs/claude-code/skills) 约定 —— `SKILL.md` + `assets/` + `references/` + `example.html`。drop 一个文件夹到 [`src/lib/templates/skills/`](src/lib/templates/skills/)，重启 dev server，picker 里就出现。`deck-guizang-editorial` 直接 vendor 自 [`op7418/guizang-ppt-skill`](https://github.com/op7418/guizang-ppt-skill)（保留原始 LICENSE 与署名）。

### 3 · 强制约束让 AI 不再 freestyle

每个模板都硬编码了：
- **中文优先字体栈**：`Noto Sans/Serif SC` / 思源黑体；英文用 `Inter` / `Manrope`。
- **8 px 基线网格**：所有间距、行高、字号都是 8 的倍数。
- **圆角 / 投影 / 不用纯黑纯白** —— 视觉上去 AI-slop 化。
- **颜色对比 ≥ 4.5**，重要交互必有 `:focus` 态。
- **必须使用用户提供的真实数据**，禁止 lorem ipsum。

灵感来自 [`alchaincyf/huashu-design`](https://github.com/alchaincyf/huashu-design) 的 "Junior-Designer mode" + 反 AI-slop checklist。约束就是 prompt 的一部分，写进每个 `SKILL.md`。

### 4 · 流式渲染 = 看着 AI 现场画

`POST /api/convert` 走 SSE。Agent 的 stdout 是一行行 JSON-line，server 抽出其中的 `text` 字段，作为 SSE event 推下去，客户端 append 进 `iframe[srcdoc]`。整个过程跟在终端里看 AI 写代码一模一样，只不过最终产物是好看的 HTML 而不是 markdown。**不满意可以打断**，不浪费一整次 token。

### 5 · 一键发布到平台 = 0 二次排版

- **微信公众号**：`juice` 内联 CSS + `data-tool` 标记 → 粘进编辑器直接显示，不丢样式。
- **推特 / 微博 / 小红书**：`modern-screenshot` 把 iframe 渲染成 2× PNG → `ClipboardItem` → 直接粘到推文 / 图床。
- **知乎**：同上 + `<mjx-container>` → `data-eeimg` LaTeX 图占位（知乎不支持 KaTeX 直渲，必须转成图）。
- **下载 `.html`** / **下载 `.png`**：自包含单文件，任意分享。

实现思路参考自 [`mdnice/markdown-nice`](https://github.com/mdnice/markdown-nice) 和 [`gcui-art/markdown-to-image`](https://github.com/gcui-art/markdown-to-image)。

### 6 · 沙箱 iframe = 安全 + 隔离

用户输出的 HTML 总是放进 `iframe[sandbox="allow-scripts allow-same-origin"]` 里。第三方脚本可以跑（Tailwind CDN / Google Fonts / 用户自定义动效），但 cookie 和 localStorage 走 iframe 自己的 origin，不污染宿主页面。打开 devtools 也只看 iframe 自己的 DOM，调试体验和写一个独立 HTML 文件一致。

## 架构

```
┌─────────────────────── Browser (Next.js 16) ──────────────────────┐
│  Editor / 上传 · 顶栏 agent picker · 模板 picker · iframe 预览       │
└─────────────┬──────────────────────────────────┬──────────────────┘
              │ ⌘+Enter                            │
              ▼                                    ▼
     ┌─────────────────────┐            ┌──────────────────────┐
     │  GET /api/agents    │            │  POST /api/convert   │
     │  扫 PATH 检测 CLI    │            │  SSE 流式调用 agent   │
     └─────────────────────┘            └──────────┬───────────┘
                                                   │ spawn + stdin pipe
                                                   ▼
                                ┌────────────────────────────────────┐
                                │  你本地的 code agent                │
                                │  claude / codex / cursor-agent /   │
                                │  gemini / copilot / opencode /     │
                                │  qwen / aider                      │
                                │  → 复用你已登录的 session           │
                                └────────────────────────────────────┘
                                                   │
                                                   ▼
                                stdout JSON-line ──► SSE event
                                                   │
                                                   ▼
                              iframe srcdoc append（实时刷新）
                                                   │
                              ⌘+C 复制 → ClipboardItem
                              ⌘+S 下载 → .html / .png
```

| 层 | 技术栈 |
|---|---|
| Frontend | Next.js 16 App Router + Turbopack · React 19 · Tailwind v4 · zustand 全局状态 |
| Server routes | `GET /api/agents`（检测） · `POST /api/convert`（SSE 流式 spawn） |
| Agent transport | `child_process.spawn` · 每个 CLI 一个 stdin/stdout adapter（[`src/lib/agents/argv.ts`](src/lib/agents/argv.ts)） |
| 浏览器端处理 | `juice`（CSS 内联） · `modern-screenshot`（PNG 截图） · `xlsx` / `papaparse`（CSV/Excel 解析） · `marked` + `highlight.js`（markdown 兼容输入） · `dompurify`（XSS 防御） |
| 预览沙箱 | `iframe[sandbox="allow-scripts allow-same-origin"]` + `srcdoc` |
| 导出 | `.html` 单文件 · `.png` 高 DPI · ClipboardItem 富文本 / image/png · 微信兼容 inline CSS |
| 部署 | 本地 `pnpm dev` · Vercel 一键 web 层（agent 永远跑本地） |

## 一键发布到平台

| 平台 | 实现 | 粘贴效果 |
|---|---|---|
| **微信公众号** | `juice` 内联 CSS + `data-tool` 标记 | 0 调整，直接显示 |
| **知乎** | 同上 + `<mjx-container>` → `data-eeimg` LaTeX 图占位 | 公式自动渲染 |
| **推特 / 微博 / 小红书** | `modern-screenshot` 把 iframe 渲染成 2× PNG → ClipboardItem | 直接粘到推文 |
| **下载 `.html`** | 单文件，双击打开 | 任意分享 |
| **下载 `.png`** | 高 DPI 截图 | 任意分享 |

## 🛣️ Roadmap

- [ ] **多模板比较预览** —— 同一份内容生成 4 张候选，选最美的一张落地
- [ ] **Hyperframes → mp4** —— 一键把帧脚本送进 Remotion 渲真视频
- [ ] **共享设计 system** —— 与 [`nexu-io/open-design`](https://github.com/nexu-io/open-design) 互通 `DESIGN.md` 资产
- [ ] **模板市场** —— 社区贡献你的提示词与示例
- [ ] **浏览器扩展** —— 选中网页内容 → 一键转 HTML 模板
- [ ] **历史记录 / 版本对比 / IndexedDB 存档**
- [ ] **更多平台导出适配** —— 微信视频号 · 抖音字幕 · Notion · Linear · Telegraph

## 📍 进度

早期但能用。**识别 agent → 选 skill → SSE 流式渲染 → sandboxed iframe 预览 → 一键导出** —— 这条闭环已经跑通,8 个 CLI 全都能驱动。Skill 库和 `SKILL.md` 里的硬约束是这套东西最值钱的部分,这两块都稳定了。Picker UX、design-system 元数据、多模板对比流程还在每天迭代。**如果你本机上跑出毛病了,提 issue 时附上你用的是哪个 agent CLI + 输入内容,这种 issue 推进最快。**

| 模块 | 状态 |
|---|---|
| Agent 自动识别(8 个 CLI) | ✅ 稳定 |
| Skill 注册表 + picker(75 个 skill) | ✅ 稳定 |
| SSE 流式渲染 | ✅ 稳定 |
| Sandboxed iframe 预览 | ✅ 稳定 |
| 一键复制到公众号 / 推特 / 知乎 / `.html` / `.png` | ✅ 稳定 |
| CSV / Excel / JSON / SQL 格式自动识别 | ✅ 稳定 |
| 多模板对比(同一份生成 4 张,选 1 张落地) | 🛠 进行中 |
| Hyperframes → `.mp4` 一键交给 Remotion 渲视频 | 🛠 进行中 |
| 浏览器扩展(选中网页 → 转 HTML 模板) | ⏳ 计划中 |
| 历史记录 / 版本对比 / IndexedDB 存档 | ⏳ 计划中 |
| Skill 市场(`install <github-repo>`) | ⏳ 计划中 |

## 🤝 贡献

欢迎 issue、PR、新 skill、新 agent 适配、新平台导出、翻译。**最高杠杆的贡献往往就是一个文件夹、一份 Markdown、或者一段 PR-sized adapter** —— 面积小、影响大。按你想加的东西对号入座:

- **新 skill** —— 在 [`src/lib/templates/skills/`](src/lib/templates/skills/) 加一个文件夹,带 `SKILL.md` + `example.html`(可选 `assets/` 和 `references/`)。`pnpm dev` 重启后 picker 自动发现。`SKILL.md` frontmatter 必须设 `mode` · `scenario` · `surface` · `preview` · `design_system` —— 抄一个邻居改就行。
- **新 coding-agent CLI 适配** —— 在 [`src/lib/agents/argv.ts`](src/lib/agents/argv.ts) 加一行,覆盖:识别用的 binary 名字、argv 拼装、stdin/stdout 协议、流式 parser。检测路径走 [`src/app/api/agents/`](src/app/api/agents/),spawn 走 [`src/app/api/convert/`](src/app/api/convert/)。
- **新平台导出** —— 在 [`src/lib/export/`](src/lib/export/) 加一个模块(放在 `wechat.ts` / `image.ts` / `clipboard.ts` 隔壁),并在导出菜单里加按钮。微信视频号 · 抖音字幕 · Notion · Linear · Telegraph · RSS 都是空位。
- **打磨某个 `SKILL.md`** —— 加强硬约束(CJK 字体栈、8 px 基线、对比度 ≥ 4.5、必须用真实数据),加一段五维自检,换一套更合适的调色板。反 AI-slop 这类 PR 是我们最看重的形态。
- **翻译与文档** —— [`README.md`](README.md) 和 [`CONTRIBUTING.md`](CONTRIBUTING.md) 都和中文版并行维护,改一边请同步另一边。

完整的贡献流程、合并门槛、代码规范、以及我们**不接受**的 PR 类型 → [`CONTRIBUTING.zh-CN.md`](CONTRIBUTING.zh-CN.md)([English](CONTRIBUTING.md))。

## 📚 References & Lineage(依赖与渊源)

这个 repo 借鉴的所有外部项目 —— 每一个我们都拿了什么、对应落到哪个目录。

| 项目 | 在这里的角色 |
|---|---|
| [**`nexu-io/open-design`**](https://github.com/nexu-io/open-design) | Agent 识别层、`DESIGN.md` 设计 system schema、`SKILL.md` 协议都来自这里。[`src/lib/agents/argv.ts`](src/lib/agents/argv.ts) 和 [`src/lib/templates/skills/`](src/lib/templates/skills/) 直接镜像了它的架构。 |
| [**`multica-ai/multica`**](https://github.com/multica-ai/multica) | Daemon-and-runtime 架构:一个特权进程 spawn 各家 CLI、JSON-line 做线协议、每个 CLI 一个薄 adapter。 |
| [**`alchaincyf/huashu-design`**](https://github.com/alchaincyf/huashu-design) | 反 AI-slop 设计哲学 —— Junior-Designer 工作流、五步品牌资产协议、对比度 ≥ 4.5 / 8 px 基线 / 必须用真实数据。这些硬约束直接写进了每一个 [`SKILL.md`](src/lib/templates/skills/) frontmatter。 |
| [`alchaincyf/huashu-md-html`](https://github.com/alchaincyf/huashu-md-html) | 公众号 / 知乎复制端到端兼容性的可行性证明。[`src/lib/export/wechat.ts`](src/lib/export/wechat.ts) 的参考实现。 |
| [`mdnice/markdown-nice`](https://github.com/mdnice/markdown-nice) | `juice` 内联 CSS 链路 → 公众号 / 知乎粘贴零调整。驱动 [`src/lib/export/wechat.ts`](src/lib/export/wechat.ts)。 |
| [`mdnice/markdown-resume`](https://github.com/mdnice/markdown-resume) | A4 简历版式的灵感来源 → [`resume-modern`](src/lib/templates/skills/resume-modern/)。 |
| [`gcui-art/markdown-to-image`](https://github.com/gcui-art/markdown-to-image) | iframe → 高 DPI PNG 截图路径,用 `modern-screenshot` 复刻在 [`src/lib/export/image.ts`](src/lib/export/image.ts)。 |
| [**`op7418/guizang-ppt-skill`**](https://github.com/op7418/guizang-ppt-skill) | 编辑墨水 PPT 原封不动接入 [`deck-guizang-editorial`](src/lib/templates/skills/deck-guizang-editorial/) 和瑞士国际主义变体 [`deck-swiss-international`](src/lib/templates/skills/deck-swiss-international/)。原 LICENSE + 作者署名保留。 |
| [**`tw93/kami`**](https://github.com/tw93/kami) | 暖羊皮纸 + 墨蓝单色 editorial 文档系统 → [`doc-kami-parchment`](src/lib/templates/skills/doc-kami-parchment/)。 |
| [**`1weiho/open-slide`**](https://github.com/1weiho/open-slide) | 1920×1080 agent-native canvas 规范 → [`deck-open-slide-canvas`](src/lib/templates/skills/deck-open-slide-canvas/)。 |
| [`heygen-com/hyperframes`](https://github.com/heygen-com/hyperframes) | 整个 `frame-*` / `vfx-*` / `mockup-*` / `social-*` 家族遵循的帧脚本 schema。输出可以直接交给 Remotion 渲 `.mp4`。 |
| [`remotion-dev/remotion`](https://github.com/remotion-dev/remotion) | Hyperframes 帧脚本的目标渲染器。 |
| [`jimliu/baoyu-skills`](https://github.com/jimliu/baoyu-skills) | 实用 skills 集合 —— picker 分类参考目录。 |

每一个 vendor 进来的 upstream skill 都在 `src/lib/templates/skills/<skill>/` 里保留了原始 LICENSE 和作者署名。

## 📣 关注我们

X 上关注 [**@nexudotio**](https://x.com/nexudotio),看版本发布、新 skill、新 design system,以及偶尔的 behind-the-scenes 线程。[Discord](https://github.com/nexu-io/open-design#community) 是更长篇讨论的场子 —— 两者都由上游 `open-design` 团队维护,HTML Anything 共用同一个社群入口。

## 👥 贡献者

感谢每一个提 issue、开 PR、加 skill / agent 适配 / 导出适配的人。下面这面墙是我们能想到最直观的感谢方式。

<a href="https://github.com/nexu-io/html-anything/graphs/contributors">
  <img src="https://contrib.rocks/image?repo=nexu-io/html-anything" alt="HTML Anything 贡献者" />
</a>

如果你刚刚开第一个 PR —— 欢迎。[`good-first-issue` / `help-wanted`](https://github.com/nexu-io/html-anything/issues?q=is%3Aissue+is%3Aopen+label%3A%22good+first+issue%22%2C%22help+wanted%22) 标签是最好的切入口。

## ⭐ Star History

<a href="https://star-history.com/#nexu-io/html-anything&Date">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="https://api.star-history.com/svg?repos=nexu-io/html-anything&type=Date&theme=dark" />
    <source media="(prefers-color-scheme: light)" srcset="https://api.star-history.com/svg?repos=nexu-io/html-anything&type=Date" />
    <img alt="HTML Anything star history" src="https://api.star-history.com/svg?repos=nexu-io/html-anything&type=Date" />
  </picture>
</a>

曲线往上翘,就是我们要找的信号。点个 ★ 推一把。

## 📄 License

Apache-2.0 © 2026 HTML Anything 贡献者。详见 [`LICENSE`](LICENSE)。

vendor 进来的第三方作品保留原始 LICENSE 与署名 —— 每个 `src/lib/templates/skills/<skill>/` 文件夹里若存在 `LICENSE` / `README.md`，以它为准。
