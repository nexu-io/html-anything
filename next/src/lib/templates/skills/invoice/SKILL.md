---
name: invoice
zh_name: "可打印发票"
en_name: "Printable Invoice"
emoji: "🧾"
description: "标准发票: 寄件/收件 + 明细 + 税 + 总额 + 付款指引"
category: finance
scenario: finance
aspect_hint: "A4"
recommended: 13
tags: ["invoice", "bill", "发票"]
---

【模板: 可打印发票】
【意图】A4 可打印的发票单页。
【布局】
- Header: 发票号 / 日期 / 截止日
- From / Bill to 两块
- Line items table (描述 / 数量 / 单价 / 金额)
- Tax breakdown + Totals (右对齐)
- Payment instructions 区
【设计细节】
- @media print 样式; 颜色对比保留
