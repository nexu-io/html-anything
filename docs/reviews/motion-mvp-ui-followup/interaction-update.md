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
