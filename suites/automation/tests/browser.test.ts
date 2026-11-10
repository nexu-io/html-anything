import { randomUUID } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { PNG } from "pngjs";
import { expect, it } from "vitest";
import { browser, imageDifference } from "@";

it("counts changed pixels independently of channels and rejects incompatible viewports", () => {
  const image = new PNG({ width: 2, height: 1 });
  image.data.fill(255);
  const original = PNG.sync.write(image);
  image.data[0] = 0;
  image.data[1] = 0;
  image.data[2] = 0;
  expect(imageDifference(original, PNG.sync.write(image))).toEqual({ width: 2, height: 1, changed: 1, ratio: 0.5 });
  expect(imageDifference(original, original).ratio).toBe(0);
  expect(() => imageDifference(original, PNG.sync.write(new PNG({ width: 1, height: 1 })))).toThrow("dimensions");
});

it("captures without author animation frames and diagnoses a genuinely pending font", async () => {
  const evidence = fileURLToPath(new URL(`../../../.artifacts/capture-waits/${randomUUID()}/`, import.meta.url));
  await mkdir(evidence, { recursive: true });
  const driver = await browser({ evidence, viewport: { width: 640, height: 480 } });
  let requested = false;
  try {
    await driver.page.setContent("<main>Painted browser evidence</main>");
    await driver.page.evaluate(() => {
      window.requestAnimationFrame = () => 0;
    });
    const data = await driver.capture("without-author-frames");
    expect(data).toEqual(await readFile(join(evidence, "without-author-frames.png")));
    const image = PNG.sync.read(data);
    expect(image.width).toBe(640);
    let foreground = 0;
    for (let offset = 0; offset < image.data.length; offset += 4)
      if ([0, 1, 2].every((channel) => (image.data[offset + channel] ?? 255) < 128)) foreground++;
    expect(foreground).toBeGreaterThan(100);
    await driver.page.route("https://font.invalid/pending.woff2", async (route) => {
      requested = true;
      await new Promise<void>((resolve) => {
        driver.page.once("close", () => resolve());
      });
      await route.abort().catch(() => undefined);
    });
    await driver.page.evaluate(() => {
      const font = new FontFace("PendingEvidence", 'url("https://font.invalid/pending.woff2")');
      document.fonts.add(font);
      void font.load().catch(() => undefined);
    });
    await expect.poll(() => requested).toBe(true);
    expect(await driver.page.evaluate(() => document.fonts.status)).toBe("loading");
    const began = Date.now();
    await expect(driver.capture("pending-font")).rejects.toThrow(
      'Browser evidence "pending-font" failed during font readiness',
    );
    await writeFile(
      join(evidence, "receipt.json"),
      JSON.stringify(
        {
          authorFramesSuspended: true,
          fontRequested: requested,
          pendingFont: "bounded diagnostic failure",
          elapsed: Date.now() - began,
        },
        null,
        2,
      ),
    );
  } finally {
    await driver.close();
  }
}, 20000);
