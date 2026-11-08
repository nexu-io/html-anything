<h1 align="center">openmotion — Make product videos in Codex</h1>

<p align="center">Give Codex a reference film, your screenshots and your launch copy.<br />
Get a video in your brand’s style, an MP4 to share and a project you can keep editing.</p>

<p align="center"><strong><a href="#start-in-codex">Try the 20-second demo in Codex</a></strong> · <a href="#made-with-openmotion">Watch three films</a> · <a href="docs/motion-md.md">Explore Motion MD</a> · <a href="docs/collections/README.md">Browse the library</a></p>

<p align="center"><a href="docs/README.zh-CN.md">简体中文</a> · <a href="https://github.com/nexu-io/html-anything/tree/legacy#readme">Original HTML Anything editor &amp; installation guide</a></p>

<p align="center"><img src="docs/readme/hero.svg" alt="openmotion for Codex. Great motion. Made yours. A reference film becomes a Motion MD brief and an editable brand video." width="100%" /></p>

openmotion is a standalone, open-source Codex plugin for motion design. Our goal is to build the best open-source alternative to Claude Motion. You can start in your own product repo. Point Codex to the screenshot you just shipped and a launch film whose pacing you love. Ask it to rebuild the reveal with your headline, colors and assets. Open the cut in Studio, give the screenshot another beat, then export an MP4. Save the shot decisions in **Motion MD** so your teammate can use the same pacing for the next release.

## Made with openmotion

### Made in Codex · 12-second product launch

[![Watch Made in Codex. Green rings frame the title, the real Studio timeline slides in, and the OpenDesign symbol closes the film.](examples/launch-in-codex/preview.gif)](examples/launch-in-codex/film.mp4)

The brief called for one real product shot. Three seconds of opening type give way to the Studio timeline, then the OpenDesign symbol signs off. To make your own cut, give Codex a screenshot from your repo and the headline from your release notes. [Watch the MP4](examples/launch-in-codex/film.mp4) · [Edit the shots and timing](examples/launch-in-codex/index.html)

### The Long Return · 11-second data story

[![Watch The Long Return. Six bars grow across a daylight chart before a second city’s line is drawn.](examples/longer-days/preview.gif)](examples/longer-days/film.mp4)

How much more daylight does Reykjavík get than Lisbon on June 1, 2026? Six monthly observations build the chart, then the answer appears: **5 hours 25 minutes**. The two cities share an axis. The figures, month labels and timing are in one editable file. [Watch the MP4](examples/longer-days/film.mp4) · [Edit the chart](examples/longer-days/index.html) · [See the source data](examples/README.md#the-long-return)

### Pick Your Cut · 9-second vertical explainer

[![Three successive frames from Pick Your Cut in its native 9:16 format. One card appears for each starting point.](examples/pick-your-cut/frames.jpg)](examples/pick-your-cut/film.mp4)

A reference clip, a template or a blank brief? Three cards enter on successive beats and stay on screen so a viewer can read the final choice on a phone. Replace the cards with the three steps of your own onboarding flow. [Watch the vertical MP4](examples/pick-your-cut/film.mp4) · [Edit the cards](examples/pick-your-cut/index.html)

All three films were exported through the plugin. Each is silent by design. [Get the source, briefs and local render instructions](examples/README.md)

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

## Bring your own project

| What you have | What to ask Codex for | What you can change next |
| --- | --- | --- |
| A reference clip and brand assets | “Keep the cut from the headline to the UI. Use our screenshot and type.” | Compare the two cuts and adjust where the reveal lands. [Recreate a reference](skills/motion-recreate/SKILL.md) |
| A template you already like | “Use the Product Promo timing. Replace the opening copy and the end card.” | Keep a fresh copy of the template for the next campaign. [Adapt a template](skills/motion-template-to-video/SKILL.md) |
| Release notes and a folder of screenshots | “Show the problem, demo the new feature, then hold on the release date.” | Review the shot sequence with Codex and refine the cut in Studio. [Direct an original film](skills/motion-director/SKILL.md) |

## Make a reference your own

In [Firecrawl’s five-second integration reveal](https://static.heygen.ai/hyperframes-oss/desktop/moments/v5/M945/clip.mp4), a headline number gives way to a lineup of integrations. To borrow that transition for your launch, open your own product repo in Codex, paste the clip link and ask:

> Keep the cut from the big number to the lineup. Use our approved launch metric, our integration icons and the colors from our brand guide. Hold the last frame long enough to read the names. Show me the original and our cut side by side.

The reference workflow reads your project assets, rebuilds the sequence and returns a comparison with the editable film. You can change the timing of the reveal while keeping the screenshots, type and copy that identify your product. [Recreation workflow](skills/motion-recreate/SKILL.md) · [Reference credit and source](docs/collections/README.md)

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
