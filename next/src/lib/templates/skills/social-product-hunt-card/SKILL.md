---
name: social-product-hunt-card
zh_name: "Product Hunt 头版报"
en_name: "Product Hunt Front-Page"
emoji: "📰"
description: "把 launch 当天 #1 排成一份周日早报 front page —— Playfair serif + 纸感 + 砖红 accent, 不是橙色 SaaS 卡, 是一份"今日已发生"的头版"
category: card
scenario: marketing
aspect_hint: "1200×630 (OG / Twitter card)"
tags: ["product-hunt", "launch", "newsprint", "editorial", "front-page", "og-image"]
example_id: sample-social-product-hunt-card
example_name: "Product Hunt Times · 头版报 · #1 of the day"
example_format: markdown
example_tagline: "纸感 + 巨型 Playfair + 报纸 byline"
example_desc: "一份'PRODUCT HUNT TIMES'周日头版: 巨型 serif headline + 编辑数字 upvote + hunter byline + 中点分隔 topics"
---

【模板: Product Hunt 头版报 / Front-Page】
【意图】把一款产品在 Product Hunt #1 launch 当天的瞬间, 渲染成一份周日早报的 **front page** —— 不是橙色 SaaS 卡片, 不是 dashboard 截图, 而是一份"今日已发生"的报纸头版。用于:
- 上 PH 当天发推 / 朋友圈 / LinkedIn 的"晒榜"图 (替代千篇一律的 PH 截图)
- 项目首页 OG 图 / hero 区
- 产品落地页"as featured on PH"区块
- 给"我们在 PH 上线"邮件做插图

【设计签名 — 不许跑偏】
> 灵感不是 producthunt.com 的 UI, 而是 *The New York Times* 周日版头版 + Playfair 编辑封面 + Anthropic 暖纸文档的合体。"Today's launch, framed like front-page news."

【画布】1200×630 OG 比例; 卡片 1120×550 居中, 四周 40px 安全边距; 也支持 1280×720 (按上下文)。

【颜色 — 5 token, 严禁多色】
- **Paper** `#f3eee2` —— 暖奶油底 (永远不用纯白 `#fff`)。
- **Ink** `#1f1c17` —— 主文字 (近黑暖灰, 不用纯黑)。
- **Muted** `#6e6a5d` —— 副文字 / kicker / byline。
- **Rule** `#d3cdbe` —— 1px hairline (报纸分栏线 / 表格 / 边)。
- **Accent (砖红橙)** `#c2492c` —— 介于 PH 招牌橙 `#DA552F` 和编辑砖红 `#b85a3a` 之间, 保留 PH 品牌识别但不刺眼; 仅用于: ① 头版报头的 ★ ornament  ② upvote 数字  ③ ▲ 上箭头 glyph  ④ "#1" 数字描边。**禁止**用作大色块 / 背景 / pill 填色。

【字体 — 三族严格分工】
- **Display 衬线**: `Playfair Display` (英) / `Noto Serif SC` (中); weight 500-700; 仅用于头版 headline (8-10vw) + 大数字。
- **Lede 斜体衬线**: `Playfair Display Italic`; 仅用于副标题 lede (2 行内)。
- **Body / kicker / byline 无衬线**: `Inter` 400-600; kicker 11px uppercase letterspacing 0.16em。
- **数字 / metric / folio**: `JetBrains Mono` 400-600, 启用 `font-feature-settings:'tnum'`。
- **绝不**: 多种衬线混用; sans 用作 hero headline; 圆体字 (Comic / Quicksand / Nunito 那种)。

