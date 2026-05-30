---
name: experiment-readout
zh_name: "实验复盘"
en_name: "Experiment Readout"
emoji: "🧪"
description: "假设 + 指标 + 结果 + 解释 + 决策, 把 A/B 或产品实验转成行动建议"
category: data
scenario: product
aspect_hint: "产品实验报告"
featured: 8
tags: ["experiment", "ab-test", "growth", "product", "data", "实验", "复盘"]
example_id: sample-experiment-readout
example_name: "实验复盘 · Onboarding Checklist"
example_format: markdown
example_tagline: "不是展示数据, 而是判断上线/停止/继续"
example_desc: "把实验假设、样本、指标和结果转成产品决策报告。"
---

【模板: 实验复盘 / Experiment Readout】
【意图】这不是普通数据报告、不是 dashboard。目标是回答: "这个实验说明了什么, 我们下一步应该上线、停止、继续跑, 还是重新设计?"

【适合输入】
- A/B test、增长实验、定价实验、onboarding 改版、功能灰度、邮件实验
- 可以是 markdown、CSV、表格粘贴或混合记录

【必须输出的结构】
1. Header: 实验名称、owner、日期、实验状态、decision。
2. Hypothesis: 原始假设, 必须改写成可验证句式。
3. Setup: audience、variant、duration、sample size、primary metric、guardrail metrics。
4. Result snapshot: primary metric lift、absolute delta、sample、confidence / caveat。
5. Metric table: Control vs Variant, primary + secondary + guardrail。
6. Interpretation: 解释结果为什么发生, 区分 signal、noise、unknown。
7. Decision: Ship / iterate / extend / stop 四选一, 并给理由。
8. Follow-up experiments: 2-4 个下一步实验, 每个包含 hypothesis、expected impact、effort。
9. Instrumentation notes: 数据缺口、埋点问题、样本偏差。

【设计要求】
- 产品数据团队风格: 清楚、可信、行动导向。
- 首屏必须有大号 decision badge 和 primary metric delta。
- 图表可以用 CSS/SVG/Chart.js; 如果用 Chart.js, canvas 外层必须固定高度。
- 不要把结果包装得过度确定; 小样本或缺少显著性时必须明确 caveat。

【可选风格模板 — 参考 assets/】
根据实验语境选择一种, 不要三种混用:
- `assets/product-readout.html`: 默认风格。浅色产品实验复盘, 适合 PM / growth / leadership readout。
- `assets/lab-notebook.html`: 研究实验室 notebook, 适合 early-stage experiment、定性 + 定量混合、需要保留 caveat 的探索实验。
- `assets/growth-console.html`: 深色 growth analytics console, 适合增长团队、实时指标、漏斗 / activation / conversion readout。

如果用户没有指定风格, 优先使用 `product-readout`; 如果材料强调研究过程和不确定性, 使用 `lab-notebook`; 如果材料强调增长指标、漏斗、实时监控或运营节奏, 使用 `growth-console`。

【内容真实性】
- 只使用用户提供的数据。不要捏造 p-value、confidence、样本量。
- 如果没有统计显著性信息, 用 "directional" / "inconclusive" / "needs more data" 表达。
