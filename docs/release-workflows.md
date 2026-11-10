# Motion test release: build, accept, approve

The daily entry is **Actions → Motion test release → Run workflow**. It builds a complete `@openmotion/app` candidate, pauses at one protected environment approval, then publishes those same bytes. It never runs on pushes, PR merges, tags or a schedule. This implementation does not register workflows on `main`, configure repository/npm permissions, publish a package or switch the product main branch.

| Operator step | Automated work |
| --- | --- |
| Enter a new version and run | Freeze the current `feature/motion` SHA, check/build/scan once, retain the candidate and show download/install instructions |
| Download and accept the candidate | Retain the exact package identity and generate `acceptance.md`; no publication yet |
| Independently approve with `PASS` | Publish the accepted tgz to npm `test`, perform native registry checks, archive version snapshots and update the default guide last |

Public test software uses **prod templates**. A URL containing `dev` selects the test software channel, not private DEV template data. Stable version construction and URL contracts exist, but a stable release workflow is not implemented.

## First-time administrator setup

The default `main` currently contains the legacy project. GitHub must register these reviewed control files on the default branch through a separately authorized PR before the manual entries are available. This registration does not copy the Motion application onto `main` or rewrite its history. Always select **Use workflow from: main**.

Register these files together:

- `.github/workflows/motion-publish-test.yml` and `motion-publication-recovery.yml`; remove an older `motion-candidate.yml` registration if one exists.
- `.github/scripts/motion-release.mjs`, `motion-scan.mjs`, `motion-registry-smoke.mjs`, `publish-install-guide.mjs` and `.github/gitleaks.toml`.
- `scripts/runtime-assets.mjs`, `release-version.mjs`, `install-guide.mjs`, `docs/install.md` and `docs/templates/release-record.md`.

Protect changes to the trusted control files and `main`. Configure the **`motion-test-publish` GitHub Environment** with required independent reviewers, **prevent self-review**, **disable administrator bypass**, and allow exactly the `main` **branch** (no tag or wildcard policy). The workflow checks these actual settings before it can request approval and again inside the protected npm job. A missing or unprotected environment fails closed; naming an environment in YAML alone does not configure it. Test both rejection and approval before enabling real publication.

