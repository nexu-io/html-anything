# Claude Code

Read and follow [AGENTS.md](AGENTS.md) before working in this repository. It is the shared source of instructions for all Agents.

## Branch workflow

Branch new work from the latest `main` and target all pull requests at `main`. Merge reviewed changes directly into `main` when authorized; do not use `feature/motion` as an intermediate integration branch.

## Interface styling

Follow the mandatory [shared design system rules](AGENTS.md#shared-design-system--required-for-every-agent) for every style-related change. Read [packages/design-system/README.md](packages/design-system/README.md), reuse its tokens, styles and assets, and extend the package before adding a missing reusable visual role. Feature modules must reference this source rather than maintain independent palettes or copied styles. Apply the same rule when delegating or reviewing work; authored video and domain geometry retain their own styling boundary.
For CI scope and local validation, follow [Local validation](AGENTS.md#local-validation), including the presentation-document allowlist and the full product-content gate.

## Candidate and publication controls

Follow [the release workflow manual](docs/release-workflows.md): separate manual candidate-build and npm-publication entries, plus snapshot-only recovery. Select `main` for all entries; other execution refs are rejected for new release work. Select `test` (default, DEV templates) or `stable` (prod templates). Blank test versions use short workflow-counter `test.N` numbering; stable requires an explicit new `MAJOR.MINOR.PATCH`. Keep full run/source identities in the records. Use candidate-install.md for local testing and keep results private. The publication operator enters the exact version and starts the manual workflow; no acceptance checkbox or independent approval environment is enabled. Public candidates must use an exact reviewed source SHA integrated into `main`. Scan tracked source plus the outer npm tgz and inner application; preserve the positive distribution list and licenses. Keep candidate, native registry installation, real Agent creation and human acceptance evidence separate.

Publication uses the accepted candidate bytes, never a rebuild. Test publishes under `candidate`, promotes `test` after registry propagation, archives and updates the DEV guide, then runs non-blocking Mac/Windows cold installs. Stable publishes publicly under `stage`, requires both exact prod cold installs to pass, then promotes `latest`, archives and updates the stable guide last; it preserves `test`. A stage tag does not make the package private. The existing `motion-publish-test.yml` filename remains the npm Trusted Publisher identity for both channels. Only separately authorized manual publication/recovery may receive npm OIDC or R2 credentials; consumer jobs receive neither. Archive-only work must not publish npm, move tags or access default entries. The read-only Motion installation check can recheck an exact public test or stable version independently. Never overwrite published versions, put private template payloads/internal acceptance material into public artifacts, or infer merge/publication authorization from green CI. Real prod template, Agent and audiovisual acceptance remain release responsibilities; hosted installation checks do not establish them. Skills marketplace publication, main registration, npm trust, main cutover and repository rename remain separate operations.

## UI design system and interaction feedback

Follow [the shared UI rules](AGENTS.md#ui-design-system-and-interaction-feedback) and [the design-system interaction contract](docs/design-system.md#interaction-and-feedback-contract). Transient operation results use `useToast` and `StudioToastViewport` on the floating feedback layer, including inside native dialogs; never insert success or failure notices into the content flow. Reuse semantic light/dark tokens, non-modal dropdowns, padded rounded hover states, one visible focus treatment, and shared loading/fallback geometry. Verify the actual opened states in the browser without shifting or blocking the working area.

## Product documentation

Follow the [README writing and acknowledgements rule](AGENTS.md#readme-writing-and-acknowledgements) for every README, alternative draft and translation. Keep the main narrative, headings and showcase copy focused on OpenMotion and what each example demonstrates. Put other-product comparisons, inspiration, source-product labels and upstream acknowledgements only in the final **Acknowledgements** section; do not use headings such as "From MotionGit". Preserve licenses and provenance, and keep required setup identifiers, supported agent/model names and explicitly requested example brand names accurate. Verify this placement before finishing README edits.

The design-system workbench is an independent package-owned editing surface. Keep it free of Studio and business-module imports; UI edits and Agent edits update the same design-system source. Run `npm run design:dev` to open it and `npm run design:test` for its save/conflict/independence checks.
