**English** · [简体中文](motion-md.zh-CN.md) · [OpenMotion](../README.md)

# Motion.md

**Clone the motion. Tell your story. Share the creative system.**

A great reference carries more than a color palette: a hook, a sequence of reveals, a camera move, a reading rhythm, and moments where sound makes an idea land. **`MOTION_DESIGN.md` records those decisions so an Agent can keep the motion language while making a video about something else.** A reusable Skill package adds the method, editable implementation, replacement inputs and evidence that make those decisions practical.

**Motion.md is the complete creative specification. Brand Kit is a section inside it**, alongside story, motion, sound and review rules. Record the logo, palette, typography, voice, product facts and approved assets in that section. Existing brand files can supply linked material; a separate `BRANDKIT.md` is not required as a second creative specification.

[Six reference/remix comparisons](motion-design-examples.md) · [Runnable Skill package](../library/skills/motion-design-remix/SKILL.md) · [Ink & Water system](../library/design-systems/ink-water/MOTION_DESIGN.md) · [Brandkit](../library/brandkits/openmotion/BRANDKIT.md)

**Status:** Motion.md is a v0.1 authoring proposal. Agents read the file as explicit context; there is no automatic Motion.md importer, parser, registry or cross-engine execution guarantee. The example Skill includes a source-copy helper for six specific compositions. That helper applies recorded replacements; it does not interpret Markdown or reconstruct arbitrary videos.

## 1. The reusable unit: a motion design Skill package

The goal is to turn a reference into an asset that someone else can use: **same creative structure, new subject, new copy, new brand**. A successful remake becomes the next person's starting point.

```text
REFERENCE VIDEO                                  YOUR BRIEF + MATERIAL
hook · shots · camera · rhythm · sound             copy · product · logo · voice
            |                                                 |
            v                                                 v
                    MOTION DESIGN SKILL PACKAGE
            +-------------------------------------------------+
            | SKILL.md           how to adapt and review       |
            | MOTION_DESIGN.md   what stays and why             |
            | editable source    how the motion is implemented |
            | presets + assets   what changes for this story    |
            | preview + evidence what actually worked           |
            +-------------------------------------------------+
                                  |
                                  v
                    AGENT + EDITABLE PROJECT
                    change → preview → compare → revise
                                  |
                                  v
                    NEW VIDEO + REUSABLE SOURCE
                                  |
                       share / fork / improve / review
```

“Clone” means preserving the chosen structure and motion language while adapting content. For a source-backed template, reuse the implementation. For a video-only reference, first reconstruct the shots and motion, inspect the differences, then package the accepted result. A Markdown document alone cannot guarantee identical effects; fidelity depends on source availability, assets, typography, camera, timing and the actual render.

## 2. Separate intent, procedure, implementation and proof

| Layer | Artifact | Responsibility | Example |
| --- | --- | --- | --- |
| Creative specification | `MOTION_DESIGN.md` | Brand Kit, story beats, composition, timing, movement, sound and review rules. | One design context guides the brand and the motion. |
| Brand Kit within the specification | `MOTION_DESIGN.md` → Brand Kit section | Names, facts, logo, type, palette, voice and approved material; inline or linked. | Replace the product identity without inventing claims. |
| Agent procedure | `SKILL.md` | Choose inputs, adapt, review, deliver; route only to needed instructions. | Read the portal profile; replace headline and phrase; inspect the main hold. |
| Replacement contract | Preset or parameter schema | Editable fields, limits, asset roles and missing-input behavior. | Title ≤ 18 characters; preserve scene timing. |
| Executable project | HTML/CSS/JS + assets | Geometry, animation, rendering and editable media. | The original portal implementation and native timeline. |
| Review evidence | Paired previews + revision / hashes | Which source, edits, time range and output were checked. | Original and remix rendered at matching source timestamps. |
| Distribution | Folder, Git revision, optional archive | Stable identity, complete files, provenance and licenses. | A reviewed source commit plus a named content preset. |

The existing `motion-video-to-template` workflow still uses **`TEMPLATE.md` as its single handoff document**. Link a Motion Design description when useful; do not require every existing template to adopt a second manifest. A portable folder, an Agent Skill and a `.motion` archive are related ideas with distinct contracts.

## 3. A concrete package you can inspect

The [Motion Design Remix Skill](../library/skills/motion-design-remix/SKILL.md) contains six profiles from registry resources already represented in OpenMotion's catalog:

```text
motion-design-remix/
├── SKILL.md                         agent entry: select → adapt → compare
├── references/<profile>/
│   └── MOTION_DESIGN.md              creative rules for this motion language
├── assets/<profile>/index.html      pinned upstream implementation
│   └── assets/ or lib/               fonts, textures and helpers where needed
├── presets/<profile>.json            recorded source hash + exact replacements
├── scripts/materialize.mjs           copy a source into a new project
├── previews/                        actual paired GIF / MP4 excerpts
├── sources.json                     source revision and original demo links
├── evidence.json                    render and adaptation evidence
├── NOTICE.md                        attribution and runtime requirements
└── LICENSE
```

This is an **example package layout**, not a new mandatory OpenMotion runtime format. Its six profiles do not become six new core Skills or six automatically registered Studio templates. The original three built-in templates keep their current IDs and behavior.

From this Skill folder:

```sh
node scripts/materialize.mjs wireframe-portal-title reference /tmp/portal-reference
node scripts/materialize.mjs wireframe-portal-title remix /tmp/portal-remix
```

The helper checks the source hash and replacement occurrence counts, refuses an existing destination, and writes an independent editable project plus `remix-record.json`. For your content, copy a preset, change its replacement values and supply it as the fourth argument. The materializer includes local browser scripts, fonts, textures and reference media, with no CDN/font requests; read the package's `NOTICE.md` for licenses and separately installed execution tools. This is source reuse, not a universal parameter importer.

## 4. What to write in MOTION_DESIGN.md

| Section | Write down | Make it actionable |
| --- | --- | --- |
| Identity & provenance | Name, version, reference author/URL, source revision, rights and observed status. | Link the exact original and preserve attribution. |
| Brand Kit | Brand identity, product facts, logo, colors, type, voice and approved assets. | Keep the brand rules inside the creative specification; link existing material when useful. |
| Narrative grammar | Audience, hook, reveal order, proof and closing beat. | Explain which scene carries which idea. |
| Visual hierarchy | Framing, type scale, depth, contrast, negative space and brand sources. | Identify the focal point of every major hold. |
| Timing & motion | Shot boundaries, holds, easing, camera paths, masks, transitions and continuity. | Specify relationships and source labels, not just “make it cinematic.” |
| Materials & sound | Footage, screenshots, fonts, voice/music roles, sync points and fallbacks. | Say what must be supplied and what can be generated; never invent a missing asset. |
| Invariants | The creative decisions that must survive a content change. | Keep portal timing and camera; preserve the final reading hold. |
| Replaceable inputs | Text, subjects, data, brand, aspect ratio, assets and actual capacity. | Explain overflow, longer voiceover, missing footage and layout changes. |
| Review | Matching timestamps, source/output identity, technical and visual checks. | Record observed gaps; a check heading is not proof of success. |

Ordinary Markdown remains the authoring surface. Distinguish observations from a reference, inferred creative choices and deliberate deviations. For long copy, split or redesign the affected beat instead of shrinking everything until it becomes unreadable. If changing duration, retime the dependent transition and audio anchors together.

### Example: preserve a portal, replace its story

```markdown
# Portal launch — MOTION_DESIGN.md
Version: 0.1.0
Source: pin the actual implementation and reference video here.

## Keep
Light card → expanding portal → dimensional phrase → white exit.
Keep the camera path, reveal timing, deterministic seed and easing.

## Replace
Title: OPENMOTION (maximum 18 characters in this profile).
Dimensional phrase: TELL YOUR STORY.
Subtitle: YOUR STORY. IN MOTION.

## Timing
0–0.45 s: card entrance. 0.45–2.5 s: portal reveal.
2.5–6 s: dimensional phrase. 6–8 s: push through and white exit.

## Materials and sound
Use the supplied Geist fonts and code. This example is silent.
A voice or music request is a separate input and timing decision.

## Review
Compare the card, portal handoff and phrase hold at matching times.
Check the whole phrase, camera continuity and text collisions.
Save source/preset hashes and actual output; record remaining gaps.
```

[Read the complete portal profile](../library/skills/motion-design-remix/references/wireframe-portal-title/MOTION_DESIGN.md). For a story-level brief rather than a small motion component, see the existing [product-launch Motion.md](examples/product-launch.MOTION.md).

## 5. From reference video to a community asset

```text
Discover a reference
  → analyze shots, motion, content slots and material requirements
  → reconstruct an editable project when no usable source exists
  → review reference vs reconstruction at matching timestamps
  → document the creative rules in MOTION_DESIGN.md
  → adapt to a second, meaningfully different brief
  → render reference / remix comparisons and record the evidence
  → share the Skill, project, inputs, provenance and licenses
  → fork, improve and review the next version
```

In OpenMotion today, `motion-recreate` handles reconstruction of a reference work; `motion-template-to-video` handles existing editable templates; `motion-video-to-template` produces a reusable template when that is the requested deliverable. A library Skill can carry a specific style and its adaptation method. These instructions are read by the user's Agent; there is no additional background Agent orchestrator.

