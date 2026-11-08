**English** · [简体中文](docs/README.zh-CN.md) · [Looking for the original HTML Anything editor?](https://github.com/nexu-io/html-anything/tree/legacy#readme)

<h1><img src="docs/readme/opendesign-symbol.svg" width="42" height="42" alt="OpenDesign" /> openmotion</h1>

**Turn a launch video you love into one for your own product, right in Codex.** openmotion is a standalone, open-source alternative to Claude Motion. Give the plugin a reference clip and the screenshots, logo and copy already in your project. Ask it to keep the rhythm of the reveal and tell your product’s story. You get an MP4 and a local project you can keep editing in Studio or in chat.

Write the reveal, camera moves and pauses into a **Motion MD** brief. Your team can use it again when the next release has a different story to tell.

**[Try the 20-second demo](#start-in-codex)** · [Watch a five-second launch reference](https://static.heygen.ai/hyperframes-oss/desktop/moments/v5/M945/clip.mp4) · [Explore the Motion MD format](docs/motion-md.md)

## Start in Codex

Try the bundled **Product Promo** with its own artwork. [How the template demo works](skills/motion-template-to-video/SKILL.md)

On macOS or Linux, use Git, Node.js 22.18+ with npm, and a Codex CLI with plugin support. MP4 export also needs Chrome or Chromium and FFmpeg with FFprobe. [Windows setup](docs/test-packages.md)

```sh
git clone --branch feature/motion --single-branch https://github.com/nexu-io/html-anything.git openmotion
cd openmotion && bash scripts/install-motion.command
```

Keep the checkout on disk. Once installed, open Codex and ask:

> Use openmotion to open a fresh copy of the 20-second Product Promo in Studio and export the MP4.

Then try one edit: **“Hold the closing title two seconds longer. Export another cut.”** You can also drag the clip edge in Studio. Both edit the same project. [Setup and first-demo guide](docs/usage.md#使用) · [Other agent setups](docs/npm-installation.md)

![Product Promo open in Studio, with its preview and editable timeline.](docs/readme/editor.jpg)

## Make a reference your own

In [Firecrawl’s five-second integration reveal](https://static.heygen.ai/hyperframes-oss/desktop/moments/v5/M945/clip.mp4), a headline number gives way to a lineup of integrations. To borrow that transition for your launch, open your own product repo in Codex, paste the clip link and ask:

> Keep the cut from the big number to the lineup. Use our approved launch metric, our integration icons and the colors from our brand guide. Hold the last frame long enough to read the names. Show me the original and our cut side by side.

The reference workflow reads your project assets, rebuilds the sequence and returns a comparison with the editable film. You can change the timing of the reveal while keeping the screenshots, type and copy that identify your product. [Recreation workflow](skills/motion-recreate/SKILL.md) · [Reference credit and source](docs/collections/README.md)

![A reference reveal adapted to a different brand, with timing cues from Motion MD.](docs/readme/hero.svg)

## Motion MD

A finished video shows *how this launch looked*. **Motion MD** records the choices you want the next launch to inherit. It’s our draft Markdown format for describing motion in terms a teammate or coding agent can use. Save it beside your brand assets and give it to Codex with the next brief.

```markdown
## Reveal
Open on one number. On the first beat, pull back to show the integrations.
Keep the camera still while the names are on screen.

## For the next launch
Keep the pullback and the reading time. Replace the metric, icons and end card.
Review the opening and closing frames beside the reference.
```

The brief travels with the project. The animation itself lives in editable HTML, CSS, JavaScript and media files. [Motion MD v0.1 proposal](docs/motion-md.md) · [Complete example brief](docs/examples/product-launch.MOTION.md)

## Motion library and collections

Browse **891 external references and registry items**, including launch clips from Pond and Firecrawl. Each reference in the [resource index](docs/collections/README.md) links to its source. For an editable starting point, open one of the **three bundled projects** in Studio.

| [Product Promo · 20s](template-library/product-promo/) | [NYT Graph · 15s](template-library/nyt-graph/) | [Decision Tree · 10s](template-library/decision-tree/) |
| --- | --- | --- |
| ![Multi-scene product reveal](template-library/product-promo/poster.jpg) | ![Annotated bar chart](template-library/nyt-graph/poster.jpg) | ![Animated decision tree](template-library/decision-tree/poster.jpg) |
| Swap the headline and end card. | Bring your own figures and labels. | Replace the question and branches. |

The library is the starting point for planned collections organized by brand, technology rankings and recent launches. The proposed **Motion Benchmark / Arena** would give different workflows the same reference and brand assets so anyone could compare timing, brand fidelity and what remains editable. [Collections roadmap](docs/collections/README.md) · [Evaluation proposal](docs/motion-md.md)

## Build and contribute

openmotion includes five creation workflows and nine MCP tools. You can adapt a template, recreate a reference or turn a video into a reusable template folder. To contribute a style, include the original source and creator, your Motion MD, a preview, the editable project and permission to share the assets. [Workflows](docs/skills.md) · [MCP tools](docs/mcp-phase1-tools.md) · [Contributing](CONTRIBUTING.md)

Install from this branch or [build the npm installer locally](docs/npm-installation.md). openmotion is licensed under [Apache-2.0](LICENSE) and uses [Hyperframes](https://github.com/heygen-com/hyperframes) for Studio and rendering. The [bundled examples](template-library/NOTICE.md), [Studio](studio/LICENSE) and [fonts](web/design-system/fonts/NOTICES.txt) carry their upstream notices.
