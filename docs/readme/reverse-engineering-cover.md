# Reverse engineering README artwork

This is the source illustration for the [main README](../../README.md) cover. It preserves the current README's painterly visual family while introducing **Reverse engineering for any video**, the four media-generation categories, and **Publish to every platform**. The reverse-engineering draft is now the main introduction; the earlier artwork remains available as source history.

The English and Chinese covers typeset **Editable HTML video · Open source · 21 local agents · BYOK · 100+ Motion.md** over the original unlettered watercolor. The cover highlights the addition of WorkBuddy and links to the full local agent gallery. [English cover](brand-hero.jpg) · [Chinese cover](brand-hero.zh-CN.jpg).

| Field | Value |
| --- | --- |
| Artwork | [cover-reverse-engineering-v2.png](cover-reverse-engineering-v2.png) |
| Source image | [First alternative cover](cover-reverse-engineering.png), derived from the [existing OpenMotion cover](cover.png) |
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

The main README uses [collaboration-concept-v2.png](collaboration-concept-v2.png), a built-in ImageGen edit of [the original collaboration concept](collaboration-coming.png). The top-right status badge is removed; the artwork retains its **Concept preview** label and the surrounding README explains that collaboration features are planned. The earlier collaboration image is preserved.

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
