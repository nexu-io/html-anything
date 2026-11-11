# Motion releases: build, test, publish

Use two manual Actions entries: **Motion candidate build**, then **Motion npm publication**, in `nexu-io/openmotion` on `main`. The daily flow is **build → optional local testing → manual publish**. Neither entry runs on pushes, PR merges, tags or a schedule. Merging a workflow change does not publish a package or configure npm permissions. Daily development branches from the latest `origin/main` and PRs target `main`.

| Operator step | Automated work |
| --- | --- |
| Build: select `main` and channel; leave test version empty or enter a stable version | Freeze the current `main` SHA and template environment, check/build/scan once, retain the candidate and show download/install instructions |
| Optional local testing | Use `candidate-install.md` and the local tgz in an isolated host; retain completed `acceptance.md` internally |
| Publish: select the same channel and enter the exact candidate version | Find the unique candidate, verify source/hashes and publish the same tgz. Test advances `test` before non-blocking native checks; stable requires both native checks before `latest`. Archive snapshots and update the corresponding guide last |

**No acceptance checkbox or manual testing gate is required.** Starting the trusted manual workflow authorizes the selected channel publication. The operator receipt records who started it and the candidate identity; it does not claim human acceptance. Automated source, hash and scan checks remain mandatory. Native checks report warnings after test delivery; stable requires both to pass before `latest` and the default prod guide can advance.

New public test packages use **DEV templates**; stable packages use prod. The `dev` URL path selects the test software channel, whose newly built packages now embed DEV configuration. Package visibility does not grant DEV network access or authorization; no private catalog snapshot or credential is embedded. Existing prod-based test versions are immutable and remain unchanged. Stable uses an explicit version and prod configuration in these same entries. Skills marketplace/platform upload remains outside this flow; the five Skills are included in the npm application and registered locally.

## First-time administrator setup

