# Orbit Launch

A six-second, original motion recipe for a product announcement: a moving signal travels around an orbit, resolves into a launch marker, and reveals one headline with a short supporting line.

## Use this template

1. Read [the motion specification](source/motion.md).
2. Open [the interactive example](source/preview.html). It runs offline with no build, remote font or JavaScript dependency. Play, pause, replay or scrub the six-second animation.
3. Replace the headline, supporting line and accent color in the example, then adapt the composition to your project using the connected OpenMotion Agent.
4. Keep the marker, headline and supporting line in that reveal order. Check legibility at your target size.

This catalog entry contains guidance and an authored HTML example. It is not registered as a directly copyable Studio project; `hasHtmlProject` remains false. An Agent should read the local source and create an independent project rather than request a template-copy operation.

## Editable inputs

- Headline: `YOUR NEXT CHAPTER`, up to 24 characters across two lines.
- Supporting line: `One clear idea. Ready for launch.`, up to 48 characters.
- Accent: the `--accent` CSS custom property.
- Canvas: 960 by 540, six seconds, silent. Keep the final message visible for at least two seconds.

## Source and rights

Original HTML, motion rules, geometric artwork and rendered preview were authored for this repository contribution. They contain no third-party footage, logos, audio or remote dependencies and are contributed under the repository's Apache-2.0 license. System sans-serif fonts are used without redistributing font files.

## Verification scope

The example exposes deterministic `window.orbitLaunch.seek(seconds)` playback for frame inspection. The supplied silent MP4 is rendered from that example; the poster uses its final hold. Technical playback and catalog/MCP checks do not establish human visual acceptance or native Studio export verification.
