**English** · [简体中文](docs/README.zh-CN.md) · [日本語](docs/README.ja.md) · [한국어](docs/README.ko.md)

<h1 align="center">OpenMotion</h1>

<p align="center"><strong>Reverse-engineer videos in any agent.</strong></p>

<p align="center"><a href="#showcase">Examples</a> · <a href="#features">Features</a> · <a href="#technical-guide">Setup & architecture</a></p>

<picture>
  <source media="(max-width: 600px)" srcset="docs/readme/brand-hero.mobile.jpg">
  <img src="docs/readme/brand-hero.jpg" width="100%" alt="OpenMotion — Editable HTML · Open source · Local agent · BYOK · Motion.md">
</picture>

OpenMotion is an open-source video generator that runs in your local agent. Upload a reference video or paste a link to one on social media. OpenMotion breaks down the shots and recreates their timing with your own footage, logos and copy. Fine-tune the cut in Studio and export an MP4.

<a id="showcase"></a>

## Examples: originals and recreations

<a id="brand-before-after"></a> <a id="brand-film-gallery"></a>

### Brand films: five seconds, side by side

Each pair plays the same five seconds. Follow the motion on the left, then see what changes when OpenMotion uses a different subject, palette and story on the right. Open a clip to see it full size. The portrait version stacks the original above the adaptation.

<table>
<tr>
<td colspan="2" valign="top" align="center">
<div id="case-stripe"><a href="examples/brand-studies/stripe/comparison.mp4"><picture><source media="(max-width: 600px) and (prefers-reduced-motion: no-preference)" srcset="examples/brand-studies/stripe/comparison.mobile.webp"><source media="(prefers-reduced-motion: reduce)" srcset="examples/brand-studies/stripe/comparison.jpg"><img src="examples/brand-studies/stripe/comparison.webp" width="100%" alt="Stripe · Card flip → film frame"></picture></a></div>
<strong>Stripe · Card flip → film frame</strong><br>
A click, a push-in and a flip. The payment card becomes an illustrated coastal scene in a perforated film frame.<br>
<sub><a href="examples/brand-studies/stripe/comparison.mp4">Full size</a> · <a href="examples/brand-studies/stripe/comparison.mobile.mp4">Portrait MP4</a> · <a href="https://x.com/stripe/status/2049621560743608481">Original 00:21.50–00:26.50</a> · <a href="examples/brand-studies/stripe/index.html">HTML</a> · <a href="examples/brand-studies/stripe/MOTION.md">Motion.md</a></sub>
</td>
</tr>
<tr>
<td width="50%" valign="top" align="center">
<div id="case-claude"><a href="examples/brand-studies/anthropic/comparison.mp4"><picture><source media="(max-width: 600px) and (prefers-reduced-motion: no-preference)" srcset="examples/brand-studies/anthropic/comparison.mobile.webp"><source media="(prefers-reduced-motion: reduce)" srcset="examples/brand-studies/anthropic/comparison.jpg"><img src="examples/brand-studies/anthropic/comparison.webp" width="100%" alt="Claude · Settings → color palette"></picture></a></div>
<strong>Claude · Settings → color palette</strong><br>
The switches and hand-drawn circle keep time. A cobalt palette and persimmon poster change the story.<br>
<sub><a href="examples/brand-studies/anthropic/comparison.mp4">Full size</a> · <a href="examples/brand-studies/anthropic/comparison.mobile.mp4">Portrait MP4</a> · <a href="https://x.com/ClaudeDevs/status/2091953609185657251">Original 00:00–00:05</a> · <a href="examples/brand-studies/anthropic/index.html">HTML</a></sub>
</td>
<td width="50%" valign="top" align="center">
<div id="case-openai"><a href="examples/motion-studies/comparison.mp4"><picture><source media="(max-width: 600px) and (prefers-reduced-motion: no-preference)" srcset="examples/motion-studies/comparison.mobile.webp"><source media="(prefers-reduced-motion: reduce)" srcset="examples/motion-studies/comparison.jpg"><img src="examples/motion-studies/comparison.webp" width="100%" alt="OpenAI · Wireframe → edit timeline"></picture></a></div>
<strong>OpenAI · Wireframe → edit timeline</strong><br>
Five colored clips collapse into an edit point. The cut and wordmark resolve on the original beat.<br>
<sub><a href="examples/motion-studies/comparison.mp4">Full size</a> · <a href="examples/motion-studies/comparison.mobile.mp4">Portrait MP4</a> · <a href="https://x.com/OpenAI/status/2084352161404920316">Original 00:26.50–00:31.50</a> · <a href="examples/motion-studies/signoff.html">HTML</a></sub>
</td>
</tr>
<tr>
<td width="50%" valign="top" align="center">
<div id="case-kimi"><a href="examples/brand-studies/kimi/comparison.mp4"><picture><source media="(max-width: 600px) and (prefers-reduced-motion: no-preference)" srcset="examples/brand-studies/kimi/comparison.mobile.webp"><source media="(prefers-reduced-motion: reduce)" srcset="examples/brand-studies/kimi/comparison.jpg"><img src="examples/brand-studies/kimi/comparison.webp" width="100%" alt="Kimi · Magnetic field → vinyl grooves"></picture></a></div>
<strong>Kimi · Magnetic field → vinyl grooves</strong><br>
A spinning record takes the place of the field. Its grooves dissolve into a flickering sleeve title.<br>
<sub><a href="examples/brand-studies/kimi/comparison.mp4">Full size</a> · <a href="examples/brand-studies/kimi/comparison.mobile.mp4">Portrait MP4</a> · <a href="https://x.com/Kimi_Moonshot/status/2077521842080817296">Original 00:30.75–00:35.75</a> · <a href="examples/brand-studies/kimi/index.html">HTML</a></sub>
</td>
<td width="50%" valign="top" align="center">
<div id="case-deepseek"><a href="examples/brand-studies/deepseek/comparison.mp4"><picture><source media="(max-width: 600px) and (prefers-reduced-motion: no-preference)" srcset="examples/brand-studies/deepseek/comparison.mobile.webp"><source media="(prefers-reduced-motion: reduce)" srcset="examples/brand-studies/deepseek/comparison.jpg"><img src="examples/brand-studies/deepseek/comparison.webp" width="100%" alt="DeepSeek Harness · Terminal → film slate"></picture></a></div>
<strong>DeepSeek Harness · Terminal → film slate</strong><br>
The cursor types on a film slate. A warm flash carries the last keystroke into the end card.<br>
<sub><a href="examples/brand-studies/deepseek/comparison.mp4">Full size</a> · <a href="examples/brand-studies/deepseek/comparison.mobile.mp4">Portrait MP4</a> · <a href="https://x.com/DeepSeekHarness/status/2117256196227019194">Original 01:31.50–01:36.50</a> · <a href="examples/brand-studies/deepseek/index.html">HTML</a></sub>
</td>
</tr>
</table>

<details>
<summary>More brand-film references · Lovable, Kimi K3, Codex Originals and ElevenLabs</summary>

<table>
<tr>
<td width="50%" valign="top" align="center">
<a href="docs/readme/media/jake-lovable-reference.mp4"><picture><source media="(prefers-reduced-motion: reduce)" srcset="docs/readme/examples/viral-remix.jpg"><img src="docs/readme/examples/viral-remix.gif" width="440" alt="Lovable Aesthetics Update reference film"></picture></a><br>
<strong>Lovable · Aesthetics Update</strong><br>
Your next design update, with a confident product reveal.<br>
<sub>Reference · @lovable_dev</sub>
</td>
<td width="50%" valign="top" align="center">
<a href="docs/readme/media/remix-kimi-k3-reference.mp4"><picture><source media="(prefers-reduced-motion: reduce)" srcset="web/catalog/covers/ac6e14a0fadb5893534e6438.jpg"><img src="docs/readme/gallery/kimi-k3.gif" width="440" alt="Kimi K3 teaser reference film"></picture></a><br>
<strong>Kimi · K3 teaser</strong><br>
Your next release, distilled into a short, memorable teaser.<br>
<sub>Reference · @Kimi_Moonshot</sub>
</td>
</tr>
<tr>
<td width="50%" valign="top" align="center">
<a href="https://openai.com/codex-originals/"><img src="docs/readme/brand-showcase/codex-originals.webp" width="440" alt="Codex Originals: group portrait of the builders featured in OpenAI's campaign"></a><br>
<strong>OpenAI · Codex Originals</strong><br>
Put the people building with your product at the center.<br>
<sub><a href="https://openai.com/codex-originals/">Watch the official campaign ↗</a> · OpenAI · campaign still</sub>
</td>
<td width="50%" valign="top" align="center">
<a href="docs/readme/media/remix-elevenlabs-reception-reference.mp4"><picture><source media="(prefers-reduced-motion: reduce)" srcset="web/catalog/covers/bc4b8b4398d66159acd35890.jpg"><img src="docs/readme/gallery/elevenlabs-reception.gif" width="440" alt="Reception by ElevenLabs reference film"></picture></a><br>
<strong>ElevenLabs · Reception</strong><br>
Introduce a new product with a focused launch story.<br>
<sub>Reference · @ElevenLabs</sub>
</td>
</tr>
</table>

