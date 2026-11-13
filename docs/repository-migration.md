# OpenMotion standalone repository

OpenMotion replaces the former HTML Anything application at the repository root on `main`. The repository is `nexu-io/openmotion`; existing commits, issues and pull requests remain in the same repository. The cutover preserves Git history.

Daily Motion changes branch from the latest `main`, open PRs targeting `main`, and merge directly into `main` when authorized. `feature/motion` is no longer an intermediate integration branch. The previous application is preserved at [`legacy`](https://github.com/nexu-io/openmotion/tree/legacy). Package publication remains a separate, explicitly authorized operation.

## Upstream synchronization checkpoint

On 2026-11-08, the OpenMotion source `main` snapshot `21c3e5aaef1af34b0f126f7db90a86927e2ef325` was compared with public `feature/motion` at `c5f6975cfde71b3a55c6b21921ed64260937c246`. The latest source change, media-popover positioning and empty-timeline guidance, is already included through [PR #172](https://github.com/nexu-io/html-anything/pull/172). All 13 implementation and test files changed by that source update have identical Git blobs in the public branch.

The complete tree comparison found 2,626 identical entries, three files differing only by a trailing blank line, and 72 remaining path differences. Those differences preserve the public migration contract described below:

- Public licenses, contribution guides, installation URLs, documentation and source attribution replace source-repository-specific instructions and internal material.
- GitHub CI and the positive distribution list retain standalone packaging checks and disabled publication; source-repository upload/release helpers are excluded.
- Upstream browser telemetry and automatic experiment assignment remain disabled; explicit Studio events use the installation-owned OpenMotion collector.
- Recreation guidance retains the npm native-cache instructions alongside the complete ZIP runtime paths.

No additional runtime change is needed for this source snapshot. Future synchronization should compare against this recorded snapshot and review incoming changes while retaining these public adaptations. Open pull requests are separate changes until they land in their source branch; this checkpoint does not include them or authorize merging or publishing.

## Runtime and independent npm distribution

Motion retains its own `package.json`, `package-lock.json`, pinned native runtime manifest, editor, MCP and Skills. No OD monorepo package, workspace link or OD-private import is required.

```sh
npm ci
npm run check
npm run typecheck:studio
npm run build:studio
npm run package:npm
```

The npm output in `dist/npm-local/` contains an installer `.tgz`, application `.tar.gz`, manifest and SHA256. The application runs from its selected install directory, not transient npx cache. Node, browser and media tool requirements are pinned; native tools come from public sources and are cached on first use. See [installation](npm-installation.md).

`install.sh` clones this repository's `main` branch and invokes `scripts/install-motion.command` from the root. `OPENMOTION_REF` can select a reviewed commit or another existing branch. Source installation requires Node/npm; complete ZIPs include a platform runtime. None of these installers relocates existing user projects.

## Public source and package contents

The import includes the completed recreation workflow and its measurement validation while retaining the standalone npm installer. Nonpublic planning/process archives, company publishing helpers, workstation paths and internal document links are excluded. Generated builds, dependencies, credentials, projects and local evidence remain outside Git.

All three artifact formats use the positive file list in `scripts/distribution.ts`: required runtime modules (including the macOS Perl launcher), built editor assets, explicitly approved docs, the five phase-one Skills, their shared discovery module and references, approved bilingual guides/Motion MD assets, and licenses. Tests, Studio development source/fixtures, sourcemaps and unapproved docs/scripts do not ship. npm tar creation disables macOS resource metadata. New docs and scripts require an explicit distribution decision.

Upstream Studio/template attribution and font notices remain intact. Motion removes the embedded upstream browser analytics identifiers and both upstream sending transports. The caller-compatible functions now forward registered explicit events through OpenMotion's own field adapter, installation identity and opt-out policy; upstream measurement and automatic experiment enrolment remain disabled. Engine subprocesses keep `HYPERFRAMES_NO_TELEMETRY=1`. Third-party npm packages and native executables retain their pinned identities.

## CI and acceptance

`.github/workflows/ci.yml` installs locked dependencies, checks/builds Studio, runs focused packaging/workflow/recreation tests and Studio regression, and exercises the phase-one ZIP through all eleven public Tools (nine project Tools and two catalog Tools). npm is the default manual artifact format; complete Mac/Windows ZIP assembly remains available. This CI workflow rejects publication and retains a candidate installation-guide preview for review; it does not publish npm/R2/Release artifacts or merge PRs. Separate manual [candidate and test publication controls](release-workflows.md) retain complete candidates and publish only after explicit authorization and their documented default-branch and npm-trust prerequisites are configured.

Build success does not prove target-machine installation, loaded host Skills/MCP, model creation or visual acceptance. Validate exact artifacts independently, using isolated profiles. Current platform limits and instructions are in [test packages](test-packages.md).
