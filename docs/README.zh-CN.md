[English](../README.md) · **简体中文**

<h1 align="center">OpenMotion</h1>

<p align="center"><strong>All-in-One AI-native Studio，一站式视频创作与剪辑空间。</strong><br/>用 AI 剪辑，讲自己的故事。人人都能创作，人人都是自媒体。<br/>AI 原生、开源的 CapCut 替代。<br/>The open-source Claude Motion alternative.</p>

<p align="center">
  <a href="#ai-video-editing">✂️ AI 剪辑</a> ·
  <a href="#快速开始">开始使用</a> ·
  <a href="#connect-your-agent">连接你的 Agent</a> ·
  <a href="#从-agent-接入">在 Agent 中使用</a><br/>
  <a href="#all-in-one-studio">All-in-One Studio</a> ·
  <a href="#super-motion-video-agent">Super Motion Video Agent</a> ·
  <a href="#产品界面">产品界面</a><br/>
  <a href="motion-md.zh-CN.md">Motion Design MD</a> ·
  <a href="../library/README.zh-CN.md">资源与模板</a> ·
  <a href="#社区共建">社区</a> ·
  <a href="../LICENSE">Apache 2.0</a>
</p>

![OpenMotion：Cut with AI；AI 原生开源 CapCut 与 Claude Motion 替代，让每个人都成为创作者。](readme/cover.png)

[动态封面 GIF](readme/cover-motion.gif) · [GitHub 社交分享图](readme/social-preview.jpg)

<a id="openmotion-是什么"></a>

## 🎬 OpenMotion 是什么？

**OpenMotion 是 All-in-One AI-native Studio：一站式视频创作与剪辑空间，也是以可编辑时间轴为核心的 AI 原生、开源 CapCut 替代。** 用自然语言告诉 AI 你想怎么剪：保留哪些内容、去掉哪些段落、怎样组织故事、在哪里添加字幕、配乐和动效。Agent 根据素材、脚本或确认的时间码修改可编辑工程，你随时在 Studio 中预览、调整并导出 MP4。

**AI 剪辑是核心，创作与表达是目的。** 把灵感、素材、品牌、Agent 与多模态模型带进同一个创作流程：讲清故事，生成缺少的画面和声音，反复打磨剪辑，保留可编辑作品。Claude Motion 为动效创作提供思路。

现在，OpenMotion 已把工程会话、模板发现、素材管理、模型生成、时间轴编辑与 MP4 导出连在一起。完整愿景是一个懂你、懂团队、可协作的创意空间，进一步连接发布管理、周期性任务与反馈数据，让每次创作积累为下一次可用的知识。

**两个接入方向，同一份可编辑工程。**

