# Presenter Tech · 科技风口播模板

**A local OpenMotion Library template package for presenter-led explainers, animated keywords and visual demonstrations.** Editable source, input schemas, fonts, native sound recipes and the runner are included in [presenter-tech.motion](presenter-tech.motion). The `.motion` file is a ZIP archive; keep the original and create a separate working copy.

**1920 × 1080 · 60 fps · landscape.** Replace the presenter, topic, wording, screen assets and measured captions. Use the supplied template runner through your Agent. This library package is separate from the three templates opened directly in Studio; it does not add general `.motion` importing to Studio.

[Motion Design](MOTION_DESIGN.md) · [Adaptation instructions](TEMPLATE.md) · [Verification](verification.json) · [Credits and license](NOTICE.md)

## Give it to your Agent

> Use the Presenter Tech package in `library/templates/presenter-tech/`. Read its TEMPLATE.md and the package's creation guide. Use my topic, recording and screen materials; preserve the motion style, align captions to my actual speech and show me a preview before the final export. Keep the package intact and work in a new directory.

## Run locally

Requires Node.js 22+, Python 3.11+, `uv`, FFmpeg/ffprobe and an existing Chrome/Chromium. The runner's pinned Node dependency is installed in its own working directory; the application root and its lockfiles are unchanged. Python dependencies are declared in the runner and resolved by `uv`.

From the repository root, choose an unused directory outside the checkout:

```sh
set -e
mkdir /tmp/openmotion-presenter-tech
python3 -m zipfile -e library/templates/presenter-tech/presenter-tech.motion /tmp/openmotion-presenter-tech/runner
cd /tmp/openmotion-presenter-tech/runner
npm ci
```

For the included **technical smoke example** (text motion, native sound effects, no presenter or narration):

```sh
uv run adapter.py plan --input examples/text-only.json --out ../plan.json
uv run adapter.py prepare --input examples/text-only.json --out ../instance
uv run adapter.py preview --instance ../instance --out ../preview.png --time 3
uv run adapter.py render --instance ../instance --out ../silent.mp4
```

The final file is `../silent-with-audio.mp4`. For a real video, use a new input document with your material and follow [TEMPLATE.md](TEMPLATE.md); the technical fixture is not your episode. On shared machines, run browser operations through your team's existing browser-lock lane.
