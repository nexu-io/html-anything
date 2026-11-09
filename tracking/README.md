# OpenMotion tracking

An explicit-event package shared by the standalone MCP runtime and Motion Studio.
It has no runtime dependencies. The application consumes its TypeScript sources;
`npm run build:tracking` emits JavaScript and declarations for a local `npm pack`
from this directory. The package remains private; this change does not publish it.

For new events, start with the [integration guide and agent task template](INTEGRATION.md).

## Reporting and user control

Reporting is **on by default** using the isolated OpenMotion project. The single
public, write-only project token and ingestion host are distributed in
`shared/tracking-config.json`; it contains no read/admin credentials and is never
included in the browser bundle. Users do not need to supply a key or opt-in flag.

Users can turn collection off in Studio's **Privacy settings → Share usage data**.
This preference is persisted under the installation's data directory and applies
to both MCP and Studio, including already-running processes and future restarts.
Disabling clears pending queues and aborts in-flight delivery; accepted events
cannot be recalled. A filesystem watcher propagates preference changes, and each
enqueue/flush also checks the saved preference. Corrupt preference files fail closed.

`OPENMOTION_TELEMETRY=0` (also `false`/`off`) or `DO_NOT_TRACK=1` forces all collection
off and locks the Studio switch. Restart services after changing launch environment
variables. Browser Do Not Track suppresses browser collection. The environment
override takes priority over the saved preference.

For another collector, supply both `OPENMOTION_POSTHOG_HOST` and
`OPENMOTION_POSTHOG_KEY`. Partial or invalid configuration fails closed. Custom
collectors default to zero-IP mode; `OPENMOTION_GEOIP=1` requires that collector to
discard IP after enrichment. Never supply a personal `phx_` API key.

Use `OPENMOTION_TRACKING_ENV=test` and a UUID in
`OPENMOTION_TRACKING_TEST_RUN_ID` for isolated ingestion checks; filter these records
out of product dashboards. Normal environments are `production` and `development`.
Node/Vitest tests suppress collection unless explicitly given a test run ID; CI
also forces collection off. No test should silently report into production funnels.

Studio retrieves only an enabled flag and submits semantic events to the same-origin
`/motion-api/tracking` endpoint. The server validates the complete batch, rejects
identity/source/credential overrides, and adds trusted common fields before posting
to PostHog `/batch/`. Browser Do Not Track suppresses browser collection. Network
reporting is asynchronous, with a bounded timeout; local business results never wait
for PostHog. A collector receipt confirms acceptance, not queryable ingestion.

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
(east of UTC is positive). The default project runs [coarse GeoIP](./posthog-geoip.hog)
before the **Discard client IP data** setting removes the IP from stored events.
Only country code/name, first-level region code/name and geographic timezone are
added. No city, postal code, coordinates or person-location updates are generated.
Lookup failures leave geographic fields unknown. GeoIP describes the observable
network egress; VPNs/proxies can change it. Device timezone is a separate setting.
Network intermediaries still see the connection address. Operators must keep the
project's IP-discard policy enabled; it is a receiver requirement, not a guarantee
enforced by a public capture token. Custom zero-IP mode retains the fixed address
`0.0.0.0`, because a null property is replaced with the request IP. Person profiles,
autocapture, session replay and upstream engine telemetry are not enabled.

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
