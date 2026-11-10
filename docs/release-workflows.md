# Manual candidate and test publication workflows

These workflows implement controlled delivery of the complete `@openmotion/app` npm application. They do not run on a push, PR merge, tag or schedule. This feature PR does not enable them on the default branch, configure npm trust, publish anything, change `main` or rename the repository.

| Capability | Test version | Stable version |
| --- | --- | --- |
| Package builder | Supports `X.Y.Z-test.N[.N]` | Supports `X.Y.Z` |
| Manual candidate and publication workflows | Implemented here; require administrator enablement | Not implemented |
| npm channel | `test` | Planned: verify under `stage`, then separately authorize `latest` |
| Hosted guide paths | Test moving/versioned paths | Stable moving/versioned paths supported by the storage helper; no stable publication job |

Both public channels use prod template defaults. A test software version does not select private DEV templates. Stable acceptance rules exist in [the acceptance guide](release-guide.md); they are not an automated stable release pipeline.

## Administrator setup before first use

The current default `main` contains the legacy project. GitHub requires a manual workflow to be registered on the default branch before showing its Run workflow entry. Register the reviewed release controls on `main` through a separately authorized PR; do not copy the Motion application or force-push its history. Both entries must run with **Use workflow from: main**. Feature-branch invocations fail closed.

The minimal registration includes:

- `.github/workflows/motion-candidate.yml` and `motion-publish-test.yml`.
- `.github/scripts/motion-release.mjs`, `motion-scan.mjs`, `motion-registry-smoke.mjs`, `publish-install-guide.mjs` and `.github/gitleaks.toml`.
- `scripts/runtime-assets.mjs`, `release-version.mjs`, `install-guide.mjs` and `docs/install.md`.

Protect changes to these trusted files and `main`. Create the **`motion-test-publish` GitHub Environment**, restrict deployment branches to `main`, require an independent reviewer and prevent self-review. Referencing an environment in YAML does not configure those protections: GitHub can create an unprotected environment automatically. Verify the rejection/approval behavior before enabling publication.

