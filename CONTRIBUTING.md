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

For published motion guidance source and locale metadata, use the [catalog contribution loop](https://github.com/nexu-io/openmotion/tree/main/library/templates/catalog#change-a-template). Stage changes before running the storage-policy check. New media needs no CMS account; maintainers prepare final media on the original PR before Squash merge.

## PR workflow

Work from the repository root; read [AGENTS.md](AGENTS.md) and the [architecture](docs/product/architecture.md). Use the pinned CI Node version. Keep `package-lock.json` and `scripts/runtime-lock.json` in sync with any intentional dependency change.

Before opening a PR, follow the [local validation guidance](AGENTS.md#local-validation) and report the checks you actually ran. Studio unit tests use `npm run test:studio`. Model creation and visual acceptance require separate evidence. Do not overwrite real user data or host configuration to test an installer.

Keep PRs focused and describe the user-visible behavior and actual validation. Discuss substantial changes in an existing issue, requirement or PR description; a separate issue is not required when the work is already defined. Review the entire product architecture for each change and update it only when needed, following the [shared guidance](AGENTS.md#product-architecture-review); documentation edits are not required in every PR. Preserve existing Git history and push follow-up commits during review; do not force-push a shared branch.

For an agent contribution: read the entry and sources, make the requested change, update the affected guide and [change record](docs/product/changes.md), run the applicable checks, and report the exact result and remaining gaps. Do not treat successful installation, technical rendering and human content acceptance as interchangeable.

Use the PR Actions summary to review new duplicate fragments and unused code or dependencies. The report is advisory. When a confirmed issue needs a separate change, link its source PR from a GitHub issue labeled `maintainability`, describe the impact, and assign an owner. Review open follow-ups in the existing engineering review. Promote repeat findings to a required check only after the rule is explicit and historical PRs show that the check detects it reliably.

Only deliberately public documentation belongs here. Do not commit credentials, internal links, private plans, workstation paths or user projects. Distribution uses the positive list in `scripts/distribution.ts`; newly shipped files require an explicit decision. Preserve all upstream attribution and license notices. Do not add telemetry or publish a package without a separate decision.

Contributions are licensed under the repository's [Apache-2.0 license](LICENSE); vendored components retain their own terms. This migration branch is for review only and must not be merged or published automatically.

## Repository media and size

Keep embedded README previews directly readable. Full videos and optional template archives use Git LFS with downloads excluded by default. Follow [storage, scoped downloads and contribution checks](docs/repository-storage.md); run `npm run storage:check` after staging. For contributed media, use the documented **Prepare PR media** Action after final review; contributors do not need upload credentials.
