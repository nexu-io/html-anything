# Product domain and data contracts

These are durable ownership constraints, not an implementation plan or a claim that every product capability exists. Domain packages are introduced by actual responsibility; Web and Daemon share their contracts, while carriers compose hosts.

## Sessions, artifacts and projects

A session owns instructions, real messages and multiple artifacts; it is not a project. Creating an empty session is valid, and generation failure preserves instructions. Only actual callers write Agent replies; never fabricate execution, role, content or success.

Artifacts have stable session ownership and resource types. Viewers open and interact with them; full pages, embedded views, HTTP and MCP share IDs and persistent authority. Verify ownership on every operation rather than bypassing it through a current-project alias. Retries are idempotent; cancellation, failure and conflicts cannot create another state authority.

Native source is shared by manual and Agent edits. Revision covers declared source, media and Studio data, excluding reproducible caches. Drain/save the old context before switching. Preserve drafts and context on failure; do not silently substitute the newest revision or add compatibility aliases. External editors do not automatically participate in internal transactions.

## Editing, generation and delivery

Web owns interaction/orchestration; components own reusable controls and Less. Film HTML/CSS/media is typed content, not a source-style whitelist bypass. Render from an immutable fixed-revision snapshot so later edits cannot change queued input. Product services own queues; sidecar owns engine/browser/FFmpeg processes and resources. Completed requires actual outputs and matching input specifications, independent of a mounted browser page.

File structure, codec, dimensions, duration, audio and decoding are technical checks. Visual review, listening and real-player acceptance have separate evidence; technical success is not creative acceptance.

Session orchestration, modalities and providers are distinct responsibilities. Product gateway/provider/task owns inference protocols, credentials, task and material ownership. Freeze the initiating project/target; cancellation, context switches, restart or expired targets cannot let old callbacks overwrite another project. Completion requires actual imported material; never expose provider credentials to Web/MCP or silently retry paid requests.

Template catalogs use stable IDs, types, origin, digests and licenses. Selection creates a new independent project. Built-in templates/covers, models, native executables and Skill text need separate finite resource manifests and lifecycles. DEV/prod template selection is explicit configuration, not an alias or implicit paid/provider fallback.

Production guidance routes intent to complete shared context, editing, templates or recreation. Local edits do not restart the entire creation process. Agent guidance is complete and version-addressable rather than empty placeholders. Saving editable HTML, opening an actual host view, rendering a film and obtaining user acceptance remain different outcomes; explicit background work must not focus the user's desktop.

## Browsers and hosts

Web browsing and native-project viewers are distinct resources. Browser contexts isolate sessions and never read the user's daily profile; external pages execute in an actual isolated browser, not the product DOM. Tab visibility, editing state, browser storage and tasks have explicit owners. Hiding a tab does not delete a project or cancel a task.

Define drain on browser/session/observer/service exit. Browsers, media tools and native binaries use resource/process management, not domain-owned PID/port/path files. Carriers transmit environment facts and register supported host transports; do not force every Agent host into a Codex-specific adapter. Returning a link cannot prove a host panel opened. User-data import and external protocol compatibility need explicit contracts.

## Shared workspace and transactions

Workspace owns sessions, caller messages, artifact ownership, immutable source revisions, current selection and authoritative history. Its contract sub-entry is browser-safe. Node opens `workspace.sqlite` only in the Daemon's granted persistent data root. It allocates no OS resources and does not consume old catalogs/default-project aliases/experimental formats.

Projects are immutable snapshots of logical paths and UTF-8 text. Revision hashes sorted paths/content, including declared Studio manifests and excluding cache/output. Current limits are a finite text-extension allowlist, 128 files, 1 Mi characters per file and 4 MiB UTF-8 total. PNG/PCM16 WAV media uses a separate finite resource manifest and persistent bytes; remote dependencies and additional codecs require their own contracts. Fixed-revision materialization precedes physical engine use; the database is not an editable working copy. Snapshots, current pointers, ownership and command receipts commit in one SQLite transaction.

