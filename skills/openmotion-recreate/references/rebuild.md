# Read, measure and rebuild the reference

This page carries the reconstruction method for openmotion-recreate. It is guidance for the host Agent; the native source is written by the Agent and saved through the project Tools.

## Read the whole reference

For a link, obtain a local decodable copy using the host's available capabilities; no particular downloader is a prerequisite. Keep the URL and the file's checksum. If the video cannot be obtained or decoded, report that specific blocker instead of guessing from a cover or description.

Read the reference as a whole before choosing an implementation. Inspect representative frames and consecutive frames around every cut, entrance, exit and transition. Explain what persists, enters, changes, holds and exits; keep an object's identity across cuts when it is the same object. Learn from observable behaviour rather than guessing the original author's code. A one-per-second overview is for navigation only and is never evidence of motion: it drops 1–3 frame differences, entry directions, blur and flashes at cuts.

When an interaction changes the scene, identify both the actor and the affected content. Inspect the state before contact, the response during the action and the settled result. For a pointer dragging a module, reconstruct the module following the pointer, neighboring modules making room and the final ordering; animating the pointer alone or sliding one module over a stationary neighbor does not reproduce the interaction. Keep these coupled changes together in the editable timing model.

If decoding, frame extraction or seeking fails, recover the media tools using the runtime paths in the Skill's project step, or use another available method that exposes the required frames. Confirm the actual timestamps and inspect the resulting images; a successful command or a screenshot of an unverified playback position does not establish coverage. Keep any unresolved interval or detail explicitly unverified, and continue work that does not depend on it. Report a concrete blocker if the missing evidence cannot be recovered; do not silently replace it with an approximation.

## Measure with the pinned CLI

Run `node <hyperframesCli> measure …` with the `hyperframesCli` path from `openmotion_get_project`. These commands answer specific questions; running every one is not mandatory. Write images into a working directory outside the live project with `--out`, then read them.

| Question | Command | Use |
|---|---|---|
| Canvas, fps, duration | `measure probe <ref>` | Root `data-width`, `data-height`, `data-fps`, `data-duration`. Keep rational rates such as `30000/1001`; use the picture duration, not a longer audio container |
| Hard cuts | `measure cuts <ref>` | First draft of the segmentation; verify each candidate against adjacent source frames |
| What changes when | `measure events <ref> --map --out <dir>` | Appearance, disappearance, holds, sound onsets and beats |
| Frame by frame | `measure frames <ref> --range a,b --roi x,y,w,h --max 16 --out <dir>` | Entry direction and style, on-screen change, exit, edge treatment |
| Motion curve | `measure curve <ref> --start a --end b --roi x,y,w,h` | Start, end, duration, overshoot and the closest GSAP ease; a starting estimate |
| Text size | `measure ink <ref> --at t --roi x,y,w,h` | Ink width and height to match type scale |
| Background and colour | `measure look <ref> --at t --grid 8x6` | Gradient direction and light-to-dark falloff |
| Crop an asset | `measure extract <ref> --at t --roi x,y,w,h --out <dir>/logo.png` | Photos, screenshots, logos from their largest, sharpest frame; then import |

Also look for texture where the reference has it: how much a back layer blurs and darkens, how bright the highlights are, and the direction and length of motion blur on fast frames. Reproduce what is there; do not add effects for polish.

## Choose an editable representation

Choose source and component boundaries through shared behaviour. Objects sharing geometry, state, layout or motion can form one SVG, Canvas, Three.js scene or native composition; independent contributions can stay separate. There is no requirement for one clip per object, one composition per cut, one tween per move or a fixed number of poses. Keep relative scene time distinct from the root timeline.

Keep content the user will change easy to locate: wording, brand, images, named objects and their motion. Use meaningful source names and declare common edits as root variables so the Studio Variables panel shows them. Variables are shortcuts, not an editing whitelist.

Use code for controlled text, geometry and motion; use supplied or cropped photos, logos, screenshots and textures as local assets. Choose 2D, perspective layers or real 3D according to the observed behaviour and the needed edits. Canvas/WebGL follows the pinned runtime's seek and readiness contract: derive the picture from input time and settings, including deterministic randomness, so the same time always renders the same frame.

For small objects whose shape carries meaning, inspect a close crop before choosing the geometry. Match the silhouette, concavities, orientation, proportions, stroke and attachment to nearby labels, not just the colour and bounding box. For example, a mouse pointer with an inset is not a solid triangle; rotating the triangle cannot restore the missing contour. Use an editable vector path or the appropriate local asset when a CSS primitive cannot represent the observed shape. Check repeated instances and changed states against the reference.

