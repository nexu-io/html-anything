# OpenMotion — AI Cut, creators & media fact sheet

[English README](../README.md) · [中文介绍](README.zh-CN.md) · [Asset sources](readme/ASSETS.md)

This page is a source brief for creators, writers and their agents. Use it with the linked implementation documents and actual demo results. It describes the current 0.6.2 source tree; it is not a record of a public package release.

## Reusable introduction

> OpenMotion is an AI-native, open-source video editor: an open-source CapCut alternative and an open-source Claude Motion alternative. Cut with AI, preview and revise in Studio, and keep the editable project alongside your MP4. Describe what to keep, remove, reorder or emphasize; your agent works from your material, script or confirmed timecodes. The mission is to help everyone become an AI video editor, a creator and a publisher of their own stories. Motion Design MD, Skills, templates and Brandkits make that creative knowledge reusable. The application is licensed under Apache 2.0.

“AI-native CapCut alternative” is product positioning. It does not assert feature parity, access to another product's source code or measured superiority.

Editorial framing: lead with **“Cut with AI. Everyone can be a creator.”** AI editing is the central topic. Pair the **AI-native CapCut alternative** with the **open-source Claude Motion alternative**: everyday editing and motion creation serve the same goal of personal expression and publishing. Use **AI Cut** in headlines and **AI video editing** when describing the full workflow. The comparison name is **Claude Motion**. Credit Hyperframes in acknowledgments; implementation details remain available below for technical accuracy.

## Facts you can cite