【排版规则 — newspaper conventions, 不许变】
- **顶部 masthead 报头** (高 56px): 左 `★` ornament (砖红, inline SVG) + 报头 wordmark `PRODUCT HUNT TIMES` (Playfair 700, 16px, letter-spacing 0.04em); 中央 `VOL. XII · MAY 14, 2026 · #1 EDITION` (mono uppercase 11px, 灰); 右一颗 PH 猫头 logo (砖红, 22×22 SVG, 用作品牌锚点)。下沿一道 1px Rule + 紧贴一条 4px 粗 Ink 实线 (双线报头, 报纸标准)。
- **kicker 行** (在 headline 上方): `MAKER OPINION ·· LAUNCH DAY ·· #1 PRODUCT OF THE DAY` (mono 11px uppercase, letterspacing 0.18em, 灰)。`#1` 用 Accent 色, 其余灰。
- **Hero headline**: 产品名 / 或一句标语 (如 "Markdown is dead. Long live HTML."), Playfair Display 700, `clamp(56px, 8vw, 96px)`, 行高 0.95, 左对齐, 含 1 个 italic 词强调 (e.g. "*HTML*"); 长度上限 60 字符。
- **Lede**: Playfair Display **Italic** 400, 22-26px, 行高 1.35, 灰 `#3f3a30`, 最多 2 行, 是产品 tagline 的"编辑改写", 不是直接搬。
- **Hairline rule**: 1px Rule, 全宽; 上下各空 14px。
- **主体两栏 grid (3:5)**:
  - **左栏 (statistics block)**: 三段编辑数字, 每段 2 行
    - 第一段: 巨型 upvote `847` (Playfair 500, 80px, 紧贴 ▲ Accent 三角); 下一行 `UPVOTES · 8 HOURS` (mono uppercase 10px, 灰)
    - 第二段: `32` (Playfair 500, 44px) + `COMMENTS` (mono uppercase 10px)
    - 第三段: `12.3K` + `VIEWS`
    - 三段之间 1px Rule 横向分隔
  - **右栏 (editorial)**:
    - kicker `HUNTER'S NOTE` (mono 11px uppercase 灰)
    - **Pull-quote** (Playfair Italic 400, 19-22px, 行高 1.4): "Just tried it — the SSE streaming into a sandboxed iframe is exactly the missing piece." 含开闭引号字符 “ ” (真引号, 不是 ASCII `"`)
    - byline em-dash `— @trq212` (Inter 500, 13px, Accent 色)
    - 一道短 hairline (60px 宽, 不到边)
    - kicker `FILED UNDER` (mono 11px)
    - topic 行: `Developer Tools · Open Source · Artificial Intelligence` (Inter 500 14px, 中点 `·` 灰色, topic 名 Ink 色, **不要 pill / 圆角 / bg**)
- **底部 byline footer 报底** (高 ~56px, bg paper-tint `#ece5d3`, 顶部 1px Rule):
  - 左侧 `HUNTED BY` (mono uppercase 10px, 灰) + `@nexudotio` (Inter 600 13px, Ink) + 一颗砖红 `★` ornament + `MAKER` (mono uppercase 10px, 描边方框, 内 padding 2/6, 1px Rule 边)
  - 右侧 `JOINED BY 32 MAKERS · 12 COUNTRIES · LIVE NOW` (mono uppercase 10px, 灰); `LIVE NOW` 加 Accent 色 + 左侧 6×6 blink 圆点。

【纸感 / 质感细节】
- 卡片 bg 上叠一层 dot pattern: `radial-gradient(circle, rgba(31,28,23,0.06) 1px, transparent 1.4px) 0 0 / 16px 16px`。
- 卡片本体不要 box-shadow; 只许一层 hairline outline `outline: 1px solid #d3cdbe; outline-offset: -1px`。**禁止** drop-shadow / blur / 多层 shadow。
- 任何分栏线、边、表格线一律 1px Rule; 唯一例外是报头双线下的 4px Ink 粗线。
- 不许圆角 ≥ 4px (报头 ornament 例外)。
- 不许渐变背景。仅允许"叠在 paper 上的 dot pattern"。

【内容生成规则】
- 产品名 / tagline / topics / hunter / 评论文本 **必须从【用户内容】抽取**; 没给的字段才生成 plausible 占位。
- 数字: 当天 #1 上 PH 通常 600-1500 upvotes, 25-80 comments, 5-30K views; 不要给 50 也不要给 50K。
- Headline ≠ tagline。Headline 是"编辑视角的一句话宣言" (e.g. tagline "Your local agent writes HTML" → headline "Markdown is dead. Long live *HTML*."). 含 1 个 italic 强调词。
- Lede 是 tagline 的扩写, 编辑口吻, **不要营销文案**, **不要感叹号**, **不要"Welcome!"/"Excited to share!"** 这种社媒用语。
- Pull-quote 来源是 hunter / commenter, 用真引号 “ ”, 一句话, ≤ 100 字符。
- 严禁 `lorem ipsum`; 严禁 `Product Name` / `Your Tagline Here` / `[Description]` 这种占位。

【代码规则】
- 单文件 HTML, Tailwind CDN, Google Fonts (Playfair Display + Inter + JetBrains Mono + Noto Serif SC + Noto Sans SC)。
- 所有 ornament / icon (★ / ▲ / PH 猫头 / blink dot) 内联 SVG, 严禁外链 icon font / 图片。
- 数字行启用 `font-variant-numeric: tabular-nums`。
- HTML 第一字符必须是 `<`, 最后必须是 `</html>`; 不要 markdown 围栏 / 解释文字。
- 不许用 Write / Edit 工具落盘, 直接流式输出。

【设计准则】
- "Front page, not feed item." 这是周日早报头版, 不是 producthunt.com 的卡片。
- "Calm brick, not loud orange." Accent 砖红橙仅出现在 ornament / 上箭头 / "#1" / "LIVE NOW" 圆点 ≤ 5 处, 其它一切是 paper / ink / muted 中性。
- "Editorial weight, not marketing energy." 排版让人感到"这件事是被记录下来的, 不是被吆喝出来的"。
- "One italic per page." 全页只允许一个 italic 词放在 headline 里, 一个 italic 段落放在 pull-quote, 不要到处斜体。
