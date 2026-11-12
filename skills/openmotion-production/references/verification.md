# Review and delivery verification

Unchanged template delivery follows openmotion-template-to-video: confirm the template loaded and plays in the editor, without rendering, comparison or a fabricated export job. The fresh-export and job/revision checks below apply when a new render is required.

Use separate evidence for creative quality, technical media integrity and playback. Each check is `passed`, `failed` or `not_run`; a missing tool or an unseen render cannot become `passed`. Scores are optional diagnostics, never the acceptance criterion.

For dynamic creative work, also read the shared [Motion review](../../openmotion-director/references/motion-review.md); use it within the current route, without restarting director's full creation workflow. Local changes review the affected interval and adjacent joins; full-film delivery reviews the whole film. Export-only checks the requested file without authorizing creative rewrites. Apply the checks relevant to the requested stage: draft/review tasks do not trigger export.

Keep audiovisual evidence tied to the actual picture/audio pair and export revision. After timing or audio-source changes, apply the affected-scope invalidation rules in [edit](edit.md); an earlier listen or an unchanged duration does not verify the new pair. Record technical integrity, player operation, event/phase timing and normal-speed audiovisual perception separately. A running player, RMS peaks, matching timestamps or a shared event table cannot establish audible continuity or perceived synchronization. If reliable listening is unavailable, prepare the actual auditionable result, mark that check `not_run` and state the limitation; do not claim audiovisual acceptance or add a default user-approval gate.

## 1. Visual self-check: make the film specific

Inspect actual representative frames from every shot, the first/last frames, neighboring cut frames and a moving preview. For a cut at frame N, inspect N−1 and N; when an important action can start and finish between overview samples, use its actual timeline/source interval or output-frame changes to inspect the intervening frames. Two endpoint frames cannot establish that action’s perceptual phase. Review at roughly 360 px wide as well as the full canvas. Label evidence with revision, shot and time/frame.

| Check | Failure to look for | Smallest useful correction |
| --- | --- | --- |
| Message | Opening could advertise any product; unclear subject/action | Show the concrete problem/object and use one specific line |
| Truth | Invented numbers/features, wrong screenshot, copied reference content | Replace with approved evidence or remove the unsupported claim |
| Demo residue | Unrelated sample brands, fictitious chart data, unapproved template slogans or temporary labels | Replace inappropriate assets/copy; approved native graphics and intentionally requested starter defaults may remain |
| Copy | Repeated superlatives, empty “revolutionary/unleash/empower” language, AI production narration, unresolved placeholders | Express a visible action/result in the user's voice; preserve intentional approved wording |
| Hierarchy | Too many simultaneous messages; caption covers the product detail | Shorten/split copy, adjust placement or use a better source crop |
| Readability | Wrapping outside the frame, tiny baked-in UI, insufficient contrast/reading time | Change fit/asset/copy/duration within actual controls; maximum character count does not guarantee fit |
| Visual variety | Every shot repeats the same centered title/background, irrelevant stock inserts | Choose purposeful alternate shots/scales; preserve intentional visual consistency |
| Rhythm | Unmotivated cuts, excessive movement, dead time or abrupt ending | Adjust source range/shot length; hold long enough to understand the result |
| Continuity | Unexpected crop jump, duplicated moment, wrong before/after order | Repair the specific shot and recheck adjacent cuts |
| Closing | Unreadable CTA, unintended black tail, reference watermark or wrong logo | Use an approved end card and verify the last visible frame |

These are evidence-based checks, not a ban on gradients, symmetry or stillness. Native HTML/CSS/GSAP supports varied typography and layout; judge actual readability and relevance. Use the pinned guide and concrete previews for effects instead of assuming every possible animation works.

## 2. Defect and repair record

Record each actionable defect in `reviews/findings.md`:

```text
Defect ID / severity (delivery-blocking or minor)
Revision / shot ID / exact frame or timestamp
Observed problem and actual evidence path
Why it harms the brief
Smallest proposed change
Preserve: approved copy, assets, timing or adjacent shots
Attempt count / patch applied
Recheck: changed frames, neighboring cuts and new result
Status: open or resolved with evidence
```

Prioritize up to three defects per pass. Reinspect after each repair. Two unsuccessful local repairs of the same defect require a blocker report and user direction or a concrete capability fix. Do not automatically do three rounds when the first result passes; do not lower the criteria to finish. Minor intentional tradeoffs can be documented; blocking defects must be resolved before claiming final completion.

Local source edits are supported; each OpenMotion export renders a fresh snapshot of the whole composition. Reuse unaffected design decisions, not stale exported-file verification.

## 3. Technical checks on the completed MP4

