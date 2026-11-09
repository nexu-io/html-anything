# Product and lifecycle architecture

## Product purpose and current user flow

OpenMotion combines editable native motion projects, human editing and Agent access. The complete reference product lives on `feature/motion`; this independent refactor line implements a subset through shared product contracts. A user creates a session, records real instructions/messages, creates or opens its artifacts, edits native source or supported fields, previews a confirmed revision and uses persistent undo/redo. Web, HTTP and Codex MCP consume the same domain transactions. Model generation, template discovery/production, nested composition navigation/editing, broader media editing and final film export remain separate implementation and acceptance work. An engineering reference or returned URL is not evidence of a completed production workflow.

The complete product's creation guidance, template environment, eleven interface languages and editable-preview handoff must be absorbed through their actual domain owners. They must not introduce a second project store, host-resource inventory or source-of-truth timeline. Product creation and user visual acceptance remain distinct from a successful mechanism/build test.

## Four layers and dependency direction

| Layer    | Scope          | Responsibility                                                             |
| -------- | -------------- | -------------------------------------------------------------------------- |
| suites   | @odsuite/*     | Generic contracts, mechanisms, tools, resources and lifecycles             |
| carriers | @open-motion/* | Host adaptation, startup, environment collection, composition and delivery |
| apps     | @open-motion/* | Web interactions and Daemon product services                               |
| packages | @open-motion/* | Shared product domains, tokens and components                              |

All packages are private and internal dependencies are `workspace:*`. Mechanism APIs must not depend on concrete product orchestration. Carriers consume contracts and compose owners; apps and domains do not copy mechanism authority. Testkit can depend on reference applications only as validation infrastructure. The complete responsibility index is in [AGENTS](../AGENTS.md#suite-responsibility-index).

`suites/carrier` defines immutable environment facts and explicit per-composition registration/serialization. A concrete host collects platform/release/arch and runtime name/version; the registry is not process-global. Facts contain no release identity, ports, roots or PID inventory. Standalone propagates the same facts to the real Daemon and Web bootstrap and verifies the health PID/environment. Codex supplies its own host facts to the same composition. Electron remains a reference carrier and Docker a placeholder.

## Identity and system resources

Release owns product/channel/version. Sidecar owns resource factories keyed by `<channel, namespace>`. Channel is a product distribution lifecycle: `X.Y.Z` or `X.Y.Z-<channel>.N`; namespace isolates independent resource domains within a channel without creating another product version. All deliverable carriers share one version and release together; pack/pipeline separate actual carrier assembly capabilities internally.

`odsuite.yaml` defines product defaults. `protocolIdentity` computes local communication and OS application schemes; never infer channel from an arbitrary URL, port or data directory. Environment facts, release identity and OS resources must not create parallel authorities.

Processes obtain identity, ports, paths and lifecycle through sidecar. The directory records committed facts; OS observation proves liveness. Public APIs hide arg stamps, private startup protocols, stop escalation and retirement. Independent managers and managed workloads have separate identities; launcher ancestry does not authorize cross-domain takeover. Callers negotiate business communication. Inspect neither owns another inventory nor fixes business/debug protocols.

## Capsule and three update lifecycles

Capsule runs inside Electron, lives at `carriers/electron/src/capsule` and builds separately to `dist/capsule`. It has no independent sidecar service/process/domain. It owns loading before Web, IPC/local-protocol adaptation, Web/Daemon composition and leaf updates. Electron registers the channel-specific OS application scheme.

| Update tier    | Lifecycle owner                                                                                      |
| -------------- | ---------------------------------------------------------------------------------------------------- |
| Web/Daemon     | Capsule composes/drains actual leaf actors, activates, waits for readiness and commits               |
| Capsule        | Stable Electron bootstrap retires the old adapter, initializes its replacement and recovers failures |
| Electron shell | Installer drains the host, replaces it physically, confirms the new host and recovers interruptions  |

Update discovers, verifies and prepares candidates; actual owners activate/commit. Distribution metadata declares minimum compatible shell versions. Native blocking and forced-update handoff occur before incompatible content starts. Readiness requires actual execution evidence; diagnostic checkpoints are not product policy.

## Blob and persistent user data

Blob owns digest verification, typed materialization, CAS/cache, references, actual Uses, retention and GC, using sidecar-granted paths. Prepared/current/recovery references protect candidates and recovery; real processes, documents, streams and readers hold Uses until drain. Unknown or failed consumers stay protected rather than being declared dead by elapsed time.

Projects, sessions and export outputs are persistent product data and never content-GC input. Stopping a process or removing a reference does not delete transactions, installation policy/history or user content. GC requires proof of no references, no actual consumers and satisfied retention.

Compose atomic operations in the same factory/session: same-factory reentry is supported, cross-factory operations rejected and scoped handles expire after callbacks. Background controllers separate initialization scheduling from stop lanes; quiesce drains them before stopping. Do not wait for a competing background lane while holding one.

## Standalone and Codex composition

Standalone directly composes sidecar manager/factory, serve source and an independent Daemon process. It does not create Electron/Capsule actors or reuse Electron content generations as its product state. Serve sources can join an existing factory and do not own update policy.

Web reads the Daemon endpoint/capability and environment from same-origin in-memory `bootstrap.json`, or an explicitly supplied host preload. Never persist the capability into source/static content. Separate static roots from managed resource roots. Daemon listens only on a granted socket and sidecar forwards its port; persistent data is a hosted Context grant. Temporary ports/sockets retire with lifecycle.

Shutdown stops new work, drains accepted requests, releases the real Daemon and only then retires capabilities. Failed drain preserves authority and diagnostics. Startup rejects a live root; interrupted authority requires explicit recovery rather than deleting ledgers or writing carrier PID files.

Codex owns its descriptor, stdio transport and environment collection; it reuses standalone Web/Daemon and sidecar. The official MCP SDK owns protocol transport/discovery. `runtime_status` reports actual environment, health, URL and release identity. Product tools are registered by `apps/daemon/mcp` using workspace schemas; carriers do not copy domain logic. Unknown tools reject explicitly. A URL does not mean a host panel opened. EOF, protocol close and signals drain transport and the owned runtime; startup EOF must also drain.

The Codex build contains one manifest, MCP descriptor, bundled stdio/server, Web and independent Daemon. It can run without workspace/node_modules, with the shared product version. This is a Node24 closure, not proof of installation, signing, platform packaging or production generation/export. OS temporary socket bases are short, isolated by UID/root/factory/resource and recorded by sidecar; consumers never derive another authority from their own TMPDIR.

## Native editing and previews

Motion owns SDK source transforms and pinned runtime adaptation. Workspace owns persistence/revisions/history. Daemon exposes protected pure transforms and read-only previews; Web owns drafts and candidate-frame retirement. There is no preview process/port/project registry outside sidecar, and no editable physical project copy is created just to preview a confirmed snapshot. Physical engine execution will require a fixed-revision materialization contract.

External-file composition graphs belong to `packages/motion/project`. The graph resolves references relative to the declaring file inside the confirmed text snapshot and distinguishes reusable file definitions from mounted instances. Instance IDs follow SDK host-chain scopes; each instance maps to its source file, declaring host and parent. Runtime composition IDs are assigned with the pinned native compiler so repeated files, local element IDs, scoped CSS/scripts and SVG references remain isolated. Authored timing expressions are retained, not guessed into a second timeline model.

Preview opening validates and assembles the whole reachable graph before registering a candidate. The canonical pure inliner consumes only snapshot files; it has no host filesystem/network resolver and creates no physical shadow project. Compiled HTML, engine tags and instance markers remain ephemeral. Missing/unusable references, cycles, ambiguous identity, escaping references and bounded expansion failures reject the candidate; the last confirmed Web frame remains visible. The graph is capped at 128 files / 4 MiB, 256 mounted instances and 20 nested file edges, with 16 MiB of expanded source and 32 MiB of assembled HTML. Composition previews require explicit external-file boundaries; ambiguous embedded compositions are rejected. Only the entry document is a runtime preview; other snapshot files are read-only resources. Nested canvas messages carry scoped identities. Only elements belonging to the active editing instance may move; other instances and composition boundaries remain protected.

Native previews support repeated file mounts, template grandchildren, GSAP execution at distinct local times, relative SVG/CSS/JS resources, failed-candidate retention, undo, browser reload and cold carrier restoration. Motion defines the editing context from the confirmed or explicitly drafted source snapshot. Web owns the ephemeral composition stack and per-level playhead restoration. Each context identifies one mounted instance and its owning file; changing shared source updates every instance of that file through the existing workspace revision/history transaction. Navigation flushes and confirms the current draft before switching. Transform results must still match the artifact, revision, instance, file and complete source projection that produced them. Failed saves retain the current context/draft; removed instances explicitly invalidate to the root rather than selecting another mount of the same file. Browser reload starts at the root while committed files and history survive carrier restart. The canvas remains the actual global composition. Local controls map numeric one-to-one ancestor starts into global playback time and respect the intersection of instance windows. Unresolved timing expressions or unusable windows expose a read-only editing context rather than a guessed clock; direct source editing remains available. Binary media, arbitrary remote dependencies and render/export are outside this text-snapshot preview contract.

Preview documents are opaque sandbox frames restricted to their own snapshot resources. Product Web defines no inline styles or telemetry; native content is a separate closed resource contract. Product engine children disable upstream telemetry. Source editing, preview readiness, model execution, rendering, installation and user visual/audio acceptance have independent evidence boundaries.

## Development control plane

Dev owns repository configuration, managed builds/watchers and dynamic carrier adapters. CLI parses arguments; adapters are `carriers/*/src/dev.ts`. They register into the injected sidecar manager/factory and never own another authority. Build wrappers, pnpm and compiler descendants belong to a sidecar process tree. Build receipts describe results rather than serving as process inventories.

Sidecar validation runs OS-resource test files serially. Each file creates real managers, process trees, sockets and durable ledgers; unrelated fixtures must not compete against the finite runtime deadlines being verified. Tests still exercise concurrent sessions/controllers and competing lifecycle operations explicitly inside each file. This scheduling policy changes no runtime deadlines, recovery rules or assertions.

Sidecar derives manager roots from base domain/channel/namespace and observes actual control liveness. `stopManager` validates the exact witness/arg stamp and requests drain; timeout preserves authority. Explicit null environment values remove inherited options such as `ELECTRON_RUN_AS_NODE` at the shared launch boundary.

Rebuild and activation are separate: a watcher marks restart required, then explicit restart replaces the development composition. An attached Codex client's EOF closes that transport without stopping the development manager. Production Codex owns and drains its own composition.

Port grants own listeners and both ends of forwarded connections. Owners stop accepting and drain real work before releasing grants; release closes remaining transports and confirms retirement without waiting for browsers to disconnect. Normal FIN preserves buffered response data; abnormal disconnect propagates. Manager quiesce publishes stopping for hosted services while preserving factory-lane drain ordering.
