# 为 HTML Anything 贡献代码

谢谢你愿意贡献。HTML Anything 是一个故意保持小的项目 —— 大部分价值都在**文件**里（skill 文件夹、提示词片段、agent adapter），而不在框架代码里。回报率最高的贡献，通常是一个文件夹、一个 Markdown 文件，或者十行 adapter。

这份指南告诉你：每种贡献该放在哪个目录，PR 在合并前要过哪些线。

<p align="center"><a href="CONTRIBUTING.md">English</a> · <b>简体中文</b></p>

---

## 一个下午就能交付的三件事

| 你想做什么 | 你其实是在加 | 文件位置 | 体积 |
|---|---|---|---|
| 让 HTML Anything 渲染一种新作品（发票、招聘启事、iOS 设置页…） | 一个 **Skill** | [`src/lib/templates/skills/<your-skill>/`](src/lib/templates/skills/) | 一个文件夹，约 3 个文件 |
| 接入一个新的 coding-agent CLI | 一个 **Agent adapter** | [`src/lib/agents/argv.ts`](src/lib/agents/argv.ts) + [`src/lib/agents/detect.ts`](src/lib/agents/detect.ts) | 一个数组里加 10 行 |
| 加一个新的发布目标（视频号、抖音字幕、Notion …） | 一个 **Export adapter** | [`src/components/drafts-menu.tsx`](src/components/drafts-menu.tsx) + `src/lib/export/` 下的 helper | 一个组件 + 一个 helper |
| 加功能、修 bug、重构流式 parser | 代码 | `src/app/`, `src/lib/`, `src/components/` | 常规 PR |
| 改文档、把某一段翻译到另一种语言、修错别字 | 文档 | `README.md`, `README.zh-CN.md`, 本文 | 一个 PR |

