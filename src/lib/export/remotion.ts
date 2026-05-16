"use client";

/**
 * Hyperframes → Remotion project (.zip).
 *
 * We do NOT render an mp4 in the browser or on the server — that would require
 * either ffmpeg.wasm (huge bundle, slow, breaks on long videos) or a
 * long-running server process (forbidden, see CONTRIBUTING.md "no daemon, no
 * extra processes").
 *
 * Instead we emit a minimal, ready-to-render Remotion project as a zip. The
 * user unzips, runs `npm install && npx remotion render`, and gets their mp4.
 *
 * Each frame ships as an independent standalone HTML file under `public/frames/`.
 * The Remotion components mount that HTML inside an `<iframe>` sized to the
 * composition — this preserves Tailwind CDN / fonts / inline <style> exactly
 * as authored, no JSX conversion needed.
 */

import type { HyperframesParsed, HyperFrame } from "@/lib/hyperframes";
import { downloadBlob } from "./image";

const FPS = 30;
const CANVAS_W = 1920;
const CANVAS_H = 1080;
/** Cross-fade window in frames (≈ 0.4s at 30fps). */
const FADE_FRAMES = 12;

/** Slugify the document title for the zip filename. */
function slug(s: string, fallback: string): string {
  const out = s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
  return out || fallback;
}

const pad = (n: number) => String(n).padStart(2, "0");

/** ms → frames at FPS (rounded, minimum 1 frame). */
function msToFrames(ms: number): number {
  return Math.max(1, Math.round((ms / 1000) * FPS));
}

/**
 * Build a standalone HTML document for one frame. The original document's
 * `<head>` is preserved so Tailwind CDN, web fonts, and inline styles all
 * keep working when Remotion loads this inside an iframe.
 */
function buildFrameHtml(parsed: HyperframesParsed, frame: HyperFrame): string {
  // Neutralise the autoplay script + global flex centering from the source
  // doc — inside the iframe each frame stands alone at 1920×1080.
  const resetCss = `
  html, body { margin:0; padding:0; width:${CANVAS_W}px; height:${CANVAS_H}px; overflow:hidden; }
  .frame { display:flex !important; opacity:1 !important; transform:none !important; }
  /* Hide the original deck's controls/progress UI if any leaked into <head>. */
  .controls, #progress, .progress-bar { display:none !important; }
`.trim();

  const bodyAttrs = [
    parsed.bodyClass ? `class="${parsed.bodyClass}"` : "",
    parsed.bodyStyle ? `style="${parsed.bodyStyle}"` : "",
  ]
    .filter(Boolean)
    .join(" ");

  return `<!DOCTYPE html>
<html>
<head>
${parsed.head}
<style>${resetCss}</style>
</head>
<body ${bodyAttrs}>
<section class="frame active" data-duration="${frame.duration}">
${frame.innerHtml}
</section>
</body>
</html>`;
}

/* -------------------------------------------------------------------------- */
/* Remotion project source templates                                          */
/* -------------------------------------------------------------------------- */

const PACKAGE_JSON = (name: string, totalSeconds: number) =>
  JSON.stringify(
    {
      name,
      version: "1.0.0",
      private: true,
      description: `Hyperframes → Remotion project (≈${totalSeconds.toFixed(1)}s, ${CANVAS_W}×${CANVAS_H} @ ${FPS}fps)`,
      scripts: {
        start: "remotion studio",
        render: "remotion render Hyperframes out/video.mp4",
        upgrade: "remotion upgrade",
      },
      dependencies: {
        react: "^19.0.0",
        "react-dom": "^19.0.0",
        remotion: "^4.0.0",
        "@remotion/cli": "^4.0.0",
        "@remotion/transitions": "^4.0.0",
      },
      devDependencies: {
        "@types/react": "^19.0.0",
        "@types/node": "^20.0.0",
        typescript: "^5.0.0",
      },
    },
    null,
    2,
  );

const TSCONFIG = JSON.stringify(
  {
    compilerOptions: {
      // ES2020+ for Array.prototype.flatMap (used in Video.tsx) and modern
      // syntax Remotion/Chromium supports natively.
      target: "ES2020",
      module: "ESNext",
      jsx: "react-jsx",
      strict: true,
      moduleResolution: "Bundler",
      esModuleInterop: true,
      skipLibCheck: true,
      resolveJsonModule: true,
      allowSyntheticDefaultImports: true,
    },
    include: ["src"],
  },
  null,
  2,
);

const REMOTION_CONFIG = `import { Config } from "@remotion/cli/config";

Config.setVideoImageFormat("jpeg");
Config.setConcurrency(1);
// Hyperframes load Tailwind via CDN inside an iframe — give it room to load.
Config.setDelayRenderTimeoutInMilliseconds(60_000);
Config.setChromiumOpenGlRenderer("angle");
`;

const INDEX_TS = `import { registerRoot } from "remotion";
import { Root } from "./Root";

registerRoot(Root);
`;

