# 四家 Agent 共用本机运行时

适配器继承外置运行时的 MCP 发布 profile，`scope.json.mcpProfile` 记录 legacy／phase1，不单独维护 Tool allowlist。注册与构建规则见[一期 MCP 契约](mcp-phase1-tools.md)；旧运行时没有此标记时按 legacy 记录，不据此宣称一期已验收。

Codex、Claude Code、DeepSeek Harness（DSH）与 WorkBuddy 从同一份已安装的 OpenMotion 运行时生成薄适配器。适配器包含宿主清单、连接配置、制作 Skills、AGENTS.md、CLAUDE.md 和产品文档，不包含服务源码、node_modules、Node、浏览器、FFmpeg、用户工程或账号凭据。

各宿主分别启动 stdio MCP 进程，业务能力仍由同一份 `mcp.ts`、会话/工程、Model Gateway、Hyperframes 编辑器和渲染器提供。它们可以使用相同或不同的 `MOTION_DATA_DIR`；共用代码不代表共用一个 MCP 进程。macOS 同一数据目录的连接现在复用完整编辑器后台，各自保留工程绑定，Studio 仍只有一个活动工程；协议、版本或代码不兼容时拒绝复用，见 [共享编辑器](shared-editor.md)。Windows / Linux 保留原预览服务复用。Agent 仍需按最新工具契约读取会话、选择产物和校验 revision。

本地也可以使用 [npm 轻量安装器](npm-installation.md) 的 `setup --host codex|claude|deepseek|workbuddy`，自动安装对应入口与 Skills，并共用一份应用和原生依赖缓存。下文的导出方式保留，生成配置与自动注册是不同操作。

## 两种入口，共用同一工程

| 从哪里开始 | 操作路径 | 适合谁 |
| --- | --- | --- |
| **OpenMotion 应用** | 打开工程 → Connect Agent → 按当前工作区指引配置客户端 → 将需求与工程上下文交给 Agent → 在 Studio 预览和细调 | 先浏览素材、模板或操作时间轴的创作者 |
| **已有 Agent 客户端** | 安装 Skills 与运行时连接 → 通过 MCP 读写工程、按需使用 CLI → 打开 Studio 预览 → 导出 | 已经在 Codex、Claude Code 等客户端中工作的用户 |

两条路径使用同一套工程契约。Skills 提供方法，MCP 提供工程工具和引擎指引，CLI 提供原生编写/渲染入口。Agent 推理运行在所连接的外部客户端；Connect Agent 提供配置与指引，不是 Studio 内置聊天执行器。要共同编辑同一作品，客户端须连接同一工作区并读取明确的工程与 revision。

