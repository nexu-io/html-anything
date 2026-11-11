# Motion application npm package

The npm tgz contains the installer, a prebuilt Motion application archive and its pinned release manifest. One `setup` installs the application, eleven public MCP Tools and five Skills for the selected host. No adjacent application archive or `--manifest` is needed. The application runs from a managed, writable directory, never from the npx cache; projects remain outside application/cache directories.

`@openmotion/app@0.6.4-test.6` is available from npm through the `test` channel. It was published separately after authorization; ordinary CI still does not publish packages. Its anonymous registry download, isolated macOS Codex setup, repeat setup, eleven MCP Tools and five Skills have been verified. Use the exact version for reproduction. See the [delivery record and known limitations](release-guide.md#published-test-candidate-064-test6), including the production template catalog and the registry's unexpected `latest` tag.

Source `package.json` is the development baseline; the published artifact can have a different version. For example, source `0.6.3` can produce `0.6.4-test.6` without a stable `0.6.4` release. Packaging changes output identities only. Manual [candidate builds](release-workflows.md#1-build) accept an empty version and automatically generate the next patch plus a short `test.N` workflow counter (with an attempt suffix on reruns); publication keeps the exact accepted version.

Test/prerelease/local packages never report usage data, even with a saved opt-in or an enable flag. Stable releases collect by default and support persistent opt-out and re-enable in Studio Privacy settings. See [tracking controls](../tracking/README.md#reporting-and-user-control).

## Requirements and package contents

Users provide Node.js 22.18+ with npm and their Agent host. Builds use the Node version pinned in CI. npm installs locked production dependencies with `npm ci --omit=dev --ignore-scripts`. Setup starts FFmpeg, ffprobe and browser preparation in a detached background worker. MCP connection, source editing and ordinary preview do not wait; Studio displays readiness and retry. `prepare` remains an explicit wait/retry command. Node, native binaries, node_modules, user projects and credentials are not bundled in this npm format. It is not an offline package. Complete platform ZIPs remain a backup.

The embedded application uses `scripts/distribution.ts`'s positive file list: MCP/backend, prebuilt Studio, five Skills and references, bundled examples, npm/native locks, licenses and approved documentation. Remote Prism templates are fetched separately. The embedded manifest omits the containing tgz's hash; the external delivery manifest records that hash without a circular self-reference.

The npm page uses the repository's product `README.md`. Packaging resolves its relative documentation and image links against the exact source commit, while the embedded application keeps the original local links. The installation manual remains in the application docs; it is not the npm landing page. Published test.6 contains the earlier installation-manual README; the correction takes effect with the next separately authorized npm version, not by editing GitHub alone.

## Build and install a local test

From a clean checkout based on `feature/motion`:

```sh
npm ci --no-audit --no-fund
npm run package:npm -- dist/npm-test 0.6.4-test.1
```

The version is an example. Use a new empty output directory for every candidate. Files include `openmotion-app-<version>.tgz`, the application archive, `release-npm.json` and SHA256 sidecars. Only the tgz is required by a consumer; the remaining files are delivery evidence and the explicit-manifest fallback. Copy the tgz alone to another directory to verify this property.

An isolated macOS Codex installation:

```sh
motion_tgz="/absolute/path/openmotion-app-0.6.4-test.1.tgz"
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

The acceptance recipe explicitly waits with `prepare` after setup. Ordinary installation can continue immediately: the backend starts without native-download waits, and Studio reports preparation. Media import, automated screenshots and export check the required components before starting. The isolated Codex profile may require its own login; do not copy credentials into the package.

Equivalent Windows PowerShell commands:

```powershell
$motionTgz = 'C:\path\openmotion-app-0.6.4-test.1.tgz'
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

These are documented commands, not proof of Windows acceptance. Use a directly executable host or pass its JavaScript CLI through `--codex`. The native lock declares Mac arm64 and Windows x64/Windows 11. OpenMotion adds no macOS version gate: proceed with installation and the native executable checks, rather than treating the build/test machine's OS version as a minimum. Node.js and the pinned browser/media binaries must still run on the target machine; this is not acceptance of every macOS version. Other platforms are not implied supported by npm installation.

## Test template data (DEV)

New explicitly versioned test npm packages default to **DEV**; stable packages default to **prod**. Existing published versions retain their original environment (test.6 used prod). To test Prism templates, publish the resource to **DEV**, then download an accepted DEV candidate or build one locally:

```sh
npm run package:npm -- dist/npm-dev 0.6.4-test.1 --template-env=dev
```

Use that tgz in the installation commands above, with an **independent Codex profile, home, data and Skills directory**. Explicit test/DEV builds are publishable under the candidate channel. Unversioned builds and channel/environment mismatches remain `private:true`. Public packaging exposes DEV routing configuration, not credentials or cached catalog contents; network access/authentication remains a service prerequisite. DEV setup defaults to `openmotion-dev` instead of `openmotion`; `prepare` uses the same environment-specific default. Explicit `--home` must be identical for setup and prepare. An existing installation refuses an implicit data-directory change or a dev/prod switch: use a different home rather than altering the old projects.

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

Use the same installation flow for every host: collect the platform and Node/npm facts once, select the current Agent, run its setup adapter, then verify actual host loading while video components prepare in the background. An explicit `--host` takes precedence over host context; do not choose a host merely because its CLI is installed. The CLI retains its Codex default for compatibility, so Agent-driven installs should always pass `--host`. Only ask for the missing host/profile when reliable context is unavailable. `openmotion --help`, `setup --help`, `prepare --help` and `--version` work without installing or modifying configuration.

For a non-Codex test, keep the isolated application/data paths from the examples above and change only the host-specific configuration:

| Selected host | Isolated host configuration | Setup adapter options |
| --- | --- | --- |
| Codex | Separate `CODEX_HOME` | `--host codex --skills-dir <isolated-skills-root>` |
| Claude Code | Separate `CLAUDE_CONFIG_DIR` | `--host claude --skills-dir <isolated-skills-root>` |
| DeepSeek Harness | Separate `DSH_HOME` and selected profile | `--host deepseek --profile <selected-profile>`; Skills live in this installation's managed bundle |
| WorkBuddy | Separate `WORKBUDDY_CONFIG_DIR` | `--host workbuddy --skills-dir <isolated-skills-root>` |

Harness callers should pass the actual current profile from their host context, such as `DSH_PROFILE`, rather than assuming `web` or `desktop`. On macOS, setup already detects the standard Desktop CLI at `/Applications/DeepSeek Harness.app/Contents/Resources/runtime/cli/bin/dsh`; it need not be on PATH. Keep that host-specific lookup in the Harness adapter. Other executable locations use `--dsh`; do not unpack the host or invent a wrapper for ordinary installation.

After setup, use each host's supported discovery/reload action to load the Tools and Skills. Confirm all eleven public Tools and five Skills, and call `motion_get_project` to verify the expected data directory. Do not impose another host's restart or refresh procedure, or substitute an on-disk registration for host loading evidence.

The internal ownership marker remains stable across the npm package rename so earlier local installations can be upgraded in place. An installation can serve multiple hosts using the same home/data. `install.json.hosts` retains each host. Skill documentation links are rewritten for flat layouts; Codex/Harness retain bundle-relative links. Re-run setup for each installed host when upgrading Skills. Unowned same-name MCP/Skills are refused. Unrelated settings/Skills and existing projects are retained. Registration failure restores the prior install state and Skills; checked application caches remain available for retry.

Compatible phase-one updates do not require closing existing MCP connections or stopping the same workspace's backend. Connections negotiate the API protocol and requested Tool, retaining running exports and completed results; see [shared editor recovery](shared-editor.md). The installer does not terminate existing processes. Incompatible protocols or internal legacy ABIs still require updating the connection and idle backend together. Refresh the host to discover new Tools or reload changed Skills; an already-closed transport needs host reconnection.

## Versions, upgrades and publication boundary

Explicit builds accept `MAJOR.MINOR.PATCH-test.N[.N]` or `MAJOR.MINOR.PATCH`. CI-generated candidates use next-patch `test.<run>.<attempt>`; manually assigned candidates can use `test.1`, `test.2`. Every artifact has one identity across the installer, app package/lock and plugin metadata. Build numbers never overwrite old output; source versions are not bumped by packaging.

Source package manifests remain `private:true`. Only an explicit test/DEV or stable/prod build produces publishable tgz metadata. Test artifacts default to `candidate`; the manual publisher advances `test` only after matching Mac/Windows registry installation checks. Stable artifacts default to `stage`; stable publication and `latest` promotion are separate follow-ups. Local/default and channel/environment-mismatched artifacts remain private. No command here publishes or changes npm tags. See [test and stable acceptance](release-guide.md) for separate maintainer authorization and gates.

After publication, the intended user entry is `npx --yes --package @openmotion/app@<exact-version> -- openmotion setup --host codex`, followed by host discovery/reload; `prepare` is optional when an explicit wait or retry is needed. `@test` and `@latest` select channels; acceptance always records the exact resolved version. Installing/running npx alone, publishing a new package or moving a tag does not update an existing managed app.

Before upgrading, back up projects/configuration, run setup with the new exact tgz and the **same** home/data/Skills paths, then reconnect while preparation runs (or explicitly wait with prepare). Compatible phase-one connections and active exports can continue. Refresh host discovery for new Tools or Skills; reconnect a closed transport. For an incompatible protocol, finish active exports before updating only the owned connection and idle backend together. Do not terminate unrelated services. Older app directories may remain, but rollback requires a compatible old package and data; back up before an irreversible format change. There is no automatic update or arbitrary-version rollback promise.

## Native tools and diagnostics

### npm download failures

Recover npm network failures (`ENOTFOUND`, `EAI_AGAIN`, connection errors or timeouts) automatically before asking the user to troubleshoot:

1. **Try official, then mirror.** Try `https://registry.npmjs.org` then `https://registry.npmmirror.com`, at most once per registry, counting the initial failed attempt and skipping registries already tried. An explicitly selected registry goes first; respect any user or host restriction on alternatives. Stop on authentication, permission or checksum failures rather than switching sources.
2. **Keep settings temporary.** Set `npm_config_registry` and `npm_config_fetch_retries=0` for the attempt's process tree, covering both npx and setup's production `npm ci`. Do not change global npm configuration, project lockfiles or TLS verification. This fallback does not apply to separate browser/FFmpeg download hosts.
3. **Keep the same artifact.** Pin the exact requested/resolved version before switching. For channel tags, use the matching immutable guide and checksum, not the mirror's potentially older tag. If the tag never resolved, use the version stated in the trusted guide. Download a mirrored tgz with lifecycle scripts disabled, verify its SHA256 against that guide before executing it, then use the local-tgz setup command with the same host/profile and isolated paths. A missing mirrored version is not permission to downgrade; a checksum mismatch stops recovery.
4. **Both failed: diagnose, then hand off.** Compare `npm ping` in the actual installation environment and the user's terminal, using the same npm and registry; curl success alone is insufficient. Use the host's supported network-approval flow where permitted, without bypassing a denial. If Agent access remains unavailable, provide the complete setup command and selected environment/paths for the user's terminal: preserve Node/npm, working directory, host/profile, host configuration, application home, data and Skills paths. After setup, reconnect the host and verify its version and `motion_get_project` result.

If the terminal also fails, resolve DNS/proxy/network access first and report installation as incomplete; preserve the previous installation and user data. A verified local tgz only replaces the outer download: production npm dependencies and native components still need network access. Native readiness and host loading remain separate results.

References: [npmmirror](https://npmmirror.com/), [temporary npm configuration](https://docs.npmjs.com/cli/v11/using-npm/config/#environment-variables) and [npm ping](https://docs.npmjs.com/cli/v11/commands/npm-ping/).

### Missing MCP tools or a failed connection

Run the installed CLI with the same application home and selected host:

```sh
node /absolute/application/scripts/npm-installer.mjs diagnose --host codex --home /absolute/installation-home
```

The installed Skill's `scope.json` or `openmotion-install.json` supplies `runtimeRoot` (the application directory), `installHome` and `host`; do not guess them from the video project. The packaged npm CLI also exposes `openmotion diagnose` through the same exact package used for setup. Select `codex`, `claude`, `deepseek` or `workbuddy`; preserve any custom `--codex` executable or Harness `--profile`. The saved Harness profile is used by default.

Diagnosis reads the selected host's owned configuration and starts an independent, bounded MCP probe using its command, arguments, registered environment overrides and working directory. It otherwise inherits the diagnostic process environment, which can differ from a GUI host. It verifies initialization, the installed tool list and a `motion_get_project` read of the expected data directory. It never registers/replaces configuration, creates a project, restarts another process or replays an export. A probe can start or reuse this installation's backend; it does not wait for native media/browser downloads. Credential-like environment values are redacted from reported startup output.

The JSON result includes `status`, `hostSessionVerified:false` and `nextAction`; failures also include the stage, code and message. A successful probe does not establish that the current host chat loaded those tools, and Claude/WorkBuddy/Harness configuration reads cannot observe every session-specific enablement or tool-selection setting. Inspect the host's status/output and correct the reported configuration, runtime or version problem. In an interactive Claude Code session use the server's Reconnect action in `/mcp`; in other hosts use their supported MCP refresh/reconnect control. Then call `motion_get_project` through the active host connection, check the directory and original project/version, and resume the task. An empty tool search alone is not a diagnosis.

For source/plugin installations without an npm `installHome`, use the host's actual registered launch command and logs. The source Codex bootstrap retains `scripts/check-installed-mcp.mjs`; do not point it at a guessed plugin cache or substitute a different workspace. A closed host transport must be reconnected by the host. Keep running exports and original request IDs while recovering.

### Native media and browser preparation

The runtime lock pins HTTPS URLs, versions, target OS/CPU and SHA256 for FFmpeg, ffprobe and Chrome for Testing. Downloads require no repository credentials, never attach repository tokens, and do not run brew/winget. Independent archives are prepared concurrently from the existing platform manifest: three separate components on macOS, browser and combined media on Windows. Explicit `prepare` settles every component before returning; any failure rejects the operation while completed components remain reusable. Component and archive cache locks coalesce requests across processes and app versions sharing the same platform/hash cache. Contenders wait; dead-owner locks can be recovered without deleting live locks. Atomic per-component state supports Studio reloads and failure retry. Completed components are reused, including after another component fails. Temporary extraction and completion markers retain retry/cache protection. Downloads interrupted mid-transfer restart that asset; HTTP range resume is not implemented. A failed download is not ready. Explicit native path overrides remain supported. See [runtime details](test-packages.md).

A local `--manifest /absolute/release-npm.json` remains available for legacy delivery and controlled fixtures. HTTP, URL credentials, unsafe extraction paths and invalid hashes are rejected. Do not remove a leftover install lock until its owning process is confirmed stopped.

For defects, include exact package/app version, source SHA, OS/CPU, Node/Agent version, template environment/catalog version, project/revision, reproduction steps and redacted logs. Installation, native preparation, host discovery, model creation, technical MP4 checks and human playback are separate evidence. Follow the [acceptance manual](release-guide.md); unrun Windows/host/creation checks remain unrun.

## Shared Agent installation entry

The hosted [installation guide template](install.md) provides the short Agent entry. Ordinary CI retains a candidate preview; the separate test publication workflow verifies the accepted candidate, publishes the same bytes, checks the exact registry installation and archives immutable version instructions before advancing the moving test guide. Repository R2 configuration, channel acceptance and enabled manual workflow entries are prerequisites. See [hosted instruction publication](release-guide.md#hosted-installation-instructions).

Maintainers: see [manual candidate and test publication workflows](release-workflows.md) for fixed source/version selection, immutable snapshots, registry verification and recovery. A candidate artifact is not a published npm version.
