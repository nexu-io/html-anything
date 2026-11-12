# Repository-managed motion templates

The source of 286 published motion guidance templates lives in [the repository catalog](https://github.com/nexu-io/openmotion/tree/main/library/templates/catalog): guides, HTML examples, code, measurements and small images. Larger images use existing public CMS rendition links. Reference videos and duplicate ZIP downloads keep their public CMS URLs. These existing links are migration inputs, not a requirement to upload new contributions to CMS. Contributors can add their own media through Git LFS without CMS access. Viewing existing linked images requires internet access.

## Run from a local clone

```sh
GIT_LFS_SKIP_SMUDGE=1 git clone https://github.com/nexu-io/openmotion.git
cd openmotion
npm ci
npm run build:studio
npm start
```

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
- `<id>/TEMPLATE.md` explains usage, status and attribution. `<id>/source/` contains unpacked text source, small ordinary-Git assets and optional LFS media under `assets/lfs/`. `source/manifest.json` records source paths, sizes and hashes, including the original identities of remotely linked images. `template.json.remoteAssets` maps those omitted originals to existing CMS renditions; HTML and Markdown references use the CMS URLs directly.
- Images/fonts at most 100 KB use ordinary Git under `source/assets/`. The import keeps 1,419 images totaling 65.2 MB; 236 larger originals (32.5 MB) remain in CMS packages and use existing CMS WebP rendition links in the guides. Those renditions total 12.6 MB and are fetched by the browser when viewed. Source, metadata and local images total about 104 MB. Reference videos total 1.34 GB and remain remote. Keeping ZIP downloads remote avoids another 97.7 MB of duplicate files.

All sizes above use decimal MB/GB. The initial import preserves published IDs, ordering, eleven locales, pending conversion state and empty project-file manifests. Guidance and authored examples remain distinct from verified editable Studio projects. Original-language source is accompanied by localized catalog metadata and existing translated download links; the source is not claimed to be translated into every locale.

## Contributor loop

1. Select a stable ID in the catalog. Open its `source/preview.html` in a browser; demo files and small images are local; larger reference images load from CMS links. `TEMPLATE.md` links the separate reference video.
2. Edit source and/or `template.json`. Preserve attribution and actual media permission notes; do not assign a blanket license to third-party references.
3. After source edits, run `npm run templates:manifest -- <id>` to update local file hashes. Preview the affected examples.
4. Stage changes, run `npm run templates:check -- <full-base-sha>` and `node --test tests/template-library.test.ts`. The checker reads the Git index, so unstaged files cannot conceal a staged violation.
5. Open a PR against `main` with the exact ID, purpose, rights and actual preview/adaptation checks. Technical checks do not establish human visual acceptance.

For a new entry, no CMS URL or `sourceArchive` is required. Create `template.json`, `TEMPLATE.md`, `source/motion.md`, `source/manifest.json` and `source/preview.html`; register its stable ID in `catalog.json` and provide every locale slot. Keep guide-only entries' project file lists empty until actual executable project files are supplied and verified through the existing contract.

## Contribute media without CMS access

Install [Git LFS](https://git-lfs.com/) and run `git lfs install --local` in your checkout. Put video, audio, large images and fonts under `<id>/source/assets/lfs/`. The repository's `.gitattributes` already tracks that directory; do not hand-write pointer files. Small images/fonts at most 100 KB may remain in ordinary Git under `source/assets/`, preserving the initial import's storage choice. Use LFS for new media when practical.

Reference contributed media with relative paths from HTML/Markdown. Optional `template.json.localMedia` selects locally served catalog previews and posters, for example:

```json
"localMedia": {
  "preview": "assets/lfs/reference.mp4",
  "poster": "assets/lfs/poster.webp"
}
```

Refresh the source manifest before staging, then push to your fork and open a PR. A normal `git push` uploads LFS objects through its pre-push hook; no CMS account or maintainer upload is required. The manifest records the real media's SHA-256 and size, whether the checkout contains downloaded bytes or only a canonical pointer.

Clone with `GIT_LFS_SKIP_SMUDGE=1` as above to avoid downloading every template. Before previewing one template, download only its media:

```sh
git lfs install --local --skip-smudge
git lfs pull --include="library/templates/catalog/<id>/source/assets/lfs/**" --exclude=""
```

Replace `<id>` with the selected template ID. If the clone came from a fork, pull from the remote containing that contribution's LFS objects. A missing LFS file is not usable media: the local source API returns `TEMPLATE_LFS_NOT_FETCHED` with the scoped pull command. Downloaded media must match its source manifest. No implicit CMS upload, automatic format conversion or background LFS download is performed.

## Checks and budgets

- Ordinary Git: text at most 1 MiB per file; small images/fonts at most 100 KB (100,000 bytes); catalog Git contents at most 128 MiB, including pointer bytes.
- LFS: at most 50 MiB per media file and 150 MiB total locally stored media per template, counting the sizes declared by pointers rather than their tiny Git blobs.
- LFS media must live in `source/assets/lfs/`, have a canonical pointer and matching staged LFS attributes, and match the real media identity recorded in `source/manifest.json`.
- Raw video/audio in Git, oversized ordinary images, archives, generated output, symlinks, disguised binary source and unregistered files fail validation. New Git history is checked even when a large/raw file was subsequently deleted. Existing product assets and old history are outside this policy.
- Existing verified CMS links remain supported. Their original identities stay in `remoteAssets` and the source manifest; they must not duplicate a local file. New contributions need no CMS package URL.

CI's **Template library policy** job checks metadata, staged content, pointers, manifest identities, budgets and new Git history without downloading media or using publication credentials. It does not establish remote LFS object availability. Reviewers must fetch the contribution's LFS media and preview it before acceptance; hosting quotas and a full independent external-account fork/push/review check remain operational acceptance tasks. Making this CI check required is a separate branch-protection setting; this change does not configure it.

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
