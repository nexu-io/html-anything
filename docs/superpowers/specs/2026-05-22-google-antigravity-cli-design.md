# Google Antigravity CLI Integration Design

**Date:** 2026-05-22
**Status:** Implemented — updated 2026-08-03 to match the shipped adapter
**Scope:** Support the Google Antigravity CLI (agy) as an html-anything agent

---

## Problem

Users with agy installed need to select it as a local agent and generate HTML
without manually running the command in a terminal.

## Decision

Use the verified agy --print <prompt> contract:

- invoke agy --dangerously-skip-permissions --print <prompt>;
- send the generated prompt as one positional argument, not through stdin;
- treat stdout as plain UTF-8 text, not Gemini-style stream JSON;
- omit --model and let the user's Antigravity CLI configuration choose the
  model, because supported model identifiers are not confirmed.

This supersedes the original pre-implementation assumption that Antigravity
matched Gemini's --output-format stream-json and stdin protocol.

## Architecture

    next/src/lib/agents/
    ├── detect.ts   ← AgentDef, argv protocol, Default-only model picker
    ├── argv.ts     ← agy command flags and plain-text parser branch
    ├── invoke.ts   ← append positional prompt, safely launch on Windows, flush tail
    └── __tests__/
        ├── antigravity.test.ts ← argv/parser/AgentDef coverage
        └── invoke.test.ts      ← Windows spawn safety coverage

### Agent definition

antigravity has binary agy, ANTIGRAVITY_BIN as its override, and protocol
"argv". Its only model option is Default (CLI config), which intentionally adds
no model flag. The shared runner rejects a requested model unless it exactly
matches an ID declared by the selected agent.

### Command and prompt transport

buildArgv("antigravity") returns:

    --dangerously-skip-permissions --print

invokeAgent() appends the fully assembled prompt as the next argument. This is
required by agy --print; stdin is closed without receiving the prompt.

### Windows process safety

On Windows, an adapter whose prompt is on the command line ("argv" or
"argv-message") is launched with shell: false. This keeps prompt text out of
cmd.exe, so characters such as &, |, redirection operators, and %VAR% remain
arguments rather than shell syntax.

A .cmd or .bat shim cannot be used for this path: it fails with a clear message
asking for the native executable instead. stdin-protocol agents retain the
existing Windows shim path because their prompt is sent over stdin, not through
shell-parsed arguments.

### Output parsing and close handling

agy --print emits plain text. Each complete stdout line is emitted as a delta;
the final unterminated buffer is emitted once on process close. No JSON
envelope, stream-event handling, tool-call HTML recovery, or assistant-message
deduplication is used for Antigravity.

## Testing

Unit coverage verifies:

- plain-text and HTML-like output become deltas, while blank output is ignored;
- buildArgv("antigravity") contains only the supported print-mode flags;
- the AgentDef has the argv protocol and Default-only picker;
- a Windows command-line prompt containing & stays a distinct argv element
  with shell: false;
- a Windows .cmd shim is rejected when a prompt would be passed as argv.

No browser E2E test invokes agy, because that would require a locally installed
binary and an authenticated Antigravity session.

## Risks and constraints

| Risk / constraint | Handling |
| --- | --- |
| agy requires a positional prompt | Use the argv protocol and append one argv element. |
| Prompt text could be interpreted by cmd.exe | Use a native executable with shell: false; reject command shims for this path. |
| Native executable unavailable on Windows | Surface a configuration error instead of falling back to an unsafe shell invocation. |
| Model IDs are unverified | Expose only the CLI-configured default; do not emit --model. The shared runner rejects undeclared overrides. |
| CLI output is not JSON | Parse stdout as plain text and flush the final buffer once. |
| Positional prompts can be visible to local process inspection | This is inherent to the verified agy --print <prompt> interface; do not route through a shell. |

## File change summary

| File | Shipped behavior |
| --- | --- |
| next/src/lib/agents/detect.ts | Defines the antigravity argv adapter with a Default-only model picker. |
| next/src/lib/agents/argv.ts | Builds agy --dangerously-skip-permissions --print and parses plain text. |
| next/src/lib/agents/invoke.ts | Appends the positional prompt, prevents Windows shell parsing, and flushes text once. |
| next/src/lib/agents/__tests__/antigravity.test.ts | Covers the adapter contract and plain-text parser. |
| next/src/lib/agents/__tests__/invoke.test.ts | Covers the Windows non-shell and command-shim guard. |
