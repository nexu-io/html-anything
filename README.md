# HTML Anything

> **Markdown is the draft. HTML is what humans read. Your local agent writes it.** The agentic HTML editor — in the agentic era, you don't hand-edit docs anymore, so the output format should be what the reader actually wants: HTML. Local-first, zero API key, reuses the CLI session you already have logged in — **8 coding-agent CLIs** auto-detected on your `PATH` (Claude Code · Cursor Agent · Codex · Gemini CLI · GitHub Copilot CLI · OpenCode · Qwen Coder · Aider), driven by **75 composable skill templates** across **9 deliverable surfaces** (magazine articles · keynote decks · résumés · posters · Xiaohongshu cards · tweet cards · web prototypes · data reports · Hyperframes videos). One-click export to WeChat / X / Zhihu, or download `.html` / `.png`.

<p align="center">
  <img src="docs/assets/banner.png" alt="HTML Anything — the agentic HTML editor, on your laptop" width="100%" />
</p>

<p align="center">
  <a href="LICENSE"><img alt="License" src="https://img.shields.io/badge/license-Apache%202.0-blue.svg?style=flat-square" /></a>
  <a href="#supported-coding-agents"><img alt="Agents" src="https://img.shields.io/badge/agents-8%20CLIs-black?style=flat-square" /></a>
  <a href="#skills"><img alt="Skills" src="https://img.shields.io/badge/skills-75-orange?style=flat-square" /></a>
  <a href="#export-targets"><img alt="Export" src="https://img.shields.io/badge/export-WeChat%20%C2%B7%20X%20%C2%B7%20Zhihu%20%C2%B7%20PNG-9b59b6?style=flat-square" /></a>
  <a href="#quickstart"><img alt="Quickstart" src="https://img.shields.io/badge/quickstart-30%20seconds-green?style=flat-square" /></a>
  <a href="#architecture"><img alt="No API key" src="https://img.shields.io/badge/no-API%20key%20required-ff6b35?style=flat-square" /></a>
</p>

<!-- This project is built on top of nexu-io/open-design — the badges below link to its community channels on purpose. -->
<p align="center">
  <a href="https://github.com/nexu-io/open-design#community"><img alt="Discord (open-design)" src="https://img.shields.io/badge/discord-join-5865f2?style=flat-square&logo=discord&logoColor=white" /></a>
  <a href="https://x.com/nexudotio"><img alt="Follow @nexudotio on X" src="https://img.shields.io/badge/follow-%40nexudotio-000000?style=flat-square&logo=x&logoColor=white" /></a>
  <a href="https://github.com/nexu-io/open-design/releases/latest"><img alt="open-design release" src="https://img.shields.io/github/v/release/nexu-io/open-design?style=flat-square&label=release&color=8e44ad" /></a>
  <a href="https://github.com/nexu-io/open-design/graphs/commit-activity"><img alt="open-design commits / month" src="https://img.shields.io/github/commit-activity/m/nexu-io/open-design?style=flat-square&label=commits%2Fmonth&color=f39c12" /></a>
  <a href="#showcase"><img alt="Design systems" src="https://img.shields.io/badge/design%20systems-9-1abc9c?style=flat-square" /></a>
  <a href="https://github.com/nexu-io/open-design"><img alt="Built on open-design" src="https://img.shields.io/badge/built%20on-nexu--io%2Fopen--design-ff7043?style=flat-square&logo=github&logoColor=white" /></a>
</p>

<p align="center"><b>English</b> · <a href="README.zh-CN.md">简体中文</a></p>

---

## Showcase

The eight skills that surface at the top of the picker's **Featured / 推荐** group — sorted by their `recommended:` rank in `SKILL.md` frontmatter (lower = higher). Each ships a real `example.html` you can open straight from the repo, no auth, no setup.

