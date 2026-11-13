# 公开变更记录

## 2026-11-13: Show per-round inline video progress and playback

- Add an MCP App frame for video playback deliverables, with real persisted work/export state, manual playback after verification and independent historical versions.
- Preserve eleven public Tools, legacy naming aliases, template browsing, display receipts, revision guards and editable Studio handoff. Add optional work identity fields to existing calls rather than a second renderer or project store.
- Keep MP4/cover bytes private to the component, validate media identity and declare embedded media origins. Missing, changed, oversized, failed, cancelled and disconnected results remain explicit; the inline MP4 cap is 32 MiB.
- A prior development prototype passed user-observed Codex two-round/reopen playback. Public-main integration checks are separate evidence; this entry does not claim release, other-host acceptance or creative quality improvement.



## 2026-11-13: Open the template library for recommendations (OPEND-5205)

- Route catalog browsing, comparisons and recommendations through the existing project-free template library handoff in both Skill and MCP-only discovery. Respect text-only requests, keep browsing separate from creation, and continue directly when a selected template is explicitly requested.
- Require actual host presentation evidence, preserve the calling chat, retry a failed presentation once and report capability/display failures honestly. Existing chats must load refreshed Tool descriptions and Skills; backend compatibility alone does not refresh their context.
- Validation: 66 relevant local checks, static checks and Studio typecheck/build passed. Three paired MCP-only trials did not open the library on the baseline and did on the candidate; nine candidate discovery trials reached a loaded directory in an isolated headless test browser. Native desktop browsing/playback was inspected separately with user-confirmed display; inconsistent host visibility telemetry remains unverified. No Tool schema, project-write, history or export behavior is changed, and no release is implied.

## 2026-11-13: Share material sourcing priorities across production routes

- Centralize source priority, acquisition and usability checks in one shared material reference: explicit choices first, suitable existing assets next, original sources for established subjects, and generated/procedural content for original or supporting expression.
- Link all five canonical Skills conditionally, retain compatibility forwarding entries, and expose the reference through the canonical workflow resource and legacy URI alias. Existing media support, reference fidelity and preview/export-only scope remain unchanged.
- Consolidate the director, intake, template and execution rules rather than maintaining competing acquisition policies. No new media service, Tool, permission or release is introduced.
- Retain the prior local Harry Potter trial as a single execution observation: one user message, original footage retrieved and used, ten excerpts totaling 20.5 seconds in a 32-second film. It is an existing example and a prior local snapshot, not a behavioral rerun of this PR head, a generalization result or a listening/visual acceptance claim. The viewing copy is attached to the PR; film media and private traces are excluded from product distributions.

## 2026-11-13: Add an original repository template contribution

- Add Orbit Launch, a six-second original motion recipe with an offline interactive HTML example, motion specification, small poster, preview media and all eleven catalog locale slots. It remains guidance rather than a directly copyable Studio project.
- Validate MCP index identities against the registered repository and built-in templates, so a valid new contribution does not fail an obsolete fixed template-count assertion.
- Let catalog inspection accept contribution videos; the existing staged policy continues to validate their LFS attributes, identities and size limits, while duplicate archives remain forbidden.
- Preserve the existing source, publication and distribution boundaries. Technical checks and original-source rights notes do not establish human visual acceptance.

## 2026-11-12: Version motion guidance source in the product repository

- Import 286 public guidance templates with stable IDs, existing eleven-locale metadata and authored text examples; preserve pending conversion state and original source attribution.
- Include unpacked text source and 1,419 images at most 100 KB in Git (about 104 MB with metadata); link 236 larger originals through verified existing CMS WebP renditions. Keep reference videos and duplicate ZIP downloads at existing CMS URLs.
- Add staged/index and new-history storage checks, source manifest refresh, 100 KB local asset limits and verified CMS rendition identities and a CI policy job. No publishing credentials or media downloads are needed for the policy check.
- Source Studio and MCP read repository templates directly. Local tools return a searchable index, Motion document content and absolute source paths; local edits appear on the next read. CMS mode remains available for published catalog testing.
- Export the existing CMS catalog shape for review, including collection facets; CMS publication remains separate. Source-only catalog files are excluded from npm/plugin distribution.


## 2026-11-13: Remove Tool and Skill count gates

- Stable promotion and archive recovery verify native installation results and immutable candidate identity. MCP Tool and Skill counts are informational and do not block promotion; registration and packaged file lists are checked against their actual manifests.
- Regression coverage accepts native reports without Tool/Skill counts and verifies promotion and archiving. Registry and package tests compare actual names and files with their configured manifests, without an independently hard-coded quantity. Native reports and external writes are simulated; publication remains a separate authorized operation.

## 2026-11-12: Save SVG styles and initialize the initial project on open

- SVG inline-style edits use the existing source patcher, guarded file writer and edit history when the pinned engine cannot persist SVG targets. Missing element identities and concurrent source changes still reject the edit and keep navigation blocked.
- Opening the initial project from the sidebar or a direct preview initializes the bundled six-second example if its sources are absent. Existing edits, partial-project refusal and legacy migration safeguards remain unchanged.
- Validation: static checks, Studio typecheck/build, 79 targeted Studio tests, 14 project/session/legacy/cold-start tests and the phase-one creation regression passed locally. Installed-host, cross-platform and human visual acceptance remain separate.

## 2026-11-12: Complete visible editor delivery after video creation

- **Problem:** A queued host acknowledgment with a hidden panel could send an Agent into waiting for the user to return without evidence that the calling chat was inactive. A separate hidden inspection tab or successful MP4 export could then end the turn without visible editor delivery.
- **Implementation:** Hidden/unavailable display receipts retain native-panel presentation recovery and its tab reuse hint. Only explicit host-confirmed inactive-chat deferral returns the wait action. First delivery follows the same visibility and latest-content checks as continued edits, and unresolved display failures remain visible in the final handoff.
- **Validation:** 53 targeted contract, workflow, adapter, naming-compatibility and packaging tests passed, alongside static checks, Studio type checking and the Studio build. Regression coverage separates queued acknowledgments from observed visibility, preserves inactive-chat deferral and verifies that the updated Skill and Tool sources ship together.
- **Limits:** Original-machine host reproduction and a new model-driven video creation/handoff acceptance run remain unverified. The service records host-reported evidence; it does not independently measure the outer host panel. This change does not publish a package.

