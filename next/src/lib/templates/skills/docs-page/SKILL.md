---
name: docs-page
zh_name: "技术文档页"
en_name: "Docs Page"
emoji: "📘"
description: "三栏文档页: 侧导航 + 正文 + 右 TOC"
category: doc
scenario: engineering
aspect_hint: "桌面 1440"
tags: ["docs", "api", "tutorial", "guide"]
---

【模板: 技术文档页】
【意图】API / 教程文档单页, 长读体验优先。
【布局】
- Inline-start nav (sections + sticky)
- Article body (含代码块, callouts, 表格)
- Inline-end TOC (sticky, scroll-spy)
- 顶栏 search + version + 主题切换
【设计细节】
- 代码块: 圆角 + dark + 语言标签 + 复制按钮
- callout: info / warn / danger 三色
