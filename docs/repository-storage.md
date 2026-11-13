# Repository size and optional media

Source, template guides, small assets and browser dependencies remain in ordinary Git. README artwork and optional Library previews above 100 KB are served from immutable public R2 URLs and recorded in `repository-media.json`. Full reference/demo videos and the optional Presenter Tech `.motion` archive still use Git LFS. Registered optional media bytes, source credits and their integrity manifests are unchanged.

Local catalog reference images and gallery covers use WebP at their original dimensions. The conversion uses `cwebp -q 85 -m 6 -sharp_yuv`; source links, paths and manifest hashes describe the checked-in WebP files. Each affected template records the encoding in its provenance. Original CMS archives, source-video identities and remote-media locks remain unchanged. For new reference screenshots, prefer WebP and check small text at its intended display size before refreshing the source manifest.

Embedded documentation images must fit GitHub's 5 MB image-proxy limit. Three larger GIFs use smaller display versions while their unchanged originals remain publicly downloadable; see [display encoding and original links](readme/RESOURCES.md#retained-local-collection).

## Clone and run

```sh
git clone --depth 1 https://github.com/nexu-io/openmotion.git
cd openmotion
npm ci
npm run build:studio
npm start
```

`--depth 1` avoids downloading old history. Omit it when you need the history, or run `git fetch --unshallow` later. This migration does not rewrite shared history: a full clone still downloads the large ordinary Git objects in old commits.

The checked-in `.lfsconfig` excludes LFS downloads by default. Normal clones with Git LFS installed keep pointers until you request the media. Without Git LFS installed, pointers remain ordinary text files. GitHub and local Markdown viewers load registered public README images/GIFs directly, without CMS authentication or an LFS download. Those previews require internet access. Built-in Studio templates and repository catalog source retain their local dependencies. Linked CMS references are not made available offline.

The preview migration removes 134,065,890 bytes from the default working tree. It preserves all catalog entries and their local source assets. The WebP conversion reduces 2,008 local images from 74.2 MB to 23.0 MB without an additional download step. The Git checkout budget is 128 MiB; it includes every tracked path even when identical files share a Git blob. Installed dependencies, optional downloads and old history are separate from this budget.

## Download only what you need

