# @odsuite/cli · private workspace

The repository-local engineering entry is `pnpm exec odsuite`, configured by `odsuite.yaml`. Use Node24 and pnpm11.13.0, install explicitly and build before execution.

Commands cover guard, development, inspect/recovery, serve, version, shared-version build, local carrier packaging and independent quality checks. Mechanisms stay in their suites. There is no global install, root shortcut or retained Electron release command.

Both standalone and Codex Plugin use the same product version. Local closure archives do not imply npm installation, host registration or publication. See [AGENTS](../../AGENTS.md) and [operations](../../docs/operations.md) for current boundaries.
