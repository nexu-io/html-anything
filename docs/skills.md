# Skill 路由与 MCP 调用契约

All default public names use **OpenMotion**: plugin and MCP server `openmotion`, Tools `openmotion_*`, core Skills `openmotion-*`, and resources `openmotion://`. Only canonical Tools/resources are advertised by MCP discovery. The optional Library Skills use the same `openmotion-` prefix.

Old `motion_*` / legacy `design_*` Tool names and `motion://` resource addresses remain accepted at the compatibility boundary. Retired Skill names are no longer shipped or callable: use the five `openmotion-*` production entries and the three canonical Library names. Library resources live only in canonical folders. From a checkout or full plugin ZIP, `node scripts/install-library-skill.mjs <openmotion-skill-name> <destination-skills-directory>` installs one Library Skill, reuses identical content and refuses to overwrite customized canonical folders. It removes only an unchanged retired Library forwarding folder verified by its complete file hashes; customized, extra-file and symlink folders are preserved and reported as `preservedLegacy` for manual review. Re-run the helper for each Library Skill previously installed separately. npm setup replaces owned bundles and removes obsolete flat entries belonging to the same host/home, with rollback on registration failure. Unowned entries and other installations are preserved; remove any separately installed old core entries manually after checking their contents. Refresh host Skill discovery and update saved invocations to canonical names. An existing `motion` MCP registration may still launch this runtime; new configurations register only `openmotion`.

