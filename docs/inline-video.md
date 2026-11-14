# Final video playback and editor delivery

Video generation and editing do not mount chat progress or video components. Intermediate saves do not pull up the right-hand editor. Once the final authored HTML and assets are complete and ready for preview, the Agent presents the editable Studio on the right. After the final MP4 export completes and passes technical verification, the chat displays only that final video.

## Contract

1. Create or read the intended project. Use `openmotion_open_preview(action=begin)` silently to establish a work round; this is business state, not UI. Keep its workId through saves and the final export.
2. Author and check the final content without calling a presentation Tool or opening the editor for intermediate saves. Production saves return a deferred preview handoff. An explicit editor-only, show-now or background request retains its scope.
3. When the final video is ready to preview, call `openmotion_open_preview` for the current revision/version and complete its right-hand editable Studio handoff. This does not mount any chat component. A saved empty carrier is not a ready video.
4. Request the final MP4, then wait for the owned job to complete and pass automatic technical verification. Saving or queueing does not mean a video is available.
5. In a negotiated MCP Apps connection, call the discovered `openmotion_show_video({projectId,workId})` once. This read-only presentation Tool rejects unfinished, failed, missing, changed or oversized media; it never creates a project, work round or export. Other clients retain their existing player/file delivery path.

The twelve existing domain Tools keep their names and non-App contract. An MCP Apps connection additionally discovers the final-video presentation Tool; the independent template-card extension remains optional. Ordinary preview/open, save, review and display-receipt operations have no video UI binding. The legacy begin action remains available without presenting progress UI.

## Playback and identity

The final component receives only the completed work identity and component-private MP4/poster metadata. It supports the observed canonical and bounded wrapped MCP result shapes while keeping media out of visible content. A malformed or conflicting result shows a compact recoverable error rather than silently retaining an obsolete state.

The component expands its player only after real video data has decoded and has positive dimensions and duration. Duration comes from the media, not update timestamps or an authoring timer. Playback is manual. Verified local bytes are loaded through a browser-owned Blob URL for seeking and replay; the resource declares both data and blob origins. Teardown releases the Blob, and hidden components pause playback.

Each final frame keeps its immutable work/version/job/hash identity. Later edits start another business round without mounting progress UI; only the next completed final video gets another player. Reopening an old chat reads that round's own result, never the project's latest export. Resource failures retain recovery without starting another render.

## Limits and verification

Playback requires a completed owned export, matching version/revision, passed technical report, regular local file and matching SHA-256. The current inline MP4 cap remains 32 MiB. Larger exports use the existing explicit file delivery path. Media stays local; no cloud upload is introduced. Technical verification, actual player playback, editor visibility and creative/audio acceptance remain separate checks.

The implementation is covered by protocol discovery, deferred-handoff, final-player DOM, real two-round rendering and distribution checks. A local browser/SDK harness does not establish native Codex acceptance of a newly installed build. Existing host connections must refresh discovery before using the new presentation Tool; source changes do not update a running plugin automatically.
