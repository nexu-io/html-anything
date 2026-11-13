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

This first integration does not implement the entire tracking specification:
installer/integration/resource-read events, WebMCP execution, every editor save,
timeline/history/import gesture, review/adoption and optional media events remain
outside this change. Worker origin is `worker`; request-to-worker operation context
is not yet persisted. Pending export cancellation has a cancel result but no worker
completion because no worker claimed it.

The queue is process-local: 64 events, batches of 16, one in-flight request, a one-day
TTL and retry backoff capped at one minute. Disabling aborts and drops pending data;
shutdown drains for at most two seconds. Crashes, queue overflow, page termination
or permanent collector rejection may lose events. Add durable delivery if product
decisions require guaranteed counts. Public ingest tokens are not read/admin keys,
but forged events and quota abuse still require collector-side rate limiting and
monitoring; this package is not an anti-fraud boundary.
