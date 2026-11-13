# OpenMotion repository guidelines

OpenMotion is a standalone npm application at the repository root. Run commands here with the Node version pinned in `.github/workflows/ci.yml`. Preserve `package-lock.json` and `scripts/runtime-lock.json`; do not introduce workspace-only dependencies. Follow the [migration guide](docs/repository-migration.md), keep user data and credentials outside the checkout, and preserve third-party licenses.

## Local validation

Before publishing a branch, select local checks for the changed boundary. Run `npm ci` when dependencies or lockfiles change, or installed dependencies are missing or stale; otherwise reuse the existing installation.

- Runtime or Studio changes: run `npm run check`, `npm run typecheck:studio`, `npm run build:studio` and affected deterministic tests.
- Skill, contract, installer or distribution changes: run the affected deterministic and packaging/installation checks.
- Prose-only changes that do not alter those boundaries: check links and run `git diff --check`; no dependency reinstall or Studio build is required.

PR CI keeps repository policy, source scanning and release controls for every change. Only the explicit presentation-document allowlist skips Studio, rendering and package checks when installation sections and code blocks are unchanged; Skills, installation guides, examples and unknown paths retain the full gate. Maintainability analysis runs for code and configuration changes. Distinguish CI, target-machine installation, model creation and human content acceptance. This feature migration must not merge or publish packages unless separately authorized.

## Repository collaboration instructions

Keep persistent user instructions for repository work in this file, and keep `CLAUDE.md` aligned with this shared source so every Agent follows the same rules.

1. All commit messages must be in English, including both the subject and body, as well as merge and revert messages.
2. All repository collaboration content you create or update must be in English: issue and pull request titles and descriptions, comments, review summaries, discussions, and release notes. This applies even when the user's request is in another language.
3. Before committing or submitting repository content, verify that it follows these English-language requirements.
4. Branch new work from the latest `main` and target all pull requests at `main`. Merge reviewed changes directly into `main` when authorized; do not use `feature/motion` as an intermediate integration branch.

## Shared design system — required for every Agent

All Agents must use [packages/design-system](packages/design-system/README.md) for interface styling. Read that package's integration and change rules before creating or changing CSS, component appearance, themes, icons, fonts, loading states or brand assets. [docs/design-system.md](docs/design-system.md) describes the product integration; [brand guidance](packages/design-system/brand/BRANDKIT.md) governs public brand material.

1. **One maintained source.** Define shared visual decisions in `packages/design-system`: `tokens.json` owns theme values and Studio aliases; package styles own reusable controls, materials and states; package assets own icons, fonts and brand artwork. Never create a second palette, font stack or copied component recipe inside a feature module.
2. **Reference, do not duplicate.** Application modules consume the package's CSS entry points, semantic variables, generated utilities and asset exports. Use existing roles for colors, typography, spacing, radii, shadows and motion. If a needed reusable role or recipe is missing, extend the design system first and then reference it from consumers. Do not introduce literal interface colors, fallback palettes or arbitrary visual values to bypass it.
3. **Keep the boundary useful.** Features retain their layout, content, interactions and measured geometry. Domain values such as timeline coordinates, user-selected artwork colors, image pixels and authored video styles are not application-theme tokens. Do not theme project iframes, templates or third-party artwork as a side effect of changing the editor.
4. **Change the source, then generate.** Run `npm run design:tokens` after changing token values or mirrored brand assets. Do not hand-edit generated CSS or compatibility mirrors. Old entry paths may forward to the package but must not become independent implementations. Preserve upstream attribution and font licenses.
5. **Verify propagation.** For shared visual changes, check the affected surfaces together, including both themes, startup/loading, controls and dialogs, template browsing and narrow layouts where applicable. Run `npm run design:check` and the boundary-appropriate validation above. Keep automated checks, browser inspection and human visual acceptance distinct.
6. **Keep the visual workbench independent.** `npm run design:dev` launches only the package-owned workbench. Its UI and Node service may depend on design-system sources and Node built-ins, never Studio, application services, project data or business modules. UI saves and Agent edits share `tokens.json`; downstream modules consume the generated system through their normal build/refresh. Run `npm run design:test` for workbench changes.
7. **Keep every Agent aligned.** `AGENTS.md` is authoritative; `CLAUDE.md` and `cloud.md` point to this section. Include this requirement in delegated task context and code reviews. A feature-local style exception must have a concrete domain reason; an older hard-coded value elsewhere is not permission to add another one.

The package is a local source module within the standalone root npm application. Do not add workspace-only dependencies or publish it without separate authorization.

## README writing and acknowledgements

When creating or updating any README, including alternative drafts and translations, describe OpenMotion's own capabilities, workflows and the meaning of each example. Do not introduce other products as comparisons, inspiration or source labels in the main narrative, headings, feature descriptions or showcase copy. Avoid wording such as "From MotionGit", "inspired by Hypit" or "the alternative to ...".

Consolidate references to other products, upstream origins, comparisons and source acknowledgements in the final **Acknowledgements** section. Preserve required licenses, copyright notices and detailed provenance in their source files, and link them from that section. Describe external examples accurately without presenting them as OpenMotion-generated results.

Keep technical identifiers needed for setup, supported agent/model names and explicitly requested example brand names accurate; these factual labels are not invitations to add product comparisons or inspiration commentary. Before finishing a README edit, check that product-reference commentary appears only in the final acknowledgements.

## UI design system and interaction feedback

