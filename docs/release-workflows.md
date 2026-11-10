# Motion test release: build, accept, publish

Use two manual Actions entries: **Motion candidate build**, then **Motion test publication** after acceptance. The daily flow is **build → download and accept → publish**. Neither entry runs on pushes, PR merges, tags or a schedule. This implementation does not register workflows on `main`, configure repository/npm permissions, publish a package or switch the product main branch.

| Operator step | Automated work |
| --- | --- |
| Build: enter a new test version | Freeze the current `feature/motion` SHA, check/build/scan once, retain the candidate and show download/install instructions |
| Download and accept | Use `candidate-install.md` and the local tgz in an isolated host; retain completed `acceptance.md` internally |
| Publish: enter the accepted version and confirm acceptance | Find the unique candidate automatically, verify its source/hashes, publish the same tgz under `candidate`, check native installations, then advance npm `test`, archive snapshots and update the default guide last |

**No independent approval environment is enabled at this stage.** The publication checkbox is explicit authorization by the operator, not evidence of an independent review or proof that the tests happened. Anyone able to dispatch the trusted publication workflow can authorize publication; the team must control that access and keep the acceptance record. Adding a separate required reviewer later is a separate decision.

New public test packages use **DEV templates**; stable packages use prod. The `dev` URL path selects the test software channel, whose newly built packages now embed DEV configuration. Package visibility does not grant DEV network access or authorization; no private catalog snapshot or credential is embedded. Existing prod-based test versions are immutable and remain unchanged. Stable publication, npm `latest` promotion and Skills marketplace/platform upload are separate follow-ups; the five Skills are only included in the npm application and registered locally.

## First-time administrator setup

