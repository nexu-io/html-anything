import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { type Browser, chromium, type Page } from "playwright-core";
import { PNG } from "pngjs";
/** Test-driver ownership only. Product servers/processes remain in the supplied sidecar fixture. */
export async function browser(options: { evidence: string; viewport: { width: number; height: number } }) {
  await mkdir(options.evidence, { recursive: true });
  const driver: Browser = await chromium.launch({ headless: true });
  const context = await driver.newContext({
    viewport: options.viewport,
    reducedMotion: "reduce",
    locale: "zh-CN",
    deviceScaleFactor: 1,
  });
  const page = await context.newPage(),
    errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  return {
    page,
    errors,
    async capture(name: string) {
      if (!/^[a-z][a-z0-9-]*$/.test(name)) throw new Error("invalid browser evidence name");
      await page.evaluate(async () => {
        await document.fonts.ready;
        await new Promise<void>((done) => requestAnimationFrame(() => requestAnimationFrame(() => done())));
      });
      const data = await page.screenshot({ animations: "disabled" });
      await writeFile(join(options.evidence, `${name}.png`), data);
      return data;
    },
    async close() {
      await driver.close();
    },
  };
}
export type BrowserPage = Page;
/** Same-environment PNG comparison. Cross-platform baselines must not be reported as equivalent. */
export function imageDifference(left: Uint8Array, right: Uint8Array) {
  const a = PNG.sync.read(Buffer.from(left)),
    b = PNG.sync.read(Buffer.from(right));
  if (a.width !== b.width || a.height !== b.height) throw new Error("image dimensions differ");
  let changed = 0;
  for (let offset = 0; offset < a.data.length; offset += 4) {
    if (
      [0, 1, 2, 3].some((channel) => Math.abs((a.data[offset + channel] ?? 0) - (b.data[offset + channel] ?? 0)) > 16)
    )
      changed++;
  }
  return { width: a.width, height: a.height, changed, ratio: changed / (a.width * a.height) };
}
