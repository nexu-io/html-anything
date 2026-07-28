# Design OS 端到端真实测试

> 2026-07-28 · 真实 claude sonnet 生成 · 非 mock

## 任务

为 **Taskflow 2.0**（虚构任务管理工具）做 dark mode 发布公告 landing page，使用 **Linear DESIGN.md**（dark-mode-first，紫色 accent）。

- **输入内容**：Taskflow 2.0 dark mode 更新（OLED 黑、智能跟随系统、键盘快捷键、120fps）
- **设计系统**：`linear-app` DESIGN.md（来自 open-design 150 系统库）
- **Skill**：`saas-landing`
- **Agent**：Claude Sonnet（本地 CLI，html-anything spawn）
- **管线**：`/api/discovery` → DESIGN.md loader/adapter → `/api/convert`（SSE spawn）→ `/api/critique`（5-dim 品质门）

## 产物

- [`taskflow-linear-dark-mode.html`](./taskflow-linear-dark-mode.html) — 53,326 字符，双击可开
- 真实 SSE 流：24,213 events

## 验证结果

### 1. Prompt 注入层 ✅

assemblePrompt 构造的 9,563 字符 prompt，Linear 的 24 个 token 全部注入：

```
:root {
  --marketing-black: #08090a;   ← OLED 画布
  --brand-indigo: #5e6ad2;      ← Linear 招牌紫色
  --accent-violet: #7170ff;     ← 交互 accent
  --primary-text: #f7f8f8;      ← 近白正文
  --border-subtle: rgba(255,255,255,0.05);  ← 半透明边框
  ...
}
```

外加 anti-slop P0 规则（禁 indigo #6366f1 / 禁 emoji / CJK 字体栈）。

### 2. 生成产出 — Linear 设计语言真实落地 ✅

| 检查项 | 结果 |
|---|---|
| 暗色背景 (`#08090a` / `#0f1011` / `#191a1b`) | ✅ |
| Linear 紫色 accent (`#5e6ad2` / `#7170ff` / `#828fff`) | ✅ |
| Inter 字体 | ✅ |
| 半透明白边框 `rgba(255,255,255,0.0x)` | ✅ |
| Tailwind CDN | ✅ |
| **anti-slop: indigo `#6366f1`** | ✅ 干净 |
| **anti-slop: emoji 功能图标** | ✅ 干净 |
| **anti-slop: lorem ipsum** | ✅ 干净 |
| **anti-slop: 纯黑 `#000` 背景** | ✅ 干净 |

**0 条 slop 违规。** DESIGN.md 的精确 token 不是被 agent "参考"——是被 agent **执行**。

### 3. 5-dim 品质门 ✅

```
philosophy  : 8/10    hierarchy   : 8/10
execution   : 8/10    specificity : 9/10
restraint   : 4/10    ← 唯一短板
─────────────────────────
TOTAL       : 37/50   PASS: True   slop 违规: 0
```

### critique 改进建议（精准 + 有深度）

1. **收敛强调色**（restraint 扣分原因）——紫色从"焦点强调"变成了"全场环境色"，应降级为仅主 CTA + OLED 对比面板的辉光用。
2. **文案事实核查**——H2 写"像素真正的关闭"，但画布是 `#08090a`（非纯黑），OLED 只有纯 `#000000` 才真正熄灭像素。正文反而诚实。**这是连设计师都容易漏的事实一致性。**
3. **CSS 冗余清理**——`:root` 有三组重复变量声明；`--quaternary-text` `#62666d` 偏暗，建议提亮。

## 这证明了什么

三体融合（open-design DESIGN.md + huashu-design 反 slop + html-anything 运行时）的价值被实证：

1. **open-design 的 150 DESIGN.md 精确规范**——24 个 hex token + 字体栈真实出现在 agent 产出里。不是 prompt 里的文字描述，是 `:root` 里可执行的 token 合约。
2. **huashu-design 的反 slop 纪律**——0 违规产出。规则从"prompt 建议"升级为"代码约束"（lintHtml 扫产出）。
3. **品质门能抓深度问题**——critique 不只是泛泛打分，能发现"像素关闭"这类文案事实错误。

如果用户点"按建议重试"，第 1 条（restraint 收敛）和第 2 条（文案事实）会作为 `critiqueFeedback` 注入 `/api/convert`，agent 修正后重跑——这就是 critique→retry 闭环。

## 复现

```bash
# dev server (html-anything on p2-design-os branch)
PORT=3456 pnpm -F @html-anything/next dev

# 真实生成（Linear DESIGN.md + saas-landing skill）
curl -N http://127.0.0.1:3456/api/convert \
  -H "Content-Type: application/json" \
  -d '{"agent":"claude","model":"sonnet","templateId":"saas-landing","designSystemId":"linear-app","content":"...","format":"text"}'

# 品质门
curl -N http://127.0.0.1:3456/api/critique \
  -H "Content-Type: application/json" \
  -d '{"agent":"claude","model":"default","html":"<生成的 HTML>"}'
```

要求 `C:/Users/13466/open-design/design-systems/` 存在（loader 从那里读 DESIGN.md）。
