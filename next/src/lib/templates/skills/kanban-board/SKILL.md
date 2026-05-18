---
name: kanban-board
zh_name: "看板 / Kanban"
en_name: "Kanban Board"
emoji: "📌"
description: "To do / In progress / In review / Done 四列, 卡片 + 头像 + 泳道"
category: dashboard
scenario: operations
aspect_hint: "桌面 1440"
tags: ["kanban", "trello", "sprint", "看板"]
---

【模板: Kanban 看板】
【意图】类 Trello 的 Kanban 单页。
【布局】
- 顶部 filter bar (assignee / label / search)
- 4 列: To do / In progress / In review / Done
- 卡片含: 标题 / labels / due / avatar / 评论数
- 可选 swimlanes (按 epic / assignee 分组)
【设计细节】
- 不需要真 drag, 但视觉上要像可拖
