# Development, verification and recovery

## Environment and builds

Use Node24 and pnpm11.13.0 inside an owned topic worktree. Internal dependencies are local workspaces; no private registry token is needed. Linux needs `ps` (`procps` on Debian); containers need init (`--init` or the corresponding workflow/container option).

```sh
pnpm install --frozen-lockfile
PLAYWRIGHT_BROWSERS_PATH=0 pnpm --filter @open-motion/web exec playwright install chromium
pnpm build
pnpm test
pnpm lint
pnpm exec biome check .
pnpm exec odsuite guard
```

CI uses `pnpm install --frozen-lockfile --store-dir node_modules/.pnpm-store`, with no extra root-cache exemption. Run all modules serially using `pnpm -r --workspace-concurrency=1 --if-present run test`. Process/network/persistence tests need explicit, justified finite budgets; do not change production timing or GC for CI. The workspace pins `enableGlobalVirtualStore: false` and `verifyDepsBeforeRun: error`: CI, interactive commands and SDK subprocesses use the same dependency policy without inheriting the full host environment. A stale installation fails with an instruction to install explicitly; runtime/debug commands never repair dependencies implicitly. Installation has no build or hook. There are no root dev/check/typecheck shortcuts; use module-standard commands for focused iteration and Biome for formatting.

Chromium is pinned by Playwright and installed inside this worktree's node_modules, not borrowed from another checkout/system browser. Linux CI uses `install --with-deps chromium`. Full tests include browser cases; focus them with:

```sh
pnpm --filter @open-motion/web exec vitest run -c vitest.config.ts tests/browser/studio.test.ts
pnpm --filter @open-motion/standalone test
```

Installed-kit continuity is covered by `packages/application/tests/journey.test.ts`: actual npm installation, installed MCP creation, managed standalone Web edits/history, stale-revision refusal and cold reconnect. Run it through the application module's standard test command with Playwright installed as above. With `OPEN_MOTION_NATIVE_MANIFEST`, the same journey also verifies a Web-submitted native film and its unchanged bytes after restart. Without that manifest, native execution is explicitly unqualified. MCP SDK coverage is separate from a real model-backed Codex host session.

Web browser fixtures use actual built Web, SQLite and Daemon HTTP hosted in the test process. Standalone tests exercise an independent sidecar-owned Daemon. Services/ports/data belong to sidecar; Chromium is test-driver infrastructure closed in finally. Check actual manager closure and zero workloads. Evidence goes to `.artifacts/browser/<uuid>` or `.artifacts/animation-browser/<uuid>`; failures preserve screenshots/diagnostics. Fixed reference tokens, pixel round-trips, actual editing, platform and full product acceptance are separate. Never upload capabilities or raw communication traces.

## Explicit Prism template configuration

Remote templates are opt-in. Development reads only this explicit `odsuite.yaml` section; programmatic standalone composition accepts the same object as `Options.prism`:

```yaml
templates:
  prism:
    origin: https://r.open-design.ai
    environment: prod
    resourceId: 1500c9af-186b-457f-b74d-a58113f657d8
    channel: default
    locale: zh-CN
```

The publication channel is independent of the product release channel. Origins require HTTPS, or an explicit loopback HTTP origin for local acceptance; redirects and cross-origin file URLs are rejected. No configuration means no remote request. `template_list` always retains bundled ready templates. Configured first-fetch failure returns observable `catalogError`; verified cached publications instead report `catalog.stale` and `warning`. Remote `catalog.entries` are discovery claims: source-required entries can be read/created by their exact id/contentHash, and unsupported entries carry a reason. Dimensions and duration appear only on verified ready descriptors.

The current adapter accepts complete UTF-8 native text snapshots with index.html and supported hyperframes.json, at most 128 files / 4 MiB and 1 MiB per source file including provenance bounds. It rejects missing/remote native dependencies, unknown embedded engines and unsupported binary/media file formats. It does not transform arbitrary video/font/image files into supported resources. Publication metadata is at most 4 MiB / 1024 selected-locale entries; at most 32 ready source projections stay referenced. Original source edits remain independent workspace data.

The templates host drains network work and actual read acknowledgements on manager shutdown. For explicit host closure inside an existing factory lifecycle session, drain dependent acquisition controllers by awaiting the returned host's `quiesce()` outside that session first, as required by the Context lifecycle contract. Unknown readers or invalid acknowledgements must retain their blob Uses; never clear a ledger to force GC. The in-process onPrismRead diagnostic checkpoint is not serialized or exposed through configuration, environment variables, HTTP or MCP.

