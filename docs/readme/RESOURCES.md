# Local README resources

The README's viewing and reuse path stays in this checkout: covers, GIFs, posters, full reference films, before/after videos, contributor avatars, editable examples, fonts and browser scripts all have local files. The English, Simplified Chinese and Japanese introductions (four README files in total) share those files. Original websites provide attribution; the explicitly labeled official campaign link opens its external viewing page.

## What is included

| Resource | Local entry | Integrity and reuse |
| --- | --- | --- |
| 38 full reference/demo videos | [Media manifest](media/manifest.json) | Original URLs, authors where available, file paths, sizes and SHA-256 values. Includes the three presenter reference/remix pairs. Videos retain their original rights; viewing is not a license to reuse a person's likeness, voice or brand. |
| Additional brand and production references | [Showcase manifest](brand-showcase/manifest.json) | Two full case-study videos with GIFs/stills and one official campaign still. Original source ownership and hashes are recorded separately. |
| README cover and diagrams | [Artwork provenance](reverse-engineering-cover.md) and [diagram source](diagrams/generate.py) | The reverse-engineering cover, collaboration concept and editable architecture illustrations are shared across translations and included in distribution. |
| Six editable Motion Design profiles | [Motion Design Remix](../../library/skills/motion-design-remix/SKILL.md) | Original source hashes are retained. The materializer makes an independent project with local scripts, fonts, textures, reference MP4 and provenance. |
| Four additional showcase components | [Source and instructions](../../library/components/showcase/README.md) | Complete component folders and browser dependencies. Glass Shard's explicitly documented local lighting-texture replacement may differ from the original demo. |
| Presenter Tech | [Template package](../../library/templates/presenter-tech/README.md) | Unchanged `.motion` archive, full [demo](../../library/templates/presenter-tech/preview.mp4), creation guide, runner and license. The demo's presenter and voice are not reusable input assets. |
| Three Studio-native templates | [Template library](../../template-library/NOTICE.md) | Browser scripts and font binaries are local and listed in each template's registry manifest, so copied projects retain them. |
| Contributor avatars | [Snapshot manifest](contributors/manifest.json) | GitHub API snapshot dated 2026-11-09; includes the repository's prior history. Profile links still lead to GitHub. |

The **894-entry discovery catalog is a separate index**, not a full video/source mirror. This local collection covers the films and executable examples presented in the README and its linked scenario/comparison/collection pages. A catalog reference without editable source does not become a template because its video is stored locally.

## Resource files versus execution tools

Serving the materialized compositions does not require CDN or Google Fonts access. Custom fonts and replacement media must also be supplied locally. The browser checks block every non-loopback asset request and fail on blocked requests, missing files or JavaScript errors.

Node, a WebGL-capable browser, FFmpeg and the Presenter Tech Python/Node execution dependencies remain separately installed tools. Initial dependency installation and configured model services still need their normal network access. This is resource portability, not an offline operating-system or model distribution.

[Earlier recorded verification](resource-verification.json): blocked-network rendering of 12 reference/remix projects (792 frames), four component pages, eight native-template source pages and the then-current two README pages; 38 complete films fully decoded. This historical rendering record does not cover the newly promoted cover, diagrams, additional showcase or Japanese/Korean pages. Native-template source-page checks are not full Studio export acceptance.

## Keep the collection closed

Run from the repository root:

```sh
node scripts/check-readme-resources.mjs
node --test tests/readme-resources.test.ts tests/motion-design-remix.test.ts
```

The deterministic checks reject embedded remote images, remote video links, missing local references and changed resource hashes. The Motion Design capture helper blocks external requests while rendering. New documentation/resource files also need an explicit entry in `scripts/distribution.ts`. Preserve source credits and third-party licenses; update the relevant manifest when intentionally changing a file. A source URL in a manifest is provenance, not a runtime fallback.

For a standalone Skill handoff, include the entire selected Skill folder. Presenter Story includes its six reference/result films under `assets/`; Motion Design Remix includes its six source videos, fonts and browser dependencies. Reference videos remain viewing material, not replacement footage for new creations.