## 2026-11-11: Check historical media before offering MCP restoration

- **Problem and audience:** Agents and creators could be told that a historical version was restorable after its media blobs had disappeared; restoration then exposed a low-level file-copy error.
- **Implementation:** Public version metadata checks native and retained blob contents and hashes. Restoration repeats the check and verifies staged files before the existing transaction. Unavailable files are reported by project-relative path as `VERSION_NOT_RESTORABLE`, with `applied=false`.
- **Editor feedback:** The owning editor displays refused Agent restores using the existing persistent, dismissible error toast, with localized text and original file paths. Existing status polling carries the latest failure; repeated polls do not repeat the notice and other projects do not receive it. Native history panel action failures also use the shared toast.
- **Validation:** `tests/phase1.test.ts` covers missing and corrupt audio, image and video blobs, unchanged current source hashes/version/asset index after rejection, successful complete-media restoration and identical-content restoration without a new version. It also covers native blob read failures and recovery from stale capture-time missing flags. Actual check results are recorded with the delivery.
- **Scope:** This repairs the existing MCP history contract. It does not change personas, pricing, the Studio GUI history contract or distribution formats. Native host and other operating-system acceptance remain separate checks.


## REQ-20261109-004：README 资源闭环与 Agent 创作标语

- **问题与对象：** 创作者和媒体 Agent 阅读 README 后仍要跳转外站观看原片，示例工程还需要 CDN / 在线字体；用户要求资源留在仓库中，并明确主标语应表达通过 Agent 剪辑视频。
- **选择与实现：** 主标语改为 **Edit videos with your agent.**，同步双语首屏、品牌规范、媒体说明、水墨封面与 GIF / 分享图。收录精选页面引用的 38 段完整视频（含真人前后对比与 Presenter Tech 原始 Demo），贡献者头像改为 23 人的本地快照。六个 Motion Design 示例保留上游源码哈希，通过工作副本将脚本、字体、纹理、原片和许可一起交付；补齐四个展示组件与三个内置模板的本地依赖。
- **来源与边界：** 原作者、来源 URL、MIT / Apache / 字体及浏览器依赖许可均保留。Glass Shard 的固定上游树缺少 registry 声明的 matcap 文件，采用明确记录的本地 SVG 光照纹理，不主张与上游 Demo 像素一致。894 条发现目录仍是索引，未声明整库镜像；Node / 浏览器 / FFmpeg / Python 工具安装与云模型服务不属于本地素材承诺。真人参考不成为可任意复用的人物或声音素材。
- **验证证据：** [资源契约](../readme/RESOURCES.md)与[验证记录](../readme/resource-verification.json)记录来源清单、哈希和阻断外网检查。12 个 reference/remix 工程渲染 792 帧、四个组件与八个原生模板源码页加载均无外部请求或错误；双语 README 每页 78 张图片全部本地加载，无横向溢出。38 段完整原片和六段新对比视频全部完整解码。新增确定性检查拒绝图片/视频热链、缺失文件和哈希漂移，并加入 CI；本轮安装、仓库检查、Studio 类型/构建与分发检查结果见 PR。
- **画像与商业影响：** 改善现有创作者、贡献者和媒体 Agent 的离线查看与移交，不新增用户调研、效果保证、付费或商业化结论。
- **后续待验证：** 目标机器工具安装、真实用户素材适配、完整 Studio 导出及人工视听接受分别验证；本轮源码页面和文件完整性检查不替代这些结果。

## REQ-20261109-003：把科技风口播模板纳入 OpenMotion Library

- **问题与对象：** README 将人物与动效案例单列为“外部模板参考”，创作者无法直接从本仓库取得模板；用户要求改为 OpenMotion 的模板展示，并把原始来源集中放在致谢。
- **选择与改动：** 新增 `library/templates/presenter-tech/`，以 Presenter Tech / 科技风口播模板为展示入口，随仓库分发可再分发的固定版本 `.motion` ZIP、制作指南、Motion MD、源身份与验证记录。英文公开包 17,594,444 字节，与上游 revision 的公开 SHA-256 一致；保留原始 manifest、代码和许可证，不改变源码归属。
- **来源与许可：** 原始 Kinetic Tech 由 MotionGit contributors / adunext 发布，代码与 grain 纹理为 MIT，字体和品牌有独立条款。README 正文不再用“外部模板”作为标题；文末 References、模板 NOTICE、LICENSE 和第三方声明保留来源及版权。原始 Demo 仍是上游样片，不冒充本轮测试产物；Demo 人物、声音和私人素材不在模板包中。
- **使用与边界：** 用户把本地包交给 Agent，按包内 adapter 的 plan → prepare → preview → render 创建独立项目。包内依赖在 checkout 外安装，不改变根依赖锁或原生引擎锁。本次增加的是 Library 模板包，不是新的 Studio 原生模板、通用 `.motion` 导入器或第十个 MCP Tool；Studio 仍有三个直接可编辑模板、目录仍为 894 条。
- **实际验证：** 校验 ZIP 的 331 条路径与 330 个内部文件哈希；隔离目录完成 runner 的 `npm ci`、参数 plan、素材 prepare、真实 Chrome 预览和渲染。B1 text-only 技术样例导出 8 秒、1920×1080、60 fps、480 帧 H.264 与 AAC 音效，运行器零浏览器错误，最终声画全量解码通过。使用既有浏览器文件锁；没有新增人物录制、语音或完整真人成片验收。验证结果保存在模板 verification.json。
- **文档与分发：** 同步双语 README、Library 与模板索引、Presenter Story Skill、产品架构、目录专题、媒体事实包、素材记录和正向分发清单；后续包装检查确认源码包随应用归档交付。没有新的画像、需求访谈、采用率或商业化结论。
- **后续待验证：** 用用户自己的口播、屏幕与音轨制作完整作品，以及人物绑定、所有原生场景和其他操作系统；通用 Studio 导入须另行实现和验证。


