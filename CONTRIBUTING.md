# Contributing to HTML Anything

Thanks for thinking about contributing. HTML Anything is small on purpose — most of the value lives in **files** (skill folders, prompt fragments, agent adapters) rather than framework code. The highest-leverage contributions are usually one folder, one Markdown file, or a ten-line adapter.

This guide tells you exactly where to look for each type of contribution and what bar a PR has to clear before we merge.

<p align="center"><b>English</b> · <a href="CONTRIBUTING.zh-CN.md">简体中文</a></p>

---

## Three things you can ship in one afternoon

| If you want to… | You're really adding | Where it lives | Ship size |
|---|---|---|---|
| Make HTML Anything render a new kind of artifact (an invoice, a job posting, an iOS Settings screen…) | a **Skill** | [`src/lib/templates/skills/<your-skill>/`](src/lib/templates/skills/) | one folder, ~3 files |
| Hook up a new coding-agent CLI | an **Agent adapter** | [`src/lib/agents/argv.ts`](src/lib/agents/argv.ts) + [`src/lib/agents/detect.ts`](src/lib/agents/detect.ts) | ~10 lines in one array |
| Add a new export target (WeChat Channels, Douyin captions, Notion, …) | an **Export adapter** | [`src/components/drafts-menu.tsx`](src/components/drafts-menu.tsx) + helper under `src/lib/export/` | one component + one helper |
| Add a feature, fix a bug, refactor the streaming parser | code | `src/app/`, `src/lib/`, `src/components/` | normal PR |
| Improve docs, port a section into another language, fix typos | docs | `README.md`, `README.zh-CN.md`, this file | one PR |

If you're not sure which bucket your idea is in, [open an issue first](https://github.com/nexu-io/html-anything/issues/new) and we'll point you at the right surface.

---

## Local setup

```bash
git clone https://github.com/nexu-io/html-anything.git
cd html-anything
pnpm install
pnpm dev                  # next dev — http://localhost:3000
pnpm build                # next build, when verifying a release-shaped bundle
```

Node `~20` and `pnpm` are required. macOS, Linux, and WSL2 are the primary paths. Native Windows should work but isn't a primary target — file an issue if it doesn't.

Before you push, make sure you have **at least one coding-agent CLI logged in** (`claude login`, `cursor login`, `gemini auth`, etc.) so you can actually run an end-to-end generation. PRs that touch the streaming or agent layer are expected to include a screenshot or log snippet showing it worked.

> **A note on this project.** It is a normal Next.js 16 App Router app — no daemon, no Electron shell, no extra processes. Everything happens in `next dev`: server routes spawn the local CLI, stream stdout back as SSE, and the browser appends into an iframe `srcdoc`. If you find yourself wanting to introduce a separate long-running process, please open a discussion first.

---

## Adding a new Skill

A skill is a folder under [`src/lib/templates/skills/`](src/lib/templates/skills/) with a `SKILL.md` at the root, following Claude Code's [`SKILL.md` convention][skill] plus a small extended frontmatter that the picker reads. **No registration step.** Drop the folder in, restart `pnpm dev`, the picker shows it.

### Skill folder layout

```text
src/lib/templates/skills/your-skill/
├── SKILL.md            # required — prompt body + frontmatter
├── example.html        # required — what the agent should produce, hand-authored
├── assets/             # optional — fonts, images, reusable CSS, layout fragments
└── references/         # optional — design-system snippets, references the agent should Read
```

### `SKILL.md` shape

```markdown
---
name: your-skill
description: One sentence shown in the picker preview.
mode: prototype          # prototype | deck | frame | social | office | doc | mockup | vfx
scenario: marketing      # design | marketing | engineering | product | finance | hr | sale | personal
surface: desktop         # desktop | mobile | A4 | 1080x1920 | 1600x900 | 1920x1080 | …
preview:
  type: iframe           # iframe | image | deck
  thumbnail: docs/screenshots/skills/your-skill.png   # optional, used in the README showcase grid
design_system:
  requires: optional     # required | optional | none
featured: false          # set true if this should appear in "Showcase examples"
example_prompt: |
  Three-sentence example prompt that demonstrates the kind of input this skill is for.
---

# Your Skill

<one-paragraph identity / discipline statement — voice, intent, what the agent must commit to>

## Hard constraints
- 8 px baseline grid · all spacing / line-height / font-size as multiples of 8.
- CJK-first font stack: `"Noto Sans SC", "PingFang SC", "Source Han Sans"`. Latin: `"Inter", "Manrope"`.
- Color contrast ≥ 4.5. Real `:focus` state on every interactive element.
- Must use the user's real data. No `lorem ipsum`. No invented metrics. No purple gradients.

## Layout

<the structure / sections / hierarchy the agent should produce, with concrete tokens
 — sizes, ratios, named slots — not vague aesthetic prose>

## What "good" looks like
- <one-line positive example>
- <another>

## What "bad" looks like
- <one-line negative example, mirror of the slop blacklist if relevant>
- <another>
```

