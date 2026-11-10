# 产品演示：同一个模板，三种入口

[English product tour](../README.md#product-tour) · [中文产品界面](README.zh-CN.md#产品界面) · [截图来源](readme/ASSETS.md#product-tour-captures)

面向首次使用的创作者与 Agent 用户，演示目标是找到入口、连接客户端、交接一个准确模板，并能回到同一工程继续编辑。示例使用内置 `product-promo` 的原始内容，20 秒、1920 × 1080；模板的来源与许可见 [NOTICE](../template-library/NOTICE.md)。

## 三种入口

| 入口 | 操作 | 可观察的完成条件 |
| --- | --- | --- |
| Codex | 连接 Motion，要求打开明确工程的预览；宿主有面板能力时打开返回的嵌入链接 | Viewer 中有源码、预览和时间轴；返回的 `projectId` 与目标一致 |
| 独立 Studio | 启动应用，从模板创建会话，打开工程 | 会话列表、需求与工程同屏，时间轴可 seek |
| Claude Code / CLI | 加载本机适配器，`/skills` 查看制作入口，MCP 读取工程，按返回路径使用固定 CLI | 五个 Motion Skill 可见、MCP 连接可用、CLI 检查对应同一工程 |

独立视图和嵌入视图复用同一工程；`embed=1` 只改变展示，不复制工程。Codex 是否在宿主面板打开取决于其浏览器能力；没有面板时交付实际预览链接。Studio 的会话保存需求，Agent 执行仍发生在外部客户端。

## 从一个模板交接给 Agent

1. 启动自己的 OpenMotion 工作区，点击 **Connect Agent**，选择 Codex 或 Claude Code。
2. 复制接入指令，由客户端读取当前工作区的指引。按[适配器说明](agent-adapters.md)安装 Skills / MCP；已有连接先核对数据目录。
3. 在模板库搜索 **Product Promo**，打开大预览，展开“查看复制指令”。确认 ID 为 `product-promo`，指引 URL 同时包含所选 `host` 和 `template=product-promo`。
4. 点击“一键复制 / 一键复刻”，粘贴到目标 Agent，再附上自己的文案、图片和保持项。按钮负责交接指令，实际制作由 Agent 执行。
5. Agent 读取具体模板的指引，沿用 `motion-template-to-video`，创建独立模板工程；修改已有工程前读取当前 revision。外部视频参考走 `motion-recreate`，不能用本地示例替代未知参考。
6. 打开可编辑预览并检查；需要导出时另外提出要求，固定版本导出与成片验收继续按[制作流程](skills.md)执行。

可直接补充给 Agent 的需求：

> 用 Product Promo 模板制作我的产品介绍。保留 20 秒结构、场景顺序和动效，用我提供的素材替换标题、图片与结尾文案。先打开可编辑工程让我检查，不要先导出。

截图里的回环地址只属于截图时的工作区，不能作为公共服务地址。请始终复制自己工作区生成的指令。

## 复现截图与终端检查

开发者使用 CI 固定的 Node，先安装锁定依赖并构建 Studio，给演示设置独立的 `MOTION_DATA_DIR`；工程、账号、终端日志与浏览器 profile 都留在 checkout 外。不要复用日常工作区来拍公开演示。

- 用 `motion_create_project` 创建 `projectType=template`、`templateId=product-promo` 的示例，保留返回的工程与会话 ID。它是模板副本，不是模型新创作的影片。
- 对明确的 `projectId` 调用 `motion_open_preview`。分别打开 `sessionUrl` 与 `embeddedPreviewUrl`，使用源码/图层面板，并把预览停在约 6.2 秒；两个 URL 的工程与会话 ID 应一致。
- 打开 Connect Agent，保留接入指令可见；搜索并打开单个模板，展开复制指令后截取第二张图。核对 `host`、模板 ID 和原始来源。
- 从已安装运行时导出本机适配器，在单独演示目录启动 `claude --plugin-dir "$motionAdapters/claude/openmotion"`，使用 `/skills` 查看五个入口。仅查看列表不需要模型完成创作。
- 用 `motion_get_project` 返回的 `hyperframesCli` 和工程 `directory` 设置以下变量；CLI 是固定引擎入口，不能从薄插件目录猜测路径。

```sh
HYPERFRAMES_CLI=/absolute/path/returned/by/motion_get_project
motionProject=/absolute/project/directory/returned/by/motion_get_project
node "$HYPERFRAMES_CLI" info "$motionProject"
node "$HYPERFRAMES_CLI" lint "$motionProject"
node "$HYPERFRAMES_CLI" timeline "$motionProject"
```

本次 CLI 检查得到 1920 × 1080、20 秒，三个图形场景为 0–1.5、1.5–14、14–20 秒，字幕覆盖 1.5–14 秒；lint 扫描四个文件，零错误、零警告。保留模板源码和内容，不将这些检查解释为新的模型创作、视频导出或人工视觉验收。

## 本次截图的验证范围

2026-11-08 截取四张真实 Studio 页面；两张终端图由真实 Claude Code TUI / CLI 的 ANSI 输出在 xterm.js 中回放后截图，仅裁去多余留白。未生成、重绘或拼接 Agent 对话。

已验证独立/嵌入链接指向同一工程、模板预览和精确指令、Claude Code 本地 MCP 握手与五个 Skill 加载，以及原生 CLI 检查。Codex 桌面外框未捕获；Claude Code 模型回合未完成；此次没有新导出 MP4。这些范围在 README 图片旁明确标注。原始终端日志和临时配置不随公开包分发。

共享机器截图与浏览器回归应使用团队已有 browser-lock lane / real 锁，并使用独立 profile 和演示工作区。本次截图采用隔离 Chrome profile、系统文件锁与本机临时端口；团队 browser-lock 包装器回归未执行，不作为该回归已通过的证据。
