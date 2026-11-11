# Test and stable package acceptance

This is the maintainer and tester manual for the application npm format. It defines required checks, not a claim that all platforms or a published registry version have passed. [Installation](npm-installation.md) supplies macOS/PowerShell commands, DEV template setup, host adapters and recovery boundaries. Ordinary CI retains candidate installation instructions for review; npm, R2 and Release publication remain separate controlled actions.

## One record per candidate

Record package name/exact version, full source SHA, CI run/attempt, tgz SHA256 and npm integrity when available, application/manifest and both lock hashes, template environment/Resource/locale/catalog version, OS/CPU/Node/npm/Agent versions, installation paths, results and evidence links, known problems, acceptance owner and prior usable version. Keep internal logs, credentials and user material outside public packages.

Version examples such as `0.6.4-test.1` and `0.6.4` illustrate the format; query npm before selecting any new release number. Any changed release bytes require a new candidate identity. Never overwrite a published version or reuse a Git tag. Software channel and template environment are separate: new public test packages default to DEV and stable packages to prod; isolated local builds remain available. Existing published prod test versions are not rewritten.

### Published test candidate: 0.6.4-test.6

Historical record, published on 2026-11-09: [`@openmotion/app@0.6.4-test.6`](https://www.npmjs.com/package/@openmotion/app/v/0.6.4-test.6), selected by npm `test` at that time (tags are mutable). Accepted source: `3d7051ae0e2f47373ff49b0dd1ed5f0f3e343cab`, merged by [#187](https://github.com/nexu-io/openmotion/pull/187) into `feature/motion` as `1a04db765e2e994d21b540557d545c3ce28eb79a` with the same Git tree. The [source CI](https://github.com/nexu-io/openmotion/actions/runs/42628050173) passed. Neither `main` nor `legacy` changed.

The accepted tgz and the anonymous registry download have SHA256 `73abb7c87f3b11b4649462e8df882216e20a76c382ecb2b474e2fd3c9a032936`; registry integrity is `sha512-SLwSXvnslKCyLeVUZ2CrKBNz6S7zHoGGVmlvcxobllGyho5tTZVdrVQ2ErfxUtyVhEy0577G1XfQiCweIWrGdw==`. The same bytes passed isolated macOS fresh installation, test.5 upgrade, repeat setup, native Chromium/FFmpeg/ffprobe preparation, eleven Tools, five Skills and a technical MP4 export with audio. A fresh anonymous registry installation separately verified hashes, Codex registration, MCP discovery/resources and repeat setup. These checks do not establish a real model turn or human audiovisual acceptance; Windows remains unverified.

Known limitations: the production Prism catalog returned HTTP 404. This candidate supports installation/MCP and built-in project creation/edit/export testing; production template delivery has not passed acceptance. Although publication specified `--tag test`, registry readback also exposed `latest` pointing at this test version. An authenticated removal returned HTTP 400. Pin `0.6.4-test.6` explicitly; do not treat `latest` as an accepted stable release. No stable version was published, and no prior stable rollback version exists. Reinstalling test.5 or restoring a backup requires its original local artifact and compatible data; moving an npm tag does not restore a client.

## Test candidate acceptance

Recommended local checks before a test publication (not a manual workflow gate; record FAIL and NOT RUN honestly):

1. Freeze a reviewed `feature/motion` commit. Run the required check/typecheck/Studio build, affected deterministic tests and current-head CI. Verify final package contents, public-boundary/secret scans, dependencies, licenses and disabled upstream telemetry.
2. Build the **final tgz once** into a new directory. Check all identities and hashes. Copy only that tgz to a clean consumer directory; no application sidecar or source checkout may be required by setup.
3. On each promised OS/CPU, use a clean npm cache, isolated Agent profile, app home, data and Skills roots. Install with the exact tgz, run prepare, reconnect and compare the actual Tools/Skills/resources with its manifest (currently 11 Tools and 5 Skills).
4. Test initial native downloads, checked executables, second-run cache reuse, same-version setup, wrong checksum, interrupted download/retry, ownership conflicts and failed host registration. Preserve existing user content and unrelated host settings.
5. In Studio and the actual Agent, find the same published template, read detail, create an independent editable copy and record the catalog/publication version. Test DEV/prod isolation, first-load failure, existing-cache warning, catalog refresh and preservation of existing projects as relevant.
6. Use fixed material and a real Agent task: create/adapt, preview, change copy/media, save/reopen and export MP4. Record project/revision and output. Technical decoded audio/video, real model creation and normal-speed human visual/audio playback have distinct results. Include version restore/cancel and other affected Tools when changed.

A first test candidate may be distributed with declared, accepted non-blocking issues after local package checks. Credential leakage, destructive updates, mixed environments, broken installation or missing required export are blockers. After separately authorized publication, repeat a **real registry cold install of the exact test version**; local tgz acceptance cannot prove registry availability. File failures against that identity and issue a new test version after fixes.

Mac arm64 and Windows x64 require separate results; absent runners are not passes. A fixture-tested adapter is not proof of a real host conversation. Mark PASS / FAIL / NOT RUN explicitly; flaky or infrastructure failures do not count as acceptance.

## Stable acceptance

1. Candidate blockers are resolved; remaining issues have an explicit acceptance owner and workaround. Required host/platform, true Agent creation and human playback results are complete.
2. Freeze stable source, dependencies and prod configuration. Build the stable version without `-test` once. The version change changes bytes: verify the **stable tgz** rather than renaming a test archive or copying its hash. Record the source/config delta against the accepted test candidate.
3. Repeat stable-package cold installation, prepare, template creation, preview/edit/save/export on all promised targets. Test upgrade from the prior test or stable release with existing projects/material/config retained; exercise compatible rollback or backup/restore. Do not promise older versions can read a migrated format without proof.
4. Confirm the exact public package/scope and authorized publisher. Explicit test/DEV and stable/prod artifacts are publishable; source/unversioned/channel-environment-mismatched manifests stay private. The build does not publish. Test-candidate metadata selects `candidate`; test promotion precedes non-blocking native registry checks; stable metadata selects temporary `stage`, not `latest`.
5. After separate publication authorization, use Motion npm publication with `channel=stable` and that exact candidate version. It publishes under public `stage`, requires matching macOS ARM64 and Windows x64 prod installation reports, then advances `latest` and the prod guide. The pipeline does not perform a real Agent task, live prod-template acceptance or human playback; complete those against the stable candidate beforehand and record them privately. Announce only supported platforms and known issues. A stage tag does not hide a public package. npm tags do not update machines already installed.

Maintainer commands below are examples, not automatically executed release steps:

```sh
# The manual test workflow performs these two steps with registry propagation verification between them:
npm publish /absolute/final-test.tgz --access public --tag candidate
# After test registry propagation (native checks follow test delivery):
npm dist-tag add @openmotion/app@<exact-test-version> test
npm publish /absolute/final-stable.tgz --access public --tag stage
# After exact stable registry-install acceptance and channel authorization:
npm dist-tag add <verified-package-name>@0.6.4 latest
```

Confirm npm ownership/authentication and target versions first. A public Release attachment is optional and independent of npm. Main cutover, repository rename and publication are different actions; none is implied by merging a feature PR or passing CI.

## Recovery and feedback

Stop recommending a failed candidate. Under channel-management authorization, point test/latest back to an already verified compatible version; do not overwrite/unpublish it as a recovery mechanism. Users still need an explicit compatible reinstall/reconnect or backup restoration. If there is no prior stable release, state that instead of inventing a rollback target.

Each defect needs exact package/source/OS/host/environment/catalog identity, project/revision, steps, expected/actual behavior, redacted logs and artifact links. Keep installation, host discovery, technical export, real creation and human acceptance as separate statuses.

## Hosted installation instructions

[docs/install.md](install.md) is the public Agent-facing source template. The generator reads the actual complete npm tgz and its embedded manifest, pins the npm name/version and built source SHA, and records the guide and package hashes. It does not build or publish the application.

Ordinary npm/DEV CI builds generate a **candidate-only** guide and retain it as an Actions artifact for 14 days. The publisher rejects candidate previews. Public guides require test/DEV or stable/prod identity; private builds cannot produce them.

Maintainers follow [build → download and accept → publish](release-workflows.md): first run Motion candidate build from `feature/motion` with `channel=test` and version empty for automatic numbering (or an explicit new test version), or `channel=stable` with an explicit new stable version, download its frozen candidate and follow the included `candidate-install.md` to install the local tgz in an isolated host. Keep completed `acceptance.md` privately. Run Motion npm publication from `feature/motion` with the same channel and that exact version. Starting the manual workflow authorizes publication; no acceptance checkbox is required. Candidate lookup and hashes are automatic; no independent approval environment is enabled. The same candidate bytes receive immutable snapshots before the moving guide advances; test native registry checks follow delivery and report warnings; stable requires both checks before `latest`. Snapshot-only recovery is a separate maintenance entry. The former CI guide-only upload route is removed so it cannot bypass these checks. Ordinary PR CI remains read-only.

The entries support test/DEV and stable/prod candidates. Stable uses stage → both native checks → latest → prod snapshots/default guide. Skills platform/marketplace distribution remains outside this implementation; each real publication requires separate authorization. Bundling five Skills and registering them locally does not publish them to a platform. Partial retries retain the actual successful producer artifact IDs; automatic npm provenance is disabled for prebuilt candidates while OIDC authentication remains enabled. See the workflow manual for the source/hash evidence and recovery limits.

The short test/stable version URL contract and historical `/versions/` URLs remain as documented in that manual. New test software uses DEV template defaults. DEV service access still depends on network/authentication; private template snapshots and credentials must never be embedded. The earlier test.6 retains prod defaults.

The configured destination bucket is `open-design-releases` and the public origin is `https://releases.open-design.ai`. After stable publication, the website can give the Agent a short prompt: "Read `https://releases.open-design.ai/open-motion/install.md`, install OpenMotion MCP and Skills for my current supported Agent host, preserve existing projects/settings, and report installation and preparation results." Use `https://releases.open-design.ai/open-motion/dev/install.md` for the test software channel. The test guide now pins `@openmotion/app@0.6.4-test.6`, with an immutable copy at `open-motion/dev/0.6.4-test.6/install.md`; both canonical public URLs were verified byte-for-byte against guide SHA256 `4b6f6b25c782c23d5529d225c6c0506d524b245a242f54d84fbf8d4dd61f4f05` after the [upload run](https://github.com/nexu-io/openmotion/actions/runs/42633147999). The short test.6 URL was added by [run 42638072025](https://github.com/nexu-io/openmotion/actions/runs/42638072025), with the same verified bytes as the retained legacy `/versions/0.6.4-test.6/install.md` URL. The older test.5 and test.4 immutable instructions remain unchanged; test.4 records the historical `@open-design/motion` name. Their existence does not imply those old npm versions were published. The stable entry is untouched and currently returns HTTP 404. Guide publication and npm publication remain separate operations.

The new entries require separate trusted default-branch registration and npm trusted-publisher setup before use. Those administrative steps are not performed by this feature PR. Existing R2 credentials are reused only in the final snapshot job. No workflow was dispatched or package published as part of implementing these controls. See [setup, records and recovery](release-workflows.md).

Default installation guides use floating npm tags (`@test` for DEV, `@latest` for stable) and state the current version separately. Versioned guides remain pinned for reproduction. Native cold-install results are post-delivery evidence for test and a required gate before stable `latest`. Neither establishes real creation or human acceptance.