const ROOT_TSX = (totalFrames: number) => `import * as React from "react";
import { Composition } from "remotion";
import { Hyperframes } from "./Video";

export const Root: React.FC = () => {
  return (
    <Composition
      id="Hyperframes"
      component={Hyperframes}
      durationInFrames={${totalFrames}}
      fps={${FPS}}
      width={${CANVAS_W}}
      height={${CANVAS_H}}
    />
  );
};
`;

const FRAME_TSX = `import * as React from "react";
import { useEffect, useRef, useState } from "react";
import { AbsoluteFill, delayRender, continueRender, staticFile } from "remotion";

type Props = {
  /** Path under public/, e.g. "frames/frame-01.html". */
  src: string;
  /** Optional scene summary — used as the iframe title for a11y. */
  scene?: string;
};

/**
 * One frame of the Hyperframes video. Renders the original standalone HTML
 * inside an iframe at native 1920×1080 — preserves Tailwind CDN / fonts /
 * custom <style> verbatim. We block Remotion's render with delayRender() until
 * the iframe's load event fires so the screenshot captures fully-loaded CSS.
 *
 * Cross-fade transitions are NOT done here — they're handled by
 * <TransitionSeries.Transition presentation={fade()}/> in Video.tsx so adjacent
 * frames actually overlap instead of dipping to black.
 */
export const Frame: React.FC<Props> = ({ src, scene }) => {
  const ref = useRef<HTMLIFrameElement>(null);
  const [handle] = useState(() => delayRender("Loading iframe: " + src));

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let released = false;
    const release = () => {
      if (released) return;
      released = true;
      continueRender(handle);
    };
    if (el.contentDocument?.readyState === "complete") {
      release();
      return;
    }
    el.addEventListener("load", release, { once: true });
    // Always release on unmount — Remotion warns about leaked handles if the
    // sequence ends before the iframe's load event fires.
    return () => {
      el.removeEventListener("load", release);
      release();
    };
  }, [handle]);

  return (
    <AbsoluteFill style={{ background: "#000" }}>
      <iframe
        ref={ref}
        src={staticFile(src)}
        title={scene || src}
        style={{ width: "100%", height: "100%", border: 0, display: "block" }}
        // sandbox left permissive — frames are author-controlled HTML.
      />
    </AbsoluteFill>
  );
};
`;

type SequenceEntry = {
  src: string;
  durationInFrames: number;
  transition: string;
  scene: string;
};

const VIDEO_TSX = (entries: SequenceEntry[]) => {
  const items = entries
    .map(
      (e, i) =>
        `  { src: ${JSON.stringify(e.src)}, durationInFrames: ${e.durationInFrames}, transition: ${JSON.stringify(e.transition)}, scene: ${JSON.stringify(e.scene)} }${i === entries.length - 1 ? "" : ","}`,
    )
    .join("\n");

  return `import * as React from "react";
import { TransitionSeries, linearTiming } from "@remotion/transitions";
import { fade } from "@remotion/transitions/fade";
import { Frame } from "./Frame";

const FADE_FRAMES = ${FADE_FRAMES};

const FRAMES = [
${items}
];

/**
 * <TransitionSeries> overlaps adjacent <Sequence>s by the transition's
 * durationInFrames, so a "fade" here is a real cross-fade — not the dip-to-
 * black you'd get from animating opacity inside back-to-back <Series>.
 *
 * Each transition consumes FADE_FRAMES from BOTH neighbours, so total
 * composition length = sum(sequences) - sum(active transitions). The Root
 * composition's durationInFrames is precomputed by the exporter to match.
 */
export const Hyperframes: React.FC = () => {
  return (
    <TransitionSeries>
      {FRAMES.flatMap((f, i) => {
        const seq = (
          <TransitionSeries.Sequence
            key={\`s-\${i}\`}
            durationInFrames={f.durationInFrames}
          >
            <Frame src={f.src} scene={f.scene} />
          </TransitionSeries.Sequence>
        );
        const isLast = i === FRAMES.length - 1;
        if (isLast || f.transition !== "fade") return [seq];
        return [
          seq,
          <TransitionSeries.Transition
            key={\`t-\${i}\`}
            presentation={fade()}
            timing={linearTiming({ durationInFrames: FADE_FRAMES })}
          />,
        ];
      })}
    </TransitionSeries>
  );
};
`;
};