</details>

<a id="可以用它做什么"></a> <a id="what-can-you-make"></a>

### Seven ways to use OpenMotion

Choose a scenario for a sample video and a brief you can use with your own material. Cards distinguish an external reference from an OpenMotion result.

<table>
<tr>
<td width="50%" valign="top">
<strong>01 · AI talking-head edits</strong><br>
Three minutes of footage. One sharp story.
<p align="center">
<a href="library/skills/presenter-story/assets/ali-abdaal-workflow-reference.mp4"><picture>
<source media="(prefers-reduced-motion: reduce)" srcset="docs/readme/examples/talking-head.jpg">
<img src="docs/readme/examples/talking-head.gif" width="208" alt="External creative reference: Ali Abdaal · 5 tools I use every day">
</picture></a>
</p>
<sub>Reference · <a href="library/skills/presenter-story/assets/ali-abdaal-workflow-reference.mp4">Ali Abdaal · 5 tools I use every day</a></sub><br><br>
<strong>Start with</strong> · Your recording + transcript / timecodes<br>
<strong>Make it yours</strong> · A clear hook, tighter speech, captions and well-timed B-roll.<br><br>
<a href="docs/examples.md#talking-head">Copy the creative brief →</a> · <a href="docs/readme/examples/talking-head.jpg">Still preview</a>
</td>
<td width="50%" valign="top">
<strong>02 · AI recuts & revisions</strong><br>
Scattered clips become a 100-day story.
<p align="center">
<a href="docs/readme/media/hundred-days-story-reference.mp4"><picture>
<source media="(prefers-reduced-motion: reduce)" srcset="docs/readme/examples/story-recut.jpg">
<img src="docs/readme/examples/story-recut.gif" width="208" alt="External creative reference: 100 days with stickers and photo cards">
</picture></a>
</p>
<sub>Reference · <a href="https://www.instagram.com/reel/Dd6vHlQgpok/">100 days with stickers and photo cards</a></sub><br><br>
<strong>Start with</strong> · Your clips, photos, voice-over and story outline<br>
<strong>Make it yours</strong> · A personal montage with photo cutouts, chapter beats and a new pace.<br><br>
<a href="docs/examples.md#story-recut">Copy the creative brief →</a> · <a href="docs/readme/examples/story-recut.jpg">Still preview</a>
</td>
</tr>
<tr>
<td width="50%" valign="top">
<strong>03 · Product launches & demos</strong><br>
Make the feature the hero.
<p align="center">
<a href="examples/brand-studies/stripe/film.mp4"><img src="examples/brand-studies/stripe/coast.jpg" width="480" alt="OpenMotion · Coast study"></a>
</p>
<sub>OpenMotion film · <a href="#case-stripe">See the Stripe comparison</a></sub><br><br>
<strong>Start with</strong> · Product screens + feature brief + Brandkit<br>
<strong>Make it yours</strong> · A feature reveal, a focused UI demonstration and a memorable finish.<br><br>
<a href="docs/examples.md#product-launch">Copy the creative brief →</a> · <a href="examples/brand-studies/stripe/coast.jpg">Still preview</a>
</td>
<td width="50%" valign="top">
<strong>04 · Viral video recreation</strong><br>
Remix the rhythm. Make it yours.
<p align="center">
<a href="docs/readme/media/jake-lovable-reference.mp4"><picture>
<source media="(prefers-reduced-motion: reduce)" srcset="docs/readme/examples/viral-remix.jpg">
<img src="docs/readme/examples/viral-remix.gif" width="480" alt="External creative reference: Lovable: Aesthetics Update · @lovable_dev">
</picture></a>
</p>
<sub>Reference · <a href="docs/readme/media/jake-lovable-reference.mp4">Lovable: Aesthetics Update · @lovable_dev</a></sub><br><br>
<strong>Start with</strong> · A reference + your copy, visuals and brand<br>
<strong>Make it yours</strong> · A new editable cut built around the hook, typography and visual rhythm.<br><br>
<a href="docs/examples.md#viral-remix">Copy the creative brief →</a> · <a href="docs/readme/examples/viral-remix.jpg">Still preview</a>
</td>
</tr>
<tr>
<td width="50%" valign="top">
<strong>05 · Explainers & tutorials</strong><br>
One workflow. Three clear steps.
<p align="center">
<a href="docs/readme/media/remix-authorize-once-reference.mp4"><picture>
<source media="(prefers-reduced-motion: reduce)" srcset="docs/readme/examples/explainer.jpg">
<img src="docs/readme/examples/explainer.gif" width="480" alt="External creative reference: Authorize Once, Everyone Connected">
</picture></a>
</p>
<sub>Reference · <a href="docs/readme/media/remix-authorize-once-reference.mp4">Authorize Once, Everyone Connected</a></sub><br><br>
<strong>Start with</strong> · Your workflow + script + accurate UI captures<br>
<strong>Make it yours</strong> · A guided sequence with one idea per scene and purposeful callouts.<br><br>
<a href="docs/examples.md#explainer">Copy the creative brief →</a> · <a href="docs/readme/examples/explainer.jpg">Still preview</a>
</td>
<td width="50%" valign="top">
<strong>06 · Data stories & charts</strong><br>
Give every number a point.
<p align="center">
<a href="docs/readme/media/M1128-clip.mp4"><picture>
<source media="(prefers-reduced-motion: reduce)" srcset="docs/readme/examples/data-story.jpg">
<img src="docs/readme/examples/data-story.gif" width="480" alt="External creative reference: Animated comparison bars · @Vintage_god">
</picture></a>
</p>
<sub>Reference · <a href="https://x.com/Vintage_god/status/2106817967967056165">Animated comparison bars · @Vintage_god</a></sub><br><br>
<strong>Start with</strong> · Your data, units, source and conclusion<br>
<strong>Make it yours</strong> · A legible chart reveal with animated values and one clear comparison.<br><br>
<a href="docs/examples.md#data-story">Copy the creative brief →</a> · <a href="docs/readme/examples/data-story.jpg">Still preview</a>
</td>
</tr>
<tr>
<td colspan="2" valign="top">
<strong>07 · Music & art visuals</strong><br>
Give your track a visual identity.
<p align="center">
<a href="docs/readme/media/M1139-clip.mp4"><picture>
<source media="(prefers-reduced-motion: reduce)" srcset="docs/readme/examples/music-visual.jpg">
<img src="docs/readme/examples/music-visual.gif" width="480" alt="External creative reference: Lyria 3 visual sequence · @GoogleAI">
</picture></a>
</p>
<sub>Reference · <a href="https://x.com/GoogleAI/status/2024154215182926027">Lyria 3 visual sequence · @GoogleAI</a></sub><br><br>
<strong>Start with</strong> · Your audio + mood + beat markers / cue points<br>
<strong>Make it yours</strong> · Layered color, kinetic type and a visual sequence timed to your track.<br><br>
<a href="docs/examples.md#music-visual">Copy the creative brief →</a> · <a href="docs/readme/examples/music-visual.jpg">Still preview</a>
</td>
</tr>
</table>

<a id="everyone-can-be-a-creator"></a> <a id="everyone-can-be-an-ai-video-editor-everyone-can-be-a-creator"></a> <a id="人人都是自媒体"></a> <a id="creator-video-gallery"></a>

<details>
<summary>Creator references: nine presenter videos and an editable template</summary>

**A face, a voice, a story — then the motion that makes it land.** Start with these nine creator references: lessons, screen demonstrations, founder stories and product videos. Bring your own recording and borrow a structure you love. Click a preview for the full video.

