import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { browser } from "@odsuite/automation";
import { channel, namespace } from "@odsuite/protocol";
import { observeProcesses, readDirectory } from "@odsuite/sidecar";
import { expect, it } from "vitest";
import { open } from "@";

function wave(seconds = 4) {
  const rate = 8000,
    samples = rate * seconds,
    b = Buffer.alloc(44 + samples * 2);
  b.write("RIFF");
  b.writeUInt32LE(b.length - 8, 4);
  b.write("WAVEfmt ", 8);
  b.writeUInt32LE(16, 16);
  b.writeUInt16LE(1, 20);
  b.writeUInt16LE(1, 22);
  b.writeUInt32LE(rate, 24);
  b.writeUInt32LE(rate * 2, 28);
  b.writeUInt16LE(2, 32);
  b.writeUInt16LE(16, 34);
  b.write("data", 36);
  b.writeUInt32LE(samples * 2, 40);
  for (let i = 0; i < samples; i++)
    b.writeInt16LE(Math.round(Math.sin((2 * Math.PI * 440 * i) / rate) * 8192), 44 + i * 2);
  return b;
}
const files = () => [
  {
    path: "index.html",
    content:
      '<html><body><main data-composition-id="main" data-width="640" data-height="360" data-duration="10"><section data-hf-id="hf-a" style="position:absolute;left:0;top:0" data-composition-id="card" data-composition-src="scenes/card.html" data-start="0" data-duration="4"></section><section data-hf-id="hf-b" style="position:absolute;left:280px;top:0" data-composition-id="card" data-composition-src="scenes/card.html" data-start="5" data-duration="4"></section></main><script>window.__timelines={main:gsap.timeline({paused:true}).to({},{duration:10})};</script></body></html>',
  },
  {
    path: "scenes/card.html",
    content:
      '<template><main data-composition-id="card" data-width="240" data-height="180" data-duration="4"><p data-hf-id="hf-title" data-start="0" data-duration="4">Audio source controls</p></main><script>window.__timelines=window.__timelines||{};window.__timelines.card=gsap.timeline({paused:true}).to({},{duration:4});</script></template>',
  },
];
it("links source-local media atomically through gestures, partner limits, history, retry and cold restore", async () => {
  const evidence = fileURLToPath(new URL(`../../../../.artifacts/linked-browser/${randomUUID()}/`, import.meta.url)),
    root = join(evidence, "sidecar"),
    scope = { channel: channel("dev"), namespace: namespace("linked-browser") },
    report: Record<string, unknown> = {};
  await mkdir(evidence, { recursive: true });
  let runtime: Awaited<ReturnType<typeof open>> | undefined, driver: Awaited<ReturnType<typeof browser>> | undefined;
  const external = new Set<string>();
  try {
    runtime = await open({ root, scope, version: "0.6.1-dev.1" });
    const session = await runtime.execute("session_create", {
        requestId: randomUUID(),
        title: "Audio editing",
        mode: "motion",
      }),
      artifact = await runtime.execute("artifact_create", {
        requestId: randomUUID(),
        sessionId: session.id,
        title: "Source window and gain",
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
      const u = new URL(request.url());
      if (["http:", "https:"].includes(u.protocol) && !["127.0.0.1", "localhost", "[::1]"].includes(u.hostname))
        external.add(u.origin);
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
      frame = () => page.frameLocator("iframe:not([hidden])"),
      audio = (scope = "hf-a") => frame().locator(`[data-open-motion-instance="${scope}"] audio`);
    const enter = async (id: string) => {
      await page.getByLabel("合成实例", { exact: true }).selectOption(id);
      await click("进入合成");
      await expect.poll(() => page.getByLabel("合成上下文", { exact: true }).getAttribute("data-instance")).toBe(id);
      await shown();
    };
    const seek = async (local: number, global: number, source: number, scope = "hf-a") => {
      await page.getByLabel("定位秒", { exact: true }).fill(String(local));
      await click("定位");
      await expect
        .poll(async () => Number(await page.getByLabel("全局播放时间", { exact: true }).textContent()))
        .toBeCloseTo(global, 2);
      await expect
        .poll(() =>
          audio(scope)
            .nth(0)
            .evaluate((node) => (node as HTMLAudioElement).currentTime),
        )
        .toBeCloseTo(source, 2);
    };
    await page.goto((await runtime.status()).web);
    await ready();
    await shown();
    await enter("hf-a");
    const png = Buffer.from(
        "iVBORw0KGgoAAAANSUhEUgAAACAAAAAYCAYAAACbU/80AAAAPklEQVR4AcXBMQEAIAzAsK5CuPEvChtMRpN5535CEpOYxCQmMYlJTGISk5jEJCYxiUlMYhKTmMQkJjGJSWwBYl8CWwMRvGQAAAAASUVORK5CYII=",
        "base64",
      ),
      ids: string[] = [];
    const choose = async (id: string) => {
      await page.getByLabel("图层选择", { exact: true }).selectOption(id);
      await ready();
    };
    const timing = (scope = "hf-a") =>
      frame()
        .locator(`[data-open-motion-instance="${scope}"] img,[data-open-motion-instance="${scope}"] audio`)
        .evaluateAll((nodes) =>
          nodes.map((n) => ({
            start: Number(n.getAttribute("data-start")),
            duration: Number(n.getAttribute("data-duration")),
            link: n.getAttribute("data-link"),
          })),
        );
    for (const [i, asset] of [
      { name: "red.png", mimeType: "image/png", buffer: png },
      { name: "a.wav", mimeType: "audio/wav", buffer: wave(4) },
      { name: "b.wav", mimeType: "audio/wav", buffer: wave(2) },
    ].entries()) {
      await page.getByRole("tab", { name: "媒体", exact: true }).click();
      await page.getByLabel("导入媒体", { exact: true }).setInputFiles(asset);
      await ready();
      await click(`插入 ${asset.name}`);
      await shown();
      await page.getByRole("tab", { name: "图层", exact: true }).click();
      await page
        .locator("[data-clip-id]")
        .filter({ hasText: i === 0 ? "图像" : "音频" })
        .nth(i === 0 ? 0 : i - 1)
        .press("Enter");
      await ready();
      ids.push(await page.getByLabel("图层选择", { exact: true }).inputValue());
      await page.getByLabel("持续秒", { exact: true }).fill("1");
      await click("应用更改");
      await shown();
    }
    const [image, a, b] = ids;
    if (!image || !a || !b) throw Error("missing media identities");
    await choose(image);
    await page.getByLabel("链接伙伴", { exact: true }).selectOption(a);
    const beforeLink = await read(),
      beforeFrame = await page.locator("iframe:not([hidden])").getAttribute("src");
    await page.route("**/api/project_save", async (route) => {
      await route.fetch();
      await route.abort("failed");
    });
    await page.getByRole("button", { name: "链接媒体", exact: true }).click();
    await expect.poll(() => page.getByRole("button", { name: "重试", exact: true }).isEnabled()).toBe(true);
    const committed = await read();
    expect(committed.history.version).toBe(beforeLink.history.version + 1);
    expect(await page.locator("iframe:not([hidden])").getAttribute("src")).toBe(beforeFrame);
    await page.unrouteAll({ behavior: "wait" });
    await click("重试");
    await shown();
    expect((await read()).revision).toBe(committed.revision);
    await choose(image);
    await page.getByLabel("链接伙伴", { exact: true }).selectOption(b);
    await click("链接媒体");
    await shown();
    expect((await timing()).every((t) => !!t.link)).toBe(true);
    const group = (await timing())[0]?.link;
    expect(new Set((await timing()).map((t) => t.link)).size).toBe(1);
    await choose(image);
    await expect.poll(() => page.locator(`[data-clip-id="${image}"]`).getAttribute("tabindex")).toBe("0");
    await expect
      .poll(() => page.locator(`[data-clip-id="${image}"]`).getAttribute("aria-description"))
      .toBe("可编辑时间窗口");
    await page.locator(`[data-clip-id="${image}"]`).press("Shift+ArrowRight");
    await ready();
    await shown();
    await expect.poll(async () => (await timing()).map((t) => t.start)).toEqual([1, 1, 1]);
    await click("撤销");
    await shown();
    await expect.poll(async () => (await timing()).map((t) => t.start)).toEqual([0, 0, 0]);
    await click("重做");
    await shown();
    await expect.poll(async () => (await timing()).map((t) => t.start)).toEqual([1, 1, 1]);
    await expect
      .poll(() => page.locator(`[data-clip-id="${image}"]`).getAttribute("tabindex"), { timeout: 10000 })
      .toBe("0");
    await page.locator(`[data-clip-id="${image}"]`).press("Alt+Shift+ArrowRight");
    await ready();
    await shown();
    await expect.poll(async () => (await timing()).map((t) => t.duration)).toEqual([2, 2, 2]);
    await choose(a);
    const confirmed = await read(),
      confirmedFrame = await page.locator("iframe:not([hidden])").getAttribute("src");
    await page.getByLabel("素材倍率", { exact: true }).fill("2");
    await page.getByRole("button", { name: "应用更改", exact: true }).click();
    await expect.poll(() => page.getByRole("button", { name: "重试", exact: true }).isEnabled()).toBe(true);
    expect((await read()).revision).toBe(confirmed.revision);
    expect(await page.locator("iframe:not([hidden])").getAttribute("src")).toBe(confirmedFrame);
    await page.getByLabel("持续秒", { exact: true }).fill("1");
    await click("应用更改");
    await shown();
    await expect.poll(async () => (await timing()).map((t) => t.duration)).toEqual([1, 1, 1]);
    await page.getByLabel("源入点秒", { exact: true }).fill("1");
    await page.getByLabel("持续秒", { exact: true }).fill("0.5");
    await page.getByLabel("音量", { exact: true }).fill("0.25");
    await page.getByLabel("静音", { exact: true }).check();
    await click("应用更改");
    await shown();
    await seek(1.2, 1.2, 1.4);
    await expect
      .poll(() =>
        audio().evaluateAll((nodes) =>
          nodes.map((n) => ({
            time: Number((n as HTMLAudioElement).currentTime.toFixed(2)),
            rate: Number(n.getAttribute("data-playback-rate")),
            point: Number(n.getAttribute("data-media-start")),
            volume: (n as HTMLAudioElement).volume,
            muted: (n as HTMLAudioElement).muted,
          })),
        ),
      )
      .toEqual([
        { time: 1.4, rate: 2, point: 1, volume: 0.25, muted: true },
        { time: 1.4, rate: 2, point: 1, volume: 1, muted: false },
      ]);
    expect(
      await frame()
        .locator('[data-open-motion-instance="hf-a"] img')
        .evaluate((n) => (n as HTMLImageElement).naturalWidth),
    ).toBe(32);
    await driver.capture("linked-native-image-two-audio");
    await click("主合成");
    await enter("hf-b");
    await seek(1.2, 6.2, 1.4, "hf-b");
    expect((await timing("hf-b")).map((t) => [t.start, t.duration, t.link])).toEqual([
      [1, 0.5, group],
      [1, 0.5, group],
      [1, 0.5, group],
    ]);
    await choose(image);
    await click("解除链接");
    await shown();
    expect((await timing("hf-b")).every((t) => t.link === null)).toBe(true);
    await choose(a);
    await page.getByLabel("开始秒", { exact: true }).fill("2");
    await click("应用更改");
    await shown();
    expect((await timing("hf-b")).map((t) => t.start)).toEqual([1, 2, 1]);
    await click("撤销");
    await shown();
    await click("撤销");
    await shown();
    expect((await timing("hf-b")).every((t) => t.link === group)).toBe(true);
    await choose(image);
    await click("删除元素");
    await shown();
    expect(
      await frame().locator('[data-open-motion-instance="hf-b"] img,[data-open-motion-instance="hf-b"] audio').count(),
    ).toBe(0);
    expect((await read()).resources).toHaveLength(3);
    await click("撤销");
    await shown();
    expect(await timing("hf-b")).toHaveLength(3);
    const saved = await read();
    expect(saved.files.find((f) => f.path === "index.html")).toEqual(files()[0]);
    for (const resource of saved.resources) {
      const bytes = resource.type === "image/png" ? png : wave(resource.name === "a.wav" ? 4 : 2);
      expect(
        (await readResource(runtime, { ...owner, revision: saved.revision, path: resource.path })).data ===
          bytes.toString("base64"),
      ).toBe(true);
    }
    await driver.capture("shared-group-undo-delete");
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
    await seek(1.2, 6.2, 1.4, "hf-b");
    expect((await timing("hf-b")).every((t) => t.link === group)).toBe(true);
    expect(driver.errors).toEqual([]);
    expect([...external]).toEqual([]);
    report.revision = saved.revision;
    report.cases = [
      "same-source-composition-link-and-extension",
      "committed-link-lost-response-retry",
      "group-move-single-history",
      "weakest-member-trim",
      "atomic-partner-overrun-refusal",
      "shared-audio-inpoint-rate",
      "independent-gain-mute",
      "shared-mount-clocks",
      "unlink-independent-edit",
      "group-delete-undo",
      "persistent-bytes-not-removed",
      "cold-restoration",
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
    await writeFile(join(evidence, "report.json"), JSON.stringify(report, null, 2));
  }
}, 60000);

async function readResource(
  runtime: Pick<Awaited<ReturnType<typeof open>>, "execute">,
  input: { sessionId: string; artifactId: string; revision: string; path: string },
) {
  const ticket = await runtime.execute("resource_read", input);
  try {
    const response = await fetch(ticket.url);
    expect(response.status).toBe(200);
    return { resource: ticket.resource, data: Buffer.from(await response.arrayBuffer()).toString("base64") };
  } finally {
    await runtime.execute("resource_release", { id: ticket.id });
  }
}
