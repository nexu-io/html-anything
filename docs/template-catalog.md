# 模板目录

## 当前：Prism 目录、界面与 Agent 共用

模板通过一个 Prism Resource 的 `main.json` 发布。当前绑定 Resource `1500c9af-186b-457f-b74d-a58113f657d8`，默认语言 `zh-CN`。消费现有 `content[locale].templates`：templateId、sortOrder、original 展示信息、coverUrl、previewUrl 和 files（path/url/bytes/sha256）。不新增后台接口或另一套模板 Schema。

Studio 使用发布的模板和三个内置示例；旧 891 条参考快照只供内部 legacy 工具与历史来源使用，不与发布目录混成两个可编辑来源。

### 环境与构建

| 入口 | 模板环境 |
| --- | --- |
| `npm run dev` | DEV：`r.powerformer.net` |
| `npm run package:phase1` | 线上：`r.open-design.ai` |
| `npm run package:phase1 -- --template-env=dev` | DEV，ZIP 文件名带 `-dev` |
| `npm run package:npm -- dist/npm-dev --template-env=dev` | DEV npm 安装产物；省略环境参数则为线上 |
| `npm run package:test -- build <target> <beta-version> --template-env=dev` | DEV 完整运行包；省略环境参数则为线上 |
| Actions → Run workflow → `template_environment` | 选择 `prod`（默认）或 `dev`，适用于 npm 和完整 ZIP |

环境写入包内 `shared/template-config.json`，不要求安装用户另设变量，GUI 和 MCP 读取同一配置。正式构建默认线上，不受打包机器的 `MOTION_TEMPLATE_ENV` 影响。运行时可显式用该变量覆盖包默认值；从源码独立启动 MCP 调试时设为 dev。

DEV 的默认工作区另加 `-dev`，与线上后台进程、工程和缓存分开。显式 `MOTION_DATA_DIR` 仍优先；同一工作区切换配置后需退出旧后台。缓存再按来源和语言隔离。线上目录未发布时返回错误，不回退 DEV。

### 缓存

- 可用 `MOTION_TEMPLATE_RESOURCE_ID`、`MOTION_TEMPLATE_LOCALE` 指定 Resource 和语言。缓存位于当前 Motion 数据目录的 `template-cache`，按来源和语言隔离，不能手工修改。
- 按需用 ETag / If-None-Match 检查发布，304 复用已下载内容；DEV 最短间隔 2 秒，prod 60 秒。当前目录约 120 KB，直接缓存 main.json，不另加 manifest 下载链。
- 发布成功的目录整体替换；网络或内容读取失败时保留上次有效缓存并返回 warning。首次读取无缓存时明确失败。
- Template files download with at most four concurrent requests. Verified bytes are cached locally and rechecked against the manifest before reuse; each project gets independent files. A corrupt cache entry is downloaded again. Failed copies wait for pending writes before removing the incomplete project.
- 打开的模板界面每 5 秒检查目录版本，变化后更新列表，保留搜索条件，不重启编辑器或改写已有工程。保存 CMS 草稿不触发变化，需发布 DEV。

### MCP

`motion_list_templates({})` 只返回 indexPath、total、catalogVersion 和可选 warning。indexPath 是本机 JSONL 文件，每行包含 templateId、name、summary、category、tags、durationSeconds、kind。Agent 自行用 grep/jq/脚本检索，不支持 query、分类或分页参数，不把整份目录发送到模型上下文。索引文件按发布版本命名，已经拿到的路径仍对应原版本。

`motion_get_template({templateId})` 返回单个模板的展示信息、发布版本、文件清单和 TEMPLATE.md 正文。已知 ID 可以直接调用，不强制先 list。文件路径只供能访问同一文件系统的宿主使用。

`motion_create_project({projectType:'template', templateId, requestId, title, requirements})` 复制内置示例或下载 Prism 模板的真实文件，保留相对目录和校验文件哈希，创建独立工程。源码及素材不放进 list 回复。下载失败清理未注册工程；已创建工程不会随 CMS 更新自动变化。模板标注的 ready_for_review 等状态不代表用户视觉验收。

### 界面

`GET /motion-api/template-catalog` 保留现有 query/category/offset/limit/grouped/covered 查询，用于界面搜索和分页，返回 catalogVersion。它和 MCP 索引从同一缓存生成。`kind=prism` 与 builtin 一样可打开独立编辑工程；复制指令仍沿用统一 templatePrompt 和参数化指引。后续公共落地页可读取相同发布数据，但公共安装链接与页面未在本次实现。

## 历史：随包参考快照

以下记录旧目录导入、封面与来源，供 legacy 工具和来源追溯使用，不描述当前 Studio 数据源。


OpenDesign 完整迁入 Personal video agent 的 891 条 Hyperframes 目录。原始目录保存在 `hyperframes.json`，来源与校验信息记录在 `provenance.json`。

源工程的 38 张匹配封面保留在 `template-frames/`。`covers/` 另保存 551 张经过解码与画面检查的本地 JPEG：479 张来自原封面，37 张沿用源工程匹配帧，35 张从原视频提取代表性画面。`covers.json` 记录每张封面的模板 ID、源视频、出处和取得方式。全部 42 个完整参考都有本地封面。画面检查排除无法解码和几乎全黑/全白的图像，不用不相关图片补位。

