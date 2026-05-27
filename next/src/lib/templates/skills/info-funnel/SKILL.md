---
name: info-funnel
zh_name: "漏斗信息图"
en_name: "Funnel Infographic"
emoji: "🪣"
description: "3-6 阶递减漏斗, 突出转化率 / 筛选比例 / 流量损耗。竖图适合 IG Story / 小红书"
category: data
scenario: marketing
aspect_hint: "1080×1920 (9:16) 竖屏"
tags: ["funnel", "conversion", "漏斗", "转化率", "marketing", "infographic", "social", "story"]
example_id: sample-info-funnel-saas
example_name: "漏斗信息图 · SaaS 注册转化"
example_format: markdown
example_tagline: "5 阶 · 米白 + Klein Blue · 大数字 + 转化率"
example_desc: "访客 → 注册 → 试用 → 付费 → 留存 5 步漏斗, 左侧绝对数右侧阶段转化率, 底部累计漏出洞察"
example_source_url: "https://github.com/JimLiu/baoyu-skills#baoyu-infographic"
example_source_label: "baoyu-skills · infographic/funnel"
---

【模板: 漏斗信息图（Funnel Infographic）】

【意图】把"从大到小"的转化 / 筛选 / 损耗过程一眼看清。**宽顶（输入）→ 窄底（结果）**, 每一阶有明确的"剩多少"和"漏多少"。典型场景：marketing funnel（曝光→点击→注册→付费）、招聘漏斗（投递→面试→录用→入职）、决策漏斗（候选→筛选→敲定）。

【数据形态】

输入应是有序的 **3-6 个阶段** + 每阶的绝对数值（人数 / 件数 / 金额）。可选每阶名称、说明、单位。若用户只给了百分比, 默认顶端 = 100% / 10000 人。

```
阶段 1: 100,000 名访客
阶段 2:  18,500 名注册（18.5%）
阶段 3:   6,200 名启动试用（33.5%）
阶段 4:   1,450 名转付费（23.4%）
阶段 5:     920 名 30 天留存（63.4%）
```

【布局规则】

| 区域 | 内容 | 占比 |
|---|---|---|
| **Hero 顶部**（约 15%） | 标题（≤ 20 字, 22-32px CJK）+ 副标题 / 时间窗口（灰色 14-16px） | 上 15% |
| **漏斗主体**（约 65%） | 3-6 个梯形 stage, 每段含：左大数字（48-72px tabular-nums）+ 右阶段名（18-22px bold）+ 右二行说明（13-15px 灰）+ 段间小箭头标转化率 | 中 65% |
| **底部 stat strip**（约 20%） | 累计转化率（最大字号 80-120px）+ 1-2 句洞察文本（漏出最严重的环节 / 关键提示） | 下 20% |

【漏斗实现】

用 **CSS `clip-path: polygon()`** 切梯形, 不用 SVG：
- 每段 stage 是一个 `<div>`, 设固定 height（120-200px）+ 不同 clip-path
- clip-path 的左右收缩量 = 50% × `(1 - bottom_width_ratio)`, 累计每段比上一段窄
- 每段背景色用同一 hue 不同 lightness, 顶端最饱和, 底端最深（accent → ink）
- 阶段之间有 4-8px gap, 让"流动"感更明显
- 数字用 `font-variant-numeric: tabular-nums`, letter-spacing `-0.02em`

【主题色 — 三选一, 不许混】

| 主题 | 适用 | 顶端 | 底端 | ink | paper |
|---|---|---|---|---|---|
| **klein-blue**（默认） | 商业 / SaaS / AI 产品 | `#4F7BD8` | `#002FA7` | `#0A0A0A` | `#FAFAF8` |
| **sunset-amber** | 零售 / 消费 / 餐饮 | `#FBB040` | `#C73E1D` | `#0A0A0A` | `#FFF8EC` |
| **deep-forest** | 招聘 / 教育 / 健康 | `#56A06E` | `#1F4D2E` | `#0A0A0A` | `#F4F0E6` |

文字色：
- 漏斗内部数字与名字一律白色（`#FFFFFF`）
- 顶端 / 副标题 / 底部 strip 用 ink（`#0A0A0A`）
- 灰色辅助文字：`rgba(10,10,10,0.55)`

【字体栈】

```
"PingFang SC", "Heiti SC", "Helvetica Neue", "Arial", -apple-system, sans-serif
```

