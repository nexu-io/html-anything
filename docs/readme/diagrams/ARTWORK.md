# README module diagrams

The main README uses three editable diagrams over the same watercolor paper as the cover. [Video workflow](creation-stack.svg) · [Motion.md](creative-context.svg) · [Local runtime](runtime-architecture.svg).

## Earlier illustrations

Three companion diagrams originally produced for the [alternative README](../../../README.REVERSE-ENGINEERING.md), generated with **built-in ImageGen** using the [README cover](https://releases.open-design.ai/open-motion/media/sha256/70a01c68511a8459661929333ee1a8751ab1bb4a4e86dd22a92f36874a32bd92.png) as the visual reference. They share its blue, turquoise, emerald, ivory and apricot brushwork, clear central space and bold black typography.

| Diagram | What it explains |
| --- | --- |
| [The video creation stack](https://releases.open-design.ai/open-motion/media/sha256/798b8eff72c77199775c140c6dedd2b8b86ca1313ca942b124bcba299cc4711c.png) | BYOA, optional BYOK media generation and Motion.md feed the full workflow: understand, code, generate, edit and render. |
| [One Motion.md](https://releases.open-design.ai/open-motion/media/sha256/08d516c2d42e696f805f1c4196e5ab8940668d99b0c56eb16b60f98076865347.png) | Brand Kit is inside the creative specification, alongside Story, Motion & Sound and Review. The agent uses this explicit context and Skills to create the editable project. |
| [The local runtime](https://releases.open-design.ai/open-motion/media/sha256/3e93e9896c3dbb930ab5492c12fdca48db226eddf881601b75400ca4011e01f0.png) | Agent and Studio entry points share the local application, project, Model Gateway and render flow. Provider credentials remain outside project files. |

These are explanatory artwork, not product screenshots or execution evidence. The text architecture and implementation references remain in the README. Motion.md is an authoring convention supplied explicitly to the agent; the illustration does not imply automatic parsing or import. Existing brand files may serve as material for its Brand Kit section.

All three PNGs are 1774 × 887 pixels. [prompts.json](prompts.json) preserves the exact generation prompts and the two connector corrections. [manifest.json](manifest.json) records the final file hashes and the style-reference hash. Future edits should use the corresponding final image and preserve the diagram's meaning, wording and cover-matched style.
