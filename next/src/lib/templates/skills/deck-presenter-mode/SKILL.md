---
name: deck-presenter-mode
zh_name: "演讲者模式 Deck"
en_name: "Presenter Mode Deck"
emoji: "🎤"
description: "tokyo-night 默认主题, T 切换 5 主题, S 打开提词器 popup"
category: slides
scenario: engineering
aspect_hint: "16:9"
featured: 26
tags: ["presenter", "notes", "提词", "teleprompter"]
---

【模板: Presenter Mode Deck】
【意图】怕忘词的演讲者专用 deck, 含逐字稿 notes 与 popup teleprompter。
【布局】
- 每页 + `<aside class="notes">` 150-300 字稿
- 右下小 toolbar: T 切主题 / S 打开 popup
- Popup: CURRENT / NEXT / SCRIPT / TIMER 四张磁吸卡
【设计细节】
- 默认 tokyo-night; 共 5 套主题 (含 light)
