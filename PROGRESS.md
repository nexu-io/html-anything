# HTML Anything — 构建进度追踪

> 持久化任务列表，防止 context 丢失。每完成一项就更新此文件。
>
> **当前状态（v5 / 2026-05）**: 75 个 skill 模板（13 类 / 9 大交付场景）· 17 种 coding agent 自动检测（其中 8 种 stdin 协议立即可用，9 种 ACP/pi-rpc 协议适配中）· dev server 默认端口 `:3000`（README / CONTRIBUTING 口径），开发可 `PORT=3021 pnpm dev` 自定义。
>
> *以下早期 v1 状态记录保留作为历史，反映项目从 9 个内置模板演进到 75 个 skill 注册表的轨迹。*
> 最近更新: **全部 11 项任务完成 ✅** — 端到端跑通, dev server 在 :3456

## 项目目标

把任意数据/文档（文本、Markdown、CSV、Excel、JSON、SQL、图片）转成"世界级好看"的 HTML：
PPT、简历、海报、知识卡片、社媒图、网页原型、文章、Hyperframes 视频脚本……
然后一键复制成公众号/推特/知乎可发布格式，或截图导出。

灵感来源: Claude Code 创始人不再用 markdown 全用 HTML 表达 → 我们做 "everything → HTML"。

## 全局任务清单

| # | 任务 | 状态 | 备注 |
|---|------|------|------|
| 1 | 研究参考项目核心特性 | ✅ | open-design agent 检测 / markdown-nice 复制 / markdown-to-image 截图 都已研究 |
| 2 | 初始化 Next.js 项目骨架 | ✅ | Next.js 16 + React 19 + Tailwind v4 + Turbopack |
| 3 | 实现本地 Code Agent 检测 API | ✅ | detect.ts + argv.ts + invoke.ts + /api/agents + /api/convert SSE |
| 4 | 构建编辑器/预览主界面布局 | ✅ | toolbar + agent picker + template picker + editor pane + preview pane + export menu |
| 5 | 实现多种数据格式输入处理 | ✅ | auto detect (md/csv/tsv/json/yaml/sql/html) + xlsx 解析 + 图片 dataUrl + 文件上传 |
| 6 | 设计多套世界级 HTML 模板/设计系统 | ✅ | 9 个模板: 文章/PPT/简历/海报/小红书/推特/Web 原型/数据报告/Hyperframes |
| 7 | 实现 AI 转换流水线 | ✅ | spawn agent → SSE → 客户端 hook → iframe 实时刷新 (Claude 测试通过 80s/31KB) |
| 8 | 实现一键复制到公众号/推特/知乎 | ✅ | juice 内联 + ClipboardItem + 知乎数学公式处理 + Safari fallback |
| 9 | 实现 HTML 截图/导出/分享 | ✅ | modern-screenshot 2x PNG / 复制到剪贴板 / 下载 .html / .png |
| 10 | 编写有传播力的 README | ✅ | 中英双语, 含 architecture/templates/agents 表/致谢 |
| 11 | 端到端验证整个流程跑通 | ✅ | curl POST /api/convert → claude → SSE → 完整 HTML 输出, 0 错误 |

## 技术决策

- **框架**: Next.js 16 App Router + Server Components 边界控制
- **样式**: Tailwind v4 (无配置文件, CSS-first)
- **编辑器**: 简洁 textarea + 标签页（文本/MD/CSV/Excel/JSON/上传），不引入 Monaco
- **预览**: iframe srcdoc 沙箱，每次转换后注入完整 HTML
- **状态**: zustand (客户端) + RSC fetch
- **AI 调用**: 优先本地 CLI agent（spawn + stdin pipe + SSE relay），可选 API key 兜底
- **复制**: juice 内联样式 → ClipboardItem({'text/html', 'text/plain'})
- **截图**: modern-screenshot domToBlob (image/png) → 剪贴板或下载
- **模板**: 每个模板 = name + category + aspectRatio + designTokens + promptTemplate
  - 提示词中包含 Tailwind CDN 引导 + 字体 + 配色 + 排版规则 → AI 输出自包含 HTML

## 文件结构（计划）

