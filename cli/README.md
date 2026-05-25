# html-anything CLI

从命令行直接将 Markdown（或纯文本/CSV/JSON）转换为精美排版的 HTML 文件，无需打开网页界面。

## 安装

```bash
# 1. 进入项目目录，安装依赖
cd html-anything
pnpm install

# 2. 构建 CLI
pnpm -F @html-anything/cli build
```

### 全局安装（可选）

构建完成后，可以创建全局链接：

```bash
# 在 cli 目录下创建全局链接
cd cli
npm link

# 之后可以在任意目录使用
html-anything --help
```

或者将以下别名添加到 `~/.zshrc` 或 `~/.bashrc`：

```bash
alias html-anything="node /path/to/html-anything/cli/dist/run.js"
```

## 快速开始

### 1. 设置默认模板（推荐）

```bash
# 查看所有可用模板
html-anything templates

# 设置一个默认模板，之后 convert 时无需每次都指定
html-anything config set-default-template doc-kami-parchment
```

### 2. 转换 Markdown 文件

```bash
# 自动匹配模板（推荐：无需手动选模板）
html-anything auto article.md

# 仅查看匹配结果，不执行转换
html-anything auto article.md --show-match-only

# 使用默认模板转换（自动保存为 article.html）
html-anything convert article.md

# 批量转换多个文件
html-anything convert file1.md file2.md file3.md -d ./dist

# 保存到指定文件
html-anything convert article.md -o output.html

# 指定自动保存目录
html-anything convert article.md -d ./dist

# 指定模板
html-anything convert article.md -t resume-modern

# 指定 AI agent
html-anything convert article.md -a claude --model sonnet

# 从标准输入读取（输出到 stdout）
cat article.md | html-anything convert -o page.html
```

### 3. 查看生成结果

```bash
# 用浏览器打开生成的 HTML
open output.html
```

## 命令详解

### `convert` / `auto` — 转换内容

两个命令共享以下通用参数：

| 参数 | 简写 | 说明 | 默认值 |
|------|------|------|--------|
| `input` | — | 输入文件路径，省略则从 stdin 读取 | stdin |
| `--agent <id>` | `-a` | AI agent ID | 自动检测第一个可用 agent |
| `--output <path>` | `-o` | 输出文件路径 | 自动保存为 `<输入文件名>.html`，stdin 输入时输出到 stdout |
| `--output-dir <dir>` | `-d` | 自动保存目录 | 当前目录 |
| `--model <id>` | — | 使用的模型 | agent 默认模型 |
| `--format <type>` | — | 输入格式：markdown, text, csv, json | markdown |

#### `convert` — 指定模板转换

```bash
html-anything convert [input] [options]
```

用户明确指定模板 ID 来转换内容。

| 参数 | 简写 | 说明 | 默认值 |
|------|------|------|--------|
| `--template <id>` | `-t` | 模板 ID | 配置中的 default-template |

#### `auto` — 自动匹配模板并转换

```bash
html-anything auto [input] [options]
```

无需手动选择模板，CLI 自动分析内容主题，从 75 个模板中匹配最合适的模板，然后执行转换。

| 参数 | 简写 | 说明 | 默认值 |
|------|------|------|--------|
| `--force-ai` | — | 跳过关键词匹配，强制使用 AI summary | — |
| `--show-match-only` | — | 仅显示匹配结果，不执行转换 | — |

### `templates` — 列出模板

```bash
html-anything templates
```

列出所有 75 个可用模板，按类别分组显示。已设为默认的模板会标记 `(default)`。

### `agents` — 列出 Agent

```bash
html-anything agents
```

列出系统中已安装的 AI agent CLI。`✓` 表示可用，`✗` 表示未安装。

### `config` — 配置管理

```bash
html-anything config                          # 查看当前配置
html-anything config set-default-template <id>  # 设置默认模板
html-anything config set-default-agent <id>     # 设置默认 agent
html-anything config set-model <id>             # 设置默认模型
html-anything config reset                      # 重置所有配置
```

配置文件位于 `~/.config/html-anything/config.json`。

## 支持的 AI Agent

html-anything 本身不做 AI 生成，它会自动检测并调用你系统里已安装的 AI CLI 工具（任意一个即可）来完成转换。支持的 AI CLI：

| Agent | 安装方式 |
|-------|----------|
| Claude Code | `npm install -g @anthropic-ai/claude-code` |
| OpenAI Codex | `npm install -g @openai/codex` |
| Cursor Agent | 安装 Cursor 编辑器后可用 |
| Gemini CLI | `npm install -g @google/gemini-cli` |
| GitHub Copilot CLI | `npm install -g @github/copilot-cli` |
| OpenCode | `npm install -g @open/open-cli` |
| Qwen Coder | `npm install -g @alibaba/qwen-coder` |
| CodeWhale | `npm install -g codewhale` |
| DeepSeek TUI | `npm install -g deepseek-tui` |
| Aider | `pip install aider-chat` |
| OpenClaw | 参考官方文档安装 |