Renaming does not change schemas, defaults, engine versions, permissions or project data formats. Internal request identities and telemetry keys retain their original names so retries cannot duplicate saved changes or exports. Compatible running backends are negotiated using either Tool spelling. See [installation and migration](npm-installation.md#public-names-and-compatibility). Generic terms such as motion graphics and motion blur remain animation terminology.

## 可选社区资源

[`library/`](../library/README.zh-CN.md) 收纳可选创作 Skills、模板索引、组件配方、`MOTION_DESIGN.md` 设计体系与 Brandkits。首个 [`brandkit`](../library/skills/openmotion-brandkit/SKILL.md) 只整理品牌上下文，可用 `npx skills add ./library/skills --skill openmotion-brandkit` 单独安装。它不进入以下五个核心制作入口、不自动注册为 MCP resource，也不改变制作意图路由。资源需要由用户或 Agent 明确选择与提供；新增条目遵循[贡献清单](../library/ENTRY_TEMPLATE.md)。

新增可选 [`openmotion-design-remix`](../library/skills/openmotion-design-remix/SKILL.md)，提供六个固定源码 profile 的 Motion Design 说明、替换 preset、独立工程生成脚本和同步对比。它是 Library 内容，不自动注册到 MCP，也不改变五个核心制作入口。与普通 Brandkit 可分别选择安装；脚本只进行指定源码替换，不解释 Markdown 或重建任意视频。

可选 [`presenter-story`](../library/skills/openmotion-presenter-story/SKILL.md) 提供三份真人口播 / Motion 设计配方：知识清单、工作流演示、产品讲解。它要求用自己的录制和实际语音时间码编排字幕、画中画与动效；展示媒体为目录里的上游原片及改编，不是新 Skill 的成片验收。它不包含人物素材或可执行模板，仍复用现有制作路线。

2026-11-06：五个入口统一为 motion- 前缀，视频转模板纳入一期插件、四宿主薄适配器与 MCP Resources。同时融合已评审的通用工程入口方案，保留原制作实现和导演质量参考；同时保留 main PR #28 的实际复刻流程、独立参考和测量脚本。历史多轮实验记录见下文，其证据不自动覆盖本次命名与分发变更。

## Director v1.5.5 integration

Director and its existing quality references now cover concrete visual events, joint material/motion design, recognizable action windows, representative prototypes and reuse of accepted implementations. Shared intake/runtime guidance covers scoped material acquisition; edit and verification own timing-evidence invalidation and evidence classification. No Skill, Resource section, public Tool or media service is added.

The current five-route, eleven-Tool contract, editor-first handoff, requested-export behavior and distribution layout remain unchanged. This guidance does not establish cross-task creative reliability or native audiovisual model-review capability. See [the director guide](openmotion-director.md). Version-specific statements below describe their historical snapshots.

## Reference reconstruction guidance

The recreate route carries a shot/action-unit process with concrete worker briefs, source ownership, time/coordinate mapping and inspected-source handoffs. Reference observations become timed controls consumed by the renderer, with conditional methods for camera transforms, relative part motion, changing shapes, mark-based materials, text and exposure. Local iteration compares observed and intermediate states, repairs the responsible mechanism, and rechecks shared assets, overlap and the complete layer stack after integration. One Agent can execute the same units sequentially. Observation density and implementation remain scene-dependent. The guidance is based on segment-production retrospectives that include reused implementations and directed corrections. Reliability across fresh sessions and different references still requires evaluation. See [the reconstruction reference](../skills/openmotion-recreate/references/rebuild.md#establish-a-difficult-visual-system).

## 职责与入口

当前采用“通用工程入口＋可直达专业 Skill＋同源共享规范”。Agent 根据本轮目标、保持项与工程状态直接选择入口，专业任务无需先读 production。production 承接既定创作决定下的工程执行，为已有 production/start 调用保留简短导航。此选择融合了“核查仓库中的 Skill 结构”中已评审并本地实施的职责收窄，取代此前“泛化请求先经薄路由”的描述；不删除兼容资源，不复制共享规则。

| 入口 | 职责 | 当前状态 |
| --- | --- | --- |
| openmotion-production | 既定决定下的局部工程修改、预览、技术检查、排错与导出 | 通用工程入口；保留兼容导航 |
| openmotion-director | 原创、局部/整体叙事动作声音重新设计、创作审片 | v1.5.5; visual events, materials, choreography and audiovisual timing guidance |
| openmotion-template-to-video | 已有模板原样出片、源码适配与内容替换 | 已接入默认 template 路线，共用修改与 revision 规范 |
| openmotion-video-to-template | 把视频制作成可复用模板文件夹 / ZIP | 已纳入分发与资源读取，不代替普通视频复刻 |
| openmotion-recreate | 从参考重建用户本次作品 | 已接入实际流程；自带重建、测量参考与脚本 |
| reference-video | 旧引用的原生编写兼容入口 | 通用正文迁入共享 native，非复刻专业实现 |

各入口正文先说明职责与目标：production 负责既定决定下的工程接续与交付，director 从产品事实、受众与传播目的判断动态表达，openmotion-template-to-video 负责既有模板出片与内容适配，recreate 根据实际参考重建并核对差距；reference-video 继续承担兼容引导。director v1.4.5 明确局部创作和声音重新设计也可直接进入；替换已选音轨与重新设计声画关系按本轮目标区分，画面锁定只决定保持项。角色定位不增加固定风格或新的专业能力，也不代表多个独立 Agent。

按用户意图选路，不以视频文件格式代替意图判断。模板目录的 builtin 与可编辑 registry 进入 template；video-only reference 进入 recreate。参考只提供气质时仍为原创。既有模板工程的普通局部修改不重新应用模板。

专业入口可由宿主 Skill 自动匹配、用户指定或准确模板指引直接选中，只读取共享 context 后继续，不返回 production 重做选路。局部创作/声音重新设计/创作品质审片由 director 承接；按既定决定修改、替换已选音乐、技术检查和仅导出由 production 承接；仅脚本或审片停在当前范围；共享质量参考不会要求重启 director 的完整创作流程。Skills 是同一 Agent 的文档，不是相互递归执行的独立进程。

Original motion-video requests on a user-supplied topic, including esports recaps and explainers, use openmotion-director. Its discovery description covers both creation and concept-only requests. Shared context directs the Agent to discover the host's OpenMotion tools and promptly disclose missing or failed connections, including during planning. Planning can finish without a project mutation, and production continues through the host MCP connection. Reading guidance and an independent CLI probe each have their own evidence scope. Skill matching remains the host model's decision. See [the official Skill discovery guidance](https://developers.openai.com/plugins/build/skills#write-skillmd).

## 同源文档接口

本地文件和 MCP 返回同一份全文。注册表在 `shared/workflow.ts`，一期分发以下五条路线。Skill 名称与目录统一；既有 workflow 短 ID 保持兼容，不增加同义 Skill 入口：

MCP 工具说明和领域执行位于 `mcp-tools.ts`；`mcp.ts` 保留初始化、协议与共享后台转发。macOS 每条连接保留工程绑定，读取指导不启动后台或改变连接选择；托管工程写入仍校验目标与 revision，见 [共享编辑器](shared-editor.md)。

| Skill | workflow 短 ID | section |
| --- | --- | --- |
| openmotion-production | production（默认） | start、context、intake、templates、native、production、verification、edit、portable、materials |
| openmotion-director | director | start、actions、craft、phrases、decisions、sound、review、examples |
| openmotion-template-to-video | template | start |
| openmotion-recreate | recreate | start、rebuild、verification |
| openmotion-video-to-template | video-to-template | start、measure、rebuild、project、verification、sources |

```json
{"uri":"openmotion://workflow/director/start"}
```

一期 MCP 使用 resources/list 和 resources/read；URI 为 openmotion://workflow/<workflow>/<section>。旧工作流 Tool 只留内部兼容，不出现在一期 tools/list。无效 URI 或任意文件路径会拒绝。固定引擎指南为 openmotion://engine/SKILL.md，相关 Markdown 可按相对路径读取。

返回 `workflow`、`section`、`status`、`documentId`、`contentHash`、`content`、`path`、`sections`、`workflows`、`references`、`readNext`。`references` 包含相邻文档的准确 workflow/section/documentId；它是地址映射，不会递归读取。`ready` 表示该指导入口已实现，`placeholder` 表示专业流程占位，均不代表成片质量通过；当前五条正式路线均为 ready。

共享 context 维护按任务范围的依赖清单。Agent 计算本次必需正文与仍可用的已读正文之差，只补缺口；完整正文返回后记录文档标识和版本，复用会话或已有 STATE，不在活动工程内存放阅读记录。声音专项明确需要 actions，模板明确需要 templates，多段模板也需要 decisions。阶段或轮次切换本身不触发重新加载；只在正文丢失、截断或版本变化时补读并记录原因。不遍历全部 references，也不因加载新文档重复工程操作。MCP 不维护模型的阅读状态，不新增读前写硬门禁；记录与文字约束不能强制宿主执行。

Gallery prompts carry the guide URL and exact template ID; the host reads the guide and enters the corresponding specialist without returning to production/start. Phase one exposes `openmotion_list_templates` for the local catalog index and `openmotion_get_template` for a selected template's details and instructions. Legacy catalog handlers remain internal; use only the public contract. The starter does not export by default; a user request for a video file includes export.

## 共享质量与工具边界

When selecting, obtaining or replacing media, all five routes conditionally read the [shared material policy](../skills/openmotion-production/references/materials.md), exposed as `openmotion://workflow/production/materials`. It owns source priorities, acquisition and usability checks; director decisions retain material/motion, timing and state relationships. Viewing, previewing or exporting existing content does not trigger acquisition. User constraints, supported workflow scope and reference fidelity remain authoritative; no new generation or retrieval Tool is introduced.

A prior local trial used only “做一个哈利波特宣传片” in a fresh gpt-6.1-sol/high session, with no supplied media or follow-up sourcing prompt. It retrieved the Warner Bros. trailer and official imagery/wordmark, using ten original excerpts totaling 20.5 seconds in a 32-second 1080p30 MP4. Selected/project hashes and exported frames were checked. That trial used runtime 0.6.1 and director 1.5.5; this PR preserves current main and canonicalizes the shared policy links. The attached sample is historical execution evidence, not a behavioral rerun of this PR head. Harry Potter is already a policy example; no causal, generalization, conflicting-upload or full playback/listening claim follows from this single run.

修改已有内容时，五个入口按需接入 [共享修改流程](../skills/openmotion-production/references/edit.md)，MCP resource 为 `openmotion://workflow/production/edit`；不新增自动触发的 motion-edit。该流程确定变化、保持项及连带影响，基于当前源文件修改，并核对受影响区间、邻接转场、声画锚点和后续再现。初次创建默认草稿、仅打开预览或复用成片链接不因此重走修改流程。

首次缺少的规范和源文件须通过完成的工具调用先返回模型，再执行依赖操作；不能在同一个外层调用里补读并写入/套模板。完整正文仍可用时直接复用。长文档按实际返回预算分批，识别截断后补缺口；命令成功或 STATE 阅读记录均不能代替实际正文。此为宿主 Agent 的执行指导，MCP 未增加无法证明模型阅读状态的硬门禁。

原创制作按任务读取动作脚本、动态表现和短句参考，无需用户额外说“Motion 感”。多段/截图/状态延续、声音设计和动态审片按职责加载相应参考。模板与复刻按影响复用相同标准，不强制换成原创叙事、固定动效或固定音乐结构。

一期公开接口已收敛为 [12 个 openmotion_ Tool](mcp-phase1-tools.md)（9 个工程 Tool、目录获取、模板详情与 media-use）。旧 28 项实现只留内部兼容；读文件、任务查询及技术校验分别并入项目读取与导出流程。一期插件和四宿主薄适配器包含上述五个入口及其参考，reference-video 仅保留源码兼容入口。核心 Skill 指引同步使用新契约；不新增制作引擎或自动复刻算法。

## openmotion-recreate 能力扩展点

复刻目前只支持动态图形。下表是目前已发现的、写死当前能力的位置，不保证穷举。接入 TTS、图片或视频生成模型，或支持实拍/口播/AI 视频时，先按此表修改，再全文检索 `generation Tool`、`phase-one`、`motion graphics` 等字样补漏，并按新能力重新跑评测；新增的能力限制也应写进这些位置，不散落到其他段落。

| 位置 | 当前规则 | 接入新能力后 |
| --- | --- | --- |
| [SKILL.md](../skills/openmotion-recreate/SKILL.md) frontmatter description | 触发范围按动态图形复刻描述 | 支持新视频类型后同步触发范围，并重跑选路测试 |
| SKILL.md Role and goal 第二段 | 只支持动态图形；实拍、口播、AI 视频说明不支持，不暗示给素材就能复刻，只提出动态图形版 | 放宽支持范围，缩小拒绝条件 |
| SKILL.md §3 素材缺口（“Read the selected provider reference for the public media-use Tool”） | Within supported media scope, use shared materials guidance for missing assets; ask only for unresolved inputs or access/capability limits. The BYOK extension adds openmotion_media_use; creative workflow scope remains unchanged | 本包公开生成 Tool 时改写此句，补调用、采用结果和失败处理规则 |
| [production.md](../skills/openmotion-production/references/production.md) 第 3 条 | 一期 MCP 包不提供生成 Tool，生成交给宿主或 Studio | 与上一行同步修改 |
| SKILL.md §5 Sound | 默认沿用原片音轨并重新对齐；删去念出原品牌的旁白 | 有 TTS 后可改为重新配音，不只删除 |
| SKILL.md §5 原片作底层（用户自有成片只改几处细节） | 仅此情况可把原片放在时间线上并打补丁 | 支持实拍局部修改或分镜混排时扩展适用条件 |
| [rebuild.md](../skills/openmotion-recreate/references/rebuild.md) 重建方式、[verify.md](../skills/openmotion-recreate/references/verify.md) 与 `measure_frame.mjs` | 按代码重建的动态图形设计测量和对比 | 新画面类型需确认测量指标和取样是否仍适用 |

以下是交付底线，不随能力扩展放开：不得把整条原片、整帧序列或烘焙进背景的可编辑内容冒充重建（rebuild.md）；不交付在工程外修改的 MP4（SKILL.md §5）。

## Tool 契约审计与宿主能力边界

- 以 `shared/phase1-tools.ts` 的 Schema 和实际 handler 为准：Skill 规定何时调用及检查结果，不新增 Tool、参数或后台创作 Agent。五个入口及全部 Markdown 参考都进入公开 Tool 名称回归。
- 指引通过 resources/read 读取；文件读取与具名任务查询使用 openmotion_get_project；保存使用 openmotion_edit_project；导出使用 openmotion_export_request 并自动技术验证。旧的独立工作流、检查、比较、单素材导入、写文件、导出查询/验证 Tool 不在一期公开契约中。
- 明确 projectId、requestId、revision 与版本身份；导入和 GUI 保存后读回新版本。创建只建立载体，不分析参考或完成影片。预览会 lint 并选择已有工程，不是纯运行时路径查询。
- 参考下载/分析、CLI lint/timeline/info、比较视频和 ZIP 打包依赖宿主可用的文件/媒体/执行能力，不能声称由这九个 Tool 提供。独立文件夹使用自己的源文件和固定版本 CLI；托管工程的保存与导入不能绕过版本保护。字体/SVG/PDF/任意二进制不属于本期素材导入格式。
- 两个模板 Skill 的创作、原样预览复用、源码编辑、参考对照与便携打包规范继续保留。普通复刻交付本次作品；视频转模板交付可反复修改的工程、素材、预览与说明；两者不能仅靠“都有源码”区分。

## 与通用工程入口方案的融合

两组修改目标互补：名称与分发解决入口一致性，职责收窄解决 production 与专业入口重复匹配。本次按语义移植冻结候选中的 production/director/context 分工，并将其旧 MCP 发现文案迁移到当前九项契约与 Resources；不带入旧模板占位、13 Tool Schema 或其他并行工作。简短发现说明集中在浏览器可用的 shared/workflow-entry.js，由 MCP 初始化、内部兼容工作流说明和接入指引复用。

原方案已有 4 题×两组各一次、共 8 个真实只读冷启动观察：新片从 production→director 缩为直接 director；声音重新设计进入 director；局部修改和导出仍可进入 production。两组声音题均读取质量参考，不能把基线判为任务失败；导出题发现集合不同，排除成本归因。该探索对应旧的冻结 Skill/13 Tool 版本，仅支持可行性和局部少读，不证明本次五入口/九 Tool 融合后的效果、成本、稳定率或成片质量。

## PR #28 冲突整合（2026-11-06）

以 main `e399b39` 的复刻实现为准，保留折叠 YAML 描述修复、独立重建/验证参考、measure_frame.mjs 的区域缺失/越界判定及回归；把名称与链接对齐到五个正式入口，并统一 recreate 为 ready。专业直达与 production 的工程边界继续采用 #26；只有成片而无对应可编辑工程的修改进入 recreate。模板的字形保持、可拼新词规则及来源记录清理沿用 #28。当前注册为 27 个 workflow/section 地址、26 份唯一正文，脚本随复刻 Skill 一起分发；九个 Tool 的 Schema 与业务实现不变。整合验证与 CI 只对应最终 head，不沿用下面的旧结果作当前认证。

冲突逐处取舍：

| 文件 | 保留与融合方式 |
| --- | --- |
| AGENTS.md、CLAUDE.md、README.md | 保留 #26 的专业直达、五名称与分发说明；用 #28 实际复刻流程替换占位口径 |
| docs/mcp-phase1-tools.md、docs/motion-extension-scope.md、docs/product/architecture.md、docs/skills.md、docs/template-catalog.md | 保留五入口、九 Tool 指导与宿主能力边界；补齐 recreate ready、独立参考/脚本及 27/26 注册数量，不恢复旧目录查询 Tool |
| mcp-tools.ts、mcp.ts | 保留共享发现文案，更新复刻状态；不调整 Schema、分发门禁或 Tool 执行函数 |
| shared/workflow.ts | 保留新模板目录、五路线分发与原短 ID；并入 #28 的 recreate ready/rebuild/verification 注册 |
| skills/openmotion-production/SKILL.md | 保留通用工程职责和专业导航；增加“只有成片、无可编辑工程”的复刻边界 |
| skills/openmotion-recreate/SKILL.md | 保留 #28 的完整流程与折叠 YAML 修复，仅对齐模板 Skill 名和可复用模板分流 |
| skills/openmotion-video-to-template/SKILL.md | 保留 #26 的命名、Resources 与九 Tool 指导，删除过时的复刻待实现表述，保留 #28 字形规则 |
| tests/workflow.test.ts | 保留五入口与同源读取检查，将 recreate 断言同步为 ready；新增两个参考随注册表进入读取验证 |

本地验证：32 项不同定向检查通过（含 2 项复刻测量回归）；修改后的适配器分发断言另外复验通过。仓库检查、Studio 构建、268 个本地文件链接通过。实际 ZIP 在独立目录经真实 stdio 核对 27 个地址/26 份正文、哈希与引用闭包，复刻脚本存在且可解析；四宿主逐字核对复刻入口、两份参考和脚本。没有运行模型选路或重新制作复刻视频；远端 CI 以最终提交为准。


## 前次融合验证（010dc91，PR #28 整合前）

30 项不同定向检查通过，覆盖五入口全部 Markdown 的公开 Tool 名称、完整 MCP 文档读取/哈希/引用闭包、非法 URI、跨 cwd/符号链接、目录与接入指引、四宿主分发和一期工程业务契约；仓库 check、Studio 类型检查与构建通过。独立 ZIP 真实 stdio 读取确认 5 个正式 Skill、11 个公开 Tool、25 个 workflow/section 地址及 24 份唯一正文，不创建工程。先前 Homebrew Node 的复制测试因动态库布局失败，改用同版本独立 Node 22.22.3 完整复验通过。

九 Tool 的 Schema、工程编辑/导入/导出/版本业务及七份导演质量参考保持 main 内容。本次没有重新执行模型选路、长会话、真实视频制作或正常速度视听验收；上述检查不能证明总体质量、成本或稳定性改善。原实验记录继续按其冻结版本解读。

## 验证与限制

- 安装脚本的 `进入 <Skill> 的` 路由与中英文 README、[使用手册](usage.md#安装完成后的引导codex--agent)首次体验引导的 Skill 链接由 `tests/install.test.ts` 提取并检查对应文件存在，且不允许空匹配；由 PR CI 执行。入口统一为 `openmotion-template-to-video`，保留 Product Promo 首次体验规则，避免改名或文本自动融合留下失效引导。
- 自动回归检查全部文档全文与 SHA256、跨路线链接、旧调用、错误参数、跨 cwd/符号链接，以及空工作区和已有工程不变。
- 目录/HTTP 指引检查 builtin、registry、reference 三种来源的准确 ID 和路线，保留短指令与原工具字段；MCP 源文件写入和 stale revision 拒绝继续覆盖。
- 独立 Agent 前向探针覆盖原创、模板默认内容、源码模板、风格参考、视频 URL/文件复刻、文字小改、声音锁画、仅导出、仅脚本、画廊成片和仓库开发。探针实际调用只读 MCP，停在工程/服务操作前；后续工具序列属于方案检查，不是实际制作执行证明。
- 发现并修复共享 native 的风格参考复制节奏、无条件渲染、仅导出打开编辑器的歧义，以及模板说明对 placeholder 的指代问题。明确宿主自动选中专业 Skill 也算已选路线，无需用户点名后才可直入。探针补齐真实工具 schema 后复验参数使用，避免把缺失 schema 的人工探针误用归因为产品接口失败。

上述早期探针支持文档可达与选路，不等于实际制作证明。随后以 Codex app-server 0.166.0、gpt-6.1-sol/high 跑了 01、04、05、14、17 各三轮真实会话及 MCP：路线和关键状态保持，但必读参考有 2 份从未请求，另 1 份正文截断后未恢复，冷启动 revision 冲突 2 次；未观察到重复成功制作/导出或路线循环。首测原记“额外重读 9 次”，复核模型实际收到的外层工具结果后校正为 5 次必要补读、4 次无效重读。完整命令 stdout 不等于模型收到完整正文。内置浏览器由宿主设置禁用，实际播放审听未验证；不将此实验用于成片质量或复刻保真度结论。

## v1.4.2：阅读复用与冷启动复测

Skill 只调整依赖可见性与已读正文复用，director 七份质量正文不变。工具层拆分后台服务与编辑器启动，冷启动不改写调用者的活动工程 revision；真实并发修改仍拒绝，后台服务随后可原地打开编辑器。没有增加工作流工具或复制媒体引擎。

复测沿用冻结五题、素材、模型与宿主参数，使用全新会话和隔离工程，不给候选反馈或修补产物。15 轮完成，真实 MCP 调用 111 → 107 次，必读未请求 2 → 0、正文截断未恢复 1 → 0、无效重读 4 → 0、冷启动 revision 拒绝 2 → 0。两轮均成功应用模板 2 次、导出 3 次，无重复成功执行、路线循环或关键状态丢失。候选仍有 8 份正文经截断补读恢复，不能称为解决了宿主输出截断。

补充时序审计发现候选 MT05 将 native 补读与 apply 放在同一个外层工具调用中，正文尚未返回模型时模板已经应用。轮末已读完整，不等于执行前已获得规范；本轮仍保留这一缺口，不判为全面通过，也没有在复测后修改候选掩盖它。后续应验证首次补齐关键规范的返回结果与依赖操作之间的决策边界，不要求对已读正文重复加载。

67 项后端/集成测试、类型检查及 Skill 入口校验通过；89 项工程/产物核对通过，三份实际 MP4 与技术验证哈希一致。七份质量正文保持原哈希。每题只跑一次，不把一次成功解释为稳定率。MCP-only、全局 Skills 竞争、长会话压缩、正常速度审看和试听不在已验证范围；完整记录在本地 `multiturn-routing-20261105-r2` 实验归档。

## v1.4.3：共享修改流程复测

v1.4.3 接入共享 edit，明确外层工具返回后的读后决策边界；保留上一轮后台启动与 revision 修复。同样五题、15 轮真实会话完成，105 次 Motion MCP 调用；6 个需修改既有内容的回合均在首次内容操作前获得 edit 全文。未发现范围外内容误改、关键状态丢失或重复成功套模板/导出；CTA 延续至实际 MP4，换音乐保留 SFX 文件与事件，风格参考阶段保留动作、明确改方向后才复刻。91 项工程/产物核对通过。上一轮这些功能保持项也未失败，不能据此宣称误改率下降。

MT05 原先同批补读/执行的问题未重现，但读取完整性未全面通过：MT04 长输出被截断，补读 action-script 33–51 行后仍未获得 28、30、32 行，按原全文标准记一项缺口。其声画锚点与 edit 正文已完整返回，未观察到由此造成误改；不能用 STATE 的已读声明代替到达证据。两轮无效重读和 revision 冲突均为 0。分段正文按精确原文行累计核对，旧题与原评分保持，新增 edit 检查单列。

相关接口/文档测试 7 项、仓库检查和四个入口格式校验通过，七份质量参考原哈希保持。正常速度播放和试听受宿主设置限制，未验证。实验归档为 `multiturn-routing-20261105-r3`；每题一次，不能外推总体稳定率。

复测期间当前分支另有首次体验、角色说明改动，director 更新为 v1.4.4。已保留这些改动及共享 edit 接入；冻结实验副本未变化。当前合并文本另通过 7 项接口/文档回归和仓库检查，完整真实会话结果仅对应冻结 v1.4.3，不自动认证合并后的行为。

## Temporary BYOK debug media guidance

BYOK provider references are part of the existing production guidance, available locally and through `openmotion://workflow/production/{fal,opendesign,atlascloud,wavespeed}`; no separate media debugging Skill is distributed. `openmotion_media_use` reads configured fal.ai, OpenDesign Cloud, Atlas Cloud or WaveSpeedAI credentials inside the service and returns task state and real imported assets; the Agent never needs to read the key file. Formal creative media guidance remains separate.
