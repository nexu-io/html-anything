# Google Antigravity CLI Integration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add `agy` (Google Antigravity CLI) as a selectable agent in html-anything, so users with `agy` on their PATH can generate HTML with it.

**Architecture:** Three surgical edits — one `AgentDef` object added to `detect.ts`, one `buildArgv` case + one `||` token added to `argv.ts`. `invoke.ts` is untouched because the existing `stdin` protocol path already handles everything. The output parser reuses the existing `cursor-agent / gemini` branch verbatim.

**Tech Stack:** TypeScript, Vitest, Node.js `child_process` (via existing `invoke.ts`).

---

## File Map

| File | Action | What changes |
|------|--------|-------------|
| `next/src/lib/agents/detect.ts` | Modify | Add `AgentDef` for `antigravity` after the `aider` entry, before the ACP family comment |
| `next/src/lib/agents/argv.ts` | Modify | Add `buildArgv` case for `antigravity`; extend line 328's `||` condition to include `antigravity` |
| `next/src/lib/agents/__tests__/antigravity.test.ts` | Create | 6 unit tests — parser correctness + AgentDef integrity |

---

## Task 1: Write failing tests

**Files:**
- Create: `next/src/lib/agents/__tests__/antigravity.test.ts`

- [ ] **Step 1: Create the test file**

```typescript
// next/src/lib/agents/__tests__/antigravity.test.ts
import { describe, it, expect } from "vitest";
import { makeParser } from "../argv";
import { AGENTS, DEFAULT_MODEL } from "../detect";

// ── Parser tests ─────────────────────────────────────────────────────────────

describe("antigravity parser — stream_event text_delta", () => {
  it("emits a delta for a text_delta stream event", () => {
    const parse = makeParser("antigravity");
    const line = JSON.stringify({
      type: "stream_event",
      event: {
        type: "content_block_delta",
        delta: { type: "text_delta", text: "hello" },
      },
    });
    expect(parse(line)).toEqual([{ kind: "delta", text: "hello" }]);
  });
});

describe("antigravity parser — assistant body fallback", () => {
  it("emits delta from assistant body when no stream_event preceded it", () => {
    const parse = makeParser("antigravity");
    const line = JSON.stringify({
      type: "assistant",
      message: {
        content: [{ type: "text", text: "hello" }],
      },
    });
    expect(parse(line)).toEqual([{ kind: "delta", text: "hello" }]);
  });

  it("suppresses assistant body when stream_event already emitted text", () => {
    const parse = makeParser("antigravity");
    // First call: stream event sets sawStreamEventText = true
    parse(
      JSON.stringify({
        type: "stream_event",
        event: {
          type: "content_block_delta",
          delta: { type: "text_delta", text: "hello" },
        },
      }),
    );
    // Second call: assistant body should be suppressed (dedup)
    const result = parse(
      JSON.stringify({
        type: "assistant",
        message: {
          content: [{ type: "text", text: "hello" }],
        },
      }),
    );
    expect(result.filter((p) => p.kind === "delta")).toHaveLength(0);
  });
});

describe("antigravity parser — non-JSON input", () => {
  it("returns noise and does not throw for a plain-text line", () => {
    const parse = makeParser("antigravity");
    expect(() => parse("some plain text")).not.toThrow();
    expect(parse("some plain text")).toEqual([{ kind: "noise" }]);
  });
});

// ── AgentDef integrity ────────────────────────────────────────────────────────

describe("antigravity AgentDef", () => {
  const def = AGENTS.find((a) => a.id === "antigravity");

  it("exists in AGENTS", () => {
    expect(def).toBeDefined();
  });

  it("has bin === 'agy'", () => {
    expect(def?.bin).toBe("agy");
  });

  it("has DEFAULT_MODEL as first fallbackModel", () => {
    expect(def?.fallbackModels[0]).toEqual(DEFAULT_MODEL);
  });
});
```

- [ ] **Step 2: Run tests — verify they all FAIL**

```bash
pnpm -F @html-anything/next test -- --reporter=verbose src/lib/agents/__tests__/antigravity.test.ts
```

Expected: 6 failures. `makeParser("antigravity")` will return `[]` for all lines (no branch matches), and `AGENTS.find(a => a.id === "antigravity")` will return `undefined`.

---

## Task 2: Add AgentDef to `detect.ts`

**Files:**
- Modify: `next/src/lib/agents/detect.ts`

- [ ] **Step 1: Insert the AgentDef after the `aider` entry**

Find this block in `detect.ts` (around line 199–208):

```typescript
  {
    id: "aider",
    label: "Aider",
    bin: "aider",
    vendor: "Aider",
    fallbackModels: [
      DEFAULT_MODEL,
      { id: "claude-sonnet-4-5", label: "claude-sonnet-4-5" },
      { id: "gpt-5", label: "gpt-5" },
      { id: "deepseek/deepseek-chat", label: "deepseek/deepseek-chat" },
    ],
  },

  // ACP family — detection-only. Models still surfaced for UI completeness.
```