公开入口：[在 OpenMotion 中连接 Agent](README.zh-CN.md#connect-your-agent) · [把 OpenMotion 接入 Agent](README.zh-CN.md#从-agent-接入)。

三种展示入口和单模板交接的实际截图见[产品演示](product-tour.md)。Codex 图展示供宿主使用的嵌入 Viewer；Claude Code 图展示本地 Skill 列表与单独执行的 CLI 检查，分别标明宿主外框与模型执行的验证范围。

## 其他本地客户端

在 Vela、Amp、CodeBuddy、MiMo、AtomCode、Claude Desktop、OpenClaw、Cline、Raven 或 VS Code 中的 GitHub Copilot 里使用 OpenMotion 时，先查看当前客户端支持的连接方式。如果能添加本地 stdio MCP 服务，复制 Studio 的 **Connect Agent** 配置，再让 Agent 列出可用模板。如果客户端能运行本机命令，也可以在工程目录内使用引擎 CLI。[工作区配置与 CLI 入口](README.zh-CN.md#local-agent-connection)

## 仅安装 Skills：npx skills

需要在已有运行时之外发现或安装制作指引时，可用 [Skills CLI](https://github.com/vercel-labs/skills)，在源码 checkout 执行：

```sh
npx skills add ./skills --list
npx skills add ./skills --skill openmotion-director openmotion-production openmotion-template-to-video openmotion-recreate openmotion-video-to-template
```

显式选择五个正式入口，保留相互引用的同级目录；源码中的 `reference-video` 仅为兼容入口，不作为第六个正式 Skill。选择目标宿主后按 CLI 提示安装，不使用 `--all` 扩大安装范围。Skills CLI 有自己的 Node 要求；README 使用 CI 固定的 Node 26.11.1。

此路径仅复制制作指引及 Skill 内参考，不安装运行时、浏览器或媒体工具，也不注册 MCP。需另按下文连接已安装应用，保留源码 checkout 的共享文档，并按运行时返回的路径读取固定引擎指南。完整同装与宿主配置保护仍使用 [npm 安装器](npm-installation.md)。本机验证的发现/文件安装不代表宿主模型已完成创作。

## 生成

安装机器执行一次，不修改客户端设置，不初始化工程，不安装依赖：

```sh
npm run export:adapters -- /absolute/runtime /absolute/projects /absolute/new-adapters
```

三个参数必须是绝对路径。运行时、工程和输出目录必须互不包含；先规范化 `..` 等路径片段，再解析现存父目录的符号链接，避免不存在的中间目录掩盖真实位置。输出目录已存在时拒绝覆盖，失败只清理本次新建的输出，保留运行时和工程。

脚本优先使用当前系统的包内 Node（Mac 的 `runtime/node/bin/node`、Windows 的 `runtime/node/node.exe`），源码运行时则使用执行该脚本的 Node 22.18+。有 `bootstrap.mjs` 时保留绝对路径 preload，以配置浏览器、媒体工具和最小 PATH。Windows PowerShell 中可用包内 Node 执行：

```powershell
& "$motionRuntime/runtime/node/node.exe" --experimental-strip-types "$motionRuntime/scripts/export-adapters.ts" $motionRuntime $motionData $motionAdapters
```

Mac 对应使用 `runtime/node/bin/node`。完整内部测试包保留原有 `motion@openmotion-test` 安装入口，同时带有本脚本供其他宿主生成适配器；本功能不自动改写既有安装或发布新测试版本。旧包没有此脚本，需从包含本次修改的新包生成。

| 输出 | 用途 |
| --- | --- |
| `codex/openmotion/`、`codex/.agents/plugins/marketplace.json` | 原生 Codex 薄插件及本地 marketplace |
| `claude/openmotion/`、`claude/.claude-plugin/marketplace.json` | 原生 Claude Code 薄插件及本地 marketplace |
| `workbuddy/openmotion/` | 本机 MCP + Skill Connector，含 `connector-meta.json`、`mcp.json`、图标和共用说明 |
| `workbuddy/mcp.json` | 手动添加自定义 MCP 的配置 |
| `deepseek/openmotion/cordis.patch.yml` | DSH Cordis patch-list，插入官方 MCP 客户端 |
| `openmotion-<host>-<version>-local.zip` | 各宿主的本机目录归档，非完整应用安装程序 |
| `launch-spec.json` | 四家共用的 Node、参数、工作目录和工程路径 |

ZIP 使用安装机器的绝对路径；跨机器、移动运行时或切换版本后重新生成，不能作为通用安装包公开分发。New plugin manifests, marketplace entries and MCP registrations use `openmotion`. Old explicit Skill invocations and Tool/resource names remain compatibility aliases; existing `motion` MCP configurations may still launch the same runtime. Refresh the host discovery after replacing an old package.

## Codex / Claude Code

```sh
codex plugin marketplace add "$motionAdapters/codex"
codex plugin add motion@openmotion-local
codex plugin list --marketplace openmotion-local --json
codex mcp get motion --json

claude plugin marketplace add "$motionAdapters/claude"
claude plugin install motion@openmotion-local
claude plugin list --json
```

Codex 声明 `requires_local_executor`；两家原生插件均引用同一外置 Node、bootstrap、MCP 入口和数据目录。marketplace 位于各自插件 ZIP 外，原生安装使用生成的 `codex/` 或 `claude/` 目录。同名旧 `motion-local`、`openmotion-test` 或手动 MCP 已启用时，先核对、选择一个连接，避免重复加载。

Generated Codex and Claude plugin descriptions reuse the selected runtime's `.codex-plugin/plugin.json` discovery description, and Codex also retains its short description. Older runtimes without that manifest retain the generic adapter description, while an invalid manifest (a non-object manifest or interface, or an empty/non-string `description` or `interface.shortDescription`) is rejected with a clear error before any adapter is written. The five Skills carry their own intent descriptions across plugin and npm installation paths. Regenerate adapters after updating this metadata and refresh the host's discovery as described in [installation and recovery](npm-installation.md#missing-mcp-tools-or-a-failed-connection).

Codex plugin icons are configured by `interface.logo`, `logoDark`, `composerIcon` and `composerIconDark` in `.codex-plugin/plugin.json`. Generated Codex adapters preserve the runtime interface and include its square brand symbols under `docs/readme/`. Direct MCP connections, including npm setup, receive the same light/dark symbols as embedded `serverInfo.icons` when negotiating protocol `2025-11-25`; older protocol responses omit icons. Icon rendering and placement depend on the host. Updating source metadata does not refresh an already installed plugin or an existing MCP connection.

The default plugin logo/composer SVG also switches its fill through `prefers-color-scheme`. This supports host surfaces that use only the default logo, including the local-MCP row of the Codex plugin detail page; dedicated dark-logo fields remain available for surfaces that select them explicitly.

独立验证使用临时 `CODEX_HOME` / `CLAUDE_CONFIG_DIR`，安装后读取宿主实际解析的启动配置，检查工具和 `openmotion_get_project.dataDirectory`。卸载仅移除薄入口，保留外置运行时和用户数据。旧自带服务源码的 `check-installed-mcp.mjs` / `resolve-installed.mjs` 不用于新适配器缓存；本轮不改变旧安装器行为。

For an npm-managed installation, the installed `scripts/npm-installer.mjs diagnose --host HOST --home HOME` reuses the transport probe with that installation's launcher, host configuration and expected data directory; it does not inspect an assumed plugin cache. Missing/disabled registration, startup errors, invalid protocol output, version/tool mismatches and a different workspace are reported separately. Its independent probe cannot observe every active host session or reconnect a closed chat transport. Follow [connection diagnosis and recovery](npm-installation.md#missing-mcp-tools-or-a-failed-connection), then verify the original project through the real host MCP connection.

## DeepSeek Harness

```sh
dsh --profile headless --patch "$motionAdapters/deepseek/openmotion/cordis.patch.yml" --json   '仅查询Motion工作流和builtin模板，不修改工程或导出。'
```

需要活动 profile 已具备可用模型接入。patch 使用 `insert`，保留已有插件和设置；stdio 启动不需要 DeepSeek 模型 API Key，模型账号由 Harness 管理。工具通常显示为 `mcp__openmotion__openmotion_get_project`，以实际发现的名称为准。参见 [DSH 官方 MCP 客户端](https://github.com/deepseek-ai/deepseek-harness/blob/master/packages/mcp/mcp-client/README.md)。

## WorkBuddy

按 [官方 Connector 规范](https://open.workbuddy.cn/en/docs/connector) 输出 MCP + Skill 包，保留共用制作 Skill，不再生成未经桌面验证的 `.workbuddy-plugin` 清单或 Claude marketplace。元信息包含中英文说明、示例和图标；`mcp.json` 使用外置 stdio 进程及 `cwd`，最低版本标为 4.22.15。此本机进程不配置远程 OAuth，也不复制宿主或媒体供应商凭据。

本机未安装 WorkBuddy；桌面导入、模型调用和出片仍为 **not_run**。可在目标桌面按自定义 MCP 流程使用 `workbuddy/mcp.json`，先确认工具和数据目录；生成规范正确不表示已通过 Connector 市场审核。市场名称注册、通用安装和公开分发不在本次范围。

## 验证、升级与回退

打包验证检查四家启动配置一致、ZIP 完整、无运行时代码和工程、文档/Skills 来自选定运行时、空格和特殊字符路径、bootstrap、最小 PATH、重复输出保护和失败清理。接入验证检查原生安装、实际工具发现和指定工程目录；最新会话/网关工具应随运行时发现，不能固定使用旧版 13 工具作为通过标准。

模型创作验收另外执行：读取会话与产物 → 获取最新 revision → 模板/源文件修改 → lint/timeline → 请求导出 → completed → 对 job/revision 校验 MP4。画面、声音和实际播放器播放/跳转/重播单独记录。静态检查、握手、安装成功不能替代模型出片或跨平台验收。

升级时保留旧、新应用目录，用新运行时重新生成适配器，继续显式选择工程目录；失败恢复旧连接。运行时脚本从 `scope.json.runtimeRoot` 或宿主实际 transport.cwd 查找，原生 CLI/创作规范使用工具返回的绝对路径，不能从薄插件缓存推断源码位置。

后台渲染仅对服务管理的任务设置 Hyperframes 0.9.7 的 `HYPERFRAMES_RENDER_DETACHED=1`，避免短命客户端退出取消任务；保留服务超时和子进程组终止。交互式 CLI 的取消策略不变。macOS 共享后台重启会将中断导出持久化为失败，不自动接管续跑；Studio 回收已做专项验收。跨版本数据回退、公开目录发布与自动更新仍需另外设计和验收。
