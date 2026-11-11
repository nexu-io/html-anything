#!/usr/bin/env node
// Run against a disposable Studio project with STUDIO_URL set to its editor URL.
import assert from "node:assert/strict";
import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { launchStudioChrome } from "./chrome-executable.mjs";

const studioUrl = process.env.STUDIO_URL;
assert(studioUrl, "STUDIO_URL must point at a disposable project");
const evidenceDir = process.env.EVIDENCE_DIR;
if (evidenceDir) await mkdir(evidenceDir, { recursive: true });
const { browser } = await launchStudioChrome();
const results = [];

async function sampleResize(page, sash, name) {
  const box = await sash.boundingBox();
  assert(box && box.width > 0 && box.height > 0, `${name} divider must be visible`);
  const vertical = await sash.evaluate((node) => node.getAttribute("aria-orientation") === "vertical");
  const x = box.x + box.width / 2;
  const y = box.y + box.height / 2;
  await page.evaluate(() => {
    const stage = document.querySelector('[data-testid="preview-zoom-stage"]');
    const viewport = stage.parentElement.parentElement;
    const player = stage.querySelector("hyperframes-player");
    const iframe = player.iframeElement;
    const authoredWidth = iframe.offsetWidth;
    const authoredHeight = iframe.offsetHeight;
    const pan = stage.style.transform;
    window.__dividerResize = { samples: [], player, iframe, pan, time: player.currentTime, raf: 0 };
    const sample = () => {
      const state = window.__dividerResize;
      const view = viewport.getBoundingClientRect();
      const canvas = stage.getBoundingClientRect();
      const frame = iframe.getBoundingClientRect();
      const expectedWidth = Math.min(view.width - 16, (view.height - 16) * authoredWidth / authoredHeight);
      state.samples.push({
        viewportWidth: view.width,
        viewportHeight: view.height,
        fitError: Math.abs(canvas.width - expectedWidth),
        frameError: Math.max(Math.abs(frame.width - canvas.width), Math.abs(frame.height - canvas.height)),
        centerError: Math.max(
          Math.abs(frame.x + frame.width / 2 - view.x - view.width / 2),
          Math.abs(frame.y + frame.height / 2 - view.y - view.height / 2),
        ),
      });
      state.raf = requestAnimationFrame(sample);
    };
    sample();
  });

  await page.mouse.move(x, y);
  await page.mouse.down();
  for (const delta of [80, -80, 120, -100, 100, 0]) {
    await page.mouse.move(x + (vertical ? delta : 0), y + (vertical ? 0 : delta), { steps: 20 });
  }
  await page.mouse.up();
  // Observe several paints after release to catch a delayed scale or position jump.
  await page.evaluate(() => new Promise((resolve) => {
    let remaining = 12;
    const frame = () => --remaining ? requestAnimationFrame(frame) : resolve();
    requestAnimationFrame(frame);
  }));
  const result = await page.evaluate(() => {
    const state = window.__dividerResize;
    cancelAnimationFrame(state.raf);
    const stage = document.querySelector('[data-testid="preview-zoom-stage"]');
    return {
      samples: state.samples,
      samePlayer: state.player === stage.querySelector("hyperframes-player"),
      sameIframe: state.iframe === stage.querySelector("hyperframes-player").iframeElement,
      samePan: state.pan === stage.style.transform,
      timePreserved: state.player.paused && Math.abs(state.player.currentTime - state.time) < 0.001,
    };
  });
  const maxFrameError = Math.max(...result.samples.map((sample) => sample.frameError));
  const maxFitError = Math.max(...result.samples.map((sample) => sample.fitError));
  const maxCenterError = Math.max(...result.samples.map((sample) => sample.centerError));
  results.push({ name, maxFrameError, maxFitError, maxCenterError, ...result });
  if (evidenceDir) await page.screenshot({ path: join(evidenceDir, `${name}.png`) });
  assert(result.samePlayer && result.sameIframe, `${name} must preserve the live player`);
  assert(result.samePan, `${name} must preserve the preview zoom and pan`);
  assert(result.timePreserved, `${name} must preserve the paused playback position`);
  assert(result.samples.length >= 30, `${name} must observe the continuous drag`);
  // The upstream player uses integer offsetWidth/offsetHeight for its scale.
  assert(maxFrameError < 1.5, `${name} iframe lags its stage by ${maxFrameError}px`);
  assert(maxFitError < 0.1, `${name} stage lags its viewport by ${maxFitError}px`);
  assert(maxCenterError < 0.1, `${name} picture moves away from center by ${maxCenterError}px`);
  const resting = result.samples.slice(-10);
  assert(resting.every((sample) => Math.abs(sample.viewportWidth - resting[0].viewportWidth) < 0.1
    && Math.abs(sample.viewportHeight - resting[0].viewportHeight) < 0.1), `${name} must settle after release`);
  console.log(JSON.stringify({ name, samples: result.samples.length, maxFrameError, maxFitError, maxCenterError }));
}

try {
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });
  await page.goto(studioUrl, { waitUntil: "domcontentloaded" });
  await page.waitForFunction(() => document.querySelector("hyperframes-player")?.painted, { timeout: 30_000 });
  await page.evaluate(() => {
    const player = document.querySelector("hyperframes-player");
    player.pause();
    player.seek(player.duration);
  });
  const columns = await page.$$('.dv-sash[aria-orientation="vertical"]');
  assert.equal(columns.length, 2, "Fixture must show both side panels");
  await sampleResize(page, columns[0], "left-divider");
  await sampleResize(page, columns[1], "right-divider");
  const rows = await page.$$('.dv-sash[aria-orientation="horizontal"]');
  assert.equal(rows.length, 1, "Fixture must show the timeline divider");
  await sampleResize(page, rows[0], "timeline-divider");
} finally {
  if (evidenceDir) await writeFile(join(evidenceDir, "resize-results.json"), JSON.stringify(results, null, 2));
  await browser.close();
}
