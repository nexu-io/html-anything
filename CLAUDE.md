# OpenDesign · Claude Code

开始本仓库的工作前，读取并遵循 [AGENTS.md](AGENTS.md)。它是与 Codex 及其他 Agent 共用的仓库准则。

## Repository collaboration instructions

Follow the [shared repository collaboration instructions](AGENTS.md#repository-collaboration-instructions). All commit messages, including subjects and bodies, must be in English. All issue and pull request titles and descriptions, comments, review summaries, discussions, and release notes you create or update must also be in English, regardless of the user's request language. Verify this before committing or submitting. Keep persistent repository instructions in `AGENTS.md` and keep this entry aligned.

## Product documentation

产品需求必须同步维护 [docs/](docs/README.md)：

- 开始前读取 [产品架构](docs/product/architecture.md) 和相关专题。
- 每次需求交付在同一提交或 PR 中更新受影响文档，并补充 [需求与决策记录](docs/product/changes.md)。用户可见行为变化时更新 README。
- 说明服务谁、解决什么问题、为何这样做、如何验证，以及对画像和商业化的影响；无影响时记录原因。
- 明确区分现状、已确认方向、假设与候选方案，保留证据和未验证事项。不要把产品知识只留在聊天或 PR 中。
- 交付前检查文档链接和口径，列出实际更新的文档与验证结果。详细流程与 [需求模板](docs/templates/requirement.md) 以文档入口为准。

制作影片时按 AGENTS.md 根据本轮意图直接选择入口；原创/局部动作与声音重新设计、创作审片由 director 承接，既定决定下的工程操作由 production 承接。专业入口复用共享上下文，无需前置 production。模板路线已接入 motion-template-to-video，motion-recreate 已接入实际复刻流程及其自带的参考、测量脚本，边界与 MCP 调用见 [Skill 路由](docs/skills.md)。共享工程和成片验证继续适用。仓库代码与文档维护不需要启动影片制作问卷。

视频转可复用模板单独进入 motion-video-to-template；两条模板入口的边界见 AGENTS.md 的 Template production and reuse。