不确定自己的想法属于哪一类？[先开个 issue](https://github.com/nexu-io/html-anything/issues/new)，我们帮你定位到对应的目录。

---

## 本地开发

```bash
git clone https://github.com/nexu-io/html-anything.git
cd html-anything
pnpm install
pnpm dev                  # next dev — http://localhost:3000
pnpm build                # next build，发布前验包
```

Node `~20` 与 `pnpm` 是硬要求。macOS、Linux、WSL2 是主路径；纯 Windows 应该能跑，但不是主要目标 —— 跑不通请提 issue。

push 之前请确保你**至少有一个 coding-agent CLI 登录好了**（`claude login`、`cursor login`、`gemini auth` …），这样才能跑端到端生成。涉及流式或 agent 层的 PR，期望附上截图或日志片段，证明它真的跑通了。

> **关于项目形态的说明。** 这是一个普通的 Next.js 16 App Router 项目 —— 没有 daemon、没有 Electron 壳、没有别的常驻进程。所有事都在 `next dev` 里完成：server route 直接 spawn 本地 CLI，把 stdout 作为 SSE 流回浏览器，浏览器 append 进 iframe `srcdoc`。如果你打算引入一个独立的长期进程，**请先开 discussion**。

---

## 加一个新的 Skill

skill 是 [`src/lib/templates/skills/`](src/lib/templates/skills/) 下的一个文件夹，根目录有 `SKILL.md`，遵循 Claude Code 的 [`SKILL.md` 约定][skill] + 我们的扩展 frontmatter（picker 会读这部分）。**不需要在任何地方注册。** 把文件夹放进去，重启 `pnpm dev`，picker 里就出现了。

### Skill 目录结构

```text
src/lib/templates/skills/your-skill/
├── SKILL.md            # 必需 —— 提示词正文 + frontmatter
├── example.html        # 必需 —— 你希望 agent 产出什么样的成品，手写一份
├── assets/             # 可选 —— 字体、图片、可复用 CSS、布局片段
└── references/         # 可选 —— 设计系统片段、agent 应该 Read 的参考资料
```

### `SKILL.md` 写法

```markdown
---
name: your-skill
description: picker 预览里显示的一句话简介。
mode: prototype          # prototype | deck | frame | social | office | doc | mockup | vfx
scenario: marketing      # design | marketing | engineering | product | finance | hr | sale | personal
surface: desktop         # desktop | mobile | A4 | 1080x1920 | 1600x900 | 1920x1080 | …
preview:
  type: iframe           # iframe | image | deck
  thumbnail: docs/screenshots/skills/your-skill.png   # 可选，README 精选示例网格会用
design_system:
  requires: optional     # required | optional | none
featured: false          # 想登上 "精选示例" 就置 true
example_prompt: |
  三句话的示例 prompt，演示这个 skill 接受什么样的输入。
---

# Your Skill

<一段话写清身份 / 纪律 —— 声音、意图、agent 必须遵守什么>

## 硬约束
- 8 px 基线网格 · 所有间距 / line-height / 字号都是 8 的倍数。
- 中文字体栈：`"Noto Sans SC", "PingFang SC", "Source Han Sans"`；英文：`"Inter", "Manrope"`。
- 颜色对比 ≥ 4.5。每个可交互元素都有真实 `:focus` 态。
- 必须使用用户提供的真实数据。禁止 `lorem ipsum`、禁止编造指标、禁止紫色渐变。

## 版式

<结构 / 区块 / 层级，用具体 token —— 尺寸、比例、命名插槽 —— 不要用空泛的审美词>

## "好" 长什么样
- <一句正面例子>
- <再一句>

## "坏" 长什么样
- <一句反面例子，对应反 AI-slop 黑名单>
- <再一句>
```

### Skill PR 合并标准

1. **文件夹里附真实 `example.html`。** 手写一份 —— agent 才有 target 可抄。没附的 PR 直接打回。
2. **`example.html` 能在浏览器里渲染**（`pnpm dev` → 选这个 skill → ⌘+Enter → 截图）。截图附 PR。
3. **硬约束写得具体。** "用现代字体" 不是约束。真正的约束长这样："Inter 96 / 64 / 40 / 24 / 16 px 字号梯度，8px 网格，每页最多两个字重"。
4. **example 里不许有 `lorem ipsum`**。要用占位数据，也得是看起来像真的占位数据。
5. **slug 用小写 + 连字符** —— `deck-swiss-international`、`social-x-post-card`。和已有的 75 个文件夹保持一致。
6. **vendor 进来的作品，必须保留原始 `LICENSE` 和署名**。比如 [`src/lib/templates/skills/deck-guizang-editorial/`](src/lib/templates/skills/deck-guizang-editorial/) 完整保留了 op7418 的 LICENSE 和署名。

### picker 分组规则

picker 用两个维度组织 skill。**优先用已有的取值**，只有当你的 skill 真的不适合任何已有值时才引入新值：

- **`mode`** —— `prototype` · `deck` · `frame` · `social` · `office` · `doc` · `mockup` · `vfx`
- **`scenario`** —— `design` · `marketing` · `engineering` · `product` · `finance` · `hr` · `sale` · `personal`

---

## 加一个新的 coding-agent CLI

接入新 agent（比如某家的 `foo-coder` CLI），就在 [`src/lib/agents/argv.ts`](src/lib/agents/argv.ts) 加一行：

```ts
{
  id: 'foo',
  name: 'Foo Coder',
  bin: 'foo',
  detect: { args: ['--version'] },
  build: (prompt: string) => ({
    args: ['exec', '-p', prompt],
    stdin: null,                     // 如果 CLI 走 stdin，写 'prompt'
  }),
  stream: 'plain',                   // 'plain' | 'json-event' | 'claude-stream-json'
}
```

完事。`/api/agents` 会在 `PATH` 上扫到它，顶栏 picker 会出现，chat 流程走同一条 SSE 管道。如果这个 CLI 输出**有类型的事件**（比如 Claude Code 的 `--output-format stream-json`），在 [`src/lib/agents/invoke.ts`](src/lib/agents/invoke.ts) 加 parser，把 `stream` 设成 `'claude-stream-json'`。

### Agent adapter PR 合并标准

1. **端到端跑通过一次真实 session。** `pnpm dev` 起服，选你接入的 agent，用任一 skill 的 `example_prompt` 生成一次，把 SSE 日志贴在 PR 描述里。
2. **`PATH` 检测在 macOS / Linux / WSL 都能找到。** 扫描器已经包含 `~/.local/bin` · `~/.bun/bin` · `/opt/homebrew/bin` · `~/.npm-global/bin`；如果你的 CLI 装在别处，把目录加进扫描列表。
3. **README 的 "Supported coding agents" 表格加一行**，`README.md` 和 `README.zh-CN.md` 都改。
4. **stream parser 复用。** 如果新 CLI 输出和已有 adapter 形状一致，请共用 parser，不要 fork。

---

## 加一个新的发布目标

发布目标分两块：`src/lib/export/` 下的 helper 负责产出字节（`.html` 的字符串、`.png` 的 Blob、粘贴的 `ClipboardItem`），[`src/components/drafts-menu.tsx`](src/components/drafts-menu.tsx) 里加一个菜单项把它接进 UI。

### Export PR 合并标准

1. **目标平台往返测试。** 把产物粘 / 上传到目标平台（公众号编辑器、X 输入框、知乎编辑器），把结果截图贴 PR。
2. **代码里不许有平台凭证。** 需要 API Key 的话，让用户在 settings 里填，仓库不许内置。
3. **产物自包含。** `.html` 用 `juice` 内联 CSS；PNG 用 `modern-screenshot` 走 2× DPR。

---

## 代码风格

我们对格式不严苛（Prettier on save 就够），但有两条不商量，因为它们直接出现在 prompt 栈和对外 API 里：

1. **TS/TSX 用单引号。** 除非转义太丑，否则字符串一律单引号。仓库已经全员一致 —— 请保持。
2. **代码注释一律英文。** 即使你这个 PR 是把某段翻成中文，**代码注释**也保持英文，方便整库 grep。

此外：

- **不要复读。** `// import the module`、`// loop through items` 之类的注释是噪音。只在代码无法表达的"为什么"上写注释。
- **`src/` 下用 TypeScript。** 没特别理由不要新增顶层 `.js` 文件。
- **新增顶层依赖**要在 PR 描述里写一段"我们得到了什么 vs 我们打包多了多少字节"。[`package.json`](package.json) 的依赖列表是有意保持小的。
- **push 前跑一次 `pnpm build`**。类型错会卡 merge。

---

## Commit & PR 规范

- **一个 PR 一件事。** 加一个 skill + 重构 SSE parser + 升一个依赖 = 三个 PR。
- **标题用祈使句 + scope。** `add deck-product-launch skill`、`fix SSE backpressure when CLI hangs`、`docs: clarify skill frontmatter`。
- **正文写"为什么"。** "做了什么"通常 diff 一看就懂；"为什么要做"很少看得出来。
- **挂关联 issue。** 没有 issue 但 PR 又不小？请先开一个，约好这件事值得做之后再写代码。
- **review 期间不要 squash。** 用 fixup commit；merge 时我们会 squash。
- **不要 force-push 共享分支**，除非 reviewer 让你做。

我们不强制 CLA。Apache-2.0 已经覆盖；你的贡献以同一份协议授权。

---

## 报 bug

开 issue 时请附：

- 你跑的命令（确切的 `pnpm dev` 调用，或者你点的 UI 按钮）。
- 选的是哪个 agent CLI（Claude Code? Cursor Agent? …）。
- 触发的是哪个 skill。
- 相关的 **server 日志尾部** —— "artifact 没有渲染出来"这类问题，看到 `spawn ENOENT` 或者 CLI 的真实错误，通常 30 秒就能诊断。
- 如果是 UI 问题，附截图。

prompt 栈相关的 bug（"agent 输出了紫色渐变 hero，`SKILL.md` 里明明禁止了"），请把**完整的 assistant message** 贴进来，方便判断是模型违规还是 prompt 写漏了。

---

## 提问

- 架构问题、设计问题、"这算 bug 还是误用" → [GitHub Discussions](https://github.com/nexu-io/html-anything/discussions)（首选 —— 下一个遇到同样问题的人能搜到）。
- "怎么写一个做 X 的 skill" → 开 discussion。我们回答之后，如果这是一个新的 pattern，会把答案沉淀进这份文档。

---

## 我们不接受的 PR

为了让项目保持聚焦，请不要提以下 PR：

- **内置模型 runtime。** 这个项目押注的就是"你已经有的 CLI 就够了"。不内置 `pi-ai`、不内置 OpenAI key、不内置 model loader、不内置托管推理 proxy。
- **未经讨论就把前端栈换掉。** Next.js 16 App Router + React 19 + Tailwind v4 + TypeScript 是底线。不要换 Astro / Solid / Svelte 等等，除非维护者明确想做这次迁移。
- **把 SSE 流式换成 WebSocket / 长轮询。** SSE + iframe `srcdoc` append 是最简单能做到实时渲染的方案，我们保留它。
- **加 telemetry / analytics / phone-home。** 项目是 local-first。唯一的对外调用是你笔记本上的 agent CLI，以及生成出来的 HTML 自己引用的资源（Tailwind CDN、Google Fonts）。
- **打包二进制**但不附 LICENSE 与署名。
- **加一个 skill，但 `example.html` 是空的 / 占位的 / 一眼模型批量糊出来没审过。** skill 的价值靠 example 撑；空 example 直接打回。

不确定自己的想法合不合适？写代码之前先开 discussion。

---

## 多语言维护

仓库以 parity 方式维护两种语言：英文（`README.md`、`CONTRIBUTING.md`）与简体中文（`README.zh-CN.md`、`CONTRIBUTING.zh-CN.md`）。新增 / 改名 skill、agent、export 目标时：

- **两份 README 的表格都要更新。**
- 如果你的改动引入了新的贡献入口或新的合并标准，**两份 CONTRIBUTING 都要同步**。
- **Skill 提示词正文保持源语言。** 不要翻译 `SKILL.md` —— 它是给 agent 读的 prompt 栈的一部分，保持单一源语言能避免提示词 QA 跨语言膨胀。
- server 错误消息、文件名、agent 生成的产物文本都是已知短板，除非 PR 明确把它们纳入改动范围。

---

## License

参与贡献即代表你同意：你的贡献以本仓库的 [Apache-2.0 License](LICENSE) 授权。

vendor 进来的第三方作品保留**原始** LICENSE 与署名 —— 每个 `src/lib/templates/skills/<skill>/` 文件夹里的 `LICENSE` / `README.md` 以它为准。最明显的例子是 [`src/lib/templates/skills/deck-guizang-editorial/`](src/lib/templates/skills/deck-guizang-editorial/)，完整保留了 [op7418](https://github.com/op7418) 的原始 LICENSE 与署名。

[skill]: https://docs.anthropic.com/en/docs/claude-code/skills
