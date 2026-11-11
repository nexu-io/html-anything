# Presenter Tech — MOTION_DESIGN.md

## Intent

A presenter-led explanation with industrial typography, silver surfaces, warm amber highlights and spatial cards. The person carries the message; motion makes the main idea and supporting evidence easy to follow.

## Preserve

- One visual idea per shot: presenter, keyword, comparison or demonstration.
- Consistent chapter labels, type hierarchy, metal/light treatment and restrained amber emphasis.
- The native animation clock and sound-event ownership. Extend only the declared quiet reading windows; do not slow the entire animation to fit more words.
- Face and gesture visibility when placing titles, captions or screen material. Bind the actual recording's dimensions and face geometry before reframing.

## Replace

Presenter and voice, story, keywords, explanations, point lists, screenshots, evidence and captions. Use the creator's own materials. Keep a readable relationship between the spoken sentence and the visible card; a different topic requires matching speech and evidence, not only a new title.

## Structure

```text
Topic + camera / screen / audio material
        ↓
Input document → validated scene and media plan
        ↓
Independent editable instance
        ├─ source-time → output-time mapping
        ├─ presenter / screen bindings
        ├─ actual caption cues
        └─ native motion + sound events
        ↓
Preview → revise inputs → render → video with audio
```

The included public source edition supports landscape 1920×1080 at 60 fps. B1 explains a keyword, B2 presents points, B3 compares two views and B4 closes with a takeaway. Other scene groups expose more specific media contracts; read the selected group's schema rather than assuming every input slot is optional.

## Review

Listen for clear speech and natural cuts. Check readable holds, screen detail, face-safe overlays, caption alignment and the final encoded audio/video. Compare equivalent story beats when changing duration. [Verification](verification.json) records the checks actually performed on this packaged version; technical smoke coverage is separate from accepting a creator's finished film.

[Use the template](README.md) · [Source and license acknowledgments](NOTICE.md)
