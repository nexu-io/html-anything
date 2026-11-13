# OpenMotion runtime adapter · phase one

Use only the OpenMotion MCP Tools actually returned by tools/list. Read [Native authoring](native.md) and the pinned engine guide before authoring. Keep one native project and one renderer; creative code is authored by the host Agent.

| Responsibility | Public Tool / supported scope |
| --- | --- |
| Create | openmotion_create_project: independent project, saved requirements, optional builtin template/reference; returns IDs and initial version |
| Read | openmotion_get_project: project list page5, explicit details, bounded text file reads, associated export status |
| Import | openmotion_import_assets: real local image/audio/video attachments, per-item results, immutable asset IDs, no automatic placement |
| Save | openmotion_edit_project: revision + version check, one atomic text batch and optional requirements, one content version |
| Preview | openmotion_open_preview: explicit project or bound session, native lint, exact editable Studio URL; host opens browser |
| Version | openmotion_list_versions / openmotion_restore_version: page5 history, restore as a new version, retain later history/resources |
| Export | openmotion_export_request: immutable snapshot, background MP4, automatic lint and technical verification |
| Cancel | openmotion_export_cancel: explicit owned job, distinguish cancelling/cancelled/completed |

When selecting, obtaining or replacing media, apply the [shared material policy](materials.md) within the selected workflow and existing authorization.

## Execution

### Tool transport and workspace readiness

Use the host's connected OpenMotion MCP tools for project creation, reads, saves, previews, export requests and status checks. A shell HTTP request carrying the same tool name reaches shared business code but is not a host MCP tool invocation; report that distinction and its reason explicitly when a development fallback is necessary.

Before opening a project for an Agent workflow, call `openmotion_get_project` through that connection and verify its `dataDirectory`, project/session identity and current version. Create new work through `openmotion_create_project`, then save and open the returned project through MCP. A browser URL or a matching project ID alone does not bind the connection to that workspace. A repository-only UI fixture can remain isolated, but must be identified as such; exporting it through MCP requires a matching connection or an explicitly scoped project import/copy, not an implicit data-directory change.

Existing phase-one MCP connections automatically reuse a compatible backend after plugin updates, keeping the same workspace and running exports. Version/build differences alone do not require reconnecting: the backend must advertise the same phase-one API protocol and the requested Tool. For `EDITOR_RUNTIME_INCOMPATIBLE`, compare the expected/actual identity and update the incompatible components together when idle; internal legacy connections may also return `MCP_RUNTIME_RELOAD_REQUIRED`. A transport already closed by the host requires host reconnection. Do not stop a compatible backend or silently substitute shell/HTTP exports for failed MCP calls. Preserve existing projects and completed jobs, and query an applicable export before creating another.

When OpenMotion tools are missing or a connection fails:

1. Read the selected host's server status and startup output. An empty tool search does not distinguish an unregistered server, a disabled connection, startup failure or discovery still in progress. Keep the actual error; do not infer the cause from a browser URL or a running backend.
2. For an npm installation, read `runtimeRoot`, `installHome` and `host` from the installed Skill's `openmotion-install.json` or `scope.json`. Run `node <runtimeRoot>/scripts/npm-installer.mjs diagnose --host <host> --home <installHome>` with argument-safe paths; preserve the selected profile and CLI overrides where needed. It checks that host's owned configuration, initializes an independent MCP process, checks the installed tool list and reads the expected data directory. It does not verify or reconnect the current chat. For a source/plugin installation without `installHome`, inspect the host's actual registered command and output; do not guess an npm home or run setup over an unrelated installation.
3. For an npm installation with permitted shell access, use the returned `directAccess` commands to continue in this chat before requesting a host handoff. A successful direct call proves installed access only; do not claim native host reconnection. If direct access is unavailable or fails, correct the reported cause before retrying. Missing runtimes, invalid paths, disabled servers and incompatible versions need their specific fix. Use the host's supported refresh/reconnect action; in Claude Code's interactive session use the server's Reconnect action in `/mcp`. If the host exposes no recovery capability, give that concrete user action. Do not claim to reconnect by starting a separate shell process or repeatedly reinstalling. Allow one safe read retry after a transient failure or completed recovery; if it still fails, report the error and recovery action rather than looping.
4. Through the recovered host MCP connection, call `openmotion_get_project`, confirm its data directory and the original project's identity/current version, then resume this task. A passed independent probe is not host recovery. Query existing jobs and preserve request IDs before deciding whether a mutation needs retrying; never create replacement work to hide a connection failure.

If only an independent folder can be produced, state that the editable Studio handoff is unavailable. Continue that delivery only within the user's accepted scope; do not report the project as open or directly editable in Studio without observing it.

1. Reuse complete guidance already read. Installed Skills and MCP resources/read provide the same documents; production start only routes a task that lacks a specialist. Changes to existing content use [edit workflow](edit.md). Missing instructions/source reads return to the model before dependent writes.
2. Reuse the target projectId or explicitly create a new one. Read its current revision and content version. No global most-recent project fallback. Five is a list page size, not a retention policy.
3. Use returned asset paths and native HTML/CSS/JS. Import and file save are separate operations. Images/footage/music generation belongs to the host's available tools or Studio; no generation Tool is exposed by this phase-one MCP package. Missing media capabilities must be stated.
4. Follow the [native loop](native.md), preserve locked content and existing Studio manifests. Inspect actual frames, motion and sound. A saved source file or successful lint is not creative acceptance.
5. Export only when requested. Reuse an applicable job before submitting another. Save a stable requestId per action: exact retry returns the original outcome; changed input with the same requestId is rejected. Failed request correction uses a new requestId.
6. Poll the named job through project details. Only completed exposes its real MP4 and technical verification. Inspect [final playback and evidence](verification.md) separately; record unavailable checks as not_run.

## Handoff

Preserve index.html, referenced compositions/media/scripts, hyperframes.json and native Studio manifests. A copied folder is a handoff artifact, not proof it is active. Never edit projects.json, workspace.json or export.json to simulate project selection or task completion. Documents/evidence belong outside the live project. Do not publish or upload as an incidental step.