<table>
<tr><th colspan="3" align="left">🎓 Teach & explain</th></tr>
<tr>
<td width="33%" valign="top" align="center">
<a href="library/skills/presenter-story/assets/careerwithriya-reference.mp4"><picture><source media="(prefers-reduced-motion: reduce)" srcset="docs/readme/people/careerwithriya.jpg"><img src="docs/readme/people/careerwithriya.gif" width="216" alt="Presenter video reference: 6 essential skills to transform your career"></picture></a><br>
<strong>6 essential skills to transform your career</strong><br>
Numbered points + kinetic keywords<br>
<sub>Reference · <a href="https://www.instagram.com/reel/Ddd57MBszhc/">@careerwithriya</a></sub>
</td>
<td width="33%" valign="top" align="center">
<a href="docs/readme/media/dan-martell-tools-reference.mp4"><picture><source media="(prefers-reduced-motion: reduce)" srcset="docs/readme/people/dan-martell-tools.jpg"><img src="docs/readme/people/dan-martell-tools.gif" width="216" alt="Presenter video reference: What's the best AI tool right now?"></picture></a><br>
<strong>What's the best AI tool right now?</strong><br>
Presenter + floating tool cards<br>
<sub>Reference · <a href="https://www.youtube.com/shorts/mk1zJd9Rm4c">Dan Martell</a></sub>
</td>
<td width="33%" valign="top" align="center">
<a href="docs/readme/media/harpercarrollai-reference.mp4"><picture><source media="(prefers-reduced-motion: reduce)" srcset="docs/readme/people/harpercarrollai.jpg"><img src="docs/readme/people/harpercarrollai.gif" width="216" alt="Presenter video reference: 10 Days of AI Basics, Day 1"></picture></a><br>
<strong>10 Days of AI Basics, Day 1</strong><br>
A personal lesson + readable captions<br>
<sub>Reference · <a href="https://www.instagram.com/reel/C4eNPF3PdpG/">@harpercarrollai</a></sub>
</td>
</tr>
<tr><th colspan="3" align="left">🖥️ Show the workflow</th></tr>
<tr>
<td width="33%" valign="top" align="center">
<a href="library/skills/presenter-story/assets/ali-abdaal-workflow-reference.mp4"><picture><source media="(prefers-reduced-motion: reduce)" srcset="docs/readme/people/ali-abdaal-workflow.jpg"><img src="docs/readme/people/ali-abdaal-workflow.gif" width="216" alt="Presenter video reference: 5 tools I use every day"></picture></a><br>
<strong>5 tools I use every day</strong><br>
Desk-side story + workflow inserts<br>
<sub>Reference · <a href="library/skills/presenter-story/assets/ali-abdaal-workflow-reference.mp4">Ali Abdaal</a></sub>
</td>
<td width="33%" valign="top" align="center">
<a href="library/skills/presenter-story/assets/john-tagudin-capso-reference.mp4"><picture><source media="(prefers-reduced-motion: reduce)" srcset="docs/readme/people/john-tagudin-capso.jpg"><img src="docs/readme/people/john-tagudin-capso.gif" width="216" alt="Presenter video reference: Tool demo with callouts"></picture></a><br>
<strong>Tool demo with callouts</strong><br>
Presenter + screens + callouts<br>
<sub>Reference · <a href="https://www.tiktok.com/@john.tagudin/video/7524883942328126728">@john.tagudin</a></sub>
</td>
<td width="33%" valign="top" align="center">
<a href="docs/readme/media/aiwithsachi-reference.mp4"><picture><source media="(prefers-reduced-motion: reduce)" srcset="docs/readme/people/aiwithsachi.jpg"><img src="docs/readme/people/aiwithsachi.gif" width="216" alt="Presenter video reference: Top 5 plugins to install in Claude"></picture></a><br>
<strong>Top 5 plugins to install in Claude</strong><br>
A spoken list + supporting screenshots<br>
<sub>Reference · <a href="https://www.instagram.com/reel/Dc7G9Pxu_1O/">@aiwithsachi</a></sub>
</td>
</tr>
<tr><th colspan="3" align="left">🎬 Tell a story, show a product</th></tr>
<tr>
<td width="33%" valign="top" align="center">
<a href="docs/readme/media/khris-sheer-founder-reference.mp4"><picture><source media="(prefers-reduced-motion: reduce)" srcset="docs/readme/people/khris-sheer-founder.jpg"><img src="docs/readme/people/khris-sheer-founder.gif" width="216" alt="Presenter video reference: The Founder Experiments, Ep. 1"></picture></a><br>
<strong>The Founder Experiments, Ep. 1</strong><br>
Founder diary + everyday B-roll<br>
<sub>Reference · <a href="https://www.tiktok.com/@khris.sheer/video/7491715587895430402">@khris.sheer</a></sub>
</td>
<td width="33%" valign="top" align="center">
<a href="docs/readme/media/ugc-rachelll-reference.mp4"><picture><source media="(prefers-reduced-motion: reduce)" srcset="docs/readme/people/ugc-rachelll.jpg"><img src="docs/readme/people/ugc-rachelll.gif" width="216" alt="Presenter video reference: AI creator with product"></picture></a><br>
<strong>AI creator with product</strong><br>
Product story + proof + picture-in-picture<br>
<sub>Reference · <a href="https://www.tiktok.com/@ugc.rachelll/video/7616996050066345246">@ugc.rachelll</a></sub>
</td>
<td width="33%" valign="top" align="center">
<a href="docs/readme/media/kevinstratvert-reference.mp4"><picture><source media="(prefers-reduced-motion: reduce)" srcset="docs/readme/people/kevinstratvert.jpg"><img src="docs/readme/people/kevinstratvert.gif" width="216" alt="Presenter video reference: Stop Paying for 5 AI Tools"></picture></a><br>
<strong>Stop Paying for 5 AI Tools</strong><br>
Product tutorial + live demonstration<br>
<sub>Reference · <a href="https://www.youtube.com/shorts/1fA5j5_5TRY">Kevin Stratvert</a></sub>
</td>
</tr>
</table>

**Make a video in this direction:** your presenter, your story, your product. Ask for a similar hook, caption rhythm or screen reveal, and let the agent adapt it to your material. [Presenter Story Skill](library/skills/presenter-story/SKILL.md) · [Reference credits](docs/readme/media/manifest.json)

#### 🎙️ Your next presenter-led explainer

<details>
<summary>Open the editable presenter template</summary>

<a href="library/templates/presenter-tech/README.md"><picture><source media="(prefers-reduced-motion: reduce)" srcset="docs/readme/people/motiongit-kinetic.jpg"><img src="docs/readme/people/motiongit-kinetic.gif" width="640" alt="Presenter Tech template demo with presenter window, diagrams and animated typography"></picture></a>

**Presenter-led stories × metallic type × animated explanations.** Bring your recording, copy, screenshots and captions. Editable source, parameters, fonts, sound recipes and a local runner are packaged in OpenMotion Library, ready for your Agent to adapt using the production guide. **1920 × 1080 · 60 fps · landscape.**

[Get the template package](library/templates/presenter-tech/presenter-tech.motion) · [Production guide](library/templates/presenter-tech/TEMPLATE.md) · [Motion.md](library/templates/presenter-tech/MOTION_DESIGN.md)

</details>

</details>

<a id="presenter-motion"></a>

<details>
<summary>Three presenter adaptations: reference and result</summary>

These pairs show an original reference and an external adaptation as silent excerpts. Explore a direction for your own recording, then use the linked design recipe to guide your agent.

#### Teach with a face, a keyword and a visual example

**Career advice → video-production explainer**

<table>
<tr><th width="50%">Reference · @careerwithriya</th><th width="50%">Adaptation · external example</th></tr>
<tr><td colspan="2" align="center"><picture><source media="(prefers-reduced-motion: reduce)" srcset="docs/readme/people/careerwithriya-comparison.jpg"><img src="docs/readme/people/careerwithriya-comparison.gif" width="576" alt="Original presenter video and upstream remix with different presenter and content"></picture></td></tr>
</table>

**Reuse:** Numbered ideas, presenter-led delivery and proof cards. **Make it yours:** Creator, spoken topic, keywords and supporting examples.

[Motion.md](library/skills/presenter-story/references/presenter-listicle/MOTION_DESIGN.md) · [Skill](library/skills/presenter-story/SKILL.md) · [Original](library/skills/presenter-story/assets/careerwithriya-reference.mp4) · [Full adaptation](library/skills/presenter-story/assets/careerwithriya-result.mp4)

#### Show the workflow while you tell the story

**Everyday tools → a design-workspace story**

<table>
<tr><th width="50%">Reference · Ali Abdaal</th><th width="50%">Adaptation · external example</th></tr>
<tr><td colspan="2" align="center"><picture><source media="(prefers-reduced-motion: reduce)" srcset="docs/readme/people/ali-abdaal-workflow-comparison.jpg"><img src="docs/readme/people/ali-abdaal-workflow-comparison.gif" width="576" alt="Original presenter video and upstream remix with different presenter and content"></picture></td></tr>
</table>

