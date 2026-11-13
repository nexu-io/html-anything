# README resources and optional local copies

English, Simplified Chinese and Japanese READMEs share the same media. Artwork and previews above 100 KB load directly from immutable public R2 URLs registered in `repository-media.json`; small artwork stays local. Current Motion template cards link to their public detail pages. Presenter references have no online template link. Earlier films and editable resources retain their logical paths for reuse and attribution.

Full reference videos and the optional template archive use Git LFS at the same paths. Public README previews need internet access, with no CMS login or LFS download. `npm run media:pull -- docs/readme` restores their exact original bytes at the paths recorded below for reproduction. It does not rewrite README URLs for offline viewing. Fetch the desired media before watching complete videos, materializing an optional Library profile, or verifying full resource hashes; see [scoped download commands](../repository-storage.md#download-only-what-you-need).

## Retained local collection

GitHub's image proxy rejects images above 5 MB. Three original GIFs therefore have separate display versions (maximum width 360 px, 8 fps, 96 colors, Bayer dither scale 3, infinite loop). The display versions retain the full excerpt and playback speed. Both versions have independent size/SHA-256 records in `repository-media.json`; the original provenance manifests remain unchanged.

| GIF | Public original download | Display size |
| --- | --- | --- |
| Career advice comparison | [Original GIF](https://releases.open-design.ai/open-motion/media/sha256/e37ea339df778c47b4cc7f436cd90feb6adfbbc6f66cf2b70d6ad7e6775ce687.gif) | 2,331,985 bytes |
| Video editor comparison | [Original GIF](https://releases.open-design.ai/open-motion/media/sha256/4857036ea4186885cc756ed983102af3edf84db74c212e9b7bd84af8285b9ae2.gif) | 2,046,836 bytes |
| Wireframe portal comparison | [Original GIF](https://releases.open-design.ai/open-motion/media/sha256/0796256eb0309ea3127e3603bd85cd1c9a378a647ac61ab951ce296a522ed34a.gif) | 836,877 bytes |

`npm run media:pull` restores originals at their existing paths. Display versions belong only to documentation: the two presenter GIFs use `.github.gif` paths under `docs/readme/people/`, and Wireframe Portal uses `docs/readme/motion-design/wireframe-portal-title.github.gif`. They are excluded from the standalone Library Skill payload, preserving its pinned recovery tree. Resource checks reject embedded images above 5 MB while allowing download links to larger originals.

| Resource | Local entry | Integrity and reuse |
| --- | --- | --- |
| 38 full reference/demo videos | [Media manifest](media/manifest.json) | Original URLs, authors where available, file paths, sizes and SHA-256 values. Includes the three presenter reference/remix pairs. Videos retain their original rights; viewing is not a license to reuse a person's likeness, voice or brand. |
| Additional brand and production references | [Showcase manifest](brand-showcase/manifest.json) | Two full case-study videos with GIFs/stills and one official campaign still. Original source ownership and hashes are recorded separately. |
| README cover and diagrams | [Artwork provenance](reverse-engineering-cover.md) and [diagram source](diagrams/generate.py) | The reverse-engineering cover, collaboration concept and editable architecture illustrations are shared across translations and included in distribution. |
| Six editable Motion Design profiles | [Motion Design Remix](../../library/skills/openmotion-design-remix/SKILL.md) | Original source hashes are retained. The materializer makes an independent project with local scripts, fonts, textures, reference MP4 and provenance. |
| Four additional showcase components | [Source and instructions](../../library/components/showcase/README.md) | Complete component folders and browser dependencies. Glass Shard's explicitly documented local lighting-texture replacement may differ from the original demo. |
| Presenter Tech | [Template package](../../library/templates/presenter-tech/README.md) | Unchanged `.motion` archive, full [demo](../../library/templates/presenter-tech/preview.mp4), creation guide, runner and license. The demo's presenter and voice are not reusable input assets. |
| Three Studio-native templates | [Template library](../../template-library/NOTICE.md) | Browser scripts and font binaries are local and listed in each template's registry manifest, so copied projects retain them. |
| Contributor avatars | [Snapshot manifest](contributors/manifest.json) | GitHub API snapshot dated 2026-11-09; includes the repository's prior history. Profile links still lead to GitHub. |

The **earlier 894-entry discovery catalog is a separate index**, not a full video/source mirror. This retained collection covers earlier README examples and their linked scenario/comparison/collection pages. A catalog reference without editable source does not become a template because its video is stored locally.

## Resource files versus execution tools

Serving the materialized compositions does not require CDN or Google Fonts access. Custom fonts and replacement media must also be supplied locally. The browser checks block every non-loopback asset request and fail on blocked requests, missing files or JavaScript errors.

Node, a WebGL-capable browser, FFmpeg and the Presenter Tech Python/Node execution dependencies remain separately installed tools. Initial dependency installation and configured model services still need their normal network access. This is resource portability, not an offline operating-system or model distribution.

[Earlier recorded verification](resource-verification.json): blocked-network rendering of 12 reference/remix projects (792 frames), four component pages, eight native-template source pages and the then-current two README pages; 38 complete films fully decoded. This historical rendering record does not cover the newly promoted cover, diagrams, additional showcase or Japanese/Korean pages. Native-template source-page checks are not full Studio export acceptance.

## Keep the collection closed

Run from the repository root:

```sh
git lfs pull --include="docs/readme/**,library/**,examples/**" --exclude="library/templates/catalog/**"
npm run media:pull
node scripts/check-readme-resources.mjs
node --test tests/readme-resources.test.ts tests/motion-design-remix.test.ts
```

The deterministic checks allow only registered public media URLs and reject other embedded remote images/video, missing local references and changed resource hashes. Full hash verification requires the optional local copies; viewing the README does not. The Motion Design capture helper blocks external requests while rendering. New documentation/resource files also need an explicit entry in `scripts/distribution.ts`. Preserve source credits and third-party licenses; update the relevant manifest when intentionally changing a file. A source URL in a manifest is provenance, not a runtime fallback.

For a standalone Skill handoff, include the entire selected Skill folder. Presenter Story includes its six reference/result films under `assets/`; Motion Design Remix includes its six source videos, fonts and browser dependencies. Reference videos remain viewing material, not replacement footage for new creations.


## Current public README catalog

The current README uses the [live template catalog](https://open-design.ai/templates/) for Motion examples, with one detail-page link per template. GIF and poster identities are recorded in the [current template manifest](live-templates/manifest.json); large previews use registered public URLs with optional local copies. Presenter references have no online template page. The legacy collection above remains separate from the current online catalog.

The current [Studio screenshots](live-product/manifest.json) cover the template library, template detail and recreation instruction in English, Simplified Chinese and Japanese. Online detail pages provide the current reference and instructions; the manifests retain the original capture identities regardless of media storage.
