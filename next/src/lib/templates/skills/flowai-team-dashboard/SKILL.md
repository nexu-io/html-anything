---
name: flowai-team-dashboard
zh_name: "FlowAI 团队管理"
en_name: "FlowAI Team Dashboard"
emoji: "🌊"
description: "三个 tab 的团队管理后台: 成员、详情、活动日志, 含图表 + CSV 导出"
category: dashboard
scenario: operations
aspect_hint: "桌面 1440"
tags: ["flowai", "team", "members"]
---

【模板: FlowAI 团队管理 Dashboard】
【意图】FlowAI 美学的团队管理 admin 单页。
【布局】
- Tabs: Team Members / Team Details / Activity Log
- KPI stat row
- Member table (avatar + 角色 + 状态)
- Role distribution bar chart
- Online presence + activity sparklines
- Top contributors panel
【设计细节】
- light/dark 切换, hover tooltip, click-to-zoom panels
- CSV export 按钮 (前端实现)
