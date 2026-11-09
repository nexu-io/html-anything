---
name: motion-design-remix
description: Adapt one of six bundled motion compositions using its MOTION_DESIGN.md, preserving timing and movement while replacing the user's copy. Use for these source-backed examples or as a concrete pattern for a reusable motion design package.
---

# Motion Design Remix

Make a new story from a motion language that already works. Choose the matching profile in `sources.json`, read its `references/<id>/MOTION_DESIGN.md`, then use the supplied source and preset. Keep the user's requested scope; the six examples are not a general video-analysis tool.

| Profile | Keep | Replace |
| --- | --- | --- |
| `ui-3d-reveal` | Tilted interface reveal and camera | Headline, document and collection copy |
| `wireframe-portal-title` | Portal, depth, camera and phase timing | Title, subtitle and dimensional phrase |
| `canopy-part-title` | Leaf sweeps, occlusion and two holds | Two headline phrases |
| `code-3d-extrude` | Extruded slab and syntax hierarchy | Displayed function and identifiers |
| `code-particle-assemble` | Seeded particle assembly | Displayed pipeline and step tokens |
| `liquid-glass-widgets` | Glass cards, meters and stagger | Labels, units and feature story |

## Adapt an example

Run from this Skill folder; choose a new output directory outside the package:

```sh
node scripts/materialize.mjs wireframe-portal-title reference /tmp/portal-reference
node scripts/materialize.mjs wireframe-portal-title remix /tmp/portal-remix
```

For the user's content, copy the profile's JSON preset outside this package, edit its replacement values, and pass that file as the fourth argument. Keep the recorded source hash and expected occurrence counts; inspect any mismatch instead of weakening the check. The helper copies a native HTML project and applies explicit substitutions. It does not parse `MOTION_DESIGN.md` or infer motion from a video.

Read `NOTICE.md` before rendering. The helper includes pinned browser scripts and fonts from vendor/ and keeps some upstream brand artwork. Copy adaptation alone does not replace that artwork. In OpenMotion, continue through the existing template workflow for preview, edits and fixed-revision MP4 export. If updating a managed project, read its current revision and use the existing project-edit contract; do not write around version protection.

## Review and share

Compare matching timestamps for motion, hierarchy and readability. Preserve the original source and put variants in new projects. Deliver the requested video plus editable source; distinguish source checks, rendered output and user visual acceptance. Consult `evidence.json` for this pack's recorded validation scope.

For a new reference video without editable source, use the host's video-analysis capabilities and the existing `motion-recreate` workflow first. Package the accepted reconstruction with its creative rules, replacement contract, source attribution and a real reference/remix comparison. Use `motion-video-to-template` when a reusable template is the requested deliverable; its `TEMPLATE.md` handoff remains unchanged. Do not claim a fixed similarity percentage or guaranteed reach.