In npm package settings for `@openmotion/app`, configure a GitHub trusted publisher for owner `nexu-io`, repository `html-anything`, workflow `motion-publish-test.yml`, environment `motion-test-publish`, allowing **publish**. The workflow uses GitHub-hosted runners and Node 26.11.1/npm 11.20.0 with `id-token: write`; it does not require a stored npm token. Do not grant tag-management actions for this workflow. See [npm trusted publishing](https://docs.npmjs.com/trusted-publishers/).

Keep the existing R2 settings; only the final snapshot step receives the credentials:

| Setting | Value or role |
| --- | --- |
| Secrets `CLOUDFLARE_R2_RELEASES_AK`, `CLOUDFLARE_R2_RELEASES_SK` | Bucket-scoped S3 write credentials |
| Variable `CLOUDFLARE_R2_RELEASES_BUCKET` | `open-design-releases` |
| Variable `CLOUDFLARE_R2_RELEASES_URL` | The approved R2 S3 HTTPS origin |
| Variable `CLOUDFLARE_R2_RELEASES_PUBLIC_ORIGIN` | `https://releases.open-design.ai` |

Protect publication control changes as well as the environment. The application source is checked out separately at its selected SHA. Neither that source nor the downloaded application executes in a credentialed job. Native installation runs in separate jobs without npm/R2 credentials or OIDC permission.

## 1. Build a candidate without publication

After review and integration into `feature/motion`, open **Actions → Motion candidate build → Run workflow**. Select `main` for the workflow and supply:

| Input | Example | Requirement |
| --- | --- | --- |
| `source_sha` | A full 40-character Git SHA | Already integrated into `feature/motion`; not a mutable branch name |
| `version` | `0.6.4-test.7` | New `MAJOR.MINOR.PATCH-test.N[.N]`; never reuse a version for changed bytes |

The trusted workflow validates ancestry, scans tracked source before installing dependencies, runs the technical checks/Studio regressions/eleven-Tool ZIP E2E, and builds the final npm tgz **once** with prod template defaults. It scans both the outer npm package and its inner application archive, then freezes the guide and records.

Download the `motion-candidate-<run-id>-<attempt>` Actions artifact within its **30-day retention**. Preserve it in the internal acceptance record before expiry; an expired candidate cannot be published through this entry and must be rebuilt under a new version. Artifacts in this public repository are not an internal-data channel.

The artifact has seven files: the complete `openmotion-app-<version>.tgz`, `release-npm.json`, `source-scan.json`, `package-scan.json`, `install.md`, `install-record.json` and `candidate.json`. The latter records source/workflow SHA, run/attempt, package SHA256, npm SHA512 integrity and every file hash. Its acceptance state is `not-performed`. The frozen guide is intended for publication **after npm succeeds**; do not distribute it as a working registry entry before publication.

The run summary gives the source/version/hash for reviewers. Build success is technical evidence, not an acceptance approval. Use [the acceptance checklist](release-guide.md) to install that tgz in isolated profiles, test upgrades, templates, real Agent creation and human audiovisual playback. Record PASS / FAIL / NOT RUN, supported OS/host, known issues, owner and prior usable version. Keep the accepted artifact byte-for-byte; do not rebuild it for publication.

## 2. Publish the accepted test candidate

Use [the record template](templates/release-record.md). Export the completed internal acceptance record as a fixed UTF-8 file, keep it internally, and calculate its SHA256 (`shasum -a 256 acceptance.md`, or PowerShell `Get-FileHash acceptance.md -Algorithm SHA256`). This digest links public release identity to the retained private acceptance evidence; it does not itself prove that testing happened. The environment reviewer must inspect the actual record.

Open **Actions → Motion test publication → Run workflow**, use `main`, and supply:

| Input | Meaning |
| --- | --- |
| `candidate_run_id` | Successful trusted candidate build run ID; the current successful attempt is selected |
| `tgz_sha256` | Exact accepted SHA256 from that candidate |
| `acceptance_sha256` | Digest of the completed, retained internal acceptance record; no private URLs or logs |
| `action` | `publish-test` to publish/promote; default `archive-only` only fills snapshots for an already published identical version |
| `approved` | Explicitly check after reviewing this exact identity; defaults to false |

An independent environment reviewer approves the protected jobs. A rerun or workflow invocation is publication authorization and must be treated accordingly. Do not run the workflow merely to check its configuration.

The pipeline then:

1. Verifies the originating repository, manual workflow/main ref, successful run/attempt, GitHub artifact digest and all candidate hashes; rechecks integrated source ancestry and rescans source plus both archives using the trusted control policy.
2. In the protected npm job, publishes **only the accepted tgz bytes** with `--tag test --ignore-scripts --provenance=false`. An existing identical version resumes without another publish; a different integrity fails. `archive-only` requires an existing identical version and never changes npm tags.
3. On separate macOS 26 arm64 and Windows Server 2025 x64 runners, downloads the exact registry version anonymously using empty npm configs and a fresh cache, verifies SHA256/SHA512, installs a pinned Codex CLI into a temporary prefix, runs isolated setup/repeat setup, prepares Chromium/FFmpeg/ffprobe, and checks MCP Tools/resources and installed Skill files. This is native technical acceptance; Windows Server results do not replace Windows desktop/real model/human playback acceptance. No model credentials are provided.
4. Requires both platform reports, confirms exact registry identity and test tag, rejects an unexpected `latest` change, then writes immutable R2 snapshots and checks the **canonical public bytes**. Only after all of these succeed does `publish-test` conditionally advance the default test guide using its prior ETag. `archive-only` never reads or writes the default guide.

The workflow does not move `latest`, publish a stable version, create a GitHub Release, announce a release or update installed clients. Keep the package pinned by exact version in every guide. Node/Agent and checked native downloads remain prerequisites as documented in [installation](npm-installation.md).

OIDC still authenticates the publisher. Automatic npm provenance is explicitly disabled: it would describe the publication workflow's `main` SHA, while the accepted application was built from a different selected source SHA. `candidate.json`, the embedded manifest, source/lock hashes and the immutable release record provide the actual application identity and candidate build reference. These records are not a signed build-provenance attestation. Supporting such an attestation requires a separate implementation that binds the real candidate build and its inputs; do not substitute the workflow SHA or rewrite GitHub's source context.

## Immutable snapshots and moving entries

| Channel | Moving guide, updated last | Immutable guide |
| --- | --- | --- |
| Test software with prod templates | `/open-motion/dev/install.md` | `/open-motion/dev/<version>/install.md` |
| Stable software with prod templates | `/open-motion/install.md` | `/open-motion/<version>/install.md` |

The stable path contract is supported by the storage helper; **this PR adds no stable publication workflow**. Existing `/versions/<version>/install.md` bytes remain immutable and are not overwritten. `dev` in a URL means test software, not DEV template data. Public candidate/publish workflows offer no DEV package option. Use the separate local/private DEV instructions for internal templates; environment variables cannot turn network authorization into access.

Each test version directory additionally archives the exact tgz, manifest, scan reports, `install-record.json`, `candidate.json`, both registry reports and `release-record.json`. No sidecar application download is needed to install the complete npm tgz. The public release record includes source/hash/integrity, candidate workflow identity, acceptance-record digest, approving actor, publication run, platform evidence hashes and timestamp. Never put internal Feishu links, acceptance material or user projects in it.

Actions retains each npm publication state and R2 attempt/prior default instructions for 30 days. R2 version snapshots persist under the bucket's separately managed lifecycle; do not apply an expiry policy without an agreed retention decision. The original candidate artifact must still exist for a publication retry.

## Failure, retry and recovery

- A failed source/package scan blocks the candidate or publication before credentials are used. Gitleaks 8.30.1 is checksum-pinned; source-controlled ignore files and inline allow markers cannot bypass the trusted policy. Reports expose rule/path/line, never matched secrets. Targeted rules also reject private files, internal links and personal paths. Narrow exceptions cover the already public DEV routing hostname, synthetic redaction fixtures and the exact approved public analytics ingestion identifier. Scans cover the selected source tree and final package, **not all historical Git objects** or business classification of every binary asset; reviewers still inspect content, dependencies and licenses.
- npm success followed by registry/platform/R2 failure leaves the default guide unchanged. Inspect `npm-publication.json`, the failed job and `release-attempt.json`/`publication.json`. The npm version may already be public; do not rebuild, overwrite or blindly republish it. Rerun with the same candidate/hash/acceptance digest after fixing infrastructure. If bytes change, start a new version.
- GitHub's **Re-run failed jobs** and **Re-run all jobs** are supported. Verify, npm and each native platform expose their actual immutable upload ID as a job output. A downstream retry downloads those retained producer IDs within the same workflow run instead of guessing names from its own attempt number. Mac and Windows have separate outputs, so a failed Mac check can rerun while retaining the successful Windows report. Each attempt still creates new artifacts; previous attempts and the original candidate are not overwritten. Expired/deleted producer artifacts fail the download rather than falling back to another package.
- Snapshot writes use conditional create and byte comparison. Identical existing objects resume; any different version object stops the run. A CDN readback failure stops promotion. A failure after `fixed-write-attempted` may mean the default write completed: inspect storage and canonical URL before recovery.
- `archive-only` is for an identical existing npm version and missing immutable snapshots. It does not restore a missing npm `test` tag or roll back a moving guide. Those are separate reviewed channel/recovery actions. An unexpected `latest` change requires investigation; this workflow does not silently remove or rewrite it.
- Reverting a guide or npm tag does not downgrade clients or restore project data. Use an accepted compatible reinstall or retained backup according to [recovery](release-guide.md#recovery-and-feedback). If no compatible prior version exists, state that.

The currently published `0.6.4-test.6` predates these candidate records. Its historical evidence remains in the acceptance guide; do not fabricate a new trusted candidate run or republish it merely to fill the new format.