Do not pass off playback of the entire reference, a full-frame image sequence, editable content baked into a background, or an unadaptable per-frame contour transcription as a rebuild. Time-driven functions, loops, arrays, simulations and shape interpolation are valid when the content stays reasonably editable.

## Establish a difficult visual system

### Plan shot and action units

For a dense multi-shot film, organize reconstruction into locally reviewable units near shot or action boundaries. Keep coupled actions together, and include neighboring reference frames so an entrance or exit can cross a unit boundary. Choose unit lengths from the action and dependencies. A unit can contain several fast cuts or one continuous move.

Use separate workers for independent units when the host supports delegation and the task authorizes it. A single Agent follows the same local process sequentially. Keep one coordinator responsible for the root timeline, shared resources and soundtrack. Give each worker disjoint source files. Save integrated changes through the existing revision-protected project workflow.

Make the unit brief concrete enough to execute. Supply the following information in working notes or the worker task.

| Input | What the maker needs |
|---|---|
| Requested result | The user's content, changes, duration and editable deliverable, with any locked decisions |
| Reference interval | Local reference path, fps, dimensions, source start/end frames and neighboring action context |
| Available inputs | Supplied assets, reusable source and known limitations, plus visible discrepancies already established by comparison |
| Ownership | Which objects, text, transient effects and files belong to this unit, and which are shared |
| Integration | Coordinate space, global-to-local time mapping, asset paths, entry points and shared typography |
| Return | Editable source, asset mapping, timed observations, actual local output comparisons and remaining differences |

Keep reused implementation and newly reconstructed work identifiable. Recheck a reused object at every new appearance, including a different scale, camera, occluder or text state. Respect the supplied-input boundary when the task calls for an independent experiment.

### Turn observations into driving data

For an unfamiliar or inaccurate unit, describe its defining form and action, then follow recognizable features through the reference. Keep a compact record of source frame/time, feature or object, screen position, size, orientation, pose and visibility. Use relative distances and occlusion to distinguish common camera movement, part movement and deformation. Mark uncertain observations, including measurements contaminated by overlapping text or objects.

Convert those observations into timed controls the renderer actually reads. Keep the connection from observation to model parameter and source function inspectable. Depending on the passage, the useful record may be landmark coordinates, per-part keyframes, camera matrices, shape states, correspondence fields or per-line text bounds. Record direction/speed changes, extreme poses, fastest travel and settling. Add observations where interpolation remains uncertain.

| Observed change | An editable way to encode it | Output that challenges the model |
|---|---|---|
| Camera travel over a surface | Match stable landmarks across views, fit transforms and interpolate the camera over a spatial material | Motion extremes, perspective, registration residuals and newly revealed areas |
| Parts moving relative to one another | Shared parent/camera transform plus part-local paths and occlusion order | Relative distances and overlap at intermediate times |
| Changing silhouette or surface | Timed shape states, skeleton or mesh with correspondence between recognizable parts | Intermediate pose, volume, holes and changing visibility |
| Text assembling or leaving | Per-line or per-glyph reveal, travel, spacing, compression, opacity and blur curves | First visibility, readable hold, fastest expansion and final disappearance |
| Streaks, flash or scan distortion | Separate time envelopes with observed direction, extent, affected layers and recovery | Frames immediately before, during and after the event in the complete layer stack |

A changing silhouette needs controls for its internal change. If one spatial sample plus a global transform fits the endpoints but misses an intermediate pose, add a constraint at that time and revise the representation that failed. Connect the same recognizable parts through time. Correct unreliable correspondence around occlusion, repaired text or disappearing features by changing anchors, masks, state grouping or the model. Check estimated motion against the visible travel before limiting it.

For a form made of repeated marks or particles, separate a clean shape or brightness field from the mark renderer. The following construction is useful when the reference exposes a recoverable underlying form.

1. Use distinguishable colour, brightness or edges to derive an occupancy or brightness field for each observed state. Choose observations from the changing form and group continuous states on each side of a cut.
2. Mask independently changing overlays and inspect paired source/cleaned fields. Check whether the mask removed bright subject details, a hole or a thin appendage. Repair the affected region using available observations or revise the mask, keeping uncertain reconstruction visible in the notes.
3. Encode the cleaned fields in common coordinates. For a tonal form, contours at several brightness levels can preserve its interior and holes. A skeleton, control mesh or other shape model may better fit the observed structure. Save the source time with each state and declare coordinate and displacement units.
4. Establish corresponding parts between neighboring states in each continuous group, using reliable landmarks, manual anchors or available tracking/flow methods. Check the correspondence on the cleaned fields, especially at repaired or occluded regions.
5. At query time, select the surrounding states and warp their fields toward that time using the correspondence. Blend aligned values, then sample the resulting field to drive mark placement, area or opacity. Keep material, deterministic variation, text and transient effects separately addressable. Inspect the field and styled output at intermediate times, and add a state or revise correspondence where the form fails.

