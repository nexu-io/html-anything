# Interaction follow-up verification

Date: 2026-11-11. This update is based on PR #276 head `b85b8ded1e2b681ecac73deb3e243e86ddbbfae2` and preserves its public community-link change. The original working checkout and its uncommitted changes remain intact. Only the interaction changes below were transferred; newer template-library, runtime, privacy, history and resize-synchronization code is preserved.

## Included behavior

- Hide the MVP corner navigator; expose 50%, 75%, 100%, 150% and 200% preview zoom presets in a narrow opaque menu.
- Use check icons consistently for selected menu items. Narrow the language menu to 180px.
- Show a gray OD placeholder for queued, loading, missing or failed composition covers.
- Show video frames without an embedded waveform for MVP video clips; preserve independent audio waveforms.
- Keep splitter hover/drag feedback as a thin green line.
- Center asset-preview playback controls, retaining time/play/volume below 420px and hiding speed/loop. Preserve the common icon/button sizes.
- Hide MVP fade handles without changing authored fades or trim handles.
- Save the localized Untitled default for a cleared title on blur or Enter; Escape cancels.
- Hide MVP source-path and Position rows, retain Fit, and use the same shared menu primitive as font controls.
- Forward asynchronous color-save promises to the existing gesture transaction, retaining the selected preview while pending/successful and rolling back on rejection.
- Counter-scale timeline ruler text during zoom so labels do not stretch.
- Use concise localized causes and a compact neutral error toast without a details icon. Identical notices replace each other. Brief/info feedback still expires after three seconds; persistent errors retain their dismiss button. History restore refusals get a concise cause without exposing paths. Detailed non-toast error panels retain diagnostics.

## Checks

- CI-pinned Node 26.11.1. Reused the existing installation after confirming the dependency lock matches; no manifest or lockfile changes.
- `npm run check`, `npm run typecheck:studio`, `npm run build:studio` and `git diff --check` passed.
- 23 focused Studio test files cover 410 cases. The initial run passed 408; the two failures were an old text-checkmark assertion and unused diagnostic CSS classes. After changing the assertion to check the SVG and removing those unused classes, both affected files passed (50 cases). The other 360 cases were not unnecessarily rerun.
- Initial design validation rejected hardcoded placeholder fallback colors; the final CSS uses existing semantic tokens and passes the check.
- Local source and built-component browser checks are evidence for this machine only. No WorkBuddy installation, full local suite, export-format matrix or package publication was performed.

## Browser evidence and limits

The images below were captured during the local walkthrough against the working editor or a clearly identified isolated component harness. They demonstrate the transferred interactions; they are not claimed as remote WorkBuddy evidence. Test media and local project data are excluded from Git.

| Interaction | Evidence | Scope |
| --- | --- | --- |
| Zoom presets/checkmarks | [Zoom menu](motion-zoom-five-check.png) | Real editor; corner navigator hidden |
| Thin splitter and video frames | [Editor](motion-thin-divider-video-frames.png) | Real editor; independent audio preserved in tests |
| Asset-preview controls | [Wide](preview-controls-after-wide.png), [narrow](preview-controls-after-narrow.png) | Real browser layout |
| Hidden fade handles | [Timeline](mvp-fade-handles-hidden.png) | Existing fades and trimming retained |
| Empty title and language menu | [Untitled](unnamed-saved-language-narrow.png) | Saved/refreshed, then original project title restored |
| Fit dropdown | [Fit menu](fit-after.png) | Five options, selected contain; same-value selection closes without a write |
| Ruler zoom | [Timeline](timeline-zoom-after.png), [samples](timeline-zoom-in-frames.json) | 26 samples during active zoom-in: five-character labels stayed within 29.9998–30.0003px of their 30px baseline; zoom-out animation covered by tests |
| Color promise lifecycle | [Pending](color-drag-pending.png), [success](color-drag-success.png), [rejected](color-drag-rejected.png) | Isolated real pointer-drag harness using production components and controlled promises; not a real-project save |
| Concise toast | [Toast](toast-concise-reason.png) | Isolated production-component browser harness; duplicate notices coalesce, only close remains |

The original screenshot does not establish the cause of the failed operation. The toast change improves the explanation when a cause is recognized; it does not prove that the original operation now succeeds. Color testing proves the asynchronous-save regression and rollback behavior, not the absence of every possible HSV/RGB quantization artifact.

The assembled PR build was also opened in the real browser through a temporary local frontend proxy, reusing the existing backend without restarting port 4173. The proxy served this checkout's production assets and permitted only reads plus the existing preview-open action; project-edit requests were blocked. [Final assembled Fit menu](pr276-assembled-fit.png) confirms all five localized options, the selected checkmark, hidden source/Position rows and the retained public Discord link. The existing project title, media values and disabled Undo were unchanged. The temporary page/server were closed and the original editor was left open.

