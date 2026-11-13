# OpenMotion 文档

这里维护公开的使用说明、技术契约和可复现检查。每次变更时整体审视 [产品架构](product/architecture.md)，判断定位、核心流程、模块职责、依赖、数据与接口边界、当前能力和限制是否仍准确一致；仅在需要时更新，并按需调整相关说明。架构仍准确时保持文档不变，不要求每次提交或 PR 修改文档或新增需求记录。不将个人环境、客户资料、内部讨论或商业研究写入公开文档。

- [Inline video progress and playback](inline-video.md)
## 阅读入口

- [English](../README.md) · [简体中文](README.zh-CN.md) · [日本語](README.ja.md)
- [使用与首次体验](usage.md)
- [All-in-One Studio 产品蓝图与 Super Motion Video Agent](product/studio-vision.md)
- [创作者与媒体 Agent 事实包](media-kit.md)
- [七个 AI editing 场景与创作简报](examples.zh-CN.md) / [English briefs](examples.md)
- [README 图片来源与封面复现](readme/ASSETS.md)
- [README 本地资源清单与校验](readme/RESOURCES.md)
- [产品演示：Codex、独立 Studio、Claude Code 与模板交接](product-tour.md)
- [Motion MD：架构与 Skill 包](motion-md.md) / [中文](motion-md.zh-CN.md)
- [真人叙事配方与六组 Motion Design 前后对比](motion-design-examples.zh-CN.md) / [English](motion-design-examples.md)
- [Presenter Tech 科技风口播模板](../library/templates/presenter-tech/README.md) — 本地包、制作指南与验证记录
- [资源索引](collections/README.md) / [中文](collections/README.zh-CN.md)
- [OpenMotion Library](../library/README.zh-CN.md)：Skills、模板、Motion 组件、设计体系与 Brandkits
- [OpenMotion Brandkit](../library/brandkits/openmotion/BRANDKIT.md) / [Ink & Water 动效设计体系](../library/design-systems/ink-water/MOTION_DESIGN.md)

- [Agent 双向接入：从应用连接 Agent / 在 Agent 中使用 OpenMotion](agent-adapters.md)
- [browser-runtime.md](browser-runtime.md)
- [design-system.md](design-system.md)
- [editor-fork.md](editor-fork.md)
- [hyperframes.md](hyperframes.md)
- [mcp-phase1-tools.md](mcp-phase1-tools.md)
- [model-gateway.md](model-gateway.md)
- [openmotion-director.md](openmotion-director.md)
- [motion-extension-scope.md](motion-extension-scope.md)
- [npm-installation.md](npm-installation.md)
- [Install from the source repository](../install.md)
- [Agent installation guide source template](install.md)
- [test and stable acceptance](release-guide.md)
- [Manual candidate build, test publication and immutable snapshots](release-workflows.md)
- [product/architecture.md](product/architecture.md)
- [product/media-generation-design.md](product/media-generation-design.md)
- [project-workspace.md](project-workspace.md)
- [repository-migration.md](repository-migration.md)
- [session-architecture.md](session-architecture.md)
- [shared-editor.md](shared-editor.md)
- [skills.md](skills.md)
- [template-catalog.md](template-catalog.md)
- [Repository template source, storage checks and CMS publication](template-repository.md)
- [templates/requirement.md](templates/requirement.md)
- [test-packages.md](test-packages.md)
- [Tracking integration and agent task template](../tracking/INTEGRATION.md)

## 分发与验证

npm、插件 ZIP 和完整 ZIP 共用 `scripts/distribution.ts` 的文件清单，文档必须逐项批准；源码仓库的存在不表示应当随包发送。运行时必须保留 Skill 引用、MCP 契约和许可证。工程、用户配置、凭据、构建日志与验收媒体留在包外。

使用项目自身的确定性检查，按变化运行相应类型检查、单测与真实环境验收。区分本地通过、CI 通过、目标机安装、宿主加载、模型创作和人工视觉验收，不将一种证据替代另一种。
