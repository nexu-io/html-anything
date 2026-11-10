[English](motion-md.md) · **简体中文** · [OpenMotion](README.zh-CN.md)

# Motion.md

**复用动效，讲你的故事，把创作方法变成社区资产。**

一支好的 reference video，包含的不只是配色，还有开场钩子、镜头顺序、运动路径、阅读节奏，以及声音推动叙事的时刻。**`MOTION_DESIGN.md` 把这些创作决定记录下来，让 Agent 保留动效语言，换成用户自己的主题、内容和品牌。** 再把方法、可编辑源码、替换输入和真实成片一起打包，就形成可以复用、传播和继续改进的 Motion Design Skill 包。

**Motion.md 是完整的创作设计规范，Brand Kit 是它内部的品牌章节**，与叙事、动效、声音和审阅规则一起构成同一份设计上下文。Logo、配色、字体、语气、产品事实和已确认素材都归入该章节；已有品牌文件可以作为引用材料，不要求另写一份与 Motion.md 并列的 `BRANDKIT.md`。

[六组 reference / remix 动态对比](motion-design-examples.zh-CN.md) · [可运行的 Skill 包](../library/skills/motion-design-remix/SKILL.md) · [Ink & Water 设计体系](../library/design-systems/ink-water/MOTION_DESIGN.md) · [Brandkit](../library/brandkits/openmotion/BRANDKIT.md)

**当前状态：** Motion.md 是 v0.1 写作提案，由用户显式交给 Agent 阅读；尚无自动导入、解析、注册或跨引擎执行保证。示例 Skill 的脚本只复制六种指定源码并执行已记录的内容替换，不会解释 Markdown，也不会自动重建任意视频。

## 1. 从一支参考视频，到可复用的 Motion Design Skill 包

核心目标是：**保留好的创意结构，换主题、换文案、换品牌。** 一次经过检查的复刻，可以变成下一位创作者的起点。

```text
REFERENCE VIDEO                                 你的需求与素材
开场 · 镜头 · 运动 · 节奏 · 声音                  文案 · 产品 · 品牌 · 配音
          |                                              |
          v                                              v
                   MOTION DESIGN SKILL PACKAGE
          +------------------------------------------------+
          | SKILL.md           如何改编与检查               |
          | MOTION_DESIGN.md   保留什么，以及为什么         |
          | 可编辑源码         动效怎样实现                 |
          | 替换配置与素材     本次故事改什么               |
          | 预览与验证记录     实际做出了什么               |
          +------------------------------------------------+
                                |
                                v
                       AGENT + 可编辑工程
                       修改 → 预览 → 比较 → 迭代
                                |
                                v
                       新的视频 + 可复用源码
                                |
                       分享 / Fork / 改进 / 评审
```

这里的 clone 是保留约定的镜头、节奏与动效语言，同时改写内容。有可用源码时复用实现；只有参考视频时，先逐镜头分析和重建，比较差距，再把确认后的结果沉淀为包。Markdown 本身不能保证效果完全一致；还原程度取决于源码、素材、字体、镜头、时间关系与实际渲染。

## 2. 架构：创作意图、执行方法、工程实现与证据分层

| 层次 | 文件 / 产物 | 职责 | 具体例子 |
| --- | --- | --- | --- |
| 创作设计规范 | `MOTION_DESIGN.md` | Brand Kit、叙事、构图、节奏、运动、声音与审阅规则 | 同一份设计上下文指导品牌与动效。 |
| 规范内的 Brand Kit | `MOTION_DESIGN.md` → Brand Kit 章节 | 名称、事实、Logo、字体、配色、语气与已确认素材，可内联或引用 | 换成用户的产品，保留真实事实。 |
| Agent 方法 | `SKILL.md` | 选择输入、改编、检查、交付 | 读取所选 profile，更换标题，在主要停留点检查。 |
| 替换契约 | Preset / 参数 Schema | 可改字段、长度、素材角色与缺失处理 | 标题最多 18 字符；保持时间轴。 |
| 可执行工程 | HTML/CSS/JS 与素材 | 几何、动画、渲染与编辑实现 | 原有 portal 实现和原生时间轴。 |
| 验证证据 | 对照预览、版本与哈希 | 哪份源码、哪些修改、哪个区间被检查过 | 原版和改编版按相同时间点渲染。 |
| 分发与协作 | 文件夹、Git revision、可选压缩包 | 稳定身份、完整文件、来源和许可 | 一个确认过的源码版本，加上具名内容配置。 |

现有 `motion-video-to-template` 仍以 **`TEMPLATE.md` 作为单份模板交接文档**。可按需链接 Motion Design 说明，不要求所有现有模板增加第二份 manifest。便携工程、Agent Skill 和 `.motion` 压缩包有联系，也有各自不同的契约。

## 3. 可以直接检查的包结构

[Motion Design Remix Skill](../library/skills/motion-design-remix/SKILL.md) 提供六种 profile，源码来自 OpenMotion 资源目录已有的 registry 条目：

