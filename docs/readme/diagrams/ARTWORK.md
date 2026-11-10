# README module diagrams

The main README uses three editable diagrams over the same watercolor paper as the cover. [Video workflow](creation-stack.svg) · [Motion.md](creative-context.svg) · [Local runtime](runtime-architecture.svg).

## Earlier illustrations

Three companion diagrams originally produced for the [alternative README](../../../README.REVERSE-ENGINEERING.md), generated with **built-in ImageGen** using the [README cover](../cover-reverse-engineering-v2.png) as the visual reference. They share its blue, turquoise, emerald, ivory and apricot brushwork, clear central space and bold black typography.

| Diagram | What it explains |
| --- | --- |
| [The video creation stack](creation-stack-painterly.png) | BYOA, optional BYOK media generation and Motion.md feed the full workflow: understand, code, generate, edit and render. |
| [One Motion.md](creative-context-painterly.png) | Brand Kit is inside the creative specification, alongside Story, Motion & Sound and Review. The agent uses this explicit context and Skills to create the editable project. |
| [The local runtime](runtime-architecture-painterly.png) | Agent and Studio entry points share the local application, project, Model Gateway and render flow. Provider credentials remain outside project files. |

These are explanatory artwork, not product screenshots or execution evidence. The text architecture and implementation references remain in the README. Motion.md is an authoring convention supplied explicitly to the agent; the illustration does not imply automatic parsing or import. Existing brand files may serve as material for its Brand Kit section.

All three PNGs are 1774 × 887 pixels. [prompts.json](prompts.json) preserves the exact generation prompts and the two connector corrections. [manifest.json](manifest.json) records the final file hashes and the style-reference hash. Future edits should use the corresponding final image and preserve the diagram's meaning, wording and cover-matched style.
