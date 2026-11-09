# Contributing to OpenMotion

[简体中文入口](CONTRIBUTING.zh-CN.md)

Read [AGENTS.md](AGENTS.md) and the entire [architecture](docs/architecture.md). This isolated `refactor/odsuite` line uses Node24, pnpm11.13.0 and a pinned `pnpm-lock.yaml`; all internal modules are private workspaces. The complete product remains on `feature/motion` until the refactor is accepted.

Create a topic branch and an independent worktree from the latest fetched integration SHA. Run the standard build, full tests, lint, Biome and guard checks, plus the relevant actual runtime/browser validation. Submit an English PR to `refactor/odsuite`, state the user-visible behavior and exact validation scope, and use strict squash merging after checks pass. Never push implementation directly to an integration branch or rewrite shared history.

Architecture may evolve through explicit responsibility and lifecycle decisions. Update durable guidance when behavior changes; keep plans, migration gaps, logs and one-off evidence in PRs/issues and delivery records. No unmanaged source, asset or Skill directories, compatibility aliases or duplicate system-resource authorities.

Preserve Apache-2.0, upstream/dependency attribution and font licenses. Do not commit credentials, internal-only links, workstation paths or user projects. Do not add telemetry or publish packages, releases, storage content or service changes without separate authorization. Packaging must use explicit positive resource lists. Contributing source does not authorize replacing user data or host configuration for tests.
