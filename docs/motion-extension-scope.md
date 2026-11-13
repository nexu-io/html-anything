# Motion 效果扩展的职责边界

模板能力包含 Motion 的两条链路：参考视频转可编辑模板（`openmotion-video-to-template`，不提问，由 Agent 自行决定并记录取舍）、模板转视频（`openmotion-template-to-video`，面向用户，缺事实或素材时可以提问）。openmotion-video-to-template 只承接可复用模板交付；普通参考视频复刻由 openmotion-recreate 实现（重建、测量参考与脚本在其自身目录内，不依赖模板 Skill），不默认先转模板。已有模板的修改由 openmotion-template-to-video 处理。底层工程沿用 HyperFrames；模板是可携带源码、素材、预览和编辑说明。视觉接受程度由用户判断，技术检查不代替人类验收。

## 当前分发与接口

- 五个正式入口均随一期插件和四宿主适配器分发。`openmotion-template-to-video` 使用 `openmotion://workflow/template/start`，`openmotion-video-to-template` 使用 `openmotion://workflow/video-to-template/start`；短 workflow ID 保持兼容，读取不会启动服务或创建工程。
- Phase one exposes [11 public Tools](mcp-phase1-tools.md): nine project Tools plus `openmotion_list_templates` and `openmotion_get_template`. Use `openmotion_get_project` for project/file/job reads, `openmotion_edit_project` for managed source changes, `openmotion_import_assets` for batch imports and `openmotion_export_request` for export and technical verification.
- The two public catalog Tools provide the local template index and individual template details/instructions. Older standalone comparison, workflow-reading and template-management handlers remain internal compatibility only; Skills must not require those hidden calls. Existing private template files are preserved.
- 下载/分析参考、CLI 检查、原片对照视频与 ZIP 打包由宿主可用能力完成；工具不足须记录缺口。技术检查不代表人类视觉验收。

## 不改底座

插件名、MCP 服务名、安装脚本、用户数据目录和 Studio 端口沿用研发主干，本扩展不修改。安装路径、端口和数据目录变化必须独立验证，不能由内容 Skill 隐式修改。

## 验证边界

- 默认入口保持薄路由，模板专业入口指向真实 Skill；增加用户模板文件不得改变默认目录结果。
- 两条模板 Skill 均可发现并读取全部参考；历史模板文件保持可读取。比较 handler 的存在不代表一期公开可调用。
- 模板入口接入与视频转模板职责分开验证，不以既有视频外观结果代替新版本的运行验证；普通视频复刻由 openmotion-recreate 实现，各版本的实际验证范围单列，不自动认证融合版本。
- 不修改实验成品、生成素材或用户工程；扩展的合入沿用仓库 PR 与 CI 流程。