The default `main` contains OpenMotion; the former HTML Anything application remains on `legacy`. For candidate build, npm publication and snapshot recovery, select **Use workflow from: main**. Selecting `feature/motion`, `legacy`, a tag or another feature/fix branch fails before new release work. Application source must be a reviewed commit integrated into `main`. Frozen candidates produced before the repository rename/main cutover retain their original receipt identity and remain readable; new builds seal only the current repository/main identity. See [GitHub's manual workflow requirements](https://docs.github.com/en/actions/how-tos/manage-workflow-runs/manually-run-a-workflow).

Keep these control files together:

- `.github/workflows/motion-candidate.yml`, `motion-publish-test.yml`, `motion-publication-recovery.yml` and `motion-install-check.yml` (read-only manual rechecks).
- `.github/scripts/motion-release.mjs`, `motion-scan.mjs`, `motion-registry.mjs`, `motion-registry-smoke.mjs`, `publish-install-guide.mjs` and `.github/gitleaks.toml`.
- `scripts/runtime-assets.mjs`, `release-version.mjs`, `install-guide.mjs`, `docs/install.md`, `docs/templates/release-record.md` and `docs/templates/candidate-install.md`.

Protect changes to the trusted control files and `main`; keep default-branch registration aligned. There is no `motion-test-publish` GitHub Environment prerequisite or Review deployments step in this version.

For `@openmotion/app`, open npm **Settings → Trusted publishing → Add trusted publisher → GitHub Actions**. After the repository rename, verify or update npm's external trusted-publisher configuration; source changes do not update it automatically. Set owner **`nexu-io`**, repository **`openmotion`**, workflow filename **`motion-publish-test.yml`** (no directory), **leave Environment blank**, and allow **npm publish** plus **Allow npm dist-tag**. The latter is separately required to advance `test` or `latest` after registry propagation; enabling publish alone is insufficient. If an older entry names an environment, it must be updated to match this workflow before publication. GitHub-hosted runners use Node 26.11.1; credentialed npm jobs explicitly install npm 11.21.2 for OIDC dist-tag support and `id-token: write`; no stored npm token is needed. The recovery caller never calls npm publish or dist-tag. npm does not support a dist-tag dry-run; do not test that command against the real registry without channel-write authorization. See [npm trusted publishing](https://docs.npmjs.com/trusted-publishers/).

Reuse the existing R2 settings. Only the final snapshot step receives the storage credentials:

| Setting | Role |
| --- | --- |
| Secrets `CLOUDFLARE_R2_RELEASES_AK`, `CLOUDFLARE_R2_RELEASES_SK` | Bucket-scoped S3 write credentials |
| Variable `CLOUDFLARE_R2_RELEASES_BUCKET` | `open-design-releases` |
| Variable `CLOUDFLARE_R2_RELEASES_URL` | Approved R2 S3 HTTPS origin |
| Variable `CLOUDFLARE_R2_RELEASES_PUBLIC_ORIGIN` | `https://releases.open-design.ai` |

## 1. Build

Open **Actions → Motion candidate build → Run workflow**, select **`main`** and a **channel**. For `test`, normally leave **version** empty. For `stable`, enter an explicit new version such as `0.6.4` (no suffix); empty or mismatched versions fail before building. Use this same branch for publication and recovery; `main` registers the manual Actions entries; release operations still execute from `main`.

An empty version uses the frozen Motion source's `package.json`, increments its patch and appends a short `-test.N`. `N` is the candidate workflow's `GITHUB_RUN_NUMBER` plus **5**: candidate run #1 used the retired long format, and run #2 continues after historical `test.6` as **`0.6.4-test.7`**, then run #3 produces **`0.6.4-test.8`**. Failed builds and explicit overrides still consume run numbers, so gaps are expected. A rerun adds its attempt only after the first attempt, for example `0.6.4-test.7.2`; start a new build if an older rerun is rejected by the no-regression check. Do not reset or move the workflow file without reviewing this numbering offset. Full run ID, attempt and source SHA remain in candidate.json and acceptance.md. See [GitHub run variables](https://docs.github.com/en/actions/reference/workflows-and-actions/variables).

The checkout version is a development baseline, not the last published package version. Packaging stamps the resolved version into the output package, application, lock and plugin metadata without rewriting source manifests. Thus source `0.6.3` and the historical npm `0.6.4-test.6` can coexist; no stable `0.6.4` is implied. With `source_sha` empty, source is frozen to `GITHUB_SHA` of the selected `main` dispatch, even if the branch advances while the run queues. The legacy `main` package version is never used for automatic Motion numbering. After a stable release, maintainers must advance the Motion source baseline for the next patch series.

To override numbering, enter a new `MAJOR.MINOR.PATCH-test.N[.N]`. Do not reuse an existing candidate/published version or choose one older than the current npm `test` channel. Never change bytes under an existing published version. The successful summary and artifact name show the resolved version; copy that exact version into the publication form after accepting its bytes. Publication never generates a new number.

Normally leave **source_sha** empty. The build fetches `main`, resolves its current full SHA once, records it and checks out exactly that SHA. To test a particular reviewed integrated commit, supply its full 40-character SHA. A later branch update cannot silently change this candidate. Confirm the chosen source has completed the required integration review.

The build scans tracked source before dependency installation, runs the technical checks/Studio regression/eleven-Tool ZIP E2E, builds the final channel-specific npm tgz once and scans its outer and inner archives. It has no npm OIDC or R2 credentials. Successful output is retained as **`motion-candidate-<version>` for 30 days**. Wait for the whole build run to succeed before publication.

The artifact contains nine files: `openmotion-app-<version>.tgz`, `release-npm.json`, `source-scan.json`, `package-scan.json`, `install.md`, `install-record.json`, **`candidate-install.md`**, `acceptance.md` and `candidate.json`. The schema-2 candidate records source/control SHA, producer run/attempt and file hashes. Its acceptance state remains `not-performed`. The generated checklist fills machine identity only; human results start at `NOT RUN`.

`candidate-install.md` installs the exact **local tgz**. The sibling frozen `install.md` pins the registry version for **after publication** and cannot install an unpublished version. The candidate guide template is a CI helper, not an addition to the product distribution list.

## 2. Download and accept

1. Open the successful build summary, download `motion-candidate-<version>` and extract the ZIP.
2. Give that directory to your Agent and copy this instruction:

   > Read candidate-install.md in this folder. Read candidate.json, verify the local tgz SHA256, and install this exact local OpenMotion candidate. Use a separate test host profile/configuration, application home, data directory and Skills directory; preserve my daily environment. Verify actual MCP/Skills loading without waiting for background video-component preparation. Run prepare only when explicitly asked to wait or before requested media/capture/export acceptance checks. Record actual results in a private copy of acceptance.md; mark unrun checks NOT RUN. Do not publish.

3. Follow the actual supported host/platform isolation recipe in [npm installation](npm-installation.md). Setup starts video-component preparation in the background; MCP connection, project creation/editing and ordinary preview do not wait for it. When prepare is needed, reuse setup's explicit application home; `--home` alone does not isolate the host profile. The application is embedded: no source checkout or sidecar application/manifest download is needed. Native dependencies still need network access. Report installation/host loading separately from video-component readiness; installation alone does not authorize video creation or export.
4. Complete **`acceptance.md` privately** with PASS / FAIL / NOT RUN, supported OS/host, template/catalog identity, existing-data preservation, real Agent creation/edit/export, normal-speed human audio/video playback, known issues and recovery. [The acceptance guide](release-guide.md) defines the checks. Build success cannot fill human results.

Keep completed evidence against the generated candidate identity. Do not edit/re-upload the frozen candidate artifact or place private test results in public Actions artifacts. Record failed and unrun checks honestly; they are not a manual workflow gate. Code changes need a new candidate version. No run ID, tgz hash or private-record hash needs to be copied into the publication form.

## 3. Publish the candidate version

Open **Actions → Motion npm publication → Run workflow**, select **`main`**, choose the same **channel** as the build, enter the exact candidate **version**, and click **Run workflow**. The workflow filename remains `motion-publish-test.yml`, and the npm trusted-publisher repository must be `openmotion`. `test` is the default; stable must be selected explicitly. No acceptance checkbox or later independent approval dialog is required.

The workflow searches GitHub artifacts by the exact versioned name and requires exactly one unexpired match from a completed successful registered candidate build in this repository (including historical pre-cutover `feature/motion` runs). Missing, ambiguous, expired or failed candidates stop instead of choosing a different run. Copy the exact version from the successful build summary. Entering `0.6.4-test.7` cannot rename an existing `0.6.4-test.42818506484.1` candidate: build `test.7` separately and accept its new bytes first. The official ZIP digest, frozen file hashes and source integration are checked; source and package scans run again. The current manual run's actual operator, candidate identity and publication action are retained in `authorization.json`.

For **test**, it then automatically:

1. Publishes only the accepted tgz with `--tag candidate --ignore-scripts --provenance=false`, or verifies an already published identical version. It rejects an older test version than the current npm test channel and never overwrites different bytes.
2. Advances npm `test` in a separate npm-OIDC-only job. Registry version/tag propagation is polled for up to ten minutes; a successful tag write is not repeated while waiting. Identical retries do not retag, and newer versions are never regressed.
3. Archives immutable R2 snapshots, verifies public bytes and updates the default guide. Default DEV commands use `@test`; stable commands use `@latest`, with the current version noted in prose. Versioned historical guides keep exact versions. A same-version pinned default may migrate to this tag form without changing its immutable guide.
4. Runs separate macOS arm64 and Windows x64 cold installations after the guide is available. They verify the exact npm bytes, native components, setup/repeat setup, eleven Tools and five Skills. Failures produce a visible warning and retained report; they do not block or roll back publication. These checks do not claim human audiovisual acceptance.
5. Shows publication status and guide links independently of the later installation checks.

OIDC authenticates the publisher. Automatic npm provenance remains disabled because the trusted publication workflow SHA may differ from the selected prebuilt application source SHA. Candidate/manifest/lock/hash records provide traceability, not a signed build attestation.

### Stable publication

Before dispatch, complete [stable acceptance](release-guide.md#stable-acceptance) against the exact new stable tgz, including prod templates, real Agent use and human playback. No new checkbox enforces that work; the operator remains responsible for it. Changing a test version to a stable version changes bytes and requires a new candidate build and acceptance.

With `channel=stable`, the workflow:

1. Publishes the exact prod tgz under **`stage`** (or verifies identical existing bytes). This is already a **public npm version**; `stage` is a temporary tag, not access control. An older version than current `latest` is rejected at publication entry.
2. Runs macOS ARM64 and Windows x64 anonymous exact-version cold installs, native preparation, repeat setup, MCP/Skills and resource discovery. The same version/source/hash and prod defaults must match in both reports. Either failure blocks `latest` and the default stable guide; the stage version remains public for diagnosis. These jobs do not test the live prod template catalog, a model turn or human playback.
3. Uses a separate npm-OIDC-only job to advance **`latest`** after both reports pass, with bounded metadata propagation waits. Stable publication does not move **`test`**. The checked version can be rechecked using the read-only installation workflow.
4. Archives immutable prod snapshots and release identity, including both native reports, then verifies public bytes and advances **`/open-motion/install.md`** last. Its commands use `@latest`; **`/open-motion/<version>/install.md`** stays pinned. The snapshot job has only R2 credentials, no npm OIDC.

npm and R2 cannot commit atomically. If native checks fail, rerun the failed jobs after diagnosing infrastructure; changed application bytes need a new version. If R2 fails after `latest` advances, use the same publication run’s failed-job retry to finish updating the guide. Snapshot-only recovery never updates the moving guide. There is no automatic tag rollback. Do not mistake a historical prerelease on `latest` for an accepted stable fallback; before the first stable release there may be no stable rollback version. Channel rollback requires separate authorization and a verified compatible version.

## Independent installation rechecks

Use **Motion installation check** (`motion-install-check.yml`) to check an existing public test or stable version without starting publication. After its manual entry is registered on the default branch, select `main`, enter the exact version, and run. This entry has only `contents: read` and `actions: read`; it has no npm OIDC or R2 credentials and cannot publish, move tags or write install.md. Only candidate resolution receives the read-only GitHub token; installed consumer processes receive an allowlisted environment and isolated application/data/Skills/host directories.

The workflow verifies the original successful candidate's ZIP/file hashes and integrated source, then downloads the exact npm bytes on macOS ARM64 and Windows x64. It checks fresh/repeated setup, unrelated MCP-setting preservation, the version’s DEV/prod configuration, Chromium/FFmpeg/ffprobe preparation, eleven Tools, five Skills and resources. Both platforms complete independently (`fail-fast: false`). Metadata/tarball requests retry 404/408/429/5xx and transient network errors for up to 15 minutes per request. Authorization errors, malformed metadata and hash mismatches fail immediately. A failed retry cannot retain an old successful download report.

Read each platform's job summary and `installation-<platform>-<run>-<attempt>` artifacts. Failure stays visible in this independent run and cannot resume publishing. The existing test post-publication jobs still run and remain non-blocking; stable checks gate latest. Reports record the tested package source/SHA256 separately from the check-code SHA; registry download alone does not certify native installation. Real model creation, template service access, Windows 11 desktop behavior and human playback remain separate acceptance checks.

A same-repository PR changing this workflow, registry helpers or their tests runs the fixed test.7 regression case without publication; fork PRs are skipped. This PR regression must be refreshed before its original candidate artifact expires. Production operation requires the separately reviewed default-branch entry registration; this change does not register or run anything on main.

## Versions and records

| Channel | Moving guide, updated last | Immutable guide |
| --- | --- | --- |
| Test software, DEV templates | `/open-motion/dev/install.md` | `/open-motion/dev/<version>/install.md` |
| Stable software, prod templates | `/open-motion/install.md` | `/open-motion/<version>/install.md` |

Stable uses the prod paths above and npm `latest`; test keeps the DEV paths and npm `test`. Existing legacy `/versions/<version>/install.md` objects remain immutable.

Each version archives the exact tgz, manifests, generated blank acceptance checklist, both installation guides, scans, candidate identity, the schema-2 release record; later platform reports are retained as Actions artifacts. The release record contains package/source identity and the manual operator authorization; it does not claim independent review or attest private test results. Completed private acceptance material is never uploaded. `test-promotion.json` retains the prior tag, exact package, promotion outcome. The immutable release record includes channel verification and template environment. Test marks native checks as post-publication; stable records both matching native reports and their hashes as `passed-before-latest`. These reports explicitly retain unrun model/human checks. Snapshot recovery preserves a prior immutable release record while retaining its own fresh operator authorization in its attempt artifact.

Builds have no publication lock, so another version can build during acceptance. Test/stable publication and snapshot recovery share one workflow-wide concurrency group with cancellation disabled. GitHub concurrency is not a durable FIFO: it retains one running and one newest pending run; do not enqueue a batch. Publish one accepted version at a time. A superseded candidate can retain version snapshots without moving the default. Default-guide version comparison plus ETag conditional writes prevent late older completion from rolling a newer entry back; unrecognized or conflicting same-version guide bytes require inspection.

Actions artifacts and attempt records expire after **30 days**. R2 snapshots follow the separately managed bucket lifecycle. Acceptance does not extend artifact retention. Two unexpired builds with the same version are ambiguous and blocked; use a new version rather than asking the publisher to guess. Expired/deleted artifacts fail closed; retain internal evidence before expiry and build a new version when necessary.

## Failure and snapshot recovery

- Before clicking publish: building, downloading and testing publish nothing. Discard an unwanted candidate. Fix code under a new version when bytes change.
- After clicking publish for test: the exact version and `candidate` tag are public even before native validation. Native checks run after publication. Once tag readback passes, `test` can advance before R2 finishes; if R2 fails it points to a verified version while the guide can remain on the previous version. npm and R2 are not one transaction. Inspect retained npm state and release-attempt/publication files; do not rebuild or blindly republish.
- Use **Re-run failed jobs** for a partial publication failure. Consumers use successful producer artifact IDs rather than guessing their own attempt. Re-running publication reuses the existing candidate and original accepted version; it does not rebuild. A candidate build rerun is different: a successful new artifact must be accepted again, and duplicate version artifacts block publication.
- **Motion snapshot recovery** is a separate maintenance entry. Select `main`, choose the channel, enter the existing candidate version and start snapshot-only recovery. It requires an already published identical npm version. Test fills missing immutable snapshots and subsequently runs native checks; stable checks both exact prod installations before filling snapshots. It never builds, publishes npm, moves npm tags or accesses the moving guide. Missing/expired/ambiguous candidates stop.
- Version writes use conditional create and byte comparison. Same bytes resume; different immutable bytes stop. A public readback error blocks promotion. A failure after `fixed-write-attempted` may mean the moving write completed: inspect storage and its canonical URL before retrying.
- An unexpected npm tag change stops promotion; a newer accepted stable version is preserved and only the older version snapshot is archived. This workflow does not silently repair tags. Channel rollback is a separate reviewed operation and does not downgrade installed clients or restore their data.

Source/package scans are not a scan of every historical Git object or business classification of all binary assets; reviewers still check content, dependencies, licenses and telemetry boundaries. The historical `0.6.4-test.6` predates these candidate records: do not invent a trusted run for it or republish it to fill this format.

## Validation before activation

Run the repository's release/scanner/guide tests and actionlint. The no-publication rehearsal uses temporary candidate files and simulated GitHub/npm/R2 responses to test the transition and failure cases. It does **not** exercise npm OIDC, hosted native installation or CDN routing.

After separately authorized default-branch/npm setup, build a new candidate and verify that building alone publishes nothing. A publication dispatch requires only the exact candidate version; automated validation failures must still stop promotion. A positive hosted publication rehearsal is a real publication and needs explicit release authorization. Ordinary PR CI remains credential-free. This implementation PR enables none of those administrative actions by itself.