```text
motion-design-remix/
├── SKILL.md                         Agent 入口：选择 → 改编 → 对比
├── references/<profile>/
│   └── MOTION_DESIGN.md              这一类动效的创作规则
├── assets/<profile>/index.html      固定上游版本的实现
│   └── assets/ 或 lib/               字体、纹理和必要依赖
├── presets/<profile>.json            源码哈希与明确替换项
├── scripts/materialize.mjs           复制为独立工程
├── previews/                        实际 GIF / MP4 对照片段
├── sources.json                     来源版本与原始 Demo
├── evidence.json                    改编与渲染证据
├── NOTICE.md                        署名及运行要求
└── LICENSE
```

这是**示例包的组织方式**，不是新增的强制运行时格式。六种 profile 不会自动成为六个核心 Skill 或六个 Studio 内置模板；原有三个内置模板的 ID 和行为保持不变。

在 Skill 文件夹中运行：

```sh
node scripts/materialize.mjs wireframe-portal-title reference /tmp/portal-reference
node scripts/materialize.mjs wireframe-portal-title remix /tmp/portal-remix
```

脚本核对源码哈希与替换出现次数，拒绝覆盖已有目录，生成独立可编辑工程和 `remix-record.json`。使用自己的内容时，先把 preset 复制到包外，修改替换值，再将文件作为第四个参数传入。生成的工程包含本地脚本、字体、纹理与参考视频，无需 CDN / 在线字体；执行工具另行安装，许可与要求见包内 `NOTICE.md`。这套脚本实现的是指定源码的替换，不是通用模板参数导入器。

## 4. MOTION_DESIGN.md 具体写什么

| 章节 | 记录什么 | 如何让 Agent 能执行 |
| --- | --- | --- |
| 身份与来源 | 名称、版本、原作者/链接、源码版本、权限与验证状态 | 指向准确原作，保留署名。 |
| Brand Kit | 品牌身份、产品事实、Logo、配色、字体、语气与已确认素材 | 将品牌规则写在创作设计规范内，按需引用已有资料。 |
| 叙事语法 | 受众、钩子、揭示顺序、证据与收尾 | 说明每个场景承担的信息。 |
| 视觉层级 | 构图、字级、景深、对比、留白与品牌来源 | 明确每个主要停留点的视觉焦点。 |
| 时间与运动 | 镜头边界、停留、缓动、镜头路径、遮罩、转场和连续性 | 写清动作关系或源码标签，不只写“高级、电影感”。 |
| 素材与声音 | 视频、截图、字体、配音、音乐、同步点与替代方案 | 区分必须提供和可以生成的素材。 |
| 保持项 | 内容变化后仍应保留的创作决定 | 保持 portal 时间与镜头，保留结尾阅读停留。 |
| 可替换项 | 文案、人物、数据、品牌、画幅与实际容量 | 约定长文案、长配音、素材缺失和布局变化怎么处理。 |
| 检查与证据 | 同时刻对比、源文件/输出身份、技术与视听检查 | 写实际差距；有检查章节不等于检查通过。 |

使用普通 Markdown。区分从参考中观察到的内容、推断出的创作决定与主动改动。长文案应拆分或重排受影响场景，不靠无限缩字解决；改时长时要一起调整相关转场和声画锚点。

### 完整例子的核心：保留 portal，换一段故事

```markdown
# Portal launch — MOTION_DESIGN.md
Version: 0.1.0
来源：填写真实源码版本和参考视频。

## 保持
平面卡片 → 打开 portal → 立体文字 → 白场退出。
保留镜头路径、揭示时间、随机种子与缓动。

## 替换
标题：OPENMOTION（此 profile 最多 18 字符）。
立体短句：TELL YOUR STORY。
副标题：YOUR STORY. IN MOTION.

## 时间
0–0.45 秒：卡片进入；0.45–2.5 秒：打开 portal。
2.5–6 秒：立体短句；6–8 秒：镜头穿过，白场退出。

## 素材与声音
使用包内 Geist 字体与源码。本例无声。
增加配音或音乐时，另外明确输入与时间关系。

## 检查
在卡片、portal 交接和短句停留处同步比较。
检查整句话是否完整、镜头是否连续、文字是否碰撞。
保存源码/preset 哈希和真实产物，记录剩余问题。
```

[完整 portal profile](../library/skills/motion-design-remix/references/wireframe-portal-title/MOTION_DESIGN.md) 适合复用局部动效。需要整支影片的叙事简报时，可参考既有的[产品发布 Motion.md](examples/product-launch.MOTION.zh-CN.md)。

## 5. 复刻怎样沉淀为社区资产

```text
发现参考
  → 分析镜头、运动、内容槽位与素材要求
  → 缺少可用源码时，重建可编辑工程
  → 参考与重建结果按相同时刻比较
  → 用 MOTION_DESIGN.md 固化创作规则
  → 换一个真正不同的主题，再做一版
  → 渲染 reference / remix 对照并记录证据
  → 分享 Skill、工程、输入约定、来源与许可证
  → Fork、改进、评审下一个版本
```

当前 `motion-recreate` 负责参考作品重建，`motion-template-to-video` 负责已有模板改编，`motion-video-to-template` 在用户需要可复用模板时负责模板交付。Library Skill 可以携带特定风格和改编方法。这些都是用户 Agent 读取的指导，不是另起一个后台编排 Agent。

