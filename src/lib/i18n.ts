/**
 * Tiny i18n layer. Keeps a flat key → string map per locale and exposes a
 * `useT()` hook that reads the active locale from the zustand store. Adding
 * a new locale = add a new dictionary at the bottom of this file and
 * register it in `DICTS`. The `Dict` interface keeps the build honest:
 * if you forget a key the TS check breaks rather than the UI silently
 * falling back to English.
 */

"use client";

import { useStore, type Locale } from "@/lib/store";

export interface Dict {
  // Brand
  "brand.subtitle": string;

  // Toolbar
  "toolbar.selectAgent": string;
  "toolbar.switchAgent": string;
  "toolbar.settings": string;
  "toolbar.stop": string;
  "toolbar.convert": string;
  "toolbar.firstSelectAgent": string;
  "toolbar.unsupportedProtocol": string;
  "toolbar.enterContent": string;
  "toolbar.shortcutHint": string;
  "convertChip.label": string;
  "convertChip.tooltip": string;
  "aiPrompt.placeholder": string;
  "aiPrompt.submit": string;
  "aiPrompt.stop": string;
  "aiPrompt.needAgent": string;
  "aiPrompt.hint": string;

  // Layout mode toggle
  "layout.aria.group": string;
  "layout.label.editor": string;
  "layout.label.split": string;
  "layout.label.preview": string;
  "layout.tip.editor": string;
  "layout.tip.split": string;
  "layout.tip.preview": string;

  // Welcome modal
  "welcome.eyebrow": string;
  "welcome.titlePart1": string;
  "welcome.titleAccent": string;
  "welcome.description": string;
  "welcome.rescan": string;
  "welcome.scanning": string;
  "welcome.rescanTitle": string;
  "welcome.detectionFailed": string;
  "welcome.installed": string;
  "welcome.notInstalled": string;
  "welcome.noAgentsTitle": string;
  "welcome.noAgentsBody": string;
  "welcome.later": string;
  "welcome.enter": string;
  "welcome.current": string;
  "welcome.unsupportedHint": string;
  "welcome.pickInstalled": string;
  "welcome.enterTooltip.noAgent": string;
  "welcome.enterTooltip.unsupported": string;
  "welcome.enterTooltip.ok": string;

  // Model picker
  "model.eyebrow": string;
  "model.label": string;
  "model.defaultHint.prefix": string;
  "model.defaultHint.suffix": string;
  "model.defaultLabel": string;

  // Agent card
  "agent.selected": string;
  "agent.notInstalled": string;
  "protocol.stdin": string;
  "protocol.argv": string;
  "protocol.argvMessage": string;
  "protocol.acp": string;
  "protocol.piRpc": string;

  // Settings modal
  "settings.eyebrow": string;
  "settings.titlePart1": string;
  "settings.titleAccent": string;
  "settings.close": string;
  "settings.done": string;
  "settings.section.agent.label": string;
  "settings.section.agent.hint": string;
  "settings.section.language.label": string;
  "settings.section.language.hint": string;
  "settings.agent.title": string;
  "settings.agent.subtitle": string;
  "settings.language.title": string;
  "settings.language.subtitle": string;
  "settings.language.active": string;
  "settings.language.default": string;
  "settings.language.note": string;

  // Editor pane
  "editor.tab.text": string;
  "editor.tab.upload": string;
  "editor.tab.samples": string;
  "editor.tab.formats": string;
  "editor.backup": string;
  "editor.backupTooltip": string;
  "editor.restoring": string;
  "editor.placeholder": string;
  "editor.chars": string;
  "editor.saving": string;
  "editor.saveFailed": string;
  "editor.autosaved": string;
  "editor.autosaveTooltip": string;

  // Preview pane
  "preview.tab.preview": string;
  "preview.tab.deck": string;
  "preview.tab.code": string;
  "preview.tab.log": string;

  // Deck viewer
  "deck.empty": string;
  "deck.prev": string;
  "deck.next": string;
  "deck.present": string;
  "deck.exitPresent": string;
  "deck.presentTooltip": string;
  "deck.notes": string;
  "deck.notesTooltip": string;
  "deck.slideN": string;
  "preview.status.idle": string;
  "preview.status.running": string;
  "preview.status.done": string;
  "preview.status.error": string;
  "preview.code.waiting": string;
  "preview.code.empty": string;
  "preview.code.editHint": string;
  "preview.code.lockedHint": string;
  "preview.placeholder.runningTitle.part1": string;
  "preview.placeholder.runningTitle.accent": string;
  "preview.placeholder.idleTitle.part1": string;
  "preview.placeholder.idleTitle.accent": string;
  "preview.placeholder.idleTitle.part2": string;
  "preview.placeholder.runningDescr": string;
  "preview.placeholder.idleDescr": string;
  "preview.placeholder.chip.article": string;
  "preview.placeholder.chip.deck": string;
  "preview.placeholder.chip.resume": string;
  "preview.placeholder.chip.poster": string;
  "preview.placeholder.chip.xiaohongshu": string;
  "preview.placeholder.chip.twitterCard": string;
  "preview.placeholder.chip.webProto": string;
  "preview.placeholder.chip.dataReport": string;
  "preview.log.empty": string;
  "preview.metric.ttfbHint": string;
  "preview.present": string;
  "preview.exitPresent": string;
  "preview.presentTooltip": string;
  "preview.refresh": string;
  "preview.refreshTooltip": string;