Every write has a requestId. Repeating the same normalized operation returns the original receipt; reusing a key with another operation/payload rejects. Use explicit reads for latest state. Session, artifact, project and message IDs are distinct; creation does not implicitly switch editing context. Session titles do not alter artifacts or native revisions.

Switching requires expectedSelection plus the current artifact/revision. Saving requires expectedRevision. Reject changed selection or unconfirmed source instead of retrying against a substituted revision. Per-session recent selection is retained; empty sessions need no artificial artifact.

HTTP `POST /api/<operation>` and MCP consume the same schema, errors and transactions. Daemon owns adaptation/tool registration; carriers only wire transport. Reads do not create resources; receipts are not latest-state reads.

Web separates drafts from confirmed source and saves before switching. Unknown transport outcomes keep the original requestId and block conflicting writes; retry confirms that command rather than generating another. If switching committed but reading failed, retry only the read. Explicit save failure preserves drafts/context; discarding requires a user action.

History cursor/version is distinct from content revision. Undo/redo requires both source revision and monotonic history version, including repeated-content histories. Editing truncates the redo cursor while immutable snapshots remain; unchanged saves do not create history. The current database schema is 3. Reject old experimental schemas without silently migrating or deleting user data.

## Persistent media resources

Workspace owns logical `assets/*.png|wav` paths, names, verified format facts and bytes. SHA-256 revision identity includes the sorted manifest together with canonical text source. Imports verify actual PNG decoding/CRC or PCM16 RIFF/WAV layout; declared filenames/MIME never substitute for content checks. Limits are 6 MiB per resource, 64 resources / 64 MiB per revision; PNG is non-interlaced and at most 4096×4096, WAV is one/two-channel PCM16 at 8–96kHz. The 6 MiB bound keeps base64 messages below the stock SDK 10 MiB stdio limit. MCP returns binary once in structured content and only metadata in textual content; no custom transport cap is required. Raw binary is never persisted into HTML or accepted as an arbitrary filesystem/remote URL.

`resource_import` and `resource_remove` require session/artifact ownership, expected revision and idempotency identity. Both commit through the project history transaction; normal source saves retain resources. `resource_read` requires ownership, an immutable revision and membership at its logical path. A digest alone is not read authority. Byte corruption fails closed. Deduplication belongs to this persistent domain storage; it does not create a blob cache or GC lifecycle. Removing current membership does not erase history or bytes needed by an old view. Discarded database formats are rejected; there is no implicit upgrade/reset or old-root import.

Previews capture the exact resource manifest, serve bytes with exact MIME and bounded single-range byte requests, and revoke on explicit close. Missing media rejects a new candidate while the confirmed old frame remains readable. Resource and insertion responses can be committed before transport fails: retain the original payload/request identity, and never regenerate an already applied insertion during save retry. Web's native local image/audio clocks, bounded trim and independent fixed-rate source-in-point/rate/gain/mute reuse Motion source transforms. Source-window/duration/rate changes validate atomically; remaining source length divided by authored rate limits trim. Authored fixed rate is 0.1..10, preserves clip start/duration and is separate from preview transport speed. Preview assembly verifies source-length hints and media types against immutable resource facts. Linked tracks, ramped rate, automation, effects and additional codecs remain separate work.

## Native model and source transformation

Motion's browser-safe closed schema accepts static X/Y offset, rotation, opacity and six-digit text color, plus supported numeric animation properties. It never accepts arbitrary CSS maps. Write only explicitly touched fields, preserving inherited/relative values and expressions. Web retains incomplete numeric drafts. Once transformation succeeds but persistence fails, retain transformed source and the old confirmed preview; retry the same save rather than regenerating animation.

`/motion/animate` is a pure native transform. Operations use actual element and animation IDs; structure changes require reparsing position-derived animation IDs. Supported editing is single-property numeric x/y/rotation/opacity/scale percentage keyframes with strict ordering, 0/100 endpoints, bounded values/eases and a window inside clip/composition duration. Explicit numeric fromTo with known easing can be converted; mixed numeric keyframes can be split into independent property lanes with faithful values and overall/segment easing. Competing same-property writers reject order-changing operations. Dynamic selectors, implicit starting values and unsupported advanced animation remain read-only, never silently discarded.