Follow [the shared design system](docs/design-system.md#interaction-and-feedback-contract) for all new or changed product UI. Reuse its components and semantic tokens in both light and dark themes; do not introduce page-specific palettes or native-looking replacement controls.

- Transient action feedback, including copy, download, save and failure notices, must use floating Toasts through the shared feedback layer. Never insert these messages below buttons or into normal document flow: showing or dismissing feedback must not move content or consume layout space.
- Reuse `useToast` and `StudioToastViewport`; native dialogs must not cover or make the feedback inert. Notices must not steal focus, block the page or create another modal. Coalesce repeated feedback and respect reduced motion.
- Use anchored, non-modal dropdowns for filtering and sorting, with immediate results, individually removable selections and a clear-all action. Do not add a confirmation dialog for routine filtering or copying an Agent instruction.
- Keep hover surfaces rounded and inset with consistent padding, align icons and chevrons, and use one focus treatment per composite control while preserving visible keyboard focus.
- Reserve geometry for slow content with shared Skeletons and poster fallbacks. Resource errors replace their reserved content and provide recovery; do not leave indefinite loading after a known failure. Stop offscreen/background video work.
- Verify actual opened menus, Toasts, loading/error states and narrow layouts in both themes. A component rendered in source is not evidence that it layers or behaves correctly in the browser.

## Product architecture review

For every change, review the entire [product architecture](docs/product/architecture.md) and decide whether it still accurately describes the product. Consider positioning, core user flows, module responsibilities, dependencies, data and API boundaries, implemented capabilities, and current limitations together.

Update the architecture only when the change makes it incomplete, inaccurate, or internally inconsistent. Keep the document coherent as a whole, and adjust related usage or technical documentation only where needed for consistency. If the architecture remains accurate, leave it unchanged; documentation edits and per-change records are not required for every commit or PR.

Use the [documentation index](docs/README.md) for related topics. Distinguish implemented behavior, confirmed direction, hypotheses, and candidate designs. Preserve useful rationale and verification boundaries without inventing evidence. Check links and source references when editing documentation.

`AGENTS.md` is the shared source for all Agents; keep the `CLAUDE.md` entry aligned when these guidelines change. Distributable plugins include both entries and the approved documentation.

## Video production entry points

Choose the entry for the current intent directly. Original creation, narrative/motion/sound redesign and creative review use openmotion-director; existing editable-template use/adaptation uses openmotion-template-to-video; reference-video reconstruction of this work uses openmotion-recreate (read user materials, rebuild the requested film in an editable project, measure the export against the reference and hand over the project open in the editor; its rules and measurer ship inside the Skill); requested reusable template production uses openmotion-video-to-template. [openmotion-production](skills/openmotion-production/SKILL.md) handles scoped engineering under established creative decisions, preview, technical checks, troubleshooting and export. Its existing start resource retains short navigation; it is not a mandatory router.

A directly selected specialist reads shared context and continues; do not bounce back to the production start. Small edits, audio-only changes, review-only and export-only requests resume their affected scope. Keep existing decisions and locked content. Repository development and documentation do not trigger video production.

Phase one exposes eleven openmotion_ Tools (nine project tools plus catalog fetch and template detail), defined in [the contract](docs/mcp-phase1-tools.md). MCP-only clients read the same guidance through resources/list and resources/read, beginning at openmotion://workflow/production/start or the already-selected specialist. The pinned engine guide is openmotion://engine/SKILL.md. The workflow-reading Tool is internal compatibility only. Follow conditional references and reuse complete document bodies. Native authoring belongs to the shared production/native guide. Technical export verification, visual quality and actual playback remain separate. See [Skill routing](docs/skills.md).


## Template production and reuse

`openmotion-template-to-video` implements the default template route and reuses shared context/edit and managed-project revision protection. Unchanged requests are delivered by opening the template in the editor; edited content is checked by playing it in the editor preview, with native snapshots only for layout; renders and exports, including of an unchanged template, happen only when the user asks for a video file. `openmotion-video-to-template` separately produces a portable reusable template from a video; it does not replace ordinary video recreation. Visual acceptance belongs to the user. Repository work does not invoke production Skills.

## Candidate and publication controls

Follow [the release workflow manual](docs/release-workflows.md): separate manual candidate-build and npm-publication entries, plus snapshot-only recovery. Select `main` for all entries; other execution refs are rejected for new release work. Select `test` (default, DEV templates) or `stable` (prod templates). Blank test versions use short workflow-counter `test.N` numbering; stable requires an explicit new `MAJOR.MINOR.PATCH`. Keep full run/source identities in the records. Use candidate-install.md for local testing and keep results private. The publication operator enters the exact version and starts the manual workflow; no acceptance checkbox or independent approval environment is enabled. Public candidates must use an exact reviewed source SHA integrated into `main`. Scan tracked source plus the outer npm tgz and inner application; preserve the positive distribution list and licenses. Keep candidate, native registry installation, real Agent creation and human acceptance evidence separate.

Publication uses the accepted candidate bytes, never a rebuild. Test publishes under `candidate`, promotes `test` after registry propagation, archives and updates the DEV guide, then runs non-blocking Mac/Windows cold installs. Stable publishes publicly under `stage`, requires both exact prod cold installs to pass, then promotes `latest`, archives and updates the stable guide last; it preserves `test`. A stage tag does not make the package private. The existing `motion-publish-test.yml` filename remains the npm Trusted Publisher identity for both channels. Only separately authorized manual publication/recovery may receive npm OIDC or R2 credentials; consumer jobs receive neither. Archive-only work must not publish npm, move tags or access default entries. The read-only Motion installation check can recheck an exact public test or stable version independently. Never overwrite published versions, put private template payloads/internal acceptance material into public artifacts, or infer merge/publication authorization from green CI. Real prod template, Agent and audiovisual acceptance remain release responsibilities; hosted installation checks do not establish them. Skills marketplace publication, main registration, npm trust, main cutover and repository rename remain separate operations.
