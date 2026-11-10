# Title reveal

**Kind:** motion recipe · **Status:** draft, not a rendered component · **Source:** original OpenMotion library example · **License:** [Apache-2.0](../../../LICENSE).

Use for a short headline that needs to become readable before the next shot. Supply the headline, typeface, foreground/background colors and available reading time. Pair it with a [Brandkit](../../brandkits/openmotion/BRANDKIT.md) and a [motion design system](../../design-systems/ink-water/MOTION_DESIGN.md).

## Example behavior

| Beat | Example timing | Visible state |
| --- | --- | --- |
| Reveal | 0–0.45s | A clipping boundary exposes the title from below; the baseline settles with a small upward movement. |
| Read | 0.45–2.5s | The title is fully visible and stationary. Extend this hold for longer copy. |
| Handoff | After 2.5s | Keep the settled title if the next scene continues it; otherwise use the scene's chosen cut or exit. |

These times illustrate a short title; they are not required defaults. Keep the text live and editable, preserve its layout before the reveal, and make the state reproducible at any sampled time. Avoid animating every glyph when it harms reading or changes the intended emphasis.

## Adapt and review

Replace the content and brand tokens. Check accents, CJK line breaks, clipping bounds, mobile-size readability and the adjacent scene. Use the project's existing animation mechanism rather than introducing a second clock. For reduced-motion previews, show the settled state.

No project export or playback validation is claimed for this written recipe. A future implementation should include native source, a preview and a record of adaptation, scrubbing and export checks.