Read `openmotion_get_project({projectId,exportJobId:jobId})` for the **completed job's** automatic technical verification report. When export is requested, the service captures dimensions, duration and fps from the immutable native snapshot into `job.expected`, before renderer normalization; subsequent active-project edits or template switches cannot change the verification target. Set `audio: "required"` on `openmotion_export_request` for a soundtrack/voiceover brief or `audio: "silent"` for a silent brief, before rendering; the project/status read has no audio-policy argument. The default `optional` allows either and cannot prove requested sound exists.

The verifier checks:

- File exists, is nonempty, and has a recorded SHA-256.
- ffprobe can read the MP4 container; exactly one H.264 video stream with yuv420p.
- Dimensions and nominal/average fps match the stored snapshot specification. Audio presence follows the selected policy; any audio stream must be AAC for this MP4 deliverable.
- Encoded duration matches the snapshot within the greater of 0.1 seconds or one frame; decoded frame count is consistent with that duration.
- FFmpeg decodes the entire video and all audio streams with errors treated as failures.
- First, middle and final planned frame can be sought and decoded.

Missing ffprobe/FFmpeg is `blocked`, not a media pass. A successful check does not detect every duplicated frame, brand error, visual freeze, silent soundtrack or wrong audio content. Inspect motion, continuity, intended sound and synchronization separately.

Repository/installed-plugin agents with a shell can run the same verifier for a retained export:

```sh
node --experimental-strip-types "$MOTION_ROOT/scripts/verify-export.ts" "/absolute/path/final.mp4" '{"width":1920,"height":1080,"fps":30,"duration":15,"audio":"required"}'
```

Set `MOTION_ROOT` to the full application directory (`transport.cwd` in the installed MCP configuration), not a thin plugin cache and replace the example JSON with the saved job specification and brief audio policy. Never derive the expected values from the output being tested. The script prints JSON and exits nonzero for failed/blocked checks. This read-only check does not transcode or repair the deliverable.

The legacy numeric-duration argument remains supported only for old silent 540×960 / 24 fps exports. Native exports require the explicit JSON specification. `npm run verify:export -- FILE EXPECTATION_JSON` invokes the same script from a checkout.

## 4. Playback checks on the final file

Use the host's supported player/browser to open the actual MP4, not just the editor timeline. The download endpoint may download a file rather than embed a player; open the downloaded file in a supported viewer. Background rendering needs no foreground editor.

Verify:

1. Metadata loads and a frame becomes visible; no media/decode error.
2. Play from start to end, observing transitions, motion, reading holds, intended sound and synchronization. Playback time advances, ends near the intended duration, and no unexplained frozen/blank section appears.
3. Seek to beginning, middle and near the end; picture updates and playback resumes.
4. Replay from the beginning after reaching the end.
5. Inspect the final export's opening, each shot, boundaries and closing against the storyboard. Pay special attention to the last frame and source cuts.

Record the player/browser, time, file identity and observations. When accessible, also inspect media error/readiness state and surfaced console/runtime errors. Do not fabricate console access or report “zero errors” from an unobserved log.

If no host can view the actual file, ask the user to perform these concrete checks and record their reported result as user-confirmed evidence. Deliver the file as “exported; playback review pending” until then. A technical pass alone is never a full production pass.

## 5. Final record and handoff

`VERIFY.md` contains:

```text
Project / template / brief and storyboard paths
Export job ID / revision / snapshot dimensions, fps, duration / brief audio policy
Actual MP4 path / SHA-256 / check time
Technical report: actual tool/script JSON
Visual review: evidence, defect resolutions and status
Playback: player, observed full play/seek/replay, status and evidence source
Editable project: actual native folder/archive path, including local assets and Studio manifests
Outstanding limitations: specific missing check or intentional tradeoff
Overall: passed only when all required checks passed and no blocking defect remains
```

Distinguish “preview prepared,” “export pending,” “MP4 exported” and “verified final.” Link only to files that exist. Do not claim guaranteed playback on every device; report which player and checks were actually exercised.

Creation/edit delivery also completes the [editable preview handoff](native.md#editable-preview-handoff). Recheck any outstanding display failure before the final reply and report it separately from export success; hidden-tab playback and `markDeliverable()` do not establish visible editor delivery. Export-only requests do not require opening the editor.

Workflow sources: [rari](https://x.com/0xwhrrari/status/2105643919119696297), [Movez](https://x.com/0xMovez/status/2104216919033192746), [jmori](https://x.com/0xjmori/status/2111793914206171234). Their production principles are adapted to this repository's capabilities; their example tools, code and performance claims are not assumed to be installed or verified here.
