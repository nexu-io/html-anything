# Adding OpenMotion tracking events

Use this guide to ask a coding agent to add an event, implement it through the
existing MCP/Studio tracking path, and verify its meaning and delivery. It describes
the current in-repository implementation, originating in PR #189, not a released npm API. Check the current checkout
before applying examples. `@openmotion/tracking` is private; application callers
currently import repository sources rather than installing it from npm.

## Give the agent a business question

The requester supplies the question, interaction and observable completion. The
agent finds the existing implementation and chooses the smallest change. For
example: “Can users successfully save changes in Studio? Measure one result for
each actual save attempt; do not count every keystroke or treat a button click as
a completed save.” Event names below are illustrative, not already implemented.

Copy this task template and replace the bracketed lines:

```text
Read tracking/INTEGRATION.md, tracking/README.md and AGENTS.md first.
Add tracking for this OpenMotion behavior:
- Question: [what decision will this data support?]
- Entry: [Studio / MCP / worker]
- Trigger: [the exact interaction or completed operation]
- Success/failure: [observable conditions; include partial/no-op if relevant]
- Dimensions: [only the categories/counts needed for the question]

Inspect the existing event registry, all callers and the actual completion path.
Reuse an existing event if its meaning matches. Otherwise add its closed property
schema and producers in tracking/events.ts. Studio types and server admission are
derived from producers; do not maintain a separate browser event list.
Use the existing trackMotion wrapper or injected OmTracking instance. Keep one
owner for each business result; do not duplicate MCP wrapper events.
Do not add an SDK, direct browser-to-PostHog calls, a new identity or a capture key.
Do not send prompts, content, paths, URLs, raw errors or credentials.

Add focused tests for actual success/failure, rejected/private fields and the
relevant replay/no-op or duplicate-render cases. Verify opt-out still prevents
reporting while the feature continues working. Run the repository-required checks.
If live ingestion is checked, use isolated data and env=test with a new UUID
test_run_id. Read back those exact events from PostHog; an HTTP 200 is not proof.
If readback is unavailable, report it as unverified rather than passed.
Update the event definition/documentation. Report trigger, fields, files, checks,
actual indexed-event evidence and limits. Prepare the change for review; do not
merge or publish without authorization.
```

Before implementation, record the event's meaning, trigger, owner, allowed fields,
required fields and deduplication unit. Missing business meaning needs clarification;
the agent can determine file paths and existing helpers from code.

## Find the correct owner

| Signal | Existing location | Extension rule |
| --- | --- | --- |
| Accepted MCP start and observed finish | `mcp.ts`, `toolNames` in `tracking/events.ts` | All eleven tools already use the wrapper. Do not add another start/finish pair inside a handler. Reconcile the tool contract and this list if adding a tool. |
| Committed phase-one business result | `phase1.ts` and `trackPhase1Result` in `shared/tracking.ts` | Use the shared domain completion. Replayed operations skip new domain completions. A successful call need not have made a useful edit. |
| Render/export terminal state | `renderNext` in `server.ts` | Emit from the worker's observed terminal state. A queued job is not a completed video. |
| Studio interaction or readiness | Components under `studio/src/motion/`, using `tracking.ts` there | Track an intentional handler or a guarded readiness/completion callback. Avoid unguarded render/effect reporting. |
| Browser admission | `producers` in `tracking/events.ts`; derived `studioEvents`; ingress in `server.ts` | Declare `producers: ['studio']` on the event. The wrapper's types and server validator use the derived registry. Preserve server-side rejection of identity, source, worker and credential overrides. |

`ui_click` already describes a fixed page/area/element tuple. Reuse it for matching
intent and extend only its necessary enum values. Use a result event for persisted
effects; do not infer success from intent. If MCP and Studio reach the same operation,
choose one domain owner. Two calls to `track()` create two UUIDs and are not
automatically recognized as the same business action.

## Register and call an event

This **proposed** Studio-save example demonstrates the API; it does not add save
coverage. Decide what constitutes one save attempt and attach it to the real save
completion callback before using it. Count one committed save batch, not individual
keystrokes. Define no-op and retry behavior explicitly.

Add the entry inside `omEvents` in `tracking/events.ts`:

```ts
studio_save_result: {
  producers: ['studio'],
  fields: {
    outcome: ['success', 'failure'],
    changed_file_count: 'integer',
    error_code: ['SAVE_FAILED', 'VERSION_CONFLICT'],
  },
  required: ['outcome'],
},
```

Keep the registry's existing `as const satisfies` declaration. Register the actual
producer (`studio`, `mcp` or `worker`) on the event; only include `studio` for an
event that browsers may submit. The registry supplies both TypeScript types and
runtime validation; unknown properties are rejected, not silently removed. A new
Studio event automatically enters `studioEvents` without another list edit.
This metadata controls Studio exposure and admission; Node's tracker still owns
the domain/worker call sites and entrypoint mapping.

In the owning Studio component, import the existing wrapper using the correct
relative path. For a component directly in `studio/src/motion/`:

