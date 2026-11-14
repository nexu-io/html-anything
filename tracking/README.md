# OpenMotion tracking

An explicit-event package shared by the standalone MCP runtime and Motion Studio.
It has no runtime dependencies. The application consumes its TypeScript sources;
`npm run build:tracking` emits JavaScript and declarations for a local `npm pack`
from this directory. The package remains private; this change does not publish it.

For new events, start with the [integration guide and agent task template](INTEGRATION.md).

## Reporting and user control

Reporting is **on by default in every application environment and version**, including
stable releases, test/prerelease packages and local builds, into the existing
OpenDesign project (420348). Application version and environment remain event
properties; they do not disable collection. DEV packages retain their separate
installation/data directories and template routing.
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
Re-enabling resumes collection of new events in MCP and Studio
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
Marked live-ingestion checks use `env=test` with any application version.
Deterministic checks use fake senders and extracted stable/test/local packages
without external requests.

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
The sole bounded free-text exception is the settled template-search keyword,
described below; it does not enable text on other event fields.
All retries retain the original event UUID/timestamp and PostHog `$insert_id`.
Bounded numeric rules also preserve fractional timings, playback rates and signed
audio/geometry measurements; non-finite or out-of-range values are rejected.

### Host Agent attribution

Every event has `host_agent` and `host_agent_source`. Known declared clients map
to `codex`, `deepseek` (DeepSeek Harness/DSH), `claude`, `cursor`, `opencode`,
`gemini`, `workbuddy` or `chatgpt`; another declared client maps to `other`.
Missing evidence is `unknown`, never inferred from an installed executable,
model provider, browser user agent or the last caller of a shared backend.
`mcp_client_name` is included only for a bounded implementation identifier;
`mcp_client_version` is the client's declared numeric version, not a verified
host-application version. DSH currently declares its MCP adapter version.

The stdio runtime captures `initialize.params.clientInfo` per connection and also
recognizes standard per-request `io.modelcontextprotocol/clientInfo` metadata.
An absent declaration can fall back to `OPENMOTION_HOST_AGENT`, `CODEX_THREAD_ID`
or `CLAUDECODE=1` in that MCP process, labeled `launch_environment`. Environment
values and thread IDs themselves are never reported. Client metadata is
self-declared analytics context, not authenticated identity or an entitlement.

The calling context follows domain operations and is persisted on export jobs
for the worker. Editor handoffs receive an opaque `tracking_context` query token;
the local service associates it with that opener for at most 24 hours and 256
live contexts, in memory only. The browser submits the token to its same-origin
collector and cannot supply host properties in an event. Repeated handoffs retain
their connection's token, project navigation preserves it, and another client
cannot replace an existing association. A manually opened, expired, evicted or
restarted page context reports `unknown`. No global last-used-host attribution is
used. These tokens are metadata references, not authorization credentials.