For `@openmotion/app`, configure npm trusted publishing for owner `nexu-io`, repository `html-anything`, workflow **`motion-publish-test.yml`**, environment **`motion-test-publish`**, allowing publish. The workflow uses GitHub-hosted runners, Node 26.11.1/npm 11.20.0 and `id-token: write`; no stored npm token is needed. Do not grant tag-management actions. The recovery caller is not an npm trusted publisher and never calls npm publish. See [npm trusted publishing](https://docs.npmjs.com/trusted-publishers/).

Reuse the existing R2 settings. Only the final snapshot step receives the storage credentials:

| Setting | Role |
| --- | --- |
| Secrets `CLOUDFLARE_R2_RELEASES_AK`, `CLOUDFLARE_R2_RELEASES_SK` | Bucket-scoped S3 write credentials |
| Variable `CLOUDFLARE_R2_RELEASES_BUCKET` | `open-design-releases` |
| Variable `CLOUDFLARE_R2_RELEASES_URL` | Approved R2 S3 HTTPS origin |
| Variable `CLOUDFLARE_R2_RELEASES_PUBLIC_ORIGIN` | `https://releases.open-design.ai` |

## 1. Build

Open **Motion test release → Run workflow**, select `main` and fill in **version**, for example `0.6.4-test.7`. Use a new `MAJOR.MINOR.PATCH-test.N[.N]`; never change bytes under an existing published version.

Normally leave **source_sha** empty. The build fetches `feature/motion`, resolves its current full SHA once, records it and checks out exactly that SHA. To test a particular reviewed integrated commit, supply its full 40-character SHA. A later branch update cannot silently change this candidate. Confirm the chosen source has completed the required integration review.

The build scans tracked source before dependency installation, runs the technical checks/Studio regression/eleven-Tool ZIP E2E, builds the final prod npm tgz once and scans its outer and inner archives. It does not have npm OIDC or R2 credentials. Successful output is retained as `motion-candidate-<run-id>-<attempt>` for **30 days**.

The artifact contains eight files: `openmotion-app-<version>.tgz`, `release-npm.json`, `source-scan.json`, `package-scan.json`, `install.md`, `install-record.json`, `acceptance.md` and `candidate.json`. The schema-2 candidate records source/control SHA, producer run/attempt and file hashes. Its acceptance state remains `not-performed`. The generated checklist has the machine identity filled in and human results set to `NOT RUN`.

The frozen `install.md` pins a registry version which is not published yet. Do not hand it out as a working npm installation link before publication.

## 2. Accept the downloaded package

Open the run summary and download/extract its candidate artifact. Follow the isolated profile, application home, project data and Skills recipes in [npm installation](npm-installation.md). Use the **local tgz**, replacing `HOST` with the actual selected supported host:

```sh
npx --yes --package "./openmotion-app-0.6.4-test.7.tgz" openmotion setup --host HOST
npx --yes --package "./openmotion-app-0.6.4-test.7.tgz" openmotion prepare
```

These short commands require the isolation options/environment from the platform recipe first. Repeat the same explicit application home on setup and prepare. Do not use the unpublished npm version or your normal daily Agent profile for candidate acceptance. Copy the one tgz into a clean consumer directory; its application is embedded and needs no source checkout or sidecar archive.

Complete the generated **`acceptance.md` privately**: record PASS / FAIL / NOT RUN, supported OS/host, template/catalog identity, existing-data preservation, real Agent creation/edit/export, normal-speed human audio/video playback, known issues and recovery. [The acceptance guide](release-guide.md) defines the checks. Build success cannot fill the human results. Keep that completed evidence against the generated candidate identity; do not edit or re-upload the frozen public candidate artifact. No run ID, tgz hash or private-record hash needs to be typed into a second release form.

## 3. Approve once

The npm job waits at **Review deployments → motion-test-publish**. An independent configured reviewer inspects this run's exact version/source/hash and the internally retained acceptance record. If required checks failed or remain incomplete, reject. If accepted, enter only **`PASS`** in the approval comment and approve. The comment is a public, non-sensitive authorization signal; never paste internal URLs, logs, credentials or user material there.

The protected job rechecks the environment and reads GitHub's review history. It requires an independent approved review with that exact comment. The receipt records actual reviewer logins, the observed time and a review-history digest, not the triggering operator as the approver. GitHub's history is run-scoped and has no per-review timestamp/attempt binding: the receipt says so, and the environment gate enforces approval for the job execution. The receipt does not prove that the private tests happened or cryptographically attest the private acceptance document. Keep the completed internal record.

After approval the workflow automatically:

1. Publishes only the accepted tgz with `--tag test --ignore-scripts --provenance=false`, or verifies an already published identical version. It rejects an older test version than the current npm test channel and never overwrites different bytes.
2. On separate macOS arm64 and Windows x64 runners without publication credentials, anonymously downloads the exact registry version, verifies its hashes, prepares Chromium/FFmpeg/ffprobe, runs isolated setup/repeat setup and checks the eleven Tools/resources and five Skills. These are native technical checks, not real-model or human playback acceptance.
3. Requires both platform reports, archives immutable R2 snapshots and checks canonical public bytes. Only then conditionally advances the default test guide. R2 needs no second approval: it consumes the retained approval from the successful npm job plus both native reports. The snapshot job executes trusted `main` controls and never executes the candidate application.
4. Shows the exact version, publication phase, versioned installation guide and default guide in the run summary.

OIDC authenticates the publisher. Automatic npm provenance remains disabled because this trusted control workflow's `main` SHA differs from the selected application source SHA. Candidate/manifest/lock/hash records provide traceability, not a signed build attestation.

## Versions and records

| Channel | Moving guide, updated last | Immutable guide |
| --- | --- | --- |
| Test software, prod templates | `/open-motion/dev/install.md` | `/open-motion/dev/<version>/install.md` |
| Stable software, prod templates | `/open-motion/install.md` | `/open-motion/<version>/install.md` |

This workflow does not publish stable versions or move npm `latest`. The storage helper supports stable paths without providing a stable publication job. Existing legacy `/versions/<version>/install.md` objects remain immutable.

Each test version also archives the exact tgz, manifests, blank generated acceptance checklist, scans, candidate identity, both platform reports and the schema-2 release record. The release record contains package/source identity and the run-scoped approval receipt. Completed private acceptance material is never uploaded. A previous immutable release record is preserved during snapshot recovery, while the recovery attempt retains its own fresh approval receipt.

Builds and approval waits do not hold a workflow-wide release lock, so another version can build. npm writes and default-guide writes have separate job-level concurrency groups. GitHub concurrency is not a durable FIFO: it retains one running and one newest pending job, so do not enqueue a batch of releases for automatic publication; a displaced run keeps its candidate and can be reviewed/rerun deliberately. Approve one release at a time. A candidate superseded after npm publication can retain version snapshots without moving the default. Default-guide version comparison plus ETag conditional writes prevent a late older completion from rolling a newer entry back; unrecognized or conflicting same-version guide bytes require inspection.

Actions artifacts and attempt records expire after **30 days**. R2 snapshots follow the separately managed bucket lifecycle. Approval does not extend artifact retention. Expired/deleted artifacts fail closed; keep internal evidence before expiry and build a new version when necessary.

## Failure and snapshot recovery

- Before approval: a scan/build/configuration failure or rejection publishes nothing. Cancel/reject an unwanted candidate. Fix code under a new version when bytes change.
- After approval: npm may already be public if a native or R2 stage fails. The default guide remains unchanged until its checks pass. Inspect retained npm state and release-attempt/publication files; do not rebuild or blindly republish.
- Use **Re-run failed jobs** for a partial failure. Consumers use successful producer artifact IDs rather than guessing their own attempt. A retry of the protected npm job requires approval again; a snapshot-only retry continues under its retained successful approval. **Re-run all jobs rebuilds the candidate** and requires renewed acceptance; do not use it to resume already-published changed bytes.
- **Motion snapshot recovery** is a separate maintenance entry. Select `main`, enter the original daily release run ID and independently approve its existing candidate. It skips the build, requires an already published identical npm version, repeats native checks and fills missing immutable snapshots. It never publishes npm, moves npm tags or accesses the moving guide. If the latest candidate-producing attempt is failed, ambiguous, expired or incompatible, it stops rather than guessing another artifact.
- Version writes use conditional create and byte comparison. Same bytes resume; different immutable bytes stop. A public readback error blocks promotion. A failure after `fixed-write-attempted` may mean the moving write completed: inspect storage and its canonical URL before retrying.
- An unexpected npm `latest` change stops promotion. This workflow does not silently repair tags. Channel rollback is a separate reviewed operation and does not downgrade installed clients or restore their data.

Source/package scans are not a scan of every historical Git object or business classification of all binary assets; reviewers still check content, dependencies, licenses and telemetry boundaries. The historical `0.6.4-test.6` predates these candidate records: do not invent a trusted run for it or republish it to fill this format.

## Validation before activation

Run the repository's release/scanner/guide tests and actionlint. Their no-publication rehearsal uses temporary candidate files and simulated GitHub/npm/R2 responses to test the whole transition and failures. It does **not** exercise hosted approval policy, npm OIDC, real registry installation or CDN routing.

After separately authorized default-branch/environment/npm setup, first run a new candidate and reject its deployment to verify that no publication occurs. A positive hosted rehearsal that proceeds beyond approval is a real publication and requires explicit release authorization. Ordinary PR CI remains credential-free. This implementation PR alone enables none of those administrative actions.