- **从 OpenMotion 出发 → [连接你的 Agent](#connect-your-agent)。** 打开 Studio，带来素材，连接 Codex、Claude Code 等客户端参与 AI 剪辑。
- **从你的 Agent 出发 → [使用 OpenMotion](#从-agent-接入)。** 通过 **Skills、MCP、CLI** 接入制作能力，让 Agent 创建、修改、预览和导出，随时回到 Studio 细调。

<a id="all-in-one-studio"></a>

## 🌐 All-in-One Studio：从发现灵感，到下一次创作

**发现、制作、交付、学习，都围绕一个创作空间展开。** 我们把完整生命周期作为产品范围；当前可用与后续方向分别标明。

| 创作环节 | Studio 承载什么 | 当前状态 |
| --- | --- | --- |
| **搜索灵感与发现** | 浏览模板与参考，寻找叙事方向，搜索素材并积累想法。 | 已有目录搜索与参考浏览；集成媒体服务搜索 is coming。 |
| **上传与管理素材** | 导入视频、图片、配音和音乐，预览、管理并保留来源。 | 已有工程素材导入、预览与文件操作；团队共享素材库 is coming。 |
| **生成所需素材** | Agent 规划创作，通过多模态模型生成图片、视频、配音和音乐。 | 已有外部 Agent 工作流与 Studio Model Gateway。 |
| **Tell Story 与成片剪辑** | 组织叙事、排列时间轴、打磨声音与动效、替换图片并改编版本。 | 已有可编辑工程与 AI 辅助改稿；自动选段和平台适配 is coming。 |
| **人和 Agent 共同创作** | 一起编辑，在时间轴讨论、评论、评审并继续迭代。 | 已有同一本地工程的交接；协作评论与评审 is coming。 |
| **交付与运营** | 导出不同版本，管理发布、制作任务和周期性自动化。 | 已有 MP4 导出及生成/导出任务状态；发布管理与创作任务自动化 is coming。 |
| **数据回收与持续进化** | 回收表现与评审反馈，检索品牌知识，积累偏好，把有效方法沉淀为 Skill。 | 已可显式提供 Brandkit、Motion MD 和 Skills；数据闭环、长期记忆与 RAG is coming。 |

[完整产品愿景与能力地图](product/studio-vision.md) · [当前技术架构](product/architecture.md)

<a id="super-motion-video-agent"></a>

## 🧠 我们提出 Super Motion Video Agent

**一个贯穿完整创作生命周期的超级视频创作 Agent。** 这是 OpenMotion 提出的 Agent 产品概念：理解创作者、组织任务、编排工具与模型，持续维护可编辑作品，并把经验带到下一次创作。

- **懂你：** 结合目标受众、个人口吻、团队偏好与 Brandkit，理解这支片子为什么而做。
- **会规划：** 把目标拆成调研、素材、脚本、剪辑、评审与交付任务。
- **能创作：** 选择 Skill 与 Agent 模板，编排搜索和多模态模型，把结果落实到同一条时间轴。
- **可协作：** 与人共同创作，处理评审反馈，在改稿中保留工程上下文。
- **会积累：** 连接发布版本与效果数据，检索已有知识，提出下一轮 Skill 和创作方法的改进。

参考 [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness) 与 [Super-agent 研究原型](https://github.com/deepseek-ai/dsh-superagent-prototype) 的持续任务理念，我们将其延伸到视频与 Motion。**Super Motion Video Agent 是产品概念与路线图。** 当前由你连接的 Agent 使用 OpenMotion Skills、工程工具和 Studio 完成创作；常驻编排、发布反馈与学习闭环仍在规划。[设计与状态](product/studio-vision.md#super-motion-video-agent)

<a id="ai-video-editing"></a>

## ✂️ AI 原生时间轴：你讲故事，AI 帮你剪

**用自己的口吻，告诉 AI 这支视频应该怎么讲。** 在时间轴上放置、拖动和重排材料，让 Agent 帮你选段、删改、组织节奏、添加字幕和声画配合。每次调优都落在可以继续编辑的工程里。

| 围绕时间轴的三条主线 | 当前可以怎样使用 | 已确认的产品方向 |
| --- | --- | --- |
| **✂️ 智能剪辑与故事组织** | 导入和排列素材，让 Agent 按脚本或确认的时间码精简指定段落、重排节奏，遵循你的口吻与叙事要求。 | 自动选段、识别无关内容、根据发布目标自动重构画幅。 |
| **✨ 素材生成与搜索** | 在 Studio 通过已配置模型生成图片、视频、音乐和语音；用支持参考图的模型修改选中图片，比较候选并替换，保留原有时长与动画。 | 整合视频、图片、配音、音乐与 Avatar 服务搜索，与生成能力一起供创作使用。 |
| **📤 多平台输入与输出** | 组合支持的本地媒体、脚本、字幕及 Agent 可访问的参考；改编不同构图，导出 MP4 并保留工程。 | 更广的平台链接解析与素材导入、自动格式适配和平台导出预设。 |

右侧为产品方向。当前生成能力取决于供应商配置与模型支持，参考获取和媒体分析取决于所连接 Agent 的工具。[现有素材操作](model-gateway.md) · [路线图](#当前状态与路线图)

1. **带来素材。** 视频、口播、录音、屏幕录制，以及脚本、时间码、参考片和品牌素材。
2. **告诉 AI 怎么剪。** 根据脚本或已确认的时间码精简内容、重排片段、补充画面，调整字幕、配乐与动效。
3. **看结果，继续改。** 在 Studio 里预览，直接调整时间轴，或继续提出修改；最后交付 MP4 和可编辑工程。

> 根据这段口播和带时间码的文字稿，剪成一支 30 秒短片。把核心结论放到开头，删掉我标出的重复段落，补上产品画面、字幕和我提供的配乐。先让我看预览，再根据反馈修改。

<a id="人人都是自媒体"></a>

## 🌱 人人都是 AI 剪辑师，人人都是自媒体

**有想法，就能开始剪辑；有表达，就能开始创作。** 无论是个人、讲师还是小团队，都可以借助 AI 选取内容、组织故事、反复改稿，把素材变成自己的作品。OpenMotion 希望让每个人都能成为 AI 剪辑师，用视频分享知识、表达观点、讲述故事，持续经营自己的内容。

复刻 viral video 的叙事与节奏，剪辑自己的口播，把产品故事讲清楚，再将作品带到小红书、X / Twitter、Instagram 或 YouTube。更好的表达与更稳定的创作，是我们帮助用户争取曝光的方式；传播结果仍取决于内容、受众与平台。

<a id="可以用它做什么"></a>

## 🎞️ 可以用它做什么？

| AI 剪辑与创作场景 | 从什么开始 | 制作与调整什么 |
| --- | --- | --- |
| **AI 口播精剪** | 录制素材、脚本或带时间码的字幕 | 按确认的段落选剪，突出结论、精简重复，添加字幕、补充画面与配乐。 |
| **AI 素材重组与改稿** | 已有片段、屏幕录制和修改目标 | 重排故事与节奏，为同一内容制作不同长度和画幅的版本。 |
| **产品发布与功能演示** | 产品截图、需求简报、品牌素材 | 产品揭示、功能导览与发布宣传片。 |
| **Viral video 复刻** | 参考链接、自己的品牌与素材 | 分析开场、节奏和视觉结构，重建可编辑的个人版本。 |
| **讲解与教程** | 脚本、操作流程或复杂概念 | 逐步讲述、流程图与带标注的场景。 |
| **数据故事与动态图表** | 数据、标签和需要表达的结论 | 动态图表、对比与可视化讲解。 |
| **音乐与艺术视觉** | 音轨、画面素材和创作方向 | 动态排版、图形序列与配合声音的运动。 |

| [产品宣传 · 20 秒](../template-library/product-promo/) | [数据叙事 · 15 秒](../template-library/nyt-graph/) | [流程讲解 · 10 秒](../template-library/decision-tree/) |
| --- | --- | --- |
| ![协作画布式产品发布片](../template-library/product-promo/poster.jpg) | ![带标注的动态柱状图](../template-library/nyt-graph/poster.jpg) | ![逐步展开的决策树](../template-library/decision-tree/poster.jpg) |

三个随包提供的可编辑[示例](../template-library/NOTICE.md)。替换内容、调整节奏，即可开始制作自己的版本。

<a id="input--process--output"></a>

## 🔄 Input → Process → Output

**带来素材 → 用 AI 剪辑 → 分享你的表达。** 从第一版简报到下一次改稿，整个生命周期围绕同一份工程展开。

```text
INPUT     收集视频、录音、链接、脚本与品牌素材
PROCESS   确定故事 → 排列粗剪 → 完善素材、动效与声音
          → Studio 预览 → 提出反馈 → 继续修改同一条时间轴 ↺
OUTPUT    导出 MP4 + 保留可编辑工程 → 改编下一版
```

**工程保存作品，Agent 落实意图，时间轴保留你的控制权。** 每次修改前，Agent 读取当前工程与 revision；修改后，你可以预览、细调并继续反馈。导出固定一个版本，源工程保留给下一次剪辑。

| 阶段 | 你带来什么 / 得到什么 | 当前使用方式 |
| --- | --- | --- |
| **Input · 本地素材** | 已有视频、录音、口播、屏幕录制、图片和品牌资产 | 将支持的本地媒体导入工程，保留素材与来源。 |
| **Input · 在线参考** | YouTube、X / Twitter 视频或其他参考材料 | 把链接交给 Agent；由具备相应浏览与媒体能力的宿主读取，或提供可访问的本地文件。 |
| **Input · 文字与字幕** | 一句话、完整脚本、Markdown、SRT / VTT | Agent 阅读文本与时间码，将其转成分镜、片段和字幕；文本文件可随工程保存。 |
| **Process · AI 剪辑与设计** | 选段、去掉无关内容、重排节奏、添加文字与动效转场 | Agent 根据脚本或已确认的时间码修改工程，用户在 Studio 中预览并继续编辑。 |
| **Process · 声音与素材** | 配乐、配音、补充视频与图片 | 导入已有素材，或在配置了相应模型的 Studio 网关中生成，选择后放入时间轴。 |
| **Output · 成片与源文件** | MP4，以及可继续修改的 HTML/CSS/JS 与素材 | 按工程画幅和帧率渲染固定版本，技术检查后下载，保留源工程。 |

**为发布目标制作不同版本：** 可让 Agent 调整为竖屏、横屏或方形构图，分别准备小红书、X / Twitter、Instagram、YouTube 的 MP4。发布前核对平台当时的规格；当前没有内置各平台一键发布或独立格式预设。在线下载、转写与自动口头禅识别需要宿主工具或已有字幕，链接输入不等于应用自带下载器。

## 为什么选择 OpenMotion？

- **把剪辑意图变成实际修改。** 用自然语言提出删改、重排、节奏和声画要求，让 Agent 修改工程，再在 Studio 中预览与细调。
- **沿用你熟悉的 Agent。** 通过本机 MCP 与可复用 Skills 接入，继续使用已有的 Agent 账户和工作流。
- **让动效风格可以沿用。** 用可读的 `MOTION_DESIGN.md` 记录品牌、节奏、运动与声音，供下一支视频使用。
- **从参考与模板开始。** 浏览数百条目录资源，追溯出处，直接打开内置可编辑示例。
- **保留作品源文件。** 工程由 HTML、CSS、JavaScript 和媒体组成；本地预览、导出 MP4，以后继续改。

<a id="产品界面"></a>

## 🖥️ 产品界面

**工作区与模板库。** 从需求或模板开始，回到已有会话，连接你的 Agent。

![OpenMotion 工作区与模板库，Studio 0.6.1 实际界面。](readme/workspace.jpg)

**AI 剪辑与时间轴。** 检查 Agent 的剪辑结果，继续调整场景、素材与时序，再导出。

![OpenMotion Studio：合成、预览、属性面板与时间轴，Studio 0.6.1 实际界面。](readme/editor.jpg)

**完整创作流程有多个入口：** 工作区管理会话与工程，模板库提供起点，Studio 提供合成、素材、代码、预览和时间轴。模型网关可通过已配置的供应商生成图片、视频与音频，再由你选择并放入工程。

截图来自现有 Studio 0.6.1 演示工作区，保留当时的界面文字。[图片来源](readme/ASSETS.md) · [编辑器说明](../studio/README.md) · [素材生成](model-gateway.md)

<a id="独立应用也能接入你的-agent"></a>
<a id="connect-your-agent"></a>

## 🔌 在 OpenMotion 中连接你的 Agent

**先打开应用，再连接熟悉的 AI 剪辑伙伴。** Studio 是可以独立使用的工程、素材与时间轴工作区。

1. [启动 OpenMotion](#快速开始)，打开模板或已有工程，点击 **Connect Agent**。
2. 选择客户端，按当前工作区提供的说明配置连接。
3. 把工程上下文和剪辑要求交给该 Agent；在 Studio 检查修改，直接调整时间轴，再继续下一轮改稿。

目前可用的接入路径：

| Agent / 客户端 | 接入方式 |
| --- | --- |
| **Codex** | 本机插件，或 MCP + Skills 安装。 |
| **Claude Code** | 本机插件，或 MCP + Skills 安装。 |
| **DeepSeek Harness** | Harness 适配器，或 MCP + Skills 安装。 |
| **WorkBuddy** | 已有 MCP + Skills 配置生成；桌面创作与播放验收待完成。 |
| **其他本机 MCP 客户端** | 手动配置 stdio；可用的界面与终端能力由宿主决定。 |

目前 Agent 在所连接的客户端中执行。Studio 保存需求与可编辑作品，尚未内置聊天 Agent 运行器。[Agent 适配器](agent-adapters.md) · [会话架构](session-architecture.md)

<a id="motion-design-md--motion_designmd"></a>

## 🎨 Motion Design MD — `MOTION_DESIGN.md`

**为视频建立可复用的动态设计语言。** Motion MD 描述一支片子如何展开：产品何时出现、视线如何移动、标题停留多久，以及声音在哪里推动叙事。把这些决定与品牌素材一起保存，让下一支视频可以接着使用。

```markdown
# 产品发布 — Motion Design

## 品牌
使用我们的 Logo、字体、配色与产品截图。

## 叙事与节奏
0–3 秒呈现问题，3–8 秒揭示产品。
8–16 秒展示两个卖点，16–20 秒停留在行动提示。

## 运动与声音
保留连续画布，每次揭示之后留出阅读时间。
产品揭示与音乐重点对齐，为结尾文案留出空间。

## 保留与替换
保留揭示顺序，替换 Logo、截图、文案与行动提示。
```

**Motion MD 目前是 v0.1 提案。** 可以将简报保存为 `MOTION_DESIGN.md`，明确交给 Agent 阅读。文件名是写作约定，尚无自动导入或校验器；现有 `MOTION.md` 示例仍可作为创作上下文。工程本身继续使用可编辑的 HTML/CSS/JS 与媒体。

[阅读规范提案](motion-md.zh-CN.md) · [使用完整示例](examples/product-launch.MOTION.zh-CN.md)

<a id="creative-memory"></a>

## 📚 一个越用越懂你的创意空间 — is coming

**懂个人的口吻，懂团队的知识，记得品牌的表达。** 长期愿景是把项目历史、确认过的偏好、品牌规则、评审反馈和可复用 Skills 放在一起，让 Agent 在下一次任务中检索并使用合适的上下文。

```text
当前可用
  简报 + 品牌 → 创作 → 预览 → 改稿 → 工程版本 + MP4

规划中 · is coming
  发布版本 + 表现数据 + 评审反馈
        ↓
  关联项目、平台与时间窗口的证据
        ↓
  个人 / 团队知识 → 用 RAG 检索相关上下文
        ↓
  提出 Skill 或偏好更新 → 评估 → 保存版本
        ↓
  下一次创作从更合适的上下文开始
```

这条闭环连接**发布管理与周期性任务、关联成片版本的表现数据、个人与团队记忆，以及 RAG（按需检索知识）**。被验证的方法可以沉淀为 Skill，有用的编排可以沉淀为模板，品牌与动效选择通过 Brandkit 和 `MOTION_DESIGN.md` 持续复用。是否改进，要在下一次创作中评估。

当前通过显式提供这些文档和保留可编辑工程来复用经验；自动发布、数据回收、长期偏好记忆、RAG 与自动提炼 Skill 均为后续能力。[知识与反馈闭环设计](product/studio-vision.md#knowledge-and-feedback)

<a id="资源模板与社区作品"></a>

## 🧩 资源、模板与社区作品

![为复用而生：Skills、模板、Motion 组件、设计体系与 Brandkits。](readme/library.png)

**从第一天就开放的 [OpenMotion Library](../library/README.zh-CN.md)。** 一个目录，收纳创作方法、可编辑作品与可参考的设计体系：

| 你想复用什么 | 目录与首批内容 |
| --- | --- |
| **🧠 Skill** | [`library/skills/`](../library/skills/) · [Brandkit 整理](../library/skills/brandkit/SKILL.md)。 |
| **🎞️ 模板** | [`library/templates/`](../library/templates/README.md) · 三个现有可编辑工程入口。 |
| **🧩 Motion 组件** | [`library/components/`](../library/components/README.md) · 标题揭示配方、外部组件参考。 |
| **🎨 动效设计体系** | [`library/design-systems/`](../library/design-systems/) · [Ink & Water / `MOTION_DESIGN.md`](../library/design-systems/ink-water/MOTION_DESIGN.md)。 |
| **💼 Brandkit** | [`library/brandkits/`](../library/brandkits/) · [OpenMotion 品牌事实与素材](../library/brandkits/openmotion/BRANDKIT.md)。 |

选择文件，连同素材明确交给 Agent。目录当前可直接浏览和贡献；尚无自动导入或 marketplace。五个核心制作 Skills 继续在 `skills/` 维护。[贡献一个条目](../library/ENTRY_TEMPLATE.md)

### 为 Agent 打造的模板社区

**模板同时提供可编辑结构与 Agent 能使用的说明。** 选定起点，带上自己的 Brandkit 和故事，让 Agent 复刻、个性化替换并继续调优。社区贡献可以把源码、可修改项、Motion MD、预览和出处一起交付。

> 用 Product Promo 模板和我的 Brandkit，按我的口吻讲这个故事。替换素材与文案，调整节奏，先让我看预览，再根据反馈优化。

当前画廊的一键操作准备交给 Agent 的指令，实际制作由所连接的 Agent 执行；社区资源的自动发现、安装与个性化优化仍为后续方向。[模板入口](../library/templates/README.md)

### 看看资源里的作品

**可以学习、改编，也可以贡献的资源库。** 当前目录共有 **894 条资源：3 个内置可编辑模板、891 条外部参考与 registry 资源**。可浏览产品宣传、动态设计、口播参考与可复用元素，并查看已有的原作者和出处。

<table>
<tr>
<td width="33%" valign="top"><a href="https://raw.githubusercontent.com/heygen-com/hyperframes/main/registry/blocks/app-showcase/registry-item.json"><img src="../web/catalog/covers/51a2d141e18e608cc11b9256.jpg" alt="App Showcase" width="260" /></a><br/><sub><b>App Showcase</b> · Hyperframes</sub></td>
<td width="33%" valign="top"><a href="https://static.heygen.ai/hyperframes-oss/desktop/viral-clone/remix-firecrawl-reference.mp4"><img src="../web/catalog/covers/02f9ae975461fe6290062d7f.jpg" alt="Firecrawl Free Keyless" width="260" /></a><br/><sub><b>Firecrawl Free Keyless</b> · @ericciarla</sub></td>
<td width="33%" valign="top"><a href="https://raw.githubusercontent.com/heygen-com/hyperframes/main/registry/blocks/glass-shard-title/registry-item.json"><img src="../web/catalog/covers/10cceacc02d415247d58f562.jpg" alt="Glass Shard Title" width="260" /></a><br/><sub><b>Glass Shard Title</b> · Hyperframes</sub></td>
</tr>
<tr>
<td width="33%" valign="top"><a href="https://raw.githubusercontent.com/heygen-com/hyperframes/main/registry/blocks/code-3d-extrude/registry-item.json"><img src="../web/catalog/covers/0a5c7158bbecd6e47055bef9.jpg" alt="Code 3D Extrude" width="260" /></a><br/><sub><b>Code 3D Extrude</b> · Hyperframes</sub></td>
<td width="33%" valign="top"><a href="https://raw.githubusercontent.com/heygen-com/hyperframes/main/registry/blocks/chrome-orb/registry-item.json"><img src="../web/catalog/covers/dbd79cc4d686e0f4513ff2c9.jpg" alt="Chrome Orb" width="260" /></a><br/><sub><b>Chrome Orb</b> · Hyperframes</sub></td>
<td width="33%" valign="top"><a href="https://static.heygen.ai/hyperframes-oss/desktop/viral-clone/jake-pond-reference.mp4"><img src="../web/catalog/covers/66ac2f8b58e55670971ae70c.jpg" alt="Pond: a new Linux OS" width="260" /></a><br/><sub><b>Pond: a new Linux OS</b> · @bflycomputer</sub></td>
</tr>
</table>

目录中的真实参考与 registry 预览，点击查看原始来源。这些图片展示资源内容，非新增内置模板。

| 入口 | 可以找到什么 |
| --- | --- |
| [Motion 资源索引](collections/README.zh-CN.md) | 精选参考片、出处和可编辑起点。 |
| [内置模板](../template-library/) | Product Promo、NYT Graph、Decision Tree，均包含原生源码与预览。 |
| Studio 模板库 | 搜索、预览，以及改编模板或复刻参考的指令。 |
| [OpenDesign Motion 展示页](https://open-design.ai/motion/) | 更多可以观看和学习的案例。 |
| [Motion MD](motion-md.zh-CN.md) | 记录并分享一种风格背后的创作决定。 |

参考片用于学习，可编辑模板提供能够修改的源文件。画廊里的**一键复刻**会复制参考和 Agent 指令；内置模板直接打开，外部视频则需要分析与重建。[目录覆盖范围与来源](template-catalog.md)

## 产品哲学与技术架构

**Studio 是创作空间，Super Motion Video Agent 是编排愿景，时间轴与工程保存作品。** 多模态模型生产素材，可复用知识指导创作，规划中的反馈闭环连接前后两次创作。[目标架构与能力状态](product/studio-vision.md)

1. **人人都是 AI 剪辑师。** 从用户已有的素材和表达意图开始，由 AI 落实剪辑与改稿，让每个人都能持续创作自己的内容。
2. **人和 Agent 操作同一份作品。** 对话、可视化编辑和代码修改共同落在可编辑工程上，后续修改有据可循。
3. **把经验变成可以分享的规范。** Motion MD 记录风格与节奏，Skills 记录方法，模板保存可复用的实现。
4. **开放、可检查、可延续。** 保留源码、素材来源与版本，应用采用 Apache 2.0，创作者可以继续修改和扩展。

**两个入口，共用一个工程：** Studio → 连接 Agent → 你的客户端；或你的客户端 → Skills / MCP / CLI → OpenMotion。所连接的客户端执行 Agent，本地应用管理工程状态。

**当前已实现的生产架构。** 工程与时间轴是作品真源，模型生成结果经显式采用后进入工程。

```text
OpenMotion Studio                      你的 Agent 客户端
素材 · 预览 · 时间轴                   Skills · Brandkit · Motion MD
          | HTTP                                | stdio MCP
          +------------------+------------------+
                             v
                  本地应用（Node.js）
                  会话 · 文件 · revision
                             |
                  可编辑工程 + 媒体
                  HTML · CSS · JS · compositions
                             |
                  固定 revision 快照
                             |
                  渲染 + 技术检查
                             |
                  MP4 + 可编辑源工程

素材执行路径
  Studio → Model Gateway → 多模态模型 → 候选文件
         → 显式采用 → 同一份可编辑工程
```

| 层 | 职责与技术 |
| --- | --- |
| **创作方法** | Library 提供 Brandkit、设计体系与组件配方；五个 Motion Skills 组织叙事、模板复用、复刻、审片与交付；Motion MD 承载可复用的创作意图。 |
| **独立应用** | React / TypeScript Studio 提供会话、模板库、预览、素材面板与时间轴。 |
| **Agent 接入** | 本机 stdio MCP 提供九个工程工具与指引资源；终端宿主可调用固定版本 CLI。 |
| **工程与版本** | Node.js 本地服务管理 HTML/CSS/JS、媒体、revision 与内容版本，保护并发修改。 |
| **素材生成** | Model Gateway 管理供应商配置和生成任务；用户选择结果后写入作品。 |
| **渲染与交付** | 原生合成与 GSAP 承载动效，固定快照导出 MP4，并通过 FFmpeg / FFprobe 做技术检查。 |

### 工程、素材与导出为什么可以持续迭代

- **版本感知的修改：** Agent 先读当前工程与 revision，再写入；冲突后重新读取，避免沿用过时内容覆盖作品。
- **生成与采用分离：** 模型先产出候选文件；用户选中并采用后才修改时间轴。替换图片保留原有时长与动画。
- **固定快照导出：** 导出绑定确定的工程版本，渲染和技术检查围绕该快照进行，后续改稿仍保留源工程。
- **方法与作品分离：** Skill 记录工作方法，Motion MD / Brandkit 提供创作上下文，工程保存实际结果；规划中的 RAG 从知识中检索上下文。

[完整产品架构](product/architecture.md) · [工程与版本](project-workspace.md) · [模型网关](model-gateway.md) · [MCP 契约](mcp-phase1-tools.md)

<a id="快速开始"></a>

## 🚀 快速开始

### 运行独立应用

准备 Git、[CI](../.github/workflows/ci.yml) 固定的 **Node.js 26.11.1** 与 npm。源码运行的预览和导出还需要 Chrome/Chromium、FFmpeg/FFprobe；运行时路径配置见[使用手册](usage.md)。

```sh
git clone --branch feature/motion https://github.com/nexu-io/html-anything.git openmotion
cd openmotion
npm ci
npm run build:studio
npm start
```

打开 **http://localhost:4173**，进入**模板 → 可以二次剪辑**，选择一个内置示例，试着修改文字和时间。通过**连接 Agent**添加你熟悉的客户端。

工程与凭据保存在源码目录外，可用 `MOTION_DATA_DIR` 指定工作区。[本地 npm 安装器](npm-installation.md) 可在支持的平台按需准备固定版本的原生工具。目前 npm 包尚未公开发布。[Windows 测试包](test-packages.md) · [仓库与分支说明](repository-migration.md)

<a id="在-codex-里开始"></a>

### 为 Codex 安装

在源码目录中执行，需要支持插件的 Codex CLI：

```sh
bash scripts/install-motion.command
```

然后告诉 Agent：

> 用 Product Promo 模板创建一个独立的 20 秒工程，在 Studio 中打开并交付 MP4。保留可编辑工程，之后继续修改。

制作自己的品牌片时，再提供 Logo、截图与文案。宿主不支持在对话旁打开 Studio 时，使用返回的本地工程链接。[安装与首次体验](usage.md#使用)

<a id="从-agent-接入"></a>

## 🤖 把 OpenMotion 接入你的 Agent

**先打开 Codex、Claude Code 等客户端，再把 OpenMotion 带进已有工作流。** 安装创作 Skills、连接本机 MCP，需要终端编排时使用 CLI。让 Agent 创建或打开工程、完成剪辑、提供预览并导出；你随时可以进入 Studio 细调同一份作品。

Skills 提供**工作方法**，MCP 提供**工程工具与指引**，CLI 支持**原生编写与渲染**。两种接入方向共用本地应用。[从 OpenMotion 应用开始？](#connect-your-agent)

### Skills：创作与制作流程

通过 [Skills CLI](https://github.com/vercel-labs/skills) 发现本地技能。在源码目录执行：

```sh
npx skills add ./skills --list
npx skills add ./skills --skill motion-director motion-production motion-template-to-video motion-recreate motion-video-to-template
```

在安装器中选择 Agent。五个技能一起安装，以保留互相引用的共享规范。这一步安装工作流指引；工程工具和固定版本引擎指南通过应用的 MCP 接入。保留源码目录，供 Agent 读取共享文档。需要同装应用、MCP 和 Skills 时，使用[宿主安装指南](npm-installation.md)。

| Skill | 适用场景 |
| --- | --- |
| [motion-director](../skills/motion-director/SKILL.md) | 原创影片、叙事、动作、声音设计与创作品质审片。 |
| [motion-template-to-video](../skills/motion-template-to-video/SKILL.md) | 使用已有可编辑模板制作视频。 |
| [motion-recreate](../skills/motion-recreate/SKILL.md) | 参考视频重建、可编辑工程与效果对照。 |
| [motion-video-to-template](../skills/motion-video-to-template/SKILL.md) | 将视频制作成可复用模板。 |
| [motion-production](../skills/motion-production/SKILL.md) | 局部修改、预览、技术检查、排错与导出。 |

### MCP：操作同一份工程

在应用中使用**连接 Agent**获取当前工作区配置，或为本机 stdio 客户端填写绝对路径：

```json
{
  "mcpServers": {
    "openmotion": {
      "command": "/absolute/path/to/node",
      "args": ["--experimental-strip-types", "/absolute/openmotion/mcp.ts"],
      "env": { "MOTION_DATA_DIR": "/absolute/openmotion-data" }
    }
  }
}
```

**九个公开工具**覆盖工程创建与读取、编辑、预览、素材导入、导出、版本恢复和任务取消。Skill 与引擎指南也可通过 MCP Resources 读取。[工具契约](mcp-phase1-tools.md) · [各宿主接入](agent-adapters.md)

### CLI：本地执行

通过 `npm start` 启动应用，`npm run mcp` 启动 stdio 服务。具备终端能力的 Agent 还可以使用随包固定版本的引擎 CLI，执行 `lint`、`timeline`、`info` 等原生命令；路径以运行时返回的 `hyperframesCli` 为准。受管理工程的修改通过 MCP 版本校验。[CLI 与原生创作说明](../skills/motion-production/references/native.md)

<a id="给创作者媒体与他们的-agent"></a>

## 📣 给创作者、媒体与他们的 Agent

把这份 README 和[媒体事实包](media-kit.md)直接交给你的 Agent，用于制作演示、文章、评测或报道。事实包包含可引用简介、图片来源、功能状态和可复现演示路径。

```text
读取 OpenMotion README 与 docs/media-kit.md。
以“All-in-One AI-native Studio，让人人都成为创作者”为主线，制作 30 秒产品介绍与中文文章。
介绍我们提出的 Super Motion Video Agent 概念，以及发布、反馈、知识和 Skill 持续迭代的愿景。
主定位是以 AI 原生时间轴为核心的开源 CapCut 替代，Claude Motion 是动效创作参照。
说明两个接入方向：在 OpenMotion 中连接 Agent，以及通过 Skills / MCP / CLI 在 Agent 中使用 OpenMotion。
围绕智能剪辑与故事组织、素材生成与搜索、多平台输入输出讲述，标清每项能力的状态。
以 Input → Process → Output 组织内容，演示提出剪辑要求、Agent 修改工程、Studio 预览与改稿。
再展示 Motion MD 和模板如何复用剪辑经验。
使用仓库提供的封面与截图，并注明参考资源的作者。
将当前能力与愿景分开；没有实测的功能不要演成已经完成。
如果已连接 OpenMotion，交付可编辑工程和 MP4；文章保留资料链接。
```

<a id="当前状态与路线图"></a>

## 🗺️ 当前状态与路线图

| 范围 | 当前状态 |
| --- | --- |
| 独立 Studio、本地工程、可视化修改、MP4 导出 | 已实现；安装与实际成片仍按目标环境验证。 |
| Super Motion Video Agent、发布自动化与知识反馈 | 产品概念 / is coming；常驻编排、数据回收与 RAG 仍在规划。 |
| Agent 接入 | 五个核心 Skills、九个公开 MCP 工具；各宿主能力见接入文档。 |
| OpenMotion Library | 已有五类目录与首批内容，手动选择并交给 Agent 使用。 |
| `MOTION_DESIGN.md` | v0.1 创作规范提案；没有自动导入器或校验器。 |

### 🫶 人和 Agent 协同进行 AI 剪辑与 Motion 创作 — is coming

**一起构建 AI 原生的视频创作与剪辑空间。** 从第一版剪辑到动效设计和最终评审，人和 Agent 围绕同一个视频项目共同创作。

![OpenMotion 人与 Agent 协作概念：在时间轴选区旁评论、讨论和评审，共同调整同一视频项目。is coming。](readme/collaboration-coming.png)

- **共同编辑。** 一起组织故事、剪辑片段和制作动效，协作推进同一份项目。
- **在时间轴上评论。** 将反馈关联到具体时刻或片段范围，与 Agent 讨论修改，让评审上下文留在作品旁边。
- **一起评审与迭代。** 把评论落实为修改，共同检查结果，在同一个创作空间里持续打磨。

*is coming · 生成式概念预览，展示规划中的协作体验，尚未公布上线日期。*

接下来希望和社区一起推进，以下均未承诺上线日期：

- [ ] Super Motion Video Agent：持续的创作任务规划、执行与评审。
- [ ] 发布管理、周期性制作任务与事件触发的自动化。
- [ ] 关联版本的效果数据、个人/团队记忆、RAG 与经过评估的 Skill 改进。
- [ ] 团队共享素材库与面向 Agent 的社区模板安装。
- [ ] 自动选段、无关内容识别与面向发布目标的自动画幅重构。
- [ ] 视频、图片、配音、音乐与 Avatar 服务的集成搜索。
- [ ] 更广的平台链接解析与素材导入。
- [ ] 更多可编辑模板、Motion 组件、Brandkits 和设计体系。
- [ ] Library 的搜索、预览与显式导入体验。
- [ ] 同一需求的多个版本预览和对照。
- [ ] 面向社交平台的画幅、字幕与导出预设。
- [ ] 有公开样本和方法的 Motion Benchmark / Arena。

<a id="社区共建"></a>

## 🤝 社区共建

分享作品，也分享制作它的方法。在 [Issues](https://github.com/nexu-io/html-anything/issues) 提需求、报错或展示可复现案例；在 [OpenDesign Discord](https://discord.gg/mHAjSMV6gz) 交流创作。[资源库](../library/README.zh-CN.md) · [文档](README.md)

### 从一个文件夹开始贡献

| 想贡献什么 | 放在哪里 | 一次有用的贡献 |
| --- | --- | --- |
| **🧠 Skill** | [`library/skills/`](../library/skills/) | `SKILL.md`、触发示例与实际使用说明。 |
| **模板 / 组件** | [`library/templates/`](../library/templates/README.md) / [`library/components/`](../library/components/README.md) | 源码或配方、可修改项、预览、来源与验证记录。 |
| **设计体系 / Brandkit** | [`library/design-systems/`](../library/design-systems/) / [`library/brandkits/`](../library/brandkits/) | `MOTION_DESIGN.md` 或 `BRANDKIT.md`，附参考、品牌事实与素材许可。 |
| **Agent 接入** | [`shared/integration.ts`](../shared/integration.ts) · [适配说明](agent-adapters.md) | 一个明确的配置或宿主兼容改进，附对应检查。 |
| **编辑体验** | [`studio/src/motion/`](../studio/src/motion/) | 一个可复现的交互问题及修复。 |
| **翻译与文档** | [英文 README](../README.md)、本页与相关专题 | 双语口径同步，修复可实际访问的入口。 |

先读 [AGENTS.md](../AGENTS.md) 和 [贡献指南](../CONTRIBUTING.zh-CN.md)，选择一个范围，提交来源、实际变化和验证结果。Agent 也沿用同一流程；不要把仅有封面的参考写成已验证模板。

### Contributors

感谢每一位贡献代码、文档、Skills、设计体系、作品和问题反馈的人。下方展示当前 GitHub 仓库的贡献者，包含 HTML Anything 历史贡献。

[![仓库贡献者](https://contrib.rocks/image?repo=nexu-io/html-anything)](https://github.com/nexu-io/html-anything/graphs/contributors)

[查看全部贡献者](https://github.com/nexu-io/html-anything/graphs/contributors) · [开始贡献](../CONTRIBUTING.zh-CN.md)

![做出值得分享的作品：用 OpenMotion 创作，把学到的方法贡献回来。](readme/community.png)

## 参考与致谢

说明借鉴了什么，以及在仓库中对应哪里。

| 来源 | 关系与落点 |
| --- | --- |
| [OpenDesign](https://github.com/nexu-io/open-design) / [官网](https://open-design.ai/) | UI 视觉系统来源、README 的资源与贡献结构、水墨品牌方向。对应 [UI 来源记录](design-system.md)、[Brandkit](../library/brandkits/openmotion/BRANDKIT.md) 与 [Library](../library/README.zh-CN.md)。 |
| [HTML Anything](https://github.com/nexu-io/html-anything/tree/legacy) | 仓库前身；参考其文字架构图、贡献路径与来源表格。旧 `next/` 架构留在历史分支，当前结构见[迁移说明](repository-migration.md)。 |
| **Claude Motion / CapCut** | 分别作为 Agent 视频创作与大众剪辑体验的产品参照；不代表功能完全对等或源码来源。 |
| [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness) / [Super-agent 原型](https://github.com/deepseek-ai/dsh-superagent-prototype) | 可扩展 Agent 能力与持续任务工作的参考。Super-agent 仓库为研究原型；我们提出 [Super Motion Video Agent](product/studio-vision.md#super-motion-video-agent) 概念，本次未引入其运行时。 |
| [OpenChatCut](https://github.com/0xsline/OpenChatCut) | 参考可持续编辑工程与 AI 剪辑生命周期的产品理念，体现在 [AI 剪辑](#ai-video-editing)与[完整流程](#input--process--output)；本次文档改动未引入其代码。 |
| [ChatCut](https://chatcut.io/docs/what-is-chatcut) | Agent 与编辑器衔接、口播与创作者场景的产品参考。 |
| [Hyperframes](https://github.com/heygen-com/hyperframes) | 感谢其原生合成、Studio、渲染基础与资源。对应 [Studio](../studio/README.md)、[引擎说明](hyperframes.md)、[模板声明](../template-library/NOTICE.md) 与 [目录来源](template-catalog.md)。 |
| [GSAP](https://github.com/greensock/GSAP) / [FFmpeg](https://ffmpeg.org/) | 动画时序与媒体渲染/检查依赖；版本见 [package.json](../package.json) 与 [运行时锁](../scripts/runtime-lock.json)。 |

原始资源保留作者、出处与许可；产品灵感、实际依赖和第三方作品分别说明。

<a id="许可与致谢"></a>

## ⚖️ 许可与致谢

OpenMotion 采用 [Apache-2.0](../LICENSE) 许可。

上游编辑器、模板、字体与媒体保留各自许可和署名，详见上方来源表与[素材说明](readme/ASSETS.md)。

开发分支为 [`feature/motion`](https://github.com/nexu-io/html-anything/tree/feature/motion)。原 HTML Anything 应用仍在 `main`，并已保留在 [`legacy`](https://github.com/nexu-io/html-anything/tree/legacy)。分支与分发状态见[迁移说明](repository-migration.md)。
