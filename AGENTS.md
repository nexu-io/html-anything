# OpenMotion · odsuite

## Meta rules

- This repository owns its engineering mechanisms, product composition and lifecycle. `suites/*` uses `@odsuite/*`; `carriers/*`, `apps/*` and `packages/*` use `@open-motion/*`. Every module is private and internal dependencies are `workspace:*`. Installation, builds, runtime and distribution must close inside this repository, without adjacent checkouts or external engineering-suite artifacts.
- Grow the architecture within explicit responsibilities. Ambiguous boundaries are expected: identify the existing owner, candidate placement, dependency direction and lifecycle consequences before choosing a solution. Authorized changes may move boundaries, split responsibilities or add modules. Update contracts, implementation, validation and indexes together. Never evade a decision with duplicated mechanisms or implicit bypasses.
- Continue routine work under existing authorization. Ask only about an unresolved choice that materially changes responsibility, dependencies or lifecycle ownership. Allow deliberate, authorized expansion of directory patterns; reject uncontrolled growth.
- The user has approved an isolated `refactor/odsuite` integration line in this repository. Create each topic branch and its own worktree from a freshly fetched, pinned `origin/refactor/odsuite`. Install, build, test and edit only there. Deliver a focused PR to `refactor/odsuite` and use **squash merge only** after checking its actual base/head and checks. Do not push implementation directly to the integration branch. `feature/motion` retains the complete existing product; integrating the refactor into it, changing `main`, renaming the repository and publishing artifacts require their own acceptance and authorization.
- Repository collaboration is in English: commit subjects and bodies, PRs, issues, comments, review summaries, discussions, release notes and newly maintained guidance. Keep this shared source and `CLAUDE.md` aligned.
- PRs, issues and the owning delivery item hold goals, plans, decisions, progress and evidence. `docs/` contains only durable architecture, operations and conventions with an identified owner. Do not add migration plans, temporary investigations, acceptance logs, task ledgers or disguised archives there. Extract lasting conclusions into the existing topic; keep their discussion in delivery records.
- Review the entire [architecture](docs/architecture.md) for each change: positioning, user flows, responsibilities, dependencies, data/API boundaries, implemented behavior and limits. Update it only when inaccurate or incomplete; do not create a per-change document merely to record work.
- Sidecar is the sole authority for processes, identities, ports, granted paths and lifecycle within a `<channel, namespace>` factory. Callers negotiate business communication. Channel represents the product distribution lifecycle; all deliverable carriers share the product version and release together.
- The only delivery carriers are standalone and Codex Plugin, sharing one product version. Codex distribution uses an npx installation entry; npx cache is not a persistent runtime or resource authority. Absorb reference lifecycle behavior through existing suite owners, never copy legacy script layouts or introduce a second resource/configuration authority. Electron, Capsule and Docker are outside this product composition.
- The only public tool is `odsuite`; the only configuration is `odsuite.yaml`. Package scripts are limited to `lint`, `test`, `build`; the root only distributes the same command with `pnpm -r --if-present run <name>`. No aggregate shortcuts, install hooks, root scripts directory or workflow-shell reimplementation.
- Maintain only the current contract: no old-name entry points, aliases, environment-variable fallbacks or experimental-format compatibility. Do not discover, migrate or reset discarded experimental roots. Do not delete authority/registry/ledger, guess that a process died or take over a live instance to bypass recovery. Importing user data needs an explicit contract and validation.
- Preserve the Apache-2.0 license, upstream attribution and all redistributed font/dependency notices. No telemetry or automatic experiment assignment. Set `HYPERFRAMES_NO_TELEMETRY=1` for product engine processes; previews remain network-restricted. New distribution resources need an explicit finite manifest and lifecycle. No registry, S3, release or installation publication is authorized merely by a passing build or PR.

## Change placement

| Responsibility                                                           | Initial owner                      |
| ------------------------------------------------------------------------ | ---------------------------------- |
| Generic engineering contracts, tools, resources and lifecycle mechanisms | suites                             |
| Concrete host startup, environment adaptation, composition and delivery  | carriers                           |
| Pages, interactions, product routes and product service behavior         | apps/web, apps/daemon              |
| Shared product domains, sessions, projects, models and templates         | packages, by actual responsibility |

One request may span layers. Find an owner before adding an abstraction; multiple imports alone do not justify another package. Mechanisms must not depend on concrete product orchestration; product code must not duplicate sidecar, cache or update authority. Testkit's reference-application dependencies are validation infrastructure, not a product dependency precedent.

## Directory and file policy

