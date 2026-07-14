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

【sidebar / TOC 链接 — 硬性 CSS 要求】
- 任何用于侧边栏 / 目录的链接类 (如 \`.nav-link\` / \`.sidebar-link\` / \`.toc-link\`, 自命名亦同)
  必须显式带 \`display: block\` (或 Tailwind \`block\` 工具类)。
- \`<a>\` 默认是 inline, \`space-y-*\` 等纵向间距工具对 inline 元素**无效** — 不加 \`display: block\`
  会让导航项塌成一行连续文字, 而不是纵向列表。
- 优先做法: 给链接直接挂 Tailwind \`block\` (或 \`flex items-center\`), 不要只在自定义 class 里
  写 padding/border-radius 却忘了 display。