```ts
import { trackMotion } from './tracking';

// Call after the save operation confirms a committed change.
function reportSaveSuccess(changedFileCount: number) {
  void trackMotion('studio_save_result', {
    outcome: 'success', changed_file_count: changedFileCount,
  });
}

// Invoke from the failure path; map known conflicts separately if available.
function reportSaveFailure() {
  void trackMotion('studio_save_result', {
    outcome: 'failure', error_code: 'SAVE_FAILED',
  });
}
```

Preserve the feature's existing error handling. Map errors to explicit safe codes;
never pass `error.message`, `String(error)`, a stack or the whole result object.
These helper names are examples; place calls in existing completion handlers
instead of introducing wrappers solely for tracking.

Server/domain code uses its injected tracker:

```ts
import type { OmTracking } from './shared/tracking.ts';

// Example only: an additional restore hook is unnecessary where Phase1Service
// already emits version_restore_result. Adjust the import for the owning file.
function reportRestore(tracking: OmTracking | undefined, projectId: string) {
  tracking?.track('version_restore_result', {
    outcome: 'success', project_id: projectId,
  });
}
```

Reuse an existing tracker; do not create an identity/tracker per interaction. In a
new process only, follow `createAppTracking`/`closeTracking` lifecycle wiring. Do not
await delivery in a business operation. `track()` returning `queued` means local
acceptance; `trackMotion()` resolves with a local queue/configuration status. Neither proves
that the event is queryable in PostHog. Normal calls do not need an explicit flush.

Current field rules are closed enums, booleans, UUIDv4 values, safe-code strings,
nonnegative safe integers up to 86,400,000, or explicit finite numeric `{min,max}`
bounds for fractional/signed measurements. Do not invent arbitrary string fields
or use the safe-code rule to tunnel user content. Omit unknown optional counts;
missing is not zero. If the measurement needs a new type, review the validator and
its tests rather than bypassing it. Do not silently change an existing event's
meaning; use a distinct event or an explicit schema migration for breaking changes.

## Leave common context to the tracking path