| Topic | Current fact | Evidence |
| --- | --- | --- |
| Mission | Help everyone become an AI video editor and creator, express their own ideas and build a publishing practice. | [README: mission](../README.md#everyone-can-be-a-creator); product direction, not a reach guarantee. |
| AI editing | The external agent applies editing requests to the project; the user previews and refines clips, timing, text and media in Studio. | [AI Cut workflow](../README.md#ai-video-editing), [editing contract](../skills/motion-production/references/edit.md). |
| App | A standalone local application with a Studio editor, timeline and editable projects. | [Product architecture](product/architecture.md), [workspace](project-workspace.md). |
| Agent access | Five current Skills; nine public stdio MCP tools; the pinned native CLI for shell-capable hosts. | [Skills](skills.md), [MCP contract](mcp-phase1-tools.md), [native authoring](../skills/motion-production/references/native.md). |
| Clients | Codex, Claude Code and DeepSeek Harness adapters; WorkBuddy configuration with desktop validation pending; manual local stdio configuration. | [Adapters](agent-adapters.md). |
| Resources | 894 catalog entries: 3 bundled editable templates and 891 external references / registry items. | [Catalog](template-catalog.md), [source snapshot](../web/catalog/hyperframes.json). This is not a count of verified templates. |
| Creative convention | Motion MD v0.1; `MOTION_DESIGN.md` is the filename convention, with the file supplied explicitly to an agent. | [Motion MD](motion-md.md); no automatic importer, parser or validator. |
| Native source | HTML, CSS, JavaScript and media; Hyperframes 0.9.7, GSAP, a React/TypeScript Studio and a Node.js local service. | [Hyperframes integration](hyperframes.md), [package manifest](../package.json). |
| License | Apache License 2.0 for this repository; upstream and font notices retained. | [LICENSE](../LICENSE), [editor](../studio/LICENSE), [templates](../template-library/NOTICE.md). |
| Release | Source checkout and local installation/build paths; npm package publication remains disabled. | [Installation](npm-installation.md), [migration](repository-migration.md). |

## Input → Process → Output: reporting boundaries

- **Input:** local media is imported into the project. YouTube / X links are reference inputs for an agent with appropriate retrieval and media tools; the app does not include a universal downloader. Scripts, Markdown, SRT and VTT can be read by the agent; text files are supported by the project editing contract.
- **Process / AI Cut:** the agent turns editing intent into cuts, sequencing, text, motion and timing changes in a shared project. Tightening speech requires usable transcripts/timecodes or an agent that can analyze the media. There is no built-in speech-transcription or filler-detection service. Studio's configured Model Gateway can generate image/video/audio assets; generation is not one of the nine public phase-one MCP tools.
- **Output:** the current export service produces MP4 from the project's dimensions and frame rate. An agent can author portrait, landscape or square versions for different destinations. Dedicated platform export presets, direct publishing and additional video export containers are not implemented. Editable project source remains available for handoff.
- **Acceptance:** successful installation, MCP discovery, file rendering, technical verification, normal-speed viewing and user acceptance are separate results. Describe only what your demo actually checked.

## Claims awaiting evidence

“99% recreation” has no defined comparison object, benchmark set or scoring method in this repository. Do not report it as measured code similarity, visual fidelity or template coverage. “Nearly all core Claude Motion templates” likewise has no verified inventory or coverage comparison; the documented catalog provenance is Hyperframes and the individual attributed sources. Broad exposure or viral reach is a creator goal, not a promised outcome.

A future comparison should publish the reference set and versions, permissions, method, outputs, editable projects and failure cases. Planned themed collections and Motion Benchmark / Arena remain proposals.

## Reusable creative resources

The [OpenMotion Library](../library/README.md) contains five collections: optional creative Skills, template starting points, motion component recipes, `MOTION_DESIGN.md` design systems and Brandkits. Initial entries include a Brandkit preparation Skill, the three existing template links, a title-reveal recipe, Ink & Water direction and the OpenMotion Brandkit. These are source resources, not an automatic marketplace or additional verified template inventory. The five core production Skills and nine MCP tools are unchanged.

## Build a real demo

1. Follow the [source quick start](../README.md#quick-start), or the [host installer](npm-installation.md), in an isolated workspace.
2. Connect the agent and choose the bundled Product Promo example. Record the source version and environment.
3. Ask the agent to create an independent project, replace a headline, adjust its hold and open the same project in Studio.
4. Request an MP4; wait for the job and technical verification, then watch and listen to the result. Keep the editable source.
5. Show the real interaction. Label supplied screenshots as snapshots and the generated cover as brand artwork.

### Prompt: a viral-reference recreation

```text
Use motion-recreate to analyze this accessible reference and rebuild its
hook, pacing and visual structure with my own material. Keep source credits
and asset permissions. Deliver an editable project, an MP4 and a comparison
that identifies both similarities and remaining differences.
```

### Prompt: a talking-head edit

```text
Use this local recording and timed transcript. Propose a concise cut around
one main point, remove the specified irrelevant passages, add readable
titles and supporting visuals, and use my supplied music. Keep the meaning
and the speaker's intent. Preview the edit; deliver the project and MP4.
```

### Prompt: an article or introduction video

```text
Read the README, this fact sheet and the linked product documentation.
Lead with “Cut with AI. Everyone can be a creator.” Connect AI-native CapCut
and open-source Claude Motion positioning to everyday editing and motion creation.
Use Input → Process → Output: show a real editing request, the agent’s project
changes, Studio preview and a revision. Use the supplied artwork and actual UI
screenshots, with attribution.
Separate implementation, product direction and your own assessment.
Include a source-based getting-started path and the Apache 2.0 license.
Do not invent performance, coverage, adoption or audience-growth figures.
```

## Visual assets

| Asset | Intended use |
| --- | --- |
| [Cover PNG](readme/cover.png) | Full-resolution generated brand artwork. |
| [Animated cover GIF](readme/cover-motion.gif) | Short looping brand motion for a README; not a recording of product behavior. |
| [1280 × 640 social preview](readme/social-preview.jpg) | Static GitHub/social sharing cover. |
| [Workspace](readme/workspace.jpg) / [editor](readme/editor.jpg) | Actual Studio 0.6.1 demo snapshots; retain their original UI labels. |
| [Library banner](readme/library.png) / [community banner](readme/community.png) | Generated artwork in the same painterly family as the cover. |
| [Brandkit](../library/brandkits/openmotion/BRANDKIT.md) / [motion design system](../library/design-systems/ink-water/MOTION_DESIGN.md) | Reusable identity and creative direction; supply explicitly to your agent. |

See [ASSETS.md](readme/ASSETS.md) for the image prompt, animation recipe, catalog-image provenance and third-party notices. Referenced films and example brands belong to their respective creators; the application license does not relicense them.