**Reuse:** Presenter / screen rhythm, quiet captions and readable inserts. **Make it yours:** Your recording, your workflow and your screen captures.

[Motion.md](library/skills/presenter-story/references/workflow-demo/MOTION_DESIGN.md) · [Skill](library/skills/presenter-story/SKILL.md) · [Original](library/skills/presenter-story/assets/ali-abdaal-workflow-reference.mp4) · [Full adaptation](library/skills/presenter-story/assets/ali-abdaal-workflow-result.mp4)

#### Put the presenter and the product in one story

**Tool demo → video-editor walkthrough**

<table>
<tr><th width="50%">Reference · @john.tagudin</th><th width="50%">Adaptation · external example</th></tr>
<tr><td colspan="2" align="center"><picture><source media="(prefers-reduced-motion: reduce)" srcset="docs/readme/people/john-tagudin-capso-comparison.jpg"><img src="docs/readme/people/john-tagudin-capso-comparison.gif" width="576" alt="Original presenter video and upstream remix with different presenter and content"></picture></td></tr>
</table>

**Reuse:** Hook, picture-in-picture, callouts and a visible result. **Make it yours:** Product, presenter, demonstration and closing message.

[Motion.md](library/skills/presenter-story/references/product-walkthrough/MOTION_DESIGN.md) · [Skill](library/skills/presenter-story/SKILL.md) · [Original](library/skills/presenter-story/assets/john-tagudin-capso-reference.mp4) · [Full adaptation](library/skills/presenter-story/assets/john-tagudin-capso-result.mp4)

> Use my camera and screen recordings with this structure. Keep my voice, edit around the actual speech and align captions. Use screenshots, picture-in-picture and motion to explain each point. Show a preview with sound, then deliver the editable project and MP4.

</details>

<a id="see-the-motion-survive-a-new-brand"></a>

<details>
<summary>Six editable motion studies</summary>

The paired previews show the original source and a content adaptation at matching timestamps. They are silent excerpts rendered from the same implementation.

#### Wireframe portal · BREAKTHROUGH → OPENMOTION

<table>
<tr><th width="50%">Reference · original content</th><th width="50%">Remix · Skill package adaptation</th></tr>
<tr><td colspan="2"><a href="library/skills/motion-design-remix/previews/wireframe-portal-title.mp4"><picture><source media="(prefers-reduced-motion: reduce)" srcset="library/skills/motion-design-remix/previews/wireframe-portal-title.jpg"><img src="library/skills/motion-design-remix/previews/wireframe-portal-title.gif" width="100%" alt="Wireframe portal: synchronized original on the left and changed content on the right"></picture></a></td></tr>
</table>

**Keep: Portal timing, dimensional lettering and camera push.** **Replace: Title, subtitle and the 3D phrase.**

[Motion.md](library/skills/motion-design-remix/references/wireframe-portal-title/MOTION_DESIGN.md) · [Skill](library/skills/motion-design-remix/SKILL.md) · [Content preset](library/skills/motion-design-remix/presets/wireframe-portal-title.json) · [MP4](library/skills/motion-design-remix/previews/wireframe-portal-title.mp4)

#### Canopy typography · Understory → OpenMotion

<table>
<tr><th width="50%">Reference · original content</th><th width="50%">Remix · Skill package adaptation</th></tr>
<tr><td colspan="2"><a href="library/skills/motion-design-remix/previews/canopy-part-title.mp4"><picture><source media="(prefers-reduced-motion: reduce)" srcset="library/skills/motion-design-remix/previews/canopy-part-title.jpg"><img src="library/skills/motion-design-remix/previews/canopy-part-title.gif" width="100%" alt="Canopy typography: synchronized original on the left and changed content on the right"></picture></a></td></tr>
</table>

**Keep: Leaf sweeps, depth, occlusion and reading holds.** **Replace: Two brand headlines.**

[Motion.md](library/skills/motion-design-remix/references/canopy-part-title/MOTION_DESIGN.md) · [Skill](library/skills/motion-design-remix/SKILL.md) · [Content preset](library/skills/motion-design-remix/presets/canopy-part-title.json) · [MP4](library/skills/motion-design-remix/previews/canopy-part-title.mp4)

#### Interface reveal · Product tour → AI editing story

<table>
<tr><th width="50%">Reference · original content</th><th width="50%">Remix · Skill package adaptation</th></tr>
<tr><td colspan="2"><a href="library/skills/motion-design-remix/previews/ui-3d-reveal.mp4"><picture><source media="(prefers-reduced-motion: reduce)" srcset="library/skills/motion-design-remix/previews/ui-3d-reveal.jpg"><img src="library/skills/motion-design-remix/previews/ui-3d-reveal.gif" width="100%" alt="Interface reveal: synchronized original on the left and changed content on the right"></picture></a></td></tr>
</table>

**Keep: Tilted canvas, depth hierarchy and continuous camera.** **Replace: Hero headline, document and community copy.**

[Motion.md](library/skills/motion-design-remix/references/ui-3d-reveal/MOTION_DESIGN.md) · [Skill](library/skills/motion-design-remix/SKILL.md) · [Content preset](library/skills/motion-design-remix/presets/ui-3d-reveal.json) · [MP4](library/skills/motion-design-remix/previews/ui-3d-reveal.mp4)

#### Dimensional code · loadConfig() → cutVideo()

<table>
<tr><th width="50%">Reference · original content</th><th width="50%">Remix · Skill package adaptation</th></tr>
<tr><td colspan="2"><a href="library/skills/motion-design-remix/previews/code-3d-extrude.mp4"><picture><source media="(prefers-reduced-motion: reduce)" srcset="library/skills/motion-design-remix/previews/code-3d-extrude.jpg"><img src="library/skills/motion-design-remix/previews/code-3d-extrude.gif" width="100%" alt="Dimensional code: synchronized original on the left and changed content on the right"></picture></a></td></tr>
</table>

**Keep: Extruded slab, syntax colors and the camera move.** **Replace: Function, variables and displayed calls.**

[Motion.md](library/skills/motion-design-remix/references/code-3d-extrude/MOTION_DESIGN.md) · [Skill](library/skills/motion-design-remix/SKILL.md) · [Content preset](library/skills/motion-design-remix/presets/code-3d-extrude.json) · [MP4](library/skills/motion-design-remix/previews/code-3d-extrude.mp4)

#### Particle assembly · parse / optimize / emit → select / trim / render

<table>
<tr><th width="50%">Reference · original content</th><th width="50%">Remix · Skill package adaptation</th></tr>
<tr><td colspan="2"><a href="library/skills/motion-design-remix/previews/code-particle-assemble.mp4"><picture><source media="(prefers-reduced-motion: reduce)" srcset="library/skills/motion-design-remix/previews/code-particle-assemble.jpg"><img src="library/skills/motion-design-remix/previews/code-particle-assemble.gif" width="100%" alt="Particle assembly: synchronized original on the left and changed content on the right"></picture></a></td></tr>
</table>

**Keep: Seeded particle motion and assembly rhythm.** **Replace: Pipeline name and steps.**

[Motion.md](library/skills/motion-design-remix/references/code-particle-assemble/MOTION_DESIGN.md) · [Skill](library/skills/motion-design-remix/SKILL.md) · [Content preset](library/skills/motion-design-remix/presets/code-particle-assemble.json) · [MP4](library/skills/motion-design-remix/previews/code-particle-assemble.mp4)

#### Glass information cards · Device widgets → creator workspace

<table>
<tr><th width="50%">Reference · original content</th><th width="50%">Remix · Skill package adaptation</th></tr>
<tr><td colspan="2"><a href="library/skills/motion-design-remix/previews/liquid-glass-widgets.mp4"><picture><source media="(prefers-reduced-motion: reduce)" srcset="library/skills/motion-design-remix/previews/liquid-glass-widgets.jpg"><img src="library/skills/motion-design-remix/previews/liquid-glass-widgets.gif" width="100%" alt="Glass information cards: synchronized original on the left and changed content on the right"></picture></a></td></tr>
</table>

**Keep: Glass treatment, card hierarchy, stagger and meters.** **Replace: Labels, units and feature story.**

[Motion.md](library/skills/motion-design-remix/references/liquid-glass-widgets/MOTION_DESIGN.md) · [Skill](library/skills/motion-design-remix/SKILL.md) · [Content preset](library/skills/motion-design-remix/presets/liquid-glass-widgets.json) · [MP4](library/skills/motion-design-remix/previews/liquid-glass-widgets.mp4)

For a video-only reference, use the separate [recreation workflow](skills/motion-recreate/SKILL.md) to rebuild and compare the film. Fidelity is reviewed against the selected reference and your brief.

</details>