Business callers provide only registered semantic properties. The package/server
adds event UUID/time, schema and app version, environment, entrypoint/runtime,
installation/device identity, saved attribution, platform, locale and timezone.
Do not place common fields inside an event's properties or copy a browser identity
into Node. `device_id`, `installation_id` and `distinct_id` currently share one random
installation UUID; they are not a hardware fingerprint or a unique-person count.
Host Agent properties also belong to this trusted common context. Capture the
declared MCP client on its connection/request and pass that immutable context to
the domain operation and worker. An editor uses only its opening-link context;
never copy a host name into semantic event properties or assign all pages to the
most recently active Agent. See [attribution limits](README.md#host-agent-attribution).

The current installation identity may retain `utm_source`; landing-to-installer
`--source` propagation is separate work and an unknown source remains null. An event
addition must not claim that acquisition plumbing is already implemented.

Events go to the existing OpenDesign project (420348), with `product=openmotion`.
Filter OM queries by that property and exclude OM from unrelated shared reports.
An OM-only receiver transformation preserves coarse GeoIP and removes raw IP and
precise location after the existing GeoIP transformation; non-OM events are unchanged.
Do not add client IP lookups or collect IP in callers.
Device timezone is separate from GeoIP timezone; VPN/proxy egress may differ.
See [configuration, privacy and limits](README.md) and [coarse GeoIP](posthog-geoip.hog).

Tracking is on by default in every application environment and version, including
stable, test/prerelease and local builds. Studio **Privacy settings → Share usage
data** disables collection for the installation, including MCP and Studio across
restarts. Re-enabling resumes new reports without replaying discarded events.
Application version and environment are event properties, not collection gates.
DEV packages retain their separate installation/data directories and template routing.
`OPENMOTION_TELEMETRY=0` or `DO_NOT_TRACK=1` forces it off; browser Do Not Track also
suppresses browser collection. An added event must respect those controls.

## Diagnose without logging event contents

Normal component calls remain `void trackMotion(...)`. Tests or a local debugger
can inspect the returned status without changing feature behavior:

```ts
const status = await trackMotion('ui_click', {
  page_name: 'home', area: 'workspace', element: 'new_creation',
});
// queued | invalid | full | duplicate | disabled | config_unavailable
```

`queued` means browser-local acceptance, not service or PostHog ingestion.
`invalid` means schema rejection; `full` means the bounded browser queue is full.
`disabled` covers policy/preference controls and a service opt-out response.
`config_unavailable` means configuration could not be confirmed; the event is
not queued. Do not retry a business operation because its tracking failed.

Studio shares one in-flight configuration load across callers. Each request has
a one-second timeout. Transient HTTP/network/JSON/shape failures get at most
three attempts, with one- and two-second delays. Collection stays off until a
valid boolean configuration arrives. After exhaustion, calls return
`config_unavailable` for 30 seconds; the next call after that cooldown starts a
new attempt group. Events rejected during the cooldown are not replayed. There
is no permanent background polling. A valid `enabled: false` is not a transient
failure and does not trigger retries. Opt-out aborts pending configuration work,
cancels retry delays and clears queued events; a late response cannot re-enable it.
`setMotionTrackingEnabled(true)` is for the existing control after the service
confirms the preference change, not a bypass around initialization or policy.

For a snapshot, import `getMotionTrackingStatus` from the same Studio wrapper.
It exposes only `configuration` (`uninitialized`, `loading`, `ready`, `disabled`
or `unavailable`), effective `enabled`, `pending` count and `retryAfterMs`.
Browser Do Not Track can keep effective `enabled` false even with a ready
configuration. No event properties, identity, tokens or raw errors are exposed.

`flushMotionTracking()` returns `accepted`, `retry`, `drop`, `disabled` or `empty`.
This describes the browser-to-local-service boundary; `accepted` does not prove
downstream PostHog ingestion. The existing core/Node tracker similarly returns
local queue statuses from `track()` and transport receipts from `flush()`.
Use fake senders/fetch in tests and assert these results; do not enable raw
payload logging or build assertions around production data.

## Verify meaning before checking ingestion

Extend the existing tests nearest the changed boundary:

- `tests/tracking.test.ts`: schema/privacy, local ingress, domain completion, replay,
  export terminal state and installation-wide opt-out. It also compiles
  `tests/tracking-types.ts` to check Studio-only event exposure and field types.
- `studio/src/motion/tracking.test.ts`: browser sender, common-field isolation and
  browser opt-out, bounded configuration recovery and safe diagnostic statuses.
  Also test the owning component's real completion/handler so a
  missing call site cannot pass on schema tests alone.
- `tests/source-install.test.ts`, `tests/package.test.ts` and
  `tests/npm-package.test.ts`: public boundary and distributed content when affected.
  The npm tests also execute extracted test and stable application archives with
  fake senders, checking the version lock and repeated disable/re-enable cycles.

Check a valid event and required/unknown-field rejection, real success and failure,
and the relevant no-op/retry/replay or rerender case. Prove there is one event per
defined unit and zero reports after opt-out. A collector outage must leave the
feature's normal success/failure behavior intact. Use an injected fake sender for
deterministic checks. Normal Node/Vitest runs suppress external reporting.

Use the CI-pinned Node version and repository rules. These existing commands cover
the shared boundary and browser wrapper; add the owning feature's tests as needed:

```sh
npm run check
npm run typecheck:studio
npm run build:studio
npm run build:tracking
node --experimental-strip-types --test tests/tracking.test.ts
npm run test:studio -- studio/src/motion/tracking.test.ts
```

Before branch publication, follow the [local validation guidance](../AGENTS.md#local-validation),
including affected install and packaging checks. The list above covers tracking
changes, not every documentation edit. Documentation-only edits need link/content
checks and applicable repository gates, not invented product events.

## Read back a marked live run

Use an application of any version, an owned temporary data directory and fresh
runtime processes. Apply the same
test environment to every participating MCP/local service process, including ones
launched by a host. An already-running shared service will not inherit new variables.
For a POSIX shell, prepare the environment before starting the normal test runner
or application entry:

```sh
export OPENMOTION_TRACKING_ENV=test
export OPENMOTION_TRACKING_TEST_RUN_ID="$(node -e 'console.log(crypto.randomUUID())')"
export MOTION_DATA_DIR="$(mktemp -d "${TMPDIR:-/tmp}/openmotion-tracking.XXXXXX")"
```

These lines only prepare a test; they do not run the feature or prove delivery.
Keep test-run UUIDs stable for one run and start a fresh UUID for another. Do not
override a user's saved preference or remove their force-off variables to make a
test pass. Use a separately owned test launch; record an intentional opt-out case.

Exercise the actual action, then query the exact `test_run_id` and `product=openmotion`
in the OpenDesign PostHog project. A read-authorized connector/account is needed; the distributed
public capture token cannot query events. For example, replace the UUID below:

```sql
SELECT event, count() AS rows, uniqExact(uuid) AS unique_events
FROM events
WHERE properties.product = 'openmotion'
  AND properties.env = 'test'
  AND properties.test_run_id = 'REPLACE_WITH_TEST_RUN_UUID'
GROUP BY event
ORDER BY event
```

Compare counts and properties with the action's declared contract, excluding any
known baseline page/tool events. Check entrypoint, allowed dimensions and common
identity. Check raw IP/private fields are absent; GeoIP may be unknown on lookup
failure. Disable through the actual control, repeat the successful action, and
confirm no extra indexed events. Include timestamps and allow bounded ingestion
latency; unavailable readback or unsettled indexing is an explicit verification gap.
Product dashboards must filter out `env=test` and test-run records.

## Review handoff

Provide event name/meaning, exact trigger, fields/enums, one reporting owner,
deduplication behavior, changed paths and checks. Separate local tests, actual
indexed evidence, current CI, installation/platform checks and release status.
Link the marked live run when performed; never attach credentials or user content.
No report is guaranteed: the bounded queue is process-local and can lose data on
crash, overflow or permanent rejection. Do not use its counts as guaranteed billing
or unique-person evidence. Adding an event does not authorize changing receiver
settings, publishing the private tracking package or merging the feature PR.
