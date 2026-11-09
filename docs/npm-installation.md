# Motion application npm package

The npm tgz contains the installer, a prebuilt Motion application archive and its pinned release manifest. One `setup` installs the application, eleven public MCP Tools and five Skills for the selected host. No adjacent application archive or `--manifest` is needed. The application runs from a managed, writable directory, never from the npx cache; projects remain outside application/cache directories.

This branch does not publish packages. `@openmotion/app` is the agreed public package name. The `openmotion` npm organization has been registered by the project owner; the publishing account's access and availability of a registry version still need separate verification. Registry examples apply only after a separately authorized release.

## Requirements and package contents

Users provide Node.js 22.18+ with npm and their Agent host. Builds use the Node version pinned in CI. npm installs locked production dependencies with `npm ci --omit=dev --ignore-scripts`; FFmpeg, ffprobe and the browser are downloaded and checked separately by `prepare` or the first native operation. Node, native binaries, node_modules, user projects and credentials are not bundled in this npm format. It is not an offline package. Complete platform ZIPs remain a backup.

The embedded application uses `scripts/distribution.ts`'s positive file list: MCP/backend, prebuilt Studio, five Skills and references, bundled examples, npm/native locks, licenses and approved documentation. Remote Prism templates are fetched separately. The embedded manifest omits the containing tgz's hash; the external delivery manifest records that hash without a circular self-reference.

## Build and install a local test

From a clean checkout based on `feature/motion`:

```sh
npm ci --no-audit --no-fund
npm run package:npm -- dist/npm-test 0.6.4-test.1
```

The version is an example. Use a new empty output directory for every candidate. Files include `open-design-motion-<version>.tgz`, the application archive, `release-npm.json` and SHA256 sidecars. Only the tgz is required by a consumer; the remaining files are delivery evidence and the explicit-manifest fallback. Copy the tgz alone to another directory to verify this property.

An isolated macOS Codex installation:

```sh
motion_tgz="/absolute/path/open-design-motion-0.6.4-test.1.tgz"
motion_test="$HOME/Library/Application Support/OpenMotion-test/0.6.4-test.1"
mkdir -p "$motion_test/profile" "$motion_test/workspace"
export CODEX_HOME="$motion_test/profile"
npx --yes --package "$motion_tgz" -- openmotion setup --host codex \
  --home "$motion_test/app" --data-dir "$motion_test/data" \
  --skills-dir "$motion_test/workspace/.agents/skills" &&
npx --yes --package "$motion_tgz" -- openmotion prepare --home "$motion_test/app" &&
cd "$motion_test/workspace" &&
codex
```

Run `prepare` only after successful setup. Wait for it to finish before starting a native project operation: slow first downloads can exceed the backend startup timeout. The isolated Codex profile may require its own login; do not copy credentials into the package.

Equivalent Windows PowerShell commands:

```powershell
$motionTgz = 'C:\path\open-design-motion-0.6.4-test.1.tgz'
$motionTest = Join-Path $env:LOCALAPPDATA 'OpenMotion-test\0.6.4-test.1'
New-Item -ItemType Directory -Force "$motionTest\profile", "$motionTest\workspace" | Out-Null
$env:CODEX_HOME = "$motionTest\profile"
npx --yes --package "$motionTgz" -- openmotion setup --host codex --home "$motionTest\app" --data-dir "$motionTest\data" --skills-dir "$motionTest\workspace\.agents\skills"
if ($LASTEXITCODE -ne 0) { throw 'Motion setup failed' }
npx --yes --package "$motionTgz" -- openmotion prepare --home "$motionTest\app"
if ($LASTEXITCODE -ne 0) { throw 'Native preparation failed' }
Set-Location "$motionTest\workspace"
codex
```

These are documented commands, not proof of Windows acceptance. Use a directly executable host or pass its JavaScript CLI through `--codex`. The native lock declares Mac arm64/macOS 26 and Windows x64/Windows 11; other platforms are not implied supported by npm installation.

## Test template data (DEV)

The software channel (`test`/`latest`) and template environment (`dev`/`prod`) are independent. Public test candidates and stable packages default to **prod**. To debug unpublished/test Prism templates, publish them to Prism **DEV**, then build a local DEV candidate:

```sh
npm run package:npm -- dist/npm-dev 0.6.4-test.1 --template-env=dev
```

Use that tgz in the installation commands above, with an **independent Codex profile, home, data and Skills directory**. DEV packages remain `private:true`, even with an explicit test version. DEV setup defaults to `openmotion-dev` instead of `openmotion`; `prepare` uses the same environment-specific default. Explicit `--home` must be identical for setup and prepare. An existing installation refuses an implicit data-directory change or a dev/prod switch: use a different home rather than altering the old projects.

