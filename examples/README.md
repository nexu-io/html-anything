# Remix the README films

Each folder contains the editable HTML and the exported film. All examples run at 30 fps. The reference study has its own sound cues. The three other films are designed for silent viewing.

## Twenty seconds · reference study

Watch a five-second Firecrawl excerpt, read the shot decisions in Markdown, and compare two OpenMotion exports. One uses the 20-second Product Promo template as its headline, the other the 15-second NYT Graph template. Both share the same five-second motion. [Reference, Motion MD and editing instructions](reference-reveal/MOTION.md) · [First cut](reference-reveal/film.mp4) · [Second cut](reference-reveal/graph-cut.mp4)

## Made in Codex

**Brief** · Introduce OpenMotion in 12 seconds using the original OpenDesign symbol and one real screenshot. Let the viewer see an editable project before the brand signs off.

| Time | Shot | Try changing |
| --- | --- | --- |
| 0–3s | Green rings expand behind “Made in Codex.” | Use your release headline and accent color. |
| 3–8s | The Studio screenshot slides in and scales up. | Replace the screenshot with the feature your headline promises. |
| 8–12s | The symbol and closing line take over the frame. | Replace the sign-off and give it time to read. |

The images are the [official brand mark and Studio capture](../docs/readme/ASSETS.md). To make your own product film, replace the two images in the example’s assets folder. [Watch the cut](launch-in-codex/film.mp4) · [Open the composition](launch-in-codex/index.html)

## The Long Return

**Brief** · Show how daylight returns to two European cities at different rates. Introduce Reykjavík with bars, draw Lisbon over the same axis, then reveal the difference on June 1.

The observations are hours and minutes between sunrise and sunset on the **first day** of each month in 2026. The source file stores them as minutes. The final reading subtracts the Lisbon value from the Reykjavík value for June.

| City | Jan 1 | Feb 1 | Mar 1 | Apr 1 | May 1 | Jun 1 |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| Reykjavík | 4h 24m | 7h 07m | 10h 11m | 13h 33m | 16h 52m | 20h 07m |
| Lisbon | 9h 31m | 10h 16m | 11h 20m | 12h 38m | 13h 49m | 14h 42m |

Data from the U.S. Naval Observatory, calculated at 64.15° N, 21.94° W and 38.72° N, 9.14° W. [Reykjavík daylight table](https://aa.usno.navy.mil/calculated/durdaydark?year=2026&task=0&lat=64.15&lon=-21.94&label=Reykjavik&tz=0&tz_sign=1) · [Lisbon daylight table](https://aa.usno.navy.mil/calculated/durdaydark?year=2026&task=0&lat=38.72&lon=-9.14&label=Lisbon&tz=0&tz_sign=1)

To adapt the chart, change the observations array, city labels, units and source credit in the HTML. [Watch the cut](longer-days/film.mp4) · [Open the chart](longer-days/index.html)

## Pick Your Cut

**Brief** · Explain three ways to start a film on a phone screen. Give each option its own shape and color, with time to read all three together at the end.

The first card starts moving at 0.65 seconds, the second at 2.65 and the third at 4.65. The film holds the final stack to the nine-second mark. To adapt it, replace the question, the three card headings and their supporting lines. The canvas is already 720 × 1280. [Watch the vertical cut](pick-your-cut/film.mp4) · [Open the cards](pick-your-cut/index.html)

## Try a second cut in Codex

Install the plugin using the [quickstart](../README.md#start-in-codex). Open the repository containing these files in Codex, then point it at one folder. For example:

> Use OpenMotion to make a fresh editable project from examples/launch-in-codex/index.html and its two images. Keep the 12-second timeline. Replace “Made in Codex.” with “Meet our new editor.” Open it in Studio and export the silent MP4.

The native project supplies the local GSAP runtime at `assets/gsap.min.js`. You can change the timing with Codex, then play the revised cut in Studio.

## Render a source file locally

From this checkout, install the [render prerequisites](../README.md#start-in-codex) and run `npm ci` if dependencies are not installed. This example uses the pinned local renderer. Change `example` to any of the other folder names to render that film. The temporary folder keeps the original MP4 available for comparison.

```sh
example=longer-days
work=$(mktemp -d)
mkdir -p "$work/assets"
cp "examples/$example/index.html" "$work/index.html"
if [ -d "examples/$example/assets" ]; then
  cp -R "examples/$example/assets/." "$work/assets/"
fi
cp node_modules/gsap/dist/gsap.min.js "$work/assets/"
node node_modules/hyperframes/bin/hyperframes.mjs render "$work" --fps 30 --output "$work/film.mp4"
printf '%s\n' "$work/film.mp4"
```
