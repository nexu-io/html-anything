# Repository-managed motion templates

The source of 286 published motion guidance templates lives in [the repository catalog](https://github.com/nexu-io/openmotion/tree/main/library/templates/catalog): guides, HTML examples, code, measurements and small images. Larger images use existing public CMS rendition links. Reference videos and duplicate ZIP downloads keep their public CMS URLs. These existing links are migration inputs, not a requirement to upload new contributions to CMS. Contributors can add their own media without CMS access; maintainers transfer final media to public storage once before Squash merge. Git LFS is also accepted as an input. Viewing existing linked images requires internet access.

## Run from a local clone

```sh
GIT_LFS_SKIP_SMUDGE=1 git clone --depth 1 https://github.com/nexu-io/openmotion.git
cd openmotion
npm ci
npm run build:studio
npm start
```

The repository also skips optional LFS media by default; see [repository storage and scoped downloads](repository-storage.md). Shallow clones omit old history; run `git fetch --unshallow` before checks that need an unavailable base commit.

Open the `studioUrl` or `previewUrl` printed by `npm start`. Startup reuses a compatible service for the same workspace. On macOS, the shared editor selects a local port dynamically; other platforms try `PORT` (default 4173) and the next nine ports, skipping occupied ones. If all ten are occupied and no compatible service is found, startup reports an error. The launcher exits after reporting the URL; the service keeps running in the background. MCP uses the same startup logic and actual service address when configured for the same `MOTION_DATA_DIR`.

Keep user projects and credentials outside the checkout; `MOTION_DATA_DIR` can select a separate workspace. The plugin root is the cloned `openmotion/` directory: `.codex-plugin/plugin.json` points to `skills/` and `.mcp.json`; that file launches the root `mcp.ts`. For a manual MCP client, launch `node --experimental-strip-types /absolute/openmotion/mcp.ts`, or use `npm run mcp` from the checkout. The repository path is resolved from the loaded plugin, not the caller's working directory.

- Source checkouts default to `MOTION_TEMPLATE_SOURCE=repository`. Studio search and MCP read `library/templates/catalog/` directly, without downloading the CMS catalog. A malformed local catalog fails explicitly.
- `openmotion_list_templates` returns `source=repository`, an absolute JSONL `indexPath`, total and a hash-based `catalogVersion`. Search that file locally; each repository entry includes `localSource` paths.
- `openmotion_get_template` reads local `TEMPLATE.md` instructions and returns `motionDocument={path, content}` plus absolute paths to metadata, Markdown, examples and the manifest. It does not need a running editor/backend to read repository templates.
- Studio uses the same repository reader and serves guides and downloaded media from `/api/template-source/<id>/<path>`. Linked large images and videos still need network access. Local changes are read on the next request; refresh the manifest after source edits.
- An installation without the repository catalog defaults to `cms`, retaining the existing DEV/prod publication and cache behavior. Explicitly set `MOTION_TEMPLATE_SOURCE=cms` to inspect a CMS publication from a checkout. `MOTION_TEMPLATE_ENV` selects the CMS environment; it does not override repository mode.

These imported guidance packages are not verified complete Studio projects. Read their motion rules and examples when authoring a new project; only entries with actual editable project files can use direct template-copy creation. Copied Agent prompts use the connected local plugin in all eleven supported interface languages.

## Layout and storage

- `catalog.json` records the imported publication URL/hash, ordered stable IDs, eleven locale slots and collection facets.
- Each `<id>/template.json` holds shared metadata, exact per-locale differences, optional `sourceArchive` (required only when retaining an imported CMS package URL) and optional `remoteAssets` (original file identity plus CMS rendition URL, byte length and SHA-256).
- `<id>/TEMPLATE.md` explains usage, status and attribution. `<id>/source/` contains unpacked text source, small ordinary-Git assets and optional contribution media under `assets/`. `source/manifest.json` records source paths, sizes and hashes, including the original identities of remotely linked images. `template.json.remoteAssets` maps omitted originals to existing CMS renditions or exact public R2 objects; HTML and Markdown references use the public URLs directly.
- Images/fonts at most 100 KB use ordinary Git under `source/assets/`. The import keeps 1,419 images totaling 65.2 MB; 236 larger originals (32.5 MB) remain in CMS packages and use existing CMS WebP rendition links in the guides. Those renditions total 12.6 MB and are fetched by the browser when viewed. Source, metadata and local images total about 104 MB. Reference videos total 1.34 GB and remain remote. Keeping ZIP downloads remote avoids another 97.7 MB of duplicate files.

All sizes above use decimal MB/GB. The initial import preserves published IDs, ordering, eleven locales, pending conversion state and empty project-file manifests. Guidance and authored examples remain distinct from verified editable Studio projects. Original-language source is accompanied by localized catalog metadata and existing translated download links; the source is not claimed to be translated into every locale.

## Contributor loop

1. Select a stable ID in the catalog. Open its `source/preview.html` in a browser; demo files and small images are local; larger reference images load from CMS links. `TEMPLATE.md` links the separate reference video.
2. Edit source and/or `template.json`. Preserve attribution and actual media permission notes; do not assign a blanket license to third-party references.
3. After source edits, run `npm run templates:manifest -- <id>` to update local file hashes. Preview the affected examples.
4. Stage changes, run `npm run templates:check` and `node --test tests/template-library.test.ts`. The checker reads the Git index, so unstaged files cannot conceal a staged violation.
5. Open a PR against `main` with the exact ID, purpose, rights and actual preview/adaptation checks. Technical checks do not establish human visual acceptance.

For a new entry, no CMS URL or `sourceArchive` is required. Create `template.json`, `TEMPLATE.md`, `source/motion.md`, `source/manifest.json` and `source/preview.html`; register its stable ID in `catalog.json` and provide every locale slot. Keep guide-only entries' project file lists empty until actual executable project files are supplied and verified through the existing contract.

## Contribute media without CMS access

Add media under `<id>/source/assets/` and reference it by a relative path from the template's HTML/Markdown. No CMS or S3 account is required. Keep small images/fonts at most 100 KB in ordinary Git. For a larger file, commit the actual file (at most 50 MiB), or use the existing LFS path under `assets/lfs/`. Refresh the source manifest and open the original PR normally. Optional `template.json.localMedia` selects a logical preview/poster path:

```json
"localMedia": { "preview": "assets/reference.mp4", "poster": "assets/poster.webp" }
```

When the final content is reviewed, a maintainer runs **Actions → Prepare PR media** once for that PR. It uploads changed media, verifies public downloads, replaces the files with links/identities and adds a cleanup commit to the same PR. The original author is retained. Personal forks must enable **Allow edits from maintainers**. There is no upload on every draft push, no replacement PR and no patch for the contributor to apply.

Raw large files can fail CI before preparation. After cleanup, wait for the new commit's CI and required review, then Squash merge. If the contributor later revises media, prepare that revision again. See [the maintainer entry, one-time setup and failure behavior](repository-storage.md#prepare-final-pr-media-before-merging).

Transferred media is publicly linked in HTML/Markdown, catalog previews and MCP detail. The original path, bytes and SHA-256 remain in `remoteAssets` and `source/manifest.json`. Public R2 bytes retain the original hash; existing CMS rendition/original pairs retain their separate identities. Network access is required to view linked media. Existing LFS-only contributions remain readable after their scoped pull:

```sh
git lfs pull --include="library/templates/catalog/<id>/source/assets/lfs/**" --exclude=""
```

## Checks and budgets

The final tree permits source text at most 1 MiB, ordinary images/fonts at most 100 KB, catalog Git content at most 128 MiB, media at most 50 MiB per file and 150 MiB total assets per template. Metadata, manifests, small assets, LFS pointers/attributes and remote identities must agree. Archives, generated output, symlinks, disguised binary source and unregistered files fail validation. A transferred asset must not also remain in Git.

CI validates the final merge tree without media downloads or upload credentials, and requires Squash-only repository settings. Local checks with an explicit base SHA still provide a stricter intermediate-history audit. Technical checks do not replace rights review, actual media playback or visual acceptance. Configuring branch protection remains a separate repository decision.

## Source to publication

`npm run templates:export -- .artifacts/catalog-candidate.json` reconstructs the public CMS publication shape from repository metadata, including all eleven locales, ordering and collection facets. The initial export was deeply compared with the public snapshot for all 286 entries.

Export writes a file only. The imported publication identity remains for comparison; changed content requires a new identity through the normal content workflow. CMS publication remains an internal maintainer operation, never a prerequisite for contributing or locally previewing a template. When publishing through the current CMS-backed website/install channel, package reviewed source, upload it through the existing CMS file workflow, update `sourceArchive` plus affected localized download URLs/hashes, then publish and check the resulting catalog with the existing website/plugin workflow. A metadata export does not prove that edited source has been uploaded.

Source Studio and MCP consume repository edits locally. Website builds and installations without this catalog continue to consume the active CMS publication; their DEV/prod selection and caching remain in place. Merging repository source does not publish CMS content or change installed releases. The catalog and development tools are excluded from the positive application distribution list, so npm installation does not include the additional 104 MB.

## Reproducible import

The development importer accepts a saved public production `main.json` and a directory of `<original-V-id>/motion.md` files (the original downloads contain ZIP bytes despite their suffix):

```sh
node scripts/template-library.ts import /path/to/public-main.json /path/to/packages /path/to/remote-assets.json
```

The remote-asset input is a JSON object keyed by stable ID, using the `remoteAssets` arrays recorded in each template.json. It is required when packages contain image/font assets over 100 KB; the importer refuses to silently add them to Git. The links were resolved from the matching production guides and all 236 CMS renditions were downloaded and hash-checked during the initial import.

It verifies each archive SHA-256 against its content-addressed CMS URL, unpacks text source and small assets and refuses existing template directories. Local images retain their original bytes. Large images use the saved CMS rendition URLs, with original paths/sizes/hashes retained for provenance. Text whitespace is normalized; workstation paths observed in reference-screen OCR are replaced with `/reference-workspace`; affected manifest hashes are refreshed. Original CMS archives remain unchanged. Public provenance is retained without importing private CMS receipts or workstation metadata. Keep external input snapshots outside the repository.
