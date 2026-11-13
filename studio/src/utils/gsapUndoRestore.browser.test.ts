// Real Chrome: the box GSAP and a stylesheet translate produce together is what no DOM emulation computes.
import { mkdtempSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import type { Browser } from "puppeteer-core";
import { build, type Plugin } from "esbuild";
import { afterAll, beforeAll, expect, it, vi } from "vitest";
import { closeTestChrome, launchTestChrome, showWithRuntime } from "../../tests/chromeTestUtils";
import { writeFixture } from "../../tests/e2e/edit-accuracy/grid.mjs";

const CROP = "inset(0px 40px 0px 0px)";
// Real Chrome on a loaded Windows runner exceeds Vitest's 5s test and 10s hook defaults.
vi.setConfig({ testTimeout: 60_000, hookTimeout: 60_000 });
let browser: Browser;
let undoBundle: string;
let softReloadBundle: string;

// recast imports these, and its code that uses them is dropped from the bundle. A new
// built-in fails the build instead of turning into an empty module the way Vite makes it.
const emptyNodeBuiltins: Plugin = {
  name: "empty-node-builtins",
  setup(build) {
    build.onResolve({ filter: /^(node:)?(fs|os)$/ }, ({ path }) => ({ path, namespace: "empty" }));
    build.onLoad({ filter: /.*/, namespace: "empty" }, () => ({ contents: "module.exports = {}" }));
  },
};

async function bundle(file: string, name: string): Promise<string> {
  const out = await build({
    entryPoints: [fileURLToPath(new URL(file, import.meta.url))],
    bundle: true,
    write: false,
    platform: "browser",
    format: "iife",
    globalName: name,
    alias: { canvas: fileURLToPath(new URL("../shims/canvasBrowserStub.js", import.meta.url)) },
    plugins: [emptyNodeBuiltins],
    define: { "import.meta.env": "{}" },
  });
  return out.outputFiles[0]!.text;
}

beforeAll(async () => {
  browser = await launchTestChrome();
  undoBundle = await bundle("./gsapUndoRestore.ts", "hfUndo");
  softReloadBundle = await bundle("./gsapSoftReload.ts", "hfSoftReload");
});

afterAll(() => closeTestChrome(browser));

type Spec = { gsap: string; placement: string; rotation: number; time: number };

/** The bench's root crop fixture, shown at `spec.time` with the module under test loaded. */
async function openCase(spec: Spec, moduleBundle: string) {
  const dir = join(mkdtempSync(join(tmpdir(), "undo-gsap-")), "case");
  writeFixture({ gesture: "crop", nesting: "root", zoom: 100, ...spec }, dir);
  const restored = readFileSync(join(dir, "index.html"), "utf8");
  const page = await browser.newPage();
  await page.setViewport({ width: 1920, height: 1080 });
  await showWithRuntime(page, restored);
  await page.evaluate(moduleBundle);
  await page.evaluate(
    (time) => (window as unknown as { __player: { seek(t: number): void } }).__player.seek(time),
    spec.time,
  );
  const box = () =>
    page.evaluate(() => {
      const { left, top, width, height } = document
        .getElementById("target")!
        .getBoundingClientRect();
      return [left, top, width, height].map((n) => Math.round(n * 100) / 100);
    });
  return { page, restored, box };
}

// The first case opens the cold browser's first page, which overran 5 s on a loaded CI runner.
it.each([
  { gsap: "hold", placement: "px", rotation: 0, time: 1 },
  { gsap: "tween", placement: "px", rotation: 0, time: 1 },
  { gsap: "tween", placement: "xpercent", rotation: 30, time: 1 },
  { gsap: "keys", placement: "px", rotation: 0, time: 1 },
  { gsap: "keys", placement: "px", rotation: 30, time: 2 },
  { gsap: "scale", placement: "px", rotation: 0, time: 1 },
  { gsap: "spin", placement: "px", rotation: 30, time: 1 },
  { gsap: "fromto", placement: "px", rotation: 0, time: 1 },
])(
  "an undone crop leaves a $gsap $placement r$rotation layer at t$time where it was",
  async (spec) => {
    const { page, restored, box } = await openCase(spec, undoBundle);
    const previous = restored.replace(
      `<div id="target"`,
      `<div id="target" style="clip-path: ${CROP}"`,
    );
    const before = await box();
    const outcome = await page.evaluate(
      (files, crop, time) => {
        document.getElementById("target")!.style.setProperty("clip-path", crop);
        const undo = (window as unknown as { hfUndo: typeof import("./gsapUndoRestore") }).hfUndo;
        const iframe = { contentDocument: document, contentWindow: window } as HTMLIFrameElement;
        return undo.applyUndoRestoreToPreview(iframe, "index.html", files, time, () => {});
      },
      { "index.html": { previous, restored } },
      CROP,
      spec.time,
    );

    expect(outcome).toBe("soft");
    expect(await box()).toEqual(before);
    await page.close();
  },
  30_000,
);

// A drop saves the file and soft-reloads it; the re-run must place an animated layer where it was.
it.each([
  { gsap: "tween", placement: "px", rotation: 0, time: 1 },
  { gsap: "keys", placement: "px", rotation: 30, time: 2 },
  { gsap: "spin", placement: "px", rotation: 0, time: 1 },
])(
  "a soft reload keeps a $gsap $placement r$rotation layer at t$time where it was",
  async (spec) => {
    const { page, restored, box } = await openCase(spec, softReloadBundle);
    const before = await box();
    const outcome = await page.evaluate(
      (html, time) => {
        const soft = (window as unknown as { hfSoftReload: typeof import("./gsapSoftReload") })
          .hfSoftReload;
        const iframe = { contentDocument: document, contentWindow: window } as HTMLIFrameElement;
        const script = soft.extractGsapScriptText(html)!;
        return soft.applySoftReload(iframe, script, {
          currentTimeOverride: time,
          authoredHtml: html,
        });
      },
      restored,
      spec.time,
    );

    expect(outcome).toBe("applied");
    expect(await box()).toEqual(before);
    await page.close();
  },
  30_000,
);

it("keeps the dropped image in place when the project registers its timeline as an object", async () => {
  const page = await browser.newPage();
  try {
    const script = (x: number) =>
      `const tl = gsap.timeline({paused:true});tl.to("#box",{keyframes:{"0%":{x:${x}},"100%":{x:${x + 100}}},duration:2},0);window.__timelines={main:tl};`;
    const html = (x: number) =>
      `<script src="assets/gsap.min.js"></script><main data-composition-id="main" data-duration="2" data-width="400" data-height="200"><img id="box" width="20" height="20"></main><script>${script(x)}</script>`;
    await showWithRuntime(page, html(10));
    await page.evaluate(softReloadBundle);
    const result = await page.evaluate((updated) => {
      const win = window as unknown as {
        gsap: { set(target: Element, values: { x: number }): void };
        hfSoftReload: typeof import("./gsapSoftReload");
      };
      const target = document.querySelector("#box")!;
      win.gsap.set(target, { x: 80 });
      const dropped = target.getBoundingClientRect().left;
      const iframe = { contentDocument: document, contentWindow: window } as HTMLIFrameElement;
      const outcome = win.hfSoftReload.applySoftReload(iframe, win.hfSoftReload.extractGsapScriptText(updated)!, {
        currentTimeOverride: 0,
        authoredHtml: updated,
      });
      return { outcome, shift: target.getBoundingClientRect().left - dropped };
    }, html(80));
    expect(result).toEqual({ outcome: "applied", shift: 0 });
  } finally {
    await page.close();
  }
});
