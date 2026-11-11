# OpenMotion tracking

An explicit-event package shared by the standalone MCP runtime and Motion Studio.
It has no runtime dependencies. The application consumes its TypeScript sources;
`npm run build:tracking` emits JavaScript and declarations for a local `npm pack`
from this directory. The package remains private; this change does not publish it.

For new events, start with the [integration guide and agent task template](INTEGRATION.md).

## Reporting and user control

Reporting is **on by default in stable releases** into the existing OpenDesign project (420348).
Test and other prerelease/local application versions never report. This is enforced
from the packaged application version, independently of CI environment variables,
the saved preference, a custom collector or test-run overrides. The test-build
Privacy switch is locked off and does not overwrite a saved stable-release choice.
Stable and test clients cannot reuse each other's same-workspace backend authority;
use the separate installation/data directories already provided by DEV packages.
Compatible updates within the same release policy retain normal backend reuse.
OM events carry `product=openmotion`; OM reports must filter by that property,
and shared-project reports must distinguish OM from other products. The project's
public, write-only token and ingestion host are distributed in
`shared/tracking-config.json`; it contains no read/admin credentials and is never
included in the browser bundle. Users do not need to supply a key or opt-in flag.

Users can turn collection off in Studio's **Privacy settings → Share usage data**.
This preference is persisted under the installation's data directory and applies
to both MCP and Studio, including already-running processes and future restarts.
Disabling clears pending queues and aborts in-flight delivery; accepted events
cannot be recalled. A filesystem watcher propagates preference changes, and each
enqueue/flush also checks the saved preference. Corrupt preference files fail closed.
On stable releases, re-enabling resumes collection of new events in MCP and Studio
without restarting. Events discarded while disabled are not buffered or replayed.

`OPENMOTION_TELEMETRY=0` (also `false`/`off`) or `DO_NOT_TRACK=1` forces all collection
off and locks the Studio switch. Restart services after changing launch environment
variables. Browser Do Not Track suppresses browser collection. The environment
override takes priority over the saved preference.

For another collector, supply both `OPENMOTION_POSTHOG_HOST` and
`OPENMOTION_POSTHOG_KEY`. Partial or invalid configuration fails closed. Custom
collectors default to zero-IP mode; `OPENMOTION_GEOIP=1` requires that collector to
discard IP after enrichment. Never supply a personal `phx_` API key.

Keep the OM-only receiver transformation active while geo-enabled clients report
to this shared project. Before removing it, stop OM collection or switch those
clients to zero-IP mode. Do not revoke the shared OpenDesign token as an OM rollback.

Use `OPENMOTION_TRACKING_ENV=test` and a UUID in
`OPENMOTION_TRACKING_TEST_RUN_ID` for isolated ingestion checks; filter these records
out of product dashboards. Normal environments are `production` and `development`.
Node/Vitest tests suppress collection unless explicitly given a test run ID; CI
also forces collection off. No test should silently report into production funnels.
Marked live-ingestion checks require a stable-version application running with
`env=test`; a `-test.N` package cannot be opted into reporting. Deterministic checks
use fake senders and extracted stable/test packages without external requests.

Studio retrieves only an enabled flag and submits semantic events to the same-origin
`/motion-api/tracking` endpoint. The server validates the complete batch, rejects
identity/source/credential overrides, and adds trusted common fields before posting
to PostHog `/batch/`. Browser Do Not Track suppresses browser collection. Network
reporting is asynchronous, with a bounded timeout; local business results never wait
for PostHog. A collector receipt confirms acceptance, not queryable ingestion.

