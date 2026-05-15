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
 * Each frame ships as an independent standalone HTML file in `src/frames/`.
 * The Remotion components mount that HTML inside an `<iframe srcdoc>` sized to
 * the composition — this preserves Tailwind CDN / fonts / inline <style>
 * exactly as authored, no JSX conversion needed.
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
      target: "ES2018",
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

const ROOT_TSX = (totalFrames: number) => `import { Composition } from "remotion";
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

const FRAME_TSX = `import { AbsoluteFill, useCurrentFrame, interpolate, delayRender, continueRender } from "remotion";
import { useEffect, useRef, useState } from "react";

type Props = {
  /** Path under public/, e.g. "frames/frame-01.html". */
  src: string;
  /** Sequence length in frames. */
  durationInFrames: number;
  /** Cross-fade window (frames). 0 = hard cut. */
  fadeFrames: number;
};

/**
 * One frame of the Hyperframes video. Renders the original standalone HTML
 * inside an iframe at native 1920×1080 — preserves Tailwind CDN / fonts /
 * custom <style> verbatim. We block Remotion's render with delayRender() until
 * the iframe's load event fires so the screenshot captures fully-loaded CSS.
 */
export const Frame: React.FC<Props> = ({ src, durationInFrames, fadeFrames }) => {
  const frame = useCurrentFrame();
  const ref = useRef<HTMLIFrameElement>(null);
  const [handle] = useState(() => delayRender("Loading iframe: " + src));

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (el.contentDocument?.readyState === "complete") {
      continueRender(handle);
      return;
    }
    const onLoad = () => continueRender(handle);
    el.addEventListener("load", onLoad, { once: true });
    return () => el.removeEventListener("load", onLoad);
  }, [handle]);

  const fade = Math.max(0, Math.min(fadeFrames, Math.floor(durationInFrames / 3)));
  const opacity =
    fade === 0
      ? 1
      : interpolate(
          frame,
          [0, fade, durationInFrames - fade, durationInFrames],
          [0, 1, 1, 0],
          { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
        );

  return (
    <AbsoluteFill style={{ opacity, background: "#000" }}>
      <iframe
        ref={ref}
        src={src}
        style={{ width: "100%", height: "100%", border: 0, display: "block" }}
        // sandbox left permissive — frames are author-controlled HTML.
      />
    </AbsoluteFill>
  );
};
`;

type SequenceEntry = { src: string; durationInFrames: number; transition: string };

const VIDEO_TSX = (entries: SequenceEntry[]) => {
  const items = entries
    .map(
      (e, i) =>
        `  { src: "${e.src}", durationInFrames: ${e.durationInFrames}, transition: "${e.transition}" }${i === entries.length - 1 ? "" : ","}`,
    )
    .join("\n");

  return `import { Series } from "remotion";
import { Frame } from "./Frame";

const FADE_FRAMES = ${FADE_FRAMES};

const FRAMES = [
${items}
];

export const Hyperframes: React.FC = () => {
  return (
    <Series>
      {FRAMES.map((f, i) => (
        <Series.Sequence key={i} durationInFrames={f.durationInFrames}>
          <Frame
            src={f.src}
            durationInFrames={f.durationInFrames}
            fadeFrames={f.transition === "fade" ? FADE_FRAMES : 0}
          />
        </Series.Sequence>
      ))}
    </Series>
  );
};
`;
};

const README_MD = (basename: string, frames: HyperFrame[], totalSeconds: number) => {
  const list = frames
    .map((f) => `- frame ${pad(f.i)} · ${(f.duration / 1000).toFixed(1)}s · ${f.transition} · ${f.scene || "(no scene)"}`)
    .join("\n");
  return `# ${basename}

Auto-generated Remotion project from a Hyperframes HTML doc.

- ${frames.length} frames · ~${totalSeconds.toFixed(1)}s · ${CANVAS_W}×${CANVAS_H} @ ${FPS} fps
- Source HTML preserved at \`hyperframes.html\`
- Each frame is a standalone HTML doc under \`public/frames/\` and is mounted in an \`<iframe>\` by \`src/Frame.tsx\`

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
  /** Progress callback for the UI. */
  onProgress?: (step: string) => void;
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

  opts.onProgress?.("Bundling Remotion project");

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
    };
  });

  const totalFrames = sequenceEntries.reduce((sum, e) => sum + e.durationInFrames, 0);
  const totalSeconds = totalFrames / FPS;

  zip.file("package.json", PACKAGE_JSON(name, totalSeconds));
  zip.file("tsconfig.json", TSCONFIG);
  zip.file("remotion.config.ts", REMOTION_CONFIG);
  zip.file("src/index.ts", INDEX_TS);
  zip.file("src/Root.tsx", ROOT_TSX(totalFrames));
  zip.file("src/Video.tsx", VIDEO_TSX(sequenceEntries));
  zip.file("src/Frame.tsx", FRAME_TSX);
  zip.file("README.md", README_MD(name, parsed.frames, totalSeconds));
  if (opts.sourceHtml) zip.file("hyperframes.html", opts.sourceHtml);
  // Stash META JSON for round-tripping / debugging.
  if (parsed.metaJson) zip.file("hyperframes.meta.json", parsed.metaJson);

  opts.onProgress?.("Compressing");
  const out = await zip.generateAsync({ type: "blob" });
  downloadBlob(out, `${name}-remotion-${Date.now()}.zip`);
}
