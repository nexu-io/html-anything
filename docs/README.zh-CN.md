[English](../README.md) · **简体中文** · [原 HTML Anything 编辑器与安装说明](https://github.com/nexu-io/html-anything/blob/legacy/README.zh-CN.md)

<h1><img src="readme/opendesign-symbol.svg" width="42" height="42" alt="OpenDesign" /> openmotion</h1>

**看到喜欢的产品发布片，把它交给 Codex，做成自己品牌的版本。** openmotion 是一款可独立安装的开源插件，也是 Claude Motion 的开源替代。给它一段参考视频，让它沿用原片揭示产品的节奏，换上项目里已有的截图、Logo 和发布文案。交付物包括一支 MP4 和一份保存在本地的工程，后续可以在对话里改稿，也可以直接在 Studio 时间轴上剪。

把这支片子里产品出场的方式、镜头怎么移动、哪里该停顿写进 **Motion MD**。下次发布换了主角，团队也能沿用这套拍法。

**[试做第一支 20 秒视频](#在-codex-里开始)** · [看一段 5 秒发布片参考](https://static.heygen.ai/hyperframes-oss/desktop/moments/v5/M945/clip.mp4) · [阅读 Motion MD 规范草案](motion-md.zh-CN.md)

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

## 复用参考片的拍法

看这段 [Firecrawl 的 5 秒发布片](https://static.heygen.ai/hyperframes-oss/desktop/moments/v5/M945/clip.mp4)：先让一个大数字占满画面，再切到一组集成工具。假如你的产品也要发布一批新集成，可以在 Codex 里打开自己的产品项目，贴上片段链接，然后说：

> 保留从大数字切到整组图标的那一拍。数字用发布文案里确认的指标，图标用我们自己的集成图标，配色按品牌手册来。最后一帧多停一会儿，让人读完名字。把原片和我们的版本并排给我看。

复刻流程会读取项目素材、重建这段动画，并交付可编辑的成片工程和对照结果。你可以对着原片调整画面切换的时机，保留自己产品的界面、字体和文案。[参考片复刻流程](../skills/motion-recreate/SKILL.md) · [原片作者与出处](collections/README.zh-CN.md)

![用 Motion MD 记录参考片的节奏，并把产品揭示镜头改成自己的品牌版本。](readme/hero.zh-CN.svg)

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