可发布案例应回答：**保留了什么、修改了什么、实际渲染出了什么。** 优先使用同一时钟的左右对比，记录截取区间、裁切和速度变化。用户工程和凭据放在源码包外。Git 分支保存 preset 或实现修改，PR 同时审阅源码差异和成片差异。文件分享、社区评审和人工沉淀方法现在即可进行；自动 marketplace 入库、传播数据学习和 RAG 检索仍是产品方向。

## 真人剪辑：同一个故事，两套时钟

Motion Design 也要描述人物、语言与辅助画面之间的关系。[Presenter Story Skill](../library/skills/presenter-story/SKILL.md) 提供三份设计配方与[有出处的上游对比](motion-design-examples.zh-CN.md#presenter-motion)。这些媒体说明设计模式，不是新配方已完成成片的证明。

```text
你的口播录制 + 屏幕录制 + 实际语音时间码
                │
                ▼
源素材选段 ── 剪辑映射 ──► 输出时间轴
                            ├─ 保留的语音 + 人物画面
                            ├─ 随剪切重新映射的字幕
                            ├─ 屏幕 / 空镜 / 证据卡片
                            └─ 关键词、标注与动效
                                      │
                               带声音预览 + 改稿
                                      │
                               可编辑工程 + 成片
```

**源素材时间与输出时间不同。** 例如，把源片 12–18 秒保留到输出 0–6 秒，源片第 15 秒的事件就映射到输出第 3 秒。这只是算术示例，不是测得的字幕。逐片段保存映射，按实际语音证据安排字幕和叠层，剪切后重建映射；只看抽帧无法得到逐词时间码。

| 层次 | Motion.md 记录什么 |
| --- | --- |
| 叙事 | 想表达的意思、保留的语义、开场、证据与结尾。 |
| 人物 | 素材身份、构图、面部与手势安全区、何时回到人物。 |
| 剪辑映射 | 源片选段、输出起点、转场与插入画面的理由。 |
| 字幕 | 转写来源、真实时间码、重构图后的可读位置。 |
| 动效 | 哪句表达触发关键词、截图、标注或画中画变化。 |
| 审片 | 语音衔接、屏幕可读性、人物无遮挡、正常速度带声音播放。 |

换主题时，录制与证据素材也要对应替换。保留创作者的口吻和意图，不能仅把新标题盖在无关口播上。配方是显式交给 Agent 的上下文，不是自动转写、静音检测或新的时间轴格式。可复用成品包仍需自己的剪辑源码、可分发素材与真实导出对比。

## 6. 从 MotionGit、Hypit 与 rea-video 借鉴什么

| 参考 | 借鉴的思路 | 在 OpenMotion 中的应用 |
| --- | --- | --- |
| [MotionGit 规范](https://motiongit.com/spec) / [motion-spec](https://github.com/motiontemplates/motion-spec) | 区分内容、运行时和分发，明确素材、参数、依赖与许可 | 把创作规则、工程源码、内容输入、证据分别组织；不声称已支持 `.motion` 导入导出。 |
| [MotionGit 模板合集](https://github.com/motiontemplates/all) | Demo、素材要求和真正可用的工程入口一起呈现 | 每个对比都能找到 Skill、Motion.md 和替换配置。 |
| [MotionGit Git](https://motiongit.com/git) | 用可编辑源码和版本协作延长视频的生命周期 | Fork 风格、改 preset、比较渲染结果，再评审改进。 |
| [Hypit](https://github.com/hypit-ai/hypit#examples) | 同一种创意结构，展示多种内容变体 | 每个案例都说明保持项与可替换内容。 |
| [rea-video](https://github.com/JuneYaooo/rea-video#remakes) | 解释逐镜头制作方式，并同步展示原作与改编 | 明确区分参考重建证据与已有源码改编证据。 |

MotionGit 的内容层和分发层分别版本化。`MOTION_DESIGN.md` 是可读的创作说明，**不是 MotionGit `.motion` 容器或 Schema 的实现**。字段映射只是未来适配器的候选设计，兼容性需要单独实现和验证。引用某个项目不意味着已经集成它的视频、API 或包格式。

## 7. 贡献与验证等级

| 状态 | 需要什么证据 |
| --- | --- |
| Reference | 原片及可追溯来源。 |
| Described style | Motion.md、观察/推断标记和替换意图。 |
| Editable example | 真实源码、素材要求和已知限制。 |
| Rendered remix | 实质变化的输入、实际输出及源码/preset/渲染身份。 |
| Reviewed recreation | 与原作的对比、明确差距以及人工接受的范围。 |

本次六个实例展示已有源码的内容替换，不证明任意参考视频的复刻成功率、完整声轨匹配或传播效果。Motion Benchmark / Arena 仍待设计，不从这些案例推导相似度百分比或公开排名。

欢迎通过 [Library 贡献清单](../library/ENTRY_TEMPLATE.md) 提交第二个真实需求与对应结果。好的社区资产，应让下一位创作者知道怎样复用，也知道在哪些边界上需要重新设计。