  // Tasks sidebar
  "tasks.heading": string;
  "tasks.expand": string;
  "tasks.collapse": string;
  "tasks.newTask": string;
  "tasks.search.placeholder": string;
  "tasks.search.clear": string;
  "tasks.empty.intro": string;
  "tasks.empty.clear": string;
  "tasks.footer": string;
  "tasks.status.idle": string;
  "tasks.status.running": string;
  "tasks.status.done": string;
  "tasks.status.error": string;
  "tasks.rename": string;
  "tasks.duplicate": string;
  "tasks.delete": string;
  "tasks.deleteConfirm": string;
  "tasks.renameDblHint": string;
  "tasks.emptyContent": string;
  "tasks.defaultName": string;
  "tasks.matchTooltip": string;

  // Export menu
  "export.button": string;
  "export.section.platform": string;
  "export.section.raw": string;
  "export.section.download": string;
  "export.section.deck": string;
  "export.action.wechat": string;
  "export.action.zhihu": string;
  "export.action.twitterImg": string;
  "export.action.html": string;
  "export.action.text": string;
  "export.action.downloadHtml": string;
  "export.action.downloadPng": string;
  "export.action.deckPdf": string;
  "export.action.deckPngZip": string;
  "export.action.deckPptx": string;
  "export.toast.wechat": string;
  "export.toast.zhihu": string;
  "export.toast.image": string;
  "export.toast.html": string;
  "export.toast.text": string;
  "export.toast.htmlSaved": string;
  "export.toast.imgSaved": string;
  "export.toast.deckPdf": string;
  "export.toast.deckPngZip": string;
  "export.toast.deckPptx": string;
  "export.error.previewNotReady": string;
  "export.error.generic": string;

  // Drafts menu
  "drafts.button": string;
  "drafts.tooltip": string;
  "drafts.heading": string;
  "drafts.count": string;
  "drafts.empty.title": string;
  "drafts.empty.hint": string;
  "drafts.restoreConfirm": string;
  "drafts.restoredLog": string;
  "drafts.delete": string;
  "drafts.chars": string;
  "drafts.emptyPreview": string;

  // Upload dropzone
  "upload.title": string;
  "upload.types": string;
  "upload.button": string;
  "upload.loadedLog": string;
  "upload.failedLog": string;

  // Formats gallery
  "formats.eyebrow": string;
  "formats.subtitle": string;
  "formats.loadButton": string;
  "formats.loadedLog": string;

  // Samples gallery
  "samples.eyebrow": string;
  "samples.subtitle.preRendered": string;
  "samples.subtitle.diff": string;
  "samples.subtitle.body": string;
  "samples.filter.all": string;
  "samples.loading": string;
  "samples.loaded": string;
  "samples.loadingButton": string;
  "samples.loadButton": string;
  "samples.loadedTooltip": string;
  "samples.sourceLink": string;

  // Template picker
  "template.loading": string;
  "template.heading": string;
  "template.search.placeholder": string;
  "template.search.clear": string;
  "template.filter.all": string;
  "template.filter.featured": string;
  "template.featured.symbol": string;
  "template.empty.loading": string;
  "template.empty.noMatch": string;
  "template.footer.hint.search": string;
  "template.footer.hint.filter": string;
  "template.footer.hint.hover": string;
  "template.footer.hint.preview": string;
  "template.footer.esc": string;
  "template.preview.button": string;
  "template.preview.loadingButton": string;
  "template.preview.tooltip": string;
  "template.popover.loading": string;
  "template.popover.loadInto": string;
  "template.popover.loadIntoTooltip": string;
  "template.source.tooltip": string;
  "template.scenario.marketing": string;
  "template.scenario.engineering": string;
  "template.scenario.operations": string;
  "template.scenario.product": string;
  "template.scenario.design": string;
  "template.scenario.finance": string;
  "template.scenario.sales": string;
  "template.scenario.hr": string;
  "template.scenario.personal": string;
  "template.scenario.education": string;
  "template.scenario.creator": string;
  "template.scenario.video": string;
}

