---
name: add-byok-provider
description: Add or maintain a built-in BYOK media provider in the OpenMotion repository, including official API research, credentials, model discovery, generation adapters, editor configuration, provider references and verification. Use for contributor requests to integrate a supplier; ordinary media generation uses the existing production guidance.
---

# Add a BYOK provider

Use this repository-local contributor Skill to implement a provider through the existing `openmotion_media_use` Tool and Model Gateway. Read the checkout's `AGENTS.md` and follow its current development/PR rules. Paths below are relative to the repository root. This Skill stays in `.agents/skills/`; product guidance ships from root `skills/`.

Start with [gateway behavior](../../../docs/model-gateway.md), then inspect the current callers and the closest existing adapter. Use Atlas for a shared image/video/audio prediction API, fal for returned queue URLs, WaveSpeed for authenticated discovery, and OpenDesign for a custom HTTPS gateway. Check current code instead of copying an entire provider or its assumptions.

## Establish the provider contract

Find and read the provider's official API/model documentation. Record source links and the date checked in its reference. Establish:

- Stable provider ID, display name, key-creation URL, API origin and authentication scheme.
- Whether model discovery is public or authenticated, response fields, pagination and model-specific schema links.
- Supported image/video/audio operations, exact model IDs, required fields and sample outputs. Separate speech from music/SFX and media files from transcription, text, training or 3D results.
- Submit and poll endpoints, remote task identity, intermediate/terminal statuses, output retrieval, cancellation and idempotency semantics.
- HTTP errors versus envelope/task codes, rate limits and uncertain outcomes. A 401 alone does not prove an incorrect key; consult the provider's actual semantics.

Implement only confirmed API behavior. Do not invent a model catalogue endpoint, account entitlement, unsupported modality, remote cancellation or refund. If documentation leaves a blocking ambiguity, explain the missing contract while continuing independent work.

## Extend the existing integration

Inspect these boundaries and update the ones the provider needs:

| Boundary | Current source | Required result |
| --- | --- | --- |
| Provider identity | `shared/gateway.ts`, `gateway/catalog.ts` | Add the provider ID and label; keep shared types usable by Studio and MCP. |
| Credentials and availability | `gateway/service.ts` | Resolve the provider's environment key and service-owned saved key, retaining saved-key priority and existing save/remove semantics. A configured key enables the provider; it does not prove successful generation. |
| Model discovery | `gateway/catalog.ts`, `gateway/service.ts`, optionally `gateway/providers.ts` | Query the documented catalogue with the correct authentication. Normalize only supported media outputs; preserve pagination, caching and unavailable-catalogue warnings. Built-in fallback entries are optional examples, not a replacement for live discovery. |
| Generation | `gateway/providers.ts`, or a focused provider module | Implement `ProviderAdapter.generate` and register it in `providerAdapters`. Reuse persisted jobs, progress/remoteId, validation, downloads and project import. |
| Editor configuration | `studio/src/motion/ModelSettings.tsx` | Include the provider card with the correct key-setup/usage links. Do not let a new provider fall through to another supplier's key URL. Keep the model catalogue out of settings. OpenDesign setup is intentionally hidden. |
| Reference delivery | `shared/workflow.ts`, `server.ts`, `gateway/media-use.ts` | Register the provider document under production resources and include its HTTP reference route. Confirm inspect/reference/models accept and return the new ID. |
| User guidance | `skills/openmotion-production/references/media-providers/`, `references/materials.md` in that production Skill, relevant `docs/` | Maintain one provider reference, linked from shared material guidance and available through the Tool. |

The public Tool already covers inspect/reference/models/generate/status/cancel. Reuse those actions; a supplier does not need its own MCP Tool or distributable Skill. Preserve the existing production routes and intentional UI visibility decisions. Tool and Skill lists come from their actual registries; do not introduce fixed quantity gates.

### Request and credential boundaries

- Inject keys only inside the service. Never read a contributor's real secret file, return a key to an Agent, add credentials to model parameters, or commit them. Use synthetic credentials in fixtures.
- Use the exact model schema. Some speech models expect `text`, others `prompt`; the existing mode controls that mapping. Cloud speech additionally nests options. Check the wire body, not just the Tool arguments.
- Keep fixed provider origins where possible. Any user-configurable origin must retain existing public HTTPS/DNS validation. Validate returned task IDs/queue URLs, and never forward authorization to an unrelated output or redirect host.
- Save the remote ID before polling and distinguish accepted, processing, failed and completed outputs. Do not automatically retry a paid POST, switch paid suppliers, or create a new task after a timeout. Check the original job/history first. Local cancellation/timeouts do not prove a remote stop.
- Reuse `apiJson`, media validation and project-owned imports. Recognize their limits: current non-2xx handling omits raw provider bodies/headers, and local errors can omit task detail. Do not promise full provider diagnostics or infer a definitive cause from generic local wording.

## Write the provider reference

Create `skills/openmotion-production/references/media-providers/<provider-id>.md` and register it in the production workflow. Read one existing document, such as [Atlas](../../../skills/openmotion-production/references/media-providers/atlascloud.md), for the maintained shape; do not duplicate its supplier-specific facts.

Include key setup, authentication and model-list queries; Tool JSON templates for each supported modality; their exact HTTP endpoint/body mapping; polling/result retrieval; representative error codes with meaning, next action and retry boundaries; official source/model links and known integration limits. Distinguish Tool arguments from wire JSON, local job IDs from remote task IDs, and HTTP status from application/task codes. Mark unspecified behavior as unknown.

Keep real keys and internal/private source material out of the document. Show environment placeholders in wire examples, and direct Agents through `openmotion_media_use` so the service owns credentials. Templates do not execute paid requests by themselves. Do not add this contributor Skill to `packagedSkills`, workflow resources or host installation lists.

## Verify and hand over

Use deterministic fixtures to cover the new provider's real boundaries:

- Model discovery/authentication and normalization, including exclusion of unsupported output types.
- Public media Tool -> exact provider URL/auth/body -> original task polling -> validated project-owned file, for each implemented modality. Assert that an idempotent replay submits once.
- Rejected authentication/input and unsafe task/output destinations; errors or cancellation must not trigger another paid submission or expose a key.
- Configuration save/clear/remove, correct setup/reference links, and no model queries from the settings page.
- Reference delivery through Tool, MCP resources and HTTP, plus inclusion of the reference in distribution artifacts.

Adapt existing tests in `tests/byok.test.ts`, `studio/src/motion/ModelSettings.test.tsx`, `tests/workflow.test.ts`, `tests/npm-package.test.ts` and `tests/byok-browser.mjs`. Add assertions for observable behavior, not documentation wording. Ensure a new test file is included in the repository's explicit CI runner.

For runtime/Studio changes run `npm run check`, `npm run typecheck:studio`, `npm run build:studio` and affected deterministic/packaging checks under the pinned Node version. Use the shared browser-lock lane for real browser tests and an isolated test project/data directory. Follow `AGENTS.md` when selecting narrower checks for documentation-only work.

Review `docs/product/architecture.md` and update it only if product behavior or boundaries changed. Report implemented modalities, references, actual checks, untested live-provider behavior and remaining limits. Run real paid generation only within the user's requested scope; fixture success is not account/billing or audiovisual acceptance. Commit/push/PR/merge/publication follow the current task authorization separately.
