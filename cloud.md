# Agent entry

Read and follow [AGENTS.md](AGENTS.md), the shared source of repository instructions for all Agents.

Every interface styling task must follow the [shared design system rules](AGENTS.md#shared-design-system--required-for-every-agent) and read [packages/design-system/README.md](packages/design-system/README.md). Reference existing tokens, styles and assets. Extend that package first when a reusable visual decision is missing; do not establish a feature-local design system. Carry this requirement into delegated tasks and reviews.

The Claude Code entry is [CLAUDE.md](CLAUDE.md). This compatibility entry does not define a separate set of rules.

The design-system workbench is an independent package-owned editing surface. Keep it free of Studio and business-module imports; UI edits and Agent edits update the same design-system source. Run `npm run design:dev` to open it and `npm run design:test` for its save/conflict/independence checks.
