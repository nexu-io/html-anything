**English** · [简体中文](README.zh-CN.md) · [OpenMotion](../README.md)

# OpenMotion Library

**Share the method, the movement and the brand behind a video.** This is the repository's contribution home for reusable Skills, templates, motion components, motion design systems and Brandkits. Start with a working example or a small, well-described creative decision.

| Collection | Start here | What belongs here |
| --- | --- | --- |
| **🧠 Skills** | [Presenter Story](skills/presenter-story/SKILL.md) · [Motion Design Remix](skills/motion-design-remix/SKILL.md) · [Brandkit preparation](skills/brandkit/SKILL.md) | A focused, reusable method in `SKILL.md`, with examples and references when needed. |
| **🎞️ Templates** | [Studio starting points](templates/README.md) · [Presenter Tech](templates/presenter-tech/README.md) | A complete project, preview and adaptation instructions. |
| **🧩 Motion components** | [Title reveal recipe](components/title-reveal/README.md) | A reusable title, transition, chart or scene with a clear timing and editing contract. |
| **🎨 Motion design systems** | [Ink & Water](design-systems/ink-water/MOTION_DESIGN.md) | `MOTION_DESIGN.md`: typography, composition, pacing, movement and sound decisions. |
| **💼 Brandkits** | [OpenMotion](brandkits/openmotion/BRANDKIT.md) | Brand facts, approved copy, colors, type, asset locations and usage rules. |

```text
library/
├── skills/presenter-story/              → three presenter / motion recipes
├── skills/motion-design-remix/           → six source / remix profiles
├── skills/brandkit/SKILL.md
├── templates/presenter-tech/            → local presenter / motion package
├── templates/README.md                  → existing editable project sources
├── components/title-reveal/README.md     → motion recipe
├── design-systems/ink-water/MOTION_DESIGN.md
├── brandkits/openmotion/BRANDKIT.md
└── ENTRY_TEMPLATE.md                    → contribution checklist
```

## 🎞️ Turn a reference into a shareable Skill package

[Presenter-led examples](../docs/motion-design-examples.md#presenter-motion) connect real speech with captions, screen recordings and motion through three design recipes. Their reference/remix media are upstream demonstrations; new OpenMotion adaptations still need production and review.

[Six animated comparisons](../docs/motion-design-examples.md) show the same motion implementation with different content. Each profile includes `MOTION_DESIGN.md`, invariants and replacement rules, pinned source, a preset and actual render evidence. Contribute the method alongside the project so the next creator can adapt it.

<a id="use-a-resource"></a>

## 🚀 Use a resource

1. Choose a method, a design system or a template for your task. Read its status and source notes.
2. Give its files explicitly to your agent, together with your material and the changes you want. A Brandkit defines identity; a motion design system defines behavior; a template supplies an editable implementation.
3. Continue with the [appropriate production Skill](../docs/skills.md) when making a video. Preview, revise and export through the same project workflow.

The optional library Skills can be selected individually from this checkout:

```sh
npx skills add ./library/skills --skill brandkit
npx skills add ./library/skills --skill motion-design-remix
npx skills add ./library/skills --skill presenter-story
```

This library is browsable source today. It is not automatically imported into Studio or registered as MCP resources. The five core production Skills remain in [`skills/`](../skills/); the optional library Skills supply brand context, presenter-story design recipes or a specific source-remix method and do not add core production routes. The [Studio catalog](../docs/template-catalog.md) and [viewing references](../docs/collections/README.md) retain their existing sources and behavior.

<a id="contribute-one-useful-thing"></a>

## 🤝 Contribute one useful thing

Copy the [entry checklist](ENTRY_TEMPLATE.md) into a folder under the matching collection. Include what to use it for, editable inputs, an example, attribution, license and the checks you actually performed. Link shared source instead of copying a maintained template into a second location.

Use these status labels in the entry description:

- **Reference:** original work to study, with a source and author.
- **Recipe / draft:** written guidance that still needs project-level verification.
- **Editable example:** source is supplied; state which changes and exports were checked.

Only claim a verified template after recording the project version, adaptation, export and review evidence. A cover image or a successful installation is not that evidence.

See [Contributing](../CONTRIBUTING.md) for the PR workflow. Text and original examples follow [Apache-2.0](../LICENSE); external media and upstream projects keep their own licenses and credits.