## REQ-20261109-002：让真人口播与动效共同成为 README 的主角

> 其中 MotionGit 演示随后按 REQ-20261109-003 对应的源码包收入本地 Library，当前展示名为 Presenter Tech。

- **问题与对象：** 仅展示代码生成的 Motion 容易让创作者把 OpenMotion 理解为纯动画工具；首次访问者与媒体 Agent 需要看到真人表达、口播剪辑、产品演示和动效结合的实际内容形态。
- **选择与改动：** 在双语 README 的 Motion Design 模块前置三组目录已有的原片 / 上游人物改编演示，覆盖知识口播、工作流演示与产品讲解；模板模块前置九个已有真人参考，再补充一条 MotionGit Kinetic Tech 公开横屏 Demo。保留后续六组源码改编与十八个 Motion 精选，人物表达与动效共同构成产品叙事。
- **可复用方法：** 新增可选 Library `presenter-story` Skill 和三份 `MOTION_DESIGN.md` 配方，记录口播剪辑、源素材与输出时间映射、字幕、画中画、证据画面、人物安全区与带声音审片。它们是设计配方，没有可执行模板或人物素材；新 Skill 的真实 OpenMotion 成片验证仍待完成。原作者的原片与 Hyperframes 发布的改编不冒充本仓库生成结果，不把不同剪辑的节选写成同步还原评测。
- **素材与分发：** 十三段 GIF、十三张减少动态效果回退图和来源清单入库；原 MP4、下载过程、浏览器 profile 与验证日志留在 checkout 外。清单记录原作者、视频地址、源哈希、各侧片段范围、编码方式及成品哈希。MotionGit 公开横屏版本与官网竖屏版本分别说明；没有自动导入 `.motion` 或新增内置模板。
- **同步文档：** 更新双语 README、实例专题、Motion MD 架构、Library 与模板入口、Skill 说明、资源目录专题、产品架构、媒体事实包、图片来源与分发清单。五个核心 Skills、九个 MCP Tool、三个内置模板和 894 条资源计数不变。
- **实际验证：** 十三段 GIF 的 810 帧和十三张 JPEG 全量解码、哈希与帧数检查通过。真实 Chromium 中双语各 56 张图片，新增十三图均加载、两个入口存在、无本地资源失败与横向溢出；已检查代表帧与页面截图。Skill 格式验证通过，并在临时目录通过 Skills CLI 安装至 Codex / Claude Code 布局；这不等于模型执行或成片验收。与本轮源码包一起通过 54 项定向测试及本地 npm 打包；公开链接与文档引用另行核对。
- **画像与商业影响：** 继续服务现有创作者、讲师、小团队和内容 Agent，不新增访谈、采用率、用户规模、收入或流量结果，因此不改写无关画像与商业化专题。
- **后续待验证：** 用创作者自己的口播和屏幕素材完成三种配方的制作、带声音审片和固定版本导出，再把真实结果沉淀为可执行模板与对比证据。

## REQ-20261109-001：Motion Design Skill 包、真实源码改编与 AI editing 定位

- **问题与对象：** README 对 `MOTION_DESIGN.md` 的介绍不足以让创作者和媒体 Agent 理解如何把参考视频的表现方式沉淀为可复用资产；同时用户将英文主叙事从 AI Cut 调整为 AI editing / AI video editing，主定位保持 AI-native、open-source CapCut alternative。
- **选择与架构：** 参考 MotionGit 的内容、运行时与分发分层，以及 Hypit、rea-video 的内容变体 / 前后对比表达，将 Motion Design Skill 包分为创作规则、Agent 方法、可编辑源码、替换输入、预览证据与社区分发。采用可复制的文字图说明，保留 Motion MD v0.1 的显式 Agent 上下文定位；不新增 Markdown 解释器、`.motion` 导入器、模板自动注册或任意视频还原评测。
- **实际示例：** 从现有 registry 资源选六个 profile，固定 Hyperframes 上游 revision，保留 Apache / 字体许可与网络依赖说明。可选 `openmotion-design-remix` Skill 附每种 Motion MD、替换 preset、独立工程生成脚本，以及六组同一时刻采样的原内容 / 新内容 GIF、MP4 和 JPEG。脚本校验源哈希与替换次数，拒绝覆盖已有目录或符号链接；复用现有托管工程 revision 与导出契约。
- **术语与美术：** 当前英文公开介绍统一为 AI editing / AI video editing，封面改为 Edit with AI，保留水墨品牌风格并重新派生 GIF 与分享图。Claude Motion 仍为 Motion 创作参照；不宣称行业首创或市场上没有竞品。本条取代 REQ-20261108-003 的 AI Cut 主标题选择；历史记录与历史生图提示词保留说明演进。
- **文档维护：** 更新双语 README、Motion MD 规范与示例专题、架构、媒体事实包、Library、Brandkit、Skill 入口、来源记录和分发清单；不改变用户数据、运行时依赖或两份依赖锁。画像与商业化无新证据，不改写相关判断。
- **实际验证：** CI 固定 Node 26.11.1 下 `npm ci`、`npm run check`、Studio 类型检查与构建通过；54 项安装、适配器、目录、工作流、打包与新脚本定向测试通过。十二份独立工程完成原生 lint，零错误、二十条上游警告；六组预览从 792 张实际采样帧编码，GIF / MP4 全量解码及源码 / preset / 成品哈希验证通过。随包渲染脚本另用一组代表帧实际运行验证；两个可选 Skill 格式及隔离安装通过。新素材与两个示例文档共 87 个文件在本地 npm 应用归档内逐字节核对。
- **验证边界：** 使用既有 product-tour 文件锁串行执行隔离浏览器采样；没有执行完整应用浏览器回归。源码复用、原生 lint、浏览器帧采样与打包分别记录；尚未验证这六组的 Studio 原生导出、目标机器安装、完整声音或用户最终视觉接受。没有 99% 相似度或传播效果结论。
- **后续待验证：** 更多真实新简报、每个 profile 的实际 Studio 导出与人工接受，真人配方的成片效果，以及后续模板格式适配能力。

