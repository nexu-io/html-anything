# OpenMotion README artwork

## One visual family

The public README follows the painterly direction of the [OpenDesign website](https://open-design.ai/): sky blue, turquoise and emerald brushwork, warm ivory space, a little apricot, and crisp charcoal type. The supplied website screenshots were visual references; the new artwork was generated with the **built-in Codex ImageGen tool**. No website screenshots or promotional prices are reproduced as OpenMotion features.

The [OpenMotion Brandkit](../../library/brandkits/openmotion/BRANDKIT.md) records the palette, identity and asset rules. [Ink & Water / MOTION_DESIGN.md](../../library/design-systems/ink-water/MOTION_DESIGN.md) records reusable creative direction.

## Product logo

The [OpenMotion logo](openmotion-logo.svg) uses the symbol and Albert Sans wordmark from the [OpenMotion prototype](https://opendesign-motion-standard-prototype.inovixissu.chatgpt.site/). The lettering is outlined so the mark renders identically across README languages. [Font license](../../web/design-system/fonts/NOTICES.txt)

## Agent logos

The local agent gallery and setup buttons use client marks from the [source icon collection](https://github.com/nexu-io/open-design/tree/07a86b1041531bfa0bec1006d9c0993985fee560/apps/web/public/agent-icons) and the [individual client artwork credits](models/README.md). Each mark identifies its respective client.

## Asset inventory

| Asset | Source and use |
| --- | --- |
| [README cover](brand-hero.jpg) · [简体中文](brand-hero.zh-CN.jpg) · [日本語](brand-hero.ja.jpg) | Dan Martell’s talking-head reference and the OpenMotion caption remake with @careerwithriya, with a capture of the editable Studio timeline. The desktop and mobile covers open the [2.4-second comparison](media/presenter-caption-remake.mp4). [Footage and edit credits](reverse-engineering-cover.md) |
| [Earlier cover](cover.png) | Previous AI-editing positioning, preserved as artwork history; no longer the main README cover. |
| [Animated cover](cover-motion.gif) | Optional 800 × 400 camera-breath loop from the same cover; 32 frames, approximately 4 seconds, infinite loop. Brand motion, not recorded application behavior. |
| [Social preview](social-preview.jpg) | 1280 × 640 sharing image derived from the cover. |
| [Library](library.png) | Generated 2172 × 724 companion artwork for the five resource collections. |
| [Community](community.png) | Generated 2172 × 724 companion invitation to create and contribute. |
| [Collaboration roadmap](collaboration-concept-v2.png) | Generated 1774 × 887 concept of human–agent editing. Retains **Concept preview**; the README states that collaboration is planned. The [earlier version](collaboration-coming.png) is preserved. |
| [Architecture diagrams](diagrams/) | Creation workflow, explicit creative context and runtime boundaries; [editable SVG source](diagrams/generate.py). Diagrams explain the architecture, not measured creation results. |
| [Additional brand and production references](brand-showcase/README.md) | Local campaign still and two case-study videos; external examples with [source and integrity records](brand-showcase/manifest.json). |
| [Community banner](community-star.svg) · [简体中文](community-star.zh-CN.svg) · [日本語](community-star.ja.svg) | The localized GitHub invitation uses the prototype logo and the cover paper. The star animation respects reduced-motion preferences. |
| [Earlier stay tuned GIF](stay-tuned.gif) | Generated 960 × 480 Star → Starred invitation; 40 frames, 4 seconds, infinite loop, about 437 KB. Linked to the repository. Inspired by the community CTA pattern in [Hypit](https://github.com/hypit-ai/hypit); no Hypit image or GitHub screenshot is reproduced. |
| [Star frame](stay-tuned.png) / [Starred frame](stay-tuned-starred.png) | Two ImageGen frames used to reproduce the animation; illustration only, no fabricated repository counts or notification guarantees. |
| [Editor](editor.jpg) and [workspace](workspace.jpg) | Historical Studio captures at commit `7aee372`, using an isolated demo workspace and bundled Product Promo project. Retained for provenance; the README now uses the product tour below. |
| [Codex embedded editor](product-tour/codex-embedded.png) / [standalone workspace](product-tour/standalone-studio.png) | Real Studio captures of the same Product Promo project. The Codex image is the embedded Viewer, without a Codex desktop shell. |
| [Claude Code Skills](product-tour/claude-code-skills.png) / [CLI checks](product-tour/cli-checks.png) | Real terminal output replayed in xterm.js: the five loaded Skills and the pinned engine's info/lint/timeline results. No model conversation is fabricated. |
| [Connect Agent](product-tour/connect-agent.png) / [template handoff](product-tour/template-to-agent.png) | Real connection dialog and Product Promo preview with its exact template ID and generated Agent instruction. |
| [Seven creative examples](#creative-examples) | Short GIF excerpts and stills from seven existing external catalog references. Paired with creative briefs, not presented as OpenMotion-generated work. Replaces the three small template posters in the scenario section. |
| [18 animated catalog picks](#catalog-preview-grid) | Six groups of source-video excerpts replacing the former six static resource covers. 320 × 180, 12 fps, normal-speed continuous excerpts, silent GIF loops; exact sources and encoding live in the gallery manifest. |
| Bundled template frames | Product Promo, NYT Graph and Decision Tree remain available through the [editable-template index](../../library/templates/README.md); their original projects, posters and [notices](../../template-library/NOTICE.md) are unchanged. |
| Contributor wall | Local 23-avatar [snapshot](contributors/manifest.json), captured from the GitHub contributors API on 2026-11-09. Includes repository history; profile links remain external, image bytes are local. |
| [OpenDesign symbol](opendesign-symbol.svg) | Unmodified upstream [CDN asset](https://r.open-design.ai/files/1257306170d14488e993cb1f97b86aad8840a3f866f1978e0fd24b9a3c7832d8); retained for provenance, not used as a newly designed OpenMotion mark. SHA-256: `1257306170d14488e993cb1f97b86aad8840a3f866f1978e0fd24b9a3c7832d8`. |

All README images have descriptive alternative text. Artwork, product evidence and reference works are labeled separately. Preserve reference previews and authors rather than repainting their content for brand consistency.

<a id="creative-examples"></a>

## Creative examples — seven scenes, seven briefs

The scenario gallery pairs seven external catalog references with [English](../examples.md) and [Chinese](../examples.zh-CN.md) creative briefs. Each preview is a short, continuous excerpt at its original speed, with no rearrangement, repainting, branding overlay or synthetic footage. GIF encoding reduces dimensions, frame rate and palette; GIFs have no sound. Click through to the full reference to inspect the original. The two portrait examples retain portrait composition, and the other five retain their landscape composition.

These are **reference works**, not generated OpenMotion demos, validated recreations or newly bundled editable templates. Creators and source brands retain their rights; the repository's Apache-2.0 license does not relicense these works. Attribution follows the existing catalog. The two entries labeled “Hyperframes catalog” identify the collection rather than claiming that Hyperframes created the original film.

The gallery uses the same spacing, typography and two-column card structure for all seven examples. Original artwork keeps its own creative identity. The README offers a static-preview link for every GIF and a `prefers-reduced-motion` picture source; readers can choose a still even where the renderer does not apply the media query.

| Scenario / preview | Catalog ID | Reference attribution | Excerpt (seconds) |
| --- | --- | --- | --- |
| [talking-head](examples/talking-head.gif) · [still](examples/talking-head.jpg) | `hf-reference-aroll-ali-abdaal-workflow` | [Ali Abdaal](../../library/skills/presenter-story/assets/ali-abdaal-workflow-reference.mp4) | 10–17 |
| [story-recut](examples/story-recut.gif) · [still](examples/story-recut.jpg) | `hf-reference-aroll-hundred-days-story` | [Hyperframes catalog](https://www.instagram.com/reel/Dd6vHlQgpok/) | 1–8 |
| [product-launch](examples/product-launch.gif) · [still](examples/product-launch.jpg) | `hf-reference-jake-figma-draw` | [@figma](media/jake-figma-draw-reference.mp4) | 5.5–12 |
| [viral-remix](examples/viral-remix.gif) · [still](examples/viral-remix.jpg) | `hf-reference-jake-lovable` | [@lovable_dev](media/jake-lovable-reference.mp4) | 3–10 |
| [explainer](examples/explainer.gif) · [still](examples/explainer.jpg) | `hf-reference-remix-authorize-once` | [Hyperframes catalog](media/remix-authorize-once-reference.mp4) | 2–9 |
| [data-story](examples/data-story.gif) · [still](examples/data-story.jpg) | `hf-moment-M1128` | [@Vintage_god](https://x.com/Vintage_god/status/2106817967967056165) | 1.4–7.6 |
| [music-visual](examples/music-visual.gif) · [still](examples/music-visual.jpg) | `hf-moment-M1139` | [@GoogleAI](https://x.com/GoogleAI/status/2024154215182926027) | 0–3.66667 |

The [manifest](examples/manifest.json) records exact video URLs, source SHA-256, excerpt start/duration, poster timestamp and GIF checksum. The original catalog and its covers are unchanged. Full downloaded videos stay outside the checkout; only the seven short excerpts, seven stills and manifest are distributed.

### Reproduce the excerpts

Requires Python 3 and FFmpeg. From the repository root, run the following; it reads only the seven pinned public video URLs and writes the documented preview files. Recheck the source hashes before accepting replacements if upstream content changes.

```sh
python3 - <<'PYTHON'
import hashlib, json, pathlib, subprocess, tempfile, urllib.request

out = pathlib.Path('docs/readme/examples')
manifest = json.loads((out / 'manifest.json').read_text())
with tempfile.TemporaryDirectory(prefix='openmotion-examples-') as work:
    for entry in manifest['entries']:
        source = pathlib.Path(work) / (entry['slug'] + '.mp4')
        with urllib.request.urlopen(entry['videoUrl'], timeout=60) as response:
            source.write_bytes(response.read())
        assert hashlib.sha256(source.read_bytes()).hexdigest() == entry['sourceSha256']
        portrait = entry['slug'] in ('talking-head', 'story-recut')
        scale = 'scale=-2:400' if portrait else 'scale=480:-2'
        filters = (
            f'fps=10,{scale}:flags=lanczos,split[a][b];'
            '[a]palettegen=max_colors=128:stats_mode=diff[p];'
            '[b][p]paletteuse=dither=bayer:bayer_scale=3:diff_mode=rectangle'
        )
        subprocess.run([
            'ffmpeg', '-v', 'error', '-y', '-ss', str(entry['startSeconds']),
            '-t', str(entry['durationSeconds']), '-i', str(source),
            '-filter_complex', filters, '-an', '-loop', '0', str(out / entry['gif'])
        ], check=True)
        still_scale = 'scale=-2:480' if portrait else 'scale=640:-2'
        subprocess.run([
            'ffmpeg', '-v', 'error', '-y', '-ss', str(entry['posterSeconds']),
            '-i', str(source), '-vf', still_scale + ':flags=lanczos',
            '-frames:v', '1', '-q:v', '2', str(out / entry['poster'])
        ], check=True)
PYTHON
```

FFmpeg versions can affect encoded bytes. Regeneration must update the manifest's GIF byte counts and checksums after validating the new files; source checksums remain tied to the fetched originals.

<a id="product-tour-captures"></a>

## Product tour captures

Captured on 2026-11-08 from the source checkout based on `8ba3fab8abc2`, with an isolated demo workspace and the bundled, unchanged `product-promo` content. Four Studio images are 1600 × 1000 browser viewport captures. The original UI labels, including **OpenDesign**, remain visible. No brand artwork, invented assistant response or host shell is painted over the product.

The two terminal images replay bytes recorded with the macOS `script` utility into xterm.js, then capture the terminal area with extra blank rows cropped. The Claude Code image is the actual local `/skills` screen with `motion:motion-template-to-video` selected; the CLI image contains separately executed `info`, `lint` and `timeline` output for the same project. The displayed model name is a CLI setting, not evidence that a model created the film. Local Skill discovery and MCP handshake succeeded; a model-driven adaptation was not completed in this capture run.

The embedded Viewer is the surface returned for Codex and other hosts; it is **not a screenshot of the Codex desktop application**. The standalone capture retains the session and request alongside that project. Connect Agent prepares local client instructions; the template preview prepares a precise handoff. Neither screenshot proves the external client has completed its editing task.

Reproduction steps, CLI expectations and capture boundaries are maintained in the [product tour guide](../product-tour.md). Keep demo projects, browser profiles, credentials and raw terminal recordings outside the repository. The six PNGs and guide are explicitly included in the distribution list. The older `7aee372` images remain available as historical assets.

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


### Earlier AI Cut positioning edit (superseded comparator spelling)

This earlier edit introduced the AI Cut headline and CapCut position. Its comparator spelling was subsequently corrected to **Claude Motion**; the prompt below is generation history, not current brand guidance. The final PNG, GIF and social preview follow the correction recorded next.

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

### Final comparator correction: Claude Motion

At that revision, the cover read **Cut with AI.**, **The AI-native, open-source CapCut alternative.**, **The open-source Claude Motion alternative.**, and **Everyone can be a creator.** Built-in Codex ImageGen edited the existing cover with this precise correction; the GIF and social preview were regenerated from that PNG.

```text
Edit the supplied OpenMotion brand cover with one precise spelling correction only. Replace the line "The open-source Cloud Motion alternative." with the exact line "The open-source Claude Motion alternative." The correct comparator name is CLAUDE Motion, spelled C-l-a-u-d-e. Keep every other word, the OpenMotion wordmark, Cut with AI headline, CapCut line, creator mission footer, layout, proportions, font style, black typography, painterly blue/green/cream/apricot paper background, and 2:1 composition unchanged. Maintain crisp perfectly readable typography and brand consistency.
```

### Collaboration roadmap concept

The corrected OpenMotion cover was supplied as a visual style reference. The concept illustrates a planned shared timeline, comments and review; it does not assert an implemented collaboration interface.

```text
Create a new OpenMotion roadmap concept illustration, landscape 2:1, 1792x896 or equivalent. The supplied OpenMotion cover is a STYLE REFERENCE only: maintain the same sky blue, turquoise, emerald, apricot and warm ivory painterly dry-brush and watercolor-on-paper family, but create a completely new layout. This is a future collaboration concept, not an existing product screenshot.

A sophisticated editorial software concept. Top left in generous warm ivory negative space, exact bold charcoal headline "Create together." Below it, exact smaller line "People + agents. One timeline." Top right a small elegant charcoal pill with the exact white label "is coming". Below, a single large refined floating white video-editing workspace, softly rounded, presented perfectly front-on, no perspective distortion. It fills about 75% of the canvas width and 58% of canvas height. The surrounding blue-green paint feels spacious and luminous, not ornamental clutter.

Inside the workspace: a wide cinematic preview at top-left showing an abstract beautiful teal / coral paper landscape with tasteful small text "Your story". At top-right a compact collaboration review panel, labeled "Review", containing two clearly separated comments: a small human avatar and the label "You" with "Hold this shot longer."; a subtle green assistant icon and label "Agent" with "I'll adjust the pacing." Show both pointing to the same selected time range. Below the preview across the full workspace is a crisp professional multitrack editing timeline, with three visible lanes, neatly aligned teal video clips, apricot motion blocks, a pale green audio waveform, fine gray time ruler, one black playhead, a highlighted range, two small comment markers and a tasteful two-person/agent presence indicator. Suggest a continuous editable creative workspace, with precise visual hierarchy and generous spacing. Minimal tiny UI chrome: do not generate paragraphs, dense navigation or gibberish microtext. Bottom right outside the workspace, tiny exact text "Concept preview".

No company logos other than the optional small word "OpenMotion" in the workspace top-left. No metrics, prices, platform logos, claims of shipped functionality, 3D mascots or purple neon. The image should be beautiful, legible at 900px wide, with sharp dark type and painterly margins that match the supplied brand cover. Opaque full bleed.
```

### Stay tuned / Star invitation

The [Hypit README](https://github.com/hypit-ai/hypit) informed the community invitation format. These two frames were independently generated in OpenMotion's painterly brand language. The first frame uses the corrected cover as a style reference; the second edits the first frame into the selected state. They illustrate clicking Star and do not record a real GitHub action. Release notifications use Watch settings, not Star.

First frame:

```text
Create a new OpenMotion GitHub star invitation banner, wide landscape 2:1, about 1792x896. Use the supplied OpenMotion cover solely as a STYLE REFERENCE: luminous ivory paper, sky blue, turquoise and emerald watercolor with dry brush texture and tiny apricot accents, crisp dark typography, generous breathing space. This is a brand CTA illustration, not a screenshot of GitHub.

Large exact charcoal heading near the upper left: "Stay tuned with us."
Below it a smaller exact line: "OpenMotion"
Below that a tasteful smaller line: "Star the project. Help the next creator."
The right/lower half has one prominent front-facing GitHub-like but generic white rounded rectangular button with fine gray border and very subtle shadow. In the button put a perfectly drawn outlined five-point star icon followed by the exact dark text "Star". The button should be clear and roomy, approximately 30 percent of the canvas width. A simple black mouse pointer with a thin white outline sits just below and to the right of the Star label, touching the bottom-right area of the button, suggesting the next action is clicking Star. The cursor is modest and clean, not enormous.

Composition: a quiet luminous ivory central field, painterly blue sweep across the top-right, green/turquoise wash sweeping through the bottom-left and apricot glints at the edges, matching the supplied cover. Beautiful balanced editorial design. No numbers, star counts, followers, fake repository chrome, browsers, mascot, additional logos, notification claims, badges or extra text. Keep all copy exact and sharp. Full bleed opaque image. This is frame one of a future star-click animation; give the button a clean unselected state and keep the surrounding design easy to preserve in a later text edit.
```

Selected-state frame:

```text
Precise animation-frame edit of the supplied OpenMotion Star invitation. Preserve the entire canvas size, every background pixel as closely as possible, all painterly brushwork, all typography, and all positions. Change only the existing white Star button to its selected state: fill the outlined five-point star with warm golden yellow (#E6B450), keeping its dark outline; replace the button label "Star" with the exact text "Starred", sized to fit within the SAME button bounds, centered with the star. Keep the button white with the same border. Keep the mouse pointer exactly in its current position. Add two very small golden click rays near the pointer tip, inside the button edge, to suggest a click. Do not change the heading "Stay tuned with us.", "OpenMotion", or "Star the project. Help the next creator." Do not change any layout, color or object outside the button area. This is the second frame of a seamless Star-to-Starred GIF, so alignment with the supplied first frame is crucial.
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

### Reproduce the Star invitation

Both source PNGs are 1774 × 887. Hold the unselected state for 1.4 seconds and the selected state for 2.6 seconds, then loop:

```sh
ffmpeg -hide_banner -loglevel error \
  -loop 1 -framerate 10 -t 1.4 -i docs/readme/stay-tuned.png \
  -loop 1 -framerate 10 -t 2.6 -i docs/readme/stay-tuned-starred.png \
  -filter_complex "[0:v]scale=960:480:flags=lanczos,setsar=1,setpts=PTS-STARTPTS[a];[1:v]scale=960:480:flags=lanczos,setsar=1,setpts=PTS-STARTPTS[b];[a][b]concat=n=2:v=1:a=0,split[c][d];[c]palettegen=max_colors=192:stats_mode=full[p];[d][p]paletteuse=dither=bayer:bayer_scale=4" \
  -loop 0 -y docs/readme/stay-tuned.gif
```

## Catalog preview grid

The former six static catalog thumbnails have been replaced by **18 animated previews in six groups**, following the category-led demo presentation of [OpenDesign](https://github.com/nexu-io/open-design#demo). All animations are continuous excerpts from actual catalog videos, at normal playback speed. No generated frames, fake UI motion, camera animation over stills or synthetic overlays are used. Original source content is preserved; taller source compositions are contained in the same landscape frame rather than cropped.

Default README images are GIFs. Existing [catalog covers](../../web/catalog/covers.json) are only selected for the reader's `prefers-reduced-motion` preference. Clicking a GIF opens the full source video, while the credit links to the catalog's source URL. The [resource data](../../web/catalog/hyperframes.json) and original catalog covers remain unchanged.

| Preview | Catalog ID | Credit / source | Excerpt (seconds) |
| --- | --- | --- | --- |
| [App Showcase](gallery/app-showcase.gif) | `hf-block-app-showcase` | [Hyperframes](https://raw.githubusercontent.com/heygen-com/hyperframes/main/registry/blocks/app-showcase/registry-item.json) | 0.5–4.5 |
| [Firecrawl Free Keyless](gallery/firecrawl.gif) | `hf-reference-remix-firecrawl` | [@ericciarla](media/remix-firecrawl-reference.mp4) | 1.6–5.6 |
| [3D UI Reveal](gallery/ui-3d-reveal.gif) | `hf-block-ui-3d-reveal` | [Hyperframes](https://raw.githubusercontent.com/heygen-com/hyperframes/main/registry/blocks/ui-3d-reveal/registry-item.json) | 2.4–6.4 |
| [Pond: a new Linux OS](gallery/pond.gif) | `hf-reference-jake-pond` | [@bflycomputer](media/jake-pond-reference.mp4) | 1–5 |
| [Kimi K3 teaser](gallery/kimi-k3.gif) | `hf-reference-remix-kimi-k3` | [@Kimi_Moonshot](media/remix-kimi-k3-reference.mp4) | 1–5 |
| [Reception by ElevenLabs](gallery/elevenlabs-reception.gif) | `hf-reference-remix-elevenlabs-reception` | [@ElevenLabs](media/remix-elevenlabs-reception-reference.mp4) | 5–9 |
| [Glass Shard Title](gallery/glass-shard-title.gif) | `hf-block-glass-shard-title` | [Hyperframes](https://raw.githubusercontent.com/heygen-com/hyperframes/main/registry/blocks/glass-shard-title/registry-item.json) | 0.5–6 |
| [Canopy Part Title](gallery/canopy-title.gif) | `hf-block-canopy-part-title` | [Hyperframes](https://raw.githubusercontent.com/heygen-com/hyperframes/main/registry/blocks/canopy-part-title/registry-item.json) | 0.3–4.3 |
| [Wireframe Portal Title](gallery/wireframe-title.gif) | `hf-block-wireframe-portal-title` | [Hyperframes](https://raw.githubusercontent.com/heygen-com/hyperframes/main/registry/blocks/wireframe-portal-title/registry-item.json) | 0.3–4.3 |
| [Iskra Light](gallery/iskra-light.gif) | `hf-reference-remix-iskra-light` | [@world_is_web](media/remix-iskra-light-reference.mp4) | 2.5–6.5 |
| [Liquid Glass Widgets](gallery/liquid-glass-widgets.gif) | `hf-block-liquid-glass-widgets` | [Hyperframes](https://raw.githubusercontent.com/heygen-com/hyperframes/main/registry/blocks/liquid-glass-widgets/registry-item.json) | 0.3–4.3 |
| [Cyera brand video](gallery/cyera.gif) | `hf-reference-remix-cyera` | [Cyera](media/remix-cyera-reference.mp4) | 7.2–11.2 |
| [Code 3D Extrude](gallery/code-3d.gif) | `hf-block-code-3d-extrude` | [Hyperframes](https://raw.githubusercontent.com/heygen-com/hyperframes/main/registry/blocks/code-3d-extrude/registry-item.json) | 0.5–4.5 |
| [Glyph: GPU typography for the web](gallery/glyph.gif) | `hf-reference-remix-glyph` | [@pmndrs](media/remix-glyph-reference.mp4) | 0.3–4.3 |
| [NYC Paris Flight](gallery/flight-map.gif) | `hf-block-nyc-paris-flight` | [Hyperframes](https://raw.githubusercontent.com/heygen-com/hyperframes/main/registry/blocks/nyc-paris-flight/registry-item.json) | 0.2–5.5 |
| [Aurora](gallery/aurora.gif) | `hf-block-aurora` | [Hyperframes](https://raw.githubusercontent.com/heygen-com/hyperframes/main/registry/blocks/aurora/registry-item.json) | 0–2 |
| [Linear Loops](gallery/linear-loops.gif) | `hf-reference-remix-linear-loops` | [@linear](media/remix-linear-loops-reference.mp4) | 5–9 |
| [Code Particle Assemble](gallery/code-particles.gif) | `hf-block-code-particle-assemble` | [Hyperframes](https://raw.githubusercontent.com/heygen-com/hyperframes/main/registry/blocks/code-particle-assemble/registry-item.json) | 0.3–4.3 |

The [gallery manifest](gallery/manifest.json) records the six group labels, exact catalog IDs, source and video URLs, selected time ranges, source SHA-256, existing poster paths, GIF byte counts and GIF SHA-256. The gallery contains 8 reference films and 10 registry components; it does not add editable templates or claim OpenMotion generated the displayed work. Third-party media, brands and source notices retain their original rights. The application’s Apache-2.0 license does not relicense them.

### Reproduce the gallery GIFs

Requires Python 3 and FFmpeg. Run from the repository root. Full source videos are temporary and are not distributed. The checked-in filter keeps a 320 × 180 canvas, 12 fps and a 128-color palette; padding preserves each original composition.

```sh
python3 - <<'PYTHON'
import hashlib, json, pathlib, subprocess, tempfile, urllib.request

out = pathlib.Path('docs/readme/gallery')
manifest = json.loads((out / 'manifest.json').read_text())
with tempfile.TemporaryDirectory(prefix='openmotion-gallery-') as work:
    for entry in manifest['entries']:
        source = pathlib.Path(work) / (entry['slug'] + '.mp4')
        with urllib.request.urlopen(entry['videoUrl'], timeout=60) as response:
            source.write_bytes(response.read())
        assert hashlib.sha256(source.read_bytes()).hexdigest() == entry['sourceSha256']
        subprocess.run([
            'ffmpeg', '-v', 'error', '-xerror', '-y',
            '-ss', str(entry['startSeconds']), '-t', str(entry['durationSeconds']),
            '-i', str(source), '-filter_complex', manifest['encoding']['ffmpegFilter'],
            '-an', '-loop', '0', str(out / entry['gif'])
        ], check=True)
PYTHON
```

Encoded bytes can differ between FFmpeg versions. After regeneration, decode every animation, inspect representative frames and timing, then update the GIF byte counts and checksums in the manifest. Source hashes identify the fetched originals; do not silently accept changed upstream content.


## AI editing terminology update — 2026-11-09

The current cover says **Edit with AI.**, **The AI-native, open-source CapCut alternative.**, **The open-source Claude Motion alternative.**, and **Everyone can be a creator.** Built-in ImageGen edited the existing cover, changing only the short headline while preserving the painterly composition. Earlier prompts above are historical records, not current brand guidance. The animated cover and social preview were regenerated using the existing FFmpeg recipe.

Prompt: “Replace the large centered line 'Cut with AI.' with 'Edit with AI.' Keep the other text, blue/green/ivory/apricot brushwork, 2:1 layout, typography and spacing unchanged.”

## Motion Design reference / remix comparisons

[Six paired examples](../motion-design-examples.md) now render actual source-backed content adaptations. They are separate from the external seven-scenario and eighteen-item viewing galleries. Each comparison uses one source composition twice, with original content on the left and an explicit replacement preset on the right. These are silent, normal-speed excerpts, sampled at matching GSAP timestamps and shown on a shared playback clock; they are not blind reconstruction or a claim of native Studio export acceptance.

The [Skill package](../../library/skills/motion-design-remix/SKILL.md) includes source from Hyperframes commit `070b964d7b8cd844a893f0abbe8e0b7f1ac6d879`, six Motion Design profiles, presets, capture/encoding helpers and [evidence](../../library/skills/motion-design-remix/evidence.json). [Source identities](../../library/skills/motion-design-remix/sources.json), [file hashes and encoding](../../library/skills/motion-design-remix/previews/encoding.json), [licenses and execution requirements](../../library/skills/motion-design-remix/NOTICE.md) remain with the package.

- Per-side stage: 1920 × 1080; capture: 960 × 540. MP4 pair: 1280 × 360, H.264, 12 fps, no audio. GIF pair: 960 × 270, 12 fps, 128 colors, infinite loop. JPEG fallback is the middle of each excerpt.
- Environment: Node 26.11.1, Puppeteer Core 25.16.0, Chrome 156.0.8078.80, FFmpeg 8.1.1. These are the actual documentation-capture versions, distinct from the application’s native runtime lock.
- The existing product-tour `real` lock serialized an isolated browser profile and loopback server. This asset capture is not a claim that the team application browser-regression suite ran.
- Each source and remix passed Hyperframes 0.9.7 lint with zero errors. Existing upstream warnings (file size, nesting, overlapping UI tweens) remain recorded per profile. Contact sheets and selected matched frames were inspected; final visual acceptance is the user's.
- The interface and glass examples retain original brand artwork and illustrative UI; they are not current OpenMotion screenshots. Code and counters are illustrative content, not executable public product APIs or business metrics.

To reproduce, materialize both variants for each profile under a new directory, using the package instructions. From a checkout with installed OpenMotion dependencies, invoke the capture script through the available browser-lock lane, with `MOTION_BROWSER_PATH` pointing to the chosen browser:

```sh
node library/skills/motion-design-remix/scripts/render-previews.mjs /absolute/projects /absolute/new-capture
node library/skills/motion-design-remix/scripts/encode-previews.mjs /absolute/new-capture /absolute/new-previews
```

The first command requires `puppeteer-core`, a browser with WebGL. The materializer supplies local browser scripts/fonts; the capture helper blocks non-loopback requests. The second requires FFmpeg on PATH. All temporary projects, frame sequences, profiles and logs stay outside the repository; only the selected source package and final previews ship.


<a id="presenter-video-showcase"></a>

## Presenter videos and motion — 2026-11-09

The [people manifest](people/manifest.json) records **nine catalog-reference GIFs, three original/upstream-remix comparison GIFs and one Presenter Tech template demo GIF credited to MotionGit**, each with a reduced-motion JPEG fallback. Original MP4s remain outside the checkout; links open the full published videos. No presenter footage or voice is packaged into the new [Presenter Story Skill](../../library/skills/presenter-story/SKILL.md).

The catalog already contains all nine `hf-reference-aroll-*` entries and the three `resultVideo` URLs. Paired media are **Hyperframes-published demonstrations**, not OpenMotion-generated results or evidence that the new recipes reproduce them. Both sides retain source pixels and speed, but their excerpt starts are selected separately; this is not a synchronized reconstruction benchmark. Authors are credited from catalog metadata. Original media and likenesses retain their own rights; the repository's Apache license does not relicense them.

| Showcase | Reference / source | Excerpt start → duration |
| --- | --- | --- |
| careerwithriya | [@careerwithriya](https://www.instagram.com/reel/Ddd57MBszhc/) · `hf-reference-aroll-careerwithriya` | 0 → 6 s |
| dan-martell-tools | [Dan Martell](https://www.youtube.com/shorts/mk1zJd9Rm4c) · `hf-reference-aroll-dan-martell-tools` | 2 → 6 s |
| harpercarrollai | [@harpercarrollai](https://www.instagram.com/reel/C4eNPF3PdpG/) · `hf-reference-aroll-harpercarrollai` | 10 → 6 s |
| ali-abdaal-workflow | [Ali Abdaal](../../library/skills/presenter-story/assets/ali-abdaal-workflow-reference.mp4) · `hf-reference-aroll-ali-abdaal-workflow` | 10 → 7 s |
| john-tagudin-capso | [@john.tagudin](https://www.tiktok.com/@john.tagudin/video/7524883942328126728) · `hf-reference-aroll-john-tagudin-capso` | 11 → 7 s |
| aiwithsachi | [@aiwithsachi](https://www.instagram.com/reel/Dc7G9Pxu_1O/) · `hf-reference-aroll-aiwithsachi` | 3 → 6 s |
| khris-sheer-founder | [@khris.sheer](https://www.tiktok.com/@khris.sheer/video/7491715587895430402) · `hf-reference-aroll-khris-sheer-founder` | 0 → 7 s |
| ugc-rachelll | [@ugc.rachelll](https://www.tiktok.com/@ugc.rachelll/video/7616996050066345246) · `hf-reference-aroll-ugc-rachelll` | 8 → 6 s |
| kevinstratvert | [Kevin Stratvert](https://www.youtube.com/shorts/1fA5j5_5TRY) · `hf-reference-aroll-kevinstratvert` | 23 → 6 s |

The paired excerpts use `careerwithriya` (0 / 0 s), `ali-abdaal-workflow` (10 / 0 s), and `john-tagudin-capso` (11 / 12 s), with six seconds per side. Their full original and remix URLs, source-file SHA-256 values and final GIF/JPEG hashes are in the manifest.

**MotionGit edition:** the preview uses the [public GitHub Kinetic Tech demo](https://github.com/motiontemplates/385712) (6–12 s), public source edition `0.2.7-open-beta`, repository revision `9dfbe7d7c6a6d4aa03f6f8e2f2285e631099faae`. It is the 16:9 landscape demo, distinct from the website's newer portrait edition. The same pinned source edition is now bundled locally as [Presenter Tech](../../library/templates/presenter-tech/README.md), with runner checks recorded separately. This image remains the upstream published demo excerpt, not the new smoke-test output; it does not demonstrate Studio-native import. Its code is MIT; demo people/voices and third-party assets have separate rights. The source repository explicitly does not include demo people and voices as user materials.

**Encoding:** FFmpeg 8.1.1, normal speed, silent continuous excerpts, 10 fps, 128-color palette, Bayer dither scale 3, infinite GIF loop. Single portrait clips retain aspect ratio at 216 px width. Comparisons scale each full frame to fit 288×512 and stack two sides into 576×512; no crop. MotionGit retains its 16:9 frame at 640×360. Posters are sampled at `startSeconds + posterOffsetSeconds`; separate comparison offsets are applied to each side.

Reproduce each single clip with the manifest's source, start and duration:

```sh
ffmpeg -ss "$START" -t "$DURATION" -i "$SOURCE"   -vf 'fps=10,scale=216:-2:flags=lanczos,split[a][b];[a]palettegen=max_colors=128:stats_mode=diff[p];[b][p]paletteuse=dither=bayer:bayer_scale=3'   -an -loop 0 preview.gif
```

For comparisons, apply `setpts=PTS-STARTPTS,fps=10,scale=288:512:force_original_aspect_ratio=decrease,pad=288:512:(ow-iw)/2:(oh-ih)/2,setsar=1` to each input, then `hstack=inputs=2` before palette generation. The MotionGit excerpt uses the single-input recipe with width 640 and the default palette statistics mode. This is documentation media encoding; it is not a native Studio export or human content-acceptance result.

## Local resource closure and Agent slogan

The current cover was edited with the built-in ImageGen tool to use **Edit videos with your agent.** The previous prompts above are historical. The selected image is [cover.png](cover.png); GIF and social preview were regenerated from this same file with the commands above.

Final edit prompt:

```text
Change only the bold slogan "Edit with AI." into the exact text "Edit videos with your agent." Keep it on one centered line, slightly reduce that line font size if needed. Preserve the large OpenMotion wordmark, all other wording verbatim, blue/teal/ivory/apricot painterly background, composition, aspect ratio, and visual quality. No other changes.
```

All 38 full films used by the README, scenarios, comparisons and curated collections are now local; see the [media manifest](media/manifest.json) and [resource contract](RESOURCES.md). GIF source hashes continue to identify those same complete files. The six editable profiles include reference films and local dependencies; Presenter Story carries its three pairs. The original template demo is [local](../../library/templates/presenter-tech/preview.mp4). This supersedes earlier descriptions of temporary-only source videos and CDN-dependent rendering.
