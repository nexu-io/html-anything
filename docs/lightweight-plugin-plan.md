# Lightweight plugin installation plan

Status: proposal for review. This change simplifies the Agent installation guide and assembles application dependencies at build time. The lightweight plugin, its launcher and marketplace publication described below are not implemented.

## Scope and current behavior

The current npm application contains Studio, MCP and five Skills. Setup already starts native video preparation in the background. New application packages include locked production runtime dependencies, so setup verifies and extracts them without running npm on the user's machine. Legacy packages retain their original dependency-installation path.

This removes client work but increases the complete npm download. It does not establish a faster cold installation. Measure the full download and first usable project before making a performance claim.

## Proposed user flow

1. Install once through the host's plugin interface. The host discovers the five Skills and MCP configuration.
2. On the first MCP launch, a lightweight entry completes protocol initialization and capability discovery independently of application downloads. It prepares the exact application version in the background. If the host launches MCP only on first use, preparation starts then, not at plugin installation.
3. Once the application is ready, the entry forwards project operations to the existing runtime. A successful real project read establishes readiness; registration and tool discovery alone do not.
4. Browser and media components continue preparing independently. Editing and ordinary preview remain available before capture/export components are ready, as in the existing application.

Measure plugin installation, first editable project and first export readiness separately. Moving waiting time to the first tool call is not sufficient evidence of an improvement.

## Package boundaries

| Artifact | Included | Kept outside |
| --- | --- | --- |
| Plugin | Five Skills and required references, host manifest, MCP configuration, small entry, exact version/hash metadata, licenses | Studio, full node_modules, media, Node and user data |
| Application | Existing runtime, prebuilt Studio, locked production dependencies, licenses | User projects, host credentials and private catalog caches |
| Native cache | Platform/hash-pinned browser and media components | User data and host configuration |

Reuse the existing application packaging and checked-download helpers. Do not create another installer or npm package name for the prototype. A compressed plugin below 1 MB is a measurement target, not an established size: the protocol entry and required references must be included in the measurement.

## Initialization and tool behavior

A resident MCP entry is proposed because a cold application download can exceed a host's initialization timeout. Extending that timeout would leave the first connection dependent on network speed.

- Initialize and discover capabilities from the bundled, versioned contract without waiting for the application or native components.
- Preserve the existing eleven Tools, argument contracts and workspace identity. Keep project logic in the existing runtime.
- Before readiness, return an explicit preparation state and recovery action. Do not return fabricated project lists or successful export results.
- Do not queue or replay writes automatically while preparing. Retry creation, edits and exports explicitly using the existing idempotency rules.
- Reject incompatible Skill, contract and application versions. Do not silently choose a moving tag or another data directory.
- Keep protocol output on stdout and diagnostics on stderr. Cached connections should not run npx or query moving tags on every launch.

Before implementing this layer, review the existing preparation-error contract and test actual host initialization deadlines. Any missing protocol behavior must be reviewed before it becomes part of the entry.

## Cache, integrity and recovery

Reuse HTTPS, fixed SHA256 identities, temporary download files, atomic completion markers and shared cache locks. Application identity includes exact version, environment, platform and hash. Share only identical public binary content; keep projects, host profiles and credentials separate. Do not switch between DEV and prod automatically.

| Condition | Proposed behavior |
| --- | --- |
| Matching application cached | Verify and reuse it without reinstalling dependencies |
| Concurrent first connections | Join the same preparation work; preserve live locks |
| Interrupted download | Expose failure and retry, retaining completed components; HTTP Range resume is not currently implemented |
| Bad hash or unsafe archive | Reject activation and retain existing working versions and projects |
| Unowned configuration | Refuse replacement under existing ownership rules |
| Cold offline connection | Report the missing application; do not claim offline creation |
| Warm offline connection | Reuse checked local binaries; remote templates and models still need their own connectivity |

Do not add unbounded retries, arbitrary rollback or another background update daemon to the first implementation.

## Updates and migration

The plugin pins the application version/hash and compatible contract. The host manages plugin updates; the entry does not follow latest/test independently. Reuse owned application and project paths rather than adopting another chat's projects.

Compatible updates preserve existing runtime negotiation, request IDs and active exports. Incompatible updates require coordinated replacement when exports have finished and the backend is idle. An older application directory does not establish data-format rollback safety.

Migration from npm installation must check duplicate Skills and MCP entries. Verify the new connection before removing an old entry, and never delete projects as part of migration. Automatic migration rules require a separate review.

## Delivery and acceptance

| Stage | Deliverable | Acceptance |
| --- | --- | --- |
| Current change | Short installation guide and build-time dependencies | New setup avoids npm; legacy setup works; invalid payloads are rejected; scans remain effective |
| Prototype | Local lightweight Codex plugin | Cold downloads do not block initialization; discovery is accurate; first project latency is measured |
| Target hosts | Fresh Mac arm64 and Windows x64 profiles | Cold/warm, concurrent, offline, corrupt-cache, upgrade and project-preservation checks |
| Plugin trial | Exact-version host candidate | Skills/Tools, reload, editor preview and technical export verified separately |
| Distribution | Host review and immutable application publication | Separate authorization and platform-specific acceptance; no inferred support for untested hosts |

Codex Desktop is the proposed first host. Other hosts retain their existing npm installation until their plugin mechanisms are independently checked. This does not change current host support.

Compare the plugin and npm paths using the same host version, machine, network and prerequisites. Separate empty caches, npm-only caches and complete runtime caches. Record at least three runs, their individual results and median. Discovering an existing installation is not a cold-install sample.

Record installation acknowledgment, MCP initialization, first editable project, export-component readiness, downloaded bytes and failures. Set public performance claims only after these measurements.

## Decisions before implementation

- Confirm Codex as the first plugin host while retaining npm for other hosts.
- Review how Tools expose application-preparation status and recovery.
- Choose an explicit Open Studio action or automatic opening after installation. Neither choice authorizes creating a project or calling a paid model.
- Set measurable size and latency acceptance thresholds after the prototype.

These decisions do not block the current guide and application-packaging changes. Lightweight plugin implementation and publication remain separate work.