The default `main` currently contains the legacy project. GitHub requires a `workflow_dispatch` workflow to exist on the **default branch** before its manual entry is available; it can otherwise run from another ref. This project's controls deliberately require **Use workflow from: main**, while the application source comes from `feature/motion`. Register the reviewed control files through a separately authorized small PR. This does not copy the Motion application onto `main` or rewrite its history. See [GitHub's manual workflow requirements](https://docs.github.com/en/actions/how-tos/manage-workflow-runs/manually-run-a-workflow).

Register these files together:

- `.github/workflows/motion-candidate.yml`, `motion-publish-test.yml` and `motion-publication-recovery.yml`.
- `.github/scripts/motion-release.mjs`, `motion-scan.mjs`, `motion-registry-smoke.mjs`, `publish-install-guide.mjs` and `.github/gitleaks.toml`.
- `scripts/runtime-assets.mjs`, `release-version.mjs`, `install-guide.mjs`, `docs/install.md`, `docs/templates/release-record.md` and `docs/templates/candidate-install.md`.

Protect changes to the trusted control files and `main`. There is no `motion-test-publish` GitHub Environment prerequisite or Review deployments step in this version.

For `@openmotion/app`, open npm **Settings → Trusted publishing → Add trusted publisher → GitHub Actions**. Set owner **`nexu-io`**, repository **`html-anything`**, workflow filename **`motion-publish-test.yml`** (no directory), **leave Environment blank**, and allow **npm publish** plus **Allow npm dist-tag**. The latter is separately required to advance `test` after native acceptance; enabling publish alone is insufficient. If an older entry names an environment, it must be updated to match this workflow before publication. GitHub-hosted runners use Node 26.11.1; credentialed npm jobs explicitly install npm 11.21.2 for OIDC dist-tag support and `id-token: write`; no stored npm token is needed. The recovery caller never calls npm publish or dist-tag. npm does not support a dist-tag dry-run; do not test that command against the real registry without channel-write authorization. See [npm trusted publishing](https://docs.npmjs.com/trusted-publishers/).

Reuse the existing R2 settings. Only the final snapshot step receives the storage credentials:

| Setting | Role |
| --- | --- |
| Secrets `CLOUDFLARE_R2_RELEASES_AK`, `CLOUDFLARE_R2_RELEASES_SK` | Bucket-scoped S3 write credentials |
| Variable `CLOUDFLARE_R2_RELEASES_BUCKET` | `open-design-releases` |
| Variable `CLOUDFLARE_R2_RELEASES_URL` | Approved R2 S3 HTTPS origin |
| Variable `CLOUDFLARE_R2_RELEASES_PUBLIC_ORIGIN` | `https://releases.open-design.ai` |

## 1. Build

Open **Actions → Motion candidate build → Run workflow**, select `main` and fill in **version**, for example `0.6.4-test.7`. Use a new `MAJOR.MINOR.PATCH-test.N[.N]` for each candidate. Never change bytes under an existing published version.

Normally leave **source_sha** empty. The build fetches `feature/motion`, resolves its current full SHA once, records it and checks out exactly that SHA. To test a particular reviewed integrated commit, supply its full 40-character SHA. A later branch update cannot silently change this candidate. Confirm the chosen source has completed the required integration review.

The build scans tracked source before dependency installation, runs the technical checks/Studio regression/eleven-Tool ZIP E2E, builds the final DEV npm tgz once and scans its outer and inner archives. It has no npm OIDC or R2 credentials. Successful output is retained as **`motion-candidate-<version>` for 30 days**. Wait for the whole build run to succeed before publication.

The artifact contains nine files: `openmotion-app-<version>.tgz`, `release-npm.json`, `source-scan.json`, `package-scan.json`, `install.md`, `install-record.json`, **`candidate-install.md`**, `acceptance.md` and `candidate.json`. The schema-2 candidate records source/control SHA, producer run/attempt and file hashes. Its acceptance state remains `not-performed`. The generated checklist fills machine identity only; human results start at `NOT RUN`.

`candidate-install.md` installs the exact **local tgz**. The sibling frozen `install.md` pins the registry version for **after publication** and cannot install an unpublished version. The candidate guide template is a CI helper, not an addition to the product distribution list.

## 2. Download and accept

1. Open the successful build summary, download `motion-candidate-<version>` and extract the ZIP.
2. Give that directory to your Agent and copy this instruction:

   > Read candidate-install.md in this folder. Read candidate.json, verify the local tgz SHA256, and install this exact local OpenMotion candidate. Use a separate test host profile/configuration, application home, data directory and Skills directory; preserve my daily environment. Complete prepare, then verify actual MCP/Skills loading and the requested template, editing and export checks. Record actual results in a private copy of acceptance.md; mark unrun checks NOT RUN. Do not publish.

3. Follow the actual supported host/platform isolation recipe in [npm installation](npm-installation.md). Setup and prepare must use the same explicit application home; `--home` alone does not isolate the host profile. The application is embedded: no source checkout or sidecar application/manifest download is needed. Native dependencies still need network access.
4. Complete **`acceptance.md` privately** with PASS / FAIL / NOT RUN, supported OS/host, template/catalog identity, existing-data preservation, real Agent creation/edit/export, normal-speed human audio/video playback, known issues and recovery. [The acceptance guide](release-guide.md) defines the checks. Build success cannot fill human results.

Keep completed evidence against the generated candidate identity. Do not edit/re-upload the frozen candidate artifact or place private test results in public Actions artifacts. Stop on failed or incomplete required acceptance; code changes need a new candidate version. No run ID, tgz hash or private-record hash needs to be copied into the publication form.

## 3. Publish the accepted version

Open **Actions → Motion test publication → Run workflow**, select `main`, enter the exact accepted **version**, and tick **accepted** only after its required acceptance passes. Click **Run workflow**. This is the explicit publication action; there is no later independent approval dialog. Leaving the checkbox false fails before any publication.

The workflow searches GitHub artifacts by the exact versioned name and requires exactly one unexpired match from a completed successful registered candidate build on `main` in this repository. Missing, ambiguous, expired or failed candidates stop instead of choosing a different run. The official ZIP digest, frozen file hashes and source integration are checked; source and package scans run again. The current manual run's actual operator, candidate identity and acceptance confirmation are retained in `authorization.json`.

It then automatically:

1. Publishes only the accepted tgz with `--tag candidate --ignore-scripts --provenance=false`, or verifies an already published identical version. It rejects an older test version than the current npm test channel and never overwrites different bytes.
2. On separate macOS arm64 and Windows x64 runners without publication credentials, anonymously downloads the exact registry version, verifies its hashes, prepares Chromium/FFmpeg/ffprobe, runs isolated setup/repeat setup and checks the eleven Tools/resources and five Skills. These are native technical checks, not real-model or human playback acceptance.
3. In a separate npm-OIDC-only job, requires both successful reports for the same tgz/source and DEV environment before advancing `test`. Verifies the registry result; an identical retry does not retag, and a newer `test` is never regressed.
4. Archives immutable R2 snapshots and checks canonical public bytes. Only then conditionally advances the default test guide. The snapshot job consumes the operator authorization and both native reports, executes trusted `main` controls and never executes the candidate application.
5. Shows the exact version, publication phase, versioned installation guide and default guide in the run summary.

OIDC authenticates the publisher. Automatic npm provenance remains disabled because this trusted control workflow's `main` SHA differs from the selected application source SHA. Candidate/manifest/lock/hash records provide traceability, not a signed build attestation.

## Versions and records

| Channel | Moving guide, updated last | Immutable guide |
| --- | --- | --- |
| Test software, DEV templates | `/open-motion/dev/install.md` | `/open-motion/dev/<version>/install.md` |
| Stable software, prod templates | `/open-motion/install.md` | `/open-motion/<version>/install.md` |

This workflow does not publish stable versions or move npm `latest`. The storage helper supports stable paths without providing a stable publication job. Existing legacy `/versions/<version>/install.md` objects remain immutable.

Each test version archives the exact tgz, manifests, generated blank acceptance checklist, both installation guides, scans, candidate identity, both platform reports and the schema-2 release record. The release record contains package/source identity and the manual operator authorization; it does not claim independent review or attest private test results. Completed private acceptance material is never uploaded. `test-promotion.json` retains the prior tag, exact package, native-report hashes and promotion outcome. The immutable release record includes this channel verification and template environment. Snapshot recovery preserves a prior immutable release record while retaining its own fresh operator authorization in its attempt artifact.

Builds have no publication lock, so another version can build during acceptance. Publication and snapshot recovery share one workflow-wide concurrency group with cancellation disabled. GitHub concurrency is not a durable FIFO: it retains one running and one newest pending run; do not enqueue a batch. Publish one accepted version at a time. A superseded candidate can retain version snapshots without moving the default. Default-guide version comparison plus ETag conditional writes prevent late older completion from rolling a newer entry back; unrecognized or conflicting same-version guide bytes require inspection.

Actions artifacts and attempt records expire after **30 days**. R2 snapshots follow the separately managed bucket lifecycle. Acceptance does not extend artifact retention. Two unexpired builds with the same version are ambiguous and blocked; use a new version rather than asking the publisher to guess. Expired/deleted artifacts fail closed; retain internal evidence before expiry and build a new version when necessary.

## Failure and snapshot recovery

- Before clicking publish: building, downloading and testing publish nothing. Discard an unwanted candidate. Fix code under a new version when bytes change.
- After clicking publish: the exact version and `candidate` tag are public even before native validation. A failed native check leaves `test` and the default guide unchanged. Once native checks and tag readback pass, `test` can advance before R2 finishes; if R2 fails it points to a verified version while the guide can remain on the previous version. npm and R2 are not one transaction. Inspect retained npm state and release-attempt/publication files; do not rebuild or blindly republish.
- Use **Re-run failed jobs** for a partial publication failure. Consumers use successful producer artifact IDs rather than guessing their own attempt. Re-running publication reuses the existing candidate and original accepted version; it does not rebuild. A candidate build rerun is different: a successful new artifact must be accepted again, and duplicate version artifacts block publication.
- **Motion snapshot recovery** is a separate maintenance entry. Select `main`, enter the existing candidate version and confirm snapshot-only recovery. It requires an already published identical npm version, repeats native checks and fills missing immutable snapshots. It never builds, publishes npm, moves npm tags or accesses the moving guide. Missing/expired/ambiguous candidates stop.
- Version writes use conditional create and byte comparison. Same bytes resume; different immutable bytes stop. A public readback error blocks promotion. A failure after `fixed-write-attempted` may mean the moving write completed: inspect storage and its canonical URL before retrying.
- An unexpected npm `latest` change stops promotion. This workflow does not silently repair tags. Channel rollback is a separate reviewed operation and does not downgrade installed clients or restore their data.

Source/package scans are not a scan of every historical Git object or business classification of all binary assets; reviewers still check content, dependencies, licenses and telemetry boundaries. The historical `0.6.4-test.6` predates these candidate records: do not invent a trusted run for it or republish it to fill this format.

## Validation before activation

Run the repository's release/scanner/guide tests and actionlint. The no-publication rehearsal uses temporary candidate files and simulated GitHub/npm/R2 responses to test the transition and failure cases. It does **not** exercise npm OIDC, hosted native installation or CDN routing.

After separately authorized default-branch/npm setup, build a new candidate and verify that building alone publishes nothing. A publication dispatch with acceptance unchecked must fail closed. A positive hosted publication rehearsal is a real publication and needs explicit release authorization. Ordinary PR CI remains credential-free. This implementation PR enables none of those administrative actions by itself.
