# 本地测试包：默认 npm，完整 ZIP 备用

当前源码位于 仓库根目录；下列模块命令在该目录执行。活动工作流在仓库根目录 `.github/workflows/ci.yml`，发布保持关闭。迁移基线及历史验收范围见[迁移说明](repository-migration.md)。

MCP 公开入口由包内 `shared/mcp-release.json` 固化，详见[一期注册清单](mcp-phase1-tools.md)。`build <target> <release-version> [legacy|phase1]` 将 profile 和工具名写入 `release.json`；默认沿用源码的 phase1，公开11个 motion_ Tool 并包含5个配套 Skill。缺注册时在创建 staging／ZIP 前失败；本次验证的插件 ZIP 不等于各平台完整原生包已重新验收。

本流程服务于团队试装和问题复现；当前只有测试渠道，尚未启用正式包或自动升级。编辑器和模板业务使用同一份源码。完整包同时包含模型网关 gateway/；供应商 Key 和本机 Agent 登录仍由用户配置，不随包分发。

## 手动构建

合入后，在本仓库 → Actions → **Motion standalone checks** → Run workflow 选择 `format`。默认 `npm`，`full` 组装两个已声明目标的完整 ZIP。两种格式共用源码、锁定依赖和unique test versions。

`template_environment` selects the configuration platform for either format: `dev` (default in standalone CI, `r.powerformer.net`) or `prod` (`r.open-design.ai`). Local builders accept `--template-env=dev|prod`. The choice is embedded in `shared/template-config.json` and recorded as `templateEnvironment` in the release manifest; Studio and MCP share it. DEV application archives and full ZIP manifests have a `-dev` suffix. This selects the template source, not a publication channel; publishing remains disabled. See [template configuration](template-catalog.md#环境与构建).

| 选择 | 构建产物 | 运行时 |
| --- | --- | --- |
| `npm`（默认） | Application npm `.tgz` with embedded app/manifest, plus external archive, release record and SHA256 | 目标机按应用 lockfile 安装 npm 依赖；首次需要时下载固定原生工具 |
| `full`（备用） | Mac arm64 / Windows x64 完整 ZIP、SHA256、`release-<target>.json` | 内置目标平台 Node、生产依赖和原生工具 |

Ordinary builds retain candidate installation-guide artifacts for review; they do not publish npm, Release or R2 objects. Separate manual guide publication follows the release guide; 两种格式误勾 `publish` 均会失败。本地构建的制品位于 `dist/`，The tgz alone is sufficient for setup; adjacent application/manifest files are evidence and an explicit-manifest fallback. See [installation](npm-installation.md) and [test/stable acceptance](release-guide.md).

Explicit builds accept stable `MAJOR.MINOR.PATCH` or `MAJOR.MINOR.PATCH-test.N[.N]`. The shared helper selects next-patch `test.<run>.<attempt>` (for example, 0.6.3 → 0.6.4-test.42.1). The separate [Motion candidate build](release-workflows.md#1-build) runs from `main` and uses short workflow-counter versions when version is empty, for example `0.6.4-test.7` (rerun `0.6.4-test.7.2`); ordinary check builds retain their workflow-local numbering. Candidate publication uses the accepted version unchanged. All embedded identities agree; output directories cannot be overwritten and source versions do not change. Explicit test npm builds default to DEV and candidate; stable npm builds default to prod and stage. Unversioned and channel/environment-mismatched builds remain private. The backup ZIP builder still defaults to prod unless explicitly selected. Publication remains disabled.

PR / main 工作流执行清单、类型、Studio 构建与回归、安装/打包测试，以及十一个 Tool 的真实 ZIP E2E。Linux 是组装与测试环境，不是已支持的用户运行平台。Mac / Windows 的最终安装和真实出片仍须在对应系统验收；当前 本仓库工作流没有 Windows 或 Mac 原生验收 job，不把产包成功写成通过。

## 固定运行时

`scripts/runtime-lock.json` 锁定版本、来源和 SHA256：Node 26.11.1、Chromium 156.0.8078.47、FFmpeg 9.0.2、Hyperframes 0.9.7。校验后才解包。网页只编译一次；npm 直接依赖使用精确版本、package-lock.json 固定传递依赖，目标机用 npm ci --omit=dev --ignore-scripts；安装器没有外部 npm 依赖。浏览器必须与锁定的 Puppeteer 版本一致。完整 ZIP 的生产依赖仍按目标 OS/CPU 分目录装配预编译包，禁用跨平台安装脚本，不复用构建机的 node_modules。Mac 改用 [Martin Riedl 的公开 9.0.2 构建](https://ffmpeg.martin-riedl.de/)，FFmpeg/ffprobe 分别固定带构建日期/版本的 ZIP 和上游 SHA256；完整包自动合并到原 runtime/media/bin 布局，不再 checkout 私有冻结归档。它们是第三方预编译包。Windows 使用 Gyan 官网指向的 GitHub 镜像，固定 9.0.2 地址与原 SHA256；Gyan 站点直链在本次原生 CI 下载超时。重定向必须保持 HTTPS；所有原生来源公开，下载器不发送仓库凭据。

| 测试包 | 最低系统要求 | 构建 / 运行验收 |
|---|---|---|
| mac-arm64 | macOS / Apple Silicon; no additional installer version gate | Linux 装配 / Mac 本机验收；旧系统仍需独立验收 |
| win-x64 | Windows 11，实际链路以 smoke 结果为准 | Linux 装配 / Windows 目标机独立验收 |

没有 Linux、Intel Mac 或 Windows arm64 完整包。macOS 安装不按系统版本提前拒绝；Node、浏览器和媒体工具仍须通过目标机的可执行检查，移除门槛不等于所有旧系统均已验收。本需求不重新选择编辑器方案。

## 完整 ZIP 备用试安装

将最终 ZIP 交给 Codex：

> 请将此 OpenMotion 测试包安装到稳定的用户应用目录，读取包内安装说明，注册 openmotion-test 原生插件，保留其他插件和已有工程。运行包内适用平台的安装脚本，验证 MCP 版本、模板和预览，在新会话使用。

Agent 负责展开 ZIP。包内含 Node、浏览器、媒体工具和生产依赖，无需用户另外执行 npm install。

工程默认在 `~/OpenMotion-test-data`，独立于包和插件缓存；可通过 `MOTION_DATA_DIR` 指定已有目录。试装不自动迁移、卸载 motion-local；若同时启用，测试会话需明确选择本次插件，避免同名工具混淆。

Mac 入口为 scripts/install.command；Windows 为 scripts/install.ps1。Agent 也可在当前终端执行：

```text
<包内Node> <展开后的包目录>/scripts/configure-plugin.mjs
codex plugin marketplace add <展开后的包目录>
codex plugin add motion@openmotion-test
codex plugin list --marketplace openmotion-test
```

安装器先把当前应用目录写入薄插件配置，再注册到 Codex。完整应用、生产依赖与运行时留在安装目录；Codex 缓存只包含入口、技能与文档，避免再次复制完整运行时。原生插件入口路径在安装时生成，不包含构建机路径。应用目录不要在安装后移动，移动或更换版本后重新执行安装器。Windows 应使用较短的目录（如用户目录下的 OpenMotion-test），避免浏览器完整路径达到 260 字符；启动前会给出明确提示。安装器不重启 Codex。升级安装新的唯一版本，工程保留在包外；跨版本工程兼容和回退仍需另行验证。

完整包也保留 `scripts/export-adapters.ts` 及其无依赖 ZIP helper，可在目标安装机器为四家生成绑定该应用的薄适配器；不要在 Linux 装配阶段固化目标机路径。原有 Codex 安装入口保留，其他宿主的生成和独立验收见 [多 Agent 适配器](agent-adapters.md)。

## 本地复现与验收

Default application npm format在 `npm ci`、`npm run build:studio` 后执行：

```sh
version=$(node scripts/test-package.mjs version 42 1)
node scripts/package-npm.mjs "dist/$version" "$version"
node scripts/smoke-npm-package.mjs "dist/$version/release-npm.json" /absolute/path/to/codex/bin/codex.js
```

须在支持的目标系统执行 smoke；Linux 只装配，不代表支持 Linux 原生运行。实际目标机检查还会自动从公开源下载原生依赖，无需公司仓库读取权限。以下为完整 ZIP 的原复现入口：

构建机需要 Node 26.11.1、Git、tar、zip 和 unzip；CI 使用工作流中固定的 Node 版本。Node、浏览器、FFmpeg 和 ffprobe 均从固定公开 HTTPS 地址下载并校验 SHA256；构建原生运行时不使用仓库 Token、额外 Secret 或私有源码 checkout。

```sh
npm run package:test -- prepare mac-arm64
npm ci
npm run build:studio
npm run package:test -- build mac-arm64 0.6.4-test.42.1
npm install --prefix .tools/codex-cli --ignore-scripts --no-audit --no-fund @openai/codex@0.166.0
node scripts/smoke-test-package.mjs <最终ZIP路径> .tools/codex-cli/node_modules/@openai/codex/bin/codex.js
```

同一 Linux 构建机将 target 改为 win-x64 即可装配 Windows 包。目标机只执行 smoke，不重新打包。验证从含空格与中文的新路径展开最终 ZIP，使用系统临时目录中的独立 Codex 配置和工程目录，检查原生安装、最小 PATH 下 MCP 握手、模板、工作流、Studio HTTP，以及有声音、有运动的 1 秒 MP4 和成片技术检查；验收使用显式 `PORT` 配置，否则由系统分配临时空闲端口；不固定占用 54900，避免共享 Windows runner 的其他服务冲突。验收在首次启动时保存进程归属，避免后续预览复用覆盖登记后遗留服务；结束时按版本和工程目录校验后，只清理测试自身创建的进程。模型回合、独立播放器、旧系统及跨版本回退不由此代替。