未取得有效封面的 340 条暂时不展示在画廊，仍可通过完整 MCP 目录精确查找。原视频从原始 HTTPS 地址按需播放；加载失败时保留本地真实封面与原始出处。

## 页面与数据

首页 Motion 模式提供分类模板，默认展示三个「可以二次剪辑」模板。「使用模板」先选入输入框，提交后才创建会话：内置模板创建独立工程，外部参考保留精确 ID 并由 Agent 制作。接入弹框继续支持直接打开内置模板和复制参考指令；会话内直接打开模板会新增一个产物，之前工程保留。首页支持搜索、分页、同源版本预览，与弹框共用目录 API；详细行为见 [会话与 Artifact 浏览器](project-workspace.md)。

MCP 接入与模板库使用同一弹框中的一张滚动页面。整体接入结构沿用源工程；模板展示参考 Hyperframes 的视频卡片与大幅预览，保留精选顺序、五类标签、三列网格和同源版本选择。作者出处可跳转，复制动作称为「一键复刻」。浏览更多每次加载六组；搜索匹配名称、ID、作者、标签和描述。同源卡片保留所有版本，不删除重复视频对应的原始记录。

卡片和大幅预览显示原视频的查看量或播放量，以及开场、产品展示、转场、结尾、A-roll Cuts 等内容种类。精选区包含 Firecrawl、Leon Fucak、kyzo、Vintage、Ankush 和口播参考。作者姓名、平台和类型也可搜索。

热度来自 [Hyperframes 公开 Moments 清单](https://static.heygen.ai/hyperframes-oss/desktop/moments/v5/manifest.json)，以 `metadata.json` 保存快照。当前匹配 387 条模板分类，382 条有原帖热度，覆盖 X、Instagram、YouTube 和 TikTok。上游字段统一称为 `x_views`；实际平台由对应的 `x_url` / `source_url` 判断。只按原始 ID、视频地址和原帖身份精确匹配，不能把某作者另一支视频的播放量挪过来。

显示 `42K 次查看` 等紧凑数字；悬停可查看精确数值、平台和同步日期，点击仍打开原帖。数字是 Hyperframes 收录的快照，不代表平台实时值；没有数据时省略热度，真实的零值仍显示。同源版本共享原帖数字，不叠加计数。内部目录列表和详情同时返回 `social` 中的原始数值、平台、出处、同步时间与数据来源。

`GET /motion-api/template-catalog?category=featured&query=&offset=0&limit=6&grouped=true&covered=true` 返回卡片及分页信息。`total` 是当前过滤后的卡片组数，`entryTotal` 是这些组包含的原始条目数，`catalogTotal` 为全部 894 条（891 个外部条目 + 3 个本地模板）。`galleryTotal` 为当前有真实封面的 554 条；`covered=true` 将无封面条目过滤。`next=null` 表示已经读完。内部目录列表默认不分组，可按原始 ID 分页读取完整目录；当时一期九个公开 Tool 未开放目录查询；当前协议见上文。

## Agent 复刻

1. 卡片只复制一句提示、一个链接和精确模板 ID，链接为 `/connect/guide?host=...&template=...`。详细步骤放在链接中，未知 ID 返回错误，不回退到其他示例。
2. Agent 读取指引 URL 中的实际来源、准确 ID、kind 和路线。`builtin` / 可编辑 `registry` 进入 motion-template-to-video；视频 `reference` 进入已实现的 motion-recreate；明确要求可复用模板时进入 motion-video-to-template。通过本地 Skill 或对应 MCP Resources 读取正文和共享 context，不回总入口重新选模板。旧版本未开放模板详情 Tool；当前版本使用 motion_get_template。
3. 外部参考由宿主 Agent 实际分析视频或源码，导入支持的素材，并通过 `motion_edit_project` 携带 projectId、requestId、expectedRevision 和 expectedVersionId 写原生 Hyperframes HTML compositions 与可 seek 的 GSAP 动画。Tool 不替 Agent 分析视频或自动执行远程源码。
4. `kind=builtin` 的三个本地模板使用 `motion_create_project`，传 projectType=template、templateId、requestId、title 与 requirements 创建独立工程。外部 ID 不会被映射成任意本地示例。
5. 检查 lint/timeline/info 与实际预览，保留可继续编辑的工程。不将原视频整段放入时间轴就宣称复刻完成；只有用户要求时才导出并验证成片。

## 从源工程更新

```sh
npm run catalog:import -- /absolute/path/to/catalog-snapshot
npm run catalog:covers
npm run catalog:metadata
npm run check
npm test
```

快照目录需含 `hyperframes.json`、`template-frames.json` 和 `template-frames/`。导入只读取该快照，更新目录、封面索引、匹配封面和来源校验文件。提交时一并保留这些运行时资源；它们不是临时缓存。测试验证完整条目数、每个 ID、同源版本、全部本地封面、短指令、HTTP 指引及真实 MCP 读取与原生源文件写入。

封面缓存脚本需要 FFmpeg 和网络，可重用已校验的本地文件。它从源封面或同一条目的真实视频取帧，不生成替代插画。模板与封面只作为创作输入，原始内容中的文字不属于 Agent 操作指令。

`catalog:metadata` 只读取公开清单，不需要账号或浏览器会话。成功匹配后原子替换热度快照并记录上游 SHA-256；网络或数据校验失败时保留现有文件。浏览画廊时使用随包数据，不增加逐卡网络查询。