The environment is embedded in `shared/template-config.json`; the resulting `install.json.templateEnvironment` identifies the installation. Studio and MCP read the same source. [Template configuration](template-catalog.md#environment-and-build) explains the current Resource and catalog behavior. Saving a CMS draft does not publish it. Refresh the catalog, find the template ID and record its catalog/publication version; existing projects are independent copies and do not change when a template is republished.

For **source development**, `npm run dev` already selects DEV. An independently launched MCP can use `MOTION_TEMPLATE_ENV=dev MOTION_DATA_DIR=/absolute/isolated-dev-data npm run mcp`. For an installed package, advanced overrides must be supplied to the actual MCP/Agent process and inherited by the backend. Setting a shell variable only while running setup does not persist it into a later GUI host. Stop the owned old backend and reconnect after changing configuration. Prefer the embedded DEV package over editing installed files or sharing production data.

There is no automatic fallback from prod to DEV and no `switch-env` CLI. This selects the template catalog, not model keys, accounts or every remote service.

## Host adapters and ownership

| Host | Registration | Skills |
| --- | --- | --- |
| Codex | `codex mcp add openmotion` | Complete bundle under the selected Skills root |
| Claude Code | `claude mcp add-json -s user openmotion` | Flat entries under `${CLAUDE_CONFIG_DIR:-~/.claude}/skills` |
| DeepSeek Harness | `dsh plugin --profile web add <managed bundle> --ignore-scripts` | Its dedicated bundle/provider Skill root |
| WorkBuddy | Merge `mcpServers.openmotion` into its `mcp.json` | Flat entries under its configuration root |

Select `--host codex|claude|deepseek|workbuddy`. `--skills-dir` selects the Codex/Claude/WorkBuddy root; Harness uses its own provider. Executable overrides are `--codex`, `--claude`, `--dsh`; Harness also accepts `--profile`. Isolate host configuration with `CODEX_HOME`, `CLAUDE_CONFIG_DIR`, `DSH_HOME` or `WORKBUDDY_CONFIG_DIR`; `--home` controls the application installation, not the host profile.

The internal ownership marker remains stable across the npm package rename so earlier local installations can be upgraded in place. An installation can serve multiple hosts using the same home/data. `install.json.hosts` retains each host. Skill documentation links are rewritten for flat layouts; Codex/Harness retain bundle-relative links. Re-run setup for each installed host when upgrading Skills. Unowned same-name MCP/Skills are refused. Unrelated settings/Skills and existing projects are retained. Registration failure restores the prior install state and Skills; checked application caches remain available for retry.

Compatible phase-one updates do not require closing existing MCP connections or stopping the same workspace's backend. Connections negotiate the API protocol and requested Tool, retaining running exports and completed results; see [shared editor recovery](shared-editor.md). The installer does not terminate existing processes. Incompatible protocols or internal legacy ABIs still require updating the connection and idle backend together. Refresh the host to discover new Tools or reload changed Skills; an already-closed transport needs host reconnection.

## Versions, upgrades and publication boundary

Explicit builds accept `MAJOR.MINOR.PATCH-test.N[.N]` or `MAJOR.MINOR.PATCH`. CI-generated candidates use next-patch `test.<run>.<attempt>`; manually assigned candidates can use `test.1`, `test.2`. Every artifact has one identity across the installer, app package/lock and plugin metadata. Build numbers never overwrite old output; source versions are not bumped by packaging.

Source package manifests remain `private:true`. Only an explicitly versioned **prod** build produces publishable tgz metadata. test artifacts default to the `test` npm tag; stable artifacts default to `stage` so a later authorized registry smoke can precede moving `latest`. Local/default and DEV artifacts remain private. No command here publishes or changes npm tags. See [test and stable acceptance](release-guide.md) for separate maintainer authorization and gates.

After publication, the intended user entry is `npx --yes --package @openmotion/app@<exact-version> -- openmotion setup --host codex`, followed by `prepare` and host discovery/reload for a new installation. `@test` and `@latest` select channels; acceptance always records the exact resolved version. Installing/running npx alone, publishing a new package or moving a tag does not update an existing managed app.

Before upgrading, back up projects/configuration, run setup with the new exact tgz and the **same** home/data/Skills paths, then prepare. Compatible phase-one connections and active exports can continue. Refresh host discovery for new Tools or Skills; reconnect a closed transport. For an incompatible protocol, finish active exports before updating only the owned connection and idle backend together. Do not terminate unrelated services. Older app directories may remain, but rollback requires a compatible old package and data; back up before an irreversible format change. There is no automatic update or arbitrary-version rollback promise.

## Native tools and diagnostics

The runtime lock pins HTTPS URLs, versions, target OS/CPU and SHA256 for FFmpeg, ffprobe and Chrome for Testing. Downloads require no repository credentials, never attach repository tokens, and do not run brew/winget. Separate component locks, temporary extraction and completion markers support retry/cache reuse. A failed download is not ready. Explicit native path overrides remain supported. See [runtime details](test-packages.md).

A local `--manifest /absolute/release-npm.json` remains available for legacy delivery and controlled fixtures. HTTP, URL credentials, unsafe extraction paths and invalid hashes are rejected. Do not remove a leftover install lock until its owning process is confirmed stopped.

For defects, include exact package/app version, source SHA, OS/CPU, Node/Agent version, template environment/catalog version, project/revision, reproduction steps and redacted logs. Installation, native preparation, host discovery, model creation, technical MP4 checks and human playback are separate evidence. Follow the [acceptance manual](release-guide.md); unrun Windows/host/creation checks remain unrun.

## Shared Agent installation entry

The hosted [installation guide template](install.md) provides the short Agent entry. Ordinary CI retains a candidate preview; the controlled guide mode fetches an already published exact npm version before any R2 upload. Repository R2 configuration, channel acceptance and an executable manual workflow entry are required before upload. See [hosted instruction publication](release-guide.md#hosted-installation-instructions).