### Bar for merging a new skill

1. **Real `example.html` ships in the folder.** Hand-author it once — the agent has a target to copy. PRs without one get bounced.
2. **The example renders in the browser** (`pnpm dev` → pick the skill → ⌘+Enter → screenshot). Attach the screenshot to the PR.
3. **Hard constraints exist and are specific.** Vague directives ("use modern typography") are not constraints. Real ones look like "Inter 96 / 64 / 40 / 24 / 16 px, 8 px grid, max two weights per slide".
4. **No `lorem ipsum`** anywhere in the example. If the example uses placeholder data, it must be plausibly-real placeholder data.
5. **Slug uses ASCII lowercase with dashes** — `deck-swiss-international`, `social-x-post-card`. Mirror the 75 existing folders.
6. **If you vendored work from another repo**, the original `LICENSE` and authorship attribution have to ship inside your skill folder. Example: `src/lib/templates/skills/deck-guizang-editorial/LICENSE` preserves the original op7418 license verbatim.

### Picker grouping

The picker organizes skills along two axes. Pick values that already exist where possible — only introduce a new value if your skill genuinely doesn't fit:

- **`mode`** — `prototype` · `deck` · `frame` · `social` · `office` · `doc` · `mockup` · `vfx`.
- **`scenario`** — `design` · `marketing` · `engineering` · `product` · `finance` · `hr` · `sale` · `personal`.

---

## Adding a new coding-agent CLI

Hooking up a new agent (e.g. some new shop's `foo-coder` CLI) is one entry in [`src/lib/agents/argv.ts`](src/lib/agents/argv.ts):

```ts
{
  id: 'foo',
  name: 'Foo Coder',
  bin: 'foo',
  detect: { args: ['--version'] },
  build: (prompt: string) => ({
    args: ['exec', '-p', prompt],
    stdin: null,                     // or 'prompt' if the CLI reads from stdin
  }),
  stream: 'plain',                   // 'plain' | 'json-event' | 'claude-stream-json'
}
```

That's it. `/api/agents` will detect it on `PATH`, the top-bar picker shows it, the chat path works through the same SSE pipeline. If the CLI emits **typed events** (like Claude Code's `--output-format stream-json`), add a parser in [`src/lib/agents/invoke.ts`](src/lib/agents/invoke.ts) and set `stream: 'claude-stream-json'`.

### Bar for merging an agent adapter

1. **A real session works end-to-end.** Run `pnpm dev`, pick your agent, generate any skill's `example_prompt`, and paste the SSE log into the PR description showing it streamed an artifact through.
2. **`PATH` detection works on macOS, Linux, and WSL.** The scanner already includes `~/.local/bin` · `~/.bun/bin` · `/opt/homebrew/bin` · `~/.npm-global/bin`; if your CLI lives somewhere else, add the dir to the scan list.
3. **The README's "Supported coding agents" table gets one row** in both `README.md` and `README.zh-CN.md`.
4. **Stream parser is reusable.** If the CLI emits the same JSON-line shape as another adapter, share the parser — don't fork.

---

## Adding a new export target

Export targets live in two places: a helper under `src/lib/export/` that produces the bytes (string for `.html`, Blob for `.png`, `ClipboardItem` for paste), and a menu entry in [`src/components/drafts-menu.tsx`](src/components/drafts-menu.tsx) that wires it into the UI.

### Bar for merging an export target

1. **Round-trip test in the target platform.** Paste / upload the output into the platform itself (WeChat editor, X composer, Zhihu editor) and screenshot the result in the PR.
2. **No platform credentials in code.** If the target needs an API key, the user supplies it in settings; we don't ship one.
3. **Output is self-contained.** `.html` exports inline their CSS via `juice`; PNG exports use `modern-screenshot` at 2×.

---

## Code style

We're not pedantic about formatting (Prettier on save is fine), but two rules are non-negotiable because they show up in the prompt stack and the user-facing API:

1. **Single quotes in TS/TSX.** Strings are single-quoted unless escaping makes them ugly. The codebase is already consistent — please match.
2. **Comments in English.** Even if the PR is translating something into 中文, code comments stay in English so we can keep one set of greppable references.

Beyond that:

