# Orbit Launch — motion specification

## Intent and editable inputs

Announce one product idea in six seconds. Replace the headline, supporting line and lime accent while preserving the sequence: moving signal, settled marker, headline, supporting line, final hold.

The reference implementation is `preview.html`; the canvas is 960 × 540 at 30 fps. It is original geometric artwork with no external media, fonts or network requests. Audio is intentionally absent.

## Visual system

- Background: deep blue-black `#101b20`, subtle 48 px grid, fine off-white rules.
- Accent: lime `#d6f573`; body text: warm white `#f5f4e9`; secondary text: muted gray-green.
- Left: three thin concentric orbits centered at (220, 270), with a moving signal that becomes a fixed marker.
- Right: a two-line uppercase headline anchored at (402, 202); supporting line below it; all text stays inside 60 px canvas margins.
- Typography: system sans-serif. Use weight 650–750 for the headline and generous leading for support text. Never require an external font download.

## Timing

| Time | Event | Rule |
| --- | --- | --- |
| 0.00–0.85 s | Orbits draw into view | Fade from 0 with a small scale change from 0.94 to 1; ease out. |
| 0.20–1.80 s | Signal follows the outer orbit | Sweep through 270 degrees, then settle at the rightmost point; the trail fades. |
| 1.15–2.05 s | Two-line headline enters | Move upward 24 px and fade in, with the second line delayed by 0.15 s. |
| 2.00–2.60 s | Supporting line and launch label appear | Fade and move upward 10 px; keep the hierarchy quiet. |
| 2.60–6.00 s | Final hold | Keep text stable. A very subtle signal halo may breathe; avoid looping the headline. |

All entrances use an ease-out cubic curve. Do not use bounce, elastic overshoot or a scale-from-zero reveal. The final message should read clearly from a still frame.

## Adaptation

Edit the text nodes with IDs `headline-one`, `headline-two` and `support`, and change `--accent`. Keep the headline to two lines. For a portrait composition, stack the orbit above the headline and preserve timing; do not crop the landscape canvas and lose the copy.

The example is a guidance implementation, not an editable-project manifest. For an OpenMotion project, author a new native composition from these rules, follow the installed engine guide and the project's revision contract, and keep user projects outside this source checkout.

## Review

Play the complete six seconds and inspect the first frame, reveal at 1.5 seconds and final hold at 3.5 seconds. Check the headline at a 480 px wide preview, the marker's final position, and the absence of clipped copy or external requests. Verify rendered duration and frame changes separately from human visual acceptance.

## Provenance and license

Original repository contribution under Apache-2.0. No third-party audiovisual material is incorporated. The silent MP4 and JPEG poster derive from this HTML example; their exact identities are recorded in `manifest.json` and, after maintainer preparation, `template.json.remoteAssets`.