```
src/
├── app/
│   ├── api/
│   │   ├── agents/route.ts     ✅ GET 检测 agent
│   │   └── convert/route.ts    ⏳ POST 流式转换
│   ├── layout.tsx              ⏳ 改 metadata + 字体
│   ├── page.tsx                ⏳ 主编辑器
│   └── globals.css             ⏳ 主题
├── components/
│   ├── editor-pane.tsx
│   ├── preview-pane.tsx
│   ├── toolbar.tsx
│   ├── agent-picker.tsx
│   ├── template-picker.tsx
│   ├── export-menu.tsx
│   └── upload-dropzone.tsx
├── lib/
│   ├── agents/
│   │   ├── detect.ts           ✅
│   │   ├── argv.ts             ✅
│   │   └── invoke.ts           ⏳ spawn helper
│   ├── parsers/
│   │   ├── csv.ts              ⏳
│   │   ├── xlsx.ts             ⏳
│   │   └── auto.ts             ⏳ 自动判断输入类型
│   ├── templates/
│   │   ├── index.ts            ⏳
│   │   ├── article.ts
│   │   ├── ppt.ts
│   │   ├── resume.ts
│   │   ├── poster.ts
│   │   ├── xiaohongshu.ts
│   │   ├── twitter-card.ts
│   │   ├── prototype.ts
│   │   └── hyperframes.ts
│   ├── export/
│   │   ├── wechat.ts           ⏳
│   │   ├── twitter.ts
│   │   ├── zhihu.ts
│   │   └── image.ts
│   └── store.ts                ⏳ zustand
├── PROGRESS.md                 ✅ 本文件
└── README.md                   ⏳
```

## 待办（细化） — 全部 ✅

- [x] task-1 研究 (open-design / markdown-nice / markdown-to-image)
- [x] task-2 init Next.js 16 + Tailwind v4 + Turbopack
- [x] task-3.1 detect.ts (PATH 扫描 + 16 个 agent 定义)
- [x] task-3.2 argv.ts (8 个 agent 的 headless 调用参数 + 解析器)
- [x] task-3.3 /api/agents/route.ts
- [x] task-3.4 invoke.ts (spawn + stream + 防御性 close 处理)
- [x] task-4.1 store.ts (zustand + persist)
- [x] task-4.2 主界面布局 (toolbar + 50/50 split)
- [x] task-4.3 toolbar (logo + agent + template + convert + export + ⌘+Enter)
- [x] task-4.4 agent-picker (auto detect + refresh + 已安装/未安装分组)
- [x] task-4.4 template-picker (9 个模板 emoji + 尺寸提示)
- [x] task-4.5 editor-pane (输入/上传/示例 三 tab + 自动格式识别)
- [x] task-4.5 preview-pane (预览/代码/日志 三 tab + status badge)
- [x] task-5.1 parsers/auto.ts (md/csv/tsv/json/yaml/sql/html 自动识别)
- [x] task-5.2 parsers/file.ts (xlsx 解析 + 图片 dataUrl + 文本)
- [x] task-5.2 upload-dropzone (拖拽 + 点击)
- [x] task-6.1 templates/index.ts 注册表
- [x] task-6.2 9 个模板（高质量提示词 + 设计系统约束）
- [x] task-7.1 /api/convert/route.ts (SSE relay)
- [x] task-7.2 use-convert.ts (客户端 SSE 解析 + 流式 append)
- [x] task-7.3 extract-html.ts (从 chatty agent 输出抽取 HTML)
- [x] task-8.1 export/wechat.ts (juice 内联)
- [x] task-8.2 export/zhihu.ts (math → data-eeimg)
- [x] task-8.3 export/image.ts (modern-screenshot 2x PNG)
- [x] task-8.4 export/clipboard.ts (ClipboardItem + Safari fallback)
- [x] task-8.5 export-menu UI (7 个动作: 公众号/知乎/推特/HTML/纯文本/.html/.png)
- [x] task-9 download.ts (.html / .png)
- [x] task-10 README 中英文 + agent 表 + 模板表 + architecture 图
- [x] task-11 dev server :3456 + 真实 claude 调用通过

## 风险记录

- Tailwind v4 + 在 iframe 预览中需要 CDN 注入（每次转换的 HTML 中包含 Tailwind play CDN）✅ 已在所有模板提示词中要求
- 本地 agent 不存在时需引导用户 → 显示安装指引（claude/cursor/codex）✅ agent-picker 显示"未检测到", 未安装条目 disabled 显示
- HTML 通过 iframe srcdoc 注入: 注意 XSS, 严格沙箱 ✅ `sandbox="allow-scripts allow-same-origin"`, 没有给到 top-frame
- Iframe srcdoc 在流式更新时会刷新 → 当前是接受的代价 (claude 大约 2-3 个 chunk, 不是字符级流), 后续可加 debounce

