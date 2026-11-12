# Check and deliver the project

Native directory workflow: run the pinned CLI lint/timeline/info and render commands in the project directory, then inspect the actual output. The MCP calls below are alternatives for projects managed by the plugin, not requirements for portable projects.

## 1. Inspect the project

Use the pinned native CLI lint/timeline/info commands for source diagnostics and timing; consult that runtime's help. Fix actual errors. Things the original genuinely has (its colours, its small text) stay when they are valid native content — keep matching the original. Check each element's timing against `TEMPLATE.md`.

Phase-one MCP has no standalone inspection Tool. For managed projects, opening a requested editor runs lint, and an export automatically runs lint and technical verification. Neither result proves that each element matches the reference. Do not open Studio or render an unwanted final video merely to obtain diagnostics; use host CLI capabilities for draft-only checks, or record an unavailable check.

## 2. Export and compare with the original

For a plugin-managed project:

1. Read `openmotion_get_project({projectId})` for the inspected source's revision and currentVersionId. Reuse a completed export only when both match the required deliverable.
2. Otherwise call `openmotion_export_request({projectId,requestId,versionId,expectedRevision,audio})`, using that currentVersionId as versionId and a stable requestId. Use audio=required when the reference has sound to retain, or silent for a silent reference. Creation or successful saving is not an export.
3. Poll `openmotion_get_project({projectId,exportJobId:jobId})` for that job. Only completed with a passed automatic verification is technical success. On failed, inspect the diagnostic, fix the source if needed, read its new version and use a new requestId for the corrected export. Do not submit repeated jobs while one is pending/running.
4. Compare the actual exported file with the local reference using available host playback, frame inspection or native CLI diagnostics. There is no public video-comparison Tool or implicit `latest-export` candidate; use the actual returned MP4 path. Produce the original-versus-template comparison video with available host media tooling, outside the template ZIP. If a capability is unavailable, record the specific missing evidence and delivery gap rather than inventing results.

For an independent native folder, use the pinned CLI to inspect/render that directory, then probe/decode the output and compare it with the reference. An unrelated managed projectId or revision cannot protect or verify these files. Do not claim MCP snapshot verification for a direct CLI render.

When comparing:

- Compare the same actual timestamps, including content, wording, composition, motion, pacing and missing stretches.
- Open the relevant source/rendered frames; optional similarity diagnostics only locate differences, never define visual acceptance.
- Verify detected cuts against adjacent source frames, then inspect rendered boundaries. Restore missing original hard cuts; automatic candidates can be false positives.
- Check duration, retained sound and audio offset through actual media evidence. Technical audio presence does not prove the right content or synchronization.

Fix locatable issues relevant to the request, then re-export the changed source. Use the cause and expected benefit to choose a further correction, a different approach or delivery with a clear limitation. Repeating an unproductive change is not progress; there is no fixed number of permitted rounds. A limitation note does not turn an unresolved defect into a passed check. For reference-to-rebuild comparison, similarity scores locate differences; humans decide visual acceptance. The package self-containment check is below.

**Record checks in one of three states** in `TEMPLATE.md`:
- Ran, passed
- Ran, did not pass (say where it differs)
- Did not run (environment, tooling, timeout). **A check that didn't run is never reported as passed**, and never left out.

## 3. Package the native project

Follow the [portable project contract](../../openmotion-production/references/portable-project.md). Deliver the complete project directory or ZIP with source, required assets, preview, cover and `TEMPLATE.md`. Rendering must not require a local template ID, custom `template.json` or a custom registration tool.

Check that intended content and motion remain reasonably editable. A whole reference video, full-frame sequence or unadaptable contour transcription is not a substitute for that work; ordinary time-driven arrays and functions are allowed. Keep optional root variables as convenient edits, not the only allowed changes. Check local file references and required Studio manifests before packaging.

`preview.mp4` must come from exactly the source being delivered. If source changes after export, re-export before packaging.

## 4. Verify the delivered copy

This checks that the ZIP works on its own, so later edits can render. It is not a pixel comparison: an unchanged request is served by delivering `preview.mp4` itself.

Unpack the ZIP into another directory. Do not use a registered template ID or read files back from the original working project. Run the pinned native CLI there; consult its help for the runtime's supported options. For HyperFrames 0.9.7:

```sh
node /absolute/path/to/hyperframes/bin/hyperframes.mjs render /absolute/path/to/unpacked-project -o /absolute/path/to/reproduced.mp4
```

- The render completes without missing files, fonts or assets, creator-machine paths or undeclared remote dependencies.
- Frame rate, actual decoded frame count and duration equal those of `preview.mp4`.
- A few representative frames look like the preview.

Do not compare every frame, and do not spend repair rounds on pixel differences that are not visible (for example GPU antialiasing). Fix a failed render, a missing file or a visible difference. Record the result in `TEMPLATE.md` as passed, failed or not run.

This is a self-containment check, not independent-agent proof. Do not claim an independent test happened inside the creating session.

## 5. Delivery

Reply briefly with absolute local file paths, not relative paths (they break when the reply is copied or opened in another host) or a temporary localhost URL that stops when the session ends. Put only the plain path in each link target. Link the preview, the folder/ZIP and the original-versus-template comparison video for human review (saved next to the ZIP, outside the package). Then state what can be changed (the Studio Variables panel or source) and the remaining differences from the original in plain words. Leave measurements, scores and check states in `TEMPLATE.md` unless one affects the user. A score is diagnostic, not a visual-quality verdict. Optional catalog IDs are secondary and never replace the portable files.