Add the new entry between the `aider` closing brace and the ACP family comment:

```typescript
  {
    id: "aider",
    label: "Aider",
    bin: "aider",
    vendor: "Aider",
    fallbackModels: [
      DEFAULT_MODEL,
      { id: "claude-sonnet-4-5", label: "claude-sonnet-4-5" },
      { id: "gpt-5", label: "gpt-5" },
      { id: "deepseek/deepseek-chat", label: "deepseek/deepseek-chat" },
    ],
  },
  {
    id: "antigravity",
    label: "Google Antigravity",
    bin: "agy",
    envOverride: "ANTIGRAVITY_BIN",
    vendor: "Google",
    fallbackModels: [
      DEFAULT_MODEL,
      { id: "gemini-2.5-pro",              label: "gemini-2.5-pro" },
      { id: "gemini-2.5-flash",            label: "gemini-2.5-flash" },
      { id: "gemini-2.5-flash-lite",       label: "gemini-2.5-flash-lite" },
      { id: "openai/gpt-5",                label: "openai/gpt-5" },
      { id: "anthropic/claude-sonnet-4-6", label: "anthropic/claude-sonnet-4-6" },
    ],
  },

  // ACP family — detection-only. Models still surfaced for UI completeness.
```

- [ ] **Step 2: Run typecheck**

```bash
pnpm -F @html-anything/next typecheck
```

Expected: no errors.

- [ ] **Step 3: Run AgentDef tests — verify they now PASS**

```bash
pnpm -F @html-anything/next test -- --reporter=verbose src/lib/agents/__tests__/antigravity.test.ts
```

Expected: the 3 `antigravity AgentDef` tests pass; the 3 parser tests still fail (parser not wired up yet).

---

## Task 3: Add `buildArgv` case and parser branch to `argv.ts`

**Files:**
- Modify: `next/src/lib/agents/argv.ts`

- [ ] **Step 1: Add `buildArgv` case for `antigravity`**

Find the `case "gemini":` block (around line 72):

```typescript
    case "gemini":
      return [
        "--output-format",
        "stream-json",
        "--yolo",
        ...(model ? ["--model", model] : []),
      ];
```

Insert a new case immediately before it:

```typescript
    case "antigravity":
      return [
        "--output-format",
        "stream-json",
        "--yolo",
        ...(model ? ["--model", model] : []),
      ];
    case "gemini":
      return [
        "--output-format",
        "stream-json",
        "--yolo",
        ...(model ? ["--model", model] : []),
      ];
```

- [ ] **Step 2: Extend `parseLineWithState` parser condition**

Find this line (around line 328):

```typescript
  if (agent === "cursor-agent" || agent === "gemini") {
```

Change it to:

```typescript
  if (agent === "cursor-agent" || agent === "gemini" || agent === "antigravity") {
```

- [ ] **Step 3: Run typecheck**

```bash
pnpm -F @html-anything/next typecheck
```

Expected: no errors.

- [ ] **Step 4: Run all parser tests — verify all 6 now PASS**

```bash
pnpm -F @html-anything/next test -- --reporter=verbose src/lib/agents/__tests__/antigravity.test.ts
```

Expected: all 6 tests pass.

---

## Task 4: Run full test suite and commit

**Files:** none new

- [ ] **Step 1: Run the full app test suite**

```bash
pnpm -F @html-anything/next test
```

Expected: all tests pass, no regressions. (Existing export tests and extract-html tests should be unaffected.)

- [ ] **Step 2: Run typecheck one final time**

```bash
pnpm -F @html-anything/next typecheck
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add \
  next/src/lib/agents/detect.ts \
  next/src/lib/agents/argv.ts \
  next/src/lib/agents/__tests__/antigravity.test.ts
git commit -m "feat(agents): add Google Antigravity CLI (agy) support"
```

---

## Self-review against spec

| Spec requirement | Covered by |
|-----------------|------------|
| `AgentDef` with `id: "antigravity"`, `bin: "agy"`, `envOverride: "ANTIGRAVITY_BIN"` | Task 2 |
| `fallbackModels` starting with `DEFAULT_MODEL`, includes Gemini + third-party models | Task 2 |
| `buildArgv` case: `--output-format stream-json --yolo [--model]` | Task 3 Step 1 |
| Parser reuses `cursor-agent/gemini` branch | Task 3 Step 2 |
| Unit tests: stream_event delta, assistant fallback, dedup, non-JSON noise | Task 1 |
| Unit tests: AgentDef id, bin, DEFAULT_MODEL first | Task 1 |
| `invoke.ts` not touched | ✓ (no task modifies it) |
| E2E tests: not added | ✓ (explicitly out of scope) |