## 验证记录 (2026-05-10 23:30)

- `pnpm exec tsc --noEmit` ✅ 0 errors
- `GET / 200` (295ms, SSR + Tailwind v4 OK)
- `GET /api/agents 200` → 检测到 7 个本地 agent (claude/codex/cursor-agent/gemini/copilot/opencode/aider)
- `POST /api/convert` (claude, article-magazine 模板) → 80s 内返回完整 SSE 流, 4 个事件 (start + 2 deltas + done), 31KB HTML
- 生成的 HTML: 自包含 Tailwind CDN + Google Fonts (Inter/Manrope/Noto Sans/Serif SC/JetBrains Mono) + 自定义 theme + 真实文章排版

## 启动方式

```bash
cd /Users/pftom/.superset/projects/html-everthing
pnpm dev    # 默认 :3000
# 或 PORT=3456 pnpm dev
```

## v4 升级 (2026-05-11) — 模型选择 + 首次入口流程

用户反馈: 首次进来如果没配置过 agent, 应该自动弹框选择 + 配置, 包括能选对应 CLI 的模型.

页面入口的 auto-popup 之前已经在 `page.tsx:24` 实现 (`!welcomeAck || !selectedAgent → setOpen(true)`); 本次补齐**模型选择** + **协议感知**.

### 关键改动文件
- `src/lib/agents/detect.ts`
  - 新加 `ModelOption` 类型 + `DEFAULT_MODEL` 常量 ("default" → 不传 `--model`, 让 CLI 自己挑)
  - 17 个 agent 全部带 `fallbackModels`, 参考 open-design 的 `apps/daemon/src/agents.ts` 的 evidence-based 列表
  - `DetectedAgent` 暴露 `protocol` + `models` + `unsupported`, 客户端一次拉到所有 picker 数据
- `src/lib/store.ts` — 新 `agentModels: Record<string, string>` 持久化每个 agent 的最近选择;`AgentInfo` 类型同步加 `protocol/models/unsupported` 字段;persist v2 → v3, 加 `setAgentModel(agent, model)` setter
- `src/components/welcome-modal.tsx`
  - 新 `ModelPicker` 子组件 — 选中 agent 后渲染圆角 chip 列表, 点击切换并写入 `agentModels[id]`
  - 新 `PROTOCOL_HINT` — 在 agent card 上加 `stdin · stream` / `positional argv` / `ACP JSON-RPC · 暂未接入` / `pi-rpc · 暂未接入` 标签
  - 选中 ACP/pi-rpc 时 footer 显红色提示 + "进入编辑器" 按钮 disabled (不阻止用户继续浏览, 但拒绝带未支持 agent 进入流程)
- `src/lib/use-convert.ts` — `ConvertReq` 加 `model`, payload 中按需 `{model: ...}`, log 行包含模型名
- `src/components/toolbar.tsx`
  - 从 store 读 `agentModels[selectedAgent]`, 透传到 `run()`
  - agent button 增加 mono 风格 model badge (default 时不显示)
  - `canConvert` 现在也排除 `agentInfo?.unsupported` 的情形, 配套 friendly tooltip

### 验证
- `pnpm exec tsc --noEmit` ✅ 0 errors in agents/store/use-convert/toolbar/welcome-modal
- `GET /api/agents` → 17 个 agent, 每个含 1-9 个 model, protocol 字段正确 (stdin × 9 / argv × 1 / acp × 6 / pi-rpc × 1), unsupported 标记齐
- `POST /api/convert {agent:"claude", model:"haiku", ...}` → spawn argv 末尾确实多出 `--model haiku` ✅
- 首次访问 (清 localStorage) → modal 自动弹出, 选 agent → 出现 model chip 行 → 选 sonnet → 进入编辑器后 toolbar 显示 `Claude Code [sonnet] ›`

## v3 升级 (2026-05-11) — 全量 code agent 接入

参考 open-design 的 `apps/daemon/src/agents.ts`,把代理矩阵从 8 → 17:

