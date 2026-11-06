# OpenMotion standalone repository

The `feature/motion` branch replaces the former HTML Anything application with OpenMotion at the repository root. Existing repository commits remain in Git history; this is a normal branch change, not a history rewrite or a merge into main. The repository name is unchanged.

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

`install.sh` clones this repository's `feature/motion` branch and invokes `scripts/install-motion.command` from the root. `OPENMOTION_REF` can select a reviewed commit or another existing branch. Source installation requires Node/npm; complete ZIPs include a platform runtime. None of these installers relocates existing user projects.

## Public source and package contents

The import includes the completed recreation workflow and its measurement validation while retaining the standalone npm installer. Nonpublic planning/process archives, company publishing helpers, workstation paths and internal document links are excluded. Generated builds, dependencies, credentials, projects and local evidence remain outside Git.

All three artifact formats use the positive file list in `scripts/distribution.ts`: required runtime modules (including the macOS Perl launcher), built editor assets, explicitly approved docs, selected Skills and licenses. Tests, Studio development source/fixtures, sourcemaps and unapproved docs/scripts do not ship. npm tar creation disables macOS resource metadata. New docs and scripts require an explicit distribution decision.

Upstream Studio/template attribution and font notices remain intact. Motion removes the embedded upstream browser analytics identifiers and both sending transports, preserving caller-compatible functions. Browser measurement and automatic experiment enrolment are disabled; engine subprocesses keep `HYPERFRAMES_NO_TELEMETRY=1`. Third-party npm packages and native executables retain their pinned identities.

## CI and acceptance

`.github/workflows/ci.yml` installs locked dependencies, checks/builds Studio, runs focused packaging/workflow/recreation tests and Studio regression, and exercises the phase-one ZIP through all nine public Tools. npm is the default manual artifact format; complete Mac/Windows ZIP assembly remains available. Both formats reject publication. There are no artifact uploads, npm releases, storage publication or automatic merges.

Build success does not prove target-machine installation, loaded host Skills/MCP, model creation or visual acceptance. Validate exact artifacts independently, using isolated profiles and the shared browser lock where applicable. Current platform limits and instructions are in [test packages](test-packages.md).
