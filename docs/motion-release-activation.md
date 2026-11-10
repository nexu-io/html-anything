# Motion release controls on the legacy default branch

This branch retains the legacy HTML Anything application. The Motion application still lives at the root of `feature/motion`. These additions register manual Actions entries on the default branch; they do not replace the application, change package/workspace metadata, merge Motion into main, or publish anything on a push/merge.

## Scope and provenance

The three manual workflows, their runtime helpers, installation/acceptance templates and deterministic tests are copied without modification from reviewed PR [#214](https://github.com/nexu-io/html-anything/pull/214), source commit `de45dadea282214762c7b3123cea7e6b1044f26f`. No private Git history or application files are imported. The extra `Motion release controls` CI job runs only syntax checks and simulated-service tests with read-only permissions; the existing legacy CI remains unchanged.

GitHub requires a manual workflow to exist on the default branch before its Run workflow entry is available. Our controls additionally require execution from `main`; they fetch the Motion application from a reviewed commit integrated into `feature/motion`. See [GitHub manual workflows](https://docs.github.com/en/actions/how-tos/manage-workflow-runs/manually-run-a-workflow).

## Activation order

1. Integrate PR #214 into `feature/motion` after its required checks and review. This registration PR does not merge it.
2. Review and merge this control-only PR into `main`. This makes the entries available without running any candidate build or publication. The normal credential-free CI jobs run on the merge.
3. An npm package maintainer separately configures the GitHub trusted publisher for `@openmotion/app`: owner `nexu-io`, repository `html-anything`, workflow filename `motion-publish-test.yml`, Environment blank, and permission to publish. No stored npm token or independent approval environment is required. See [npm trusted publishers](https://docs.npmjs.com/trusted-publishers/).
4. Reuse the existing R2 Secrets `CLOUDFLARE_R2_RELEASES_AK` and `CLOUDFLARE_R2_RELEASES_SK`, and Variables `CLOUDFLARE_R2_RELEASES_BUCKET`, `CLOUDFLARE_R2_RELEASES_URL` and `CLOUDFLARE_R2_RELEASES_PUBLIC_ORIGIN`. Do not add secret values to source. Only the final storage step receives R2 credentials.

These are separate actions. Preparing or merging the registration does not authorize a package publication, repository rename or product-main cutover.

## Daily operation

1. **Build:** Actions → Motion candidate build → Run workflow → select `main`. Enter a new `X.Y.Z-test.N` version; normally leave `source_sha` empty to freeze the latest `feature/motion` head once. A supplied full SHA must already be integrated into that branch. The build checks/scans source and archives, and retains the exact candidate for 30 days without npm OIDC or R2 credentials.
2. **Download and accept:** Download `motion-candidate-<version>` from the successful run, extract it and give its directory to the Agent: “Follow candidate-install.md, verify candidate.json and the local tgz hash, install the exact local package with an isolated host profile, application home, data and Skills directories, complete prepare, and record actual results in a private copy of acceptance.md. Mark unrun checks NOT RUN. Do not publish.” Keep actual host loading, template/edit/export checks, real Agent creation and human playback separate. Public test software defaults to prod templates; internal DEV packages use a separate process.
3. **Publish:** Only after acceptance, Actions → Motion test publication → Run workflow → select `main`. Enter the exact accepted version and confirm `accepted`. This is the publication authorization, with no later independent approval dialog. Candidate provenance/hashes and scans are checked again; only the accepted tgz is published to npm `test`, then anonymously checked on Mac/Windows before immutable R2 snapshots and the default test guide are updated.

Before npm publication, use the candidate's **local** `candidate-install.md`, not the sibling registry `install.md`. After publication, the moving test guide is `https://releases.open-design.ai/open-motion/dev/install.md`; the immutable guide is `/open-motion/dev/<version>/install.md`. Stable publication is not implemented by these controls, and npm `latest` is not deliberately changed.

## Risk and recovery boundaries

- Registration is a capability change: users who can dispatch the trusted publication workflow can confirm and start a public release. There is no independent approval gate at this stage. Protect workflow edits and restrict operational access; the operator confirmation records intent, not proof of private testing.
- Builds do not publish. The publication form defaults acceptance to false and rejects missing, expired, ambiguous or untrusted candidates, changed bytes and unintegrated source. Do not rebuild a published version or guess among duplicate candidate artifacts.
- npm publication cannot be rolled back atomically with later checks. If native verification or R2 upload fails, npm may already be public while the default guide stays unchanged. Inspect retained records before using Re-run failed jobs; those retries reuse successful producer artifact IDs and never rebuild the candidate.
- Motion snapshot recovery is maintenance only: an exact already published identical version is required; no build, npm publication, tag movement or default-guide access is allowed. Channel rollback and client/data recovery require separate decisions.
- A single publication concurrency group and version/ETag checks protect channel promotion. Operate one release at a time; GitHub does not provide a durable FIFO queue.
- Disabling/removing these workflow registrations later does not undo a published npm version, restore user projects or revoke npm trust. Those are separate operations.

The implementation manual remains on the [reviewed Motion branch](https://github.com/nexu-io/html-anything/blob/de45dadea282214762c7b3123cea7e6b1044f26f/docs/release-workflows.md). Keep the full acceptance record internal. Real hosted workflow dispatch, npm OIDC, registry-native acceptance and R2/CDN writes need a separately authorized rehearsal; passing these control tests does not establish that those external integrations are active.
