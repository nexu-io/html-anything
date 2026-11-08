<h1 align="center">openmotion · 在 Codex 里制作产品视频</h1>

<p align="center">把喜欢的参考片、自己的产品截图和发布文案交给 Codex。<br />
按参考片的节奏做出自己的品牌视频，拿到一支能发的 MP4 和一份能接着改的工程。</p>

<p align="center"><strong><a href="#在-codex-里开始">在 Codex 里试做 20 秒示例</a></strong> · <a href="#用-openmotion-做出的三支片子">观看三支实片</a> · <a href="motion-md.zh-CN.md">认识 Motion MD</a> · <a href="collections/README.zh-CN.md">浏览动效资源库</a></p>

<p align="center"><a href="../README.md">English</a> · <a href="https://github.com/nexu-io/html-anything/blob/legacy/README.zh-CN.md">原 HTML Anything 编辑器与安装说明</a></p>

<p align="center"><img src="readme/hero.zh-CN.svg" alt="openmotion for Codex。Great motion. Made yours. 从参考片、Motion MD 到可编辑的品牌视频。" width="100%" /></p>

openmotion 是一款独立开源的 Codex 动效插件。我们想把它做成最好的 Claude Motion 开源替代。创作可以直接从自己的产品仓库开始。把刚上线的界面和喜欢的发布片指给 Codex，让它沿用那个揭晓镜头的拍法，换上你的标题、配色和素材。到 Studio 里看第一版，觉得界面闪得太快，就让这个镜头多停一拍。导出 MP4，再把拍法写进 **Motion MD**，下次发布时同事也能接着用。

## 用 openmotion 做出的三支片子

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

## 在 Codex 里开始

第一次可以直接用内置的 **Product Promo**，素材已经备好。[模板出片流程](../skills/motion-template-to-video/SKILL.md)

macOS 或 Linux 需要 Git、Node.js 22.18+（含 npm）和支持插件的 Codex CLI。导出 MP4 还需要 Chrome 或 Chromium，以及含 FFprobe 的 FFmpeg。[Windows 安装说明](test-packages.md)

```sh
git clone --branch feature/motion --single-branch https://github.com/nexu-io/html-anything.git openmotion
cd openmotion && bash scripts/install-motion.command
```

安装后请保留这个目录。打开 Codex，对它说：

> 用 openmotion 在 Studio 里打开一份新的 20 秒 Product Promo 示例工程，并把它导出为 MP4。

拿到第一版后，可以试着说：**“结尾标题多停两秒，再导出一版。”** 你也可以自己在 Studio 里拖动片段边缘。两种方式改的是同一份工程。[安装与首次体验手册](usage.md#使用) · [其他 Agent 安装方式](npm-installation.md)

![在 Studio 中打开的 Product Promo 示例，可见视频预览与可编辑时间轴。](readme/editor.jpg)

## 用自己的素材开工

| 你手头有什么 | 可以怎样告诉 Codex | 第一版出来后怎么改 |
| --- | --- | --- |
| 一支参考片和品牌素材 | “保留从标题切到界面的那一拍，用我们的截图和字体。” | 把两支片并排看，微调产品亮相的时机。[复刻参考片](../skills/motion-recreate/SKILL.md) |
| 一份喜欢的模板 | “用 Product Promo 的节奏，换掉开场文案和片尾。” | 在模板副本里改，下一次活动还可以从原版开始。[套用模板](../skills/motion-template-to-video/SKILL.md) |
| 发布说明和一组截图 | “先说用户遇到的问题，再演示新功能，最后停在上线日期。” | 和 Codex 一起定镜头顺序，到 Studio 调整每个镜头的长度。[从创意做原片](../skills/motion-director/SKILL.md) |

## 复用参考片的拍法

看这段 [Firecrawl 的 5 秒发布片](https://static.heygen.ai/hyperframes-oss/desktop/moments/v5/M945/clip.mp4)：先让一个大数字占满画面，再切到一组集成工具。假如你的产品也要发布一批新集成，可以在 Codex 里打开自己的产品项目，贴上片段链接，然后说：

> 保留从大数字切到整组图标的那一拍。数字用发布文案里确认的指标，图标用我们自己的集成图标，配色按品牌手册来。最后一帧多停一会儿，让人读完名字。把原片和我们的版本并排给我看。

复刻流程会读取项目素材、重建这段动画，并交付可编辑的成片工程和对照结果。你可以对着原片调整画面切换的时机，保留自己产品的界面、字体和文案。[参考片复刻流程](../skills/motion-recreate/SKILL.md) · [原片作者与出处](collections/README.zh-CN.md)

## Motion MD

一支成片能让人看到这次发布用了什么拍法。**Motion MD** 让团队写下那些值得在下次发布时沿用的决定。它是我们提出的 Markdown 动效描述规范草案。把它和品牌素材一起存进项目，下次换产品、换文案，仍然可以把同一份说明交给 Codex。

```markdown
## 产品怎么出场
先用一个数字占满画面，第一拍拉远，露出整组集成图标。
名称出现后保持镜头稳定，给观众留出阅读时间。

## 下次发布怎么改
保留拉远的动作和停顿，替换指标、图标和片尾。
把成片的第一帧、最后一帧和参考片并排检查。
```

Motion MD 跟着工程走。实际动画保存在可编辑的 HTML、CSS、JavaScript 和媒体文件里。[Motion MD v0.1 草案](motion-md.zh-CN.md) · [完整示例](examples/product-launch.MOTION.zh-CN.md)

## Motion 资源库与主题合集

目录收录了 **891 条外部参考和 registry 资源**，包括 Pond、Firecrawl 等产品的发布片段。[资源索引](collections/README.zh-CN.md) 标出了所选参考片的作者和出处。想直接动手改，可以先打开 Studio 自带的 **3 个可编辑工程**。

| [产品宣传 · 20 秒](../template-library/product-promo/) | [数据叙事 · 15 秒](../template-library/nyt-graph/) | [流程讲解 · 10 秒](../template-library/decision-tree/) |
| --- | --- | --- |
| ![多场景产品发布片](../template-library/product-promo/poster.jpg) | ![带标注的动态柱状图](../template-library/nyt-graph/poster.jpg) | ![逐步展开的决策树](../template-library/decision-tree/poster.jpg) |
| 换上自己的标题和片尾。 | 换成自己的数据和标注。 | 改成自己的问题和分支。 |

我们计划按品牌、科技榜单和近期发布整理专题。另一个提案 **Motion Benchmark / Arena** 想让不同工作流使用同一支参考片和同一套品牌素材，公开比较镜头节奏、品牌还原度，以及交付后哪些部分还能改。[合集规划](collections/README.zh-CN.md) · [评测提案](motion-md.zh-CN.md)

## 构建与贡献

openmotion 提供五个创作工作流和九个 MCP 工具。除了直接改模板和复刻参考片，还可以把视频做成可复用的模板目录。贡献一种风格时，请附上原片出处与作者、Motion MD、预览、可编辑工程和素材授权说明。[工作流](skills.md) · [MCP 工具](mcp-phase1-tools.md) · [贡献指南](../CONTRIBUTING.zh-CN.md)

可以从本分支安装，也可以[在本地构建 npm 安装器](npm-installation.md)。openmotion 采用 [Apache-2.0](../LICENSE) 许可，使用 [Hyperframes](https://github.com/heygen-com/hyperframes) 构建 Studio 和渲染视频。[内置示例](../template-library/NOTICE.md)、[编辑器](../studio/LICENSE)和[字体](../web/design-system/fonts/NOTICES.txt)附有各自的上游声明。
