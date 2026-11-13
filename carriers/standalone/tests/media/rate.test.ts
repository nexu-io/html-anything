import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { browser } from "@odsuite/automation";
import { channel, namespace } from "@odsuite/protocol";
import { observeProcesses, readDirectory } from "@odsuite/sidecar";
import { expect, it } from "vitest";
import { open } from "@";

function wave() {
  const rate = 8000,
    samples = rate * 4,
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
it("edits authored fixed audio rate independently of transport through retries, source bounds and cold restore", async () => {
  const evidence = fileURLToPath(new URL(`../../../../.artifacts/rate-browser/${randomUUID()}/`, import.meta.url)),
    root = join(evidence, "sidecar"),
    scope = { channel: channel("dev"), namespace: namespace("audio-rate-browser") },
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
        .poll(() => audio(scope).evaluate((node) => (node as HTMLAudioElement).currentTime))
        .toBeCloseTo(source, 2);
    };
    await page.goto((await runtime.status()).web);
    await ready();
    await shown();
    await enter("hf-a");
    await page.getByRole("tab", { name: "媒体", exact: true }).click();
    await page
      .getByLabel("导入媒体", { exact: true })
      .setInputFiles({ name: "tone.wav", mimeType: "audio/wav", buffer: wave() });
    await ready();
    await click("插入 tone.wav");
    await shown();
    await seek(0.5, 0.5, 0.5);
    await page.getByRole("tab", { name: "图层", exact: true }).click();
    const track = () => page.locator("[data-clip-id]").filter({ hasText: "音频" });
    await track().press("Enter");
    await ready();
    await page.getByLabel("持续秒", { exact: true }).fill("2");
    await page.getByLabel("素材倍率", { exact: true }).fill("2");
    const oldFrame = await page.locator("iframe:not([hidden])").getAttribute("src");
    await page.route("**/api/project_save", async (route) => {
      await route.fetch();
      await route.abort("failed");
    });
    await page.getByRole("button", { name: "应用更改", exact: true }).click();
    await expect.poll(() => page.getByRole("button", { name: "重试", exact: true }).isEnabled()).toBe(true);
    expect(await page.locator("iframe:not([hidden])").getAttribute("src")).toBe(oldFrame);
    expect(await audio().evaluate((n) => (n as HTMLAudioElement).currentTime)).toBeCloseTo(0.5, 1);
    expect((await read()).files.find((f) => f.path === "scenes/card.html")?.content).toContain(
      'data-playback-rate="2"',
    );
    await page.unrouteAll({ behavior: "wait" });
    await click("重试");
    await shown();
    await seek(0.5, 0.5, 1);
    await click("播放");
    await expect.poll(() => audio().evaluate((n) => (n as HTMLAudioElement).currentTime)).toBeGreaterThan(1.15);
    await click("暂停");
    await expect.poll(() => audio().evaluate((n) => (n as HTMLAudioElement).paused)).toBe(true);
    expect(await page.getByLabel("开始秒", { exact: true }).inputValue()).toBe("0");
    expect(await page.getByLabel("持续秒", { exact: true }).inputValue()).toBe("2");
    await driver.capture("double-rate-native-clock");
    const beforeInvalid = await read(),
      retained = await page.locator("iframe:not([hidden])").getAttribute("src");
    await page.getByLabel("源入点秒", { exact: true }).fill("1");
    await page.getByRole("button", { name: "应用更改", exact: true }).click();
    await expect.poll(() => page.getByRole("button", { name: "重试", exact: true }).isEnabled()).toBe(true);
    expect((await read()).revision).toBe(beforeInvalid.revision);
    expect(await page.locator("iframe:not([hidden])").getAttribute("src")).toBe(retained);
    expect(await page.getByLabel("源入点秒", { exact: true }).inputValue()).toBe("1");
    await page.getByLabel("持续秒", { exact: true }).fill("1.5");
    await click("应用更改");
    await shown();
    await seek(0.5, 0.5, 2);
    await track().press("Alt+Shift+ArrowRight");
    await ready();
    await shown();
    expect(await page.getByLabel("持续秒", { exact: true }).inputValue()).toBe("1.5");
    await page.getByLabel("素材倍率", { exact: true }).fill("0.5");
    await click("应用更改");
    await shown();
    await seek(0.5, 0.5, 1.25);
    expect(await page.getByLabel("持续秒", { exact: true }).inputValue()).toBe("1.5");
    await click("撤销");
    await shown();
    await seek(0.5, 0.5, 2);
    expect(await page.getByLabel("素材倍率", { exact: true }).inputValue()).toBe("2");
    await click("重做");
    await shown();
    await seek(0.5, 0.5, 1.25);
    await driver.capture("half-rate-history");
    await click("主合成");
    await enter("hf-b");
    await seek(0.5, 5.5, 1.25, "hf-b");
    await track().press("Enter");
    await ready();
    expect(await page.getByLabel("素材倍率", { exact: true }).inputValue()).toBe("0.5");
    for (const [rate, point, duration, local, source] of [
      [0.1, 0, 2, 0.5, 0.05],
      [10, 0, 0.3, 0.1, 1],
    ]) {
      await page.getByLabel("素材倍率", { exact: true }).fill(String(rate));
      await page.getByLabel("源入点秒", { exact: true }).fill(String(point));
      await page.getByLabel("持续秒", { exact: true }).fill(String(duration));
      await click("应用更改");
      await shown();
      await seek(local ?? 0, 5 + (local ?? 0), source ?? 0, "hf-b");
    }
    await page.getByLabel("素材倍率", { exact: true }).fill("2");
    await page.getByLabel("源入点秒", { exact: true }).fill("1");
    await page.getByLabel("持续秒", { exact: true }).fill("1.5");
    await click("应用更改");
    await shown();
    await seek(0.5, 5.5, 2, "hf-b");
    const saved = await read(),
      resource = saved.resources[0];
    if (!resource) throw Error("missing audio");
    expect(saved.files.find((f) => f.path === "index.html")).toEqual(files()[0]);
    expect(saved.files.find((f) => f.path === "scenes/card.html")?.content.match(/<audio\b/g)).toHaveLength(1);
    expect(
      (await readResource(runtime, { ...owner, revision: saved.revision, path: resource.path })).data ===
        wave().toString("base64"),
    ).toBe(true);
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
    await seek(0.5, 5.5, 2, "hf-b");
    await driver.capture("cold-fixed-rate-shared-clock");
    expect(driver.errors).toEqual([]);
    expect([...external]).toEqual([]);
    report.revision = saved.revision;
    report.resourceDigest = resource.digest;
    report.cases = [
      "authored-rate-not-transport",
      "native-fast-play-pause",
      "lost-committed-save-retry",
      "atomic-rate-window-refusal",
      "remaining-source-trim",
      "half-rate-history",
      "shared-source-clock",
      "native-rate-boundaries",
      "unchanged-binary",
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