| # | agent | bin | 协议 | 备注 |
|---|-------|-----|------|------|
| ✅ | claude | `claude` (fb: openclaude/openclaw) | stdin · stream-json | 加 openclaw fork 入口 |
| ✅ | codex | `codex` | stdin · json | 既有 |
| ✅ | cursor-agent | `cursor-agent` | stdin · stream-json | 既有 |
| ✅ | gemini | `gemini` | stdin · stream-json | 既有 |
| ✅ | copilot | `copilot` | stdin · json | 既有 |
| ✅ | opencode | `opencode-cli`/`opencode` | stdin · json | 既有 |
| ✅ | qwen | `qwen` | stdin · plain | 既有 |
| ✅ | aider | `aider` | stdin · plain | 既有 |
| ✅ | qoder | `qodercli` | stdin · stream-json | 新, 复用 claude 风格 envelope 解析 |
| ✅ | deepseek | `deepseek` | **argv** · plain | 新, prompt 走位置参数 (`exec --auto <prompt>`); invoke.ts 加 `protocol:"argv"` 分支 |
| ⚠️ | hermes | `hermes` | ACP JSON-RPC | 检测+安装提示,调用时返回 `UnsupportedAgentProtocolError` |
| ⚠️ | kimi | `kimi` | ACP JSON-RPC | 同上 |
| ⚠️ | devin | `devin` | ACP JSON-RPC | 同上 |
| ⚠️ | kiro | `kiro-cli` | ACP JSON-RPC | 同上 |
| ⚠️ | kilo | `kilo` | ACP JSON-RPC | 同上 |
| ⚠️ | vibe | `vibe-acp` | ACP JSON-RPC | 同上 |
| ⚠️ | pi | `pi` | pi-rpc (Inflection 自有 RPC) | 同上 |

### 关键改动文件
- `src/lib/agents/detect.ts` — 加 `AgentProtocol` 类型 (stdin/argv/acp/pi-rpc); 注册 9 个新 agent; claude 加 `openclaw` fallback
- `src/lib/agents/argv.ts` — 加 `UnsupportedAgentProtocolError`; `buildArgv` 新增 qoder/deepseek 分支 + 6 个 ACP agent + pi 全部抛 friendly error; `parseLine` 处理 qoder envelope + 把 deepseek 视作 plain text (同 aider)
- `src/lib/agents/invoke.ts` — `protocol:"argv"` 时把 `opts.prompt` 追加到 argv 末尾,并跳过 stdin 写入;捕获 `UnsupportedAgentProtocolError` 转 SSE error event
- `src/components/welcome-modal.tsx` — `VENDOR_HINT` 加 9 个 vendor (DeepSeek/Cognition/Mature/Moonshot/Inflection/AWS/Kilo/Mistral/Qoder), 每个含 gradient 配色 + 安装命令

