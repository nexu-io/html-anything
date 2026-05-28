---
name: article-sketchnote-editorial
zh_name: "编辑式视觉笔记"
en_name: "Editorial Sketchnote"
emoji: "📒"
description: "把一个概念铸成杂志专题档案——真问题→失败→转折→顿悟→命名, 6 个 layout 模具 + 4 字族对比 + 探案档案细节"
category: article
scenario: education
aspect_hint: "1080 × 自适应（竖向长图）"
tags: ["sketchnote", "magazine", "editorial", "档案", "杂志", "视觉笔记", "narrative", "叙事", "concept-history", "概念史"]
example_id: sample-sketchnote-emergence
example_name: "视觉笔记 · 涌现的命名"
example_format: markdown
example_tagline: "还原论失败 → Anderson 1972"
example_desc: "一段以「涌现」为终点的概念史专题, 6 个 layout 节奏 = 开阔→紧→紧→爆→开阔→静"
example_source_url: "https://github.com/lijigang/ljg-skills/tree/master/skills/ljg-card"
example_source_label: "lijigang/ljg-skills · ljg-card"
---

【模板: 编辑式视觉笔记（Editorial Sketchnote）】

【灵魂】把一个**概念**铸成一份编辑式图文档案。读者翻它像翻一本期刊专题——从真问题（专题刊头）→ 失败的尝试（便签批注、档案标签）→ 一句"等等——"的转折（跨栏大标题）→ 看见那个东西（Hero 对开页）→ 名字（Closing 名牌）。

**不是博物馆陈列, 是杂志栏目。不是教科书定义, 是探案档案。** 视觉与叙事一起负责, 让读者自己经历"卡住—走不通—翻过去—看见了"的弧线。文字克制, 不点题。

【六条公理 — 任一不过, 重做】

1. **有真问题在前** — 起点是具体的、可触摸的、卡住的问题。不是「什么是 X」, 是「当时的人们用 A、B、C 都不够」。问题必须有裂缝。
2. **必须有失败** — 路径中至少一次失败（或走偏、半对了）。线性"由此可得"会杀掉张力。
3. **顿悟在前、命名在后** — 读者先「看到」, 再被告诉「这叫……」。**标题不能出现概念名**。
4. **「现在」视角** — 每一站是「他/她那一刻能看到什么」, 不是「我们站在 100 年后回望」。后世评价不进画面。
5. **文字克制, 不点题** — 禁用「你以为你刚才学到了一个概念」「你重新分娩了它」之类的元自指。让叙事张力自己产生发明感。允许诗意余韵（"于是, 你看见了山"）。
6. **中文母语表达** — 不要翻译腔。动词驱动 / 具体物件 / 口语节奏。禁忌："被 X""进行 X""在...的背景下""随着 X 的发展""该方法在多个维度上展现优势"。

【六个 layout 模具 — 节奏锁死】

每站必须用**不同的** layout, 节奏才出现：

| 序 | 站点 | class | 视觉特征 |
|---|---|---|---|
| 01 | 起点 / Feature | `.feature` | 米色底 + grid 6fr/6fr, 左大 SVG 图 / 右文字; kicker + Serif 大标题 + italic lead + drop-cap body |
| 02 | 失败一 / Note | `.note` | 双栏 grid（左 sidekick 涂鸦区 + 右 540px 便签纸）; 便签微旋 0.5deg + 顶部虚线穿孔 + 红笔删除线 + scribble + footnote ¹ |
| 03 | 失败二 / Archive | `.archive` | 全宽 + 黑色印章 stamp（168px, 含 ✕ 大字）+ 右栏 body + SVG 网格图 + verdict 红色 italic |
| 04 | 转折 / Cross | `.cross` | 全宽 + Serif 200px **由内容决定的转折爆点**（禁套「等等」）+ amber 高亮 + 二栏 |
| 05 | 顿悟 / Hero | `.hero` | 蓝色顶边 4px + grid 7fr/5fr; 左大 SVG / 右 pull-quote + drop-cap body |
| 06 | 命名 / Closing | `.closing` | 米色底 + 双线顶边 + 中心对称 + 巨大 Serif 名 + byline 上下细线 + epilogue |

**节奏铁律**: 开阔（feature）→ 紧（note 错位）→ 紧（archive 横长）→ 爆（cross 200px）→ 开阔（hero）→ 静（closing 中心对称）。不是均匀展开, 是有呼吸的——开阔与紧凑交替, 转折时大爆炸, 最后回到中心对称。

**禁区**：6 个节都是 60-80px margin-top 的均匀间距 = 画廊陈列, 不是漫画分镜, 重排。

