<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `next/node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

## Workspace Shape

- Root is the public harness boundary only: workspace metadata, `.github/workflows/ci.yml`, `scripts/guard.ts`, and repository docs.
- `next/` owns the complete Next application: app routes, components, app libraries, public assets, Next config, app TypeScript config, and app unit tests.
- `e2e/` owns browser-level tests as the only source of truth: Playwright config, e2e TypeScript config, helper scripts, and flat `ui/*.test.ts` cases.
- Do not add Playwright tests under `next/`. Do not add app source back at root `src/` or root `app/`.
- Root `package.json` must not proxy app or e2e scripts. Use pnpm workspace filters from the repository root.

## Commands

- Install: `pnpm install --frozen-lockfile`
- Guard shape: `pnpm exec tsx scripts/guard.ts`
- App dev: `pnpm -F @html-anything/next dev`
- App typecheck: `pnpm -F @html-anything/next typecheck`
- App unit tests: `pnpm -F @html-anything/next test`
- App build: `pnpm -F @html-anything/next build`
- E2E typecheck: `pnpm -F @html-anything/e2e typecheck`
- E2E tests: `pnpm -F @html-anything/e2e test`