Overall and segment easing are independent. Preserve native omitted-segment defaults. Key percentages are progress; invert overall easing to obtain elapsed seconds. Key retiming cannot cross neighbors or clip bounds. Moving an endpoint changes the tween window and recalculates other percentages while preserving their absolute key times, values and easing. Moving/scaling a clip updates supported numeric tween timing together; relative/implicit/dynamic timing rejects atomically. Root-composition metadata is not a normal clip-timing edit. External-file host windows use `/motion/host`: movement and right-edge trim write only the owning parent source and keep child source/keyframes at their original rate. The graph supplies identity and child duration bounds; unresolved selectors, links and host animation make the window read-only. Shared parent writes affect all its mounts. Source in-points, slip, stretching and ripple need separate contracts.

New projects declare an explicit GSAP timeline. SDK `can` success is not proof of a source write. Preserve authored behavior; do not rewrite scripts merely to bypass unsupported transforms. Motion executes no author script, persists nothing and allocates no system resources. Parent containers are not replaceable leaf text.

The canvas bridge exists only in derived previews. It reads actual geometry and emits intent; Web validates frame, opaque origin, revision, element and editing context before the shared save chain. SVG geometry expresses selection data while Less owns appearance. Coordinate conversion includes frame scaling and inverse 2D parent transforms. Escape cancels. Perspective, singular matrices, unknown offset expressions and nonstandard zoom are not guessed. Movement commits on pointer release and reloads confirmed preview; live/advanced transforms need their own contract.

## Drafts, projection and preview lifecycle

Native field candidates bind artifact, revision, mounted instance, owning file, complete source projection and local element identity. Switching elements/composition contexts/projects/sessions or opening preview drains transforms and persistence first. Failure retains candidates/source and selection; explicit discard clears them coherently. Pending native fields block direct source editing; stale model projections block tree/timeline gestures while leaving a source-repair route.

Studio uses one native identity model and project transaction for layers, properties, clips and key lanes. Pointer geometry is transient; source/history is never owned by SVG or an iframe. After SDK ID renumbering, preserve the selected property and key focus without treating a stale ID as write authority. Frame selection may update UI selection but cannot request persistence/history.

Preview opens only confirmed revisions. Caller-generated view UUID retries are idempotent for the same owner/revision, and reject reused IDs for another source. Views are bounded in-memory projections, not physical editable projects, blob contents or persistent authority. Each Daemon allows at most 16. Explicit close, page teardown and Daemon close revoke them; unknown closure can retry by ID, not elapsed-time GC.

Frames have opaque sandbox origins and CSP limited to their own resources. They contain no write capability, external network/form/frame permission or editing chrome. Build-injected GSAP/runtime never enters saved source. Version/capability/fps metadata identifies actual playback. A new revision becomes ready before replacing the old frame and revoking its URL. Its initial clock messages cannot overwrite the editor playhead during the old-view retirement handshake; activation seeks the retained global time. Superseded handoffs cannot publish clock/readiness changes; artifact switches retire the old frame first, and stale async callbacks cannot remount it.

Current editing covers root and external-file composition leaf text, pixel font size, closed appearance, bounded numeric timing/keyframes, scope-limited 2D canvas movement, shared source persistence/history and actual runtime play/pause/seek. `/motion/context` derives the file model, instance ancestry and numeric local clock from the submitted snapshot without executing author scripts or persisting data. The global preview remains authoritative for rendered instance behavior; local editing does not create instance-specific source copies. Uncommitted source drafts preserve the confirmed preview and clock until save/discard. Unresolved clock mappings are read-only. Basic PNG/WAV import, insertion, bounded audio trim, independent fixed-rate source-in-point/rate/gain/mute and actual playback are connected through the persistent resource contract. Broader media/audio editing, advanced timeline behavior and rendering/export require independent implementation and evidence.