<table>
<tr>
<td width="50%" valign="top">
<a href="src/lib/templates/skills/deck-guizang-editorial/"><img src="docs/screenshots/skills/deck-guizang-editorial.png" alt="deck-guizang-editorial" /></a><br/>
<sub><b><a href="src/lib/templates/skills/deck-guizang-editorial/"><code>deck-guizang-editorial</code></a></b> · <i>deck</i> · <code>recommended: 1</code><br/>Magazine × e-ink editorial deck, inspired by <a href="https://github.com/op7418/guizang-ppt-skill"><code>op7418/guizang-ppt-skill</code></a> — 10 locked layouts × 5 palettes (Ink / Indigo Porcelain / Forest Ink / Kraft / Dune). Reads like a printed art-zine, not a slide deck.</sub>
</td>
<td width="50%" valign="top">
<a href="src/lib/templates/skills/deck-swiss-international/"><img src="docs/screenshots/skills/deck-swiss-international.png" alt="deck-swiss-international" /></a><br/>
<sub><b><a href="src/lib/templates/skills/deck-swiss-international/"><code>deck-swiss-international</code></a></b> · <i>deck</i> · <code>recommended: 2</code><br/>Swiss International deck — 16-column grid + one saturated accent (Klein Blue / Lemon / Mint / Safety Orange) across 22 locked layouts. Cold, rational, institutional. The deck that reads "a designer made this" the moment it opens.</sub>
</td>
</tr>
<tr>
<td width="50%" valign="top">
<a href="src/lib/templates/skills/doc-kami-parchment/"><img src="docs/screenshots/skills/doc-kami-parchment.png" alt="doc-kami-parchment" /></a><br/>
<sub><b><a href="src/lib/templates/skills/doc-kami-parchment/"><code>doc-kami-parchment</code></a></b> · <i>doc</i> · <code>recommended: 3</code><br/>Warm-parchment editorial document, inspired by <a href="https://github.com/tw93/kami"><code>tw93/kami</code></a>. <code>#f5f4ed</code> ground + ink-blue accent + single serif voice — a noticeably calmer reading surface than plain-white markdown for long essays, reports, and one-pagers.</sub>
</td>
<td width="50%" valign="top">
<a href="src/lib/templates/skills/magazine-poster/"><img src="docs/screenshots/skills/magazine-poster.png" alt="magazine-poster" /></a><br/>
<sub><b><a href="src/lib/templates/skills/magazine-poster/"><code>magazine-poster</code></a></b> · <i>poster</i> · <code>recommended: 4</code><br/>Newsprint Sunday-paper poster — oversized serif headline, two-column body, six numbered sections, dot-pattern cream ground. Reads like a printed broadsheet, not a webpage.</sub>
</td>
</tr>
<tr>
<td width="50%" valign="top">
<a href="src/lib/templates/skills/video-hyperframes/"><img src="docs/screenshots/skills/video-hyperframes.png" alt="video-hyperframes" /></a><br/>
<sub><b><a href="src/lib/templates/skills/video-hyperframes/"><code>video-hyperframes</code></a></b> · <i>frame / video</i> · <code>recommended: 5</code><br/>Hyperframes / Remotion-compatible storyboard — 6–10 sequential <code>1920×1080</code> frames with hidden duration + transition markers and an auto-play script. Hand straight to <a href="https://github.com/heygen-com/hyperframes"><code>heygen-com/hyperframes</code></a> or Remotion to render <code>.mp4</code>.</sub>
</td>
<td width="50%" valign="top">
<a href="src/lib/templates/skills/frame-glitch-title/"><img src="docs/screenshots/skills/frame-glitch-title.png" alt="frame-glitch-title" /></a><br/>
<sub><b><a href="src/lib/templates/skills/frame-glitch-title/"><code>frame-glitch-title</code></a></b> · <i>frame</i> · <code>recommended: 6</code><br/>Glitch title frame — cyan/magenta chromatic offset, CRT scanlines, corrupted-data subtitle, ASCII noise in the corners. Cyberpunk hero card or video transition.</sub>
</td>
</tr>
<tr>
<td width="50%" valign="top">
<a href="src/lib/templates/skills/vfx-text-cursor/"><img src="docs/screenshots/skills/vfx-text-cursor.png" alt="vfx-text-cursor" /></a><br/>
<sub><b><a href="src/lib/templates/skills/vfx-text-cursor/"><code>vfx-text-cursor</code></a></b> · <i>vfx</i> · <code>recommended: 7</code><br/>VFX text-cursor opener — a cursor "types" across the canvas, each character revealed with a hot-pink × cyan chromatic trail and directional light leaks. Drop in a quote, get a film-grade opening frame.</sub>
</td>
<td width="50%" valign="top">
<a href="src/lib/templates/skills/frame-logo-outro/"><img src="docs/screenshots/skills/frame-logo-outro.png" alt="frame-logo-outro" /></a><br/>
<sub><b><a href="src/lib/templates/skills/frame-logo-outro/"><code>frame-logo-outro</code></a></b> · <i>frame</i> · <code>recommended: 8</code><br/>Logo outro frame — logo assembles piece-by-piece with glow bloom, tagline rises, CTA appears. The closing card for a product reveal or brand film.</sub>
</td>
</tr>
</table>