Event `producers` and closed property schemas live together in `events.ts`.
Studio's typed API and the service's browser-admission registry are derived from
that definition; server-side validation remains mandatory. Studio configuration
loading retries transient failures with bounded backoff, stays disabled until
confirmed, and never treats a valid opt-out as a retryable failure. Callers can
inspect local queue/configuration statuses and a content-free status snapshot;
see [diagnostics and retry semantics](INTEGRATION.md#diagnose-without-logging-event-contents).

## Identity, properties and privacy

One random UUID is persisted atomically in `tracking/identity.json` under the owned
data directory, outside projects and versioned application caches. `device_id`,
`installation_id` and PostHog `distinct_id` share that UUID. Different data directories
are separate installations. No hardware ID or fingerprint is used. The package can
initialize an identity with a validated source label; existing identities retain
their first source. Landing-page attribution and installer `--source` plumbing are
a separate change. Unknown source remains null.

Common fields include schema/product/app version, environment, entrypoint/runtime,
platform/architecture, OS/version, runtime locale, device IANA timezone and UTC offset
(east of UTC is positive). After OpenDesign's existing GeoIP transformation, the
[OM-only transformation](./posthog-geoip.hog) matches `product=openmotion`, derives
country/first-level region/geographic timezone and removes raw IP, precise GeoIP
and person-location updates before storage. The transformation has both an event
filter and a source-code guard; non-OM events pass through unchanged. Existing
OpenDesign transformations and the project's global IP setting are unchanged.
Lookup failures leave geographic fields unknown. GeoIP describes the observable
network egress; VPNs/proxies can change it. Device timezone is a separate setting.
Network intermediaries still see the connection address. Operators must keep the
OM transformation enabled after GeoIP; it is a receiver requirement, not a guarantee
enforced by a public capture token. The earlier standalone OM project's test data
is retained and is not migrated or deleted. Custom zero-IP mode retains the fixed address
`0.0.0.0`, because a null property is replaced with the request IP. OM requests no
person profiles and emits no autocapture or session replay; other OpenDesign
producers retain their own settings. Upstream engine telemetry stays disabled.

Runtime and TypeScript event contracts whitelist required fields, enums, UUIDs and
bounded counts. No prompts, messages, source files, URLs, local paths, titles, raw
exceptions or credentials are accepted. Safe error categories are explicitly mapped.
All retries retain the original event UUID/timestamp and PostHog `$insert_id`.

## Implemented signals and limits

- All eleven phase-one stdio tools: accepted start and observed finish, including
  early-return catalog tools, input rejection, partial import and idempotent replay.
- Domain results: create/open/edit/import/restore and export request/cancel. Replayed
  operations do not manufacture additional domain completions. Preview returned by
  a tool does not imply the host opened it.
- Worker export terminal state, after render and available technical verification;
  it is distinct from queue acceptance and does not assert human content acceptance.
- Studio home/project page readiness, editor load outcome, new/recent-session and
  template-selection intent, plus actual instruction-copy/fallback results.
- Motion editor exports started from the Studio UI: one `studio_export_request_result`
  per start attempt (accepted or rejected with a safe code) and one
  `studio_export_result` per accepted render when that tab observes its terminal
  state, joined by a browser-minted `export_id`. These renders run in the editor's
  own pipeline and never reach the worker `export_result`, which stays MCP-only.
- Motion editor manual edits: one `studio_edit_result` per committed history entry,
  emitted where Studio claims the entry, with a closed `edit_kind` and the `surface`
  the gesture started on. Coalesced claims of one entry report once. Writes
  dispatched by an in-page Agent tool are skipped; MCP edits never reach this path.
  Project rename and asset rename/delete report from their own commit points, and
  save failures report `outcome=failure` with a status class only.
- Undo/redo outcomes, UI asset imports (counts, entry point, safe category),
  notices actually shown (missing FFmpeg, external file conflict, unreachable
  project) and editor intent clicks through `ui_click` with `page_name=studio`.
  `ui_click.option` carries the chosen value of a control with a small fixed set.
- UI export events carry `video_duration_bucket` for the composition being rendered;
  the request event and `studio_load_result` carry `clip_count_bucket`,
  `asset_count_bucket` and `composition_count_bucket`. They are read from what the
  editor already holds in memory at that moment and report `unknown` otherwise:
  at load the timeline and file tree have usually not arrived, so the load values
  are mostly `unknown` and the export request is the reliable reading. No raw
  duration, count or file size is sent.
- The editor's template library (the shared gallery, not the home page list):
  copy click and the actual copy result, preview open, use, category change and
  one search per query, through `ui_click` area `templates` and
  `template_instruction_copy_result`. `template_id` is the catalogue id and is
  accepted only as a `slug`; a non-matching id is omitted and the event still
  sent. Titles, authors and URLs are never fields. When the workspace catalogue
  records the template a project was created from, the same id is added to
  `studio_load_result` and both UI export events.
- Editor events carry `project_scope`; `project_id` is sent only when the Studio
  project id is a UUID. The built-in local project (id `project`) reports
  `project_scope=default` and no id; names and titles are never sent.

This first integration does not implement the entire tracking specification:
installer/integration/resource-read events, WebMCP execution, review/adoption and
optional media events remain outside this change. Editor coverage has known gaps:
a render whose tab reloads before it finishes, or whose cancel the server never
confirmed, has a request result but no terminal result; a cancel that lands after
the render finished reports the outcome the cancel route returned; caption and beat undo stacks, keyboard playback and frame stepping, and
source-editor saves are not reported; `edit_kind` is derived from Studio's fixed
history labels, so an unmapped label reports `other`; clip trim does not say which
edge moved. The Studio page does not know which host product opened it, so
`studio_load_result` has no host field; the copy result's `host_product` is the
client selected in the template library, which defaults to Codex. Turning sharing off is itself not reported, because the preference
applies before the event could be sent. Worker origin is `worker`; request-to-worker operation context
is not yet persisted. Pending export cancellation has a cancel result but no worker
completion because no worker claimed it.

The queue is process-local: 64 events, batches of 16, one in-flight request, a one-day
TTL and retry backoff capped at one minute. Disabling aborts and drops pending data;
shutdown drains for at most two seconds. Crashes, queue overflow, page termination
or permanent collector rejection may lose events. Add durable delivery if product
decisions require guaranteed counts. Public ingest tokens are not read/admin keys,
but forged events and quota abuse still require collector-side rate limiting and
monitoring; this package is not an anti-fraud boundary.