## Seeded native render acceptance

After explicit build, the render module can exercise its actual worker/Chromium/FFmpeg/FFprobe path with a trusted local seed manifest:

```sh
OPEN_MOTION_NATIVE_MANIFEST=/absolute/owned/native-manifest.json pnpm --filter @open-motion/render test
```

The manifest has exactly `browser`, `ffmpeg`, `ffprobe` entries, each containing `path` (absolute or relative to the manifest directory), `executable` (inside the materialized ZIP) and a platform/arch-bound blob `resource` descriptor. Trust both the compressed artifact digest/size and expanded tree digest/byte count from the publisher; deriving a tree digest from an untrusted download is not verification. The current local native pin is Chromium156 / FFmpeg9.0.2 on macOS arm64. Puppeteer install scripts remain disabled, and the product never discovers a system binary through PATH. These seeds are test inputs, not a published toolchain feed.

Set `OPEN_MOTION_RENDER_EVIDENCE` to an owned `.artifacts` JSON path to retain result digests, decoded frame/seek facts, process occupancy, GC and final manager state. The test covers silent/AAC films, edit-after-freeze and historical source reopen, real capture cancellation/retry and tool GC without deleting exports. Without the explicit seed manifest, this native case is skipped; source CI does not thereby qualify native rendering on its platform. The same explicit seed manifest enables the native Web and relocated Codex export tests:

```sh
OPEN_MOTION_NATIVE_MANIFEST=/absolute/owned/native-manifest.json PLAYWRIGHT_BROWSERS_PATH=0 pnpm --filter @open-motion/standalone test
OPEN_MOTION_NATIVE_MANIFEST=/absolute/owned/native-manifest.json pnpm --filter @open-motion/codexplugin test
```

Web checks real submission, lost-response retry, cancellation/retry against frozen source, MP4 download and carrier restart. Codex copies its built closure outside repository ancestry, uses the stock MCP client and verifies actual film bytes and `resource_link`; no adjacent runtime or node_modules supplies its worker. Source CI separately covers queued/interrupted intent, ownership, pagination and ready-stage explicit dead-owner recovery. These are bounded native/macOS arm64 qualifications, not all-carrier or power-loss acceptance.

## Unified local development

After explicit install/build, use only the repository-local CLI:

```sh
pnpm exec odsuite dev start --carrier=standalone --channel=dev --namespace=default
pnpm exec odsuite dev status --channel=dev --namespace=default
pnpm exec odsuite dev restart --carrier=standalone --channel=dev --namespace=default
pnpm exec odsuite dev stop --channel=dev --namespace=default
```

Start reports the actual URL and watches source by default. Use `--watch=false` for finite acceptance. A rebuilt artifact does not replace an existing process; restart explicitly. The manager root is `.state/dev/<channel>/<namespace>`, derived/owned by sidecar. Status/stop query its authority even if current configuration is invalid. Do not copy this directory to another checkout or create another PID/port registry.

Codex development starts the composition, then attaches MCP stdio:

```sh
pnpm exec odsuite dev start --carrier=codexplugin --channel=dev --namespace=default
pnpm exec odsuite dev connect --carrier=codexplugin --channel=dev --namespace=default
```

Connect stdout is JSON-RPC only. Client EOF closes the attachment, not the development manager. Reconnect after manager replacement; an old Peer cannot take over another incarnation. A host can invoke pnpm from the worktree with those arguments, without a global binary or modifying everyday host configuration.

Guard checks directory/file compliance, with exit 0 clean, 1 findings and 2 operational error. It does not prove runtime behavior. Configuration errors reject without alternate-file/env fallbacks.

## Shared-version local carrier artifacts

The finite `pipeline.carriers` mapping selects the standalone and Codex built closure directories. Both consume the same selected build version without rewriting source configuration. Source quality gates require the same clean Git commit and matching compiled carrier outputs before and after execution; failed or missing build evidence cannot retain an earlier passing gate:

```sh
pnpm exec odsuite build --channel stable
pnpm exec odsuite pack --channel stable
pnpm exec odsuite check --channel stable --gate artifacts
```

Use `--channel beta --number 1` for a prerelease identity. Outputs and receipts live under `.artifacts/distribution/<channel>`; builds fingerprint both closures and packaging verifies exact bytes. A `.bundle` is a local verified content archive, not a runnable npm package. No setup/prepare, host registration, npm publication or channel-tag change is performed by these commands. Quality gates remain separate invocations. Old Electron-specific release, native platform packaging, desktop gates and the development headless option have no aliases.