## REQ-20261108-011：资源库从六张静态图扩展为十八个动态精选

- **问题与对象：** 创作者与浏览 README 的 Agent 需要直观看到资源库中多样的动效，原六张静态封面无法体现运动过程与创作范围。
- **选择：** 参考 OpenDesign 按类型组织作品的展示方式，将中英文资源区扩为六组、每组三列的十八个循环 GIF：产品界面、品牌发布、动态文字、光影与立体材质、空间镜头、生成艺术。优先选择实际运动清楚且风格不同的片段，替换重复背景与变化不明显的候选。
- **来源与边界：** 八支外部参考片、十个 registry 组件均取自现有目录，使用连续片段、正常速度与原始画面；点击动图打开完整视频，署名打开原始来源。默认动图，减少动态效果偏好复用既有封面。它们不是新增内置模板或 OpenMotion 创作验收结果，不修改目录总数、应用画廊顺序或任何运行时能力。
- **文档与分发：** 同步双语 README、模板目录专题、媒体事实包、素材记录与正向分发清单。十八段 GIF 和一份可复现清单入包，源视频留在 checkout 外；清单包含来源哈希、片段范围、编码参数、GIF 大小及校验值。产品画像与商业化判断不变，无需改写相关专题。
- **验收与后续：** 双语十八个默认 GIF、六组分类、视频/署名链接和减少动态效果回退通过 DOM 检查；18 段共 874 帧全帧解码与哈希检查通过，320×180、2–5.5 秒/段、总计 9,823,803 字节，代表帧逐组检查。742 条本地引用无错误，`npm run check` 与 6 项打包测试通过；19 个新增资产均在 phase1/legacy 分发清单中，本地预览与 GIF HTTP 200。未执行真实浏览器版式验收；人工最终视觉偏好与这些资源在新工程中的制作效果仍须单独确认。


## REQ-20261108-010：三种使用入口与单模板 Agent 交接截图

