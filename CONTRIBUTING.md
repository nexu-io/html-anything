# Contributing to OpenMotion

[简体中文](CONTRIBUTING.zh-CN.md)

Work from the repository root; read [AGENTS.md](AGENTS.md) and the [architecture](docs/product/architecture.md). Use the pinned CI Node version and `npm ci`. Keep `package-lock.json` and `scripts/runtime-lock.json` in sync with any intentional dependency change.

Before opening a PR, run `npm run check`, `npm run typecheck:studio`, `npm run build:studio` and focused deterministic tests for the changed boundary. Studio unit tests use `npm run test:studio`. Use the shared browser-lock wrapper on shared machines; model creation and visual acceptance require separate evidence. Do not overwrite real user data or host configuration to test an installer.

Keep PRs focused and describe the user-visible behavior and actual validation. Open an issue first for substantial changes. Review the entire product architecture for each change and update it only when needed, following the [shared guidance](AGENTS.md#product-architecture-review); documentation edits are not required in every PR. Preserve existing Git history and push follow-up commits during review; do not force-push a shared branch.

Only deliberately public documentation belongs here. Do not commit credentials, internal links, private plans, workstation paths or user projects. Distribution uses the positive list in `scripts/distribution.ts`; newly shipped files require an explicit decision. Preserve all upstream attribution and license notices. Do not add telemetry or publish a package without a separate decision.

Contributions are licensed under the repository's [Apache-2.0 license](LICENSE); vendored components retain their own terms. This migration branch is for review only and must not be merged or published automatically.
