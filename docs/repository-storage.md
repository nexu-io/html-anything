# Repository size and optional media

Source, template guides, small assets, browser dependencies and the images/GIFs embedded in the README remain in ordinary Git. Full reference/demo videos and the optional Presenter Tech `.motion` archive use Git LFS at their existing paths. Their bytes, source credits and integrity manifests are unchanged.

## Clone and run

```sh
git clone --depth 1 https://github.com/nexu-io/openmotion.git
cd openmotion
npm ci
npm run build:studio
npm start
```

`--depth 1` avoids downloading old history. Omit it when you need the history, or run `git fetch --unshallow` later. This migration does not rewrite shared history: a full clone still downloads the large ordinary Git objects in old commits.

The checked-in `.lfsconfig` excludes LFS downloads by default. Normal clones with Git LFS installed keep pointers until you request the media. Without Git LFS installed, pointers remain ordinary text files. GitHub README images and GIFs, local README previews, built-in Studio templates and repository catalog source do not need these optional downloads. This does not make linked CMS references available offline.

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

# Full README reference films; embedded images/GIFs already work without this.
git lfs pull --include="docs/readme/**" --exclude=""

# Everything needed for complete plugin/platform bundles and resource verification.
git lfs pull --include="docs/readme/**,library/**,examples/**" --exclude="library/templates/catalog/**"
```

For a contributed catalog template, use the [template-specific pull command](template-repository.md#contribute-media-without-cms-access). LFS objects are fetched from the selected remote; reviewing a fork contribution requires the remote that holds its objects. A pointer is not playable video or an executable archive. Full bundles and Library Skill copying refuse unresolved pointers with a download command. Fetch the selected Motion Design profile before materializing it. Once fetched, those resources retain their existing offline behavior.

## Contribute and check storage

Existing attributes automatically track full videos and `.motion` archives under `docs/readme/`, `library/` and `examples/`. For another media path, run `git lfs track --filename <path>` and stage `.gitattributes` with the media. Commit the actual media through Git LFS; do not hand-write pointers. A normal push uploads the objects through the pre-push hook. Keep embedded README previews in ordinary Git; optimize them before expanding the budget.

```sh
git add .gitattributes <changed-paths>
npm run storage:check -- <full-base-commit-sha>
```

The check reads the index, including staged attributes. Ordinary Git checkout contents are limited to 320 MiB. New ordinary Git blobs over 1 MiB fail, including blobs committed and later deleted on the branch. Existing unchanged large source/vendor files and old history remain outside that per-file migration. LFS media/archive files require canonical pointers, matching attributes and a size at most 50 MiB. Catalog contributions additionally retain their stricter path, manifest and per-template budgets.

CI performs the storage check without media downloads. Full runtime/resource and complete-bundle checks explicitly hydrate the legacy media and cache LFS objects; catalog contribution media is downloaded separately only when that template is selected. npm application artifacts continue to exclude showcase media and optional Library content. Complete ZIP builds require downloaded bytes and cannot silently ship pointers.

This change reduces ordinary Git content by approximately 291 MB. Downloading all optional media deliberately restores that storage locally; existing clones also retain any old Git objects until separately maintained. LFS storage/bandwidth usage is separate from Git history. No historical force-push, release publication or branch-protection change is part of this migration.