const en: Dict = {
  "brand.subtitle": "the agentic HTML editor",

  "toolbar.selectAgent": "Select agent",
  "toolbar.switchAgent": "Switch agent",
  "toolbar.settings": "Settings",
  "toolbar.stop": "◼ Stop",
  "toolbar.convert": "⚡ Convert to HTML",
  "toolbar.firstSelectAgent": "Pick an agent first",
  "toolbar.unsupportedProtocol": "ACP / pi-rpc not wired yet — pick another agent",
  "toolbar.enterContent": "Type or upload content",
  "toolbar.shortcutHint": "⌘+Enter to convert",
  "convertChip.label": "Generate HTML",
  "convertChip.tooltip": "Generate HTML from the markdown on the left",
  "aiPrompt.placeholder": "Ask AI to write markdown — \"draft a tweet about X\", \"summarize the above\"…",
  "aiPrompt.submit": "✨ Draft",
  "aiPrompt.stop": "◼ Stop",
  "aiPrompt.needAgent": "Pick an agent first",
  "aiPrompt.hint": "Streams below your existing content. ⌘+Enter to send.",

  "layout.aria.group": "Workspace layout",
  "layout.label.editor": "Editor only",
  "layout.label.split": "Split (editor + preview)",
  "layout.label.preview": "Preview only",
  "layout.tip.editor": "Editor only — hide preview",
  "layout.tip.split": "Split — editor + preview side by side",
  "layout.tip.preview": "Preview only — hide editor",

  "welcome.eyebrow": "Choose your agent",
  "welcome.titlePart1": "Pick a local",
  "welcome.titleAccent": "code agent",
  "welcome.description":
    "HTML Anything reuses your already-logged-in CLI session — no API key required. You can switch agents anytime from the top bar.",
  "welcome.rescan": "↻ Rescan",
  "welcome.scanning": "Scanning…",
  "welcome.rescanTitle": "Run detection again",
  "welcome.detectionFailed": "Detection failed",
  "welcome.installed": "Installed ({n})",
  "welcome.notInstalled": "Not installed ({n})",
  "welcome.noAgentsTitle": "No local agents detected",
  "welcome.noAgentsBody": "Install one of the CLIs above and log in, then click ↻ Rescan.",
  "welcome.later": "Later",
  "welcome.enter": "Enter editor →",
  "welcome.current": "Active",
  "welcome.unsupportedHint": "Protocol not wired — cannot convert",
  "welcome.pickInstalled": "Pick an installed agent first",
  "welcome.enterTooltip.noAgent": "Pick an installed agent first",
  "welcome.enterTooltip.unsupported": "ACP / pi-rpc not wired yet — pick another agent",
  "welcome.enterTooltip.ok": "Open the editor",

  "model.eyebrow": "model",
  "model.label": "Pick a model for {agent}",
  "model.defaultHint.prefix": "Default omits ",
  "model.defaultHint.suffix": " and lets the CLI pick.",
  "model.defaultLabel": "Default (CLI config)",

  "agent.selected": "Selected",
  "agent.notInstalled": "Not installed",
  "protocol.stdin": "stdin · stream",
  "protocol.argv": "positional argv",
  "protocol.argvMessage": "argv · batch JSON",
  "protocol.acp": "ACP JSON-RPC · not wired",
  "protocol.piRpc": "pi-rpc · not wired",

  "settings.eyebrow": "Settings",
  "settings.titlePart1": "Configure",
  "settings.titleAccent": "HTML Anything",
  "settings.close": "Close (Esc)",
  "settings.done": "Done",
  "settings.section.agent.label": "Agent",
  "settings.section.agent.hint": "Local CLI · model",
  "settings.section.language.label": "Language",
  "settings.section.language.hint": "Interface language",
  "settings.agent.title": "Code agent",
  "settings.agent.subtitle":
    "HTML Anything reuses your already-logged-in CLI session — no API key required.",
  "settings.language.title": "Interface language",
  "settings.language.subtitle":
    "Sets the language the app surface uses. Default is English; your choice is saved locally.",
  "settings.language.active": "Active",
  "settings.language.default": "Default",
  "settings.language.note":
    "We ship English and Simplified Chinese today. Adding a locale means dropping a dictionary into src/lib/i18n.ts — contributors welcome.",

  "editor.tab.text": "✏️ Text",
  "editor.tab.upload": "⬆️ Upload",
  "editor.tab.samples": "✨ Samples",
  "editor.tab.formats": "📋 Formats",
  "editor.backup": "⤓ Backup",
  "editor.backupTooltip": "Download the current content as a .md / .txt backup",
  "editor.restoring": "Restoring last content…",
  "editor.placeholder":
    "Paste anything here — Markdown / CSV / Excel paste / JSON / SQL / your draft…\n\n⌘+Enter to convert\n\nEverything is autosaved to localStorage and survives a reload; the ↶ history menu top-right shows the last 8 snapshots.",
  "editor.chars": "{n} chars",
  "editor.saving": "Saving…",
  "editor.saveFailed": "✗ Save failed",
  "editor.autosaved": "Autosaved",
  "editor.autosaveTooltip": "Content lives in browser localStorage and survives a reload",

  "preview.tab.preview": "👁 Preview",
  "preview.tab.deck": "🎬 Deck",
  "preview.tab.code": "</> Source",
  "preview.tab.log": "📋 Log",
  "preview.status.idle": "idle",
  "preview.status.running": "generating",
  "preview.status.done": "done",
  "preview.status.error": "error",
  "preview.code.waiting": "// waiting for the agent's first byte…",
  "preview.code.empty": "// no content yet",
  "preview.code.editHint": "Editable — changes save instantly. Switch to Preview (or hit Refresh) to see them.",
  "preview.code.lockedHint": "Read-only while the agent is streaming.",
  "preview.placeholder.runningTitle.part1": "agent is",
  "preview.placeholder.runningTitle.accent": "thinking",
  "preview.placeholder.idleTitle.part1": "Paste content on the left, then",
  "preview.placeholder.idleTitle.accent": "⚡",
  "preview.placeholder.idleTitle.part2": "convert",
  "preview.placeholder.runningDescr":
    "First bytes land in a few seconds, then it streams. Waited {sec}s so far.",
  "preview.placeholder.idleDescr":
    "Preview · view source · one-click copy for WeChat / Twitter / Zhihu · PNG export.",
  "preview.placeholder.chip.article": "📖 Article",
  "preview.placeholder.chip.deck": "🎬 Slide deck",
  "preview.placeholder.chip.resume": "📄 Resume",
  "preview.placeholder.chip.poster": "🖼️ Poster",
  "preview.placeholder.chip.xiaohongshu": "📱 Xiaohongshu",
  "preview.placeholder.chip.twitterCard": "🐦 Twitter card",
  "preview.placeholder.chip.webProto": "🛠️ Web prototype",
  "preview.placeholder.chip.dataReport": "📊 Data report",
  "preview.log.empty":
    "Live agent events (start / delta / meta / stderr / done) and timings show up here.",
  "preview.metric.ttfbHint": "Time to first byte",
  "preview.present": "⛶ Present",
  "preview.exitPresent": "Exit",
  "preview.presentTooltip": "Fullscreen preview — F to toggle, ESC to exit",
  "preview.refresh": "Refresh",
  "preview.refreshTooltip": "Re-render the preview iframe with the current HTML",

  "deck.empty": "No slides found in this output.",
  "deck.prev": "Previous slide",
  "deck.next": "Next slide",
  "deck.present": "▶ Present",
  "deck.exitPresent": "Exit present",
  "deck.presentTooltip": "Fullscreen — press F to toggle, ESC to exit",
  "deck.notes": "Notes",
  "deck.notesTooltip": "Toggle speaker notes (N)",
  "deck.slideN": "{n} / {m}",

  "tasks.heading": "tasks",
  "tasks.expand": "Expand task list",
  "tasks.collapse": "Collapse task list",
  "tasks.newTask": "＋ New task",
  "tasks.search.placeholder": "Search task name / content / template…",
  "tasks.search.clear": "Clear search",
  "tasks.empty.intro": "No tasks match “{query}”",
  "tasks.empty.clear": "Clear search",
  "tasks.footer": "Input and output of every task autosave to your browser and survive a reload.",
  "tasks.status.idle": "idle",
  "tasks.status.running": "generating",
  "tasks.status.done": "done",
  "tasks.status.error": "error",
  "tasks.rename": "Rename",
  "tasks.duplicate": "Duplicate",
  "tasks.delete": "Delete task",
  "tasks.deleteConfirm": "Delete task “{name}”? Its input and output will be lost.",
  "tasks.renameDblHint": "Double-click to rename",
  "tasks.emptyContent": "empty",
  "tasks.defaultName": "Task {n}",
  "tasks.matchTooltip": "{a} / {b} match",

  "export.button": "⤓ Export / Copy ▾",
  "export.section.platform": "Copy to platform",
  "export.section.raw": "Copy raw",
  "export.section.download": "Download",
  "export.section.deck": "Deck · {n} slides",
  "export.action.wechat": "WeChat (公众号)",
  "export.action.zhihu": "Zhihu",
  "export.action.twitterImg": "Twitter / Weibo (PNG)",
  "export.action.html": "HTML source",
  "export.action.text": "Plain text",
  "export.action.downloadHtml": ".html single file",
  "export.action.downloadPng": ".png hi-res image",
  "export.action.deckPdf": "PDF · all slides (print)",
  "export.action.deckPngZip": "PNG · per-slide (.zip)",
  "export.action.deckPptx": ".pptx · PowerPoint",
  "export.toast.wechat": "WeChat format copied",
  "export.toast.zhihu": "Zhihu format copied",
  "export.toast.image": "Image copied",
  "export.toast.html": "HTML copied",
  "export.toast.text": "Text copied",
  "export.toast.htmlSaved": "HTML downloaded",
  "export.toast.imgSaved": "Image downloaded",
  "export.toast.deckPdf": "Print dialog opened — pick “Save as PDF”",
  "export.toast.deckPngZip": "Slide PNGs zipped",
  "export.toast.deckPptx": "PPTX downloaded",
  "export.error.previewNotReady": "Preview not ready",
  "export.error.generic": "failed",

  "drafts.button": "↶ History",
  "drafts.tooltip": "View autosaved version history",
  "drafts.heading": "Autosaved versions",
  "drafts.count": "{n}",
  "drafts.empty.title": "No history yet",
  "drafts.empty.hint": "Inputs over 20 chars get snapshotted every 30s",
  "drafts.restoreConfirm":
    "Restore the version from {when}? The current content will be replaced (the new version is autosaved too).",
  "drafts.restoredLog": "Restored the version from {when} ({n} chars)",
  "drafts.delete": "Delete this version",
  "drafts.chars": "{n} chars",
  "drafts.emptyPreview": "(empty)",

  "upload.title": "Drop a file here",
  "upload.types": "Supports .md .txt .csv .tsv .xlsx .json .sql .yaml .png .jpg",
  "upload.button": "Choose a file",
  "upload.loadedLog": "Loaded {name} ({fmt})",
  "upload.failedLog": "Parse failed: {err}",

  "formats.eyebrow": "Format examples",
  "formats.subtitle":
    "One-click snippets for every input shape we support. Pick a template up top, click Load, then ⌘+Enter — the template above decides the look.",
  "formats.loadButton": "✨ Load →",
  "formats.loadedLog": "Loaded {name} ({fmt})",

  "samples.eyebrow": "Sample gallery",
  "samples.subtitle.preRendered": "pre-rendered",
  "samples.subtitle.diff": "diff edit",
  "samples.subtitle.body":
    "Every sample ships {preRendered} world-class HTML — click to preview in a new task; edit the content and ⌘+Enter, the agent runs a {diff} only and saves tokens.",
  "samples.filter.all": "All",
  "samples.loading": "Loading samples…",
  "samples.loaded": "✓ Loaded",
  "samples.loadingButton": "Loading…",
  "samples.loadButton": "✨ Load & preview →",
  "samples.loadedTooltip": "This sample is already loaded in a task",
  "samples.sourceLink": "Source · {label}",

  "template.loading": "Loading templates…",
  "template.heading": "Pick an output shape",
  "template.search.placeholder": "Search template name / description / tag…",
  "template.search.clear": "Clear",
  "template.filter.all": "All",
  "template.filter.featured": "★ Featured",
  "template.featured.symbol": "★",
  "template.empty.loading": "Loading templates…",
  "template.empty.noMatch": "No matching templates. Try a different keyword or category.",
  "template.footer.hint.search": "⌕ Search",
  "template.footer.hint.filter": "category filter",
  "template.footer.hint.hover": "hover for thumbnail",
  "template.footer.hint.preview": "“Preview” loads into the editor",
  "template.footer.esc": "to close",
  "template.preview.button": "Preview",
  "template.preview.loadingButton": "…",
  "template.preview.tooltip": "Load the prerendered snapshot into a new task",
  "template.popover.loading": "Loading preview…",
  "template.popover.loadInto": "Load into editor →",
  "template.popover.loadIntoTooltip": "Load the prerendered snapshot into a new task",
  "template.source.tooltip": "Reference project: {label}",
  "template.scenario.marketing": "Marketing / Content",
  "template.scenario.engineering": "Engineering / Dev",
  "template.scenario.operations": "Operations",
  "template.scenario.product": "Product",
  "template.scenario.design": "Design / Explore",
  "template.scenario.finance": "Finance / Data",
  "template.scenario.sales": "Sales",
  "template.scenario.hr": "HR / Onboarding",
  "template.scenario.personal": "Personal",
  "template.scenario.education": "Education",
  "template.scenario.creator": "Creator",
  "template.scenario.video": "Video",
};

