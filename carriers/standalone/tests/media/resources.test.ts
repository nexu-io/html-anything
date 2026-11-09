import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { browser } from "@odsuite/automation";
import { channel, namespace } from "@odsuite/protocol";
import { observeProcesses, readDirectory } from "@odsuite/sidecar";
import { expect, it } from "vitest";
import { open } from "@";

const png = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAACAAAAAYCAYAAACbU/80AAAAPklEQVR4AcXBMQEAIAzAsK5CuPEvChtMRpN5535CEpOYxCQmMYlJTGISk5jEJCYxiUlMYhKTmMQkJjGJSWwBYl8CWwMRvGQAAAAASUVORK5CYII=",
  "base64",
);
function wave() {
  const rate = 8000,
    samples = rate * 2,
    bytes = Buffer.alloc(44 + samples * 2);
  bytes.write("RIFF");
  bytes.writeUInt32LE(bytes.length - 8, 4);
  bytes.write("WAVEfmt ", 8);
  bytes.writeUInt32LE(16, 16);
  bytes.writeUInt16LE(1, 20);
  bytes.writeUInt16LE(1, 22);
  bytes.writeUInt32LE(rate, 24);
  bytes.writeUInt32LE(rate * 2, 28);
  bytes.writeUInt16LE(2, 32);
  bytes.writeUInt16LE(16, 34);
  bytes.write("data", 36);
  bytes.writeUInt32LE(samples * 2, 40);
  for (let i = 0; i < samples; i++)
    bytes.writeInt16LE(Math.round(Math.sin((2 * Math.PI * 440 * i) / rate) * 8192), 44 + i * 2);
  return bytes;
}
const files = () => [
  {
    path: "index.html",
    content:
      '<html><body><main data-composition-id="main" data-width="640" data-height="360" data-duration="8"><section data-hf-id="hf-a" style="position:absolute;left:0;top:0" data-composition-id="card" data-composition-src="scenes/card.html" data-start="0" data-duration="3"></section><section data-hf-id="hf-b" style="position:absolute;left:280px;top:0" data-composition-id="card" data-composition-src="scenes/card.html" data-start="4" data-duration="3"></section></main><script>window.__timelines={main:gsap.timeline({paused:true}).to({},{duration:8})};</script></body></html>',
  },
  {
    path: "scenes/card.html",
    content:
      '<template><main data-composition-id="card" data-width="240" data-height="180" data-duration="3"><p data-hf-id="hf-title" data-start="0" data-duration="3">Persistent media</p></main><script>window.__timelines=window.__timelines||{};window.__timelines.card=gsap.timeline({paused:true}).to({},{duration:3});</script></template>',
  },
];
it("imports persistent media through retry, inserts once into shared source, decodes/plays native resources and restores history after cold restart", async () => {
  const evidence = fileURLToPath(new URL(`../../../../.artifacts/media-browser/${randomUUID()}/`, import.meta.url)),
    root = join(evidence, "sidecar"),
    scope = { channel: channel("dev"), namespace: namespace("media-browser") },
    report: Record<string, unknown> = {};
  await mkdir(evidence, { recursive: true });
  let runtime: Awaited<ReturnType<typeof open>> | undefined, driver: Awaited<ReturnType<typeof browser>> | undefined;
  const external = new Set<string>(),
    ranges: Record<string, unknown>[] = [];
  try {
    runtime = await open({ root, scope, version: "0.6.1-dev.1" });
    const session = await runtime.execute("session_create", {
        requestId: randomUUID(),
        title: "Media resources",
        mode: "motion",
      }),
      artifact = await runtime.execute("artifact_create", {
        requestId: randomUUID(),
        sessionId: session.id,
        title: "Images and audio",
        files: files(),
      }),
      owner = { sessionId: session.id, artifactId: artifact.id },
      state = await runtime.execute("workspace_state", {});
    await runtime.execute("artifact_open", {
      requestId: randomUUID(),
      ...owner,
      expectedSelection: state.selection.revision,
      expectedCurrent: null,
    });
    driver = await browser({ evidence, viewport: { width: 1600, height: 1100 } });
    const page = driver.page;
    page.setDefaultTimeout(10000);
    page.on("request", (request) => {
      const url = new URL(request.url());
      if (["http:", "https:"].includes(url.protocol) && !["127.0.0.1", "localhost", "[::1]"].includes(url.hostname))
        external.add(url.origin);
    });
    page.on("response", (response) => {
      if (response.url().endsWith(".wav"))
        ranges.push({ status: response.status(), range: response.request().headers().range ?? null });
    });
    const ready = () =>
        page
          .locator("[aria-live]")
          .filter({ hasText: /^就绪$/ })
          .waitFor(),
      shown = () => page.getByLabel("预览状态", { exact: true }).filter({ hasText: "预览就绪" }).waitFor();
    const click = async (name: string) => {
      await page.getByRole("button", { name, exact: true }).click();
      await ready();
    };
    const read = () => {
        if (!runtime) throw Error("missing runtime");
        return runtime.execute("project_read", owner);
      },
      frame = () => page.frameLocator("iframe:not([hidden])");
    const enter = async (id: string) => {
      await page.getByLabel("合成实例", { exact: true }).selectOption(id);
      await click("进入合成");
      await expect.poll(() => page.getByLabel("合成上下文", { exact: true }).getAttribute("data-instance")).toBe(id);
      await shown();
    };
    const seek = async (local: number, global: number) => {
      await page.getByLabel("定位秒", { exact: true }).fill(String(local));
      await click("定位");
      await expect
        .poll(async () => Number(await page.getByLabel("全局播放时间", { exact: true }).textContent()))
        .toBeCloseTo(global, 2);
    };
    await page.goto((await runtime.status()).web);
    await ready();
    await shown();
    await page.getByRole("tab", { name: "媒体", exact: true }).click();
    await page.route("**/api/resource_import", async (route) => {
      await route.fetch();
      await route.abort("failed");
    });
    await page
      .getByLabel("导入媒体", { exact: true })
      .setInputFiles({ name: "red.png", mimeType: "image/png", buffer: png });
    await expect.poll(() => page.getByRole("button", { name: "重试", exact: true }).isEnabled()).toBe(true);
    expect((await read()).resources).toHaveLength(1);
    await page.unrouteAll({ behavior: "wait" });
    await click("重试");
    await shown();
    const imported = await read();
    expect(imported.resources).toHaveLength(1);
    expect(imported.resources[0]).toMatchObject({ name: "red.png", type: "image/png", width: 32, height: 24 });
    await enter("hf-a");
    await page.route("**/api/project_save", async (route) => {
      await route.fetch();
      await route.abort("failed");
    });
    await page.getByRole("button", { name: "插入 red.png", exact: true }).click();
    await expect.poll(() => page.getByRole("button", { name: "重试", exact: true }).isEnabled()).toBe(true);
    expect(
      (await read()).files.find((file) => file.path === "scenes/card.html")?.content.match(/<img\b/g),
    ).toHaveLength(1);
    expect(await frame().locator("img").count()).toBe(0);
    await driver.capture("failed-media-insertion-save");
    await page.unrouteAll({ behavior: "wait" });
    await click("重试");
    await shown();
    await seek(0.5, 0.5);
    await expect.poll(() => frame().locator("img").count()).toBe(2);
    const image = frame().locator('[data-open-motion-instance="hf-a"] img');
    await expect
      .poll(() =>
        image.evaluate((node) => ({
          width: (node as HTMLImageElement).naturalWidth,
          height: (node as HTMLImageElement).naturalHeight,
          visible: node.checkVisibility({ opacityProperty: true, visibilityProperty: true }),
        })),
      )
      .toEqual({ width: 32, height: 24, visible: true });
    expect(
      await image.evaluate((node) => {
        const canvas = document.createElement("canvas");
        canvas.width = 32;
        canvas.height = 24;
        const context = canvas.getContext("2d");
        if (!context) throw Error("missing canvas");
        context.drawImage(node as HTMLImageElement, 0, 0);
        return [...context.getImageData(16, 12, 1, 1).data];
      }),
    ).toEqual([230, 30, 40, 255]);
    const inserted = await read();
    expect(inserted.files.find((file) => file.path === "index.html")).toEqual(files()[0]);
    expect(inserted.files.find((file) => file.path === "scenes/card.html")?.content.match(/<img\b/g)).toHaveLength(1);
    expect(inserted.files.map((file) => file.content).join("")).not.toContain("data:image");
    expect(inserted.files.find((file) => file.path === "scenes/card.html")?.content).toContain("../assets/");
    await page
      .getByLabel("导入媒体", { exact: true })
      .setInputFiles({ name: "tone.wav", mimeType: "audio/wav", buffer: wave() });
    await ready();
    await expect.poll(async () => (await read()).resources.length).toBe(2);
    await shown();
    await click("插入 tone.wav");
    await shown();
    await seek(0.5, 0.5);
    await expect.poll(() => frame().locator("audio").count()).toBe(2);
    const audio = frame().locator('[data-open-motion-instance="hf-a"] audio');
    await expect.poll(() => audio.evaluate((node) => (node as HTMLAudioElement).readyState)).toBeGreaterThanOrEqual(2);
    await expect.poll(() => audio.evaluate((node) => (node as HTMLAudioElement).currentTime)).toBeCloseTo(0.5, 1);
    await click("播放");
    await expect.poll(() => audio.evaluate((node) => (node as HTMLAudioElement).paused)).toBe(false);
    await expect.poll(() => audio.evaluate((node) => (node as HTMLAudioElement).currentTime)).toBeGreaterThan(0.6);
    await click("暂停");
    await expect.poll(() => audio.evaluate((node) => (node as HTMLAudioElement).paused)).toBe(true);
    expect(await audio.evaluate((node) => (node as HTMLAudioElement).muted)).toBe(false);
    report.audio = await audio.evaluate((node) => {
      const audio = node as HTMLAudioElement;
      return {
        duration: audio.duration,
        readyState: audio.readyState,
        paused: audio.paused,
        muted: audio.muted,
        volume: audio.volume,
        currentTime: audio.currentTime,
      };
    });
    await page.getByRole("tab", { name: "图层", exact: true }).click();
    const track = page.locator("[data-clip-id]").filter({ hasText: "音频" });
    await track.focus();
    await track.press("Alt+Shift+ArrowLeft");
    await ready();
    await shown();
    await expect.poll(() => track.getAttribute("aria-label")).toContain("1.00秒");
    await seek(0.5, 0.5);
    await expect.poll(() => audio.evaluate((node) => (node as HTMLAudioElement).currentTime)).toBeCloseTo(0.5, 1);
    await click("撤销");
    await shown();
    await click("重做");
    await shown();
    await page.getByRole("tab", { name: "媒体", exact: true }).click();
    const previousFrame = await page.locator("iframe:not([hidden])").getAttribute("src");
    await click("移除资源 red.png");
    await page.getByLabel("预览状态", { exact: true }).filter({ hasText: "missing media resource" }).waitFor();
    expect(await page.locator("iframe:not([hidden])").getAttribute("src")).toBe(previousFrame);
    expect(await image.evaluate((node) => (node as HTMLImageElement).naturalWidth)).toBe(32);
    await click("撤销");
    await shown();
    await click("主合成");
    await enter("hf-b");
    await seek(0.5, 4.5);
    await expect
      .poll(() =>
        frame()
          .locator('[data-open-motion-instance="hf-b"] audio')
          .evaluate((node) => (node as HTMLAudioElement).currentTime),
      )
      .toBeCloseTo(0.5, 1);
    await driver.capture("shared-image-and-native-audio");
    const saved = await read();
    expect(saved.resources).toHaveLength(2);
    const imageAsset = saved.resources.find((asset) => asset.type === "image/png");
    if (!imageAsset) throw Error("missing image manifest");
    expect(
      (await runtime.execute("resource_read", { ...owner, revision: saved.revision, path: imageAsset.path })).data,
    ).toBe(png.toString("base64"));
    await page.reload();
    await ready();
    await shown();
    await runtime.close();
    expect(await observeProcesses(root)).toHaveLength(0);
    runtime = await open({ root, scope, version: "0.6.1-dev.1" });
    expect((await read()).files).toEqual(saved.files);
    expect((await read()).resources).toEqual(saved.resources);
    await page.goto((await runtime.status()).web);
    await ready();
    await shown();
    await enter("hf-b");
    await seek(0.5, 4.5);
    await expect
      .poll(() =>
        frame()
          .locator('[data-open-motion-instance="hf-b"] img')
          .evaluate((node) => (node as HTMLImageElement).naturalWidth),
      )
      .toBe(32);
    await expect
      .poll(() =>
        frame()
          .locator('[data-open-motion-instance="hf-b"] audio')
          .evaluate((node) => (node as HTMLAudioElement).currentTime),
      )
      .toBeCloseTo(0.5, 1);
    expect(driver.errors).toEqual([]);
    expect([...external]).toEqual([]);
    expect(ranges.some((entry) => entry.status === 206)).toBe(true);
    report.revision = saved.revision;
    report.resources = saved.resources.map((asset) => ({
      type: asset.type,
      name: asset.name,
      bytes: asset.bytes,
      digest: asset.digest,
    }));
    report.cases = [
      "committed-import-lost-receipt-retry",
      "single-insertion-after-save-retry",
      "shared-nested-source-only-write",
      "native-png-pixels-and-visibility",
      "actual-audio-playback-and-local-clock",
      "audio-right-trim-history",
      "missing-resource-retains-old-view",
      "cold-restart-resource-restoration",
    ];
  } catch (error) {
    await driver?.capture("failure");
    if (driver)
      await writeFile(
        join(evidence, "failure.txt"),
        `${driver.errors.join("\n")}\n${await driver.page.locator("body").textContent()}`,
      );
    throw error;
  } finally {
    await driver?.close();
    await runtime?.close();
    expect((await readDirectory(root)).manager.phase).toBe("closed");
    expect(await observeProcesses(root)).toHaveLength(0);
    report.closed = true;
    report.errors = driver?.errors ?? [];
    report.externalOrigins = [...external];
    report.ranges = ranges;
    await writeFile(join(evidence, "report.json"), JSON.stringify(report, null, 2));
  }
}, 60000);
