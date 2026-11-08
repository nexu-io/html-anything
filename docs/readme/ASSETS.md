# OpenMotion README artwork

## One visual family

The public README follows the painterly direction of the [OpenDesign website](https://open-design.ai/): sky blue, turquoise and emerald brushwork, warm ivory space, a little apricot, and crisp charcoal type. The supplied website screenshots were visual references; the new artwork was generated with the **built-in Codex ImageGen tool**. No website screenshots or promotional prices are reproduced as OpenMotion features.

The [OpenMotion Brandkit](../../library/brandkits/openmotion/BRANDKIT.md) records the palette, identity and asset rules. [Ink & Water / MOTION_DESIGN.md](../../library/design-systems/ink-water/MOTION_DESIGN.md) records reusable creative direction. The previous lime 3D cover and boxed explanatory SVGs were replaced after visual feedback. Architecture and lifecycle information now live as selectable Markdown text.

## Asset inventory

| Asset | Source and use |
| --- | --- |
| [Cover](cover.png) | Generated painterly brand poster, 1774 × 887. Final copy leads with AI Cut, pairs the CapCut and Cloud Motion alternative positions, and closes with the creator mission. The primary README image is static for clear typography. |
| [Animated cover](cover-motion.gif) | Optional 800 × 400 camera-breath loop from the same cover; 32 frames, approximately 4 seconds, infinite loop. Brand motion, not recorded application behavior. |
| [Social preview](social-preview.jpg) | 1280 × 640 sharing image derived from the cover. |
| [Library](library.png) | Generated 2172 × 724 companion artwork for the five resource collections. |
| [Community](community.png) | Generated 2172 × 724 companion invitation to create and contribute. |
| [Editor](editor.jpg) and [workspace](workspace.jpg) | Actual Studio 0.6.1 at commit `7aee372`, using an isolated demo workspace and bundled Product Promo project. Original labels and pixels are preserved, shown at full width. |
| Template frames | Existing Product Promo, NYT Graph and Decision Tree posters; their [sources and notices](../../template-library/NOTICE.md) remain alongside the projects. |
| Contributor wall | Dynamic [contrib.rocks image](https://contrib.rocks/image?repo=nexu-io/html-anything), linked to [GitHub contributors](https://github.com/nexu-io/html-anything/graphs/contributors). Represents the repository including HTML Anything history, not a hand-picked OpenMotion-only team. The adjacent text link works without the external image. |
| [OpenDesign symbol](opendesign-symbol.svg) | Unmodified upstream [CDN asset](https://r.open-design.ai/files/1257306170d14488e993cb1f97b86aad8840a3f866f1978e0fd24b9a3c7832d8); retained for provenance, not used as a newly designed OpenMotion mark. SHA-256: `1257306170d14488e993cb1f97b86aad8840a3f866f1978e0fd24b9a3c7832d8`. |

All README images have descriptive alternative text. Artwork, product evidence and reference works are labeled separately. Preserve reference previews and authors rather than repainting their content for brand consistency.

## Generation prompts

### Original painterly cover (superseded copy)

```text
Use case: ads-marketing.
Create one finished GitHub README brand cover for OpenMotion, 2:1 landscape, 1792x896 or equivalent. Art direction: airy painterly landscape in the visual language of OpenDesign's website. Broad expressive dry-brush strokes and translucent watercolor/ink washes on subtly grained ivory paper, a luminous sky-blue upper area fading to warm cream in the center, a flowing turquoise/emerald river of color sweeping across the bottom, soft celadon and a few pale apricot strokes. It should feel hand-painted, expansive, optimistic, and exquisitely art-directed, with organic motion in the brushwork. NOT traditional monochrome Chinese mountains, NOT 3D, NOT glossy plastic, NOT geometric corporate clipart, NOT an infographic.
Compose as an editorial brand poster: almost-black clean modern sans-serif typography, generously spaced, precise sharp letters. Large centered wordmark "OpenMotion" (capital O and M) in the upper-middle, approximately 15 percent of canvas height. Below it in smaller regular type, exact text "The open-source Claude Motion alternative." On the next line, exact text "Everyone can be a creator."
At bottom center in much smaller type, exact text "Standalone app  /  Skills  /  MCP  /  CLI".
All text lives in calm luminous cream/light-blue negative space and remains legible at GitHub width. Leave 8 percent safe margins. Brushwork occupies the peripheral space and the lower third, like a moving landscape of paint. No boxes, buttons, logos, UI, badges, pricing, people, star counts, grids, timelines, extra copy or watermark. A single coherent premium brand image, opaque full bleed.
```

### Resource library banner

The generated cover was supplied as the style reference.

```text
Use case: ads-marketing. Produce a companion brand banner for OpenMotion, following exactly the painterly family of the supplied cover: visible watercolor/ink washes and dry-brush texture on ivory paper, sky blue, turquoise, emerald, celadon and pale apricot. A premium art-directed web editorial banner, wide 3:1 landscape. Calm charcoal clean sans-serif typography over generous cream negative space. No 3D, cards, diagrams, logos, browser chrome, UI mockups, people, badges, pricing, watermarks or extra claims. Keep every letter crisp and safely inset 8 percent. Opaque full bleed. The supplied image is a style reference; create a new composition, do not reproduce its copy. Primary request: a resource-library section banner with organic pigments flowing in from left and right edges, the center luminous and quiet. Exact large centered heading "Made to be remixed." Below, exact small line "Skills / Templates / Motion components / Design systems / Brandkits". The painted gestures are broad, loose and beautiful, not arranged as containers. Use fewer, bigger paint gestures than the cover, so the set feels related rather than repetitive.
```

### Community banner

The same generated cover was supplied as the style reference.

```text
Use case: ads-marketing. Produce a companion brand banner for OpenMotion, following exactly the painterly family of the supplied cover: visible watercolor/ink washes and dry-brush texture on ivory paper, sky blue, turquoise, emerald, celadon and pale apricot. A premium art-directed web editorial banner, wide 3:1 landscape. Calm charcoal clean sans-serif typography over generous cream negative space. No 3D, cards, diagrams, logos, browser chrome, UI mockups, people, badges, pricing, watermarks or extra claims. Keep every letter crisp and safely inset 8 percent. Opaque full bleed. The supplied image is a style reference; create a new composition, do not reproduce its copy. Primary request: a closing community invitation banner. A luminous broad horizon of cream and pale blue above a lush emerald/turquoise sweeping brush wave along the bottom, hints of warm apricot, airy optimism. Exact large centered heading "Make something worth sharing." Below, exact smaller line "Create with OpenMotion. Contribute what you learn." Keep the typography stable, disciplined and warm. This is a quiet finishing panel, more open space than the cover, cohesive with it.
```


### Final AI Cut positioning edit

The cover's final copy is **Cut with AI.**, **The AI-native, open-source CapCut alternative.**, **The open-source Cloud Motion alternative.**, and **Everyone can be a creator.** The latest user-confirmed name is Cloud Motion. The earlier cover prompt below is retained as generation history; the final PNG, GIF and social preview use the new copy. This edit used the built-in Codex ImageGen tool, with the existing painterly cover supplied as the target.

```text
Use case: precise text edit.
Update the supplied watercolor OpenMotion cover to the user's final positioning. Preserve its beautiful existing blue/green/ivory painterly landscape, all brushwork, paper texture, the large OpenMotion wordmark (capital O and M), charcoal typography, and wide 2:1 canvas.
Replace the text below the wordmark with these three centered lines, clearly separated and entirely legible:
Main promise, medium-large bold: "Cut with AI."
Smaller supporting line: "The AI-native, open-source CapCut alternative."
Another equally small supporting line: "The open-source Cloud Motion alternative."
CRITICAL spelling: Cloud Motion, C-l-o-u-d, NOT Claude Motion.
Replace the small footer "Standalone app / Skills / MCP / CLI" with exact text "Everyone can be a creator."
Keep generous margins, polished typography and calm cream negative space behind the copy. Slightly rebalance the text block vertically only as necessary to fit these three lines without crowding the paint. The footer remains at its existing bottom-center position. Do not add any other text, boxes, logos, badges, characters, UI or new objects. This is a copy refinement, keep the visual art direction intact.
```

## Reproduce motion and sharing exports

From the repository root with FFmpeg available:

```sh
ffmpeg -hide_banner -loglevel error -loop 1 -framerate 8 -t 4 \
  -i docs/readme/cover.png \
  -filter_complex "[0:v]scale=1600:-2,zoompan=z='1.003+0.005*(1-cos(2*PI*on/32))':x='iw/2-iw/zoom/2':y='ih/2-ih/zoom/2':d=1:s=800x400:fps=8,split[a][b];[a]palettegen=max_colors=128:stats_mode=diff[p];[b][p]paletteuse=dither=bayer:bayer_scale=4" \
  -loop 0 -y docs/readme/cover-motion.gif

ffmpeg -hide_banner -loglevel error -i docs/readme/cover.png \
  -vf scale=1280:640 -frames:v 1 -q:v 2 -y docs/readme/social-preview.jpg
```

Finite input duration lets palette generation finish. GIF timing rounds to approximately 4.01 seconds. The static cover is the default README image; the GIF is an optional download.

## Catalog preview grid

Unmodified catalog covers link to original resources. The [cover index](../../web/catalog/covers.json) retains acquisition methods; [resource data](../../web/catalog/hyperframes.json) retains authors and sources.

| Resource ID | Preview | Credit |
| --- | --- | --- |
| `hf-block-app-showcase` | [App Showcase](../../web/catalog/covers/51a2d141e18e608cc11b9256.jpg) | Hyperframes |
| `hf-reference-remix-firecrawl` | [Firecrawl Free Keyless](../../web/catalog/covers/02f9ae975461fe6290062d7f.jpg) | @ericciarla |
| `hf-block-glass-shard-title` | [Glass Shard Title](../../web/catalog/covers/10cceacc02d415247d58f562.jpg) | Hyperframes |
| `hf-block-code-3d-extrude` | [Code 3D Extrude](../../web/catalog/covers/0a5c7158bbecd6e47055bef9.jpg) | Hyperframes |
| `hf-block-chrome-orb` | [Chrome Orb](../../web/catalog/covers/dbd79cc4d686e0f4513ff2c9.jpg) | Hyperframes |
| `hf-reference-jake-pond` | [Pond: a new Linux OS](../../web/catalog/covers/66ac2f8b58e55670971ae70c.jpg) | @bflycomputer |

The application license does not grant ownership of referenced films, media or brands.