const zhCN: Dict = {
  "brand.subtitle": "the agentic HTML editor",

  "toolbar.selectAgent": "选择 agent",
  "toolbar.switchAgent": "切换 agent",
  "toolbar.settings": "设置",
  "toolbar.stop": "◼ 停止",
  "toolbar.convert": "⚡ 转换为 HTML",
  "convertChip.label": "生成 HTML",
  "convertChip.tooltip": "把左侧 markdown 内容转成 HTML",
  "aiPrompt.placeholder": "让 AI 帮你写 markdown — 「写一条关于 X 的推文」「总结上面这段」…",
  "aiPrompt.submit": "✨ 生成",
  "aiPrompt.stop": "◼ 停止",
  "aiPrompt.needAgent": "先在右上角选个 agent",
  "aiPrompt.hint": "结果会追加到上方现有内容下方。⌘+Enter 发送。",
  "toolbar.firstSelectAgent": "先选择 agent",
  "toolbar.unsupportedProtocol": "ACP / pi-rpc 协议暂未接入, 请换其他 agent",
  "toolbar.enterContent": "输入或上传内容",
  "toolbar.shortcutHint": "⌘+Enter 转换",

  "layout.aria.group": "工作区布局",
  "layout.label.editor": "仅编辑器",
  "layout.label.split": "并排 (编辑器 + 预览)",
  "layout.label.preview": "仅预览",
  "layout.tip.editor": "仅编辑器 — 隐藏预览",
  "layout.tip.split": "并排 — 编辑器与预览同时显示",
  "layout.tip.preview": "仅预览 — 隐藏编辑器",

  "welcome.eyebrow": "Choose your agent",
  "welcome.titlePart1": "选一个本地",
  "welcome.titleAccent": "code agent",
  "welcome.description":
    "HTML Anything 复用你已经登录的 CLI session — 不要求你再贴一遍 API Key。进入主界面后,你随时可以在顶栏切换到别的 agent。",
  "welcome.rescan": "↻ 重新检测",
  "welcome.scanning": "扫描中…",
  "welcome.rescanTitle": "重新检测",
  "welcome.detectionFailed": "检测失败",
  "welcome.installed": "已安装 ({n})",
  "welcome.notInstalled": "未安装 ({n})",
  "welcome.noAgentsTitle": "没有检测到任何本地 agent",
  "welcome.noAgentsBody": "先安装上面任意一个 CLI 并登录, 再回来 ↻ 重新检测。",
  "welcome.later": "稍后再说",
  "welcome.enter": "进入编辑器 →",
  "welcome.current": "当前",
  "welcome.unsupportedHint": "协议暂未接入, 无法转换",
  "welcome.pickInstalled": "请先选一个已安装的 agent",
  "welcome.enterTooltip.noAgent": "先选一个已安装的 agent",
  "welcome.enterTooltip.unsupported": "ACP / pi-rpc 协议暂未接入, 请选其他 agent",
  "welcome.enterTooltip.ok": "进入编辑器",

  "model.eyebrow": "model",
  "model.label": "为 {agent} 选个模型",
  "model.defaultHint.prefix": "选 Default 时不传 ",
  "model.defaultHint.suffix": ", 由 CLI 自己挑",
  "model.defaultLabel": "Default (CLI config)",

  "agent.selected": "SELECTED",
  "agent.notInstalled": "未安装",
  "protocol.stdin": "stdin · stream",
  "protocol.argv": "positional argv",
  "protocol.argvMessage": "argv · 整段 JSON",
  "protocol.acp": "ACP JSON-RPC · 暂未接入",
  "protocol.piRpc": "pi-rpc · 暂未接入",

  "settings.eyebrow": "设置",
  "settings.titlePart1": "配置",
  "settings.titleAccent": "HTML Anything",
  "settings.close": "关闭 (Esc)",
  "settings.done": "完成",
  "settings.section.agent.label": "Agent",
  "settings.section.agent.hint": "本地 CLI · 模型",
  "settings.section.language.label": "语言",
  "settings.section.language.hint": "界面语言",
  "settings.agent.title": "Code agent",
  "settings.agent.subtitle":
    "HTML Anything 复用你已经登录的 CLI session — 不需要再贴 API Key。",
  "settings.language.title": "界面语言",
  "settings.language.subtitle":
    "选择 app 界面使用的语言。默认 English; 选择会保存到本地。",
  "settings.language.active": "当前",
  "settings.language.default": "默认",
  "settings.language.note":
    "目前发布的是 English 和简体中文。增加一种语言只需要在 src/lib/i18n.ts 里加一份字典 — 欢迎贡献。",

  "editor.tab.text": "✏️ 输入",
  "editor.tab.upload": "⬆️ 上传",
  "editor.tab.samples": "✨ 示例",
  "editor.tab.formats": "📋 格式",
  "editor.backup": "⤓ 备份",
  "editor.backupTooltip": "把当前内容下载为 .md / .txt 备份文件",
  "editor.restoring": "恢复上次内容…",
  "editor.placeholder":
    "粘贴任何内容到这里 — Markdown / CSV / Excel 复制 / JSON / SQL / 你的草稿…\n\n按 ⌘+Enter 转换\n\n所有输入会自动保存到 localStorage, 刷新不丢; 点击右上角 ↶ 历史 可查看最近 8 个版本。",
  "editor.chars": "{n} 字",
  "editor.saving": "正在保存…",
  "editor.saveFailed": "✗ 保存失败",
  "editor.autosaved": "已自动保存",
  "editor.autosaveTooltip": "内容存到浏览器 localStorage, 刷新不丢",

  "preview.tab.preview": "👁 预览",
  "preview.tab.deck": "🎬 PPT",
  "preview.tab.code": "</> 源码",
  "preview.tab.log": "📋 日志",
  "preview.status.idle": "待机",
  "preview.status.running": "生成中",
  "preview.status.done": "完成",
  "preview.status.error": "错误",
  "preview.code.waiting": "// 等待 agent 第一个字节…",
  "preview.code.empty": "// 还没有内容",
  "preview.code.editHint": "可编辑 — 改动会即时保存,切到预览 (或点刷新) 即可看到效果。",
  "preview.code.lockedHint": "Agent 正在流式输出, 暂时只读。",
  "preview.placeholder.runningTitle.part1": "agent 正在",
  "preview.placeholder.runningTitle.accent": "思考",
  "preview.placeholder.idleTitle.part1": "把内容粘到左侧, 然后",
  "preview.placeholder.idleTitle.accent": "⚡",
  "preview.placeholder.idleTitle.part2": "转换",
  "preview.placeholder.runningDescr": "首字会在几秒内到达, 之后流式更新。当前已等 {sec}s。",
  "preview.placeholder.idleDescr": "支持预览 / 查看源码 / 一键复制公众号·推特·知乎 / 截图导出 PNG。",
  "preview.placeholder.chip.article": "📖 文章",
  "preview.placeholder.chip.deck": "🎬 PPT",
  "preview.placeholder.chip.resume": "📄 简历",
  "preview.placeholder.chip.poster": "🖼️ 海报",
  "preview.placeholder.chip.xiaohongshu": "📱 小红书",
  "preview.placeholder.chip.twitterCard": "🐦 推特卡",
  "preview.placeholder.chip.webProto": "🛠️ Web 原型",
  "preview.placeholder.chip.dataReport": "📊 数据报告",
  "preview.log.empty":
    "这里会实时显示 agent 的事件 (start / delta / meta / stderr / done) 和耗时统计。",
  "preview.metric.ttfbHint": "首字节延迟",
  "preview.present": "⛶ 全屏",
  "preview.exitPresent": "退出全屏",
  "preview.presentTooltip": "全屏预览 — F 切换 / ESC 退出",
  "preview.refresh": "刷新",
  "preview.refreshTooltip": "用当前 HTML 重新渲染预览 iframe",

  "deck.empty": "本次结果里没有检测到幻灯片。",
  "deck.prev": "上一页",
  "deck.next": "下一页",
  "deck.present": "▶ 放映",
  "deck.exitPresent": "退出放映",
  "deck.presentTooltip": "全屏放映 — F 切换 / ESC 退出",
  "deck.notes": "备注",
  "deck.notesTooltip": "切换演讲者备注 (N)",
  "deck.slideN": "{n} / {m}",

  "tasks.heading": "任务",
  "tasks.expand": "展开任务列表",
  "tasks.collapse": "折叠任务列表",
  "tasks.newTask": "＋ 新建任务",
  "tasks.search.placeholder": "搜索任务名 / 内容 / 模板…",
  "tasks.search.clear": "清除搜索",
  "tasks.empty.intro": "没有匹配「{query}」的任务",
  "tasks.empty.clear": "清除搜索",
  "tasks.footer": "所有任务的输入 / 输出都会自动保存到浏览器, 刷新后保留。",
  "tasks.status.idle": "待机",
  "tasks.status.running": "生成中",
  "tasks.status.done": "完成",
  "tasks.status.error": "错误",
  "tasks.rename": "重命名",
  "tasks.duplicate": "复制",
  "tasks.delete": "删除任务",
  "tasks.deleteConfirm": "删除任务「{name}」? 该任务的输入与生成结果都会丢失。",
  "tasks.renameDblHint": "双击重命名",
  "tasks.emptyContent": "空白",
  "tasks.defaultName": "任务 {n}",
  "tasks.matchTooltip": "{a} / {b} 匹配",

  "export.button": "⤓ 导出 / 复制 ▾",
  "export.section.platform": "复制到平台",
  "export.section.raw": "复制原始内容",
  "export.section.download": "下载",
  "export.section.deck": "Deck · 共 {n} 页",
  "export.action.wechat": "微信公众号",
  "export.action.zhihu": "知乎",
  "export.action.twitterImg": "推特 / 微博 (PNG)",
  "export.action.html": "HTML 源码",
  "export.action.text": "纯文本",
  "export.action.downloadHtml": ".html 单文件",
  "export.action.downloadPng": ".png 高清图",
  "export.action.deckPdf": "PDF · 全部幻灯片 (打印)",
  "export.action.deckPngZip": "PNG · 每页一张 (.zip)",
  "export.action.deckPptx": ".pptx · PowerPoint",
  "export.toast.wechat": "已复制公众号格式",
  "export.toast.zhihu": "已复制知乎格式",
  "export.toast.image": "已复制图片",
  "export.toast.html": "已复制 HTML",
  "export.toast.text": "已复制文本",
  "export.toast.htmlSaved": "已下载 HTML",
  "export.toast.imgSaved": "已下载图片",
  "export.toast.deckPdf": "已打开打印窗口 — 选「另存为 PDF」",
  "export.toast.deckPngZip": "已打包 PNG ZIP",
  "export.toast.deckPptx": "已下载 PPTX",
  "export.error.previewNotReady": "预览未就绪",
  "export.error.generic": "失败",

  "drafts.button": "↶ 历史",
  "drafts.tooltip": "查看自动保存的版本历史",
  "drafts.heading": "自动保存的版本",
  "drafts.count": "{n} 个",
  "drafts.empty.title": "暂无历史版本",
  "drafts.empty.hint": "输入超过 20 字, 每 30 秒自动快照",
  "drafts.restoreConfirm": "恢复到 {when} 的版本? 当前内容会被替换 (新版本会自动备份)。",
  "drafts.restoredLog": "已恢复 {when} 的版本 ({n} 字)",
  "drafts.delete": "删除此版本",
  "drafts.chars": "{n} 字",
  "drafts.emptyPreview": "(空)",

  "upload.title": "把文件拖到这里",
  "upload.types": "支持 .md .txt .csv .tsv .xlsx .json .sql .yaml .png .jpg",
  "upload.button": "选择文件",
  "upload.loadedLog": "已加载 {name} ({fmt})",
  "upload.failedLog": "解析失败: {err}",

  "formats.eyebrow": "格式示例",
  "formats.subtitle":
    "一键载入每种输入格式的样例片段。先在顶部选模板, 点击「载入」, 再 ⌘+Enter — 由上方的模板决定输出样式。",
  "formats.loadButton": "✨ 载入 →",
  "formats.loadedLog": "已载入 {name} ({fmt})",

  "samples.eyebrow": "示例画廊",
  "samples.subtitle.preRendered": "预渲染",
  "samples.subtitle.diff": "diff 编辑",
  "samples.subtitle.body":
    "每个示例都已 {preRendered} 世界级 HTML — 点击即在新任务中预览; 修改内容后再 ⌘+Enter, agent 只跑 {diff}, 省 token。",
  "samples.filter.all": "全部",
  "samples.loading": "正在载入示例…",
  "samples.loaded": "✓ 已加载",
  "samples.loadingButton": "载入中…",
  "samples.loadButton": "✨ 载入并预览 →",
  "samples.loadedTooltip": "此示例已经在某个任务里被加载过",
  "samples.sourceLink": "原文 · {label}",

  "template.loading": "载入模板…",
  "template.heading": "选择输出形态",
  "template.search.placeholder": "搜索模板名 / 描述 / 标签…",
  "template.search.clear": "清空",
  "template.filter.all": "全部",
  "template.filter.featured": "★ 推荐 · Featured",
  "template.featured.symbol": "★",
  "template.empty.loading": "正在载入模板…",
  "template.empty.noMatch": "没有匹配的模板。试试别的关键词或切换分类。",
  "template.footer.hint.search": "⌕ 搜索",
  "template.footer.hint.filter": "类别筛选",
  "template.footer.hint.hover": "悬停缩略预览",
  "template.footer.hint.preview": "「预览」按钮载入到编辑器",
  "template.footer.esc": "关闭",
  "template.preview.button": "预览",
  "template.preview.loadingButton": "…",
  "template.preview.tooltip": "把预览快照载入一个新任务",
  "template.popover.loading": "正在加载预览…",
  "template.popover.loadInto": "载入到编辑器 →",
  "template.popover.loadIntoTooltip": "把预览快照载入一个新任务",
  "template.source.tooltip": "参考开源项目: {label}",
  "template.scenario.marketing": "营销 / 内容",
  "template.scenario.engineering": "工程 / 开发",
  "template.scenario.operations": "运营 / 协作",
  "template.scenario.product": "产品",
  "template.scenario.design": "设计 / 探索",
  "template.scenario.finance": "财务 / 数据",
  "template.scenario.sales": "销售",
  "template.scenario.hr": "HR / 入职",
  "template.scenario.personal": "个人 / 生活",
  "template.scenario.education": "教育 / 学习",
  "template.scenario.creator": "创作者",
  "template.scenario.video": "视频",
};

const DICTS: Record<Locale, Dict> = {
  "en": en,
  "zh-CN": zhCN,
};

export type DictKey = keyof Dict;

function format(template: string, vars?: Record<string, string | number>): string {
  if (!vars) return template;
  return template.replace(/\{(\w+)\}/g, (_, k) => {
    const v = vars[k];
    return v === undefined ? `{${k}}` : String(v);
  });
}

export function t(
  locale: Locale,
  key: DictKey,
  vars?: Record<string, string | number>,
): string {
  const dict = DICTS[locale] ?? DICTS.en;
  return format(dict[key], vars);
}

/**
 * Returns a `t(key, vars?)` bound to the active locale. Components call this
 * once at the top of render and use the returned function inline.
 */
export function useT(): (key: DictKey, vars?: Record<string, string | number>) => string {
  const locale = useStore((s) => s.locale);
  return (key, vars) => t(locale, key, vars);
}