【字族对比 — 必须四种同时使用】

- **Serif** (`Noto Serif SC`)：杂志主标题、mega-name、italic lead、pull-quote
- **Sans** (`Noto Sans SC`)：正文 body-sans、failed station head、kicker 后文字
- **Mono** (`JetBrains Mono` / `SF Mono`)：编号 num、kicker label、byline、footnote ¹、stamp
- **Hand** (`Caveat` / 楷体)：手写批注 scribble、ask 设问、caption

**任一缺席 = 视觉回到 AI 单一字族的均质感, 灵魂崩**。

【颜色系统 — ≤4 主色】

```
--bg:          #FAF7EF   /* 暖米白底 */
--paper:       #F5F1E5   /* 米色卡（feature/closing 底）*/
--ink-strong:  #0F0F0F   /* 重要文字, 避免 #000 */
--ink:         #1F1F1F   /* body */
--ink-light:   #6B6B6B   /* kicker, caption */
--red:         #B23A2C   /* 错误、批注、强调 */
--blue-deep:   #3D5A80   /* 顿悟视觉 */
--amber:       #BB8A2B   /* 转折提示 */
--amber-soft:  #D7A85A   /* 高亮底色 */
```

**禁止 `#000` 纯黑**。≤ 4 主色（红 + 蓝 + amber + 中性）。

【必备装饰结构件】

`kicker / drop-cap / byline / stamp` 是结构必须项。其它按需取用：

- **kicker** — 站点序号 + 类型小字：Mono uppercase 13px + 黑底白字 num 方块 + 36px 短横线
- **drop-cap** — body 首字：`::first-letter` float left, 96px Serif
- **lead** — feature 引言：italic 23px Serif + 红色左边线 2px
- **pull-quote** — hero 关键句：italic 38px Serif + 蓝色边线 4px + 浮动 `\201C` 大引号 100px
- **strike** — failed body 删除关键词：`text-decoration: line-through` 红色 2.5px
- **scribble** — note 红笔批注：Caveat 24px + 6deg 旋转 + 红色 + 虚线红边框
- **stamp** — archive 失败印章：黑底白字 12px Mono + ✕ Serif 64px
- **verdict** — archive 结案语：italic 19px Serif 红色 + 上虚线分隔
- **footnote** — note 脚注：Mono 13px + ¹ 上标
- **byline** — closing 出处：Mono 14px uppercase + letter-spacing 0.18em + 上下细黑线
- **mega** — cross 转折爆点：Serif 200px + amber 渐变高亮（核心字 1-3 个）
- **epilogue** — closing 余韵：italic 26px Serif + `—` 红色破折号前缀

【sidekick 涂鸦区 — note 模具左栏不能空】

三种填法（按内容选, 不要堆满）：
- **SVG 速写** — 失败本质能用 1-2 个图形姿态画出来 → `<svg viewBox="0 0 280 220">` 简笔画 + 红笔批注
- **手写公式** (`.formula`) — 失败本质能压成 1-3 行文字关系 → Caveat 22px + 虚线左边线 + 微旋 -1deg
- **箭头评注** (`.arrow`) — 单点强调 → Caveat 26px + 微旋 6deg + 红色

**约束**：sidekick 是注脚不抢戏 / 涂鸦感优先精致（歪斜、虚线、留缝隙）/ 颜色克制（黑灰 + 红）/ 内容密度低（宁可少不要塞三个图）。

【HTML 骨架（agent 复用结构, 内容由叙事弧线决定）】