- Guard findings are authoritative. Every directory node must match `odsuite.yaml`'s finite allowlist; a parent grant does not permit arbitrary descendants. Tests, hidden and empty directories are managed too. Never exclude unmanaged source, Skills or static resources to hide them.
- Workspaces are `suites/*`, `carriers/*`, `apps/*`, `packages/*`. Put source in `src` and tests in sibling `tests/**/*.test.ts`. Use separate `tsconfig.json` and `tsconfig.tests.json`, with tests mapping `@` to `./src`; TS7, Vitest and Biome are shared tools.
- Source files are at most 500 physical lines. Module directory depth is at most 5, children at most 8; components have only the explicitly configured width exemption. Styles are denied by default in every module. Only the exact theme/components grants may define `src/**/*.less`; tests, CSS, script and HTML styles remain forbidden. Do not disable `file.style` through overrides or exceptions.
- Theme defines semantic light/dark tokens; components consume them and declare BEM using native Less `&__element` and `&--modifier`. Do not invent a BEM DSL or bypass tokens with fallback literals. Native film HTML/CSS is typed product content, not permission to style the Web application.
- External dependencies are exact `x.y.z`; internal ones are `workspace:*`. Documentation/resource directories and names need finite grants. Do not keep a legacy copy or unrestricted assets/skills tree.

## Suite responsibility index

These are starting boundaries for architectural discussion, not a reason to duplicate a mechanism.

| Package      | Owned responsibility and adjacent boundary                                                                                                                   |
| ------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| protocol     | Data contracts, identities, digests, validation and pure transitions; sidecar owns runtime authority.                                                        |
| config       | Product name/scheme/version-provider definitions consumed by release; not a configuration registry or environment store.                                     |
| carrier      | Immutable environment facts, per-composition registration and strict serialization; collects nothing and owns no release/resource identity.                  |
| sidecar      | Channel+namespace factory authority, process identity, ports, granted paths, sessions and explicit dead-owner recovery; business messages belong to callers. |
| inspect      | Discovery, observation, calls and stop through sidecar; no separate inventory or fixed business/debug protocol.                                              |
| serve        | Sidecar-managed local static-service orchestration; consumers own update policy.                                                                             |
| blob         | Verified retrieval, typed materialization, CAS/cache, references, actual Uses, retention and GC; uses sidecar ownership and excludes user data.              |
| release      | Product/channel/version identity, unit manifests, content archives and composition/IO; not installation or workflow quality policy.                          |
| publish      | Signed generation-publication authority, feed projection and verified retrieval; distribution owns shell negotiation.                                        |
| distribution | Signed product/application-kit catalogs, bounded retrieval and S3 IO; not installation or runtime commit authority.                                          |
| update       | Candidate discovery, verification and preparation; actual lifecycle owners activate.                                                                         |
| runtime      | Unconnected content-generation activation/recovery mechanism; its shell-oriented contract is not the current Node-carrier update lifecycle.                  |
| installer    | Immutable Node staging/installation, atomic carrier selection and durable transitions; sidecar owns OS authority and explicit recovery.                      |
| pack         | Generic Node closure compilation, dependency notices and verified immutable local archives; carriers choose entries and resources.                           |
| pipeline     | Shared-version build/package/check/candidate metadata for both Node carriers; workflows choose quality requirements. Publication is not connected.           |
| dev          | Repository development configuration, managed builds/watchers and carrier orchestration; sidecar owns all control paths, liveness and lifecycle.             |
| cli          | Argument parsing, routing and output; mechanisms stay in their suites.                                                                                       |
| style        | Closed Less/BEM/token/font-manifest validation and explicit build composition/copy; products own tokens/fonts/atoms.                                         |
| guard        | Directory/file policy configuration, scanning and compliance findings.                                                                                       |
| automation   | Browser/Electron drivers, read-only desktop observation, PNG comparison and verdicts; validation infrastructure.                                             |
| testkit      | Private reference-skeleton scenarios, qualification matrix and evidence association; not a product runtime dependency.                                       |

## Core files and product index