## 常用模板推荐

| 模板 ID | 名称 | 适用场景 |
|---------|------|----------|
| `doc-kami-parchment` | Kami 羊皮纸文档 | 长文、报告、one-pager |
| `resume-modern` | 极简简历 | A4 单页简历 |
| `deck-swiss-international` | 瑞士国际主义 Deck | 演示文稿 |
| `deck-guizang-editorial` | 贵赞编辑墨水 Deck | 杂志风 PPT |
| `magazine-poster` | 杂志风海报 | 海报、宣传单页 |
| `blog-post` | 博客长文 | 技术博客 |
| `data-report` | 数据可视化报告 | 数据分析报告 |
| `card-xiaohongshu` | 小红书图文卡片 | 社交媒体图文 |
| `prototype-web` | Web 产品原型 | 产品原型 |
| `saas-landing` | SaaS Landing | 产品落地页 |

## 完整使用示例

```bash
# 1. 首次使用：查看有哪些模板
html-anything templates

# 2. 设置你最喜欢的模板为默认
html-anything config set-default-template doc-kami-parchment

# 3. 写一篇 Markdown 文章
cat > my-article.md << 'EOF'
# 我的项目总结

## 背景
这是一个关于...

## 成果
- 完成了 A 功能
- 优化了 B 模块

## 下一步
我们计划在 Q3 完成...
EOF

# 4. 一键自动匹配模板并转换（推荐）
html-anything auto my-article.md

# 5. 在浏览器中查看结果
open my-article.html

# 6. 如果只想看匹配结果
html-anything auto my-article.md --show-match-only

# 7. 如果想换个风格
html-anything convert my-article.md -t blog-post -o my-article-v2.html

# 8. 保存到指定目录
html-anything convert my-article.md -d ./output
```

## 开发

```bash
# 开发模式（无需构建，直接运行 TypeScript）
pnpm -F @html-anything/cli dev -- templates

# 类型检查
pnpm -F @html-anything/cli typecheck

# 构建
pnpm -F @html-anything/cli build
```

## 工作原理

### `convert` 命令流程

1. **模板加载**：从 `next/src/lib/templates/skills/` 加载 75 个 SKILL 模板，每个模板包含视觉风格定义和排版规则
2. **Prompt 拼接**：将全局设计指令 + 模板专属规则 + 用户内容拼接成一个完整的 AI prompt
3. **Agent 调用**：调用本地安装的 AI agent CLI（如 Claude Code），让 AI 根据 prompt 生成 HTML
4. **HTML 提取**：从 agent 的流式输出中提取完整的 HTML 文档
5. **输出**：将 HTML 写入文件或打印到 stdout

### `auto` 命令流程

```
用户内容
    │
    ▼
┌─────────────────────────┐
│ 第一层：强信号关键词匹配   │  ← 零 token，毫秒级
│ 命中 → 直接使用匹配模板    │
│ (简历→resume-modern 等)  │
└──────────┬──────────────┘
           │ 未命中
           ▼
┌─────────────────────────┐
│ 第二层：规则打分匹配       │  ← 零 token，毫秒级
│ 内容 × 全部模板 metadata  │
│ (tags + name + desc +    │
│  scenario keywords)      │
│ 置信度 ≥ 阈值 → 使用      │
└──────────┬──────────────┘
           │ 置信度不足
           ▼
┌─────────────────────────┐
│ 第三层：AI Summary 兜底   │  ← 仅在规则失配时
│ 提取内容前 800 字         │
│ → AI 判断主题类型         │
│ → 再次规则匹配            │
└──────────┬──────────────┘
           │
           ▼
       执行转换
```

**匹配策略说明**：
- **强信号**（~80 条规则）：覆盖简历、定价、OKR、PRD、周报等高频场景，命中即定
- **规则打分**：遍历所有模板的 tags、名称、描述、场景关键词，累加得分
- **AI 兜底**：内容 ≥ 60 字且前两层均低置信度时，调用 AI 做一句话主题摘要，仅消耗极少量 token
- **最终兜底**：若所有层均失败，回退到 `deck-swiss-international` 通用模板

整个过程完全本地运行，不依赖任何外部 API key，使用你已有的 agent 订阅。转换过程中会显示动画进度指示器，展示已接收的文本块数和耗时。