- **问题与对象：** README 仅展示工作区和编辑器，首次访问的创作者及 Agent 用户难以看见 Codex、独立应用、Claude Code 终端三种使用方式，也看不到 Connect Agent 和把单个模板交给 Agent 的步骤。
- **选择与改动：** 用同一份内置 Product Promo 工程串起六张真实页面/终端截图：嵌入 Viewer、完整 Studio、Claude Code `/skills`、固定 CLI 检查、连接弹框、模板预览与精确指令。双语 README 增加三模式索引、截图、交接步骤与修改需求示例，保留原有导航锚点。
- **产品与来源：** 两种接入方向及三种展示入口仍使用现有工程、Skill 与九 Tool 契约，没有新增运行模式或内置聊天 Agent。模板保留原内容与许可；截图保留实际 OpenDesign 界面字样。终端图回放真实 ANSI 输出，不生成对话或模型执行结果。
- **验证边界：** 独立/嵌入预览指向同一工程，模板指令包含准确 ID 和客户端参数；Claude Code 完成 MCP 握手与五个 Skill 加载。CLI 检查为 1920×1080、20 秒、三个图形场景和字幕，lint 零错误零警告。Codex 宿主外框未捕获，Claude Code 模型回合未完成，未新导出 MP4，不将加载/检查当作模型创作或人工成片验收。截图使用隔离浏览器 profile 和系统文件锁；团队 browser-lock 包装器回归未执行。
- **文档与分发：** 新增[演示复现说明](../product-tour.md)，同步适配器、架构、媒体资料、文档索引和[截图来源](../readme/ASSETS.md#product-tour-captures)；六张 PNG 与指南逐项纳入分发清单。工程、凭据、浏览器 profile 和终端日志留在仓库外。
- **画像与商业影响：** 改善既有创作者和 Agent 用户的理解及首次使用入口，不新增用户研究、价格、收入或付费能力，因此不改写画像与商业化专题。
- **实际验收：** Node 26.11.1 下源码检查、Studio 类型检查与构建通过；连接、目录、工作流和打包共 19 项定向检查通过。34 份文档的 698 条本地引用无错误；双语 README 在真实 Chromium 中六图均加载、四个演示锚点存在且无横向溢出，已检查截图可读性。六张 PNG 与原捕获文件逐字节一致，指南和六图均包含在 phase1 / legacy 正向分发清单。未发布分支或包。
- **后续待验证：** 宿主完整窗口、模型完成模板改编和用户视觉接受分别验证，页面/终端截图不替代这些结果。

## REQ-20261108-009：七个创作场景的动态参考与可执行简报

- **问题与对象：** README 的七类剪辑场景只有文字，下面的三个小模板封面未覆盖这些场景，视觉效果和创作引导不足；面向首次了解产品的创作者与读取 README 的媒体 / 创作 Agent。
- **选择：** 从已有目录精选七个外部参考，替换为两列展示卡片；每个场景含真实短 GIF、静态预览、明确署名、输入素材、预期创作方向与可复制简报。保留竖屏与横屏原始构图，用统一排版组织，不重新绘制原作品。
- **内容：** 口播与 B-roll、照片拼贴叙事、产品功能发布、动态排版复刻、流程讲解、数据对比、音乐艺术视觉逐一对应；原三个内置模板及其源码、许可、海报保持不变，通过模板入口继续使用。
- **事实边界：** 外部参考不是 OpenMotion 已生成的验收样片，不增加内置模板、目录条目或产品能力。简报中时长与画幅为新的创作目标，必须实际制作与评审；人物、品牌和参考数据不作为本产品主张。无需改写画像或商业化专题，因为本次只改善既有服务场景的表达与入口。
- **文档与分发：** 双语 README、新增双语创作简报、目录说明、媒体事实包、文档入口与素材出处同步；七段 GIF、七张静态图和来源清单纳入正向分发列表。片段记录源地址、时间范围、来源校验值与 GIF 校验值；GIF 无声，保留完整参考入口。
- **验收与后续：** 双语七场景、动图、静态回退、简报与来源链接通过 DOM 检查；660 条本地引用无错误，`npm run check` 与 6 项打包测试通过，17 个新增文档/预览资产均包含于两种分发清单。七段 GIF 全帧解码、帧数、时长及哈希检查通过，共 8,765,395 字节、3.7–7 秒/段；静态图与代表帧已检查。本地预览与 GIF HTTP 200。真实浏览器版式与最终视觉偏好仍待确认；没有为七份简报执行模型创作、配音或成片验收。


## REQ-20261108-007：Stay tuned 与 Star 动图邀请

- **问题与对象：** 关注项目的创作者和贡献者需要明确的收藏、支持与持续关注入口。
- **选择与改动：** 参考 [Hypit](https://github.com/hypit-ai/hypit) 的 Stay tuned 社区模块，双语 README 增加同名章节、可点击 Star 动图、仓库/路线图/社区链接。动图使用 OpenMotion 的蓝绿水墨视觉，以 Star / Starred 两个生成画面组成循环，不复制参考仓库截图或虚构统计。
- **事实边界：** Star 用于收藏和支持；版本通知按 GitHub 文档指引使用 Watch → Custom → Releases。动图是操作邀请示意，不代表已替用户加星，不改仓库设置。
- **文档与分发：** 图片来源、提示词、动画复现、媒体资料与正向分发清单同步。本次不改变产品能力、用户画像、价格或收入结论。
- **验收：** 双语模块与仓库点击目标通过 DOM 检查；GIF 为 960×480、40 帧、4 秒无限循环，含两个不同画面，436,765 字节；两张源图均为 1774×887，已逐帧检查和解码。与本轮文档一起通过 530 条引用检查、`npm run check` 和 6 项打包测试；本地 GIF HTTP 200。

## REQ-20261108-006：All-in-One Studio 与 Super Motion Video Agent 蓝图

- **问题与对象：** 个人创作者、讲师、小团队和媒体 Agent 需要理解从灵感、素材到剪辑、运营和知识复用的完整产品，现有 README 仍偏单次制作工具。
- **选择：** 产品类别为 **All-in-One AI-native Studio for AI Cut & Motion**，核心体验为 AI 原生 CapCut；提出 **Super Motion Video Agent** 概念，连接理解用户、任务规划、工具/模型执行、协作评审和经验复用。主传播词用 AI Cut，video editing 保留为功能说明用语；不将概念定义写为未经证实的行业首创。
- **整体蓝图：** 发现灵感、上传管理素材、素材生成、Tell Story 与时间轴剪辑、协作评审、多平台交付、发布/任务自动化、数据回收、个人/团队知识、RAG 和 Skill 持续改进。模板社区面向 Agent 提供源码、可修改项、指引和来源，使复刻与个性化有明确输入。
- **实现边界：** 已有项目会话、资源目录、媒体管理、Studio 模型生成、外部 Agent 工程操作与 MP4 导出；团队协作、常驻编排、发布管理、周期任务、效果数据回收、RAG、偏好记忆和自动 Skill 提炼仍为规划。RAG 是知识检索，不等于模型训练；持续改进是待验证假设。
- **参考：** 2026-11-08 核查 DeepSeek Harness 官方仓库与 `deepseek-ai/dsh-superagent-prototype`，后者为研究原型；本次仅借鉴产品/任务组织思路，不导入代码或运行时。
- **改动：** 双语 README 首屏、产品范围、Agent 概念、知识闭环、模板社区、技术图与路线图同步；新增 [Studio 蓝图](studio-vision.md)，更新架构、多模态设计、媒体事实包、Brandkit、模板索引和文档入口；新专题纳入分发清单。
- **验收：** 三层定位、完整流程、当前/规划状态与技术图相互一致；技术关系改用可复制的文本架构、调用顺序与职责表呈现，沿用品牌图片，不新增解释性图片。Node 26.11.1 下 `npm run check` 和 6 项分发/npm 打包测试通过；27 份相关 Markdown 的 530 条本地引用无错误，双语与蓝图 Markdown/DOM 检查通过，文档内制作工具名与九 Tool 契约对应。双语预览、蓝图预览和 GIF HTTP 200；两套依赖锁无变化，未执行本轮浏览器视觉验收。技术验证不代替创作者体验、人工视觉验收或持续学习效果。
- **画像与商业影响：** 扩展既有创作者/团队的目标工作流，没有新增访谈、规模、采用率、收入、价格或收费结论。
- **后续待验证：** 创作全流程的完成率、协作改稿成本、知识检索质量及 Skill 改进的实际收益；各规划能力另行设计与实现。

## REQ-20261108-005：人与 Agent 协作创作路线图

- **问题与对象：** 创作者和媒体 Agent 需要从 README 看见 OpenMotion 将如何承载共同剪辑、Motion 创作与时间轴评审，而不仅是应用与 Agent 的连接方式。
- **选择与改动：** 双语 roadmap 增加“人和 Agent 协同进行 AI 剪辑与 Motion 创作 — is coming”，明确同项目编辑、时间轴时刻/范围评论、协作评审和持续迭代。新增统一蓝绿水墨风格的生成式概念图，在图上和正文标注 is coming / Concept preview；同步架构、媒体事实包、Brandkit、图片来源和分发清单。
- **状态与边界：** 这是已确认产品方向，无发布日期；当前本机工程交接与 revision 保护不等于时间轴评论、协作评审或多人同步编辑。本次不修改应用或工具行为，后续需单独设计评论归属、版本关联与协作并发契约。
- **验收方式：** 双语 roadmap 均含三类协作内容和 is coming 标识，图片能显示且来源清楚；图片解码、双语 DOM 中的概念图与状态标识检查通过；与本轮双语文档一并通过 476 条链接检查、`npm run check` 和 6 项分发/npm 打包检查。图片已纳入正向分发清单。视觉接受仍由用户判断。
- **画像与商业影响：** 面向已有创作者和使用 Agent 的团队，补充协作方向；不新增需求调研、付费、采用率或收入结论。
- **后续待验证：** 协作交互、评论驱动改稿的可用性、工程版本与协作状态的一致性。

## REQ-20261108-004：AI 原生时间轴、双向 Agent 接入与完整剪辑生命周期

- **问题与对象：** 首次访问的创作者和媒体 Agent 无法从导航区分“在应用里连接 Agent”与“把 OpenMotion 接入 Agent”；核心定位还需要从泛视频创作收敛到以时间轴为中心的 AI 原生 CapCut。
- **选择：** 主定位为 AI-native、开源 CapCut 替代，Claude Motion 为动效创作参照。统一当前公开比较名称为 **Claude Motion**，取代上一条记录中的 Cloud 拼写；旧记录与提示词保留为演进历史。以“人人都是 AI 剪辑师，人人都是自媒体”为使命。
- **产品结构：** 三条主线为智能剪辑与故事组织、素材生成与搜索、多平台输入与输出。围绕同一份工程形成收集素材、确定叙事、粗剪、声画完善、预览改稿、固定版本导出和下一版改编的闭环。参考 [OpenChatCut](https://github.com/0xsline/OpenChatCut) 的连续编辑理念，未引入其代码或将其功能写为本项目能力。
- **改动：** 双语 README 首屏与导航新增两个明确的 Agent 入口，提供应用起步与客户端起步的步骤；时间轴、生命周期、产品哲学、架构、路线图与参考表同步。更新中文跳转页、文档导航、适配器说明、媒体事实包、Brandkit 和本架构专题。封面更正为 Claude Motion，GIF 与分享图从同一封面派生。
- **能力状态：** 当前导入/排列、外部 Agent 根据脚本或确认时间码剪辑、Studio 模型生成、参考图修改与显式替换、MP4 导出都有现有路径。自动内容理解、无关段落检测、资源/Avatar 集成搜索、广泛平台解析和自动画幅适配属于已确认方向。仍无内置聊天 Agent，五个核心 Skills、九个公开 Tool 与工程契约不变。
- **验收方式：** 首屏可直接找到两个方向并复述三条主线；当前能力与方向可区分；链接可达、双语结构对应、封面拼写与派生资产一致。本轮在 Node 26.11.1 下 `npm run check` 和 6 项分发/npm 打包测试通过；25 份相关 Markdown 的 476 条本地链接/图片引用无错误，双语解析与 DOM 入口检查通过。封面和协作图均为 1774×887；GIF 为 800×400、32 帧、4.01 秒无限循环，分享图为 1280×640。本地双语预览 HTTP 200；浏览器视觉验收未执行。文档检查不代表模型执行或人工内容验收。
- **画像与商业影响：** 服务现有创作者、讲师、小团队和媒体 Agent，没有新增访谈、采用率、流量或收入证据；账户、计费和商业化能力未变化。
- **后续待验证：** 创作者对入口与时间轴定位的理解，真实剪辑效率与内容质量；搜索、平台适配等方向分别按后续需求验证。

## REQ-20261108-003：以 AI 剪辑为中心，连接 Cut 与 Motion

> 本条为先前决策；比较名称已由 REQ-20261108-004 更正为 Claude Motion，AI Cut 主叙事已由 REQ-20261109-001 更正为 AI editing。

- **问题与对象：** 首次访问者和媒体 Agent 从“视频创作 / Motion”介绍中无法直接感知核心 AI 剪辑价值；用户明确要求让每个人成为 AI 剪辑师、创作者与自媒体。
- **选择：** 以 **AI 剪辑 / AI Cut** 为主叙事，英文主张为 **Cut with AI. Everyone can be a creator.** 并列 AI 原生开源 CapCut 替代与开源 Cloud Motion 替代，分别承载日常剪辑与 Motion 创作。按用户本轮明确更正，当前对外参照名称从此前的 Claude Motion 改为 **Cloud Motion**；历史条目和历史生图提示词保留原样说明演进。解释完整工作流时使用 AI video editing，品牌标题突出 Cut。
- **改动：** 重写双语 README 首屏、定义、使命与媒体提示词；新增 AI 剪辑流程，前置口播精剪、素材重组与改稿场景；生命周期与产品哲学同步。更新中文跳转页、媒体事实包、Brandkit、Ink & Water 设计体系与产品架构。水墨封面同步 Cut、CapCut、Cloud Motion 和创作者使命，再派生 GIF 与分享图。
- **实现边界：** 以已有外部 Agent 修改工程、Studio 预览与时间轴细调为依据，素材、脚本/确认时间码与宿主媒体能力仍是实际条件；不新增内置 Agent、自动下载/转写、自动发布或新的工具契约。
- **验证与验收：** 双语核心主张与 Cloud Motion 拼写检查通过，444 条本地链接/锚点无错误，双语 Markdown 解析通过。最终封面文字已检查；GIF 为 800×400、32 帧、4.01 秒无限循环，分享图为 1280×640。验收目标是读者能快速复述“AI 剪辑 → 可编辑作品 → 自媒体表达”，技术检查不代替用户对文案和画面的接受。
- **画像与商业影响：** 明确现有个人创作者、讲师和小团队的剪辑与表达路径，没有新增用户研究、流量结果或收费能力。
- **后续待验证：** 用户对 Cut / Motion 双重定位的理解，以及真实 AI 剪辑效率和内容采用效果。

## REQ-20261108-002：统一水墨视觉、开放资源目录与贡献路径

- **问题与对象：** 首版 README 的立体封面与方框示意图未达到用户对品牌一致性的要求；创作者、资源作者与 Agent 还需要从第一天就能使用的贡献目录、架构说明和来源关系。
- **选择：** 参考 OpenDesign 官网的蓝绿水墨、纸面肌理与留白，重做封面、Library 与社区横幅，并同步 GIF 和社交分享图。品牌规范沉淀为 OpenMotion Brandkit 与 Ink & Water `MOTION_DESIGN.md`。产品截图改为全宽，原始界面与作品保持原貌；旧说明 SVG 退役，生命周期使用文字表格，技术架构使用可复制的文本图。
- **资源入口：** 新增 `library/`，包含 Skills、模板、Motion 组件、动效设计体系与 Brandkits 五类；首批为可选 Brandkit Skill、三个现有模板的索引、标题揭示配方、一个设计体系和一个 Brandkit。模板源码仍单份维护，资源计数不因新增索引膨胀。
- **贡献与参考：** 双语 README 增加具体贡献路径、Contributors、状态与路线图、References & lineage；同步双语 CONTRIBUTING、文档入口、Motion MD、资源索引、媒体事实包和产品架构。贡献者图指向当前仓库，明确包含 HTML Anything 历史贡献。来源表记录产品参照和实际代码/资源依赖，Hyperframes 保留文末致谢。
- **阅读层次补充：** 按用户反馈，为双语 README 的主要标题和 Library 五类资源加上少量语义 emoji；同步资源库索引，并为改动标题保留原锚点，确保目录和跨文档链接继续可用。本次仅调整阅读呈现，不改变产品能力、画像或商业化口径；以链接检查和正文一致性检查验收。
- **边界：** Library 是手动选择的源码资源，不增加 Studio 自动导入、marketplace、MCP API 或第六条核心制作路线。五个核心 Skills 与九 Tool 契约保持不变。可选 Brandkit Skill 只整理文档上下文；标题组件为配方，设计体系为创作方向，均不冒称已经验证的渲染模板。路线图没有承诺日期。
- **分发与验证：** 新资源和美术文件逐项加入正向分发清单，退役图移出清单。本轮 Node 26.11.1 下 `npm run check` 与 6 项分发/npm 打包测试通过；双语本地链接、图片解码与 GIF 循环另做定向检查。可选 Brandkit Skill 在隔离目录通过 Skills CLI 安装至 Codex / Claude Code 布局；双语 Markdown 经 marked 解析与 DOM 结构检查。Superset 浏览器入口未登录、内置浏览器宿主不可用，未完成实际浏览器排版验收，保留本地 HTML 预览供复核；未发布分支或包，不把文档/安装检查当作模型创作或人工内容验收。
- **画像与商业影响：** 为现有创作者、模板作者和 Agent 提供更清晰的公开入口；未新增用户研究、价格、商业模式或流量结果主张。
- **后续待验证：** 用户对新版美术的接受程度、资源的真实改编效果，以及 Library 导入体验与社区贡献流程。

## REQ-20261108-001：面向创作者与媒体 Agent 的双语 README

- **问题与对象：** 首次访问的创作者需要迅速理解定位、使用入口、资源和产品形态；媒体及其 Agent 需要能够直接引用、制作演示和报道的材料，而非仅有安装说明。
- **选择：** 参考 [OpenDesign README](https://github.com/nexu-io/open-design) 的产品导览结构，以“人人都是自媒体”为使命，突出 Claude Motion 开源替代与 AI 原生 CapCut 替代定位。围绕 Input → Process → Output 组织本地素材、在线参考、文本/SRT、剪辑与声画设计、MP4 和可编辑工程；独立应用、Skills、MCP、CLI 分别给出当前入口。
- **命名修正：** 产品名称统一为 **OpenMotion**（O 和 M 大写），同步双语介绍、资源索引、Motion MD、媒体事实包、架构说明、SVG 与 PNG/GIF/社交封面。取代此前全小写的展示约定；命令、目录、MCP 标识与上游 OpenDesign 来源署名保持其实际名称。
- **叙事修正：** 双语 README 不再将产品介绍为“Hyperframes-based editor”；正文围绕 OpenMotion 的独立创作体验，文末明确感谢 Hyperframes 及其贡献者。资源的原作者署名和技术文档中的真实依赖保持准确。
- **初版内容与视觉（后由 REQ-20261108-002 替换）：** 双语首页各包含 16 处图片展示（含品牌标志、封面、真实界面、示例、目录封面及解释图）；新增 ImageGen 品牌封面、4 秒循环 GIF、1280×640 社交预览、生命周期与架构 SVG。图像来源、生成提示词和 FFmpeg 复现命令写入 [ASSETS](../readme/ASSETS.md)。ChatCut / HyperFrames 参考截图用于表达研究，没有冒充产品界面。
- **标准与技术：** 按用户确认将 Motion Design MD / Motion MD 的文件名统一为 `MOTION_DESIGN.md`，同步双语 README、规范文档、媒体事实包与示意图；保留旧示例路径和引用，避免链接失效；继续标明 v0.1 及显式交给 Agent 的使用方式。补充哲学、技术层次、实际 Hyperframes 依赖与产品参照，纠正架构文档里“许可证待确认”的旧状态，统一引用现有 Apache-2.0 LICENSE。
- **媒体使用：** 新增[创作者与媒体事实包](../media-kit.md)，提供简介、证据链接、真实演示步骤和创作/报道提示词。当前目录仍是 3 个内置模板与 891 个外部参考/registry 条目；“99% 还原”“覆盖几乎全部 Claude Motion 核心模板”尚无比较对象与评测证据，不写作已证实事实。流量曝光是创作目标，不保证结果。
- **能力边界：** 本轮不新增下载器、转写、口头禅识别、平台导出预设或发布集成；这些依赖宿主能力、已有文本/时间码或后续实现。公开导出仍为 MP4，社交版本通过工程画幅与内容改编实现。九个公开 MCP 工具包含媒体导入，不包含 Model Gateway 生成；生成说明对应 Studio 入口。
- **分发：** 媒体事实包与五个新增视觉文件进入现有正向清单，六张目录预览复用已有文件；不改变依赖锁、应用逻辑、宿主日常配置或用户数据，不发布包。
- **实际验证：** 使用 CI 固定 Node 26.11.1 完成 `npm ci`、`npm run check`、Studio 类型检查和构建；工作流、适配器、分发与 npm 打包 15 项定向检查最终通过。打包首次因临时 Node 包不附带 npm 路径失败，以 `npm exec -- node ...` 传入正确 npm 上下文后通过，未改实现规避检查。`npx skills` 在隔离临时项目安装五个正式入口至 Codex / Claude Code 布局，96 条本地引用可达。双语 Markdown、相对链接/锚点、SVG 渲染、GIF 解码/帧数/循环和分享图尺寸另做定向核对；不是目标机模型创作或人工成片验收。
- **画像与商业影响：** 对外表达增加个人创作者、讲师、小团队及媒体 Agent 的阅读路径，是已确认的服务方向；没有新增访谈、采用率、收入或付费意愿证据，也未改变账户、价格和收费能力。
- **后续待验证：** 真实创作者完成视频的效率、内容采用、跨平台发布效果、参考还原评测与模板覆盖率；以后有可复现证据再更新公开主张。

## REQ-20261107-001：素材浮层就近定位与空时间轴引导

- **问题与对象：** 现有创作者从空轨道、素材库或已有片段进入生成时，弹框远离触发位置；生成期间仍显示空轨道起步引导，干扰继续编辑。
- **选择与实现：** 操作栏读取片段、范围或标尺的实际锚点，生成面板继承该位置；按钮入口传入触发元素。共用浮层尺寸测量、视口限位、上下避让与滚动/尺寸监听。生成时隐藏空态引导并禁止交互，关闭且仍为空时恢复；插入后使用原生轨道，撤销至空轨道时恢复引导。
- **影响与边界：** 保留原生素材放置、撤销和工程归属；不改变模型路由、账户、费用规则或素材归属。本次改善既有剪辑流程，没有新增画像或商业化结论。
- **验证：** 定向测试覆盖定位、内容增长、滚动跟随、空态切换和原生放置；按本次公开 PR 的提交运行 Studio 类型检查、构建、仓库检查与真实浏览器交互，实际结果写在 PR。不沿用历史执行结果，也不将本地素材验证当作供应商生成或视频导出验收。
- **文档：** [English introduction](../../README.md)、[中文介绍](../README.zh-CN.md)、[使用手册](../usage.md)、[素材生成设计](media-generation-design.md#时间轴交互规则及原因)、[编辑器开发](../editor-fork.md)。
- **后续待验证：** 实际多轨创作中的遮挡、操作效率与目标系统差异；不因本次 UI 回归通过推断模型创作质量或发布状态。

## 2026-11-06：五个 Skill、界面与双语介绍同步

- **问题与对象：** 现有 Agent 用户、模板作者和仓库贡献者需要一致的 Skill 名称、安装包和使用说明，避免改名后引导失效或打包漏项。
- **选择与影响：** 一期同装 openmotion-production、openmotion-director、openmotion-template-to-video、openmotion-recreate、openmotion-video-to-template。MCP 短 workflow ID 保持兼容，专业任务可直接进入；production 承接既定创作决定下的工程操作。公开 Tools 仍为九个。
- **界面：** 同步 OpenDesign 双主题、字体、按钮、表单与浮层材质，不改变作品 iframe 的样式、工程格式与原有布局职责。
- **文档：** 新增中英文介绍、Motion MD v0.1 提案、示例与资源索引。Motion MD 由用户显式提供给 Agent，尚无自动导入器；主题集合站与 Arena 仍为规划。旧中文首页保留跳转，仓库仍以 feature/motion 开发，main 与 legacy 留档流程见迁移说明。
- **公开与分发：** 保留独立 npm、两套依赖锁、正向打包清单、Apache-2.0 和上游/字体许可，以及浏览器统计发送逻辑移除。五入口与所引用的公开文档、工作流发现模块一起进入 npm/ZIP；不导入私有历史、过程档案或发布配置。
- **验证：** 按本次 PR 的确切提交运行静态检查、Studio 类型/构建/回归、安装及适配器测试、五入口 npm/ZIP 清单与九 Tool E2E；实际结果写在 PR。目标机/宿主加载、模型创作、正常速度审听与视觉验收另列，不从旧结果推定。
- **画像与商业影响：** 改善现有本地创作及模板复用入口，不新增用户研究结论、账号、价格、付费能力或发布。

## 2026-11-06：安装后的模板 Skill 引导

- 接受首次体验的新用户进入现有的 `template-to-video`，替换已删除的 `motion-template` 名称；沿用 Product Promo 示例与既有同意规则，不扩大安装授权。
- 安装回归提取实际脚本中的 Skill 引用，确认对应 `SKILL.md` 存在且至少匹配一项；CI 执行这条检查。新增测试在旧脚本上失败，修正后运行对应回归。
- 英文与中文使用说明同步标明模板入口，中文源码安装地址指向当前仓库的 `feature/motion`，并说明该命令在分支存在期间即可使用，与 `install.sh` 默认检出分支一致。
- 保留独立 npm、原生依赖锁、公开内容清理、浏览器统计移除和正向打包清单；不增加账户、计费或商业化能力，不发布包。

## 2026-11-06：独立分发与复刻工作流

- Motion 源码位于仓库根目录；保持独立 npm lockfile、安装器、MCP 与 Skills，不依赖 OD 的应用私有代码或工作区链接。
- 复刻入口已实现：参考视频使用 openmotion-recreate，原生工程、重建与验收指引通过同一套 MCP resources 提供。区域测量脚本不把无效范围或测量失败写成成功；一期继续只有九个公开 Tool 和四个 Skills。
- npm 应用归档、插件 ZIP 与完整 ZIP 共用 `scripts/distribution.ts` 的正向清单。只分发运行所需源码、构建资源、指定使用文档、Skills 和许可证；不分发开发测试、Studio 源码、过程记录或发布辅助工具。新增文档和脚本必须显式加入清单。
- 删除上游浏览器统计密钥与网络发送实现，保留编辑器调用接口；自动实验分组关闭。引擎子进程继续使用 `HYPERFRAMES_NO_TELEMETRY=1`。本机编辑、预览、渲染与技术验证不依赖使用统计。
- 验证入口：`npm run check`、`npm run typecheck:studio`、打包与复刻单测、Studio 回归、独立 npm 安装和真实出片验收。具体结果绑定对应 PR 的提交及 CI；没有执行的目标平台或模型回合不记为通过。
- 当前工作流只构建和校验；npm 安装器保持 `private: true`，不发布 npm、Release 或存储对象。本次不增加账户、计费或托管服务。
