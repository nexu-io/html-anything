# OpenDesign · Claude Code

开始本仓库的工作前，读取并遵循 [AGENTS.md](AGENTS.md)。它是与 Codex 及其他 Agent 共用的仓库准则。

## Repository collaboration instructions

Follow the [shared repository collaboration instructions](AGENTS.md#repository-collaboration-instructions). All commit messages, including subjects and bodies, must be in English. All issue and pull request titles and descriptions, comments, review summaries, discussions, and release notes you create or update must also be in English, regardless of the user's request language. Verify this before committing or submitting. Keep persistent repository instructions in `AGENTS.md` and keep this entry aligned.

## Product documentation

Follow the [README writing and acknowledgements rule](AGENTS.md#readme-writing-and-acknowledgements) for every README, alternative draft and translation. Keep the main narrative, headings and showcase copy focused on OpenMotion and what each example demonstrates. Put other-product comparisons, inspiration, source-product labels and upstream acknowledgements only in the final **Acknowledgements** section; do not use headings such as "From MotionGit". Preserve licenses and provenance, and keep required setup identifiers, supported agent/model names and explicitly requested example brand names accurate. Verify this placement before finishing README edits.

Follow the [shared product architecture review guidance](AGENTS.md#product-architecture-review). For every change, review the entire [product architecture](docs/product/architecture.md) and assess whether it remains accurate and consistent. Update it only when needed, keeping related sections and supporting docs consistent. If it remains accurate, leave it unchanged; there is no automatic documentation update or mandatory per-change record. Use the [documentation index](docs/README.md) for related topics and verify links when editing.

制作影片时按 AGENTS.md 根据本轮意图直接选择入口；原创/局部动作与声音重新设计、创作审片由 director 承接，既定决定下的工程操作由 production 承接。专业入口复用共享上下文，无需前置 production。模板路线已接入 motion-template-to-video，motion-recreate 已接入实际复刻流程及其自带的参考、测量脚本，边界与 MCP 调用见 [Skill 路由](docs/skills.md)。共享工程和成片验证继续适用。仓库代码与文档维护不需要启动影片制作问卷。

视频转可复用模板单独进入 motion-video-to-template；两条模板入口的边界见 AGENTS.md 的 Template production and reuse。