- **Don't narrate.** No `// import the module`, no `// loop through items`. If the code reads obviously, the comment is noise. Save comments for non-obvious intent or constraints the code can't express.
- **TypeScript for `src/`.** No new top-level `.js` files unless there's a compelling reason.
- **No new top-level dependencies** without a paragraph in the PR description on what we get vs. what bytes we ship. The dep list in [`package.json`](package.json) is small on purpose.
- **Run `pnpm build`** before pushing structural changes. Type errors block merge.

---

## Commits & pull requests

- **One concern per PR.** Adding a skill + refactoring the SSE parser + bumping a dep is three PRs.
- **Title is imperative + scope.** `add deck-product-launch skill`, `fix SSE backpressure when CLI hangs`, `docs: clarify skill frontmatter`.
- **Body explains the why.** "What does this do" is usually obvious from the diff; "why does this need to exist" rarely is.
- **Reference an issue** if there is one. If there isn't and the PR is non-trivial, open one first so we can agree the change is wanted before you spend the time.
- **No squash-during-review.** Push fixups; we'll squash on merge.
- **No force-push to a shared branch** unless the reviewer asked.

We don't enforce a CLA. Apache-2.0 covers us; your contribution is licensed under the same.

---

## Reporting bugs

Open an issue with:

- What you ran (the exact `pnpm dev` invocation, or which UI button you clicked).
- Which agent CLI was selected (Claude Code? Cursor Agent? …).
- The skill that triggered it.
- The relevant **server log tail** — most "the artifact never rendered" reports get diagnosed in 30 seconds when we can see `spawn ENOENT` or the CLI's actual error.
- A screenshot if it's UI.

For prompt-stack bugs ("the agent emitted a purple gradient hero, the constraint in `SKILL.md` was supposed to forbid that"), include the **full assistant message** so we can see whether the violation was the model or the prompt.

---

## Asking questions

- Architecture question, design question, "is this a bug or a misuse" → [GitHub Discussions](https://github.com/nexu-io/html-anything/discussions) (preferred — searchable for the next person).
- "How do I write a skill that does X" → open a discussion. We'll answer it and turn the answer into an entry in this guide if the pattern is missing.

---

## What we don't accept

To keep the project focused, please don't open PRs that:

- **Vendor a model runtime.** HTML Anything's whole bet is "your existing CLI is enough". We don't ship `pi-ai`, OpenAI keys, model loaders, or hosted inference proxies.
- **Rewrite the frontend away from the current stack without prior discussion.** Next.js 16 App Router + React 19 + Tailwind v4 + TypeScript is the line. No Astro, Solid, Svelte, or other framework rewrites unless maintainers explicitly want that migration.
- **Replace the SSE streaming model with WebSocket / long-polling.** SSE + iframe `srcdoc` append is the simplest thing that ships a live render; we keep it.
- **Add telemetry / analytics / phone-home.** HTML Anything is local-first. The only outbound calls are to the agent CLI on your laptop, plus whatever the generated HTML itself references (Tailwind CDN, Google Fonts).
- **Bundle a binary** without a license file and authorship attribution next to it.
- **Add a skill whose `example.html` is empty / placeholder / clearly model-generated without review.** A skill is judged by what its example renders; an empty example is rejected immediately.

If you're not sure whether your idea fits, open a discussion before writing the code.

---

## Localization maintenance

The repo ships two languages at parity: English (`README.md`, `CONTRIBUTING.md`) and 简体中文 (`README.zh-CN.md`, `CONTRIBUTING.zh-CN.md`). When adding or renaming a skill, agent, or export target:

- Update **both** READMEs' tables.
- Update **both** CONTRIBUTING docs if your change introduces a new contribution surface or a new bar a PR has to clear.
- **Skill prompt bodies stay in their source language.** Don't translate `SKILL.md` — it's part of the prompt stack the agent reads, and keeping one source language avoids multiplying prompt QA across locales.
- Daemon error messages, file names, and agent-generated artifact text are known limitations unless a PR explicitly scopes them.

---

## License

By contributing, you agree your contribution is licensed under the [Apache-2.0 License](LICENSE) of this repository.

Vendored work retains its original license and authorship attribution — see each `src/lib/templates/skills/<skill>/` folder's own `LICENSE` / `README.md` for what it inherits from upstream. The most prominent example is [`src/lib/templates/skills/deck-guizang-editorial/`](src/lib/templates/skills/deck-guizang-editorial/), which retains the original license and authorship attribution to [op7418](https://github.com/op7418).

[skill]: https://docs.anthropic.com/en/docs/claude-code/skills
