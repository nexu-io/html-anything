<p align="center"><a href="readme/studio-tour.zh-CN.mp4"><picture><source media="(max-width: 640px)" srcset="readme/cover.mobile.zh-CN.jpg" /><img src="readme/cover.zh-CN.jpg" width="100%" alt="Codex 收到 OpenAI 参考片链接，OpenMotion Studio 显示复刻工程的画面和时间轴。" /></picture></a></p>

<h1 align="center">OpenMotion · 用任意 Agent 拆解并复刻品牌视频</h1>

<p align="center">
  <a href="https://github.com/nexu-io/html-anything/stargazers"><img src="https://img.shields.io/github/stars/nexu-io/html-anything?style=flat-square&amp;logo=github&amp;label=Stars&amp;color=8a6500" alt="GitHub 仓库星标数" /></a>
  <a href="../package.json"><img src="https://img.shields.io/badge/Node.js-22.18%2B-417e38?style=flat-square" alt="Node.js 22.18+" /></a>
  <a href="../LICENSE"><img src="https://img.shields.io/badge/License-Apache_2.0-395f84?style=flat-square" alt="Apache 2.0 许可证" /></a>
</p>

<p align="center">贴一条 X 或 YouTube 链接，或从 <strong><a href="#motion-资源库与主题合集">100+ 个可一键复刻的视频模板</a></strong>里选一支。换上自己品牌的 Logo 和产品截图，在 Studio 里改镜头、导出 MP4。</p>

<p align="center"><strong><a href="readme/studio-tour.zh-CN.mp4">看 15 秒 Codex 演示</a></strong> · <strong><a href="#接入你的-agent">接入你的 Agent</a></strong></p>

<p align="center">
  <a href="https://open-design.ai/openmotion?utm_source=github&amp;utm_medium=referral&amp;utm_campaign=openmotion&amp;utm_content=readme_zh"><img src="https://img.shields.io/badge/OpenMotion-%E5%AE%98%E7%BD%91-bc334e?style=flat-square" alt="OpenMotion 官网" /></a>
  <a href="https://go.open-design.ai/?utm_source=github&amp;utm_medium=referral&amp;utm_campaign=openmotion&amp;utm_content=readme_zh"><img src="https://img.shields.io/badge/OpenDesign_Go-526442?style=flat-square" alt="OpenDesign Go 模型订阅" /></a>
  <a href="https://discord.gg/mHAjSMV6gz"><img src="https://img.shields.io/badge/Discord-5865F2?style=flat-square&amp;logo=discord&amp;logoColor=white" alt="加入 OpenDesign Discord" /></a>
  <a href="https://x.com/OpenDesignHQ"><img src="https://img.shields.io/badge/@OpenDesignHQ-16181c?style=flat-square&amp;logo=x&amp;logoColor=white" alt="OpenDesign 官方 X 账号 @OpenDesignHQ" /></a>
  <a href="https://x.com/OpenDesignDevs"><img src="https://img.shields.io/badge/@OpenDesignDevs-16181c?style=flat-square&amp;logo=x&amp;logoColor=white" alt="OpenDesign 开发者 X 账号 @OpenDesignDevs" /></a>
  <a href="https://www.youtube.com/channel/UChtshixMhvtgBWzoD9R_Qfg"><img src="https://img.shields.io/badge/YouTube-b91c1c?style=flat-square&amp;logo=youtube&amp;logoColor=white" alt="OpenDesign 的 YouTube 频道" /></a>
</p>

<p align="center"><a href="readme/studio-tour.zh-CN.mp4"><picture>
  <source media="(prefers-reduced-motion: reduce)" srcset="readme/codex-comparison.zh-CN.jpg" />
  <img src="readme/codex-comparison.zh-CN.webp" width="100%" alt="安装插件，把 OpenAI 的 X 原帖贴进 Codex，打开 Studio 时间轴，再同步播放 5 秒原片与复刻。" />
</picture></a></p>

<p align="center">
  <a href="#在-codex-里开始"><img src="readme/agents/codex-badge.svg" width="144" height="34" alt="Codex 接入说明" /></a>
  <a href="agent-adapters.md#codex--claude-code"><img src="readme/agents/claude-code-badge.svg" width="144" height="34" alt="Claude Code 接入说明" /></a>
  <a href="agent-adapters.md#deepseek-harness"><img src="readme/agents/deepseek-harness-badge.svg" width="144" height="34" alt="DeepSeek Harness 接入说明" /></a>
  <a href="agent-adapters.md#workbuddy"><img src="readme/agents/workbuddy-badge.svg" width="144" height="34" alt="WorkBuddy（预览）接入说明" /></a>
