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

CI uses `pnpm install --frozen-lockfile --store-dir node_modules/.pnpm-store`, with no extra root-cache exemption. Run all modules serially using `pnpm -r --workspace-concurrency=1 --if-present run test`. Process/network/persistence tests need explicit, justified finite budgets; do not change production timing or GC for CI. Installation has no build or hook. There are no root dev/check/typecheck shortcuts; use module-standard commands for focused iteration and Biome for formatting.

Chromium is pinned by Playwright and installed inside this worktree's node_modules, not borrowed from another checkout/system browser. Linux CI uses `install --with-deps chromium`. Full tests include browser cases; focus them with:

```sh
pnpm --filter @open-motion/web exec vitest run -c vitest.config.ts tests/browser/studio.test.ts
pnpm --filter @open-motion/standalone test
```

Web browser fixtures use actual built Web, SQLite and Daemon HTTP hosted in the test process. Standalone tests exercise an independent sidecar-owned Daemon. Services/ports/data belong to sidecar; Chromium is test-driver infrastructure closed in finally. Check actual manager closure and zero workloads. Evidence goes to `.artifacts/browser/<uuid>` or `.artifacts/animation-browser/<uuid>`; failures preserve screenshots/diagnostics. Fixed reference tokens, pixel round-trips, actual editing, platform and full product acceptance are separate. Never upload capabilities or raw communication traces.

## Unified local development

After explicit install/build, use only the repository-local CLI:

```sh
pnpm exec odsuite dev start --carrier=standalone --channel=dev --namespace=default
pnpm exec odsuite dev status --channel=dev --namespace=default
pnpm exec odsuite dev restart --carrier=standalone --channel=dev --namespace=default
pnpm exec odsuite dev stop --channel=dev --namespace=default
```

Start reports the actual URL and watches source by default. Use `--watch=false` for finite acceptance. A rebuilt artifact does not replace an existing process; restart explicitly. The manager root is `.state/dev/<channel>/<namespace>`, derived/owned by sidecar. Status/stop query its authority even if current configuration is invalid. Do not copy this directory to another checkout or create another PID/port registry.

Electron uses the same commands with `--carrier=electron`; `--headless` selects automated host behavior. Docker is a placeholder and rejects start/restart rather than inventing readiness. Codex development starts the composition, then attaches MCP stdio:

```sh
pnpm exec odsuite dev start --carrier=codexplugin --channel=dev --namespace=default
pnpm exec odsuite dev connect --carrier=codexplugin --channel=dev --namespace=default
```

Connect stdout is JSON-RPC only. Client EOF closes the attachment, not the development manager. Reconnect after manager replacement; an old Peer cannot take over another incarnation. A host can invoke pnpm from the worktree with those arguments, without a global binary or modifying everyday host configuration.

Guard checks directory/file compliance, with exit 0 clean, 1 findings and 2 operational error. It does not prove runtime behavior. Configuration errors reject without alternate-file/env fallbacks. Reference qualification is independent:

```sh
pnpm exec odsuite guard --root /path/to/repo --json
node --input-type=module -e 'import {run} from "@odsuite/testkit"; const r=await run({root:process.cwd(),output:".artifacts/qualification.json",packaged:false}); if(r.result==="failed")process.exitCode=1;'
```

Testkit distinguishes passed/failed/unqualified and never substitutes for product acceptance. Electron is a reference carrier, Docker a skeleton, standalone/Codex carry the actual session/source workspace. Advanced animation, unresolved/nonlinear composition clocks, broader media/audio editing, additional codecs, layout preferences, generation and export are not fully connected.

## Resources and recovery

`odsuite.yaml` defines product/channel/namespace/carrier ABI and explicit serve sources. Sidecar grants persistent data, runtime directories, sockets, ports, logs and locks; content and installation paths have separate owners. Directory/port existence is not identity or liveness proof.

Stop first drains calls, background controllers, documents/streams and actual processes, then releases Uses/resources. Preserve protection on unknown consumers, failed stop or remaining references. User data is not blob-GC input.

After interruption/SIGKILL, inspect and explicitly recover the whole root before binding replay:

```sh
pnpm exec odsuite recover inspect --data /path/to/root
pnpm exec odsuite recover apply --data /path/to/root --expected <fingerprint>
```

The CLI validates actual contracts. Recovery rejects live owners, changed plans, replaced endpoints and uncertainty; never delete authority/registry/ledger or take over a live manager. Preserve failed layouts and evidence. Metadata history and installation policy/transactions/backups/executors are retained independently of content GC. Normal stop/installation confirmation does not authorize deletion. Physical installer support is currently macOS.

Product bootstrap variables are `ODSUITE_RUNTIME_*` (DATA, ORIGIN, SOCKET, TOKEN, GENERATION, NONCE, LIFELINE and explicit environment contracts); tools use `ODSUITE_*`. Owners inject them. Do not set paths/ports manually to evade sidecar. Do not log capabilities or forward runtime tokens through installers. Product engine children disable telemetry with `HYPERFRAMES_NO_TELEMETRY=1`. Web's explicit host bridge is `openMotion`.