The full skill catalog (organized by mode) is in [Skills](#skills) below.

## Why this exists

Anthropic's [Claude Code team announced](https://x.com/trq212/status/2052809885763747935) they stopped writing internal docs in Markdown — they ship HTML now. The argument is simple:

| Markdown | HTML |
|---|---|
| Good for the writer | Good for the reader |
| Layout limited to the renderer | Layout is yours |
| Looks ugly screenshotted into a tweet | Already looks like a designed image |
| Has to be re-flowed for WeChat / Zhihu / newsletter | One-click format conversion |

**HTML is the final form for humans. Markdown is just an intermediate state during writing.**

But "writing HTML" used to mean writing CSS, picking type scales, snapping to a grid, doing responsive — most users won't, designers won't bother, writers don't have the patience. So what we built: after you press ⌘+Enter, your **local AI agent** turns any input (Markdown / CSV / Excel / JSON / SQL / raw notes) into a **ship-ready single-file HTML** in seconds, then one-click sends it to WeChat / X / Zhihu / anywhere. "Ship-ready" is the bar — when generation finishes, the artifact is what your audience actually sees. No "I'll touch it up later" pass.

We stand on four open-source shoulders:

- [**`nexu-io/open-design`**](https://github.com/nexu-io/open-design) — the agent-detection layer, the design-system model, and the `SKILL.md` protocol. `src/lib/agents/` and `src/lib/templates/skills/*` mirror this architecture directly.
- [**`mdnice/markdown-nice`**](https://github.com/mdnice/markdown-nice) — proof that `juice`-inlined CSS pastes cleanly into WeChat and Zhihu without per-platform manual fix-up.
- [**`gcui-art/markdown-to-image`**](https://github.com/gcui-art/markdown-to-image) — the iframe → high-DPI PNG export path.
- [**`alchaincyf/huashu-md-html`**](https://github.com/alchaincyf/huashu-md-html) — the anti-AI-slop discipline that maps into the hard constraints inside every `SKILL.md` (CJK-first font stack, 8 px baseline grid, contrast ≥ 4.5, must-use-real-data rule).

## At a glance

| | What you get |
|---|---|
| **Coding-agent CLIs (8)** | Claude Code · Cursor Agent · OpenAI Codex · Gemini CLI · GitHub Copilot CLI · OpenCode · Qwen Coder · Aider — scanned on startup across `PATH` (including `~/.local/bin`, `~/.bun/bin`, `/opt/homebrew/bin`, `~/.npm-global/bin` — directories a GUI-launched Node process normally misses), swap from the top-bar picker. |
| **Zero API key** | We reuse the session you already have logged in via `claude login` · `cursor login` · `gemini auth`. Your existing subscription does the work; marginal cost is **$0**. |
| **75 skill templates** | `prototype` (web / SaaS landing / dashboard / data report) · `deck` (20 keynote skills incl. Swiss International, Guizang Editorial, XHS Pastel, Hermes Cyber, Replit, Magazine Web…) · `frame` (10 Hyperframes video frames — liquid hero, NYT data chart, sticky-note flowchart, glitch title, cinema light-leak, macOS notification, logo outro…) · `social` (X / Xiaohongshu / Spotify / Reddit cards) · `office` (PM spec · eng runbook · finance report · HR onboarding · invoice · OKRs · weekly update · meeting notes · kanban) · `doc` (Kami warm-parchment editorial) · `mockup` (3D device frame) · `vfx` (text-cursor effect). |
| **9 surface modes** | 📖 magazine article · 🎬 keynote deck · 📄 résumé · 🖼️ poster · 📱 Xiaohongshu card · 🐦 tweet card · 🛠️ web prototype · 📊 data report · 🎞️ Hyperframes video. Each has multiple skills you can pick from. |
| **One-click export** | `juice` inlines CSS → WeChat paste with zero re-formatting · `modern-screenshot` renders the iframe to a 2× PNG → `ClipboardItem` → drop straight into the tweet composer · `<mjx-container>` → `data-eeimg` placeholder → Zhihu equations render automatically · standalone `.html` download · high-DPI `.png` download. |
| **Streaming render** | `POST /api/convert` over SSE. The agent's stdout JSON-line stream is parsed for text deltas → server-sent events → client appends → iframe `srcdoc` updates live. Waiting for an AI generation looks like watching it type in real time. |
| **Sandboxed preview** | `<iframe sandbox="allow-scripts allow-same-origin">`. User-emitted HTML runs in an isolated origin — Tailwind CDN / Google Fonts / inline scripts work, but cookies and localStorage are quarantined from the host. |
| **Format auto-detect** | The editor accepts Markdown / CSV / TSV / JSON / SQL / plain text. `papaparse` + `xlsx` parse tabular data in the browser — nothing is uploaded. |
| **Deployable to** | Local (`pnpm dev`) · Vercel for the web layer (the agent always stays on your laptop). |
| **License** | Apache-2.0 |

## Demo

<table>
<tr>
<td width="50%">
<img src="docs/screenshots/01-entry-view.png" alt="01 · Entry view" /><br/>
<sub><b>Entry view</b> — the top bar shows your installed CLIs, the left pane is the editor, the middle is the template + design-system picker, the right is a live iframe preview. The same surface produces magazines, decks, posters, web prototypes, and Hyperframes frame scripts.</sub>
</td>
<td width="50%">
<img src="docs/screenshots/02-template-picker.png" alt="02 · 75 skills, searchable and filterable" /><br/>
<sub><b>75 templates, searchable and filterable</b> — pick by mode (prototype / deck / frame / social / office / doc) × scenario (design / marketing / engineering / product / personal). Every skill ships an <code>example.html</code> you can open straight from the repo to see what the agent will produce.</sub>
</td>
</tr>
<tr>
<td width="50%">
<img src="docs/screenshots/03-streaming.png" alt="03 · Live SSE streaming" /><br/>
<sub><b>SSE streaming</b> — agent stdout JSON-line is parsed for text deltas, appended into the iframe <code>srcdoc</code> in real time. You watch the page render line by line. Don't like where it's going? Interrupt and re-prompt — no wasted full generation.</sub>
</td>
<td width="50%">
<img src="docs/screenshots/04-export.png" alt="04 · One-click export" /><br/>
<sub><b>One-click export</b> — WeChat (juice-inlined CSS) · X / Weibo / Xiaohongshu (modern-screenshot → 2× PNG → <code>ClipboardItem</code>) · Zhihu (LaTeX image placeholders) · download <code>.html</code> · download <code>.png</code>. Paste straight in, no second pass of manual formatting.</sub>
</td>
</tr>
<tr>
<td width="50%">
<img src="docs/screenshots/05-deck-mode.png" alt="05 · Deck mode" /><br/>
<sub><b>Deck mode</b> — 20 keynote skills, including Swiss International (Helvetica grid maximalism), Guizang Editorial (magazine ink), Open Slide Canvas (1920×1080 agent-native), Magazine Web, XHS Pastel, Hermes Cyber, Replit Style. ←/→ to navigate slides, presenter notes, PDF export.</sub>
</td>
<td width="50%">
<img src="docs/screenshots/06-hyperframes.png" alt="06 · Hyperframes video frames" /><br/>
<sub><b>Hyperframes frames</b> — 10 motion frame scripts (liquid hero, NYT data chart, sticky-note flowchart, glitch title, cinema light-leak, macOS notification, brand logo outro, text-cursor VFX, 3D device mockup, …) conforming to <a href="https://github.com/heygen-com/hyperframes">heygen-com/hyperframes</a>; hand off straight to Remotion to render <code>.mp4</code>.</sub>
</td>
</tr>
</table>

## Quickstart

```bash
git clone https://github.com/nexu-io/html-anything
cd html-anything
pnpm install
pnpm dev
# → http://localhost:3000
```

Open the browser → the top bar auto-detects whichever coding-agent CLI you already have signed in → pick a template → paste content → ⌘+Enter.

**No API key required.** We reuse the session you already have logged in (Claude / Cursor / Codex / Gemini / Copilot subscriptions all work).

## Supported coding agents

On startup we scan `PATH` (including `~/.local/bin`, `~/.bun/bin`, `/opt/homebrew/bin`, `~/.npm-global/bin` — directories normally missed by GUI-launched Node) and surface every CLI we recognize:

| Agent | Detection binary | Invocation |
|---|---|---|
| **Claude Code** | `claude` | `claude -p --output-format stream-json` |
| **OpenAI Codex** | `codex` | `codex exec --json --sandbox workspace-write` |
| **Cursor Agent** | `cursor-agent` | `cursor-agent --print --output-format stream-json --force --trust` |
| **Gemini CLI** | `gemini` | `gemini --output-format stream-json --yolo` |
| **GitHub Copilot CLI** | `copilot` | `copilot --allow-all-tools --output-format json` |
| **OpenCode** | `opencode-cli` / `opencode` | `opencode run --format json --dangerously-skip-permissions -` |
| **Qwen Coder** | `qwen` | `qwen --yolo -` |
| **Aider** | `aider` | `aider --no-pretty --no-stream --yes-always --message-file -` |

> The detection strategy and per-CLI adapter shape are borrowed directly from [`nexu-io/open-design`](https://github.com/nexu-io/open-design) and [`multica-ai/multica`](https://github.com/multica-ai/multica): one privileged process spawns CLIs, JSON-line is the wire protocol, every CLI gets a thin adapter in [`src/lib/agents/argv.ts`](src/lib/agents/argv.ts).

If you've already done `claude login` / `cursor login` / `gemini auth` in your terminal, HTML Anything reuses that session. **No second copy of the API key required.**

## Skills

**75 skills under [`src/lib/templates/skills/`](src/lib/templates/skills/)**, each a folder following the Claude Code [`SKILL.md`](https://docs.anthropic.com/en/docs/claude-code/skills) convention plus an extended frontmatter (`mode` · `scenario` · `surface` · `preview` · `design_system`).

The two axes the picker uses:

- **mode** — `prototype` (web / SaaS landing / dashboard / data report / résumé / doc) · `deck` (20 horizontal-swipe presentations) · `frame` (10 Hyperframes motion frames) · `social` (4 social-card formats) · `office` (PM / engineering / finance / HR / operations document surfaces).
- **scenario** — `design` · `marketing` · `engineering` · `product` · `finance` · `hr` · `sale` · `personal`. Used to group skills in the picker.

### Web prototypes & marketing pages (prototype mode)

| Skill | Best for | Output |
|---|---|---|
| [`prototype-web`](src/lib/templates/skills/prototype-web/) | Generic web prototype (default) | Single-page HTML, 1440×900 desktop |
| [`saas-landing`](src/lib/templates/skills/saas-landing/) | SaaS landing page | Hero / features / pricing / CTA |
| [`waitlist-page`](src/lib/templates/skills/waitlist-page/) | Waitlist / early-access page | Minimal form + social proof |
| [`pricing-page`](src/lib/templates/skills/pricing-page/) | Pricing page | Multi-tier comparison tables |
| [`dashboard`](src/lib/templates/skills/dashboard/) | Admin / analytics console | Sidebar + dense data layout |
| [`docs-page`](src/lib/templates/skills/docs-page/) | Technical documentation | 3-column docs layout |
| [`blog-post`](src/lib/templates/skills/blog-post/) | Long-form blog post | Editorial layout |
| [`mobile-app`](src/lib/templates/skills/mobile-app/) | iOS / Android prototype | iPhone 15 Pro chrome |
| [`mobile-onboarding`](src/lib/templates/skills/mobile-onboarding/) | App onboarding flow | Splash · value · sign-in trio |
| [`gamified-app`](src/lib/templates/skills/gamified-app/) | Gamified app | Quest · XP · level trio |
| [`dating-web`](src/lib/templates/skills/dating-web/) | Dating / matchmaking dashboard | Left rail · KPIs · 30-day chart |
| [`magazine-poster`](src/lib/templates/skills/magazine-poster/) | Single-page magazine poster | 1080×1920 |
| [`poster-hero`](src/lib/templates/skills/poster-hero/) | Marketing poster | Single-page display poster |
| [`web-proto-editorial`](src/lib/templates/skills/web-proto-editorial/) | Editorial-style web | Serif display + grid |
| [`web-proto-brutalist`](src/lib/templates/skills/web-proto-brutalist/) | Brutalist web | Hard edges, black & white, anti-grid |
| [`web-proto-soft`](src/lib/templates/skills/web-proto-soft/) | Soft / warm web | Soft shadows, rounded, warm palette |
| [`article-magazine`](src/lib/templates/skills/article-magazine/) | Long-form magazine article | A4 / long-page |
| [`digital-eguide`](src/lib/templates/skills/digital-eguide/) | Digital e-guide | Cover + lesson spread |
| [`resume-modern`](src/lib/templates/skills/resume-modern/) | Minimal résumé | A4 210×297mm |
| [`email-marketing`](src/lib/templates/skills/email-marketing/) | Brand product-launch email | Center single-column, table fallback |
| [`wireframe-sketch`](src/lib/templates/skills/wireframe-sketch/) | Hand-drawn wireframe | Early-pass ideation |

### Decks (deck mode, 20 skills)

| Skill | Best for |
|---|---|
| [`deck-swiss-international`](src/lib/templates/skills/deck-swiss-international/) | Swiss International deck |
| [`deck-guizang-editorial`](src/lib/templates/skills/deck-guizang-editorial/) | Editorial-ink deck (from [op7418/guizang-ppt-skill](https://github.com/op7418/guizang-ppt-skill)) |
| [`deck-open-slide-canvas`](src/lib/templates/skills/deck-open-slide-canvas/) | 1920×1080 agent-native canvas (from [1weiho/open-slide](https://github.com/1weiho/open-slide)) |
| [`deck-magazine-web`](src/lib/templates/skills/deck-magazine-web/) | Magazine-style web deck |
| [`deck-hermes-cyber`](src/lib/templates/skills/deck-hermes-cyber/) | Hermes Cyber neon-luxe |
| [`deck-replit`](src/lib/templates/skills/deck-replit/) | Replit-style product walkthrough |
| [`deck-xhs-pastel`](src/lib/templates/skills/deck-xhs-pastel/) | Xiaohongshu pastel deck |
| [`deck-xhs-white`](src/lib/templates/skills/deck-xhs-white/) | Xiaohongshu pure-white deck |
| [`deck-xhs-post`](src/lib/templates/skills/deck-xhs-post/) | Xiaohongshu single-post deck |
| [`deck-tech-sharing`](src/lib/templates/skills/deck-tech-sharing/) | Tech-sharing deck |
| [`deck-product-launch`](src/lib/templates/skills/deck-product-launch/) | Product-launch event deck |
| [`deck-pitch`](src/lib/templates/skills/deck-pitch/) | Investor pitch |
| [`deck-blueprint`](src/lib/templates/skills/deck-blueprint/) | Blueprint / roadmap |
| [`deck-presenter-mode`](src/lib/templates/skills/deck-presenter-mode/) | Speaker-notes-aware |
| [`deck-course-module`](src/lib/templates/skills/deck-course-module/) | Course module deck |
| [`deck-dir-key-nav`](src/lib/templates/skills/deck-dir-key-nav/) | Directional key-nav deep browse |
| [`deck-graphify-dark`](src/lib/templates/skills/deck-graphify-dark/) | Dark, data-graphic-heavy deck |
| [`deck-obsidian-claude`](src/lib/templates/skills/deck-obsidian-claude/) | Obsidian / Claude-flavored notes |
| [`deck-safety-alert`](src/lib/templates/skills/deck-safety-alert/) | Incident / safety briefing |
| [`deck-simple`](src/lib/templates/skills/deck-simple/) | Minimal horizontal-swipe deck |

### Hyperframes video frames & VFX & device mockups (frame / vfx / mockup, 12 skills)

| Skill | Best for |
|---|---|
| [`frame-liquid-bg-hero`](src/lib/templates/skills/frame-liquid-bg-hero/) | Liquid background hero |
| [`frame-data-chart-nyt`](src/lib/templates/skills/frame-data-chart-nyt/) | NYT-style data chart |
| [`frame-flowchart-sticky`](src/lib/templates/skills/frame-flowchart-sticky/) | Sticky-note flowchart |
| [`frame-glitch-title`](src/lib/templates/skills/frame-glitch-title/) | Glitch title card |
| [`frame-light-leak-cinema`](src/lib/templates/skills/frame-light-leak-cinema/) | Cinema light-leak |
| [`frame-macos-notification`](src/lib/templates/skills/frame-macos-notification/) | macOS notification toast |
| [`frame-logo-outro`](src/lib/templates/skills/frame-logo-outro/) | Brand logo outro |
| [`motion-frames`](src/lib/templates/skills/motion-frames/) | Generic motion-design frame |
| [`video-hyperframes`](src/lib/templates/skills/video-hyperframes/) | Hyperframes frame-script schema |
| [`sprite-animation`](src/lib/templates/skills/sprite-animation/) | Pixel / 8-bit animation |
| [`vfx-text-cursor`](src/lib/templates/skills/vfx-text-cursor/) | Text-cursor VFX |
| [`mockup-device-3d`](src/lib/templates/skills/mockup-device-3d/) | 3D device-frame mockup |

> Frame scripts conform to the [`heygen-com/hyperframes`](https://github.com/heygen-com/hyperframes) spec and hand off straight to [`remotion-dev/remotion`](https://github.com/remotion-dev/remotion) to render `.mp4`.

### Social share cards (social mode)

| Skill | Best for |
|---|---|
| [`social-x-post-card`](src/lib/templates/skills/social-x-post-card/) | X / Twitter quote card (1600×900) |
| [`social-spotify-card`](src/lib/templates/skills/social-spotify-card/) | Spotify-Wrapped style card |
| [`social-reddit-card`](src/lib/templates/skills/social-reddit-card/) | Reddit thread card |
| [`social-carousel`](src/lib/templates/skills/social-carousel/) | 3-card 1080×1080 carousel |
| [`card-xiaohongshu`](src/lib/templates/skills/card-xiaohongshu/) | Xiaohongshu image-with-text card |
| [`card-twitter`](src/lib/templates/skills/card-twitter/) | Twitter pull-quote card |
| [`social-media-dashboard`](src/lib/templates/skills/social-media-dashboard/) | Social-ops dashboard |
| [`social-media-matrix`](src/lib/templates/skills/social-media-matrix/) | Multi-platform content matrix |

### Office & operations (office / doc mode)

| Skill | Scenario | Best for |
|---|---|---|
| [`doc-kami-parchment`](src/lib/templates/skills/doc-kami-parchment/) | personal | Warm-parchment editorial doc (from [tw93/kami](https://github.com/tw93/kami)) |
| [`pm-spec`](src/lib/templates/skills/pm-spec/) | product | PM spec doc + decision log |
| [`team-okrs`](src/lib/templates/skills/team-okrs/) | product | OKR scoresheet |
| [`meeting-notes`](src/lib/templates/skills/meeting-notes/) | operation | Meeting decision log |
| [`weekly-update`](src/lib/templates/skills/weekly-update/) | operation | Team weekly cadence |
| [`kanban-board`](src/lib/templates/skills/kanban-board/) | operation | Board snapshot |
| [`eng-runbook`](src/lib/templates/skills/eng-runbook/) | engineering | Incident runbook |
| [`finance-report`](src/lib/templates/skills/finance-report/) | finance | Exec finance summary |
| [`invoice`](src/lib/templates/skills/invoice/) | finance | Single-page invoice |
| [`hr-onboarding`](src/lib/templates/skills/hr-onboarding/) | hr | Role onboarding plan |
| [`data-report`](src/lib/templates/skills/data-report/) | finance / product | CSV/Excel → visual data report |
| [`live-dashboard`](src/lib/templates/skills/live-dashboard/) | operation | Live data dashboard |
| [`flowai-team-dashboard`](src/lib/templates/skills/flowai-team-dashboard/) | operation | Team workflow dashboard |
| [`ppt-keynote`](src/lib/templates/skills/ppt-keynote/) | personal | Generic Keynote-style deck |

**Adding a skill takes one folder.** Copy a similar skill, edit its `SKILL.md` frontmatter, restart `pnpm dev`, the picker shows it. See [`CONTRIBUTING.md`](CONTRIBUTING.md) for the bar a skill PR has to clear before we merge.

## Six load-bearing ideas

### 1 · We don't ship an agent. Yours is good enough.

On boot the browser calls `/api/agents`. The server scans `PATH` — including the dirs a GUI-launched Node usually misses (`~/.local/bin`, `~/.bun/bin`, `/opt/homebrew/bin`, `~/.npm-global/bin`) — and surfaces whichever CLIs it finds. Each CLI has one adapter (argv + stdin protocol + stream parser) in [`src/lib/agents/argv.ts`](src/lib/agents/argv.ts). The whole detection model is borrowed directly from [`nexu-io/open-design`](https://github.com/nexu-io/open-design) and [`multica-ai/multica`](https://github.com/multica-ai/multica): one privileged process spawns CLIs, JSON-line is the wire protocol.

### 2 · Skills are folders, not plugins.

Following Claude Code's [`SKILL.md` convention](https://docs.anthropic.com/en/docs/claude-code/skills) — `SKILL.md` + `assets/` + `references/` + `example.html`. Drop a folder into [`src/lib/templates/skills/`](src/lib/templates/skills/), restart `pnpm dev`, the picker shows it. `deck-guizang-editorial` is vendored directly from [`op7418/guizang-ppt-skill`](https://github.com/op7418/guizang-ppt-skill) with original LICENSE and authorship preserved.

### 3 · Hard constraints stop the model from freestyling.

Every template hardcodes:

- **CJK-first font stack** — `Noto Sans/Serif SC` / source-han for Chinese, `Inter` / `Manrope` for Latin.
- **8 px baseline grid** — every spacing, line-height, font-size is a multiple of 8.
- **Rounded corners · soft shadow · no pure black / pure white** — visual de-slop-ification.
- **Color contrast ≥ 4.5**, every interactive element has a real `:focus` state.
- **Must use the user's real data**, no lorem ipsum.

The discipline is lifted from [`alchaincyf/huashu-design`](https://github.com/alchaincyf/huashu-design)'s Junior-Designer mode + anti-AI-slop checklist. Constraints belong in the prompt — every `SKILL.md` writes them in.

### 4 · Streaming render = watch the AI draw.

`POST /api/convert` is SSE. The agent's stdout is line-delimited JSON; the server pulls out the text deltas and re-emits them as SSE events; the client appends to the iframe's `srcdoc`. The whole experience is the same as watching the agent type in a terminal, except the artifact is HTML, not Markdown. **Interrupt at any time** — you're not paying for a whole generation you don't want.

### 5 · One-click export = zero second-pass formatting.

- **WeChat MP** — `juice` inlines CSS + `data-tool` markers → paste into the editor, styles survive end to end.
- **X / Weibo / Xiaohongshu** — `modern-screenshot` renders the iframe to a 2× PNG → `ClipboardItem` → drop straight into the composer.
- **Zhihu** — same as above, plus `<mjx-container>` is replaced with `data-eeimg` LaTeX-image placeholders (Zhihu won't render KaTeX live — math has to be an image).
- **Download `.html`** / **download `.png`** — self-contained single file, shareable anywhere.

Mechanically inspired by [`mdnice/markdown-nice`](https://github.com/mdnice/markdown-nice) and [`gcui-art/markdown-to-image`](https://github.com/gcui-art/markdown-to-image).

### 6 · Sandboxed iframe = secure + isolated.

User-emitted HTML always renders inside `<iframe sandbox="allow-scripts allow-same-origin">`. Third-party scripts (Tailwind CDN, Google Fonts, custom animations) still execute, but cookies and localStorage stay in the iframe's own origin — the host page is never poisoned. Opening devtools only shows the iframe's DOM, so the debugging experience matches a standalone HTML file.

## Architecture

```
┌─────────────────────── Browser (Next.js 16) ──────────────────────┐
│  Editor / upload · top-bar agent picker · template picker · iframe │
└─────────────┬──────────────────────────────────┬──────────────────┘
              │ ⌘+Enter                            │
              ▼                                    ▼
     ┌─────────────────────┐            ┌──────────────────────┐
     │  GET /api/agents    │            │  POST /api/convert   │
     │  scan PATH, list    │            │  SSE — spawn CLI     │
     │  installed CLIs     │            │  pipe stdin / stdout │
     └─────────────────────┘            └──────────┬───────────┘
                                                   │ spawn + stdin pipe
                                                   ▼
                                ┌────────────────────────────────────┐
                                │  Your local coding-agent CLI       │
                                │  claude / codex / cursor-agent /   │
                                │  gemini / copilot / opencode /     │
                                │  qwen / aider                      │
                                │  → reuses your existing session    │
                                └────────────────────────────────────┘
                                                   │
                                                   ▼
                                stdout JSON-line ──► SSE event
                                                   │
                                                   ▼
                              iframe srcdoc append (live)
                                                   │
                              ⌘+C copy → ClipboardItem
                              ⌘+S download → .html / .png
```

| Layer | Stack |
|---|---|
| Frontend | Next.js 16 App Router + Turbopack · React 19 · Tailwind v4 · zustand state |
| Server routes | `GET /api/agents` (detection) · `POST /api/convert` (SSE streaming spawn) |
| Agent transport | `child_process.spawn` · one stdin/stdout adapter per CLI ([`src/lib/agents/argv.ts`](src/lib/agents/argv.ts)) |
| Browser-side processing | `juice` (CSS inlining) · `modern-screenshot` (PNG export) · `xlsx` / `papaparse` (spreadsheet parsing) · `marked` + `highlight.js` (Markdown-compatible input) · `dompurify` (XSS defense) |
| Preview sandbox | `iframe[sandbox="allow-scripts allow-same-origin"]` + `srcdoc` |
| Export targets | `.html` standalone · `.png` high-DPI · `ClipboardItem` (text/html + image/png) · WeChat-compatible inlined CSS |
| Deploy | Local `pnpm dev` · Vercel one-click for the web layer (agent stays local) |

## Export targets

| Platform | Implementation | Paste behavior |
|---|---|---|
| **WeChat MP** | `juice` inlines CSS + `data-tool` markers | Paste into editor, zero re-formatting |
| **Zhihu** | Same as WeChat + `<mjx-container>` → `data-eeimg` LaTeX image placeholder | Equations render after upload |
| **X / Weibo / Xiaohongshu** | `modern-screenshot` → 2× PNG → `ClipboardItem` | Drop straight into the composer |
| **Download `.html`** | Single-file, inlined assets | Open anywhere with a browser |
| **Download `.png`** | High-DPI screenshot | Share anywhere |

## Roadmap

- [ ] **Multi-template compare preview** — generate four candidates of the same brief, pick the best one
- [ ] **Hyperframes → mp4** — one-click hand-off of frame scripts to Remotion for real video output
- [ ] **Shared design systems** — interop with [`nexu-io/open-design`](https://github.com/nexu-io/open-design) `DESIGN.md` assets
- [ ] **Template marketplace** — community-contributed prompts & examples
- [ ] **Browser extension** — select on any page → convert to HTML template
- [ ] **History / version diff / IndexedDB archive**
- [ ] **More export targets** — WeChat Channels · Douyin captions · Notion · Linear · Telegraph

## Status

Early but real. The closed loop — **detect agent → pick skill → SSE stream → sandboxed iframe preview → one-click export** — runs end-to-end against all 8 CLIs listed above. The skill library and the `SKILL.md` hard-constraints are where most of the leverage lives, and both are stable. The picker UX, design-system metadata, and the multi-template compare flow ship daily. If something looks broken on your machine, open an issue with the agent CLI you were using and the input — those are the bug reports that move things forward fastest.

| Surface | State |
|---|---|
| Agent detection (8 CLIs) | ✅ stable |
| Skill registry + picker (75 skills) | ✅ stable |
| SSE streaming render | ✅ stable |
| Sandboxed iframe preview | ✅ stable |
| One-click WeChat / X / Zhihu / `.html` / `.png` export | ✅ stable |
| CSV / Excel / JSON / SQL format auto-detect | ✅ stable |
| Multi-template compare (generate 4, pick 1) | 🛠 in progress |
| Hyperframes → `.mp4` one-click handoff to Remotion | 🛠 in progress |
| Browser extension (select on any page → convert) | ⏳ planned |
| History / version diff / IndexedDB archive | ⏳ planned |
| Skill marketplace (`install <github-repo>`) | ⏳ planned |

## Contributing

Issues, PRs, new skills, new agent adapters, new export targets, and translations are all welcome. The highest-leverage contributions are usually **one folder, one Markdown file, or one PR-sized adapter** — small surface area, big leverage. Pick the slot that matches what you want to add:

- **Add a skill** — drop a folder into [`src/lib/templates/skills/`](src/lib/templates/skills/) with `SKILL.md` + `example.html` (+ optional `assets/` and `references/`). The picker auto-discovers it after `pnpm dev` restart. The `SKILL.md` frontmatter has to set `mode` · `scenario` · `surface` · `preview` · `design_system` — copy a neighbour and edit.
- **Wire up a new coding-agent CLI** — one entry in [`src/lib/agents/argv.ts`](src/lib/agents/argv.ts) covering: detection binary, argv builder, stdin/stdout protocol, stream parser. Detection is exercised by [`src/app/api/agents/`](src/app/api/agents/) and the spawn loop by [`src/app/api/convert/`](src/app/api/convert/).
- **Add an export target** — drop a module under [`src/lib/export/`](src/lib/export/) (next to `wechat.ts` / `image.ts` / `clipboard.ts`) and add the button to the export menu. WeChat Channels · Douyin captions · Notion · Linear · Telegraph · RSS are all open.
- **Sharpen a `SKILL.md`** — strengthen the hard-constraints (CJK font stack, 8 px baseline, contrast ≥ 4.5, must-use-real-data), add a 5-dimensional self-critique, swap in a better palette. Anti-AI-slop discipline is the most underrated PR shape we accept.
- **Translations & docs** — [`README.zh-CN.md`](README.zh-CN.md) and [`CONTRIBUTING.zh-CN.md`](CONTRIBUTING.zh-CN.md) are kept in parallel with the English files; please update both.

Full walkthrough, bar-for-merging, code style, and what we **don't** accept → [`CONTRIBUTING.md`](CONTRIBUTING.md) ([简体中文](CONTRIBUTING.zh-CN.md)).

## References & lineage

Every external project this repo borrows from — what we take from each, and where it lands in the tree.

| Project | Role here |
|---|---|
| [**`nexu-io/open-design`**](https://github.com/nexu-io/open-design) | The agent-detection layer, the `DESIGN.md` design-system schema, and the `SKILL.md` skill protocol. [`src/lib/agents/argv.ts`](src/lib/agents/argv.ts) and [`src/lib/templates/skills/`](src/lib/templates/skills/) mirror this architecture verbatim. |
| [**`multica-ai/multica`**](https://github.com/multica-ai/multica) | Daemon-and-runtime architecture: one privileged process spawns CLIs, JSON-line is the wire protocol, every CLI gets a thin per-adapter shape. |
| [**`alchaincyf/huashu-design`**](https://github.com/alchaincyf/huashu-design) | Anti-AI-slop discipline — Junior-Designer mode, 5-step brand-asset protocol, contrast-≥-4.5 / 8 px baseline-grid / must-use-real-data rules. Hard-coded into every [`SKILL.md`](src/lib/templates/skills/) frontmatter. |
| [`alchaincyf/huashu-md-html`](https://github.com/alchaincyf/huashu-md-html) | Proof that end-to-end WeChat / Zhihu paste-compatibility is solvable. Reference for [`src/lib/export/wechat.ts`](src/lib/export/wechat.ts). |
| [`mdnice/markdown-nice`](https://github.com/mdnice/markdown-nice) | `juice`-inlined-CSS pipeline → WeChat / Zhihu paste with zero re-formatting. Drives [`src/lib/export/wechat.ts`](src/lib/export/wechat.ts). |
| [`mdnice/markdown-resume`](https://github.com/mdnice/markdown-resume) | A4-formatted résumé inspiration → [`resume-modern`](src/lib/templates/skills/resume-modern/). |
| [`gcui-art/markdown-to-image`](https://github.com/gcui-art/markdown-to-image) | iframe → high-DPI PNG export, replicated with `modern-screenshot` in [`src/lib/export/image.ts`](src/lib/export/image.ts). |
| [**`op7418/guizang-ppt-skill`**](https://github.com/op7418/guizang-ppt-skill) | Magazine-ink editorial deck integrated verbatim as [`deck-guizang-editorial`](src/lib/templates/skills/deck-guizang-editorial/) and the Swiss variant [`deck-swiss-international`](src/lib/templates/skills/deck-swiss-international/). Original LICENSE + authorship preserved. |
| [**`tw93/kami`**](https://github.com/tw93/kami) | Warm-parchment monochrome editorial document system → [`doc-kami-parchment`](src/lib/templates/skills/doc-kami-parchment/). |
| [**`1weiho/open-slide`**](https://github.com/1weiho/open-slide) | 1920×1080 agent-native canvas convention → [`deck-open-slide-canvas`](src/lib/templates/skills/deck-open-slide-canvas/). |
| [`heygen-com/hyperframes`](https://github.com/heygen-com/hyperframes) | Frame-script schema for the entire `frame-*` / `vfx-*` / `mockup-*` / `social-*` family. Output hands straight off to Remotion to render `.mp4`. |
| [`remotion-dev/remotion`](https://github.com/remotion-dev/remotion) | Target renderer for Hyperframes frame scripts. |
| [`jimliu/baoyu-skills`](https://github.com/jimliu/baoyu-skills) | Practical skills collection — reference catalog for picker categorization. |

Each bundled upstream skill retains its original LICENSE and authorship inside its own `src/lib/templates/skills/<skill>/` folder.

## Stay in the loop

Follow [**@nexudotio**](https://x.com/nexudotio) on X for release notes, new skills, and the occasional behind-the-scenes thread on what's shipping next. The [Discord](https://github.com/nexu-io/open-design#community) is where the bigger conversations happen — both are run by the upstream `open-design` team, and HTML Anything piggybacks on the same channels.

## Contributors

Thanks to everyone who has filed an issue, opened a PR, or added a skill / agent adapter / export target. Every real contribution counts, and the wall below is the easiest way to say so out loud.

<a href="https://github.com/nexu-io/html-anything/graphs/contributors">
  <img src="https://contrib.rocks/image?repo=nexu-io/html-anything" alt="HTML Anything contributors" />
</a>

If you've shipped your first PR — welcome. The [`good-first-issue` / `help-wanted`](https://github.com/nexu-io/html-anything/issues?q=is%3Aissue+is%3Aopen+label%3A%22good+first+issue%22%2C%22help+wanted%22) labels are the entry point.

## Star History

<a href="https://star-history.com/#nexu-io/html-anything&Date">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="https://api.star-history.com/svg?repos=nexu-io/html-anything&type=Date&theme=dark" />
    <source media="(prefers-color-scheme: light)" srcset="https://api.star-history.com/svg?repos=nexu-io/html-anything&type=Date" />
    <img alt="HTML Anything star history" src="https://api.star-history.com/svg?repos=nexu-io/html-anything&type=Date" />
  </picture>
</a>

If the curve bends up, that's the signal we look for. ★ this repo to push it.

## License

Apache-2.0 © 2026 HTML Anything contributors. See [`LICENSE`](LICENSE).

Bundled work retains its original license and authorship attribution — see the per-skill `LICENSE` / `README.md` inside each `src/lib/templates/skills/<skill>/` folder for what it inherits from upstream.
