# 参与 OpenMotion 开发

[English](CONTRIBUTING.md)

## 从一份有用的贡献开始

欢迎设计师、创作者、提示词作者和工程师。[OpenMotion Library](library/README.zh-CN.md) 集中收纳创作资源；核心制作工作流继续在 `skills/` 中维护。

| 贡献内容 | 目录 | 请附上 |
| --- | --- | --- |
| 可复用的方法 | `library/skills/<name>/SKILL.md` | name / description frontmatter、触发条件、步骤和实际使用示例。 |
| 模板 | `library/templates/<name>/` | 可编辑源码或持续维护的来源链接、`TEMPLATE.md`、预览和改编检查。 |
| Motion 组件 | `library/components/<name>/` | 源码或明确标注的配方、时序、输入、可修改项与审阅说明。 |
| 动效设计体系 | `library/design-systems/<name>/MOTION_DESIGN.md` | 视觉语言、节奏、运动、声音、参考与审阅标准。 |
| Brandkit | `library/brandkits/<name>/BRANDKIT.md` | 确认的事实、文案、身份、素材路径与权限说明。 |
| 运行时 / 编辑器 / Agent 接入 | [架构文档](docs/product/architecture.md)对应模块 | 可复现问题、聚焦的修改与对应边界的检查。 |

按[条目清单](library/ENTRY_TEMPLATE.md)填写并加入分类索引，保留来源与许可。区分参考、配方与可编辑示例。新增文件夹不会自动注册到 Studio、MCP 工作流或默认五个 Skills；分发仍使用明确的文件清单。

## PR 流程

从仓库根目录开发，先读 [AGENTS.md](AGENTS.md)、[产品架构](docs/product/architecture.md) 和相关专题。使用 CI 固定的 Node 版本；依赖变更需同步维护 `package-lock.json` 与 `scripts/runtime-lock.json`。

提交 PR 前按[本地验证指引](AGENTS.md#local-validation)选择检查，并说明实际运行的检查。Studio 单测用 `npm run test:studio`。模型创作与人工视觉验收单独记录，不覆盖真实工程或日常宿主配置。

PR 聚焦一个问题，说明实际变化和验证结果。较大改动可在已有 issue、需求单或 PR 描述中讨论；工作范围已明确时，无需另建 issue。每次变更整体审视产品架构，按[共同准则](AGENTS.md#product-architecture-review)判断是否需要更新，不要求每个 PR 修改文档。保留历史，用后续提交响应评审，不强推共享分支。

Agent 贡献也遵循同一路径：读取条目与来源，完成本次修改，同步专题和[变更记录](docs/product/changes.md)，执行适用检查，说明实际结果与缺口。安装成功、技术导出与人工内容验收分别记录。

不提交凭据、内部链接、私有计划、机器路径或用户工程。打包只使用 `scripts/distribution.ts` 的正向清单；新增分发文件需明确批准。保留上游许可与署名，不自行增加遥测或发布包。

贡献遵循仓库 [Apache-2.0 许可](LICENSE)，上游组件保留各自条款。当前迁移分支仅供评审，不自动合并或发布。
