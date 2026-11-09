# OpenMotion repository guidelines

OpenMotion is a standalone npm application at the repository root. Run commands here with the Node version pinned in `.github/workflows/ci.yml`. Preserve `package-lock.json` and `scripts/runtime-lock.json`; do not introduce workspace-only dependencies. Follow the [migration guide](docs/repository-migration.md), keep user data and credentials outside the checkout, and preserve third-party licenses.

Before publishing a branch, run `npm ci`, `npm run check`, `npm run typecheck:studio`, `npm run build:studio`, affected deterministic tests and the applicable packaging/installation checks. Distinguish CI, target-machine installation, model creation and human content acceptance. This feature migration must not merge or publish packages unless separately authorized.

## Repository collaboration instructions

Keep persistent user instructions for repository work in this file, and keep `CLAUDE.md` aligned with this shared source so every Agent follows the same rules.

1. All commit messages must be in English, including both the subject and body, as well as merge and revert messages.
2. All repository collaboration content you create or update must be in English: issue and pull request titles and descriptions, comments, review summaries, discussions, and release notes. This applies even when the user's request is in another language.
3. Before committing or submitting repository content, verify that it follows these English-language requirements.

## Product architecture review

For every change, review the entire [product architecture](docs/product/architecture.md) and decide whether it still accurately describes the product. Consider positioning, core user flows, module responsibilities, dependencies, data and API boundaries, implemented capabilities, and current limitations together.

Update the architecture only when the change makes it incomplete, inaccurate, or internally inconsistent. Keep the document coherent as a whole, and adjust related usage or technical documentation only where needed for consistency. If the architecture remains accurate, leave it unchanged; documentation edits and per-change records are not required for every commit or PR.

Use the [documentation index](docs/README.md) for related topics. Distinguish implemented behavior, confirmed direction, hypotheses, and candidate designs. Preserve useful rationale and verification boundaries without inventing evidence. Check links and source references when editing documentation.

`AGENTS.md` is the shared source for all Agents; keep the `CLAUDE.md` entry aligned when these guidelines change. Distributable plugins include both entries and the approved documentation.

## Video production entry points

Choose the entry for the current intent directly. Original creation, narrative/motion/sound redesign and creative review use motion-director; existing editable-template use/adaptation uses motion-template-to-video; reference-video reconstruction of this work uses motion-recreate (read user materials, rebuild the requested film in an editable project, measure against the reference and deliver a comparison; its rules and measurer ship inside the Skill); requested reusable template production uses motion-video-to-template. [motion-production](skills/motion-production/SKILL.md) handles scoped engineering under established creative decisions, preview, technical checks, troubleshooting and export. Its existing start resource retains short navigation; it is not a mandatory router.

A directly selected specialist reads shared context and continues; do not bounce back to the production start. Small edits, audio-only changes, review-only and export-only requests resume their affected scope. Keep existing decisions and locked content. Repository development and documentation do not trigger video production.

Phase one exposes eleven motion_ Tools (nine project tools plus catalog fetch and template detail), defined in [the contract](docs/mcp-phase1-tools.md). MCP-only clients read the same guidance through resources/list and resources/read, beginning at motion://workflow/production/start or the already-selected specialist. The pinned engine guide is motion://engine/SKILL.md. The workflow-reading Tool is internal compatibility only. Follow conditional references and reuse complete document bodies. Native authoring belongs to the shared production/native guide. Technical export verification, visual quality and actual playback remain separate. See [Skill routing](docs/skills.md).


## Template production and reuse

`motion-template-to-video` implements the default template route and reuses shared context/edit and managed-project revision protection. Unchanged requests can deliver the template's existing preview; edited content or missing previews use the appropriate render/verification path. `motion-video-to-template` separately produces a portable reusable template from a video; it does not replace ordinary video recreation. Visual acceptance belongs to the user. Repository work does not invoke production Skills.
