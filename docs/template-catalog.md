# 模板目录

OpenDesign 完整迁入 Personal video agent 的 891 条 Hyperframes 目录。原始目录保存在 `hyperframes.json`，来源与校验信息记录在 `provenance.json`。

源工程的 38 张匹配封面保留在 `template-frames/`。`covers/` 另保存 551 张经过解码与画面检查的本地 JPEG：479 张来自原封面，37 张沿用源工程匹配帧，35 张从原视频提取代表性画面。`covers.json` 记录每张封面的模板 ID、源视频、出处和取得方式。全部 42 个完整参考都有本地封面。画面检查排除无法解码和几乎全黑/全白的图像，不用不相关图片补位。

未取得有效封面的 340 条暂时不展示在画廊，仍可通过完整 MCP 目录精确查找。原视频从原始 HTTPS 地址按需播放；加载失败时保留本地真实封面与原始出处。

README 的[七个创作场景](examples.zh-CN.md)从现有目录精选七个外部参考，提供短 GIF、静态预览与可复制简报；[片段清单](readme/examples/manifest.json)记录精确 ID、来源与时间范围。它们是创作输入，不是 OpenMotion 生成的验收样片，也不新增内置模板、目录条目或改变应用画廊的排序。原三项可编辑模板仍通过 [Library 模板入口](../library/templates/README.md)使用。

资源展示区另设 [18 个动态精选](README.zh-CN.md#motion-gallery)，按产品界面、品牌发布、动态文字、光影材质、空间镜头和生成艺术分为六组。默认全部使用真实视频片段制成的循环 GIF，点击播放完整视频，署名链接指向原始条目；仅在读者启用减少动态效果时切换到已有封面。其 [来源清单](readme/gallery/manifest.json)记录 8 支参考片与 10 个 registry 组件的准确 ID、片段范围及校验值。此选择只作用于 README，不改变 Studio 画廊、目录总数、内置模板数量或接入行为。

## 页面与数据

首页 Motion 模式提供分类模板，默认展示三个「可以二次剪辑」模板。「使用模板」先选入输入框，提交后才创建会话：内置模板创建独立工程，外部参考保留精确 ID 并由 Agent 制作。接入弹框继续支持直接打开内置模板和复制参考指令；会话内直接打开模板会新增一个产物，之前工程保留。首页支持搜索、分页、同源版本预览，与弹框共用目录 API；详细行为见 [会话与 Artifact 浏览器](project-workspace.md)。

MCP 接入与模板库使用同一弹框中的一张滚动页面。整体接入结构沿用源工程；模板展示参考 Hyperframes 的视频卡片与大幅预览，保留精选顺序、五类标签、三列网格和同源版本选择。作者出处可跳转，复制动作称为「一键复刻」。浏览更多每次加载六组；搜索匹配名称、ID、作者、标签和描述。同源卡片保留所有版本，不删除重复视频对应的原始记录。

卡片和大幅预览显示原视频的查看量或播放量，以及开场、产品展示、转场、结尾、A-roll Cuts 等内容种类。精选区包含 Firecrawl、Leon Fucak、kyzo、Vintage、Ankush 和口播参考。作者姓名、平台和类型也可搜索。

热度来自 [Hyperframes 公开 Moments 清单](https://static.heygen.ai/hyperframes-oss/desktop/moments/v5/manifest.json)，以 `metadata.json` 保存快照。当前匹配 387 条模板分类，382 条有原帖热度，覆盖 X、Instagram、YouTube 和 TikTok。上游字段统一称为 `x_views`；实际平台由对应的 `x_url` / `source_url` 判断。只按原始 ID、视频地址和原帖身份精确匹配，不能把某作者另一支视频的播放量挪过来。

显示 `42K 次查看` 等紧凑数字；悬停可查看精确数值、平台和同步日期，点击仍打开原帖。数字是 Hyperframes 收录的快照，不代表平台实时值；没有数据时省略热度，真实的零值仍显示。同源版本共享原帖数字，不叠加计数。内部目录列表和详情同时返回 `social` 中的原始数值、平台、出处、同步时间与数据来源。

`GET /motion-api/template-catalog?category=featured&query=&offset=0&limit=6&grouped=true&covered=true` 返回卡片及分页信息。`total` 是当前过滤后的卡片组数，`entryTotal` 是这些组包含的原始条目数，`catalogTotal` 为全部 894 条（891 个外部条目 + 3 个本地模板）。`galleryTotal` 为当前有真实封面的 554 条；`covered=true` 将无封面条目过滤。`next=null` 表示已经读完。内部目录列表默认不分组，可按原始 ID 分页读取完整目录；一期九个公开 Tool 不包含目录查询，宿主通过 Studio 或指引读取。

## Agent 复刻

1. 卡片只复制一句提示、一个链接和精确模板 ID，链接为 `/connect/guide?host=...&template=...`。详细步骤放在链接中，未知 ID 返回错误，不回退到其他示例。
2. Agent 读取指引 URL 中的实际来源、准确 ID、kind 和路线。`builtin` / 可编辑 `registry` 进入 motion-template-to-video；视频 `reference` 进入已实现的 motion-recreate；明确要求可复用模板时进入 motion-video-to-template。通过本地 Skill 或对应 MCP Resources 读取正文和共享 context，不回总入口重新选模板。一期没有模板详情查询 Tool。
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