## Reconnecting activity indicator

The Reconnecting ellipsis now cycles the three dots without changing toast width. The accessible status remains a single static localized phrase; reduced-motion CSS disables the animation. The existing polling policy is unchanged: wait 1.8 seconds after each completed attempt, with no overall retry limit or explicit per-request timeout. Recovery removes the notice; polling does not start a stopped local service.

Browser verification used the production toast and built styles in an isolated harness, without disconnecting the real project: 45 computed-style samples captured three distinct dot-opacity states and a constant 220.4766px toast width. Simulated recovery unmounted the indicator. See [animation samples](reconnecting-animation-samples.json) and [one visual frame](reconnecting-animated.png). The real 4173 editor was rebuilt. During refresh, its service was found stopped; after restoring it with the existing interaction-workspace data directory, the original project reopened with no connection notice and Undo still disabled. No project content was changed.

`check`, Studio typecheck and both working/publish builds passed. Five targeted suites cover 89 tests: 88 initially passed, and the existing connection-feedback text assertion was updated for the static screen-reader text plus aria-hidden animated dots; all 20 host tests passed on rerun. The other four suites were unchanged.


## Playhead boundary and uploaded audio filenames (2026-11-12)

The reported recording showed the green playhead crossing the left track-name/audio-control column during horizontal scrolling. `TimelinePlayheadLayer` previously removed its clip while scrolling and restored it only after settling. It now keeps the same boundary throughout scrolling, updating only the layer style rather than rerendering the clip tree. The existing half-glow allowance at time zero is retained; playhead time and playback-follow logic are unchanged.

My assets now shows each uploaded audio file's full name, including its original extension. Long Chinese/English names wrap within the row, keeping the file type and adjacent actions visible. The repeated generic Audio label is omitted; duration and specific BGM/SFX/Voice labels remain when available. Official library sources, components and styles are unchanged. Display fixtures use only the supported MP3, WAV, OGG, M4A, AAC and FLAC formats; no fixture was imported into a real project. These are filename/layout fixtures, not a six-codec playback acceptance test.

| Check | Result | Evidence / boundary |
| --- | --- | --- |
| Active and settled scroll, repeated scroll, return to origin | Pass | Updated integration regression; 100 browser animation-frame samples kept the clip edge exactly fixed, with no intermediate React commits. [Samples](playhead-scroll-samples.json). |
| Real editor zoom and horizontal scroll | Pass | Production build refreshed on 4173; an offscreen playhead whose geometric position was inside the header remained clipped. [Header remains clear](playhead-header-clipped.png), [playhead visible again](playhead-visible-after.png). |
| Same-stem names, long Chinese/English names, narrow layout | Pass | Production AudioRow fixtures at 260px and 400px; all names and suffixes visible without row overflow. [Six supported formats](audio-full-filenames.png). |
| Accessible file identity, preview/rename/filter behavior | Pass | Existing and updated deterministic cases retain the original asset path and distinguish extensions in accessible labels. |
| Source edits, undo, playback preferences | Pass | Real project remained paused near 12.406s with its selection and disabled Undo; no source/media/volume changes, and no 4173 restart. Timeline scroll/zoom were exercised as view controls. |
| Loading, empty, network failure, destructive operations, official library | Not applicable | No changes to data loading, mutation, import, or official-library behavior. |
| Remote WorkBuddy and six-codec playback | Unverified | Local rendering tests only; no claims of remote or codec acceptance. |

Validation: 47 cases in five targeted files passed in the assembled PR checkout; `npm run check`, Studio typecheck, production build and scoped diff whitespace checks passed. The main checkout was also rebuilt and browser-checked. Existing uncommitted work and other contributors' commits remain preserved.


## Asset actions, feedback layers and export readability (2026-11-12)

My assets now labels current-composition references as **In use** (**已使用** in Chinese), replacing Added; unused assets have no badge. Delete invokes the existing file handler once and closes the MVP menu immediately. The full editor retains its confirmation, and official library assets are unchanged. No new undo or restore behavior is implied.

Editor notices, connection feedback and legacy template-copy feedback share a browser top-layer host. Feedback moves under the active native modal so dismiss controls remain interactive, while its non-modal popover stays above modal backdrops. Later native dialogs and popovers refresh the ordering; cleanup restores the original node and releases observers. The copy toast retains its existing position and three-second timer. No template-layout redesign is included.

