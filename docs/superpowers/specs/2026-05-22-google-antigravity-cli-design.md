# Google Antigravity CLI Integration Design

**Date:** 2026-05-22
**Status:** Approved
**Scope:** Add `agy` (Google Antigravity CLI) as a supported agent in html-anything

---

## Problem

html-anything supports 8+ AI coding CLIs but does not support Google Antigravity CLI (`agy`). Users who have `agy` installed cannot use it as an agent to generate HTML.

---

## Decision

Integrate Antigravity CLI using **Approach A: mirror Gemini CLI format**.

Antigravity is a Google product and very likely reuses the same `--output-format stream-json` NDJSON envelope as Gemini CLI. This lets us reuse the existing `cursor-agent/gemini` parser branch with a one-line change, minimising implementation risk.

If the actual output format differs from Gemini's, only `parseLineWithState` in `argv.ts` needs patching — the rest of the integration is format-agnostic.

---

## Architecture

Three files change. `invoke.ts` is untouched.

```
next/src/lib/agents/
├── detect.ts   ← add AgentDef (binary, env override, model list)
├── argv.ts     ← add buildArgv case + extend || condition in parseLineWithState
└── invoke.ts   ← no change (stdin protocol already fully supported)
```

### Why no changes to `invoke.ts`

`invoke.ts` already handles the `stdin` protocol end-to-end: it writes the prompt to `child.stdin`, reads stdout line by line, and routes each parsed event to the store. Adding a new `stdin` agent requires zero changes here.

---

## Detailed Design

### 1. `detect.ts` — AgentDef

Add the following entry to the `AGENTS` array, placed after `gemini` (same vendor family) and before the ACP family block:

```typescript
{
  id: "antigravity",
  label: "Google Antigravity",
  bin: "agy",
  envOverride: "ANTIGRAVITY_BIN",
  vendor: "Google",
  // protocol omitted → defaults to "stdin"
  fallbackModels: [
    DEFAULT_MODEL,
    { id: "gemini-2.5-pro",              label: "gemini-2.5-pro" },
    { id: "gemini-2.5-flash",            label: "gemini-2.5-flash" },
    { id: "gemini-2.5-flash-lite",       label: "gemini-2.5-flash-lite" },
    { id: "openai/gpt-5",                label: "openai/gpt-5" },
    { id: "anthropic/claude-sonnet-4-6", label: "anthropic/claude-sonnet-4-6" },
  ],
},
```

**Key decisions:**
- `envOverride: "ANTIGRAVITY_BIN"` — consistent with every other agent; lets users point to a non-PATH binary via Settings
- Third-party model ids use `provider/model` slash format, matching the opencode convention. Replace with confirmed ids once documented.
- No `fallbackBins` — `agy` is short and no known forks exist

### 2. `argv.ts` — Command-line flags

Add a `buildArgv` case:

```typescript
case "antigravity":
  return [
    "--output-format", "stream-json",
    "--yolo",
    ...(model ? ["--model", model] : []),
  ];
```

Identical to the Gemini CLI case. `--output-format stream-json` enables NDJSON streaming; `--yolo` suppresses interactive confirmation prompts required for non-interactive use.

### 3. `argv.ts` — Output parser

Extend the existing `cursor-agent / gemini` parser branch with one token:

```typescript
// before
if (agent === "cursor-agent" || agent === "gemini") {

// after
if (agent === "cursor-agent" || agent === "gemini" || agent === "antigravity") {
```

The branch already handles:
- `stream_event` → `content_block_delta` → `text_delta` (streaming incremental deltas)
- `assistant` message body fallback (when no stream events preceded it)
- `rescueHtmlFromToolUse` (recovers HTML from Write tool calls)
- `sawStreamEventText` deduplication (prevents double-output when both stream events and the final assistant message are present)

### 4. `envFor` — No change

Gemini CLI injects `GEMINI_CLI_TRUST_WORKSPACE=true`. Antigravity has no known equivalent requirement. If one is discovered, add a case to `envFor` in `argv.ts`.

---

## Model List

| Model ID | Label | Notes |
|----------|-------|-------|
| `default` | Default (CLI config) | Synthetic entry — no `--model` flag |
| `gemini-2.5-pro` | gemini-2.5-pro | Google flagship |
| `gemini-2.5-flash` | gemini-2.5-flash | Google balanced |
| `gemini-2.5-flash-lite` | gemini-2.5-flash-lite | Google fast/cheap |
| `openai/gpt-5` | openai/gpt-5 | Third-party placeholder |
| `anthropic/claude-sonnet-4-6` | anthropic/claude-sonnet-4-6 | Third-party placeholder |

Third-party model ids are placeholders. Replace with confirmed ids from Antigravity's documentation before shipping.

---

## Testing

New file: `next/src/lib/agents/__tests__/antigravity.test.ts`

### Parser unit tests

| Test | Input | Expected output |
|------|-------|-----------------|
| stream_event text_delta | `{"type":"stream_event","event":{"type":"content_block_delta","delta":{"type":"text_delta","text":"hello"}}}` | `[{kind:"delta", text:"hello"}]` |
| assistant body fallback (no prior stream_event) | `{"type":"assistant","message":{"content":[{"type":"text","text":"hello"}]}}` | `[{kind:"delta", text:"hello"}]` |
| assistant body dedup (with prior stream_event) | same assistant line, after a stream_event | `[]` (suppressed) |
| non-JSON line | `some plain text` | `[{kind:"noise"}]` — no crash |

### AgentDef integrity assertions

- `AGENTS` contains an entry with `id === "antigravity"`
- `fallbackModels[0]` is `DEFAULT_MODEL`
- `bin === "agy"`

### E2E

No new E2E tests. Agent invocation depends on a locally installed binary — not suitable for CI.

---

## Risk & Unknowns

| Risk | Likelihood | Mitigation |
|------|-----------|------------|
| Antigravity output format differs from Gemini | Medium | Only `parseLineWithState` needs patching; all other integration code is format-agnostic |
| Third-party model ids are wrong | High | They are marked as placeholders; update before release |
| `--yolo` flag name differs | Low | Verify against `agy --help`; fall back to `--yes` or `--dangerously-skip-permissions` |
| `--output-format stream-json` flag differs | Low | Verify against `agy --help`; the Gemini pattern is well-established for Google CLIs |

---

## File Change Summary

| File | Change |
|------|--------|
| `next/src/lib/agents/detect.ts` | Add 1 `AgentDef` object to `AGENTS` array |
| `next/src/lib/agents/argv.ts` | Add 1 `buildArgv` case + extend 1 `\|\|` condition |
| `next/src/lib/agents/__tests__/antigravity.test.ts` | New file, 6 test cases |
| `next/src/lib/agents/invoke.ts` | No change |