GUI/package/native observer checks require the corresponding `ODSUITE_RUNTIME_GUI`, `ODSUITE_RUNTIME_PACKAGE`, `ODSUITE_RUNTIME_NATIVE` opt-ins. Ordinary source checks do not enable them. Automated Electron initializes accessory behavior before ready and stays hidden/non-focusable; never switch the user's desktop for qualification.

## Codex closure

After build, `carriers/codexplugin/dist` is a movable local Node24 closure with one plugin manifest/MCP descriptor, main, Web and Daemon. Host PLUGIN_ROOT locates its entry; use explicit external resource identity:

| Variable              | Responsibility                                              |
| --------------------- | ----------------------------------------------------------- |
| OPEN_MOTION_ROOT      | Absolute manager data root outside the plugin installation  |
| OPEN_MOTION_CHANNEL   | Product distribution channel                                |
| OPEN_MOTION_NAMESPACE | Isolated resource domain within that channel                |
| OPEN_MOTION_VERSION   | Optional full version; prerelease suffix must match channel |

Stdout is MCP JSON-RPC and stderr is diagnostics. Runtime status reports real health and URL, not proof that a host panel opened. Use separate test profiles, never daily host configuration/user data. Installation, stdio handshake, browser business behavior, provider calls and creative acceptance have independent evidence. Normal EOF retains data; interrupted authority needs explicit witness-based recovery rather than a reset. Socket probing may use a shorter canonical-equivalent system-temp spelling only after verifying the same object; connection failure never proves death.

## Workspace editing and preview

Daemon exposes granted sockets/forwarded ports only. GET /health and POST /api/<operation> require the runtime Bearer capability; fixed composition origin controls browser CORS/OPTIONS. Workspace schemas are in `packages/workspace/src/contract.ts`; browser client and MCP use the same rules. No default-project aliases or parallel state endpoint exist.

`workspace.sqlite` is persistent hosted data, containing immutable source snapshots and command receipts. It is neither a working-copy directory nor GC content. Read current state explicitly; replaying requestId returns its original receipt. Save conflicts/unknown outcomes preserve drafts/context; retry confirms the same command. Explicit discard is a user action.

Creation and entry are independent idempotent operations; retrying failed entry never creates another object. Native fields and source save before context switches/preview. Film playback is actual Hyperframes runtime behavior. Timing accepts finite nonnegative starts and positive durations. Appearance and numeric keyframe fields share project revision/history. Explicit conversion/separation requires fidelity, and dynamic/unproven scripts stay read-only. Diamonds support real seek/retiming; wait for fresh model projection and confirmed preview, not merely an old SVG or ready label.

Canvas selection reads actual preview geometry. 2D movement commits on release through the same transaction; Escape cancels. Pending edits/unsupported transforms reject movement. No temporary Web styles are injected.

Preview open/close require capability and caller view ID; open verifies session/artifact/expectedRevision. Read-only snapshot URLs do not carry write authority, but reveal that view's content and should not enter shared logs. Page teardown/close revokes URLs; carrier close clears all ephemeral views. Unknown closure retains bounded state and can retry by ID, never by deleting user data. Full view capacity rejects explicitly.

Differentiate failed save from failed preview. A confirmed old preview may remain beside a draft; it must not cross artifact ownership. Validate actual iframe text/paint/timing, play/seek, edit/reopen/reload, failure retention, old URL revocation and restart persistence. Build-injected pinned engines need no CDN. History requires content revision plus monotonic history version; schema2 rejects old experiments without migrating or deleting them. Use fresh namespaces for verification; user-data import is separate work.

## Distribution qualification

Pack is currently Electron-oriented; runtime still contains Electron composition assumptions and pipeline has host-specific publication adapters. Empty carriers are not supported deliveries. Tools own shared version/build/package capabilities; workflows choose channel/quality policy. All deliverable carriers share one product version.

Use explicit positive composition/manifests for actual artifacts. No registry, storage, release or service publication is configured or authorized by source CI. Signing, target-platform installation, network distribution, power loss and actual product acceptance remain independent. Update qualification covers discovery/preparation, actual owner activation, minimum-shell blocking, forced update, rollback and interruption recovery.

Silo uses a separate Compose project, loopback ports and retained volumes. Select its explicit endpoint and `ODSUITE_SILO_PORT` or a random allocated port. Compose credentials are only local isolated fixtures. Stop only that project and preserve volumes/failures; never `down -v` or reclaim another project's resources.

## Persistent media and isolated reviews

Workspace schema 3 stores canonical source revisions, resource manifests and verified persistent PNG/PCM16 WAV bytes in the Daemon's granted database. Older experimental schemas fail without migration/reset; use an explicit new development namespace for isolated review rather than deleting an existing root. There is no implicit old-root import. Resource removal changes current membership and remains undoable; stopping a carrier, closing a preview and blob GC do not delete user media/history.

Import bounds are 6 MiB per resource and 64 resources / 64 MiB per revision. Supported PNG is non-interlaced, at most 4096×4096; WAV is PCM16, mono/stereo, 8–96kHz. Web's media tab imports, inserts and removes these resources. Relative nested references are resolved from the finite snapshot manifest. Missing media retains the old confirmed preview and reports the failed candidate. Audio supports original-rate, zero-in-point independent windows and bounded right trim. Additional codecs, source slip, linked media and volume/effects require separate implementation and verification. Actual image decoding and media playback are technical checks, not listening or creative acceptance.
