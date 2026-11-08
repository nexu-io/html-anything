# Contributing to OpenMotion

[简体中文](CONTRIBUTING.zh-CN.md)

## Start with one useful contribution

Designers, creators, prompt authors and engineers are all welcome. The [OpenMotion Library](library/README.md) is the shared home for creative contributions; core production workflow changes remain in `skills/`.

| Contribution | Location | Include |
| --- | --- | --- |
| A reusable method | `library/skills/<name>/SKILL.md` | Name and description frontmatter, a clear trigger, steps and a real usage example. |
| A template | `library/templates/<name>/` | Editable source or a maintained source link, `TEMPLATE.md`, preview and adaptation checks. |
| A motion component | `library/components/<name>/` | Source or a labeled recipe, timing, inputs, editable choices and review notes. |
| A motion design system | `library/design-systems/<name>/MOTION_DESIGN.md` | Visual language, pacing, movement, sound, references and review criteria. |
| A Brandkit | `library/brandkits/<name>/BRANDKIT.md` | Confirmed facts, copy, identity, asset locations and permission notes. |
| Runtime / editor / agent support | Existing modules linked in the [architecture](docs/product/architecture.md) | A reproducible case, focused change and checks for the affected boundary. |

Use the [entry checklist](library/ENTRY_TEMPLATE.md), link the new entry from its collection, and preserve sources and licenses. Label references, recipes and editable examples accurately. Adding a folder does not register it in Studio, the MCP workflow registry or the default five-Skill installation. Packaging uses an explicit file list.

## PR workflow

Work from the repository root; read [AGENTS.md](AGENTS.md) and the [architecture](docs/product/architecture.md). Use the pinned CI Node version and `npm ci`. Keep `package-lock.json` and `scripts/runtime-lock.json` in sync with any intentional dependency change.

Before opening a PR, run `npm run check`, `npm run typecheck:studio`, `npm run build:studio` and focused deterministic tests for the changed boundary. Studio unit tests use `npm run test:studio`. Use the shared browser-lock wrapper on shared machines; model creation and visual acceptance require separate evidence. Do not overwrite real user data or host configuration to test an installer.

Keep PRs focused and describe the user-visible behavior and actual validation. Open an issue first for substantial changes. Update affected public docs in the same PR. Preserve existing Git history and push follow-up commits during review; do not force-push a shared branch.

For an agent contribution: read the entry and sources, make the requested change, update the affected guide and [change record](docs/product/changes.md), run the applicable checks, and report the exact result and remaining gaps. Do not treat successful installation, technical rendering and human content acceptance as interchangeable.

Only deliberately public documentation belongs here. Do not commit credentials, internal links, private plans, workstation paths or user projects. Distribution uses the positive list in `scripts/distribution.ts`; newly shipped files require an explicit decision. Preserve all upstream attribution and license notices. Do not add telemetry or publish a package without a separate decision.

Contributions are licensed under the repository's [Apache-2.0 license](LICENSE); vendored components retain their own terms. This migration branch is for review only and must not be merged or published automatically.