Acceptance uses real product scenarios in testkit and carrier tests. Independent closure execution, actual Codex host loading, model/creative execution, native platform rendering, installation and publication each require their own evidence. Historical Electron qualification matrices do not apply to the current carriers.

## Resources and recovery

`odsuite.yaml` defines product/channel/namespace and explicit serve sources. Sidecar grants persistent data, runtime directories, sockets, ports, logs and locks; content and installation paths have separate owners. Directory/port existence is not identity or liveness proof.

Stop first drains calls, background controllers, documents/streams and actual processes, then releases Uses/resources. Preserve protection on unknown consumers, failed stop or remaining references. User data is not blob-GC input.

After interruption/SIGKILL, inspect and explicitly recover the whole root before binding replay:

```sh
pnpm exec odsuite recover inspect --data /path/to/root
pnpm exec odsuite recover apply --data /path/to/root --expected <fingerprint>
```

The CLI validates actual contracts. Recovery rejects live owners, changed plans, replaced endpoints and uncertainty; never delete authority/registry/ledger or take over a live manager. Preserve failed layouts and evidence. Metadata history and installation policy/transactions/backups/executors are retained independently of content GC. Normal stop/installation confirmation does not authorize deletion. Node installation has its own durable journal and immutable closures; product runtime data is separate.

Node-carrier startup explicitly selects its root, channel and namespace. Carriers inject private Daemon connections and environment facts; Web receives an in-memory bootstrap. Do not set paths/ports manually to evade sidecar, log capabilities or forward runtime tokens through installers. Product engine children disable telemetry with `HYPERFRAMES_NO_TELEMETRY=1`.

The retained runtime/distribution suites' shell-specific bootstrap variables and observer tests are not current product startup contracts. Background qualification must not focus the desktop or open a browser without instruction.

## Local npm installation

Build/package the shared kit through the repository tool:

```sh
pnpm exec odsuite build --channel beta --version 0.6.1-beta.1
pnpm exec odsuite pack --channel beta
```

Use the returned `npm.path` tarball with `npm exec --yes --ignore-scripts --package /absolute/application.tgz -- odsuite`. No registry publication or global bin is needed. The installed kit exposes:

```text
odsuite setup --carrier standalone|codexplugin --home INSTALLATION --data DATA_BASE
odsuite start|restart|stop|status|prepare --home INSTALLATION --data DATA_BASE --channel beta --namespace default
odsuite recover inspect --root EXACT_AUTHORITY_ROOT
odsuite recover apply --root EXACT_AUTHORITY_ROOT --expected FINGERPRINT
```

