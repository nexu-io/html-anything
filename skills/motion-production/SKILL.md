---
name: motion-production
description: 执行 OpenMotion 已有工程在既定创作决定下的局部修改、素材或音轨替换、预览、技术排错、导出与交付。重新设计叙事、动作或声画关系使用 motion-director；已有模板出片走 motion-template-to-video，参考作品复刻走 motion-recreate，视频转可复用模板走 motion-video-to-template。仓库开发与文档维护不触发影片制作。
---

# Motion production

## 职责与目标

在已确认的创作决定下完成工程操作与约定交付，恢复已有工程和保持项，检查受影响内容与实际产物。详细方法由共享规范提供，本入口负责通用工程任务的接入。

Agent 根据本轮意图选择入口，专业任务可直接进入对应 Skill。项目源自模板或复刻，不决定后续每轮的入口；同一个 Agent 复用工程与决定继续执行。

## 1. 恢复本轮范围

读取 [共享上下文](references/context.md)，复用已有简报、素材、工程、授权与仍可用的已读正文。恢复当前阶段、保持项和已完成操作，按本轮任务补齐依赖。续作状态来自会话、已有记录与实际工程；只读过入口不代表已恢复状态。

本入口适用于在已有可编辑工程中按确定要求改文字、颜色或局部时间，替换已选素材/音乐、调音量，打开预览、技术检查、工程排错及仅导出。只有成片文件或链接、没有对应可编辑工程时，进入 motion-recreate；不能直接把 MP4 当成可编辑工程。需要新的叙事、动作或声画编排时，按下方专业导航进入对应范围；局部创作只展开受影响内容。

## 2. 工程操作与交付

1. 修改已有内容时读取 [共享修改流程](references/edit.md)，确定变化、保持项及连带影响；仅查询、预览、审查或导出按本轮范围执行。
2. Existing-project content edits apply the [continuing-edit preview rules](references/native.md#continuing-edits) before writing and after saving, including scoped engineering work. Preserve the current chat by default; queue its latest preview while inactive and inspect it on return. Only an explicit show-now request permits switching back for this turn. 操作工程前读取 [运行规范](references/production.md)；编写原生内容前另读 [Native authoring](references/native.md) 及工具返回的固定版本引擎指南。确认 projectId、最新 revision 与 currentVersionId，复用已完成操作。
3. 按共享上下文的依赖清单补齐受影响的质量规范。换现成音乐、调音量也需核对声画锚点与原有 SFX；画面锁定时保持视觉内容。补读结果先返回模型，后续调用再执行依赖操作。
4. 检查受影响区间、接点和保持项。需要新渲染的导出或成片交付读取 [验证](references/verification.md)，针对已审查 revision/versionId 导出，已有适用任务先查询并复用；模板出片按专业入口在编辑器中核验，需要导出时检查实际 MP4。技术通过与创作品质、正常播放及试听分别记录。
5. 停在用户要求的方案、预览、工程或成片阶段。交付实际结果、检查与必要限制。编辑器中打开的工程就是交付物，只有用户明确要 MP4、视频文件、下载或导出时才附 MP4。

## 专业导航与旧调用兼容

以下导航供尚未选定入口或旧 `production/start` 调用使用；明确的专业任务直接进入对应入口。通用工程任务无需为补齐质量规范重新启动专业创作流程。

| 本轮任务 | 进入范围 |
| --- | --- |
| 原创新片、动态图形、创作方案、大幅重编叙事 | [motion-director](../motion-director/SKILL.md) |
| 重新设计局部动作、节奏、声音叙事，或评价创作品质 | motion-director 的局部创作／审片范围；即使画面锁定，也可仅设计声音 |
| 使用已选可编辑模板或源码适配内容 | [motion-template-to-video](../motion-template-to-video/SKILL.md)，保留原样交付与内容适配实现 |
| 明确要求把参考视频重建为可复用模板文件夹或 ZIP | [motion-video-to-template](../motion-video-to-template/SKILL.md) |
| 根据实际视频重建本次作品；只有成片文件/链接、没有对应可编辑工程时，即使只改几处字 | [motion-recreate](../motion-recreate/SKILL.md)，沿用已有复刻方法与数字测量 |
| 参考视频只提供风格灵感 | motion-director |
| 接受安装后的首次体验邀请 | motion-template-to-video；沿用本次邀请中用户接受的准确模板 ID、原生时长、独立工程及可编辑预览；三候选的“是”先澄清 |

模糊需求结合用户目标和已有素材判断；只补充影响选路或真实性的关键缺口。链接与文件是输入形式，不自动等于复刻。模板来源与精确 ID 按 [模板能力说明](references/templates.md) 核对；原创新片需要补齐简报时使用 [需求与记录](references/intake.md)。

## 本地与 MCP 同源

相对链接按本文件位置解析。MCP-only 通过 resources/list 发现、resources/read 读取同源正文：本入口为 `motion://workflow/production/start`；共享页使用 production 的 context、edit、production、native、verification、templates、intake、portable；专业入口短 ID 为 director、template、recreate、video-to-template，各读 start。固定引擎指南为 `motion://engine/SKILL.md`。

既有 workflow 短 ID 和共享文档路径保持兼容，旧默认 production/start 仍能导航到专业入口；一期不提供独立工作流读取 Tool。返回的 references 提供准确地址；用 documentId/contentHash 识别版本，仅复用实际读过且仍在上下文的完整正文。读取指导不启动服务、不改工程，也不证明实际执行合规。