| Location                                          | Responsibility                                                                                                                       |
| ------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| package.json, pnpm-workspace.yaml, pnpm-lock.yaml | Workspaces, standard commands and pinned dependencies                                                                                |
| odsuite.yaml, biome.json                          | Finite engineering policy and runtime/development configuration                                                                      |
| suites/*/src/index.ts                             | Public mechanism entry points                                                                                                        |
| suites/cli/src/odsuite.mjs                        | Repository CLI bootstrap; installed product entry is packages/application                                                            |
| carriers/standalone                               | Actual managed Web/Daemon composition, independent Node closure and development adapter                                              |
| carriers/codexplugin                              | Codex host composition, closed runtime, guidance and stdio drain; npx installation remains separate from descriptor loading          |
| apps/web, apps/daemon                             | Product workspace UI, HTTP/MCP adaptation and protected native previews                                                              |
| packages/theme, packages/components               | Primitive/semantic/light-dark tokens, licensed local fonts, atoms and anonymous layouts                                              |
| apps/web/src/lib/components                       | Web business components; no style definitions                                                                                        |
| packages/motion                                   | Native editing, composition graph/assembly, preview and canvas bridge; no persistence or OS allocation                               |
| packages/gateway                                  | Fixed-intent PNG tasks, explicit provider adapters and durable verified candidates; workspace owns explicit adoption transactions    |
| packages/templates                                | Finite built-ins and explicit Prism discovery/source verification, provenance; blob caches resources and workspace creates artifacts |
| packages/application                              | Product npx setup/control, candidate verification/activation and owned host registration; no resource authority                      |
| packages/render                                   | Durable export intent, serial fixed-revision execution and verified films; sidecar/blob own OS resources                             |
| packages/workspace                                | Session/message/artifact ownership, revisions, history, transactions and idempotency shared by HTTP/MCP/Web                          |
| docs/README.md                                    | Durable documentation index                                                                                                          |
| docs/architecture.md, domains.md                  | Engineering architecture and product/data responsibilities                                                                           |
| docs/operations.md, conventions.md                | Runtime recovery, verification and engineering conventions                                                                           |
| .github/workflows/ci.yml                          | Source checks; no publication                                                                                                        |
| .github/PULL_REQUEST_TEMPLATE.md                  | Review scope, responsibility, evidence and limitations                                                                               |
| LICENSE, NOTICE                                   | Public repository license and third-party attribution                                                                                |
| CLAUDE.md                                         | Shared entry to this document                                                                                                        |

## Typical iteration workflows

### Local environment and worktrees

Read the docs, find the owner and delivery record, then create an isolated topic worktree from the fetched integration SHA. Baseline and integration checkouts are read-only references: no installs, builds, tests or edits there. Pin the `feature/motion` reference used for business comparisons; a moving branch or old test result is not current evidence.

Use Node24 and pnpm11.13.0. Linux requires `ps` (`procps` on Debian); containers require init to reap orphaned processes. The workspace explicitly disables the global virtual store and rejects stale dependencies before running commands. CI and SDK subprocesses must agree without forwarding the whole host environment; execution never installs dependencies implicitly. Install with `pnpm install --frozen-lockfile`, then explicitly `pnpm build`. Installation must not build or configure hooks. No private registry token is required or committed.

### Local checks and debugging

Run `pnpm build`, `pnpm test`, `pnpm lint`, `pnpm exec biome check .`, `pnpm exec odsuite guard`. Use a module's standard commands for focused checks. Empty test discovery is not acceptance. Check documentation links/configuration/format/guard without adding implementation-mirror tests. Format with Biome. Optionally configure `.githooks` explicitly after building; never during installation.

Use `pnpm exec odsuite dev start|stop|status|restart`, selecting `--carrier`, `--channel`, `--namespace`; Codex stdio attaches with `dev connect`. No global bin, root shortcut or second PID/port/state registry. `status/stop` query sidecar without requiring valid current configuration. Explicitly recover interrupted authority. A successful watcher rebuild marks restart required; never claim the existing process loaded new code.

Composition assembly must consume a confirmed snapshot through the native pure compiler. Keep reusable source definitions, scoped mount identities and derived runtime IDs distinct. Validate the complete reachable graph before publishing a preview; preserve the last confirmed frame on failure. Never persist injected engines/instance markers, create physical preview copies or relax preview CSP for child fetching. Nested editing binds artifact, revision, instance, file and the complete source projection; reject late transforms after any of them change. Save shared definitions through workspace transactions, flush/confirm before navigation and preserve drafts/context on failure. Keep the global native preview and local editing clocks distinct; unresolved clock mappings are read-only.

Native appearance/animation is closed-schema film content. Motion transforms through the SDK and verifies actual source writes; workspace owns revisions/history. Submit only touched fields and preserve inherited/relative values. Explicit numeric animation conversion/separation requires fidelity evidence; dynamic or unproven source stays read-only. Preserve overall and segment easing separately. Map key progress through overall easing to real time; resizing endpoints preserves other keys' absolute times. Canvas intent is validated against frame, revision and editing context before the same save chain.

Independent fixed-rate audio source-in-point/rate/gain/mute changes use the same SDK/save chain. Validate source in-point + duration × rate against verified source length; the fixed rate is 0.1..10 and remaining-source trim is divided by that rate. Changing authored rate preserves clip start/duration and is separate from preview transport speed. Write only touched attributes, and verify rendered length/type against immutable media facts. Unproven ramped-rate, automation, effect or SDK-detected script-driven audio remains read-only.

Media links belong to one source file/composition. Aligned static PNG/WAV groups share start/duration; audio members share in-point/rate, while gain/mute and visual appearance remain individual. Validate every member before one SDK batch and one workspace save/history step. Group trim uses the shortest remaining audio window. Link/unlink/delete retries retain applied source and the same save receipt; never regenerate a group after an unknown commit. Invalid groups stay read-only until explicitly unlinked. SDK-recognized writers are the static analysis boundary; this is not proof against arbitrary author-script side effects.

Export jobs belong to render, independently of Web/HTTP/MCP connection lifetime. Daemon validates workspace ownership and freezes an explicitly selected revision; render journals intent and executes it. Retry unknown submissions with the same payload/request identity. Cancellation completes only after actual worker retirement; uncertain ownership requires explicit sidecar recovery. Public job receipts exclude paths and process authority.

Built-in templates are finite product content in `packages/templates/src/native`, not Web styles or an unrestricted asset tree. Verify source/font digests, preserve notices, require the selected contentHash and create through workspace transactions. Creation never changes selection. Daemon owns current-contract production guidance; MCP resources and authenticated HTTP return the same complete bodies and hashes. Five creative intent routes and their complete shared/quality references live in the finite apps/daemon/src/content/guidance graph. Codex local Skills derive from the same bodies with canonical/local hashes and closed relative links. Keep product operations distinct from actually available host acquisition, measurement, display and archive capabilities; Binary Prism resource/provider execution and creative/user acceptance remain explicit work rather than implied capabilities.

Generation fixes provider/version/model/prompt and the initiating project revision before external submission. Persist the submission marker before calling an adapter; uncertain acceptance never authorizes an automatic paid retry. Known remote IDs may resume observation without resubmission. Gateway candidates are persistent user output outside blob GC; completion never edits a project. Explicit adoption binds candidate identity and expected project revision in the workspace transaction, with the same receipt checked before external lookup. Quiesce producers and accepted calls outside factory stop lanes; never retire actual Uses before drain.

User media is workspace-owned persistent data, outside blob GC. Bind reads to owned immutable revision manifests; removal never erases historical bytes. Preserve import request identities and applied insertion state across unknown transport outcomes; reject old database formats without migration/reset.

Generic controls/anonymous layouts belong to components; panel registration, positions, drafts and context switching belong to Web. Preserve input DOM/focus and incomplete numeric drafts. `WebView.dispose` drains operations, revokes previews and removes listeners before reusing a root; it does not implicitly save drafts.

Real browser tests live in `apps/web/tests/browser`; carrier composition tests live in the owning carrier. Drivers and PNG comparison belong to automation. Pin Chromium, viewport, theme, fonts and native readiness. A theme round-trip is not full product parity. Install Chromium in this worktree as documented; permanent tests must cover actual behavior, rather than relying exclusively on temporary scripts.

### Lifecycle and end-to-end validation

Obtain resources through sidecar factories and hosted Context. Observe actual OS liveness; directory discovery is not proof. Compose writes in the same factory/session: same-factory reentry is allowed, cross-factory calls rejected, scoped handles expire after callbacks. Use Context.background only for initialization scheduling; quiesce drains background controllers before stop lanes. Do not acquire a competing background lane while already holding one.

Update discovers/prepares; actual lifecycle owners activate/commit. Installer owns immutable Node applications and durable selections; application composes installation and carrier registration. Retained shell-oriented runtime/distribution contracts are not a current Node update path. Blob references and actual Uses protect content until processes/documents/streams/readers drain. Unknown or failed consumers remain protected. Use Library.session when already in a lifecycle lane.

After SIGKILL, explicitly recover the whole root before binding replay. Preserve diagnostics and failed layouts; do not erase authority or infer death by elapsed time. Persistent user data and reclaimable content have separate owners.

Background validation must not focus the user's desktop or open a browser without instruction. Actual product editing/export, visual/audio acceptance, installation, network distribution and power-loss evidence remain separate.

### Builds and delivery

Suites own mechanisms; carriers wire hosts. Tools expose channel-independent version/build/package capabilities; workflows select channel and quality gates through short calls. Every deliverable carrier shares a product version; an empty skeleton is not publishable. See operations for platform/installer limitations.

CI installs with `--store-dir node_modules/.pnpm-store`; do not grant another root cache. Run all module tests serially with `pnpm -r --workspace-concurrency=1 --if-present run test`. Sidecar runs its OS-resource test files serially; concurrency contracts are exercised explicitly inside those tests. Process/network/persistence cases need justified finite budgets; do not alter product timing or GC to satisfy CI. Preserve original failed checks and exact-head evidence. Squash only after the relevant checks pass.

Silo validation uses a separate Compose project, loopback ports and retained volumes. Stop only the same project; do not use `down -v`. Packaging uses an explicit positive artifact composition. This line has no publishing workflow or automatic release; adding one requires separate authorization.