</p>

<p align="center">首版开源了<strong><a href="../examples/reference-reveal/MOTION.zh-CN.md">Firecrawl 品牌宣传片的 MOTION.md 拆解</a></strong>，从数字亮相到 Logo 收尾，每一拍都能对照原片。</p>

<p align="center"><a href="https://x.com/OpenAI/status/2084352161404920316">看 OpenAI 的 X 原帖</a> · <a href="../examples/reference-reveal/comparison.mp4">Firecrawl 原片与复刻 · 5 秒对照</a> · <a href="#复用参考片的拍法">看七个品牌的 5 秒对照</a></p>

<p align="center"><a href="../README.md">English</a> · <a href="collections/README.zh-CN.md">找参考片</a> · <a href="https://github.com/nexu-io/html-anything/blob/legacy/README.zh-CN.md">原 HTML Anything 编辑器与安装说明</a></p>

OpenMotion 是一款通过本地 MCP 接入 Agent 的开源动效设计插件，我们希望把它做成最好的 Claude Motion 开源替代。你可以从品牌形象片、产品演示或新品发布片开始。拆解一个镜头时，先看哪个元素动、产品在哪一拍出现、观众有多久读完标题。用我们提出的 Markdown 动效规范 **Motion MD** 记下这些决定，另一个团队就能带上自己的品牌素材复刻这套拍法。

## 复用参考片的拍法

左边是品牌在 X 发布的原片，右边是用 OpenMotion 单独制作的可编辑工程。每组截取 5 秒，原速同步播放。点击画面可以暂停、拖动，检查两边的动作在哪一帧发生。

