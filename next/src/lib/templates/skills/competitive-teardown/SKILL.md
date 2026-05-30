---
name: competitive-teardown
zh_name: "竞品拆解"
en_name: "Competitive Teardown"
emoji: "🧩"
description: "定位图 + 功能矩阵 + 价格对比 + 机会窗口, 把竞品资料转成产品决策报告"
category: doc
scenario: product
aspect_hint: "战略长页面"
featured: 8
tags: ["competitive", "teardown", "strategy", "product", "竞品", "拆解"]
example_id: sample-competitive-teardown
example_name: "竞品拆解 · AI Meeting Assistants"
example_format: markdown
example_tagline: "比较矩阵 + 定位象限 + 我们的应对"
example_desc: "把三家竞品的定位、价格、功能、评价转成产品团队可行动的拆解报告。"
---

【模板: 竞品拆解 / Competitive Teardown】
【意图】这不是文章、不是 PRD、不是 pitch deck。目标是把多个竞品的杂乱资料转成一份可决策的产品战略报告, 帮团队回答: "我们和它们到底差在哪里, 下一步该怎么打?"

【适合输入】
- 竞品官网 / 定价页 / changelog / 用户评论 / 销售反馈 / 内部调研笔记
- 2-6 个竞品最合适; 如果用户只给一个竞品, 输出单竞品 deep dive
- 可以包含表格、bullet、链接摘录、访谈记录、截图说明

【必须输出的结构】
1. Header: 市场 / 产品类别 / 报告日期 / 结论一句话。
2. Executive takeaway: 3 条最重要判断, 每条必须包含 "so what"。
3. Positioning map: 用 2×2 象限或坐标图表现竞品定位。坐标轴必须来自用户内容, 不要套模板词。
4. Competitor cards: 每个竞品一张卡, 包含 target user、core promise、pricing signal、primary strength、visible weakness。
5. Feature matrix: 行是关键能力, 列是竞品 + "Us / Opportunity"; 用 ✓ / △ / — 表达覆盖度, 并用短注释说明。
6. Pricing / packaging read: 价格层级、免费试用、限制项、企业销售动作。
7. UX / messaging notes: 从用户材料中抽取 4-6 条可观察细节, 不要泛泛而谈。
8. Opportunity windows: 3 个机会窗口, 每个包含 why now、target segment、first move、risk。
9. Recommended moves: 近期 30 天 / 90 天 / 180 天行动建议。

【设计要求】
- 战略咨询 + 产品战情室风格: 信息密度高、扫描快、图表清楚。
- 使用 restrained palette: ink / paper / muted blue / signal amber 或类似专业色。
- Feature matrix 必须横向可读; 小屏可变成 stacked cards。
- 不要做成营销落地页, 不要做成普通文章。

【可选风格模板 — 参考 assets/】
根据用户内容选择最贴合的一种, 不要三种混用:
- `assets/war-room-grid.html`: 默认风格。浅色战情室 / 咨询报告, 适合产品团队、PM、普通商业读者。
- `assets/radar-map.html`: 深色雷达图 / market intelligence console, 适合安全、AI、开发者工具、平台型竞品。
- `assets/analyst-dossier.html`: 纸质分析档案 / investment research dossier, 适合投研、行业分析、正式战略备忘。

如果用户没有指定风格, 优先使用 `war-room-grid`; 如果输入强调市场格局、技术雷达、攻防态势, 使用 `radar-map`; 如果输入像研究笔记、投资备忘或行业报告, 使用 `analyst-dossier`。

【内容真实性】
- 只使用用户提供的竞品、价格、功能、评论。缺失信息用 "not found in source" 或 "unknown" 标注。
- 不要发明市场份额、ARR、客户名、定价数字。
- 如果用户资料明显不足, 仍然输出报告, 但在 "Evidence gaps" 中列出缺口。