Choose state count, extraction method, correspondence and control resolution from the reference and the host's available tools.

For camera movement or surface deformation, prepare enough spatial material to cover the revealed area. Align useful views of the same structure when available. Check overlap for doubled edges and check the sampling boundary for gaps or stretched pixels. If blending imperfectly aligned views produces double structure, select a reliable source for that region and use other views to fill uncovered areas, or adjust seams and visible regions. Recheck intermediate and extreme camera positions. Use a more suitable projection, layers or geometry when one plane cannot preserve the observed relationships. Preserve weakly supported intervals in the review notes.

### Prepare material in its actual use states

Look through the available reference for a clear, unobstructed view of the same object before repairing an occluded one. Compare pose and lighting before using that view. When removing text or overlays, inspect the cleaned shape before stylizing it. Check bright subject details, holes, anti-aliased glyph edges, shadows, underlines and restoration seams. Use the background's structure to choose the repair method.

Inspect the material when the covering text or object has left, after requested content changes, and in every reused view. Follow the mask or material back to its source when a ghost moves with the subject. Preserve independently changing elements as separate source controls.

### Validate and repair the local implementation

Use the pinned seekable preview or targeted native captures to iterate on the actual unit source. Compare reference and output at equal scale and corresponding times. Include observed states, intermediate times, extreme poses, the fastest displacement and entry/exit boundaries. Read back feature positions, size ratios, angles, relative distances or visible widths from the output using the same method as the reference. Review the timed sequence to assess acceleration, holds, reversals and recovery.

For the most consequential difference, name the failing feature and interval, locate its source control and repair that mechanism. An early unreadable title may need different opacity, travel and blur durations. A double contour may need corrected correspondence or material alignment. Reinspect the same failed moment and neighboring states after changing it. Keep the measured and visually estimated controls distinguishable.

Calibrate light, density, edges and material on the established motion. For exposure sampling, check preserved brightness and high-frequency marks for repeated copies or comb-like gaps. Adjust temporal sampling or directional integration when needed, and match the observed streak direction, extent and clear hold. Keep frame-specific flash peaks and recovery explicit. Inspect later text and post-processing layers for marks that alter a flash after it is drawn.

Return the working source and actual comparison evidence with the brief's time range, asset identities, shared dependencies and remaining differences. Keep generation scripts consistent with the final corrected source when they are part of the handoff. Use local captures for targeted fixes, then verify the final integrated export as [check and deliver](verify.md) describes.

### Integrate the inspected units

Import shared media once and connect the returned paths. Preserve each unit's global-to-local clock and coordinate transforms. A background ownership boundary can differ from a foreground element's first visible frame. Coordinate overlaps explicitly so an outgoing title and incoming logo can coexist as the reference shows.

Review the integrated project across joins and repeated appearances, including pose, direction, speed, exposure, text and layer ordering. Capture the final composite for short events. Recheck every affected use after replacing a shared asset or renderer, and bind the evidence to that source or export version. Play the integrated sequence at normal speed and check the single soundtrack through the existing delivery workflow.

## Assets, text and fonts in this package

- Images, footage and sound go through `openmotion_import_assets` (PNG, JPEG, WebP, GIF, MP4, WebM, WAV, MP3, OGG, FLAC, AAC, M4A). Import does not place media on the timeline; reference the returned path.
- SVG logos and vector artwork are text: save them with `openmotion_edit_project`.
- Font files cannot be imported. Choose type by character (geometric shapes, contrast, x-height, terminals): start with the fonts listed in the authoring guide; when none fits, embed a permitted font as a base64 `@font-face` in a CSS file saved through `openmotion_edit_project`, or name the substitution at delivery.
- When replaceable text uses distinctive lettering (pixel, stencil, wide or hand-built wordmark), make any new word settable in that same style: the closest face of the same kind, or lettering built so other words can be set with it. Vectorising only the reference's own word leaves every later edit in a plain fallback font.
- Keep requested editable wording as addressable text. A calligraphic logo can be an image or vector asset instead.

## Rebuild and compare while working

Compare actual frames with the reference while developing. Fix concrete issues such as omitted content, wrong text, broken assets and incorrect timing. When two consecutive fixes for the same issue do not visibly reduce the difference at the same moment, change the approach once; if that also fails, record the issue and move on.

Verify hard cuts against adjacent source frames. Restore a missing original hard cut unless the user requested a change; do not accept accidental smoothing or a detector's false positive as intended behaviour.

When an image changes, inspect its crop, masks and coupled effects. When wording changes, inspect wrapping and reading time. When a scene's duration changes, update dependent scene starts and media timing. When a brand or named object appears several times, check all relevant appearances.
