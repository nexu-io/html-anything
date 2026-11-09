[English](../README.md) · **简体中文** · [日本語](README.ja.md) · [한국어](README.ko.md)

<h1 align="center">OpenMotion</h1>

<p align="center"><strong>用任意 Agent 拆解并复刻视频。</strong></p>

<p align="center"><a href="#showcase">场景与复刻效果</a> · <a href="#features">核心卖点</a> · <a href="#technical-guide">安装与技术文档</a></p>

<picture>
  <source media="(max-width: 600px)" srcset="readme/brand-hero.mobile.zh-CN.jpg">
  <img src="readme/brand-hero.zh-CN.jpg" width="100%" alt="OpenMotion：可编辑 HTML · 开源免费 · 本地 Agent · BYOK · Motion.md">
</picture>

OpenMotion 是一款直接在本地 Agent 中运行的开源视频生成器。上传一段参考视频，或粘贴社交平台上的视频链接，就能拆解镜头，用你的画面、Logo 和文案复刻原片的节奏。你可以在 Studio 里微调剪辑，再导出 MP4。

<a id="showcase"></a>

## 七种创作场景与复刻效果

<a id="可以用它做什么"></a> <a id="what-can-you-make"></a>

品牌对照均为同步的 5 秒片段：左边是原片，右边是 OpenMotion 复刻；手机上则上下排列。点击画面可放大观看。

<a id="brand-before-after"></a> <a id="brand-film-gallery"></a>

### 产品发布与演示

让产品出现在最值得停留的一拍。Stripe 原片用一次点击带出卡片翻面，复刻版在同一拍翻出一格海岸胶片。

**Stripe · 银行卡翻转 → 海岸胶片**

<div id="case-stripe"><a href="../examples/brand-studies/stripe/comparison.mp4"><picture><source media="(max-width: 600px) and (prefers-reduced-motion: no-preference)" srcset="../examples/brand-studies/stripe/comparison.mobile.webp"><source media="(prefers-reduced-motion: reduce)" srcset="../examples/brand-studies/stripe/comparison.jpg"><img src="../examples/brand-studies/stripe/comparison.webp" width="100%" alt="Stripe · 银行卡翻转 → 海岸胶片"></picture></a></div>

<sub><a href="../examples/brand-studies/stripe/comparison.mp4">横屏大图</a> · <a href="../examples/brand-studies/stripe/comparison.mobile.mp4">竖屏 MP4</a> · <a href="https://x.com/stripe/status/2049621560743608481">原片 00:21.50–00:26.50</a> · <a href="../examples/brand-studies/stripe/index.html">HTML</a> · <a href="../examples/brand-studies/stripe/MOTION.md">Motion.md</a></sub>

