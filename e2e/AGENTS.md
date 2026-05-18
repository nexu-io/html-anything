# e2e/AGENTS.md

Follow root repository instructions first when present. This package owns user-level end-to-end smoke tests and Playwright UI automation only.

## Directory layout

- `ui/`: flat Playwright UI automation test files only. Keep helpers, resources, and non-Playwright harnesses out of this directory.
- `scripts/`: Playwright auxiliary subcommands such as artifact cleanup; it must not wrap `playwright test`.

## Naming and tools

- UI files must be flat `*.test.ts` Playwright tests.
- Do not add app unit tests, component tests, JSX/TSX, jsdom, Testing Library, or Next-private harnesses under `e2e/`.
- Do not add Playwright cases under `next/`; `e2e/` is the only source of truth for browser-level cases.

## Commands

Run commands from the repository root:

```bash
pnpm -F @html-anything/e2e typecheck
pnpm -F @html-anything/e2e exec tsx scripts/playwright.ts clean
pnpm -F @html-anything/e2e exec playwright test -c playwright.config.ts --list
pnpm -F @html-anything/e2e test
```