const README_MD = (
  basename: string,
  sourceTitle: string,
  frames: HyperFrame[],
  totalSeconds: number,
) => {
  // Preserve the (possibly non-ASCII) original title — `basename` is the
  // ASCII-only slug used for filenames.
  const heading =
    sourceTitle && sourceTitle.toLowerCase() !== basename ? sourceTitle : basename;
  const list = frames
    .map(
      (f) =>
        `- frame ${pad(f.i)} · ${(f.duration / 1000).toFixed(1)}s · ${f.transition} · ${f.scene || "(no scene)"}`,
    )
    .join("\n");
  return `# ${heading}

Auto-generated Remotion project from a Hyperframes HTML doc.

- ${frames.length} frames · ~${totalSeconds.toFixed(1)}s · ${CANVAS_W}×${CANVAS_H} @ ${FPS} fps
- Source HTML preserved at \`hyperframes.html\`
- Each frame is a standalone HTML doc under \`public/frames/\` and is mounted in an \`<iframe>\` by \`src/Frame.tsx\`
- Cross-fades use \`<TransitionSeries>\` + \`@remotion/transitions/fade\` (real overlap, not dip-to-black)

## Render to mp4

\`\`\`bash
npm install
npx remotion render Hyperframes out/video.mp4
\`\`\`

## Preview / tweak

\`\`\`bash
npx remotion studio
\`\`\`

Then open the Hyperframes composition. Edit frame timings or transitions by
changing the \`FRAMES\` array in \`src/Video.tsx\`.

## Notes

- **Render is single-threaded by default** (\`Config.setConcurrency(1)\` in \`remotion.config.ts\`) because each frame's iframe re-fetches Tailwind from \`cdn.tailwindcss.com\` on mount. Expect render time roughly proportional to N × (CDN load + screenshot). To speed up: bump concurrency in \`remotion.config.ts\`, or replace the CDN \`<script>\` in each \`public/frames/frame-NN.html\` with a precompiled stylesheet.
- **Relative asset URLs inside a frame's HTML will 404.** Each frame is served from \`public/frames/frame-NN.html\`, so \`<img src="logo.png">\` resolves to \`/frames/logo.png\`. Either drop the asset under \`public/frames/\`, inline it as a data-URL, or use an absolute URL.

## Frames

${list}
`;
};

/* -------------------------------------------------------------------------- */
/* Public API                                                                 */
/* -------------------------------------------------------------------------- */

export type ExportRemotionOptions = {
  /** Original HTML source — included in the zip for reference / re-renders. */
  sourceHtml?: string;
};

/**
 * Build a Remotion project zip from parsed Hyperframes and trigger the
 * browser download. No server, no ffmpeg, no rendering happens here — the
 * user runs `npx remotion render` locally to produce the mp4.
 */
export async function exportRemotionZip(
  parsed: HyperframesParsed,
  basename = "hyperframes",
  opts: ExportRemotionOptions = {},
): Promise<void> {
  if (!parsed.isHyperframes || parsed.frames.length === 0) {
    throw new Error("no frames — not a Hyperframes document");
  }

  // Lazy-load JSZip — keeps the initial route bundle small.
  const { default: JSZip } = await import("jszip");
  const zip = new JSZip();

  const name = slug(basename, "hyperframes");

  // Per-frame standalone HTML lives under public/ so Remotion's bundler
  // serves it as a static asset addressable by relative URL.
  const sequenceEntries: SequenceEntry[] = parsed.frames.map((f) => {
    const filename = `frames/frame-${pad(f.i)}.html`;
    zip.file(`public/${filename}`, buildFrameHtml(parsed, f));
    return {
      src: filename,
      durationInFrames: msToFrames(f.duration),
      transition: f.transition || "fade",
      scene: f.scene || "",
    };
  });

  // <TransitionSeries> transitions OVERLAP both adjacent sequences, so the
  // composition is shorter than sum(sequences) by FADE_FRAMES per active
  // transition. The transition between sequence i and i+1 is driven by
  // entries[i].transition (matches Video.tsx).
  const sequenceTotal = sequenceEntries.reduce((sum, e) => sum + e.durationInFrames, 0);
  const transitionOverlap = sequenceEntries
    .slice(0, -1)
    .reduce((sum, e) => sum + (e.transition === "fade" ? FADE_FRAMES : 0), 0);
  const compositionFrames = Math.max(1, sequenceTotal - transitionOverlap);
  const totalSeconds = compositionFrames / FPS;

  zip.file("package.json", PACKAGE_JSON(name, totalSeconds));
  zip.file("tsconfig.json", TSCONFIG);
  zip.file("remotion.config.ts", REMOTION_CONFIG);
  zip.file("src/index.ts", INDEX_TS);
  zip.file("src/Root.tsx", ROOT_TSX(compositionFrames));
  zip.file("src/Video.tsx", VIDEO_TSX(sequenceEntries));
  zip.file("src/Frame.tsx", FRAME_TSX);
  zip.file("README.md", README_MD(name, parsed.title, parsed.frames, totalSeconds));
  if (opts.sourceHtml) zip.file("hyperframes.html", opts.sourceHtml);
  // Stash META JSON for round-tripping / debugging.
  if (parsed.metaJson) zip.file("hyperframes.meta.json", parsed.metaJson);

  const out = await zip.generateAsync({ type: "blob" });
  downloadBlob(out, `${name}-remotion-${Date.now()}.zip`);
}