| 原片与时间段 | 5 秒同步对照 | 复刻工程 |
| --- | --- | --- |
| [Kimi](https://x.com/Kimi_Moonshot/status/2077521842080817296)<br />00:30.75–00:35.75 | <a href="../examples/brand-studies/kimi/comparison.mp4"><picture><source media="(prefers-reduced-motion: reduce)" srcset="../examples/brand-studies/kimi/comparison.jpg" /><img src="../examples/brand-studies/kimi/comparison.webp" width="290" alt="Kimi 原片与 OpenMotion 复刻同步播放" /></picture></a> | 磁力线淡出，字符重组成品牌名<br />[MP4](../examples/brand-studies/kimi/film.mp4) · [源码](../examples/brand-studies/kimi/index.html) |
| [DeepSeek](https://x.com/DeepSeekHarness/status/2117256196227019194)<br />01:31.5–01:36.5 | <a href="../examples/brand-studies/deepseek/comparison.mp4"><picture><source media="(prefers-reduced-motion: reduce)" srcset="../examples/brand-studies/deepseek/comparison.jpg" /><img src="../examples/brand-studies/deepseek/comparison.webp" width="290" alt="DeepSeek 原片与 OpenMotion 复刻同步播放" /></picture></a> | 逐字打出标题，闪白切到片尾<br />[MP4](../examples/brand-studies/deepseek/film.mp4) · [源码](../examples/brand-studies/deepseek/index.html) |
| [OpenAI](https://x.com/OpenAI/status/2084352161404920316)<br />00:26.5–00:31.5 | <a href="../examples/motion-studies/comparison.mp4"><picture><source media="(prefers-reduced-motion: reduce)" srcset="../examples/motion-studies/comparison.jpg" /><img src="../examples/motion-studies/comparison.webp" width="290" alt="OpenAI 原片与 OpenMotion 复刻同步播放" /></picture></a> | 点阵收成光点，切到品牌片尾<br />[MP4](../examples/motion-studies/film.mp4) · [源码](../examples/motion-studies/index.html) |
| [Anthropic](https://x.com/ClaudeDevs/status/2091953609185657251)<br />00:00–00:05 | <a href="../examples/brand-studies/anthropic/comparison.mp4"><picture><source media="(prefers-reduced-motion: reduce)" srcset="../examples/brand-studies/anthropic/comparison.jpg" /><img src="../examples/brand-studies/anthropic/comparison.webp" width="290" alt="Anthropic 原片与 OpenMotion 复刻同步播放" /></picture></a> | 点亮开关，手绘圈标出标题<br />[MP4](../examples/brand-studies/anthropic/film.mp4) · [源码](../examples/brand-studies/anthropic/index.html) |
| [ElevenLabs](https://x.com/ElevenLabs/status/2069111326987673761)<br />00:50–00:55 | <a href="../examples/brand-studies/elevenlabs/comparison.mp4"><picture><source media="(prefers-reduced-motion: reduce)" srcset="../examples/brand-studies/elevenlabs/comparison.jpg" /><img src="../examples/brand-studies/elevenlabs/comparison.webp" width="290" alt="ElevenLabs 原片与 OpenMotion 复刻同步播放" /></picture></a> | 保留品牌词根，滚动替换后缀<br />[MP4](../examples/brand-studies/elevenlabs/film.mp4) · [源码](../examples/brand-studies/elevenlabs/index.html) |
| [Apple](https://x.com/tim_cook/status/1896589954517701057)<br />00:00.75–00:05.75 | <a href="../examples/brand-studies/apple/comparison.mp4"><picture><source media="(prefers-reduced-motion: reduce)" srcset="../examples/brand-studies/apple/comparison.jpg" /><img src="../examples/brand-studies/apple/comparison.webp" width="290" alt="Apple 原片与 OpenMotion 复刻同步播放" /></picture></a> | 文字逐拍放大，字形折成丝带<br />[MP4](../examples/brand-studies/apple/film.mp4) · [源码](../examples/brand-studies/apple/index.html) |
| [Slack](https://x.com/SlackHQ/status/1085609385542459393)<br />00:00–00:05 | <a href="../examples/brand-studies/slack/comparison.mp4"><picture><source media="(prefers-reduced-motion: reduce)" srcset="../examples/brand-studies/slack/comparison.jpg" /><img src="../examples/brand-studies/slack/comparison.webp" width="290" alt="Slack 原片与 OpenMotion 复刻同步播放" /></picture></a> | 四色线条散开，重新拼成品牌标记<br />[MP4](../examples/brand-studies/slack/film.mp4) · [源码](../examples/brand-studies/slack/index.html) |

在 Agent 里试试 Apple 这一行。打开自己的品牌素材目录，再贴入这段指令。

```text
用 OpenMotion 复刻这支片子的 00:00.75–00:05.75：
https://x.com/tim_cook/status/1896589954517701057
沿用文字出现和折叠的节奏，把 AIR 换成 CUT。
在 Studio 中打开可编辑的 5 秒工程，导出 MP4。
```

## 用 OpenMotion 做出的三支片子

### Made in Codex · 12 秒产品发布片

[![播放 Made in Codex。绿色圆环托出片名，真实 Studio 时间轴入画，最后以 OpenDesign 标志收尾。](../examples/launch-in-codex/preview.gif)](../examples/launch-in-codex/film.mp4)

整支片只用了一张产品截图。前 3 秒用大字开场，接着把 Studio 的真实时间轴推到观众面前，最后由 OpenDesign 标志收尾。想做自己产品的版本，可以从仓库里挑一张截图，再从发布说明里挑一句标题。[观看 MP4](../examples/launch-in-codex/film.mp4) · [改镜头和节奏](../examples/launch-in-codex/index.html)

### The Long Return · 11 秒数据故事

[![播放 The Long Return。六根柱子依次升起，随后叠加另一座城市的日照折线。](../examples/longer-days/preview.gif)](../examples/longer-days/film.mp4)

2026 年 6 月 1 日，雷克雅未克的白昼比里斯本长多少？先用六组数据画出两座城市的日照变化，再揭晓答案：**5 小时 25 分钟**。柱和线共用同一条纵轴。换数据、改月份或调整揭晓时间，都在同一份源文件里。[观看 MP4](../examples/longer-days/film.mp4) · [改图表](../examples/longer-days/index.html) · [查看原始数据](../examples/README.md#the-long-return)

### Pick Your Cut · 9 秒竖屏讲解

[![Pick Your Cut 的三个连续阶段，保留手机竖屏原始比例。三张卡片按顺序入场。](../examples/pick-your-cut/frames.jpg)](../examples/pick-your-cut/film.mp4)

手头有参考片、现成模板，还是只有一句想法？三张卡片逐拍入场，结尾同时留在手机画面里，让人有时间读完。把问题和卡片换掉，就可以用同一个节奏讲清楚产品上手的三个步骤。[观看竖屏 MP4](../examples/pick-your-cut/film.mp4) · [改卡片和文案](../examples/pick-your-cut/index.html)

三支片均由插件实际导出，按静音观看设计。[查看工程素材、创作说明和本地复现步骤](../examples/README.md)

## 接入你的 Agent

OpenMotion 在你的电脑上运行。选择能通过 stdio 启动本地 MCP 服务的 Agent 接入，即可在同一个 Studio 里继续编辑工程。

| Agent | 怎么接入 |
| --- | --- |
| **Codex** | 安装插件，在 **Plugins → OpenDesign → Try now** 打开。[跟着演示安装](#在-codex-里开始) |
| **Claude Code** | 给本地安装器加上 `--host claude`，注册 MCP 服务并安装 Skills。[本地插件接入方式](agent-adapters.md#codex--claude-code) |
| **DeepSeek Harness** | 先为要使用的 profile 配好模型，再用 `--host deepseek` 接入。[Harness 配置说明](agent-adapters.md#deepseek-harness) |
| **WorkBuddy** *（预览）* | 用 `--host workbuddy` 接入自定义 MCP 和 Skills。桌面端从导入到出片的完整流程仍待实机验证。[Connector 接入说明](agent-adapters.md#workbuddy) |

<details>
<summary>查看本地安装命令</summary>

克隆 [feature/motion 分支](https://github.com/nexu-io/html-anything/tree/feature/motion)，在仓库根目录用 Node.js 22.18+ 和 npm 运行以下命令。这里以 Claude Code 为例，其他 Agent 可换成表里对应的宿主参数。

```sh
npm ci
npm run package:npm
npx --yes --package "$PWD/dist/npm-local/openmotion-installer-0.6.2-local.1.tgz" \
  openmotion setup --host claude --manifest "$PWD/dist/npm-local/release.local.json"
```

[安装选项](npm-installation.md#构建与安装)

</details>

想复刻上面的镜头？安装后打开 Studio 的**模板库 → 视频复刻**，搜品牌或片段名称，点「一键复刻」。把复制的指令贴进 Agent，加上自己的 Logo、文案或配色。Agent 会生成可编辑工程，你可以在 Studio 时间轴预览、改稿，再导出 MP4。

第一次可以直接用内置的 **Product Promo**，素材已经备好。[模板出片流程](../skills/motion-template-to-video/SKILL.md)

### 在 Codex 里开始

macOS 或 Linux 需要 Git、Node.js 22.18+（含 npm）和支持插件的 Codex CLI。导出 MP4 还需要 Chrome 或 Chromium，以及含 FFprobe 的 FFmpeg。[Windows 安装说明](test-packages.md)

```sh
git clone --branch feature/motion --single-branch https://github.com/nexu-io/html-anything.git OpenMotion
cd OpenMotion && bash scripts/install-motion.command
```

请保留本地仓库目录。在 Codex 桌面端打开 **Plugins → OpenDesign → Try now**。当前 `motion` 插件显示为 OpenDesign。把参考片链接贴进输入框，也可以先试试自带的示例。

> 用 OpenMotion 在 Studio 里打开一份新的 20 秒 Product Promo 示例工程，并把它导出为 MP4。

拿到第一版后，可以试着说：**“结尾标题多停两秒，再导出一版。”** 你也可以自己在 Studio 里拖动片段边缘。两种方式改的是同一份工程。[安装与首次体验手册](usage.md#使用)

![在 Studio 中打开的 Product Promo 示例，可见视频预览与可编辑时间轴。](readme/editor.jpg)

## 用自己的素材开工

项目里的 Logo 和截图可以直接用。需要另外生成图像、视频或声音素材时，可在 Studio「模型设置」中配置自己的 Atlas Cloud 或 fal.ai API Key，按媒体类型选择模型。[模型设置说明](model-gateway.md)

| 你手头有什么 | 可以怎样告诉 Agent | 第一版出来后怎么改 |
| --- | --- | --- |
| 一支参考片和品牌素材 | “保留从标题切到界面的那一拍，用我们的截图和字体。” | 把两支片并排看，微调产品亮相的时机。[复刻参考片](../skills/motion-recreate/SKILL.md) |
| 一份喜欢的模板 | “用 Product Promo 的节奏，换掉开场文案和片尾。” | 在模板副本里改，下一次活动还可以从原版开始。[套用模板](../skills/motion-template-to-video/SKILL.md) |
| 发布说明和一组截图 | “先说用户遇到的问题，再演示新功能，最后停在上线日期。” | 和 Agent 一起定镜头顺序，到 Studio 调整每个镜头的长度。[从创意做原片](../skills/motion-director/SKILL.md) |

## Motion MD

一份可复用的动效说明，要写清楚镜头为什么这样拍，也要告诉接手的人可以改哪里。上面这支 5 秒片用到了三个决定。

| 时段 | 保留的拍法 | 做自己品牌的视频时可以换什么 |
| --- | --- | --- |
| 0–1.5 秒 | 从左到右揭开大数字，在下方留出读标题的时间。 | 发布说明里确认过的数字，以及一句能解释它的短标题。 |
| 1.5–4 秒 | 中央标志落定，外围卡片继续旋转。 | 你的品牌标志，以及围绕它的素材、功能或产品。 |
| 4–5 秒 | 让同一个标志进入最后的交接镜头。 | 客户提供什么输入，最后得到什么结果。 |

首批品牌宣传片 MOTION.md 合集计划收录 100 多份拆解。现在可以先读 Firecrawl 的完整样例。

把 Markdown 文件和工程一起交给 Agent。它可以按这份说明改稿，实际动画保存在 HTML、CSS、JavaScript 和素材文件里。[Motion MD v0.1 草案](motion-md.zh-CN.md) · [本片的说明与两次导出](../examples/reference-reveal/MOTION.zh-CN.md)

## Motion 资源库与主题合集

打开 Studio 的**模板库 → 视频复刻**。这里有 136 张参考卡片，同一原片的不同剪辑合并展示。可以先搜 **Kimi K3 teaser** 或 **Reception by ElevenLabs**。点卡片上的「一键复刻」，把复制的指令连同自己的品牌素材贴进 Agent。[浏览精选参考片](collections/README.zh-CN.md) · [查看模板库说明](template-catalog.md)


如果想从已经能打开的工程开始，Studio 还自带 **3 个可编辑模板**。

| [产品宣传 · 20 秒](../template-library/product-promo/) | [数据叙事 · 15 秒](../template-library/nyt-graph/) | [流程讲解 · 10 秒](../template-library/decision-tree/) |
| --- | --- | --- |
| ![多场景产品发布片](../template-library/product-promo/poster.jpg) | ![带标注的动态柱状图](../template-library/nyt-graph/poster.jpg) | ![逐步展开的决策树](../template-library/decision-tree/poster.jpg) |
| 换上自己的标题和片尾。 | 换成自己的数据和标注。 | 改成自己的问题和分支。 |

后续计划按品牌、近期发布和科技榜单整理专题。现在就可以推荐一支片，附上作者、出处和最值得看的那一拍；做出了自己的版本，也可以把创作说明、可编辑工程和预览一起分享。[合集规划](collections/README.zh-CN.md) · [推荐参考片或提交作品](https://github.com/nexu-io/html-anything/issues/new)

### 怎样比较两次复刻

今天就能做的检查是把两支片停在同一个揭晓瞬间，看切换时机，再看画面里能不能认出自己的品牌，最后改一句标题重新导出。**Motion Benchmark / Arena** 提案希望用同一份参考和品牌素材，对不同工具重复这组比较。评分方法和上线时间仍待确定。[阅读评测提案](motion-md.zh-CN.md)

## 构建与贡献

OpenMotion 提供五个创作工作流和九个 MCP 工具。除了直接改模板和复刻参考片，还可以把视频做成可复用的模板目录。贡献一种风格时，请附上原片出处与作者、Motion MD、预览、可编辑工程和素材授权说明。[工作流](skills.md) · [MCP 工具](mcp-phase1-tools.md) · [贡献指南](../CONTRIBUTING.zh-CN.md)

可以从本分支安装，也可以[在本地构建 npm 安装器](npm-installation.md)。OpenMotion 采用 [Apache-2.0](../LICENSE) 许可，使用 [Hyperframes](https://github.com/heygen-com/hyperframes) 构建 Studio 和渲染视频。[内置示例](../template-library/NOTICE.md)、[编辑器](../studio/LICENSE)和[字体](../web/design-system/fonts/NOTICES.txt)附有各自的上游声明。
