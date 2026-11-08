# Adapt Presenter Tech

Read the package's `motion.json`, `guide.json` and `CREATION.md` after extraction. Use its actual scene catalog and parameter schema; keep source, working instance and final exports separate. The pinned source identity and package checksum are in [source.json](source.json).

## Pick a story and supply its materials

- A single idea, a short list, a comparison or a closing takeaway can use the B1–B4 text expressions with native sound effects.
- A presenter-led scene uses the creator's image or recording, actual source dimensions and face position. Presenter video must continuously cover the output duration; assemble the approved spoken edit first when the original recording needs cuts.
- Screen, gallery and other media scenes declare their own input roles and counts in `core/catalog.json`. Read only the selected scene's requirements and use the user's existing material.
- Voice and music are independent output-clock audio tracks. They must cover the planned duration when supplied. Captions use actual supplied or measured timings, not guessed word clocks.

Keep the user's topic, language, requested media and approved story. Ask only for missing inputs needed by the selected scenes. Demo people, voices and private materials are not part of the package; replace them with the creator's own material.

## Make an independent instance

Write the new input outside the runner and use `adapter.py plan`, then `prepare`, then `preview`. Native scenes retain their declared action durations; the basic expressions allow bounded reading holds. The plan reports the output duration, source-to-output spans and required media roles. Rebuild a new instance after changing inputs instead of bypassing its binding hashes.

Review framing, actual words, captions and the order of evidence. Use `adapter.py render` to produce the video with its audio mix, then inspect the actual file and normal-speed playback. Do not present a plan or a still as a completed video. Preserve prior outputs; the runner refuses existing output paths.

## Delivery

Deliver the video, its input document, the prepared editable instance and the unchanged template package or its recorded identity. Record any untested conditions. This package uses its included rendering engine; importing its source directly into OpenMotion's native Studio timeline is not a verified route.
