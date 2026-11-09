# 参与 OpenMotion 开发

[English](CONTRIBUTING.md)

从仓库根目录开发，先读 [AGENTS.md](AGENTS.md)、[产品架构](docs/product/architecture.md) 和相关专题。使用 CI 固定的 Node 版本及 `npm ci`；依赖变更需同步维护 `package-lock.json` 与 `scripts/runtime-lock.json`。

提交 PR 前运行 `npm run check`、`npm run typecheck:studio`、`npm run build:studio` 与受影响的确定性测试。Studio 单测用 `npm run test:studio`。共享机器的浏览器验收沿用 browser-lock；模型创作与人工视觉验收单独记录，不覆盖真实工程或日常宿主配置。

PR 聚焦一个问题，说明实际变化和验证结果，较大改动先建 issue。每次变更整体审视产品架构，按[共同准则](AGENTS.md#product-architecture-review)判断是否需要更新，不要求每个 PR 修改文档。保留历史，用后续提交响应评审，不强推共享分支。

不提交凭据、内部链接、私有计划、机器路径或用户工程。打包只使用 `scripts/distribution.ts` 的正向清单；新增分发文件需明确批准。保留上游许可与署名，不自行增加遥测或发布包。

贡献遵循仓库 [Apache-2.0 许可](LICENSE)，上游组件保留各自条款。当前迁移分支仅供评审，不自动合并或发布。
