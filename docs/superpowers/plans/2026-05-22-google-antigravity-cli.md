# Google Antigravity CLI Integration — Implementation Record

**Original plan date:** 2026-05-22
**Status:** Implemented — updated 2026-08-03 to describe the shipped adapter

## Goal

Make agy selectable in html-anything and run it safely in its verified
non-interactive mode.

## Delivered implementation

| Area | Delivered behavior |
| --- | --- |
| Detection | Added antigravity with binary agy, ANTIGRAVITY_BIN, and protocol: "argv". |
| Model picker | Exposes only Default (CLI config); no undocumented model ID is sent, and the runner rejects undeclared overrides. |
| Command | Builds --dangerously-skip-permissions --print, then passes the prompt as one positional argument. |
| Input transport | Does not write the prompt to stdin. |
| Output | Treats stdout as plain text and emits the final unterminated buffer once at close. |
| Windows | Uses shell: false whenever a prompt is supplied through argv; .cmd and .bat shims are rejected for that path. |
| Failure handling | The convert flow treats agent error, non-zero exit, and null exit code as failure before committing the diff baseline. |

## Files changed

| File | Role |
| --- | --- |
| next/src/lib/agents/detect.ts | Agent metadata and protocol selection. |
| next/src/lib/agents/argv.ts | Print-mode argv and plain-text parser. |
| next/src/lib/agents/invoke.ts | Positional prompt delivery, Windows spawn safety, and close-buffer handling. |
| next/src/lib/agents/__tests__/antigravity.test.ts | Plain-text parser, command flags, and AgentDef assertions. |
| next/src/lib/agents/__tests__/invoke.test.ts | Windows command-line prompt safety regression tests. |
| next/src/lib/use-convert.ts | Keeps failed agent exits from being reported as successful conversions. |

## Validation matrix

| Behavior | Proof |
| --- | --- |
| Correct command shape | buildArgv("antigravity") returns only the supported print-mode flags. |
| Correct prompt placement | The argv protocol appends the full prompt after --print. |
| Correct parser | Plain-text output and HTML-like output are emitted as deltas; blank lines are ignored. |
| No close duplication | The tail buffer is emitted through one plain-text path. |
| Windows injection resistance | A prompt containing & remains an argv element under shell: false; command shims fail before spawning. |
| Safe model behavior | The UI provides only the CLI-configured default, and the runner rejects any undeclared model override. |

## Operational constraints

- agy --print requires the prompt on the command line; it is not a stdin
  adapter.
- On Windows, users must configure a native executable for this adapter when
  auto-detection finds only an npm-style .cmd or .bat shim.
- The prompt remains visible to local process inspection for the lifetime of
  the command because the CLI requires a positional prompt.
- E2E invocation tests remain out of scope because they need an installed,
  authenticated Antigravity CLI.

## Historical note

The original plan assumed the Gemini JSON-streaming contract and stated that
invoke.ts would remain unchanged. That assumption was invalidated by the actual
agy CLI behavior. This record replaces it: Antigravity uses positional prompt
delivery, plain-text stdout parsing, Default-only model selection, and a
Windows-specific no-shell guard.