For the shortest clean setup/start path, use [the README](../README.md#try-a-local-installation). Pin a candidate tarball by its recorded source/version/SHA before testing; do not substitute a moving registry tag. Set an explicit npm `--cache` outside `--home`: a cache created inside an unclaimed installation home makes ownership ambiguous and setup refuses it. Keep installation, runtime data, host profile and Skills paths explicit. The returned `result.root` is the exact runtime authority root and `result.runtime.web` is the current URL; commands never open it automatically.

Installed `restart` validates release admission and the selected receipt before stopping anything, rejects unfinished update/GC transactions, then drains only the observed stamped Manager and records the replacement's actual Use while holding installation authority. Stop failure preserves authority and prevents replacement. A later launch failure leaves a stopped root for an explicit retry; it does not roll back code or delete data. Existing MCP transports must reconnect. `start` is idempotent for an already matching runtime; it is not an update/transaction recovery operation. Codex attachments reuse standalone, while a self-hosted stdio runtime must retire by closing that connection before operator stop/restart or activation.

| Observation                                        | Next action                                                                                                                                            |
| -------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `runtime_release_mismatch`                         | Use the matching kit, or drain through the actual owner's entry before explicitly activating another version. Do not take over.                        |
| Unfinished update or collection                    | Resume the original request through `update` or `gc`; inspect its status and preserve the journal.                                                     |
| Interrupted runtime authority                      | Inspect the exact `result.root` with installed `recover inspect --root`; apply only the returned fingerprint after actual dead-owner proof.            |
| Interrupted installation authority                 | Inspect `<INSTALLATION>/authority/io.openmotion.app` separately, recover only proven dead ownership, then retry the identical intent.                  |
| Self-hosted Codex runtime                          | Close its stdio session, wait for drain, then start a managed instance if desired.                                                                     |
| `installation_conflict` / `installation_integrity` | Check the selected owned home and preserved diagnostics. Never empty a nonempty home or delete authority to bypass refusal.                            |
| Codex write approval refused                       | Keep tool annotations and host policy intact; use the host's normal approval flow in the selected profile. Refusal before dispatch changes no project. |

The package channel must match `--channel`; namespace defaults to its product metadata. Setup installs both carriers at one version. Codex setup also accepts explicit `--profile`, `--skills` and `--codex`. Profile selects `CODEX_HOME` (default existing environment selection or `~/.codex`); Skills must use supported home/workspace `.agents/skills` discovery. Their existing home/workspace parent is required. Use isolated profiles/workspaces for verification. No invented scan setting or daily-profile writes are part of acceptance.

For isolated real-host validation, launch Codex with the same `CODEX_HOME` and workspace used during registration. Ensure the selected Skills parent exists and is discoverable through supported home/workspace `.agents/skills` paths. An unattended read-only host can allow discovery and refuse `project_save` before Daemon dispatch. Where supported, `codex exec --approve-for-me` uses the host's automatic approval review; it is not a promise that every request will be accepted. Preserve the user's policy, inspect actual tool results and keep real model-backed evidence distinct from SDK transport tests. Never copy an authentication file into delivery artifacts or modify the daily profile for acceptance.

Installation defaults to `~/.local/share/open-motion`. Its authority is `authority/<product>`, immutable applications are `applications/<product>/<channel>/<namespace>/versions/<carrier>/<version>/<digest>`, and the default data base is `data`. Sidecar derives actual runtime root `<DATA_BASE>/<channel>/<namespace>`. The carrier is not another resource-factory dimension. Installer-granted SQLite intents/receipts and registration ownership manifests stay separate from runtime user data; do not copy/reset/delete them. Setup alone does not create runtime data. Preserve earlier committed steps after a later failure and retry the identical intent; interrupted authority requires explicit recovery first.

Installed journal format 3 includes actual code-consumer facts. Managed standalone/preparation startup records its exact Manager before releasing installation authority. Managed Codex transports additionally carry `OPEN_MOTION_INSTALLATION_HOME`, `OPEN_MOTION_INSTALLATION_PRODUCT` and `OPEN_MOTION_INSTALLATION_REQUEST`; these form one complete binding, not a discovery fallback or another control-plane inventory. The base product is supplied explicitly; it is not inferred from the channel-derived application ID. The installed stdio entry verifies the selected receipt/path/data/carrier before attaching or self-hosting. Raw unpacked carrier invocations are caller-owned and do not qualify installed-version GC.

`Session.uses()` is an internal installer observation: alive/retired comes from current sidecar PID/birth observation, never root phase or elapsed time. Use records remain as history and cannot be released while their process still exists. A closed installer owner can therefore have live consumer references. Unsupported/failed OS observation fails closed. Formats 1 and 2 installation journals reject without migration or deletion; use an explicitly new owned home/namespace for experimental qualification. An entry-process observation is not whole-tree retirement proof; runtime factories and stamped descendants must still drain/recover through sidecar before collection. Explicit code collection is available through the installed kit as described below.

For explicit installed-code GC, first stop the runtime through its owner and close obsolete stdio sessions. Use the currently selected kit:

```text
odsuite gc plan --home INSTALLATION --data DATA_BASE --channel beta --namespace default
odsuite gc apply --request-id UUID --expected FINGERPRINT --home INSTALLATION --data DATA_BASE --channel beta --namespace default
odsuite gc status --request-id UUID --home INSTALLATION --data DATA_BASE --channel beta --namespace default
```

`plan` returns a fingerprint and per-closure protection reasons. `apply` needs a new UUID and that exact fingerprint; it collects only entries without protection. Current selections, unselected preparations, incomplete installs, verified owned Codex references and actual live consumers survive. Both commands verify the actual owned host configuration using Codex (`--codex FILE` selects the executable). Changed host policy or unfinished registration must reconcile first. A still-live old stdio protects its code even after the runtime stopped. Active/interrupted runtime roots refuse collection; runtime recovery is separate from installation recovery. Planning deletes nothing. File timestamps and age never establish eligibility.

Apply durably marks targets retiring before deletion. An interrupted collection fences installation/staging/selection/consumption, updates and new runtime launch. Inspect `gc status` and repeat the same UUID/fingerprint after explicit sidecar recovery if needed. Do not replace that request with a new plan or erase journals. Every remaining file must match the retained manifest; unknown entries, links and changed bytes stop progress and preserve diagnostics. Completed request replay retains its original result. Retired receipts fail explicitly rather than silently reinstalling or rewinding; their manifests/history remain. Only immutable closure bytes are collected, leaving version-parent directories, staging attempts, npx caches, Blob content and all user projects/media/history/exports untouched. There is no background collector, migration, retention timer or automatic rollback.

For interrupted setup, inspect the exact installation authority `<INSTALLATION>/authority/io.openmotion.app` through the installed kit's `recover` entry. A live owner must refuse recovery. After sidecar proves retirement and returns a ready plan, apply that plan's exact fingerprint, then repeat setup with the same kit, home, data, channel, namespace and host-registration destinations. Recovering runtime data does not recover the separate installation authority. The installed-kit tests kill the actual installer at intent, materialization, installed-directory and selection checkpoints, then replay the original setup request through npm after explicit recovery. They do not establish arbitrary power-loss durability or every host-registration interruption window.

The finite npm payload contains `dist/main.mjs`, transient `dist/codex-worker.mjs`, licenses/notices and `payload/manifest.json` plus both carrier archives. The registrar pins Node and the immutable installed main, never npm cache. Normal cache eviction therefore cannot remove the installed runtime or Skills. Modified/unowned destinations, conflicting versions and changed host ownership fail closed. These commands do not implement automatic Node updates or registry distribution.

The repository can project candidate metadata from the exact verified package with `pnpm exec odsuite candidate --channel beta --revision 1`. The result contains the immutable npm artifact digest/size, shared product version and build provenance. A publisher signs it through distribution's shared `signHead` primitive. Serving a local test feed does not authorize production publication. The feed layout is:

```text
products/<product>/kits/channels/<channel>/head.json
products/<product>/kits/releases/v<version>/metadata.json
products/<product>/objects/sha256/<npm-digest>
```

The installed kit exposes candidate controls through the same npm entry:

```text
odsuite update check --endpoint HTTPS_OR_LOOPBACK --public-key PUBLIC_PEM --home INSTALLATION --data DATA_BASE --channel beta --namespace default
odsuite update prepare --endpoint HTTPS_OR_LOOPBACK --public-key PUBLIC_PEM --home INSTALLATION --data DATA_BASE --channel beta --namespace default
odsuite update discard --home INSTALLATION --data DATA_BASE --channel beta --namespace default
```

Check downloads signed metadata only. Prepare requires a newer version and verifies the entire inert npm package and both carrier closures through the installed validation contract. A prepared Blob reference persists across CLI-owner restarts until another verified candidate replaces it or discard releases it. Failed preparation preserves the previous reference; ordinary signals cancel downloads and drain the exact installer owner. Discard releases cache protection for normal GC rather than deleting files or discovery history. Unavailable feeds fail; persisted catalog history remains for regression checks. Endpoint redirects, credentials/query fragments, wrong signatures/product/channel, downgraded versions, same-version replacement and regressed/conflicting revisions reject. Use the exact installed invoking kit; these commands change no installation selection, host registration or running runtime. Activation remains a separate lifecycle.

Activate the exact locally prepared kit through the original invoking package, preserving a request UUID:

```text
odsuite update activate --request-id UUID --public-key PUBLIC_PEM [--codex CODEX_EXECUTABLE] --home INSTALLATION --data DATA_BASE --channel beta --namespace default
odsuite update status [--request-id UUID] --home INSTALLATION --data DATA_BASE --channel beta --namespace default
```

Activation uses the retained per-artifact signed receipt and verified Blob bytes without contacting the feed. Both immutable carriers stage first; their selection changes in one compare-and-swap transaction. Existing owned Codex destinations are discovered from the registrar; activation does not enroll a new profile. Preflight rejects changed/disabled configuration or edited Skills before stopping the original stamped standalone Manager. A self-hosted Codex connection must detach first. Existing host transports require reconnecting after handoff. A stopped runtime stays stopped; an originally running standalone is restarted from the selected target receipt.

The installer transition journal stores exact intent and actual progress before each effect. The phase sequence is staging, staged, stopped, selected, registered, starting and running. If a later action fails, earlier committed effects remain: in particular, selected can mean both target receipts are committed while registration/startup still needs reconciliation. Repeat the same original package, request UUID, public key, scope and Codex executable. Do not substitute a new request to bypass an unfinished one. Setup, candidate changes and competing selections refuse until it completes. Intent status can show the pending request/caller version or a particular completed receipt; it does not replace sidecar runtime health.

After SIGKILL, inspect/apply explicit recovery for the exact interrupted installer authority before retry. A runtime that was separately interrupted needs its own recovery. Never erase journals or claim an uncertain owner died. Registration retries reconcile only the same pending target. If another runtime owner or host policy changed, preserve that state and resolve it explicitly. The prepared candidate has both cache protection and a durable signed receipt; a recovery reference protects an unfinished activation. Completion releases those cache references and retains intent/registration history. Completed request replay does not revert later installations. No compatibility migration, automatic rollback, feed polling or production publication is implied.

`prepare` verifies/materializes the pinned Chromium/FFmpeg/FFprobe through the real renderer Blob library. It reports each component; a successful attempt is warm-cache evidence, not an execution probe or permanent pin. An absent runtime uses a preparation-only sidecar composition with no Web/Daemon/export queue, so existing queued exports cannot resume. SIGINT/SIGTERM cancel its wait and drain only its own exact managed witness, including cancellation during manager bootstrap. An existing matching full runtime stays running. Blob retains normal GC/retention; actual export independently acquires worker Uses. The default native pin is macOS arm64; unsupported native platforms are not qualified.

## Codex closure

After build, `carriers/codexplugin/dist/runtime` is the movable Node24 closure. Installation/development helper entries stay outside that payload. Both installed carrier entries use their baked release identity; neither accepts a version override. Runtime environment selects exactly:

| Variable              | Responsibility                                               |
| --------------------- | ------------------------------------------------------------ |
| OPEN_MOTION_ROOT      | Absolute manager data root outside the installed application |
| OPEN_MOTION_CHANNEL   | Product distribution channel                                 |
| OPEN_MOTION_NAMESPACE | Isolated resource domain within that channel                 |

Stdout is MCP JSON-RPC and stderr is diagnostics. Installed MCP and the application CLI compare complete release manifests before querying Daemon health or requesting delegation. `runtime_release_mismatch` reports the requested and running releases, carrier, channel, namespace, manager and hosted instance. The CLI returns it in its JSON error envelope. Installed MCP writes the diagnostic to stderr and exits. Use a matching release or explicitly stop the current runtime through its owner before starting another release. Disconnecting an attached MCP client preserves the separately owned runtime. Absent/closed authority may self-host; its EOF drains its owned composition. Unready, mismatched or interrupted authority rejects without takeover. Runtime status reports real health/URL, not proof a host panel opened. Installation, stdio handshake, browser behavior, provider calls and creative acceptance have independent evidence. Socket probing may use a shorter canonical-equivalent system-temp spelling only after verifying the same object; connection failure never proves death.

## Workspace editing and preview

Daemon exposes granted sockets/forwarded ports only. GET /health and POST /api/<operation> require the runtime Bearer capability; fixed composition origin controls browser CORS/OPTIONS. Daemon combines workspace, export and template schemas in `apps/daemon/src/contract.ts`; browser client and MCP use the same rules. No default-project aliases or parallel state endpoint exist.

`workspace.sqlite` is persistent hosted data, containing immutable source snapshots and command receipts. It is neither a working-copy directory nor GC content. Read current state explicitly; replaying requestId returns its original receipt. Save conflicts/unknown outcomes preserve drafts/context; retry confirms the same command. Explicit discard is a user action.

Creation and entry are independent idempotent operations; retrying failed entry never creates another object. Native fields and source save before context switches/preview. Film playback is actual Hyperframes runtime behavior. Timing accepts finite nonnegative starts and positive durations. Appearance and numeric keyframe fields share project revision/history. Explicit conversion/separation requires fidelity, and dynamic/unproven scripts stay read-only. Diamonds support real seek/retiming; wait for fresh model projection and confirmed preview, not merely an old SVG or ready label.

Canvas selection reads actual preview geometry. 2D movement commits on release through the same transaction; Escape cancels. Pending edits/unsupported transforms reject movement. No temporary Web styles are injected.

Preview open/close require capability and caller view ID; open verifies session/artifact/expectedRevision. Read-only snapshot URLs do not carry write authority, but reveal that view's content and should not enter shared logs. Page teardown/close revokes URLs; carrier close clears all ephemeral views. Unknown closure retains bounded state and can retry by ID, never by deleting user data. Full view capacity rejects explicitly.

Web checks workspace metadata serially every 1.5 seconds while initialized and idle. Connection status reports temporary read failures without clearing the held project or drafts. Same-project changes refresh clean views automatically. With drafts, use **准备本地属性草稿** when needed, choose each conflicting file, then **合并到本地草稿**; explicitly save the result. File deletion versus local editing is also a conflict. **放弃本地草稿并同步** reads a fresh coherent view before discarding. Remote context switches offer **返回本地工程并保留草稿**, which performs a checked selection operation; it is not an automatic takeover. Resolve an unconfirmed write by retrying its original operation first. A disconnected view resumes observation when the same endpoint returns. After installed restart, reconnect to the returned endpoint/bootstrap; unsaved in-memory drafts do not survive reload or process replacement.

Differentiate failed save from failed preview. A confirmed old preview may remain beside a draft; it must not cross artifact ownership. Validate actual iframe text/paint/timing, play/seek, edit/reopen/reload, failure retention, old URL revocation and restart persistence. Build-injected pinned engines need no CDN. History requires content revision plus monotonic history version; schema 3 rejects old experiments without migrating or deleting them. Use fresh namespaces for verification; user-data import is separate work.

## Built-in templates and Agent guidance

After selecting a creative session, expand New Project and From Template in Web. Choose Product Promo, NYT Graph or Decision Tree and optionally a project title. Creation saves the current source first, creates an independent artifact and then enters it through a separately checked selection operation. A lost response uses Retry to confirm the same request; it must not generate another project. The previous project and its history remain intact. Web observes Agent changes automatically while preserving local drafts.

HTTP/MCP share `template_list`, `template_read` (id/contentHash) and `template_create` (id/contentHash/sessionId/title/requestId). The returned manifest includes exact source identity, file sizes/digests and licensing/adaptation facts. Read source before adapting it; preserve supporting files, fonts and licenses in complete project_save snapshots. Template versions are immutable content identities, not independent carrier release versions. Unknown identities reject. Current built-ins preserve 1920×1080 dimensions and 20/15/10-second authored durations. Their original Latin fonts are offline source content with OFL notices; this does not qualify international typography or other media formats.

MCP resources/list exposes the finite `open-motion://guidance/` document graph. Five creative intent routes and their complete shared/quality references return versioned full bodies with documentId/contentHash/references and source lineage. Codex local Skills derive from the same bodies with canonical/local hashes and closed relative links. Reuse bodies actually retained in context, and read missing guidance/target sources before a later dependent write. Authenticated GET /guidance and /guidance/<name> return the same catalog/body. Document reads do not start another server, edit a project or prove execution. Host acquisition/measurement/archive capabilities, binary Prism resource ingestion, provider execution and creative/user acceptance remain separate capabilities and evidence.

Codex dev connect obtains a delegated Daemon endpoint/capability through sidecar and then uses HTTP for source/media. The control plane transfers connection metadata rather than bulk project bytes. Closing an attachment retains the development manager; reconnect after manager replacement. Do not log the private delegated connection or introduce a second listener/port registry.

The standalone template browser test exercises real templates, offline fonts, native seek/paint, unknown accepted create responses, shared Agent/manual edits and restart. With OPEN_MOTION_NATIVE_MANIFEST set, it also renders/downloads an edited 1080p template film through the actual managed native worker. Without it, native codec execution remains unqualified. The Codex attachment test uses actual pnpm exec start/connect/status/stop and confirms source larger than the sidecar frame bound across disconnect/reconnect; the relocated stdio case reads guidance and creates all built-ins outside repository ancestry.

## Background film export

Standalone and Codex compose a hosted renderer on macOS arm64. Open the Web film-export disclosure after selecting an artifact; export saves confirmed source first and queues a 30fps film. Keep the same create/control request identity after an unknown response. Panel closure does not cancel accepted work. A development MCP attachment can disconnect while its runtime continues; self-hosted Codex EOF drains the owned runtime, retaining active intent as interrupted and queued intent for restart. A later source edit does not change its frozen input; retry uses that original revision. HTTP and MCP expose `export_create`, `export_list`, `export_read`, `export_cancel`, `export_retry` and `export_download` with the same explicit session/artifact ownership. Create takes an explicit revision and rational frame rate. List uses a maximum-16 cursor page; controls require the observed job version and a request UUID.

The renderer's granted persistent data contains `exports.sqlite` (journal format 1), content-addressed read-only `inbox` snapshots and verified `exports` films/receipts. Workspace's schema 3 source/history is unchanged. Download returns a ten-minute read-only capability URL, digest, size and filename; MCP returns a resource link. URLs are process-local and must not enter shared logs. After restart, request a new download for the retained completed job. Movies are streamed after digest/size verification, never embedded in MCP JSON or collected by blob GC.

Normal stop drains active work into interrupted state and retains queued work; restart runs queued intent, while interrupted jobs require explicit retry. Cancellation waits for actual worker retirement. After SIGKILL recover sidecar explicitly before reopening the composition. A `recovering` job blocks replacement until ownership is reconciled. The ready-stage witness path is tested; an interruption before the process ownership witness is committed can still reject recovery as unknown. Preserve that ledger and diagnostics; do not delete them, infer death or reset the root. Native generation/provider/template integration, unqualified platforms and broader interruption windows remain separate acceptance work.

## Distribution qualification

Pack compiles and verifies Node closures; pipeline builds/packages both carriers at one version. The retained runtime/distribution mechanisms still have shell-oriented contracts and are disconnected from product composition. Installer owns current immutable Node installation; automatic update activation remains separate. Tools own shared capabilities; workflows choose channel/quality policy.

Use explicit positive composition/manifests for actual artifacts. No registry, storage, release or service publication is configured or authorized by source CI. Signing, target-platform installation, network distribution, power loss and actual product acceptance remain independent. Node update qualification must cover version discovery/preparation, actual owner activation, compatibility rejection, data preservation and interruption recovery. Old minimum-shell/forced-update tests do not qualify a Node installation.

Silo uses a separate Compose project, loopback ports and retained volumes. Select its explicit endpoint and `ODSUITE_SILO_PORT` or a random allocated port. Compose credentials are only local isolated fixtures. Stop only that project and preserve volumes/failures; never `down -v` or reclaim another project's resources.

## Persistent media and isolated reviews

Workspace schema 3 stores canonical source revisions, resource manifests and verified persistent PNG/PCM16 WAV bytes in the Daemon's granted database. Older experimental schemas fail without migration/reset; use an explicit new development namespace for isolated review rather than deleting an existing root. There is no implicit old-root import. Resource removal changes current membership and remains undoable; stopping a carrier, closing a preview and blob GC do not delete user media/history.

Import bounds are 6 MiB per resource and 64 resources / 64 MiB per revision. Supported PNG is non-interlaced, at most 4096×4096; WAV is PCM16, mono/stereo, 8–96kHz. Web's media tab imports, inserts and removes these resources. Relative nested references are resolved from the finite snapshot manifest. Missing media retains the old confirmed preview and reports the failed candidate. Independent fixed-rate audio supports source in-points, authored rate0.1..10, volume0..1 and mute. Source in-point + duration × rate must fit verified source length; right trim is limited by remaining source length / rate. Changing in-point or authored rate preserves clip start/duration; coupled duration edits can shorten the window atomically. Authored rate is independent of preview transport speed. Verified manifest facts reject incorrect source-length hints before replacing the confirmed frame. Ramped rate, automation, effects, fades, alternate clock attributes, loop/autoplay and SDK-detected script-driven audio stay read-only. Select a static PNG/WAV layer and an aligned partner in the property panel to link them within the current source composition. Existing groups may add an unlinked aligned partner. Timeline movement/right trim affect the group; audio in-point/rate affect audio partners, with the shortest remaining source bounding trim. Gain/mute remain individual. Unlink clears the entire local group, preserving sync-origin; deleting a valid group removes its elements, with undo and persistent resource bytes retained. Invalid groups require explicit unlink before independent repair. Recognition is bounded by the pinned SDK, not arbitrary author-script analysis. Additional codecs require separate implementation and verification. Actual image decoding and media playback are technical checks, not listening or creative acceptance.

## PNG material tasks

Generation uses an explicitly injected Provider in standalone/Codex composition. No production provider adapter or credential storage is configured by default. `generation_status` lists exact configured identities; availability is not proof of model quality or a successful invocation. Tasks and candidates remain readable without an adapter.

Use a stable request UUID and complete fixed owner/revision/model/prompt intent for `generation_create`. After an unknown response retry only that intent; after a durable unknown submission do not issue an automatic replacement. Read/list report explicit submission certainty. Observe the known remote ID on restart without resubmitting it. Cancellation requires the observed task version and confirmation; an unconfirmed cancellation remains unresolved.

Read the exact verified PNG with `generation_result`; explicitly adopt its hash/path/name through `generation_adopt` against the intended project revision. Reuse the adoption request after an unknown response before fetching a candidate or changing the payload. Then insert the adopted resource through existing native editing. Durable candidates and adopted workspace bytes are user data, not blob GC inputs. Normal quiesce drains adapters and actual reads before stop; interrupted authority still needs explicit sidecar recovery. Loopback-provider protocol evidence and real paid model execution are separate acceptance boundaries.
