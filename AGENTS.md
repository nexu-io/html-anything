<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `next/node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

## Workspace Shape

- Root is the public harness boundary: workspace metadata, repository workflows, release-control helpers and tests, `scripts/guard.ts`, and repository docs.
- `.github/scripts/` owns Motion release controls; `scripts/*.mjs` supplies their shared helpers, and `tests/` holds their deterministic tests. Browser tests remain under `e2e/`.
- `next/` owns the complete Next application: app routes, components, app libraries, public assets, Next config, app TypeScript config, and app unit tests.
- `e2e/` owns browser-level tests as the only source of truth: Playwright config, e2e TypeScript config, helper scripts, and flat `ui/*.test.ts` cases.
- Do not add Playwright tests under `next/`. Do not add app source back at root `src/` or root `app/`.
- Root `package.json` must not proxy app or e2e scripts. Use pnpm workspace filters from the repository root.

## Motion release controls

- Motion application development remains on `feature/motion`. Registering manual workflows on `main` does not move the application or authorize publication.
- After registration is merged, manual release jobs execute the trusted controls from `main` and select integrated application source from `feature/motion`. Before registration, those manual entries are not available on the default branch.
- Use Node 26.11.1 for control checks: `node --test tests/release-workflows.test.mjs tests/release-scan.test.mjs tests/install-guide.test.ts`. These tests need no workspace dependency installation and simulate publication services.
- New test candidates embed DEV defaults. npm publication uses `candidate` first; only matching successful Mac/Windows native reports permit the separate promotion job to advance `test`. Stable publication, `latest` promotion and Skills platform distribution remain out of scope.
- Follow [activation and operation](docs/motion-release-activation.md). Keep completed acceptance evidence private; do not merge or publish without the task's explicit authorization.

## Commands

- Install: `pnpm install --frozen-lockfile`
- Guard shape: `pnpm exec tsx scripts/guard.ts`
- App dev: `pnpm -F @html-anything/next dev`
- App typecheck: `pnpm -F @html-anything/next typecheck`
- App unit tests: `pnpm -F @html-anything/next test`
- App build: `pnpm -F @html-anything/next build`
- E2E typecheck: `pnpm -F @html-anything/e2e typecheck`
- E2E tests: `pnpm -F @html-anything/e2e test`
