# Motion MVP follow-up review

Representative states captured from the local interaction build on November 10–11, 2026. These screenshots accompany the follow-up to PR #198. Video text and filenames are authored test-project content.

- [Compact layout](compact-layout.jpg): collapsed side rails in a narrow editor host.
- [Export](export.jpg): compact settings and scrollable render history below the header button.
- [Version history](history.jpg): neutral selection, green Latest badge and restore-only footer.
- [Media preview](media-preview.jpg): named preview dialog, gray editor backdrop and Studio playback controls.
- [Audio track](audio-track.jpg): compact asset row and timeline speaker control.

Screenshots show representative UI states, not cross-platform acceptance or proof of every export format. WebP remains a disabled placeholder. Runtime test media and project edits are not included in this PR.


## Empty-state follow-up (2026-11-11)

The goal is to make a blank project visibly empty, offer one central import entry, and avoid controls that cannot produce a useful result. Small panel hints share 18px icons, 10px text and the disabled-control gray. Template-library styling is unchanged.

- Confirmed blank previews omit the fake full-video card, transport and placeholder duration; the timeline sketch aligns with real track labels and the zero origin.
- Properties and Layers use the shared empty state; the asset drop zone uses the same icon/text treatment.
- Empty timeline zoom controls and new exports are disabled. Export history remains accessible. Real content restores export and zoom availability.

Screenshots were captured from the working checkout at localhost:4173. The integration checkout retains its newer runtime and template-library implementation; focused tests and production compilation cover those differences. After integration with `feature/motion` at `40153c5`, a temporary preview at localhost:4174 additionally confirmed empty export/zoom gating and real template-library focus restoration through Escape and the close button (`motion-integrated-empty-export.png`).

| Check | Result / evidence |
| --- | --- |
| Before: empty export enabled | `audit-empty-export.png` |
| After: blank clips, layers, aligned timeline and disabled zoom | `motion-empty-clips-final.png` |
| Empty properties | `motion-empty-properties-final.png` |
| Empty layers | `motion-empty-layers-final.png` |
| Consistent asset drop hint | `motion-empty-assets-final.png` |
| Empty export blocked with concise reason | `motion-empty-export-final.png` |
| Populated composition export remains enabled | `motion-populated-export-final.png`; no render job submitted |
| Shared render-start guard / static content recovery | Deterministic hook regression passed |
| Repeated template open/close, Escape and trigger focus | Integration DOM regression passed |
| Destructive recovery and actual export encoding | Unverified in this follow-up; no destructive recovery or export executed |
| Native installers / all animated-filter combinations | Unverified; outside this UI follow-up |