Export records omit elapsed render duration. Titles change from 11px to 12px medium, dates from 9px to 11px, with 4px top spacing and 8px extra room before actions. Long titles truncate earlier and expose the full filename on hover. On the real editor, title-to-download-button spacing increased from 10px to 18px. Export controls and stored render metadata remain intact.

| Check | Result | Evidence / boundary |
| --- | --- | --- |
| Export content, typography, long title and action clearance | Pass | Existing real export opened after rebuilding 4173; no new render or deletion. [Before](export-record-before.png), [after](export-record-after.png). |
| Used/unused assets and Chinese/English labels | Pass | Deterministic component cases; real editor shows In use. Isolated audio component shows 已使用. |
| MVP deletion, repeated input, full-editor cancel | Pass | Regression cases and isolated production menu: [menu](asset-delete-menu.png), [one callback without confirmation](asset-delete-after.png). Real project files were not deleted. Existing server failure handling is unchanged. |
| Feedback above nested native dialogs, pointer access and focus | Pass | Production toast/portal harness: remains visible across nested modal open/close; dismiss works without closing the dialog; focus stays on modal controls. [Nested overlay](toast-above-nested-dialog.png). |
| Template copy and expiry | Pass, isolated | Original mountConnection/template-gallery components with an existing catalog record and isolated integration response. Clipboard success puts the toast in the active preview's top layer; expiration removes the visible state and restores its node. Reopen/copy works. [Copy feedback](template-copy-toast-top.png). |
| Live template catalog and remote WorkBuddy | Unverified | The main runtime catalog returned unavailable, including one retry. The isolated copy test does not prove live catalog recovery or remote-host acceptance. |
| Empty/loading/import/encoding and agent workflows | Not applicable | No changes to their data or state transitions. No new assets, exports, or timeline/media/volume edits were performed. |
| Older browser without Popover API | Unverified | The modal-parent fallback is source-inspected; browser verification used a host supporting native popovers. |

The assembled PR checkout passed `npm run check`, Studio typecheck, production build, 63 targeted tests in five files and `git diff --check`. The main checkout passed its typecheck, build and 62 targeted tests; its broader design check still reports existing raw UI colors in `studio/src/motion/theme.css`, outside this change. Main-checkout uncommitted work is retained. The PR increment preserves its newer privacy settings, community links, catalog implementation, translations and tests instead of replacing whole files from the older main checkout.


## MVP GIF looping (2026-11-12)

GIF export in the MVP now always uses infinite looping (`gifLoop: 0`) and hides the numeric loop-count setting. The full editor retains custom counts and validation; frame-rate, format, quality and export history are unchanged. This removes a technical setting the user explicitly chose to omit.

The real 4173 production build was refreshed with GIF already selected. [Before](gif-loop-before.png) and [after](gif-loop-hidden.png) show that the loop field is gone and the remaining export controls are present. The editor remains open with both side panels restored. No export was initiated and no project media, timing or volume was changed.

Validation: 33 export-control and request-forwarding cases passed, including the updated MVP regression asserting no loop input and a zero loop count at submission, plus retained full-editor finite-count and invalid-input cases. Studio typecheck/build passed in both checkouts; repository check passed in the publish checkout. Codec playback and remote WorkBuddy verification were not performed; this is a settings/parameter change. Loading/error/empty-state behavior is unchanged.


## Narrower MVP timeline labels (2026-11-12)

The MVP track-label column is now 200px instead of 232px, reclaiming 32px for the timeline while retaining its 32px gutter. Populated rows, group headers, empty-state geometry and drag-scroll bounds use the same width. Ruler/clip origins and playhead clipping follow that shared geometry. The full editor retains its existing 232px label column. Names retain truncation/full-value hover behavior and audio/visibility buttons retain their 24px target width.

Real-editor browser measurements confirmed a 200px header, 232px content origin and 200px auto-scroll inset. Both 24px buttons fit inside the header; the current filename remains fully visible. The viewport kept the paused 12.406s position and original source/media values, with Undo disabled. Fit zoom naturally recomputed for the extra timeline space. [Before](timeline-label-before.png), [after](timeline-label-after.png). No clips, timings, audio levels or asset names were edited for verification.

Validation: 61 cases across the timeline scrolling, track-header, group-row, viewport metadata and preview empty-state suites passed in both working and publish checkouts. The scroll regression now covers both editor modes, verifies MVP header/ruler/auto-scroll alignment, and checks playhead clipping during repeated horizontal scroll and after settling. Studio typecheck/build and the publish-checkout repository check passed. Long-name truncation is retained by source inspection; no real asset was renamed. Remote WorkBuddy and actual file-drop mutations were not exercised.