Install [Git LFS](https://git-lfs.com/), then initialize it in the checkout:

```sh
git lfs install --local
```

Choose one scope and override the default exclusion explicitly:

```sh
# Reference films for one optional Library Skill.
git lfs pull --include="library/skills/openmotion-design-remix/**" --exclude=""

# Presenter Tech archive and its full preview video.
git lfs pull --include="library/templates/presenter-tech/**" --exclude=""

# Full README reference films; public images/GIFs do not need this.
git lfs pull --include="docs/readme/**" --exclude=""

# Everything needed for complete plugin/platform bundles and resource verification.
git lfs pull --include="docs/readme/**,library/**,examples/**" --exclude="library/templates/catalog/**"
```

For a contributed catalog template, use the [template-specific pull command](template-repository.md#contribute-media-without-cms-access). LFS objects are fetched from the selected remote; reviewing a fork contribution requires the remote that holds its objects. A pointer is not playable video or an executable archive. Full bundles and Library Skill copying refuse unresolved pointers with a download command. Fetch the selected Motion Design profile before materializing it. Once fetched, those resources retain their existing offline behavior.

## Prepare final PR media before merging

Contributors edit their original PR normally. A new catalog video, audio file or large image/font can be committed under `<id>/source/assets/` (at most 50 MiB per file). Git LFS remains a supported input, not a required account or separate upload step. Keep small imported assets and small README artwork in ordinary Git. Raw media can make the policy check red until final preparation; do not repeatedly transfer every draft update.

After the content review, a maintainer opens **Actions → Prepare PR media → Run workflow**, selects `main` and enters the original PR number. This performs one final preparation:

1. Lock the current PR commit and check maintainer identity, fork edit permission and Squash-only repository settings.
2. Build and validate a cleanup commit without running PR code, hooks, dependencies or `.lfsconfig`.
3. Upload only changed media to immutable `open-motion/media/sha256/` keys in the public R2 bucket. Read the public objects back and verify their SHA-256 and sizes.
4. Push one cleanup commit to the original PR. Catalog media becomes `template.json.remoteAssets`; relative guide references become public URLs. Other optional media is registered in `repository-media.json`, with its local path ignored by Git.
5. Wait for the new commit's CI and any renewed review required by branch rules, then use **Squash and merge**. The workflow does not merge or approve the PR.

The PR author stays unchanged. On a personal-account fork, the contributor must enable **Allow edits from maintainers**. Missing permission, a changed PR head, failed upload, wrong public bytes or a rejected push stops preparation. Failed attempts can leave harmless immutable objects in storage; they do not merge anything. Reruns reuse already verified objects. If the contributor edits media after preparation, process that new revision before merging.

### One-time maintainer setup

- Merge this workflow into `main` to register its manual Actions entry.
- Configure **Squash merge only**: enable Squash merging and disable merge commits and rebase merging. CI verifies these settings before accepting sanitized PR trees. Existing history is unchanged.
- Add Actions secret `OPENMOTION_MEDIA_MAINTAINER_TOKEN` for a maintainer user identity with upstream write access and access to allowed fork edits. A classic PAT with `public_repo` access is suitable for public repositories; organization SSO and token policies still apply. A base-repository installation token or default `GITHUB_TOKEN` cannot edit an arbitrary fork. Do not store a token in a checked-in file.
- The workflow reuses the existing `CLOUDFLARE_R2_RELEASES_AK` / `CLOUDFLARE_R2_RELEASES_SK` secrets and bucket/endpoint variables. It writes only under the media prefix and never publishes an application or changes installation guides. No contributor receives these credentials.

Only a maintainer starts the Action after review. There is no upload on PR open, push or approval, no contribution label, replacement PR or contributor-applied patch. Ordinary PR CI has no storage or maintainer token. The workflow checks out only its trusted main commit and reads PR blobs as data.

For a read-only local preview of the plan, use `npm run media:prepare -- <PR-number>` with GitHub CLI authentication. `--apply` performs the same transfer/write operation using the maintainer identity and configured AWS CLI credentials; use the Action to reuse the repository's R2 credentials.

### Read and package transferred media

Catalog search and MCP detail read local source and return the public preview/poster URL. They do not download media in the background. HTML and Markdown use public asset URLs. Reading the logical source asset through the local API downloads and verifies its bounded body.

Other optional media retains its local logical path in `repository-media.json`. Fetch one scope or the complete legacy set:

```sh
npm run media:pull -- library/skills/openmotion-design-remix

# Recover original README artwork at its recorded local paths.
npm run media:pull -- docs/readme

# Restore every registered optional file for full bundles/resource verification.
npm run media:pull
```

Only those registered files are downloaded, with size/hash verification and atomic replacement. These commands do not fetch all catalog media. Legacy files still in LFS need the scoped pulls above. Full bundles and resource verification explicitly fetch both stores; npm application packages exclude showcase and optional Library payloads.

### Checks and history

Stage changes, then run `npm run templates:check` and `npm run storage:check` to validate the final tree. Ordinary Git checkout contents are limited to 128 MiB; newly staged ordinary files above 1 MiB fail. Catalog small assets are limited to 100 KB, media files to 50 MiB and total assets per template to 150 MiB. Metadata, source manifests, canonical URLs, identities and duplicate local/remote storage are checked without downloading media.

PR CI uses `--final-tree` with the PR base to check the final merge tree after verifying Squash-only settings. Passing a base SHA to the local checkers additionally checks every intermediate branch commit; that stricter history audit intentionally rejects raw files added and later removed. It is not the merge gate for this final-preparation flow. Squash commits the sanitized final tree; merge/rebase would retain the intermediate media, so they must stay disabled.

The existing LFS migration removes approximately 291 MB from ordinary Git, and the preview migration removes another 134 MB. Optional downloads restore those bytes locally; full clones retain old binary history. Routine PR preparation only transfers media changed in the selected PR. The existing 71 LFS resources remain in LFS. The preview migration verifies each public R2 object's size and SHA-256 before removing its local Git copy. It does not rewrite history or configure branch protection. An independent contributor-fork write remains unverified.
