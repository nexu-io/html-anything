# Check and deliver the remix

## 1. Export the inspected version

Read `openmotion_get_project({projectId})` for the current revision and version, then `openmotion_export_request({projectId,requestId,versionId,expectedRevision,audio})` with `audio: "required"`, or `"silent"` when the reference has no sound. Poll `openmotion_get_project({projectId,exportJobId})` until the job is `completed` or `failed`; on failure read the error, fix the source and export again with a new requestId. Only a completed job with passed automatic verification is a technical pass; it does not judge the picture. Follow the shared [verification](../../openmotion-production/references/verification.md) for playback and the record.

## 2. Inspect the exported MP4

Inspect representative frames of the exported file at the delivered size:

- Every requested change is present, and the reference's brand does not remain anywhere it was meant to be replaced.
- Unchanged parts and the reference's craft (density, camera motion, type) still look like the original.
- Text fits, media crops correctly, and the original's hard cuts stay hard unless a change removed them.

Compare close crops of objects whose shape carries meaning, including any detail the user reported as wrong, at corresponding reference and output times. Check silhouette and orientation as well as size, colour, label placement and motion. Keep these visual results separate from the numerical checks below: the measurer reports brightness, detail, colour and bounds, not whether a pointer, icon or logo has the correct contour. Passing global metrics or equal element heights cannot clear a visibly wrong shape.

For a reconstructed visual system, inspect its defining features during holds and between observed states. Verify the visibility and action boundaries of transient elements. Use the [focused reconstruction guidance](rebuild.md#establish-a-difficult-visual-system) to locate the source of visible differences in structure, appearance or motion and judge repairs at the same moments.

Review moving passages using timed sequences that include their fastest displacement, extreme poses and settling where present. Compare feature travel relative to the frame, scale and angle changes, acceleration or pauses, and directional streak extent against the reference. Inspect the output at normal playback speed as well as in consecutive frames. Record motion differences with the responsible interval and feature. Brightness, detail and element-bound measurements below provide appearance evidence. Assess trajectory and timing through this sequence review.

Use the [unit's timed observations](rebuild.md#turn-observations-into-driving-data) to compare the same features in the actual output. Include intermediate times that challenge its pose or motion model. Record the reference value or visual constraint, the corresponding output, and the source parameter responsible for any discrepancy. Check that the renderer consumes the measured controls. A frame collection alone leaves this mapping unverified.

For segmented work, repeat the affected checks on the integrated version. Include overlapping entrances/exits, shared objects in their new appearances, newly exposed material and short events after all overlays and post-processing. Keep captures attributable to their source/asset/export identity, and refresh affected evidence after changes. Review the timed sequence and normal-speed playback through the existing workflow.

Verify the consequence of each meaningful interaction, not only the moving actor. Compare the affected content before, during and after the action in both videos. A drag-to-reorder check must show the dragged module following contact, the displaced module yielding and the expected final ordering persisting after release. Record a missing or incorrect state change as failed even when pointer geometry, trajectory and whole-frame metrics pass.

## 3. Measure with numbers

Looking is not enough: complete this step before reporting the recreation as checked. If tools or reference frames remain unavailable after recovery, record the affected check as blocked with its cause; do not omit it or treat it as passed. Measure at least one moment in every segment you found while reading the reference (the parts between cuts and major changes), including the opening, the densest frame and the ending frame (or the end card when there is one). In a segment that moves, such as a zoom, camera move or transition, pick a moment in the middle of the movement, not a hold before or after it. For each moment, view both frames at the delivered size and run the measurer bundled with this Skill (the Skill directory is the one holding this Skill's `SKILL.md`):

```sh
node <skill directory>/scripts/measure_frame.mjs reference.mp4 remix.mp4 --t <remix seconds> --ref-t <reference seconds> [--region x,y,w,h --ref-region x,y,w,h]
```

It needs only Node and `ffmpeg`/`ffprobe`; run it with the package's own Node when `node` is not on `PATH` (see the Skill's project step) and it finds the complete ZIP's FFmpeg itself. For npm installations, resolve and pass the native cache paths as environment variables using the Skill's project step; do not assume a `runtime/` folder exists. Without a region it compares the whole frame: brightness (`mean_luma`), line and label detail (`detail`) and strong colour (`accent`). With a region it also measures the box of the content inside it, light on dark or dark on light: `height_px`, `height_ratio` and whether it touches the frame edge (`clipped`). At each moment, measure the whole frame and every text or logo element: the headline, a typical label, and on the end card the tagline and the logo. Always pair an element with the one that replaces it (the remix's tagline against the reference's tagline), never with a different, larger element. The check fails when:

- `region_status` is not `measured`. `failed` means the remix region holds nothing: the element is missing or the region is wrong. `blocked` means the reference region holds nothing: choose a region around the reference element and measure again. Neither is ever recorded as passed. A region outside the frame stops the measurer with an error; fix the region.
- `height_ratio` is below 0.8 for any element. When the user's copy is longer, wrap or reflow before shrinking.
- `clipped` is true, or any text, logo or UI element touches or crosses the frame edge or its container. A logo is clipped only where the reference clips its own logo the same way; when the user's logo is a wide lockup and the reference shows a square emblem, use the logo's symbol or fit the whole lockup inside the frame.
- `brightness_ok`, `detail_ok` or `accent_ok` is false: the remix is darker, sparser (fewer lines, labels, wireframes) or has lost the reference's coloured lines and fills.

Fix failures by correcting geometry, resizing, wrapping, moving, re-timing or adding the missing layers. Never fix them by deleting labels, tiles or layers the reference shows. Export again and repeat the affected visual and numerical checks on that version. Apply the bounded retry guidance in [rebuild](rebuild.md); if a check still fails or is blocked, leave the project available as an incomplete draft and name the remaining difference or blocker. Do not report it as a completed recreation.

## 4. Record

Keep the record outside the live project, in the workspace `VERIFY.md` described by the shared verification. Record the source video and checksum, the inspected output version, the material and implementation reused, requested changes, assumptions, remaining differences, the appearance measurement table, timed feature comparisons, the compared crops and visual findings, and every check as passed, failed, blocked or not run. Include source controls, local-to-global timing and integrated checks where segment work was used. Real review evidence can also be stored with `action: "record_review"` on `openmotion_export_request`, using only statuses supported by its schema and explaining blockers in the evidence. Humans decide visual acceptance.