A publishable example should show **what stayed, what changed and what actually rendered**. Prefer a shared-clock side-by-side comparison; list any crop, excerpt or speed change. Keep generated user projects and credentials outside the source package. A Git branch can carry a revised preset or implementation, and a PR can review both the diff and the resulting preview. Community review and manual knowledge reuse work with ordinary files today; automatic marketplace ingestion, learning from engagement and RAG retrieval remain product directions.

## Presenter-led editing: one story, two clocks

Motion Design also describes the relationship between a person, their words and the supporting visuals. The [Presenter Story Skill](../library/skills/presenter-story/SKILL.md) includes three design recipes and [attributed upstream comparisons](motion-design-examples.md#presenter-motion). Those media illustrate the patterns; they are not validation of the new recipes.

```text
Your camera take + screen recording + actual speech timing
               │
               ▼
Selected source ranges ── edit map ──► output timeline
                                      ├─ retained voice + presenter
                                      ├─ captions mapped through cuts
                                      ├─ screen / B-roll / proof cards
                                      └─ labels, callouts and motion
                                               │
                                    listen + preview + revise
                                               │
                                  editable project + exported video
```

**Source time and output time are different.** For example, retaining source seconds 12–18 at output seconds 0–6 moves an event at source second 15 to output second 3. This arithmetic example is not a measured transcript. Keep the mapping per clip, derive caption and overlay cues from actual speech evidence, and rebuild the mapping after a cut. Frame inspection alone cannot establish word timestamps.

| Layer | What Motion.md records |
| --- | --- |
| Story | Intended message, retained meaning, hook, evidence and ending. |
| Presenter | Footage identity, framing, face/gesture safe area and when to return to the person. |
| Edit map | Source ranges, output starts, transitions and the reason for each insert. |
| Captions | Transcript source, actual timing and readable placement after reframing. |
| Motion | Which spoken idea triggers a keyword, screenshot, callout or picture-in-picture change. |
| Review | Speech continuity, readable screens, unobstructed face, full-speed playback with sound. |

Replace the recording and supporting evidence along with the topic. Preserve the creator's voice and intent; a new headline over unrelated speech is not a complete remix. The recipes are explicit Agent context, not an automatic transcriber, silence detector or new timeline format. A finished reusable package still needs its own edited source, permitted assets and actual exported comparison.

## 6. MotionGit, Hypit and rea-video: what we learn

| Reference | Useful idea | OpenMotion application |
| --- | --- | --- |
| [MotionGit format](https://motiongit.com/spec) / [motion-spec](https://github.com/motiontemplates/motion-spec) | Separate template content, runtime and distribution; declare materials, parameters, dependencies and licenses. | Keep Motion.md, executable source, content inputs and evidence distinct. No `.motion` import/export compatibility is claimed. |
| [MotionGit template collection](https://github.com/motiontemplates/all) | Put a complete demo beside material requirements and usable source/package entry points. | Link each comparison to its real Skill, Motion.md and replacement preset. |
| [MotionGit Git workflow](https://motiongit.com/git) | Let editable source and revisions carry a video beyond one edit. | Fork a style, change a preset, compare the render and review the improvement. |
| [Hypit](https://github.com/hypit-ai/hypit#examples) | Demonstrate one creative structure through multiple content variants. | Explain invariants and editable slots alongside each example. |
| [rea-video](https://github.com/JuneYaooo/rea-video#remakes) | Explain how shots are made and show synchronized original/remake comparisons. | Separate reconstruction evidence from source-template adaptation evidence. |

MotionGit's published content and distribution profiles are versioned separately. `MOTION_DESIGN.md` is a readable creative specification, **not an implementation of MotionGit's `.motion` container or schema**. Mapping fields is only a possible future adapter design; compatibility needs its own implementation and tests. No upstream videos, APIs or package formats become supported merely by being referenced here.

## 7. Contribution and validation levels

| Label | Evidence required |
| --- | --- |
| Reference | Original video and traceable source. |
| Described style | Motion.md with observation/inference labels and replacement intent. |
| Editable example | Actual source and material requirements, with documented limits. |
| Rendered remix | A materially changed input, actual output and recorded source/preset/render identity. |
| Reviewed recreation | A reference comparison, explicit differences and the scope of human acceptance. |

The six bundled examples demonstrate source-backed content substitution. They do not establish an arbitrary-reference fidelity benchmark, full soundtrack matching or virality. The planned Motion Benchmark / Arena remains undecided; no similarity score or published ranking is inferred from these examples.

Contribute a real second brief and its result through the [Library checklist](../library/ENTRY_TEMPLATE.md). The strongest community asset teaches another creator how to repeat the result, including where the technique stops working.
