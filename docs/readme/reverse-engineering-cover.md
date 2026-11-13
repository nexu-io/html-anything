# Reverse engineering README artwork

The [English](https://releases.open-design.ai/open-motion/media/sha256/730e1d6235820d39ba8adde42810d1165377992136a3b20290ad5d504abb527b.jpg), [Chinese](https://releases.open-design.ai/open-motion/media/sha256/45ee17734fb1315decef29c116fdd6794ee275fe83239328526b982a8ebe17ac.jpg) and [Japanese](https://releases.open-design.ai/open-motion/media/sha256/1b567187bc527cc99f8ef2c91c41c9adf5fa91fa9bbc5f8e2f579ad9c7837a46.jpg) covers show a talking-head caption effect adapted to another speaker. Each links to the [2.4-second comparison](media/presenter-caption-remake.mp4). The timeline pictured below the portraits is from the OpenMotion project used to render the remake.

The left panel uses 0.83–3.23 seconds from [Dan Martell’s original video](https://www.youtube.com/shorts/mk1zJd9Rm4c). The right panel uses the first 2.4 seconds of [@careerwithriya’s career-skills video](https://www.instagram.com/reel/Ddd57MBszhc/). OpenMotion rebuilt the three caption layers for Riya’s footage. The comparison plays Riya’s original audio. Both creators retain the rights to their footage.

## Current integration cover

The current cover uses the approved talking-head comparison composition with a continuous paper-and-turquoise background. It displays compact agent and media-model rows, including Antigravity and Kimi Code. The English, Simplified Chinese and Japanese covers keep the same layout and the approved English tagline; supporting labels are localized. Mobile image entries carry the same complete cover.

Method: built-in ImageGen editing of the approved cover, followed by JPEG encoding. This is promotional artwork based on the reference/remake and editor imagery, not a newly recorded product session or additional compatibility-test evidence. The linked comparison video remains the actual recreation evidence.

## Earlier cover artwork

| Field | Value |
| --- | --- |
| Artwork | [cover-reverse-engineering-v2.png](https://releases.open-design.ai/open-motion/media/sha256/70a01c68511a8459661929333ee1a8751ab1bb4a4e86dd22a92f36874a32bd92.png) |
| Source image | [First alternative cover](https://releases.open-design.ai/open-motion/media/sha256/9a8646fc5c70dc2ab1002d96b0168e28cd53beea89be00b75148bff9935865c2.png), derived from the [existing OpenMotion cover](https://releases.open-design.ai/open-motion/media/sha256/cfeb12861412bd36d34000ee1fe6d7f4e7b124ac9cad680d595c3cb44708eead.png) |
| Method | Built-in ImageGen edit; preserves the first alternative and original cover |
| Dimensions | 1774 × 887 pixels, 2:1 landscape |
| SHA-256 | `70a01c68511a8459661929333ee1a8751ab1bb4a4e86dd22a92f36874a32bd92` |
| Visual direction | Blue, turquoise, emerald, ivory and apricot brushwork; crisp dark sans-serif typography |
| Use | Generated brand artwork for the main README, not a product screenshot or evidence of recreation fidelity |

The cover presents a creative positioning statement. Actual recreation still depends on accessible inputs, host tools and review of the resulting video, as described in the README and the [product architecture](../product/architecture.md). Model integrations require configured access. The cover uses the unqualified publishing tagline as requested; the README body retains the Coming status and actual platform-connection boundaries.

## Final edit prompt

Built-in ImageGen removed the status suffix from the existing cover. The main README now references a byte-identical copy under a new `v2` filename so Markdown previews request the corrected image instead of reusing a cached version. The earlier cover file is preserved.

```text
Edit only the bottom-center tagline in this OpenMotion cover. Replace "Publish to every platform · Coming" with the exact text "Publish to every platform", centered in the same area. Remove the separator dot and the word Coming entirely. Preserve all other wording verbatim, all fonts and text hierarchy, the OpenMotion wordmark, the 2:1 layout, and the blue/teal/emerald/ivory/apricot painterly background. No other changes. Do not add any "coming", "soon", "planned", status badge or new text anywhere. Opaque background.
```

## Collaboration concept: badge removed

The main README uses [collaboration-concept-v2.png](https://releases.open-design.ai/open-motion/media/sha256/a5efa5be51936f33ecc7ef4241ce2602ebf4e7efcc8ce30e0dac5a8bd2b34957.png), a built-in ImageGen edit of [the original collaboration concept](https://releases.open-design.ai/open-motion/media/sha256/d0d44450f450157390471f775bb8f893284892aca5a553ec7354ae044cf5690a.png). The top-right status badge is removed; the artwork retains its **Concept preview** label and the surrounding README explains that collaboration features are planned. The earlier collaboration image is preserved.

- Dimensions: 1774 × 887 pixels.
- SHA-256: `a5efa5be51936f33ecc7ef4241ce2602ebf4e7efcc8ce30e0dac5a8bd2b34957`.
- Method: built-in ImageGen, saved as a separate project asset.

```text
Use case: precise-object-edit. Edit the supplied OpenMotion collaboration concept illustration. Remove ONLY the black rounded badge in the top-right corner containing the exact words "is coming", including the badge background. Fill the small vacated area with a seamless continuation of the existing sky-blue and ivory painterly brushwork. Preserve everything else: the 2:1 composition, all artwork and UI, every other word including "Create together.", "People + agents. One timeline.", "OpenMotion", all comments, timestamps and the bottom-right "Concept preview" label. Keep all original positions, dimensions, colors, typography and visual hierarchy. Do not add any replacement badge, status label, Coming, soon, or new wording. Opaque background.
```

## Multimodal cover: generation prompt

```text
Use case: ads-marketing. Edit the supplied OpenMotion README cover. This image is the edit target.
Preserve its 2:1 landscape layout, painterly blue/teal/emerald/ivory/apricot background, existing OpenMotion wordmark, dark sans-serif typography, and generous margins. Preserve these four centered lines exactly and keep their relative hierarchy:
"OpenMotion"
"Reverse engineering for any video"
"Turn videos you love into videos for your brand."
"DeepSeek Harness / Codex / Claude Code"
Add one compact centered line below the agent names, in smaller clear sans-serif type:
"Images / Video / Music / TTS"
Replace the current bottom-center "Everyone can be a creator." with this exact text:
"Publish to every platform · Coming"
Keep "Coming" on the same line and clearly readable, never omitted or cropped. Treat it as a planned-feature tagline, not a button or badge. Keep the primary headline strongest after the wordmark, preserve all brushwork and the premium editorial look, and balance the added text with comfortable line spacing. No other changes, words, icons, diagrams or UI. Opaque background.
```

## First alternative: generation prompt

```text
Use case: ads-marketing. Edit the supplied OpenMotion cover into a new alternative README hero cover. Image 1 is the edit target and exact visual reference.
Preserve the 2:1 landscape format, generous margins, hand-painted sky-blue, turquoise, emerald, celadon and pale-apricot brushwork on luminous ivory paper, broad flowing paint gestures, clean near-black sans-serif typography and premium editorial quality. Preserve the OpenMotion wordmark and its prominent upper-middle position. Keep the composition open and readable at GitHub README width.
Replace the existing slogan and the two competitor lines with the following exact centered text hierarchy:
Large wordmark: "OpenMotion"
Bold primary headline: "Reverse engineering for any video"
Supporting line: "Turn videos you love into videos for your brand."
Smaller supporting line: "DeepSeek Harness / Codex / Claude Code"
Keep the existing small bottom-center mission: "Everyone can be a creator."
Use precise, crisp, correct letters and generous line spacing. Make the new headline the strongest line after the wordmark; ensure it fits on one line with comfortable margins. No CapCut or Claude Motion text in this version. No other words, badges, claims, buttons, UI, logos, watermarks, filmstrip decorations or additional objects. Keep the existing painterly family and restrained composition. Opaque background. Produce a finished cover, not a mockup.
```