<details>
<summary>Two mixed-media references: live footage, generated characters and code</summary>

A strong video can mix production methods. These external case studies are useful references for deciding what to film, what to generate and what to express in code.

<table>
<tr>
<td width="50%" valign="top" align="center">
<a href="docs/readme/brand-showcase/rea-unboxing.mp4"><picture><source media="(prefers-reduced-motion: reduce)" srcset="docs/readme/brand-showcase/rea-unboxing.jpg"><img src="docs/readme/brand-showcase/rea-unboxing.gif" width="250" alt="Live-action product unboxing reference"></picture></a><br>
<strong>A real product, a tactile story</strong><br>
Study close-ups, hand movement and the reveal; film your own product.<br>
<sub>Live footage · product unboxing</sub>
</td>
<td width="50%" valign="top" align="center">
<a href="docs/readme/brand-showcase/rea-dual-role.mp4"><picture><source media="(prefers-reduced-motion: reduce)" srcset="docs/readme/brand-showcase/rea-dual-role.jpg"><img src="docs/readme/brand-showcase/rea-dual-role.gif" width="250" alt="Mixed-production reference with AI characters, coded interface and screen footage"></picture></a><br>
<strong>Characters meet the interface</strong><br>
Combine a character-led hook with UI motion and screen footage.<br>
<sub>AI characters + code + screen recording</sub>
</td>
</tr>
</table>

</details>

<a id="features"></a>

## Core features

<a id="what-is-openmotion"></a> <a id="openmotion-是什么"></a> <a id="video-is-code"></a>

### 1. OpenDesign’s first full-stack agentic video generator

**Generate, edit and render video in HTML.** Your agent writes the shots, sets transitions and times the sound in one project. Open that same project in Studio to adjust a single cut, then render a new MP4 without rebuilding the rest of the film.

<a id="bring-your-agent-and-keys"></a>

### 2. Free and open source. Use your local agent and bring your own keys.

OpenMotion has adapters for **Codex, Claude Code, DeepSeek Harness and WorkBuddy**. Bring your own credentials at every layer, from the agent to each media provider. OpenMotion charges no subscription or render fees; external providers bill you directly for any usage.

<p><img src="docs/readme/agents/codex-badge.svg" width="144" alt="Codex">
<img src="docs/readme/agents/claude-code-badge.svg" width="144" alt="Claude Code">
<img src="docs/readme/agents/deepseek-harness-badge.svg" width="144" alt="DeepSeek Harness">
<img src="docs/readme/agents/workbuddy-badge.svg" width="144" alt="WorkBuddy"></p>

[Agent setup and compatibility](docs/agent-adapters.md)

<a id="make-your-motion-language-reusable"></a> <a id="motion-design-community"></a>

### 3. Motion.md: the first open-source collection is planned for 100+ brands

OpenMotion introduces **Motion.md**, a Markdown format for a film’s shot order, timing, transitions and replaceable assets. In the [Stripe example](examples/brand-studies/stripe/MOTION.md), the flip stays on the same beat while a payment card becomes a film frame.

<a id="resources-to-start-from"></a>

**891 creative resources** in the [library](docs/collections/README.md): 42 reference films, 393 motion clips, 210 blocks, 238 components and 8 examples. Use them to find a starting point for your own Motion.md.

<a id="motion-gallery"></a>

<details>
<summary>Browse editable templates and 18 catalog picks</summary>

![OpenMotion Library: Skills, templates, motion components, design systems and Brandkits.](docs/readme/library.png)

#### Open an editable starting point

| [Product Promo · 20s](template-library/product-promo/) | [NYT Graph · 15s](template-library/nyt-graph/) | [Decision Tree · 10s](template-library/decision-tree/) |
| --- | --- | --- |
| ![Product Promo preview](template-library/product-promo/poster.jpg) | ![NYT Graph preview](template-library/nyt-graph/poster.jpg) | ![Decision Tree preview](template-library/decision-tree/poster.jpg) |
| Your headline, product and end card | Your figures, units and comparison | Your question, branches and answer |

