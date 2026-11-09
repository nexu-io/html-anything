# Test and stable package acceptance

This is the maintainer and tester manual for the application npm format. It defines required checks, not a claim that all platforms or a published registry version have passed. [Installation](npm-installation.md) supplies macOS/PowerShell commands, DEV template setup, host adapters and recovery boundaries. Ordinary CI still does not upload or publish packages.

## One record per candidate

Record package name/exact version, full source SHA, CI run/attempt, tgz SHA256 and npm integrity when available, application/manifest and both lock hashes, template environment/Resource/locale/catalog version, OS/CPU/Node/npm/Agent versions, installation paths, results and evidence links, known problems, acceptance owner and prior usable version. Keep internal logs, credentials and user material outside public packages.

Use `0.6.4-test.1`, `0.6.4-test.2`, then `0.6.4` as examples, not previously published versions. Any changed release bytes require a new candidate identity. Never overwrite a published version or reuse a Git tag. Software channel and template environment are separate: public test/stable default to prod; local DEV candidates remain private and isolated.

## Test candidate acceptance

Before any authorized publication to the npm `test` tag:

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
4. Confirm the exact public package/scope and authorized publisher. Explicit prod artifacts are publishable; source/local/DEV manifests stay private. The build does not publish. Test-candidate metadata selects `test`; stable metadata selects temporary `stage`, not `latest`.
5. Only after separate publication authorization: publish the verified stable tgz, install that exact registry version, then move `latest` after the registry check passes and announce supported platforms/known issues. A stage tag does not hide a public package. npm tags do not update machines already installed.

Maintainer commands below are examples, not automatically executed release steps:

```sh
npm publish /absolute/final-test.tgz --access public --tag test
npm publish /absolute/final-stable.tgz --access public --tag stage
# After exact stable registry-install acceptance and channel authorization:
npm dist-tag add <verified-package-name>@0.6.4 latest
```

Confirm npm ownership/authentication and target versions first. A public Release attachment is optional and independent of npm. Main cutover, repository rename and publication are different actions; none is implied by merging a feature PR or passing CI.

## Recovery and feedback

Stop recommending a failed candidate. Under channel-management authorization, point test/latest back to an already verified compatible version; do not overwrite/unpublish it as a recovery mechanism. Users still need an explicit compatible reinstall/reconnect or backup restoration. If there is no prior stable release, state that instead of inventing a rollback target.

Each defect needs exact package/source/OS/host/environment/catalog identity, project/revision, steps, expected/actual behavior, redacted logs and artifact links. Keep installation, host discovery, technical export, real creation and human acceptance as separate statuses.
