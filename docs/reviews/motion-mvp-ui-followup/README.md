# Motion MVP UI follow-up evidence

These changes follow the already merged PR #272. The new PR targets `feature/motion` independently and contains only the later interaction adjustments.

Screenshots were captured from the working checkout at localhost:4173 on November 11, 2026. The publication checkout applies the changes to `eabdaa0`, preserving the newer history feedback and style-gate fixes. Production compilation and focused tests cover the integrated tree; these screenshots do not claim browser coverage of every upstream difference.

- [Final editor](motion-timeline-controls-final.jpg): both side panels at their 260px minimum, matching Import buttons, no plus icon, compact 8px zoom/import gap without the right divider, single toolbar/ruler boundary, and FX-only clip badges. The left speaker remains available after raising a muted track to 54%; refresh preserved its availability. The final test project remains unmuted at 54%.
- [Asset menu](motion-asset-menu-unified.jpg) and [timeline menu](motion-timeline-menu-light.jpg): matching 180px white surfaces, 8px corners, 11px text, 28px rows, soft shadow and pale-gray interaction highlight. The captures use keyboard focus, which shares the hover background; its focus outline remains visible. These detail captures predate the final removal of clip-volume badges and import spacing adjustment.
- [Media inspector](motion-media-basic-controls.jpg): basic media controls without path copy, cutout, advanced gain/automation, fades, mute or audio-track toggles. Existing source values are preserved; timeline speaker controls own mute/volume.
- [Community icon size](motion-community-16px.jpg) and [localized tooltip](motion-community-tooltip.jpg): 16px logo before Export with a localized invitation tooltip. The captures show an earlier `zh-CN` Feishu destination; the tracked-source release scan rejects company Feishu links, so the entry opens the public Discord community for every interface language. The tooltip capture predates the final icon-size reduction. Native app launches and successful community joins were not tested.
- [Reconnecting feedback](motion-reconnecting-toast.jpg): simulated connection failure through a temporary read-only local proxy. One-line top-centered feedback displays automatic reconnection status with no retry/details buttons. Removing the simulated failure cleared the toast through normal polling. The proxy and its test tab were removed.

Additional browser checks confirmed neutral hidden-track icons, a stable editor viewport when focusing the volume slider, persistent volume controls through mute/unmute, and 28px-high Import buttons with 6px corners in both locations. The main and earlier integration checkouts retain their existing uncommitted work; runtime projects and the supplied video are not added to Git.

## Validation

- CI-pinned Node 26.11.1; existing dependencies reused because manifests and lockfiles are unchanged.
- `npm run check`, `npm run typecheck:studio`, `npm run build:studio`, and `git diff --check` passed.
- Focused Studio validation covered 21 files and 320 tests. A test-only CSS marker initially failed the style gate; converting it to a data attribute fixed it, and both the gate and host suite passed on rerun (26 tests).
- Coverage includes docking, media inspector, assets, shared menus, timeline clips and audio controls, locale routing, connection feedback and theme/token checks.
- No full suite, installer validation, new export or external-service join was performed for this frontend-only change. Existing Happy DOM network diagnostics do not represent a failed test.

## Additional interaction update

See [the interaction follow-up and browser evidence](interaction-update.md) for zoom presets, cover placeholders, playback layout, media Fit, title defaults, color-save stability, ruler zoom and concise error feedback. This update retains the public Discord community change.