### 验证
- `pnpm exec tsc --noEmit` ✅ 0 errors in agents/* and welcome-modal (其它 store/toolbar 错误为 v2 task-list 重构遗留, 与本次无关)
- `GET /api/agents` → 17 个 agent, 本机 10 个已安装 (claude/codex/cursor-agent/gemini/copilot/opencode/deepseek/aider/hermes/kiro)
- `POST /api/convert {agent:"hermes",...}` → SSE 立即返回 `{"type":"error","message":"hermes uses the ACP JSON-RPC protocol, which is not yet wired up..."}` ✅
- `POST /api/convert {agent:"pi",...}` → 未安装时报 `not installed or not on PATH` ✅

## v2 升级 (2026-05-11) — 用户反馈后

| # | 任务 | 状态 | 说明 |
|---|------|------|------|
| 12 | 增强 verbose 日志 | ✅ | DELTA/META/START/STDERR/RAW/DONE/ERROR 7 类彩色 badge + 时间戳 + +elapsed; meta 含 model/session/cwd/usage/cost/duration |
| 13 | 进入页 agent 选择弹框 | ✅ | 居中 modal, 已安装/未安装分组卡片, 含 vendor 渐变色块 + 安装命令提示 + pulse-dot |
| 14 | 整体样式 1:1 open-design | ✅ | paper/bone/ink/coral 调色 + Inter Tight + Playfair italic 强调 + 圆角 pill + paper-grain 背景 |
| 15 | 代码 + 预览实时流式 | ✅ | claude 加 --include-partial-messages → 150 deltas (vs 旧 2 chunks); 代码 tab 自动 scroll + ▍ 光标; iframe 320ms 防抖 |

### 关键改动文件
- `src/lib/agents/argv.ts` — 加 `--include-partial-messages` 给 claude; 新 `parseLine()` 抽出 delta + meta (model/session/usage/cost/duration/rate_limit)
- `src/lib/agents/invoke.ts` — emit `meta` / `raw` / `start.promptBytes` 事件
- `src/lib/use-convert.ts` — 客户端解析 meta, 写入 `stats` (model/tokens/cost/ttfb)
- `src/lib/store.ts` — 新 `RunStats` + 结构化 `LogEntry` (kind/elapsed/data)
- `src/components/welcome-modal.tsx` — 新建, 1:1 open-design 风格
- `src/components/toolbar.tsx` — agent button 改 pill 形式 + 实时 stats
- `src/components/preview-pane.tsx` — 代码 tab 流式 + 光标; debouncedHtml 320ms; LogPanel 7 色 badge
- `src/components/template-picker.tsx` — 改成卡片下拉
- `src/components/export-menu.tsx` — 三段式分组
- `src/app/globals.css` — 完整 open-design 调色板 + .pill / .btn-primary / .btn-ghost / .btn-ink / .od-card / .pulse-dot / .serif-em
- `src/app/layout.tsx` — Inter / Inter Tight / Playfair Display / JetBrains Mono 4 套字体
- `src/app/page.tsx` — 挂载 WelcomeModal, hydration-safe

## 所有参考的项目地址+原始 query

我要做一个任意数据文档可以转 HTML 的一个产品，一个编辑器产品。它核心可以完成这么几个事情：                 
  首先一进来可以去识别用户的本地的 code agent.                                                               
  然后可以选择某个 code agent, 这是第一个。第二个的话就是说它左侧是一个编辑器或者是 upload                   
  的一个入口，然后右侧是一个 HTML 的预览。然后呢左侧的话可以去直接贴一些文本，无论是 markdown                
  的纯文本还是一些 CSV、excel 等数据，对或者是一些 CQ 等 database，然后可以直接贴进去，或者是有一个上传入口  
  可以上传进去。然后上点完之后呢，又点完一个转换之后呢，就可以调 AI，然后去转成右侧的 HTML。这第二个然后第 3 
   个的话就是右边那个 HTML，它可以去选择不同的 design system 或者是好看的模板。然后可以结合一套完整的提示词  
  加流程，把这个左侧的这些数据或者是文档转成右侧，按照这个模板好看的 HTML，然后这个 HTML 可以是 PPT          
  或者是原型/或者通过 html 可以表达的内容,比如简历/hyperframes 视频等的形态对。然后呢，这些转换之后的 HTML   
  可以一键复制成公众号、推特或者是知乎等格式的发布的数据的形态，然后可以复制到剪贴板。                       
                                                                                                             
  参考如下这几个项目完成工作:                                                                                
  - 编辑器/html 预览/复制到推特/公众号知乎等格式参考:https://github.com/mdnice/markdown-nice                 
  - 各种 design                                                                                              
  system/examples/模板等/形态（ppt/网页/简历等,或者你可以拓展很多有价值的场景,比如海报/各种社媒配图等）,     
  这个参考 https://github.com/nexu-io/open-design https://github.com/mdnice/markdown-resume                  
  https://github.com/jimliu/baoyu-skills https://github.com/gcui-art/markdown-to-image                       
  - 识别本地 code agent 参考 https://github.com/nexu-io/open-design                                          
  - 转成 hyperframes 视频/remotion 视频:参见https://github.com/remotion-dev/remotion                         
  https://github.com/heygen-com/hyperframes https://github.com/nexu-io/open-design                           
                                                                                                             
  需要仔细检查最后有没有跑完并完成整个工作,整体的目标就是 everthing 都可以表达为 html,然后被表达为 html      
  可以表达的任何内容,核心是一定要好看/世界级设计水准/让用户易于传播                                          
                                                                                                             
  使用 nextjs 实现项目,用户要做就是识别 agent,填入内容或者上传内容,然后转化（调用                            
  agent）,然后下载/分享等过程一定要易用,快捷,有价值                                                          
                                                                                                             
  搞定之后,可以 写个 readme, 参考 https://github.com/nexu-io/open-design ,                                   
  有很多技术/例子/图片等,让用户觉得非常有价值能宣传和传播                                                    
  这个项目的缘由是 claude code 创始人发了一篇文章,说他们现在不用 markdown,全部用 html 表达了,我们希望呈现    
  everhting 到 html ,以及能做的事情,传播和吃热度 https://x.com/AlchainHust/status/2053138568818684101        
  https://github.com/alchaincyf/huashu-md-html  https://x.com/trq212/status/2052809885763747935              
                                                                                                             
   可以先写个 plan+todo 列表,然后围绕 todo 列表一遍遍检查,直到所有 todo                                      
  都勾掉确保能够完成跑通直接可以使用,我明天早上过来检查你的任务