<table>
<tr><th colspan="3" align="left">📱 Product & interface</th></tr>
<tr>
<td width="33%" valign="top">
<a href="docs/readme/media/app-showcase.mp4"><picture><source media="(prefers-reduced-motion: reduce)" srcset="web/catalog/covers/51a2d141e18e608cc11b9256.jpg"><img src="docs/readme/gallery/app-showcase.gif" width="300" alt="Animated catalog preview: App Showcase"></picture></a><br>
<strong>App Showcase</strong><br>
<sub>Component · <a href="library/components/showcase/README.md">View component</a></sub>
</td>
<td width="33%" valign="top">
<a href="template-library/product-promo/index.html"><img src="template-library/product-promo/poster.jpg" width="300" alt="Product Promo"></a><br>
<strong>Product Promo</strong><br>
<sub>Editable template · <a href="template-library/product-promo/index.html">HTML</a></sub>
</td>
<td width="33%" valign="top">
<a href="library/skills/motion-design-remix/assets/ui-3d-reveal/reference.mp4"><picture><source media="(prefers-reduced-motion: reduce)" srcset="web/catalog/covers/c13d0082838675f088ecadcd.jpg"><img src="docs/readme/gallery/ui-3d-reveal.gif" width="300" alt="Animated catalog preview: 3D UI Reveal"></picture></a><br>
<strong>3D UI Reveal</strong><br>
<sub>Component · <a href="library/skills/motion-design-remix/references/ui-3d-reveal/MOTION_DESIGN.md">View component</a></sub>
</td>
</tr>
<tr><th colspan="3" align="left">🚀 Brand & launch films</th></tr>
<tr>
<td width="33%" valign="top">
<a href="docs/readme/media/jake-pond-reference.mp4"><picture><source media="(prefers-reduced-motion: reduce)" srcset="web/catalog/covers/66ac2f8b58e55670971ae70c.jpg"><img src="docs/readme/gallery/pond.gif" width="300" alt="Animated catalog preview: Pond: a new Linux OS"></picture></a><br>
<strong>Pond: a new Linux OS</strong><br>
<sub>Reference · <a href="docs/readme/media/jake-pond-reference.mp4">@bflycomputer</a></sub>
</td>
<td width="33%" valign="top">
<a href="docs/readme/media/remix-kimi-k3-reference.mp4"><picture><source media="(prefers-reduced-motion: reduce)" srcset="web/catalog/covers/ac6e14a0fadb5893534e6438.jpg"><img src="docs/readme/gallery/kimi-k3.gif" width="300" alt="Animated catalog preview: Kimi K3 teaser"></picture></a><br>
<strong>Kimi K3 teaser</strong><br>
<sub>Reference · <a href="docs/readme/media/remix-kimi-k3-reference.mp4">@Kimi_Moonshot</a></sub>
</td>
<td width="33%" valign="top">
<a href="docs/readme/media/remix-elevenlabs-reception-reference.mp4"><picture><source media="(prefers-reduced-motion: reduce)" srcset="web/catalog/covers/bc4b8b4398d66159acd35890.jpg"><img src="docs/readme/gallery/elevenlabs-reception.gif" width="300" alt="Animated catalog preview: Reception by ElevenLabs"></picture></a><br>
<strong>Reception by ElevenLabs</strong><br>
<sub>Reference · <a href="docs/readme/media/remix-elevenlabs-reception-reference.mp4">@ElevenLabs</a></sub>
</td>
</tr>
<tr><th colspan="3" align="left">✍️ Kinetic typography</th></tr>
<tr>
<td width="33%" valign="top">
<a href="docs/readme/media/glass-shard-title.mp4"><picture><source media="(prefers-reduced-motion: reduce)" srcset="web/catalog/covers/10cceacc02d415247d58f562.jpg"><img src="docs/readme/gallery/glass-shard-title.gif" width="300" alt="Animated catalog preview: Glass Shard Title"></picture></a><br>
<strong>Glass Shard Title</strong><br>
<sub>Component · <a href="library/components/showcase/README.md">View component</a></sub>
</td>
<td width="33%" valign="top">
<a href="library/skills/motion-design-remix/assets/canopy-part-title/reference.mp4"><picture><source media="(prefers-reduced-motion: reduce)" srcset="web/catalog/covers/998dd6bb8358592c15f727d6.jpg"><img src="docs/readme/gallery/canopy-title.gif" width="300" alt="Animated catalog preview: Canopy Part Title"></picture></a><br>
<strong>Canopy Part Title</strong><br>
<sub>Component · <a href="library/skills/motion-design-remix/references/canopy-part-title/MOTION_DESIGN.md">View component</a></sub>
</td>
<td width="33%" valign="top">
<a href="library/skills/motion-design-remix/assets/wireframe-portal-title/reference.mp4"><picture><source media="(prefers-reduced-motion: reduce)" srcset="web/catalog/covers/4d03231a69d147a38f993578.jpg"><img src="docs/readme/gallery/wireframe-title.gif" width="300" alt="Animated catalog preview: Wireframe Portal Title"></picture></a><br>
<strong>Wireframe Portal Title</strong><br>
<sub>Component · <a href="library/skills/motion-design-remix/references/wireframe-portal-title/MOTION_DESIGN.md">View component</a></sub>
</td>
</tr>
<tr><th colspan="3" align="left">💎 Light, glass & 3D worlds</th></tr>
<tr>
<td width="33%" valign="top">
<a href="docs/readme/media/remix-iskra-light-reference.mp4"><picture><source media="(prefers-reduced-motion: reduce)" srcset="web/catalog/covers/75cfbe06267768838d145fa4.jpg"><img src="docs/readme/gallery/iskra-light.gif" width="300" alt="Animated catalog preview: Iskra Light"></picture></a><br>
<strong>Iskra Light</strong><br>
<sub>Reference · <a href="docs/readme/media/remix-iskra-light-reference.mp4">@world_is_web</a></sub>
</td>
<td width="33%" valign="top">
<a href="library/skills/motion-design-remix/assets/liquid-glass-widgets/reference.mp4"><picture><source media="(prefers-reduced-motion: reduce)" srcset="web/catalog/covers/553a1464d8037293b7debca8.jpg"><img src="docs/readme/gallery/liquid-glass-widgets.gif" width="300" alt="Animated catalog preview: Liquid Glass Widgets"></picture></a><br>
<strong>Liquid Glass Widgets</strong><br>
<sub>Component · <a href="library/skills/motion-design-remix/references/liquid-glass-widgets/MOTION_DESIGN.md">View component</a></sub>
</td>
<td width="33%" valign="top">
<a href="docs/readme/media/remix-cyera-reference.mp4"><picture><source media="(prefers-reduced-motion: reduce)" srcset="web/catalog/covers/8884a707a92d0cc52d3363b7.jpg"><img src="docs/readme/gallery/cyera.gif" width="300" alt="Animated catalog preview: Cyera brand video"></picture></a><br>
<strong>Cyera brand video</strong><br>
<sub>Reference · <a href="docs/readme/media/remix-cyera-reference.mp4">Cyera</a></sub>
</td>
</tr>
<tr><th colspan="3" align="left">🧭 Depth & camera motion</th></tr>
<tr>
<td width="33%" valign="top">
<a href="library/skills/motion-design-remix/assets/code-3d-extrude/reference.mp4"><picture><source media="(prefers-reduced-motion: reduce)" srcset="web/catalog/covers/0a5c7158bbecd6e47055bef9.jpg"><img src="docs/readme/gallery/code-3d.gif" width="300" alt="Animated catalog preview: Code 3D Extrude"></picture></a><br>
<strong>Code 3D Extrude</strong><br>
<sub>Component · <a href="library/skills/motion-design-remix/references/code-3d-extrude/MOTION_DESIGN.md">View component</a></sub>
</td>
<td width="33%" valign="top">
<a href="docs/readme/media/remix-glyph-reference.mp4"><picture><source media="(prefers-reduced-motion: reduce)" srcset="web/catalog/covers/4bfe08db4d486970494eff3b.jpg"><img src="docs/readme/gallery/glyph.gif" width="300" alt="Animated catalog preview: Glyph: GPU typography for the web"></picture></a><br>
<strong>Glyph: GPU typography for the web</strong><br>
<sub>Reference · <a href="docs/readme/media/remix-glyph-reference.mp4">@pmndrs</a></sub>
</td>
<td width="33%" valign="top">
<a href="docs/readme/media/nyc-paris-flight.mp4"><picture><source media="(prefers-reduced-motion: reduce)" srcset="web/catalog/covers/aeafb2433c37f2f7d8c87619.jpg"><img src="docs/readme/gallery/flight-map.gif" width="300" alt="Animated catalog preview: NYC Paris Flight"></picture></a><br>
<strong>NYC Paris Flight</strong><br>
<sub>Component · <a href="library/components/showcase/README.md">View component</a></sub>
</td>
</tr>
<tr><th colspan="3" align="left">✨ Generative visuals</th></tr>
<tr>
<td width="33%" valign="top">
<a href="docs/readme/media/aurora.mp4"><picture><source media="(prefers-reduced-motion: reduce)" srcset="web/catalog/covers/5aefe7c9a916a38777443b36.jpg"><img src="docs/readme/gallery/aurora.gif" width="300" alt="Animated catalog preview: Aurora"></picture></a><br>
<strong>Aurora</strong><br>
<sub>Component · <a href="library/components/showcase/README.md">View component</a></sub>
</td>
<td width="33%" valign="top">
<a href="docs/readme/media/remix-linear-loops-reference.mp4"><picture><source media="(prefers-reduced-motion: reduce)" srcset="web/catalog/covers/17cf5075b3f4b49c7d3e9201.jpg"><img src="docs/readme/gallery/linear-loops.gif" width="300" alt="Animated catalog preview: Linear Loops"></picture></a><br>
<strong>Linear Loops</strong><br>
<sub>Reference · <a href="docs/readme/media/remix-linear-loops-reference.mp4">@linear</a></sub>
</td>
<td width="33%" valign="top">
<a href="library/skills/motion-design-remix/assets/code-particle-assemble/reference.mp4"><picture><source media="(prefers-reduced-motion: reduce)" srcset="web/catalog/covers/8ff121deb9403f7a99ac52b3.jpg"><img src="docs/readme/gallery/code-particles.gif" width="300" alt="Animated catalog preview: Code Particle Assemble"></picture></a><br>
<strong>Code Particle Assemble</strong><br>
<sub>Component · <a href="library/skills/motion-design-remix/references/code-particle-assemble/MOTION_DESIGN.md">View component</a></sub>
</td>
</tr>
</table>

</details>

[Motion.md format](docs/motion-md.md)

<a id="all-in-one-studio"></a> <a id="full-video-creation-stack"></a>

<a id="model-wall"></a>

### 4. Multimodal generation: images, video, music and speech

Generate the missing shot, a still, a music bed or a voice-over with your configured models. Place the result on the same timeline as your own footage and adjust it against the cut.

<p><img src="docs/readme/models/codex.svg" width="133" alt="Codex Image">
<img src="docs/readme/models/nano-banana.svg" width="133" alt="Nano Banana 2">
<img src="docs/readme/models/flux.svg" width="133" alt="FLUX Schnell">
<img src="docs/readme/models/seedance.svg" width="133" alt="Seedance 2.0">
<img src="docs/readme/models/wan.svg" width="133" alt="Wan 2.2">
<img src="docs/readme/models/suno.svg" width="133" alt="Suno v4">
<img src="docs/readme/models/kokoro.svg" width="133" alt="Kokoro"></p>

<details>
<summary>Model catalog and provider setup</summary>

| Make what the video needs | Built-in model catalog examples | Bring it into your film |
| --- | --- | --- |
| **🖼️ Images** | Codex Image; Nano Banana 2 via Atlas Cloud; FLUX Schnell via fal.ai | Brand visuals, scene artwork and supporting images; reference-based editing through the supported Codex image path |
| **🎬 Video** | Seedance 2.0 via Atlas Cloud; Wan 2.2 via fal.ai | Generated shots and B-roll to combine with your footage and motion |
| **🎵 Music** | Suno v4 via Atlas Cloud | A soundtrack built around your mood and creative brief |
| **🎙️ TTS / voice-over** | Kokoro via fal.ai | Narration from your approved script, placed alongside the visuals and music |

[Model setup](docs/model-gateway.md)

</details>

<a id="technical-guide"></a>

## Setup and technical documentation

<a id="快速开始"></a> <a id="quick-start"></a>

### Quick start

Use Git and **Node.js 26.11.1**, pinned in [CI](.github/workflows/ci.yml), with npm. Source-based preview and export also need Chrome/Chromium and FFmpeg/FFprobe. [Runtime setup](docs/usage.md)

```sh
git clone --branch feature/motion https://github.com/nexu-io/html-anything.git openmotion
cd openmotion
npm ci
npm run build:studio
npm start
```

Open **http://localhost:4173**. Choose **Templates → Ready to edit**, open **Product Promo**, and use **Connect Agent** for your preferred client. Keep projects and credentials outside the checkout; `MOTION_DATA_DIR` selects the workspace.

#### Bring it into your agent

For Codex with plugin support, run from the checkout:

```sh
bash scripts/install-motion.command
```

For DeepSeek Harness, Claude Code and other clients, follow the [agent adapters guide](docs/agent-adapters.md) or the [local MCP + Skills installer](docs/npm-installation.md). The npm package is not publicly published; that guide uses locally built artifacts. [Windows test packages](docs/test-packages.md)

Try the included template first:

> Use OpenMotion to open a fresh copy of the 20-second Product Promo in Studio and export an MP4. Keep the editable project.

Then make it yours:

> Keep the structure and animation. Replace the logo, screenshots, headline and end card with my supplied brand materials. Show the new cut, then hold the final title two seconds longer.

To start from a video instead, supply your reference and use the [recreation brief](#reverse-engineer-a-video). If your host cannot open Studio beside the conversation, use the returned local project link.

<details>
<summary>Skills, MCP and CLI</summary>

From the checkout, discover and install the five core workflows with the [Skills CLI](https://github.com/vercel-labs/skills):

```sh
npx skills add ./skills --list
npx skills add ./skills --skill motion-director motion-production motion-template-to-video motion-recreate motion-video-to-template
```

This copies instructions; it does not install the runtime or register MCP. Keep the shared documentation available and connect the app separately, or use the integrated local installer above.

| Skill | Use it for |
| --- | --- |
| [motion-recreate](skills/motion-recreate/SKILL.md) | Reconstructing a reference video and comparing the result |
| [motion-template-to-video](skills/motion-template-to-video/SKILL.md) | Adapting an existing editable template |
| [motion-director](skills/motion-director/SKILL.md) | Original films, narrative, movement, sound and creative review |
| [motion-video-to-template](skills/motion-video-to-template/SKILL.md) | Producing a portable reusable template |
| [motion-production](skills/motion-production/SKILL.md) | Scoped edits, preview, checks, troubleshooting and export |

Use **Connect Agent** for workspace-specific configuration. Manual local stdio clients can use absolute paths:

```json
{
  "mcpServers": {
    "openmotion": {
      "command": "/absolute/path/to/node",
      "args": ["--experimental-strip-types", "/absolute/openmotion/mcp.ts"],
      "env": { "MOTION_DATA_DIR": "/absolute/openmotion-data" }
    }
  }
}
```

The **eleven public MCP tools** cover template discovery and details, project creation and reading, editing, preview, media import, export, version restoration and cancellation. Shared workflow and engine guides are available through MCP resources. [Tool contract](docs/mcp-phase1-tools.md)

Studio and agents share a cached template catalog: `motion_list_templates` returns a local JSONL index, `motion_get_template` retrieves details, and `motion_create_project` creates an editable copy. The template environment is saved with the package; local development uses DEV and release packages use production by default. [Template catalog](docs/template-catalog.md)

Use `npm start` for the app and `npm run mcp` for stdio. Shell-capable agents can inspect and render with the pinned engine CLI returned by the runtime; managed edits retain project revision checks. [Native authoring](skills/motion-production/references/native.md)

</details>

<a id="product-tour"></a> <a id="产品界面"></a> <a id="connect-your-agent"></a> <a id="use-from-your-agent"></a> <a id="从-agent-接入"></a> <a id="your-agent-your-studio"></a>

<a id="reverse-engineer-a-video"></a>

### From a reference to an editable project

```text
Use OpenMotion to reverse-engineer the attached reference for our brand.

Study: the opening hook, shot order, typography, transitions and sound cues.
Keep: the product reveal and camera rhythm in the selected segment.
Replace: the logo, UI, claims, copy and end card with our supplied materials.
Generate: missing images, video, background music and TTS narration using
our configured models, following our brand and approved script.

Build an editable project. Open it in Studio and compare matching moments
with the reference. Explain any remaining differences. After review,
export an MP4 and retain the source for the next edit.
```

<a id="ai-video-editing"></a> <a id="keep-editing-after-the-remake"></a>

<details>
<summary>Open the project in your agent or in Studio</summary>

#### Start in your agent

![OpenMotion embedded viewer for Codex, showing the editable Product Promo project, preview, layers and timeline.](docs/readme/product-tour/codex-embedded.png)

*The existing product tour shows the Studio viewer prepared for a Codex host. See [capture scope](docs/product-tour.md) for what was demonstrated.*

#### Start in Studio

Browse references, open a template or bring in your recordings. Choose **Connect Agent**, follow the workspace-specific instructions and give the agent your brief. Review its edits on the same timeline and make hands-on adjustments whenever you want.

![Standalone OpenMotion Studio with sessions, the saved request and an editable video project.](docs/readme/product-tour/standalone-studio.png)

<details>
<summary>See Claude Code and the template handoff</summary>

![Claude Code production Skills, captured from the local terminal.](docs/readme/product-tour/claude-code-skills.png)

The terminal capture demonstrates local Skill loading. The [CLI checks](docs/readme/product-tour/cli-checks.png) demonstrate project inspection; they do not establish a completed model-driven recreation.

![Actual CLI checks for the Product Promo project: project info, lint and timeline inspection.](docs/readme/product-tour/cli-checks.png)

![Connect Agent dialog with workspace-specific connection instructions and a choice of local clients.](docs/readme/product-tour/connect-agent.png)

![Product Promo template preview with an expanded, template-specific instruction to copy into the agent.](docs/readme/product-tour/template-to-agent.png)

**Preview → copy the instruction → paste into your agent with your brand assets.** A bundled template opens as an editable copy; an external reference starts a reconstruction task. [Full product tour](docs/product-tour.md)

</details>

Both entry paths use the same local application and project. The agent runs in its own client; Studio stores the brief and editable work. [How the connection works](docs/session-architecture.md)

</details>

<a id="open-projects-reusable-knowledge"></a> <a id="developer-architecture"></a>

### System architecture

**HTML is the editable video source; MP4 is the rendered delivery.** OpenMotion combines a TypeScript application, a React Studio, agent workflows, multimodal generation adapters and a browser-based composition and rendering engine. The project is the shared artifact between the human editor and the agent.

#### How the modules work together

![The local agent connects through nine MCP project tools and Studio through local HTTP. The application manages revisions, assets and export jobs; the Model Gateway supplies media to the editable project, and a fixed project snapshot is rendered and verified.](docs/readme/diagrams/runtime-architecture.svg)

<details>
<summary>Read the full architecture and roadmap as text</summary>

```text
CREATIVE INPUT
Reference video + footage + script + brand assets
                            |
                            v
COMMUNITY KNOWLEDGE
Motion.md + BRANDKIT.md + Skills + templates + components
                            |
              +-------------+------------------+
              v                                v
BYOA: YOUR LOCAL AGENT                OPENMOTION STUDIO
DeepSeek Harness / Codex /            React 19 + TypeScript + Vite
Claude Code / other local hosts       Tailwind CSS + Zustand
Skills + host analysis tools         CodeMirror + Dockview
              |                      media / preview / timeline
              | stdio MCP                      | local HTTP
              | 9 public project tools         |
              +------------------+-------------+
                                 v
LOCAL APPLICATION                 Node.js + TypeScript + node:http
Sessions / project files / assets / revisions / export jobs
              |                                  |
              v                                  v
BYOK: MODEL GATEWAY                   VIDEO AS CODE
Your keys / accounts / model routing  HTML scenes + media + Studio data
Discovery / generation jobs           HTML + CSS + JavaScript + GSAP
              |                                  ^
              v                                  |
MODEL ADAPTERS                                   |
Codex Image / Atlas Cloud / fal.ai               |
Images / Video / Music / TTS                     |
              |                                  |
              v                                  |
Generated candidates -> preview / select -> adopt into the project
                                                 |
                                                 v
RENDER AND VERIFY
Fixed project snapshot -> HTML render engine + Chromium -> FFmpeg / FFprobe
                                                 |
                                                 v
DELIVERY TODAY
MP4 + editable source + media + version and export evidence
                                                 |
                          .----------------------'
                          v
COMING: PUBLISH TO EVERY PLATFORM
Platform connectors -> release review -> scheduling -> performance feedback
                          |
                          v
COMING: KNOWLEDGE FEEDBACK
Version-linked outcomes -> team memory / RAG -> evaluated Skill improvements
```

</details>

BYOA keeps the agent in your existing client; BYOK connects your supported model accounts. Studio and the local service manage the editable work, while provider credentials remain outside project files. The public phase-one MCP surface contains **eleven tools: nine project tools and two template catalog tools**. Model generation is available through Studio and the local Gateway service; the diagram does not add generation or publishing tools to that public MCP contract.

The diagrams are editable SVGs generated from a [small, dependency-free source script](docs/readme/diagrams/generate.py).

#### Stack and source map

| Layer | Technology | Start reading |
| --- | --- | --- |
| **Studio and editor UI** | React 19, TypeScript 5.9, Vite 6, Tailwind CSS 4, Zustand, CodeMirror and Dockview | [Studio source](studio/src/) · [Motion app](studio/src/motion/MotionApp.tsx) · [Editor development](docs/editor-fork.md) |
| **Application runtime** | Node.js 26.11.1 in CI, native HTTP, TypeScript execution and local files/JSON | [server.ts](server.ts) · [workspace.ts](workspace.ts) · [Session architecture](docs/session-architecture.md) |
| **Agent integration** | Local stdio MCP, five core Skills and generated host adapters | [mcp.ts](mcp.ts) · [phase1.ts](phase1.ts) · [Adapter generation](scripts/export-adapters.ts) |
| **Multimodal generation** | Codex media adapter, Atlas Cloud predictions, fal.ai queue integration and persisted generation jobs | [Gateway service](gateway/service.ts) · [Provider adapters](gateway/providers.ts) · [Model catalog](gateway/catalog.ts) |
| **Composition and motion** | HTML/CSS/JS, GSAP, a pinned composition engine and native timeline/history | [Engine integration](hyperframes.ts) · [Template source](template-library/) · [Version adapter](phase1-versions.ts) |
| **Rendering and media** | Chromium, Puppeteer Core, FFmpeg and FFprobe | [Render service](server.ts) · [Export verifier](scripts/verify-export.ts) · [Native runtime lock](scripts/runtime-lock.json) |
| **Creative knowledge** | Markdown, source packages, presets and comparison evidence | [Motion.md](docs/motion-md.md) · [Core Skills](skills/) · [Community Library](library/README.md) |
| **Validation and packaging** | Node test runner, Vitest, Studio checks, npm lockfiles and explicit distribution lists | [Tests](tests/) · [Studio tests](studio/tests/) · [CI](.github/workflows/ci.yml) · [Distribution](scripts/distribution.ts) |
| **Publishing and learning — Coming** | Platform adapters, scheduling, version-linked feedback and retrieval; implementation still to be designed | [Studio vision](docs/product/studio-vision.md) |

Dependency pins live in [package.json](package.json), [package-lock.json](package-lock.json) and the [runtime lock](scripts/runtime-lock.json). Models and third-party libraries retain their own terms; the application is Apache-2.0.

#### Choose a layer and build with us

| If you work on… | A useful contribution | Entry point |
| --- | --- | --- |
| **Frontend and interaction** | Improve timeline editing, media generation controls, accessibility or preview behavior | [Studio](studio/src/) · [Media generator](studio/src/motion/MediaGenerator.tsx) |
| **AI and model infrastructure** | Add a provider adapter or model preset using the shared job and media flow | [Gateway design](docs/product/media-generation-design.md) · [Provider adapters](gateway/providers.ts) |
| **Agents and developer tools** | Improve a host adapter, Skill, resource guide or project-tool workflow | [Agent adapters](docs/agent-adapters.md) · [MCP contract](docs/mcp-phase1-tools.md) |
| **Motion and creative coding** | Share a component, native template or Motion.md package with an actual remix | [Components](library/components/README.md) · [Entry checklist](library/ENTRY_TEMPLATE.md) |
| **Video and rendering** | Improve export reliability, media handling or reproducible validation | [Engine notes](docs/hyperframes.md) · [Export verifier](scripts/verify-export.ts) |
| **Social publishing** | Help design the Coming connector layer: account access, release review, scheduling and version mapping | [Publishing direction](docs/product/studio-vision.md) · [Discuss a proposal](https://github.com/nexu-io/html-anything/issues) |

Start with the [local setup](#quick-start), choose one layer, and follow [CONTRIBUTING.md](CONTRIBUTING.md) and [AGENTS.md](AGENTS.md). Keep user projects and credentials outside the checkout and preserve dependency pins and upstream licenses.

**The architectural commitments:** people and agents share one project; revision checks protect changes from stale state; generated candidates enter the film through explicit adoption; exports use fixed snapshots. Technical checks, visual quality, sound and actual playback have separate evidence.

[Product architecture](docs/product/architecture.md) · [Studio development](studio/README.md) · [Model Gateway](docs/model-gateway.md) · [Contribution guide](CONTRIBUTING.md)

<a id="one-video-more-places-to-share"></a> <a id="publish-to-every-platform"></a>

<a id="super-motion-video-agent"></a> <a id="status--roadmap"></a> <a id="当前状态与路线图"></a> <a id="roadmap"></a>

**Roadmap.** MP4 export is available locally. Connected publishing, scheduling and shared review are planned. [Studio roadmap](docs/product/studio-vision.md)

<a id="社区共建"></a> <a id="community"></a>

### Community

[OpenMotion website](https://open-design.ai/openmotion?utm_source=github&utm_medium=referral&utm_campaign=openmotion&utm_content=readme_en) · [OpenDesign Go](https://go.open-design.ai/?utm_source=github&utm_medium=referral&utm_campaign=openmotion&utm_content=readme_en) · [Discord](https://discord.gg/mHAjSMV6gz) · [X @OpenDesignDevs](https://x.com/OpenDesignDevs) · [X @OpenDesignHQ](https://x.com/OpenDesignHQ) · [YouTube](https://www.youtube.com/channel/UChtshixMhvtgBWzoD9R_Qfg)

[Contribute](CONTRIBUTING.md) · [Report an issue](https://github.com/nexu-io/html-anything/issues)

<a id="acknowledgements"></a>

### Acknowledgements

Original brand-film excerpts are credited in the comparisons. [Agent and model marks](docs/readme/models/README.md)

OpenMotion is licensed under [Apache-2.0](LICENSE). Third-party code, templates, media and fonts retain their own licenses and attribution.

| Source | Connection |
| --- | --- |
| [OpenDesign](https://github.com/nexu-io/open-design) | UI provenance, resource structure and brand direction; [design system](docs/design-system.md) and [Motion showcase](https://open-design.ai/motion/) |
| [Hyperframes](https://github.com/heygen-com/hyperframes) | HTML-to-video composition, Studio and rendering foundations, pinned to 0.9.7; creator references, external adaptation demonstrations and component source; [engine notes](docs/hyperframes.md), [template notices](template-library/NOTICE.md) and [catalog provenance](docs/template-catalog.md) |
| [MotionGit](https://motiongit.com/) / adunext | Kinetic Tech source packaged as Presenter Tech; [license and attribution](library/templates/presenter-tech/NOTICE.md) |
| [Hypit](https://github.com/hypit-ai/hypit) | Inspiration for agent-led viral-video cloning and editable variants; no runtime imported here |
| [rea-video](https://github.com/JuneYaooo/rea-video) | Reference analysis and case studies for [live-action unboxing](https://github.com/JuneYaooo/rea-video/blob/main/docs/cases/unboxing/report_en.md) and [characters, code and screen footage](https://github.com/JuneYaooo/rea-video/blob/main/docs/cases/dual_role/report_en.md); [showcase attribution](docs/readme/brand-showcase/README.md), no runtime imported here |
| [OpenAI · Codex Originals](https://openai.com/codex-originals/) | External brand-film inspiration; official campaign still and outbound viewing link |
| [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness) / [Super-agent prototype](https://github.com/deepseek-ai/dsh-superagent-prototype) | Agent extensibility and continuing-task inspiration; the prototype is separate from OpenMotion's current runtime |
| Claude Motion / CapCut / [ChatCut](https://chatcut.io/docs/what-is-chatcut) / [OpenChatCut](https://github.com/0xsline/OpenChatCut) | Product references for agent-led creation, approachable AI editing and continued revision |
| [OpusClip](https://www.opus.pro/calendar) | Product reference for distribution and [external scheduling](https://www.opus.pro/tools/instagram-reels-scheduler); no built-in connector |
| [GSAP](https://github.com/greensock/GSAP) / [FFmpeg](https://ffmpeg.org/) | Animation and media dependencies with versions retained in [package.json](package.json) and the [runtime lock](scripts/runtime-lock.json) |

[Asset sources](docs/readme/ASSETS.md) · [Additional showcase sources](docs/readme/brand-showcase/README.md) · [Cover artwork and prompt](docs/readme/reverse-engineering-cover.md) · [Font notices](web/design-system/fonts/NOTICES.txt) · [Studio license](studio/LICENSE)

The former HTML Anything application is preserved on the [`legacy` branch](https://github.com/nexu-io/html-anything/tree/legacy). See the [repository migration guide](docs/repository-migration.md) for the active branch and distribution boundaries.