```html
<div class="magazine-head">
  <div class="top-bar">
    <div class="left"><span class="badge">№ 01</span><span>[领域 · 年份]</span></div>
    <div class="right">[ENGLISH CATEGORY]</div>
  </div>
  <h1>[不剧透标题]<br>[第二行可选]</h1>
  <p class="deck">[italic 引言: 暗示问题但不揭示答案]</p>
</div>

<section class="feature">
  <div class="visual"><svg>[SVG 大图, max-width 540]</svg></div>
  <div class="meta">
    <div class="kicker"><span class="num">01</span><span class="rule"></span>起点 · [时空锚点]</div>
    <h2 class="head-serif">[卡住的问题]</h2>
    <p class="lead">[一句简洁领题]</p>
    <div class="body-sans drop-cap"><p>[具体例子]</p><p>[关键转折用 <em></em> 强调]</p><span class="ask">[开放设问？]</span></div>
  </div>
</section>

<aside class="note">
  <div class="sidekick">
    <!-- 三选一: SVG / .formula / .arrow + 可选 .doodle-caption -->
  </div>
  <div class="paper">
    <div class="kicker"><span class="num">02</span>第一次尝试</div>
    <h3 class="head-sans">[动作名]</h3>
    <div class="body-serif"><p>[思路]</p><p>失败用 <span class="strike">删除线</span></p></div>
    <div class="footnote"><span class="mark">¹</span><span>[根本原因]</span></div>
    <div class="scribble">[一句红笔批注]</div>
  </div>
</aside>

<section class="archive">
  <div class="stamp"><div class="label">EX-02</div><div class="x">✕</div><div class="case">Failed</div></div>
  <div class="body-area">
    <div class="kicker"><span>第二次尝试</span></div>
    <h3 class="head-sans">[动作名]</h3>
    <div class="visual"><svg>[失败示意]</svg></div>
    <div class="body-serif"><p>[思路 + 失败]</p></div>
    <div class="verdict">[结案语]</div>
  </div>
</section>

<section class="cross">
  <h2 class="mega"><span class="em">[转折爆点 1-3 字]</span>[可选后缀]</h2>
  <div class="grid">
    <div class="left">
      <div class="kicker"><span class="num">04</span>转折</div>
      <div class="body-serif"><p>[反向陈述]</p></div>
      <span class="ask">[转折设问？]</span>
    </div>
    <div class="right"><svg>[反向姿态]</svg><p class="caption">[caption]</p></div>
  </div>
</section>

<section class="hero">
  <div class="layout">
    <div class="visual"><svg>[大幅 hero 图]</svg><p class="caption">[caption]</p></div>
    <div class="text">
      <div class="kicker"><span class="num">05</span>顿悟</div>
      <h2 class="head-serif">[姿态名, 不出现概念名]</h2>
      <div class="pull-quote">[核心句子]</div>
      <div class="body-serif drop-cap"><p>[洞察的具体表述]</p></div>
    </div>
  </div>
</section>

<section class="closing">
  <p class="approach">[这种 X 的研究对象, 叫——]</p>
  <h1 class="mega-name">[中文概念名]</h1>
  <div class="en-name">[English Name]</div>
  <div class="byline"><span><strong>[人名]</strong></span><span class="sep">·</span><span>[年份]</span><span class="sep">·</span><span>[文献]</span></div>
  <div class="closing-body"><p>[它打开了什么]</p><p>[它换了什么眼睛]</p></div>
  <p class="epilogue">[诗意余韵, 不元自指]</p>
</section>
```

**字号与节奏 padding 对照**：

| section | padding 上 / 下 | margin-top | 留白尺度 |
|---|---|---|---|
| feature | 38 / 44 | — | 中 |
| note | 22 / 22 | 24 | 小 |
| archive | 22 / 24 | 24 | 小 |
| cross | 64 / 60 | 30 | 大 |
| hero | 52 / 48 | 32 | 中偏小 |
| closing | 60 / 64 | 32 | 大 |

参考完整 CSS 见同目录 `example.html`（每个 class 都已实现）。

【输出契约】

输出**单文件 HTML**, inline CSS + Google Fonts CDN（Noto Serif SC / Noto Sans SC / Caveat / JetBrains Mono）。不写 JS, 静态长图。容器宽 1080px, 高度自适应。

【自检 6 项 — 任一不过, 重做】

1. **问题站**: 标题没出现概念名 / 问题具体可触摸 / "他/她那一刻"视角
2. **失败站**: 至少 1 次失败 / 失败有线索（删除线 / verdict / footnote）
3. **顿悟前命名后**: 命名只在 closing / hero 标题不剧透
4. **文字克制**: 没有"你以为你刚才……"自指句式
5. **中文母语**: 没有"被 X""进行 X""随着 X 的发展"等翻译腔
6. **节奏不均匀**: 6 节 margin-top 不全等 / 留白集中在 cross 与 closing

【禁区】
- 标题不能出现概念名（剧透）
- 不要把图标 / emoji 当装饰
- 不要 #000 纯黑
- 不要居中所有标题（feature/note/archive 左对齐 / cross/closing 才居中）
- 不要让 6 节 padding 一致
- 不要 Inter 字体
- 不要点题元自指
- sidekick 不能空

【致谢】
本 skill 改编自 [lijigang/ljg-skills · ljg-card -v sketchnote](https://github.com/lijigang/ljg-skills/tree/master/skills/ljg-card)（v2.3.0）。原版输出 PNG（playwright 截图）, html-anything 版直接输出单文件 HTML, 6 公理 + 6 layout + 4 字族 + 节奏与原版一致。