The research sources are the [supported MCP lifecycle](https://modelcontextprotocol.io/specification/2025-11-25/basic/lifecycle),
[Codex's MCP client](https://github.com/openai/codex/blob/main/codex-rs/rmcp-client/src/utils.rs)
and [DSH's client declaration](https://github.com/deepseek-ai/deepseek-harness/blob/master/packages/mcp/mcp-client/src/connection.ts).

## Implemented signals and limits

- All registered phase-one stdio tools: accepted start and observed finish, including
  early-return catalog tools, input rejection, partial import and idempotent replay.
- Domain results: create/open/edit/import/restore and export request/cancel. Replayed
  operations do not manufacture additional domain completions. Preview returned by
  a tool does not imply the host opened it.
- Worker export terminal state, after render and available technical verification;
  it is distinct from queue acceptance and does not assert human content acceptance.
- Studio project readiness and load outcome, plus project-sidebar creation/switching.
- All 78 retained Studio event names are registered in
  [studio-events.ts](studio-events.ts) and included in the same derived browser
  admission registry: startup/preview/render/performance, editor interaction,
  feedback/desktop, save/error/transaction, SDK, WebMCP status and audio FX.
  Existing `trackEvent` and `trackStudioEvent` callers use the OpenMotion transport.
  Their [adapter](studio-properties.ts) removes private fields before queueing;
  upstream tokens, transports and automatic experiment enrollment remain disabled.
  Feature visibility and SDK gates do not change: hidden feedback, desktop and
  audio-FX features emit only when their existing producer actually runs.
- The editor's template library reports with the names of the shared OpenMotion
  tracking sheet, so its funnel lines up with the website's: `surface_view` for
  the library, a gallery card, a template's detail and the instruction to copy;
  `ui_click` areas `template_card`, `template_detail`, `template_instruction` and
  `template_discovery`; `template_search_result`, `template_filter_result` and
  `resource_download_result`. A template is identified by `template_id` only
  (a bounded slug); titles, authors and URLs are never fields. `placement` says
  how a detail was reached: `catalog`, `related`, `random` (Surprise me) or
  `navigation` (previous/next). `detail_view_id`, `copy_attempt_id`,
  `download_attempt_id` and `search_id` are random UUIDs that tie a click to its
  result. Recreate and Recreate-and-submit report `start_use` with
  `template_action`; the instruction panel's Copy reports `copy_instruction`;
  every copy reports `template_instruction_copy_result`, and only
  `clipboard_written` is a successful copy. `host_product` and `target_agent`
  name the instruction variant that was copied (the library builds the Codex
  one), not the client the user later pastes it into. A category or filter option is sent
  as a lowercase slug of the stable catalogue value and omitted when it cannot be
  reduced to one. `template_search_result.search_keyword` is the one free-text
  field in the registry: the settled search-box value, trimmed and capped at 100
  characters, sent once per keyword 500 ms after typing stops and never per
  keystroke. A card impression (`template_card` / `card`) is reported once the
  card has been at least half visible for one unbroken second and is not covered
  by the detail, once per search, filter and sort combination, so click-through
  per card can be read. Hover, scroll depth, autoplay and video progress are not
  reported. These events carry no project fields yet.
  Library exposure records the actual dialog opening, including pending or failed
  catalog loads; it omits `result_count` because that count is not known at opening.
  Loading retries and locale changes do not create another opening. Instruction
  exposure waits until at least 1% of its text enters the viewport in a visible tab, once per
  detail view. Recreate and Recreate-and-submit carry the same `copy_attempt_id`
  on their `start_use` click and copy result; Open-and-edit has no copy attempt.

The adapter preserves fixed actions, counts, booleans and safe catalog/control
identifiers. It drops messages/stacks, file paths, selectors, composition/block
names, free-text feedback, breadcrumb text and arbitrary error names. Feedback
retains `has_comment`, rating and fixed question/answer categories; resolver
mismatches become per-kind counts, and attempt rollups retain total attempts and
distinct-operation counts without raw JSON keys. Audio parameter numbers are
bounded; string parameters retain only a fixed engine-catalog `value_category` and
`value_kind=category`. Custom effect/preset/parameter identifiers become `other`.
Unknown event names are ignored. Invalid required fields prevent the event from
being queued; optional invalid fields are omitted. The server still rejects
unknown fields and forged common properties rather than applying this adapter.

Coverage follows the existing producers; it does not invent new product actions.
Installer/integration/resource-read events, actual WebMCP tool-execution outcomes,
every successful editor save/import gesture and human review/adoption results
still need their own confirmed completion semantics. WebMCP status signals and
save-failure/blocked signals are not those missing success/result events.
Worker origin is `worker`; its caller's host context is persisted, while a full
request-to-worker operation context is not. Pending cancellation has a cancel
result but no worker completion because no worker claimed it.

The compatibility adapter bounds initialization-waiting calls at 64. The queue is
process-local: 64 events, batches of 16, one in-flight request, a one-day
TTL and retry backoff capped at one minute. Disabling aborts and drops pending data;
shutdown drains for at most two seconds. Crashes, queue overflow, page termination
or permanent collector rejection may lose events. Add durable delivery if product
decisions require guaranteed counts. Public ingest tokens are not read/admin keys,
but forged events and quota abuse still require collector-side rate limiting and
monitoring; this package is not an anti-fraud boundary.