[使用这个场景的简报](examples.zh-CN.md#product-launch)

<details>
<summary>更多发布片参考：Kimi K3 与 ElevenLabs</summary>

<table>
<tr>
<td width="50%" valign="top">
<a href="readme/media/remix-kimi-k3-reference.mp4"><picture><source media="(prefers-reduced-motion: reduce)" srcset="../web/catalog/covers/ac6e14a0fadb5893534e6438.jpg"><img src="readme/gallery/kimi-k3.gif" width="440" alt="Kimi K3 teaser 参考片"></picture></a><br>
<strong>Kimi · K3 teaser</strong><br>
把下一次发布浓缩成简短、难忘的预告。<br>
<sub>参考 · @Kimi_Moonshot</sub>
</td>
<td width="50%" valign="top">
<a href="readme/media/remix-elevenlabs-reception-reference.mp4"><picture><source media="(prefers-reduced-motion: reduce)" srcset="../web/catalog/covers/bc4b8b4398d66159acd35890.jpg"><img src="readme/gallery/elevenlabs-reception.gif" width="440" alt="Reception by ElevenLabs 参考片"></picture></a><br>
<strong>ElevenLabs · Reception</strong><br>
用聚焦的发布故事介绍新产品。<br>
<sub>参考 · @ElevenLabs</sub>
</td>
</tr>
</table>

</details>

<details>
<summary>混合素材参考：实拍、生成角色与代码</summary>

优秀视频可以混合制作方式。这些外部案例可帮助你判断哪些该实拍、哪些生成、哪些用代码表达。

<table>
<tr>
<td width="50%" valign="top" align="center">
<a href="readme/brand-showcase/rea-unboxing.mp4"><picture><source media="(prefers-reduced-motion: reduce)" srcset="readme/brand-showcase/rea-unboxing.jpg"><img src="readme/brand-showcase/rea-unboxing.gif" width="250" alt="产品开箱实拍参考"></picture></a><br>
<strong>真实产品，有触感的故事</strong><br>
研究特写、手部动作和揭示方式，拍摄自己的产品。<br>
<sub>实拍 · 产品开箱</sub>
</td>
<td width="50%" valign="top" align="center">
<a href="readme/brand-showcase/rea-dual-role.mp4"><picture><source media="(prefers-reduced-motion: reduce)" srcset="readme/brand-showcase/rea-dual-role.jpg"><img src="readme/brand-showcase/rea-dual-role.gif" width="250" alt="AI 角色、代码界面与屏幕录制混合制作参考"></picture></a><br>
<strong>角色与界面相遇</strong><br>
把角色驱动的开头与界面动效、屏幕录制组合起来。<br>
<sub>AI 角色 + 代码 + 屏幕录制</sub>
</td>
</tr>
</table>

</details>

### AI 口播剪辑

按出镜人的讲述剪掉停顿，用字幕标出重点，在讲到工具时切入屏幕画面。

<p align="center"><a href="../library/skills/presenter-story/assets/ali-abdaal-workflow-reference.mp4"><picture>
<source media="(prefers-reduced-motion: reduce)" srcset="readme/examples/talking-head.jpg">
<img src="readme/examples/talking-head.gif" width="208" alt="外部创作参考：Ali Abdaal · 我每天使用的 5 个工具">
</picture></a></p>

<sub>参考 · <a href="../library/skills/presenter-story/assets/ali-abdaal-workflow-reference.mp4">Ali Abdaal · 我每天使用的 5 个工具</a></sub>

[使用这个场景的简报](examples.zh-CN.md#talking-head) · 人物宣传片参考：[OpenAI · Codex Originals](https://openai.com/codex-originals/)

<a id="everyone-can-be-a-creator"></a> <a id="everyone-can-be-an-ai-video-editor-everyone-can-be-a-creator"></a> <a id="人人都是自媒体"></a> <a id="creator-video-gallery"></a>

<details>
<summary>九条真人视频参考与可编辑讲解模板</summary>

**一张面孔、一段声音、一个故事，再加上恰当的动效。** 从九条创作者参考中选择课程、屏幕演示、创始人故事或产品视频，带上自己的录制素材，借鉴喜欢的结构。点击预览观看完整视频。

<table>
<tr><th colspan="3" align="left">🎓 教学与讲解</th></tr>
<tr>
<td width="33%" valign="top" align="center">
<a href="../library/skills/presenter-story/assets/careerwithriya-reference.mp4"><picture><source media="(prefers-reduced-motion: reduce)" srcset="readme/people/careerwithriya.jpg"><img src="readme/people/careerwithriya.gif" width="216" alt="真人视频参考：改变职业生涯的 6 项关键技能"></picture></a><br>
<strong>改变职业生涯的 6 项关键技能</strong><br>
编号要点 + 动态关键词<br>
<sub>参考 · <a href="https://www.instagram.com/reel/Ddd57MBszhc/">@careerwithriya</a></sub>
</td>
<td width="33%" valign="top" align="center">
<a href="readme/media/dan-martell-tools-reference.mp4"><picture><source media="(prefers-reduced-motion: reduce)" srcset="readme/people/dan-martell-tools.jpg"><img src="readme/people/dan-martell-tools.gif" width="216" alt="真人视频参考：现在最好的 AI 工具是什么？"></picture></a><br>
<strong>现在最好的 AI 工具是什么？</strong><br>
出镜讲解 + 悬浮工具卡片<br>
<sub>参考 · <a href="https://www.youtube.com/shorts/mk1zJd9Rm4c">Dan Martell</a></sub>
</td>
<td width="33%" valign="top" align="center">
<a href="readme/media/harpercarrollai-reference.mp4"><picture><source media="(prefers-reduced-motion: reduce)" srcset="readme/people/harpercarrollai.jpg"><img src="readme/people/harpercarrollai.gif" width="216" alt="真人视频参考：10 天 AI 基础，第 1 天"></picture></a><br>
<strong>10 天 AI 基础，第 1 天</strong><br>
个人讲解 + 清晰字幕<br>
<sub>参考 · <a href="https://www.instagram.com/reel/C4eNPF3PdpG/">@harpercarrollai</a></sub>
</td>
</tr>
<tr><th colspan="3" align="left">🖥️ 展示工作流</th></tr>
<tr>
<td width="33%" valign="top" align="center">
<a href="../library/skills/presenter-story/assets/ali-abdaal-workflow-reference.mp4"><picture><source media="(prefers-reduced-motion: reduce)" srcset="readme/people/ali-abdaal-workflow.jpg"><img src="readme/people/ali-abdaal-workflow.gif" width="216" alt="真人视频参考：我每天使用的 5 个工具"></picture></a><br>
<strong>我每天使用的 5 个工具</strong><br>
桌边讲述 + 工作流插画面<br>
<sub>参考 · <a href="../library/skills/presenter-story/assets/ali-abdaal-workflow-reference.mp4">Ali Abdaal</a></sub>
</td>
<td width="33%" valign="top" align="center">
<a href="../library/skills/presenter-story/assets/john-tagudin-capso-reference.mp4"><picture><source media="(prefers-reduced-motion: reduce)" srcset="readme/people/john-tagudin-capso.jpg"><img src="readme/people/john-tagudin-capso.gif" width="216" alt="真人视频参考：带重点标注的工具演示"></picture></a><br>
<strong>带重点标注的工具演示</strong><br>
真人 + 屏幕 + 标注<br>
<sub>参考 · <a href="https://www.tiktok.com/@john.tagudin/video/7524883942328126728">@john.tagudin</a></sub>
</td>
<td width="33%" valign="top" align="center">
<a href="readme/media/aiwithsachi-reference.mp4"><picture><source media="(prefers-reduced-motion: reduce)" srcset="readme/people/aiwithsachi.jpg"><img src="readme/people/aiwithsachi.gif" width="216" alt="真人视频参考：值得安装的 5 个 Claude 插件"></picture></a><br>
<strong>值得安装的 5 个 Claude 插件</strong><br>
口述清单 + 说明截图<br>
<sub>参考 · <a href="https://www.instagram.com/reel/Dc7G9Pxu_1O/">@aiwithsachi</a></sub>
</td>
</tr>
<tr><th colspan="3" align="left">🎬 讲故事，展示产品</th></tr>
<tr>
<td width="33%" valign="top" align="center">
<a href="readme/media/khris-sheer-founder-reference.mp4"><picture><source media="(prefers-reduced-motion: reduce)" srcset="readme/people/khris-sheer-founder.jpg"><img src="readme/people/khris-sheer-founder.gif" width="216" alt="真人视频参考：创始人实验，第 1 集"></picture></a><br>
<strong>创始人实验，第 1 集</strong><br>
创始人日记 + 日常补充镜头<br>
<sub>参考 · <a href="https://www.tiktok.com/@khris.sheer/video/7491715587895430402">@khris.sheer</a></sub>
</td>
<td width="33%" valign="top" align="center">
<a href="readme/media/ugc-rachelll-reference.mp4"><picture><source media="(prefers-reduced-motion: reduce)" srcset="readme/people/ugc-rachelll.jpg"><img src="readme/people/ugc-rachelll.gif" width="216" alt="真人视频参考：AI 创作者与产品"></picture></a><br>
<strong>AI 创作者与产品</strong><br>
产品故事 + 证据 + 画中画<br>
<sub>参考 · <a href="https://www.tiktok.com/@ugc.rachelll/video/7616996050066345246">@ugc.rachelll</a></sub>
</td>
<td width="33%" valign="top" align="center">
<a href="readme/media/kevinstratvert-reference.mp4"><picture><source media="(prefers-reduced-motion: reduce)" srcset="readme/people/kevinstratvert.jpg"><img src="readme/people/kevinstratvert.gif" width="216" alt="真人视频参考：别再为 5 个 AI 工具付费"></picture></a><br>
<strong>别再为 5 个 AI 工具付费</strong><br>
产品教程 + 实际演示<br>
<sub>参考 · <a href="https://www.youtube.com/shorts/1fA5j5_5TRY">Kevin Stratvert</a></sub>
</td>
</tr>
</table>

**按这个方向做一支片子：** 你的出镜人、故事和产品。让 Agent 参考开头、字幕节奏或屏幕揭示方式，适配你的素材。[Presenter Story Skill](../library/skills/presenter-story/SKILL.md) · [参考署名](readme/media/manifest.json)

#### 🎙️ 下一支真人讲解视频

<details>
<summary>打开可编辑的真人讲解模板</summary>

<a href="../library/templates/presenter-tech/README.md"><picture><source media="(prefers-reduced-motion: reduce)" srcset="readme/people/motiongit-kinetic.jpg"><img src="readme/people/motiongit-kinetic.gif" width="640" alt="Presenter Tech 模板：真人窗口、图解和动态文字"></picture></a>

**真人叙事 × 金属文字 × 动画讲解。** 带来录制素材、文案、截图和字幕。OpenMotion Library 已打包可编辑源码、参数、字体、声音配方及本地运行器，Agent 可按制作指南改编。**1920 × 1080 · 60 fps · 横屏。**

[获取模板包](../library/templates/presenter-tech/presenter-tech.motion) · [制作指南](../library/templates/presenter-tech/TEMPLATE.md) · [Motion.md](../library/templates/presenter-tech/MOTION_DESIGN.md)

</details>

</details>

<a id="presenter-motion"></a>

<details>
<summary>三组真人讲解：参考片与改编效果</summary>

以下成对预览是原参考和外部改编的无声片段。选择自己录制素材的创作方向，再用设计配方指导 Agent。

#### 用真人、关键词和视觉例子讲清楚

**职业建议 → 视频制作讲解**

<table>
<tr><th width="50%">参考 · @careerwithriya</th><th width="50%">改编 · 外部示例</th></tr>
<tr><td colspan="2" align="center"><picture><source media="(prefers-reduced-motion: reduce)" srcset="readme/people/careerwithriya-comparison.jpg"><img src="readme/people/careerwithriya-comparison.gif" width="576" alt="原始真人视频与更换人物和内容的外部改编"></picture></td></tr>
</table>

**复用：** 编号观点、真人讲述和证据卡片。**替换：** 创作者、口述主题、关键词与辅助例子。

[Motion.md](../library/skills/presenter-story/references/presenter-listicle/MOTION_DESIGN.md) · [Skill](../library/skills/presenter-story/SKILL.md) · [原片](../library/skills/presenter-story/assets/careerwithriya-reference.mp4) · [完整改编](../library/skills/presenter-story/assets/careerwithriya-result.mp4)

#### 一边讲故事，一边展示工作流

**日常工具 → 设计工作空间的故事**

<table>
<tr><th width="50%">参考 · Ali Abdaal</th><th width="50%">改编 · 外部示例</th></tr>
<tr><td colspan="2" align="center"><picture><source media="(prefers-reduced-motion: reduce)" srcset="readme/people/ali-abdaal-workflow-comparison.jpg"><img src="readme/people/ali-abdaal-workflow-comparison.gif" width="576" alt="原始真人视频与更换人物和内容的外部改编"></picture></td></tr>
</table>

**复用：** 真人与屏幕交替节奏、克制字幕、清晰插入画面。**替换：** 你的录制素材、工作流和截屏。

[Motion.md](../library/skills/presenter-story/references/workflow-demo/MOTION_DESIGN.md) · [Skill](../library/skills/presenter-story/SKILL.md) · [原片](../library/skills/presenter-story/assets/ali-abdaal-workflow-reference.mp4) · [完整改编](../library/skills/presenter-story/assets/ali-abdaal-workflow-result.mp4)

#### 把真人和产品放进同一个故事

**工具演示 → 视频编辑器导览**

<table>
<tr><th width="50%">参考 · @john.tagudin</th><th width="50%">改编 · 外部示例</th></tr>
<tr><td colspan="2" align="center"><picture><source media="(prefers-reduced-motion: reduce)" srcset="readme/people/john-tagudin-capso-comparison.jpg"><img src="readme/people/john-tagudin-capso-comparison.gif" width="576" alt="原始真人视频与更换人物和内容的外部改编"></picture></td></tr>
</table>

**复用：** 开头、画中画、标注与可见成果。**替换：** 产品、出镜人、演示和结尾信息。

[Motion.md](../library/skills/presenter-story/references/product-walkthrough/MOTION_DESIGN.md) · [Skill](../library/skills/presenter-story/SKILL.md) · [原片](../library/skills/presenter-story/assets/john-tagudin-capso-reference.mp4) · [完整改编](../library/skills/presenter-story/assets/john-tagudin-capso-result.mp4)

> 用我的实拍和屏幕录制套用这个结构。保留我的声音，围绕实际讲话剪辑并对齐字幕，用截图、画中画和动效解释每个要点。先展示有声预览，再交付可编辑工程和 MP4。

</details>

### AI 重剪与改稿

把零散照片和片段剪成一段故事。这支 100 天日记用一张张照片卡串起时间。

<p align="center"><a href="readme/media/hundred-days-story-reference.mp4"><picture>
<source media="(prefers-reduced-motion: reduce)" srcset="readme/examples/story-recut.jpg">
<img src="readme/examples/story-recut.gif" width="208" alt="外部创作参考：用贴纸和照片卡讲述 100 天">
</picture></a></p>

<sub>参考 · <a href="https://www.instagram.com/reel/Dd6vHlQgpok/">用贴纸和照片卡讲述 100 天</a></sub>

[使用这个场景的简报](examples.zh-CN.md#story-recut)

### 热门视频复刻

保留几秒钟的剪辑节奏，换掉画面讲的事。下面两组复刻都沿用原片的切点，重新设计了主体和文字。

**OpenAI · 线框节点 → 剪辑轨道**

<div id="case-openai"><a href="../examples/motion-studies/comparison.mp4"><picture><source media="(max-width: 600px) and (prefers-reduced-motion: no-preference)" srcset="../examples/motion-studies/comparison.mobile.webp"><source media="(prefers-reduced-motion: reduce)" srcset="../examples/motion-studies/comparison.jpg"><img src="../examples/motion-studies/comparison.webp" width="100%" alt="OpenAI · 线框节点 → 剪辑轨道"></picture></a></div>

五段彩色剪辑轨道收成一个切点，沿用原片切底、出字、落标的三拍。

<sub><a href="../examples/motion-studies/comparison.mp4">横屏大图</a> · <a href="../examples/motion-studies/comparison.mobile.mp4">竖屏 MP4</a> · <a href="https://x.com/OpenAI/status/2084352161404920316">原片 00:26.50–00:31.50</a> · <a href="../examples/motion-studies/signoff.html">HTML</a></sub>

**DeepSeek Harness · 终端打字 → 片场打板**

<div id="case-deepseek"><a href="../examples/brand-studies/deepseek/comparison.mp4"><picture><source media="(max-width: 600px) and (prefers-reduced-motion: no-preference)" srcset="../examples/brand-studies/deepseek/comparison.mobile.webp"><source media="(prefers-reduced-motion: reduce)" srcset="../examples/brand-studies/deepseek/comparison.jpg"><img src="../examples/brand-studies/deepseek/comparison.webp" width="100%" alt="DeepSeek Harness · 终端打字 → 片场打板"></picture></a></div>

光标改在片场打板上逐字输入，最后一键和片尾之间保留停顿与闪切。

<sub><a href="../examples/brand-studies/deepseek/comparison.mp4">横屏大图</a> · <a href="../examples/brand-studies/deepseek/comparison.mobile.mp4">竖屏 MP4</a> · <a href="https://x.com/DeepSeekHarness/status/2117256196227019194">原片 01:31.50–01:36.50</a> · <a href="../examples/brand-studies/deepseek/index.html">HTML</a></sub>

[使用这个场景的简报](examples.zh-CN.md#viral-remix) · 参考片：[Lovable · Aesthetics Update](readme/media/jake-lovable-reference.mp4)

<a id="see-the-motion-survive-a-new-brand"></a>

<details>
<summary>六组可编辑动效对照</summary>

成对预览展示同一时刻的原始内容与改编内容，均为同一实现渲染的无声片段。

#### 线框传送门 · BREAKTHROUGH → OPENMOTION

<table>
<tr><th width="50%">参考 · 原始内容</th><th width="50%">改编 · Skill 包适配</th></tr>
<tr><td colspan="2"><a href="../library/skills/motion-design-remix/previews/wireframe-portal-title.mp4"><picture><source media="(prefers-reduced-motion: reduce)" srcset="../library/skills/motion-design-remix/previews/wireframe-portal-title.jpg"><img src="../library/skills/motion-design-remix/previews/wireframe-portal-title.gif" width="100%" alt="线框传送门：左侧原内容、右侧改编，同步播放"></picture></a></td></tr>
</table>

**保留：传送门时序、立体字和镜头推进。** **替换：标题、副标题和三维短语。**

[Motion.md](../library/skills/motion-design-remix/references/wireframe-portal-title/MOTION_DESIGN.md) · [Skill](../library/skills/motion-design-remix/SKILL.md) · [内容预设](../library/skills/motion-design-remix/presets/wireframe-portal-title.json) · [MP4](../library/skills/motion-design-remix/previews/wireframe-portal-title.mp4)

#### 树冠字体 · Understory → OpenMotion

<table>
<tr><th width="50%">参考 · 原始内容</th><th width="50%">改编 · Skill 包适配</th></tr>
<tr><td colspan="2"><a href="../library/skills/motion-design-remix/previews/canopy-part-title.mp4"><picture><source media="(prefers-reduced-motion: reduce)" srcset="../library/skills/motion-design-remix/previews/canopy-part-title.jpg"><img src="../library/skills/motion-design-remix/previews/canopy-part-title.gif" width="100%" alt="树冠字体：左侧原内容、右侧改编，同步播放"></picture></a></td></tr>
</table>

**保留：叶片扫过、纵深、遮挡和阅读停留。** **替换：两条品牌标题。**

[Motion.md](../library/skills/motion-design-remix/references/canopy-part-title/MOTION_DESIGN.md) · [Skill](../library/skills/motion-design-remix/SKILL.md) · [内容预设](../library/skills/motion-design-remix/presets/canopy-part-title.json) · [MP4](../library/skills/motion-design-remix/previews/canopy-part-title.mp4)

#### 界面揭示 · 产品导览 → AI 剪辑故事

<table>
<tr><th width="50%">参考 · 原始内容</th><th width="50%">改编 · Skill 包适配</th></tr>
<tr><td colspan="2"><a href="../library/skills/motion-design-remix/previews/ui-3d-reveal.mp4"><picture><source media="(prefers-reduced-motion: reduce)" srcset="../library/skills/motion-design-remix/previews/ui-3d-reveal.jpg"><img src="../library/skills/motion-design-remix/previews/ui-3d-reveal.gif" width="100%" alt="界面揭示：左侧原内容、右侧改编，同步播放"></picture></a></td></tr>
</table>

**保留：倾斜画布、纵深层级和连续镜头。** **替换：主标题、文档和社区文案。**

[Motion.md](../library/skills/motion-design-remix/references/ui-3d-reveal/MOTION_DESIGN.md) · [Skill](../library/skills/motion-design-remix/SKILL.md) · [内容预设](../library/skills/motion-design-remix/presets/ui-3d-reveal.json) · [MP4](../library/skills/motion-design-remix/previews/ui-3d-reveal.mp4)

#### 立体代码 · loadConfig() → cutVideo()

<table>
<tr><th width="50%">参考 · 原始内容</th><th width="50%">改编 · Skill 包适配</th></tr>
<tr><td colspan="2"><a href="../library/skills/motion-design-remix/previews/code-3d-extrude.mp4"><picture><source media="(prefers-reduced-motion: reduce)" srcset="../library/skills/motion-design-remix/previews/code-3d-extrude.jpg"><img src="../library/skills/motion-design-remix/previews/code-3d-extrude.gif" width="100%" alt="立体代码：左侧原内容、右侧改编，同步播放"></picture></a></td></tr>
</table>

**保留：挤出板层、语法配色和镜头运动。** **替换：函数、变量和展示的调用。**

[Motion.md](../library/skills/motion-design-remix/references/code-3d-extrude/MOTION_DESIGN.md) · [Skill](../library/skills/motion-design-remix/SKILL.md) · [内容预设](../library/skills/motion-design-remix/presets/code-3d-extrude.json) · [MP4](../library/skills/motion-design-remix/previews/code-3d-extrude.mp4)

#### 粒子组装 · parse / optimize / emit → select / trim / render

<table>
<tr><th width="50%">参考 · 原始内容</th><th width="50%">改编 · Skill 包适配</th></tr>
<tr><td colspan="2"><a href="../library/skills/motion-design-remix/previews/code-particle-assemble.mp4"><picture><source media="(prefers-reduced-motion: reduce)" srcset="../library/skills/motion-design-remix/previews/code-particle-assemble.jpg"><img src="../library/skills/motion-design-remix/previews/code-particle-assemble.gif" width="100%" alt="粒子组装：左侧原内容、右侧改编，同步播放"></picture></a></td></tr>
</table>

**保留：固定种子的粒子运动和组装节奏。** **替换：流程名称与步骤。**

[Motion.md](../library/skills/motion-design-remix/references/code-particle-assemble/MOTION_DESIGN.md) · [Skill](../library/skills/motion-design-remix/SKILL.md) · [内容预设](../library/skills/motion-design-remix/presets/code-particle-assemble.json) · [MP4](../library/skills/motion-design-remix/previews/code-particle-assemble.mp4)

#### 玻璃信息卡 · 设备组件 → 创作者工作区

<table>
<tr><th width="50%">参考 · 原始内容</th><th width="50%">改编 · Skill 包适配</th></tr>
<tr><td colspan="2"><a href="../library/skills/motion-design-remix/previews/liquid-glass-widgets.mp4"><picture><source media="(prefers-reduced-motion: reduce)" srcset="../library/skills/motion-design-remix/previews/liquid-glass-widgets.jpg"><img src="../library/skills/motion-design-remix/previews/liquid-glass-widgets.gif" width="100%" alt="玻璃信息卡：左侧原内容、右侧改编，同步播放"></picture></a></td></tr>
</table>

**保留：玻璃质感、卡片层级、错峰入场与仪表。** **替换：标签、单位和功能叙事。**

[Motion.md](../library/skills/motion-design-remix/references/liquid-glass-widgets/MOTION_DESIGN.md) · [Skill](../library/skills/motion-design-remix/SKILL.md) · [内容预设](../library/skills/motion-design-remix/presets/liquid-glass-widgets.json) · [MP4](../library/skills/motion-design-remix/previews/liquid-glass-widgets.mp4)

只有视频参考时，使用独立的[复刻工作流](../skills/motion-recreate/SKILL.md) 重建和对比。还原度依据所选参考和你的简报审阅。

</details>

### 讲解与教程

先让人看到该看哪里，再展示下一步。Claude 的例子保留了开关和手绘圈的节拍，把设置面板换成调色板。

**Claude · 设置面板 → 品牌调色板**

<div id="case-claude"><a href="../examples/brand-studies/anthropic/comparison.mp4"><picture><source media="(max-width: 600px) and (prefers-reduced-motion: no-preference)" srcset="../examples/brand-studies/anthropic/comparison.mobile.webp"><source media="(prefers-reduced-motion: reduce)" srcset="../examples/brand-studies/anthropic/comparison.jpg"><img src="../examples/brand-studies/anthropic/comparison.webp" width="100%" alt="Claude · 设置面板 → 品牌调色板"></picture></a></div>

<sub><a href="../examples/brand-studies/anthropic/comparison.mp4">横屏大图</a> · <a href="../examples/brand-studies/anthropic/comparison.mobile.mp4">竖屏 MP4</a> · <a href="https://x.com/ClaudeDevs/status/2091953609185657251">原片 00:00–00:05</a> · <a href="../examples/brand-studies/anthropic/index.html">HTML</a></sub>

[使用这个场景的简报](examples.zh-CN.md#explainer) · 参考片：[授权一次，连接所有人](readme/media/remix-authorize-once-reference.mp4)

### 数据故事与图表

从一个需要比较的问题出发，标出数值和单位。参考片里的柱形条随数值变化，观众能直接看出差距。

<p align="center"><a href="readme/media/M1128-clip.mp4"><picture>
<source media="(prefers-reduced-motion: reduce)" srcset="readme/examples/data-story.jpg">
<img src="readme/examples/data-story.gif" width="480" alt="外部创作参考：动态对比柱形图 · @Vintage_god">
</picture></a></p>

<sub>参考 · <a href="https://x.com/Vintage_god/status/2106817967967056165">动态对比柱形图 · @Vintage_god</a></sub>

[使用这个场景的简报](examples.zh-CN.md#data-story)

### 音乐与艺术视觉

给一段音乐找一个视觉主题。Kimi 复刻版把旋转的磁力线换成黑胶纹路，再切到唱片封套；这段对照展示的是画面。

**Kimi · 磁力线 → 黑胶唱片**

<div id="case-kimi"><a href="../examples/brand-studies/kimi/comparison.mp4"><picture><source media="(max-width: 600px) and (prefers-reduced-motion: no-preference)" srcset="../examples/brand-studies/kimi/comparison.mobile.webp"><source media="(prefers-reduced-motion: reduce)" srcset="../examples/brand-studies/kimi/comparison.jpg"><img src="../examples/brand-studies/kimi/comparison.webp" width="100%" alt="Kimi · 磁力线 → 黑胶唱片"></picture></a></div>

<sub><a href="../examples/brand-studies/kimi/comparison.mp4">横屏大图</a> · <a href="../examples/brand-studies/kimi/comparison.mobile.mp4">竖屏 MP4</a> · <a href="https://x.com/Kimi_Moonshot/status/2077521842080817296">原片 00:30.75–00:35.75</a> · <a href="../examples/brand-studies/kimi/index.html">HTML</a></sub>

[使用这个场景的简报](examples.zh-CN.md#music-visual) · 参考片：[Google AI · Lyria 3](readme/media/M1139-clip.mp4)

<a id="features"></a>

## 核心卖点

<a id="what-is-openmotion"></a> <a id="openmotion-是什么"></a> <a id="video-is-code"></a>

### 1. OpenDesign 首个全栈 Agentic 视频生成器

**用 HTML 生成、剪辑和渲染视频。** Agent 在同一份工程里写镜头、设转场、对齐声音。想让片尾多停半秒，在 Studio 调整后重新渲染即可，其余镜头照旧。

<a id="bring-your-agent-and-keys"></a>

### 2. 完全开源免费，在本地 Agent 直接用，每一层都支持 BYOK

提供 **Codex、Claude Code、DeepSeek Harness 和 WorkBuddy** 四种本地 Agent 适配器。从 Agent 到各层媒体模型，都可沿用自己的账号或 API Key。OpenMotion 不收订阅费和渲染费；第三方模型调用按各自规则计费。

<p><img src="readme/agents/codex-badge.svg" width="144" alt="Codex">
<img src="readme/agents/claude-code-badge.svg" width="144" alt="Claude Code">
<img src="readme/agents/deepseek-harness-badge.svg" width="144" alt="DeepSeek Harness">
<img src="readme/agents/workbuddy-badge.svg" width="144" alt="WorkBuddy"></p>

[各 Agent 接入方式与验证状态](agent-adapters.md)

<a id="make-your-motion-language-reusable"></a> <a id="motion-design-community"></a>

### 3. Motion.md：首批计划开源 100 多个品牌的宣传片拆解

OpenMotion 首次定义了 **Motion.md**：用 Markdown 记录镜头顺序、时长、转场，以及哪些素材可以换成自己的。[Stripe 示例](../examples/brand-studies/stripe/MOTION.md) 记录了翻面的时机：把支付卡换成胶片画框，动作仍然落在同一拍。

<a id="resources-to-start-from"></a>

[资源目录](collections/README.md)有 **891 项创作资源**：42 支参考片、393 段动效、210 个区块、238 个组件和 8 个示例。可以用它们为自己的 Motion.md 选镜头、找转场。

<a id="motion-gallery"></a>

<details>
<summary>展开可编辑模板和 18 个目录精选</summary>

![OpenMotion Library：Skills、模板、动效组件、设计体系和 Brandkit。](readme/library.png)

#### 打开可编辑的创作起点

| [Product Promo · 20 秒](../template-library/product-promo) | [NYT Graph · 15 秒](../template-library/nyt-graph) | [Decision Tree · 10 秒](../template-library/decision-tree) |
| --- | --- | --- |
| ![Product Promo 预览](../template-library/product-promo/poster.jpg) | ![NYT Graph 预览](../template-library/nyt-graph/poster.jpg) | ![Decision Tree 预览](../template-library/decision-tree/poster.jpg) |
| 你的标题、产品和片尾 | 你的数据、单位和对比 | 你的问题、分支和答案 |

<table>
<tr><th colspan="3" align="left">📱 产品与界面</th></tr>
<tr>
<td width="33%" valign="top">
<a href="readme/media/app-showcase.mp4"><picture><source media="(prefers-reduced-motion: reduce)" srcset="../web/catalog/covers/51a2d141e18e608cc11b9256.jpg"><img src="readme/gallery/app-showcase.gif" width="300" alt="目录动态预览：App Showcase"></picture></a><br>
<strong>App Showcase</strong><br>
<sub>组件 · <a href="../library/components/showcase/README.md">查看组件</a></sub>
</td>
<td width="33%" valign="top">
<a href="../template-library/product-promo/index.html"><img src="../template-library/product-promo/poster.jpg" width="300" alt="Product Promo"></a><br>
<strong>Product Promo</strong><br>
<sub>可编辑模板 · <a href="../template-library/product-promo/index.html">HTML</a></sub>
</td>
<td width="33%" valign="top">
<a href="../library/skills/motion-design-remix/assets/ui-3d-reveal/reference.mp4"><picture><source media="(prefers-reduced-motion: reduce)" srcset="../web/catalog/covers/c13d0082838675f088ecadcd.jpg"><img src="readme/gallery/ui-3d-reveal.gif" width="300" alt="目录动态预览：3D UI Reveal"></picture></a><br>
<strong>3D UI Reveal</strong><br>
<sub>组件 · <a href="../library/skills/motion-design-remix/references/ui-3d-reveal/MOTION_DESIGN.md">查看组件</a></sub>
</td>
</tr>
<tr><th colspan="3" align="left">🚀 品牌与发布片</th></tr>
<tr>
<td width="33%" valign="top">
<a href="readme/media/jake-pond-reference.mp4"><picture><source media="(prefers-reduced-motion: reduce)" srcset="../web/catalog/covers/66ac2f8b58e55670971ae70c.jpg"><img src="readme/gallery/pond.gif" width="300" alt="目录动态预览：Pond: a new Linux OS"></picture></a><br>
<strong>Pond: a new Linux OS</strong><br>
<sub>参考 · <a href="readme/media/jake-pond-reference.mp4">@bflycomputer</a></sub>
</td>
<td width="33%" valign="top">
<a href="readme/media/remix-kimi-k3-reference.mp4"><picture><source media="(prefers-reduced-motion: reduce)" srcset="../web/catalog/covers/ac6e14a0fadb5893534e6438.jpg"><img src="readme/gallery/kimi-k3.gif" width="300" alt="目录动态预览：Kimi K3 teaser"></picture></a><br>
<strong>Kimi K3 teaser</strong><br>
<sub>参考 · <a href="readme/media/remix-kimi-k3-reference.mp4">@Kimi_Moonshot</a></sub>
</td>
<td width="33%" valign="top">
<a href="readme/media/remix-elevenlabs-reception-reference.mp4"><picture><source media="(prefers-reduced-motion: reduce)" srcset="../web/catalog/covers/bc4b8b4398d66159acd35890.jpg"><img src="readme/gallery/elevenlabs-reception.gif" width="300" alt="目录动态预览：Reception by ElevenLabs"></picture></a><br>
<strong>Reception by ElevenLabs</strong><br>
<sub>参考 · <a href="readme/media/remix-elevenlabs-reception-reference.mp4">@ElevenLabs</a></sub>
</td>
</tr>
<tr><th colspan="3" align="left">✍️ 动态文字</th></tr>
<tr>
<td width="33%" valign="top">
<a href="readme/media/glass-shard-title.mp4"><picture><source media="(prefers-reduced-motion: reduce)" srcset="../web/catalog/covers/10cceacc02d415247d58f562.jpg"><img src="readme/gallery/glass-shard-title.gif" width="300" alt="目录动态预览：Glass Shard Title"></picture></a><br>
<strong>Glass Shard Title</strong><br>
<sub>组件 · <a href="../library/components/showcase/README.md">查看组件</a></sub>
</td>
<td width="33%" valign="top">
<a href="../library/skills/motion-design-remix/assets/canopy-part-title/reference.mp4"><picture><source media="(prefers-reduced-motion: reduce)" srcset="../web/catalog/covers/998dd6bb8358592c15f727d6.jpg"><img src="readme/gallery/canopy-title.gif" width="300" alt="目录动态预览：Canopy Part Title"></picture></a><br>
<strong>Canopy Part Title</strong><br>
<sub>组件 · <a href="../library/skills/motion-design-remix/references/canopy-part-title/MOTION_DESIGN.md">查看组件</a></sub>
</td>
<td width="33%" valign="top">
<a href="../library/skills/motion-design-remix/assets/wireframe-portal-title/reference.mp4"><picture><source media="(prefers-reduced-motion: reduce)" srcset="../web/catalog/covers/4d03231a69d147a38f993578.jpg"><img src="readme/gallery/wireframe-title.gif" width="300" alt="目录动态预览：Wireframe Portal Title"></picture></a><br>
<strong>Wireframe Portal Title</strong><br>
<sub>组件 · <a href="../library/skills/motion-design-remix/references/wireframe-portal-title/MOTION_DESIGN.md">查看组件</a></sub>
</td>
</tr>
<tr><th colspan="3" align="left">💎 光影、玻璃与三维世界</th></tr>
<tr>
<td width="33%" valign="top">
<a href="readme/media/remix-iskra-light-reference.mp4"><picture><source media="(prefers-reduced-motion: reduce)" srcset="../web/catalog/covers/75cfbe06267768838d145fa4.jpg"><img src="readme/gallery/iskra-light.gif" width="300" alt="目录动态预览：Iskra Light"></picture></a><br>
<strong>Iskra Light</strong><br>
<sub>参考 · <a href="readme/media/remix-iskra-light-reference.mp4">@world_is_web</a></sub>
</td>
<td width="33%" valign="top">
<a href="../library/skills/motion-design-remix/assets/liquid-glass-widgets/reference.mp4"><picture><source media="(prefers-reduced-motion: reduce)" srcset="../web/catalog/covers/553a1464d8037293b7debca8.jpg"><img src="readme/gallery/liquid-glass-widgets.gif" width="300" alt="目录动态预览：Liquid Glass Widgets"></picture></a><br>
<strong>Liquid Glass Widgets</strong><br>
<sub>组件 · <a href="../library/skills/motion-design-remix/references/liquid-glass-widgets/MOTION_DESIGN.md">查看组件</a></sub>
</td>
<td width="33%" valign="top">
<a href="readme/media/remix-cyera-reference.mp4"><picture><source media="(prefers-reduced-motion: reduce)" srcset="../web/catalog/covers/8884a707a92d0cc52d3363b7.jpg"><img src="readme/gallery/cyera.gif" width="300" alt="目录动态预览：Cyera brand video"></picture></a><br>
<strong>Cyera brand video</strong><br>
<sub>参考 · <a href="readme/media/remix-cyera-reference.mp4">Cyera</a></sub>
</td>
</tr>
<tr><th colspan="3" align="left">🧭 纵深与镜头运动</th></tr>
<tr>
<td width="33%" valign="top">
<a href="../library/skills/motion-design-remix/assets/code-3d-extrude/reference.mp4"><picture><source media="(prefers-reduced-motion: reduce)" srcset="../web/catalog/covers/0a5c7158bbecd6e47055bef9.jpg"><img src="readme/gallery/code-3d.gif" width="300" alt="目录动态预览：Code 3D Extrude"></picture></a><br>
<strong>Code 3D Extrude</strong><br>
<sub>组件 · <a href="../library/skills/motion-design-remix/references/code-3d-extrude/MOTION_DESIGN.md">查看组件</a></sub>
</td>
<td width="33%" valign="top">
<a href="readme/media/remix-glyph-reference.mp4"><picture><source media="(prefers-reduced-motion: reduce)" srcset="../web/catalog/covers/4bfe08db4d486970494eff3b.jpg"><img src="readme/gallery/glyph.gif" width="300" alt="目录动态预览：Glyph: GPU typography for the web"></picture></a><br>
<strong>Glyph: GPU typography for the web</strong><br>
<sub>参考 · <a href="readme/media/remix-glyph-reference.mp4">@pmndrs</a></sub>
</td>
<td width="33%" valign="top">
<a href="readme/media/nyc-paris-flight.mp4"><picture><source media="(prefers-reduced-motion: reduce)" srcset="../web/catalog/covers/aeafb2433c37f2f7d8c87619.jpg"><img src="readme/gallery/flight-map.gif" width="300" alt="目录动态预览：NYC Paris Flight"></picture></a><br>
<strong>NYC Paris Flight</strong><br>
<sub>组件 · <a href="../library/components/showcase/README.md">查看组件</a></sub>
</td>
</tr>
<tr><th colspan="3" align="left">✨ 生成视觉</th></tr>
<tr>
<td width="33%" valign="top">
<a href="readme/media/aurora.mp4"><picture><source media="(prefers-reduced-motion: reduce)" srcset="../web/catalog/covers/5aefe7c9a916a38777443b36.jpg"><img src="readme/gallery/aurora.gif" width="300" alt="目录动态预览：Aurora"></picture></a><br>
<strong>Aurora</strong><br>
<sub>组件 · <a href="../library/components/showcase/README.md">查看组件</a></sub>
</td>
<td width="33%" valign="top">
<a href="readme/media/remix-linear-loops-reference.mp4"><picture><source media="(prefers-reduced-motion: reduce)" srcset="../web/catalog/covers/17cf5075b3f4b49c7d3e9201.jpg"><img src="readme/gallery/linear-loops.gif" width="300" alt="目录动态预览：Linear Loops"></picture></a><br>
<strong>Linear Loops</strong><br>
<sub>参考 · <a href="readme/media/remix-linear-loops-reference.mp4">@linear</a></sub>
</td>
<td width="33%" valign="top">
<a href="../library/skills/motion-design-remix/assets/code-particle-assemble/reference.mp4"><picture><source media="(prefers-reduced-motion: reduce)" srcset="../web/catalog/covers/8ff121deb9403f7a99ac52b3.jpg"><img src="readme/gallery/code-particles.gif" width="300" alt="目录动态预览：Code Particle Assemble"></picture></a><br>
<strong>Code Particle Assemble</strong><br>
<sub>组件 · <a href="../library/skills/motion-design-remix/references/code-particle-assemble/MOTION_DESIGN.md">查看组件</a></sub>
</td>
</tr>
</table>

</details>

[Motion.md 格式说明](motion-md.zh-CN.md)

<a id="all-in-one-studio"></a> <a id="full-video-creation-stack"></a>

<a id="model-wall"></a>

### 4. 多模态生成：图片、视频、音乐与语音

用已配置的模型生成缺少的镜头、配图、配乐或旁白，和实拍素材放在同一条时间轴上，对着画面调整。

<p><img src="readme/models/codex.svg" width="133" alt="Codex Image">
<img src="readme/models/nano-banana.svg" width="133" alt="Nano Banana 2">
<img src="readme/models/flux.svg" width="133" alt="FLUX Schnell">
<img src="readme/models/seedance.svg" width="133" alt="Seedance 2.0">
<img src="readme/models/wan.svg" width="133" alt="Wan 2.2">
<img src="readme/models/suno.svg" width="133" alt="Suno v4">
<img src="readme/models/kokoro.svg" width="133" alt="Kokoro"></p>

<details>
<summary>模型目录与供应商配置</summary>

| 视频所需素材 | 内置模型目录示例 | 如何用于影片 |
| --- | --- | --- |
| **🖼️ 图片** | Codex Image；Atlas Cloud 的 Nano Banana 2；fal.ai 的 FLUX Schnell | 品牌视觉、场景美术、辅助图片；受支持的 Codex 图片路径可基于参考图编辑 |
| **🎬 视频** | Atlas Cloud 的 Seedance 2.0；fal.ai 的 Wan 2.2 | 生成镜头和 B-roll，与实拍及动效组合 |
| **🎵 音乐** | Atlas Cloud 的 Suno v4 | 根据情绪和创作简报生成配乐 |
| **🎙️ TTS / 旁白** | fal.ai 的 Kokoro | 根据已确认脚本生成旁白，编排到画面和音乐中 |

[模型配置](model-gateway.md)

</details>

<a id="technical-guide"></a>

## 安装与技术文档

<a id="快速开始"></a> <a id="quick-start"></a>

### 快速开始

#### 运行 OpenMotion

**从免费本地创作全栈开始。** 连接自己的 Agent、打开内置模板或导入实拍，用本地应用渲染。需要生成新素材时，在 Model Settings 加入受支持的媒体 Key。

准备 Git、npm 和 [CI](../.github/workflows/ci.yml)固定的 **Node.js 26.11.1**。源码预览和导出还需要 Chrome/Chromium、FFmpeg/FFprobe。[运行环境配置](usage.md)

```sh
git clone --branch feature/motion https://github.com/nexu-io/html-anything.git openmotion
cd openmotion
npm ci
npm run build:studio
npm start
```

打开 **http://localhost:4173**。选择 **Templates → Ready to edit**，打开 **Product Promo**，用 **Connect Agent** 连接客户端。工程与凭据保存在 checkout 之外；用 `MOTION_DATA_DIR` 选择工作区。

#### 接入你的 Agent

支持插件的 Codex 可在 checkout 中运行：

```sh
bash scripts/install-motion.command
```

DeepSeek Harness、Claude Code 等客户端参见 [Agent 适配器指南](agent-adapters.md) 或[本地 MCP + Skills 安装器](npm-installation.md)。npm 包尚未公开发布，指南使用本地构建产物。[Windows 测试包](test-packages.md)

先尝试内置模板：

> 使用 OpenMotion 在 Studio 打开一份新的 20 秒 Product Promo 副本，导出 MP4，并保留可编辑工程。

然后改成你的作品：

> 保留结构与动画，用我提供的品牌素材替换标志、截图、主标题和片尾。展示新剪辑，然后让最后标题多停留两秒。

要从视频开始，请提供参考并使用[复刻简报](#reverse-engineer-a-video)。宿主无法在对话旁打开 Studio 时，可使用返回的本地工程链接。

也可以直接试一次品牌复刻。

> 用 OpenMotion 拆解 https://x.com/stripe/status/2049621560743608481 的 00:21.50–00:26.50。保留点击、推镜和翻面的节奏，把银行卡换成展示我产品的胶片。请在 Studio 里打开成片。

<details>
<summary>Skills、MCP 与 CLI</summary>

在 checkout 中发现并安装五个核心工作流，使用 [Skills CLI](https://github.com/vercel-labs/skills):

```sh
npx skills add ./skills --list
npx skills add ./skills --skill motion-director motion-production motion-template-to-video motion-recreate motion-video-to-template
```

这只复制指引，不安装运行时或注册 MCP。保持共享文档可用并单独连接应用，或使用上面的一体化本地安装器。

| Skill | 用途 |
| --- | --- |
| [motion-recreate](../skills/motion-recreate/SKILL.md) | 重建参考视频并对比结果 |
| [motion-template-to-video](../skills/motion-template-to-video/SKILL.md) | 改编已有可编辑模板 |
| [motion-director](../skills/motion-director/SKILL.md) | 原创影片、叙事、动作、声音与创作审片 |
| [motion-video-to-template](../skills/motion-video-to-template/SKILL.md) | 制作便携的可复用模板 |
| [motion-production](../skills/motion-production/SKILL.md) | 范围明确的修改、预览、检查、排错和导出 |

通过 **Connect Agent** 获取工作区专属配置。手动配置本地 stdio 客户端时使用绝对路径：

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

**十一个公开 MCP 工具**覆盖模板发现与详情、工程创建、读取、编辑、预览、媒体导入、导出、版本恢复与取消。共享工作流和引擎指引通过 MCP resources 提供。[工具契约](mcp-phase1-tools.md)

Studio 与 Agent 共用模板目录缓存：`motion_list_templates` 返回本地 JSONL 索引，`motion_get_template` 获取详情，`motion_create_project` 创建可编辑副本。目录环境随包保存；本地开发默认使用 DEV，正式包默认使用线上环境。[模板目录](template-catalog.md)

使用 `npm start` 启动应用，使用 `npm run mcp` 启动 stdio。具备 shell 的 Agent 可使用运行时返回的固定版本引擎 CLI 检查和渲染；托管修改仍遵守工程 revision 校验。[原生创作](../skills/motion-production/references/native.md)

</details>

<a id="product-tour"></a> <a id="产品界面"></a> <a id="connect-your-agent"></a> <a id="use-from-your-agent"></a> <a id="从-agent-接入"></a> <a id="your-agent-your-studio"></a>

<a id="reverse-engineer-a-video"></a>

### 从参考视频到可编辑工程

```text
用 OpenMotion 为我们的品牌重建附件参考视频。

研究：开头、镜头顺序、字体、转场和声音提示。
保留：选定片段的产品揭示方式与镜头节奏。
替换：用提供的素材替换标志、界面、主张、文案和片尾。
生成：遵循品牌与已确认脚本，通过已配置模型生成缺少的
图片、视频、背景音乐和 TTS 旁白。

创建可编辑工程，在 Studio 打开并对比参考的对应时刻。
解释剩余差异。审阅后导出 MP4，保留源码供后续修改。
```

<a id="ai-video-editing"></a> <a id="keep-editing-after-the-remake"></a>

<details>
<summary>在 Agent 或 Studio 里打开工程</summary>

#### 从 Agent 开始

把参考和品牌简报交给 DeepSeek Harness、Codex、Claude Code 或 WorkBuddy，让它重建视频、打开预览、修改并导出。继续使用原有账号和工作方式。

![面向 Codex 的 OpenMotion 嵌入式 Viewer，展示可编辑的 Product Promo 工程、预览、图层和时间轴。](readme/product-tour/codex-embedded.png)

*现有产品演示展示了为 Codex 宿主准备的 Studio Viewer。查看[录制范围](product-tour.md) 了解实际演示内容。*

#### 从 Studio 开始

浏览参考、打开模板或导入录制素材，选择 **Connect Agent**，按工作区说明连接客户端并提交简报。在同一时间轴审阅修改，也可以随时手动调整。

![独立 OpenMotion Studio，包含会话、保存的需求和可编辑视频工程。](readme/product-tour/standalone-studio.png)

<details>
<summary>查看 Claude Code 与模板交接</summary>

![本地终端中加载的 Claude Code 制作 Skills。](readme/product-tour/claude-code-skills.png)

终端截图证明本地 Skill 加载。[CLI 检查](readme/product-tour/cli-checks.png) 证明工程检查，不代表模型已完成一次复刻。

![Product Promo 工程的实际 CLI 检查：工程信息、lint 和时间轴检查。](readme/product-tour/cli-checks.png)

![Connect Agent 对话框：工作区专属连接说明与本地客户端选择。](readme/product-tour/connect-agent.png)

![Product Promo 模板预览，展开了可复制给 Agent 的模板专属指令。](readme/product-tour/template-to-agent.png)

**预览 → 复制指令 → 连同品牌素材粘贴给 Agent。** 内置模板创建可编辑副本；外部参考启动重建任务。[完整产品演示](product-tour.md)

</details>

两种入口使用同一本地应用和工程。Agent 在外部客户端运行，Studio 保存简报与可编辑作品。[连接原理](session-architecture.md)

</details>

<a id="open-projects-reusable-knowledge"></a> <a id="developer-architecture"></a>

### 系统架构

**HTML 是可编辑视频源码，MP4 是渲染交付物。** OpenMotion 组合 TypeScript 应用、React Studio、Agent 工作流、多模态生成适配器与浏览器合成渲染引擎。工程是人和 Agent 共用的作品。

#### 各模块如何协同

![本地 Agent 通过九个 MCP 工程工具连接，Studio 通过本地 HTTP 接入。应用管理版本、素材与导出任务，Model Gateway 向工程提供媒体，并对固定快照渲染和验证。](readme/diagrams/runtime-architecture.svg)

<details>
<summary>查看完整架构与路线图文字说明</summary>

```text
创作输入
参考视频 + 实拍 + 脚本 + 品牌素材
                 ↓
社区知识
Motion.md + BRANDKIT.md + Skills + 模板 + 组件
                 ↓
BYOA：本地 Agent                       OPENMOTION STUDIO
DeepSeek Harness / Codex / Claude Code  React 19 + TypeScript + Vite
其他本地宿主、Skills 与宿主分析工具     Tailwind CSS + Zustand
                 |                     CodeMirror + Dockview
          stdio MCP                    素材 / 预览 / 时间轴
          9 个公开工程工具             本地 HTTP
                 └──────────┬──────────┘
                            ↓
本地应用：Node.js + TypeScript + node:http
会话 / 工程文件 / 素材 / revision / 导出任务
                 ↓                         ↓
BYOK：MODEL GATEWAY                    视频即代码
你的 Key / 账号 / 模型路由             HTML 场景 + 素材 + Studio 数据
发现 / 生成任务                       HTML + CSS + JavaScript + GSAP
                 ↓                         ↑
模型适配器                                 |
Codex Image / Atlas Cloud / fal.ai          |
图片 / 视频 / 音乐 / TTS                   |
                 ↓                         |
生成候选 → 预览 / 选择 → 显式采用到工程 ────┘
                            ↓
渲染与验证
固定工程快照 → HTML 引擎 + Chromium → FFmpeg / FFprobe
                            ↓
当前交付
MP4 + 可编辑源码 + 素材 + 版本和导出证据
                            ↓
规划中：多平台发布
平台连接器 → 发布审阅 → 排期 → 表现反馈
                            ↓
规划中：知识反馈
版本关联结果 → 团队记忆 / RAG → 经评估的 Skill 改进
```

</details>

BYOA 让 Agent 留在已有客户端，BYOK 连接受支持的模型账号。Studio 与本地服务管理工程，供应商凭据独立保存。一期公开 MCP 包含**十一个工具：九个工程工具与两个模板目录工具**；模型生成经 Studio 和本地 Gateway 使用，架构图不意味着公开 MCP 新增了生成或发布工具。

以上为可编辑 SVG 图，由[无依赖的小型脚本](readme/diagrams/generate.py)生成。

#### 技术栈与源码索引

| 层次 | 技术 | 阅读入口 |
| --- | --- | --- |
| **Studio 与编辑器界面** | React 19、TypeScript 5.9、Vite 6、Tailwind CSS 4、Zustand、CodeMirror、Dockview | [Studio 源码](../studio/src) · [Motion 应用](../studio/src/motion/MotionApp.tsx) · [编辑器开发](editor-fork.md) |
| **应用运行时** | CI 固定 Node.js 26.11.1，原生 HTTP、TypeScript 执行和本地文件/JSON | [server.ts](../server.ts) · [workspace.ts](../workspace.ts) · [会话架构](session-architecture.md) |
| **Agent 接入** | 本地 stdio MCP、五个核心 Skills 和生成的宿主适配器 | [mcp.ts](../mcp.ts) · [phase1.ts](../phase1.ts) · [适配器生成](../scripts/export-adapters.ts) |
| **多模态生成** | Codex 媒体适配器、Atlas Cloud predictions、fal.ai 队列集成与持久化生成任务 | [Gateway 服务](../gateway/service.ts) · [供应商适配器](../gateway/providers.ts) · [模型目录](../gateway/catalog.ts) |
| **合成与动效** | HTML/CSS/JS、GSAP、固定版本合成引擎与原生时间轴/历史 | [引擎集成](../hyperframes.ts) · [模板源码](../template-library) · [版本适配器](../phase1-versions.ts) |
| **渲染与媒体** | Chromium、Puppeteer Core、FFmpeg、FFprobe | [渲染服务](../server.ts) · [导出校验器](../scripts/verify-export.ts) · [原生运行时锁定](../scripts/runtime-lock.json) |
| **创作知识** | Markdown、源码包、预设和对比证据 | [Motion.md](motion-md.zh-CN.md) · [核心 Skills](../skills) · [社区资源库](../library/README.zh-CN.md) |
| **验证与打包** | Node 测试运行器、Vitest、Studio 检查、npm 锁文件和显式分发清单 | [测试](../tests) · [Studio 测试](../studio/tests) · [CI](../.github/workflows/ci.yml) · [分发](../scripts/distribution.ts) |
| **发布与学习 — 规划中** | 平台适配器、排期、版本关联反馈与检索，实现仍待设计 | [Studio 蓝图](product/studio-vision.md) |

依赖锁定在 [package.json](../package.json)、[package-lock.json](../package-lock.json) 和[运行时锁文件](../scripts/runtime-lock.json)中。模型和第三方库保留各自条款；应用采用 Apache-2.0。

#### 选择一层，一起建设

| 你的方向 | 可贡献的内容 | 入口 |
| --- | --- | --- |
| **前端与交互** | 改进时间轴、媒体生成控件、无障碍或预览行为 | [Studio](../studio/src) · [媒体生成器](../studio/src/motion/MediaGenerator.tsx) |
| **AI 与模型基础设施** | 沿用共享任务与媒体流程，新增供应商适配器或模型预设 | [Gateway 设计](product/media-generation-design.md) · [供应商适配器](../gateway/providers.ts) |
| **Agent 与开发工具** | 改进宿主适配器、Skill、资源指引或工程工具流程 | [Agent 适配器](agent-adapters.md) · [MCP 契约](mcp-phase1-tools.md) |
| **动效与创意编程** | 分享组件、原生模板或带真实改编的 Motion.md 包 | [组件](../library/components/README.md) · [条目清单](../library/ENTRY_TEMPLATE.md) |
| **视频与渲染** | 改进导出可靠性、媒体处理或可复现验证 | [引擎说明](hyperframes.md) · [导出校验器](../scripts/verify-export.ts) |
| **社交发布** | 设计规划中的连接器层：账号访问、发布审阅、排期和版本映射 | [发布方向](product/studio-vision.md) · [讨论提案](https://github.com/nexu-io/html-anything/issues) |

从[本地安装](#quick-start)开始，选择一层，遵循 [CONTRIBUTING.md](../CONTRIBUTING.md) 和 [AGENTS.md](../AGENTS.md)。工程与凭据放在 checkout 外，保留依赖锁定与上游许可。

**架构承诺：** 人与 Agent 共用工程；revision 校验避免基于旧状态误改；生成候选经显式采用进入影片；导出使用固定快照。技术、视觉、声音和实际播放分别验证。

[产品架构](product/architecture.md) · [Studio 开发](../studio/README.md) · [Model Gateway](model-gateway.md) · [贡献指南](../CONTRIBUTING.md)

<a id="one-video-more-places-to-share"></a> <a id="publish-to-every-platform"></a>

<a id="super-motion-video-agent"></a> <a id="status--roadmap"></a> <a id="当前状态与路线图"></a> <a id="roadmap"></a>

**路线图。** 目前可以在本地导出 MP4。平台直发、定时发布和多人审阅仍在规划中。[Studio 路线图](product/studio-vision.md)

<a id="社区共建"></a> <a id="community"></a>

### 社区

[OpenMotion 官网](https://open-design.ai/openmotion?utm_source=github&utm_medium=referral&utm_campaign=openmotion&utm_content=readme_zh) · [OpenDesign Go](https://go.open-design.ai/?utm_source=github&utm_medium=referral&utm_campaign=openmotion&utm_content=readme_zh) · [Discord](https://discord.gg/mHAjSMV6gz) · [X @OpenDesignDevs](https://x.com/OpenDesignDevs) · [X @OpenDesignHQ](https://x.com/OpenDesignHQ) · [YouTube](https://www.youtube.com/channel/UChtshixMhvtgBWzoD9R_Qfg)

[参与贡献](../CONTRIBUTING.md) · [反馈问题](https://github.com/nexu-io/html-anything/issues)

<a id="acknowledgements"></a>

### 致谢 / Acknowledgements

品牌原片的发布者及时间码见对照区。 [Agent 与模型标志](readme/models/README.md)

OpenMotion 采用 [Apache-2.0](../LICENSE)许可。第三方代码、模板、媒体和字体保留各自许可证和署名。

| 来源 | 关联 |
| --- | --- |
| [OpenDesign](https://github.com/nexu-io/open-design) | 界面来源、资源结构和品牌方向；[设计体系](design-system.md) 和 [Motion 展示](https://open-design.ai/motion/) |
| [Hyperframes](https://github.com/heygen-com/hyperframes) | HTML 视频合成、Studio 和渲染基础，固定为 0.9.7；创作者参考、外部改编演示与组件源码；[引擎说明](hyperframes.md)、[模板声明](../template-library/NOTICE.md) 和[目录来源](template-catalog.md) |
| [MotionGit](https://motiongit.com/) / adunext | Kinetic Tech 源码以 Presenter Tech 打包；[许可与署名](../library/templates/presenter-tech/NOTICE.md) |
| [Hypit](https://github.com/hypit-ai/hypit) | Agent 主导热门视频复刻与可编辑版本的灵感来源；未引入运行时 |
| [rea-video](https://github.com/JuneYaooo/rea-video) | 参考分析与案例研究：[实拍开箱](https://github.com/JuneYaooo/rea-video/blob/main/docs/cases/unboxing/report_en.md) 及[角色、代码和屏幕录制](https://github.com/JuneYaooo/rea-video/blob/main/docs/cases/dual_role/report_en.md)；[展示素材署名](readme/brand-showcase/README.md)，未引入运行时 |
| [OpenAI · Codex Originals](https://openai.com/codex-originals/) | 外部品牌影片参考；官方活动静帧与站外观看链接 |
| [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness) / [Super-agent 原型](https://github.com/deepseek-ai/dsh-superagent-prototype) | Agent 可扩展性与持续任务的参考；该原型独立于 OpenMotion 当前运行时 |
| Claude Motion / CapCut / [ChatCut](https://chatcut.io/docs/what-is-chatcut) / [OpenChatCut](https://github.com/0xsline/OpenChatCut) | Agent 创作、易用 AI 剪辑与持续改稿的产品参考 |
| [OpusClip](https://www.opus.pro/calendar) | 分发与[外部排期](https://www.opus.pro/tools/instagram-reels-scheduler)的产品参考；无内置连接器 |
| [GSAP](https://github.com/greensock/GSAP) / [FFmpeg](https://ffmpeg.org/) | 动画与媒体依赖，版本保留在 [package.json](../package.json) 和[运行时锁文件](../scripts/runtime-lock.json) |

[素材来源](readme/ASSETS.md) · [其他展示素材来源](readme/brand-showcase/README.md) · [封面与提示词](readme/reverse-engineering-cover.md) · [字体声明](../web/design-system/fonts/NOTICES.txt) · [Studio 许可证](../studio/LICENSE)

原 HTML Anything 应用保留在 [`legacy` 分支](https://github.com/nexu-io/html-anything/tree/legacy)。当前分支与分发边界参见[仓库迁移指南](repository-migration.md) 。