数字（tabular-nums 必须）：
```
"SF Mono", "JetBrains Mono", "Menlo", "Roboto Mono", monospace
```

**禁用 Inter** —— 它太"AI 默认味"。优先 PingFang SC（CJK）+ Helvetica Neue（拉丁）。

【字号 / 间距锁死】

- 主标题：`clamp(28px, 2.8vw, 36px)` font-weight 800 letter-spacing `-0.02em`
- 副标题：`14-16px` font-weight 500 ink/0.6
- 段内大数字：`clamp(48px, 5.5vw, 72px)` tabular-nums font-weight 900 white
- 段内阶段名：`20-22px` font-weight 700 white
- 段内说明：`13-15px` font-weight 400 white/0.85
- 段间转化率徽章：`13px` font-weight 700, paper 底 ink 字, 圆角 6px, padding 2px 8px
- 底部累计大数字：`clamp(80px, 12vw, 120px)` font-weight 900 ink letter-spacing `-0.04em`
- 底部洞察：`16-18px` font-weight 500 ink/0.75 max-width 80%
- 整体 padding：`6vmin 7vmin`
- 段间 gap：`6px`
- Hero 与漏斗之间 gap：`32-48px`
- 漏斗与 strip 之间 gap：`48-64px`

【输出契约】

输出**单文件 HTML**, inline CSS, **不写 JS**（静态图）。**不外链 CDN / 图标库 / 字体文件**。
- 不放图标 / 不用 emoji 装饰（漏斗本身就是图）
- 不放图表（饼图 / 柱状图）—— 一篇一个漏斗
- 不放公司 logo
- background 是 paper, 整张图占满 viewport
- 用 `aspect-ratio: 9 / 16` 锁定容器, 内容用 flex column 填充

【数据规范】

- 顶端数 = 100% 基准
- 每阶转化率 = `当前段 / 上一段`
- 累计转化率 = `末段 / 顶段`
- 数字千分位用半角逗号（10,000 不要 10000）
- 百分比保留 1 位小数（18.5% 不要 18.50% 也不要 19%）
- 单位（人 / 件 / $）放在数字后, 13-15px 灰色
- 编绝对数比写百分比更有说服力（"少了 81,500 人"比"漏掉 81.5%"更扎心）

【洞察文本（底部 strip）】

写 **1-2 句**, 总长 ≤ 60 字：
- 第一句：累计数字 + 评价（"100,000 个访客中, 只剩 920 个真正留下"）
- 第二句（可选）：指出最大漏出环节（"最大流失在『访客→注册』, 81.5% 在第一步就走了"）

禁止 AI 文案腔（"通过本图表可以看出"、"由此可见"、"综上所述"）。直接说事实。

【分阶段视觉宽度计算】

5 阶时, top_width=100%, bottom_width=30%（漏斗收口）。每段 bottom_width 比上一段窄 `(100-30)/5 = 14%`。例如：
- Stage 1: top 100% → bottom 86%
- Stage 2: top 86% → bottom 72%
- Stage 3: top 72% → bottom 58%
- Stage 4: top 58% → bottom 44%
- Stage 5: top 44% → bottom 30%

clip-path 公式（每段独立 div）：
```css
clip-path: polygon(
  {(100-top)/2}% 0%,
  {100-(100-top)/2}% 0%,
  {100-(100-bottom)/2}% 100%,
  {(100-bottom)/2}% 100%
);
```

3-4 阶时收口可以放宽到 `40-45%`, 6 阶时压到 `22-25%`。

【禁区】
- 不要在漏斗段内画图标 / 插画
- 不要把数字放在段右、名字放在左（要左数字 / 右名字, 形成视觉重力）
- 不要让段高度跟数值挂钩（这是 funnel 不是 H-bar chart, 信息密度靠宽度收缩传达）
- 不要让漏斗居中悬浮——它该填满中段, 顶部贴 Hero, 底部贴 strip
- 不要超过 6 阶（信息过载, 拆成两张图）
- 不要 3D / 阴影 / 发光（platine 干净版式）
- 不要 Inter 字体（见上）
- 不要写"以下是漏斗"、"如下图所示"之类的 meta 文字

【致谢】
本 skill 设计参考 [baoyu-skills · baoyu-infographic](https://github.com/JimLiu/baoyu-skills) 的 funnel layout 规范, 视觉补完 + HTML 实现由 html-anything 独立编写。
