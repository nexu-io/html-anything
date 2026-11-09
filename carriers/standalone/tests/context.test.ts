import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { browser } from "@odsuite/automation";
import { channel, namespace } from "@odsuite/protocol";
import { observeProcesses, readDirectory } from "@odsuite/sidecar";
import { expect, it } from "vitest";
import { open } from "@";

const sources = () => [
  {
    path: "index.html",
    content:
      '<html><body><main data-composition-id="main" data-width="640" data-height="360" data-duration="12"><section data-hf-id="hf-a" style="position:absolute;left:0;top:0" data-composition-id="card" data-composition-src="card.html" data-start="1" data-duration="4"></section><section data-hf-id="hf-b" style="position:absolute;left:260px;top:0" data-composition-id="card" data-composition-src="card.html" data-start="6" data-duration="4"></section></main><script>window.__timelines={main:gsap.timeline({paused:true}).to({},{duration:12})};</script></body></html>',
  },
  {
    path: "card.html",
    content:
      '<template><main data-composition-id="card" data-width="240" data-height="100" data-duration="4"><p data-hf-id="hf-title" data-start="0" data-duration="4">Shared title</p><div data-hf-id="hf-leaf" data-composition-id="leaf" data-composition-src="leaf.html" data-start="2" data-duration="1"></div></main><script>const tl=gsap.timeline({paused:true});tl.to(\'[data-hf-id="hf-title"]\',{keyframes:{"0%":{x:0,ease:"none"},"100%":{x:80,ease:"none"}},duration:4,ease:"none"},0);window.__timelines=window.__timelines||{};window.__timelines.card=tl;</script></template>',
  },
  {
    path: "leaf.html",
    content:
      '<template><div data-composition-id="leaf" data-width="160" data-height="30" data-duration="1"><span data-hf-id="hf-caption" data-start="0" data-duration="1">Nested title</span></div><script>window.__timelines=window.__timelines||{};window.__timelines.leaf=gsap.timeline({paused:true}).to("span",{x:40,duration:1,ease:"none"},0);</script></template>',
  },
];
it("navigates repeated instances with local clocks and commits shared native source through failure, history and cold restore", async () => {
  const evidence = fileURLToPath(new URL(`../../../.artifacts/context-browser/${randomUUID()}/`, import.meta.url)),
    root = join(evidence, "sidecar"),
    scope = { channel: channel("dev"), namespace: namespace("context-browser") },
    report: Record<string, unknown> = { evidence };
  await mkdir(evidence, { recursive: true });
  let runtime: Awaited<ReturnType<typeof open>> | undefined, driver: Awaited<ReturnType<typeof browser>> | undefined;
  const external = new Set<string>();
  try {
    runtime = await open({ root, scope, version: "0.6.1-dev.1" });
    let web = (await runtime.status()).web;
    const session = await runtime.execute("session_create", {
        requestId: randomUUID(),
        title: "Composition editing",
        mode: "motion",
      }),
      artifact = await runtime.execute("artifact_create", {
        requestId: randomUUID(),
        sessionId: session.id,
        title: "Shared native definitions",
        files: sources(),
      }),
      owner = { sessionId: session.id, artifactId: artifact.id },
      state = await runtime.execute("workspace_state", {});
    await runtime.execute("artifact_open", {
      requestId: randomUUID(),
      ...owner,
      expectedSelection: state.selection.revision,
      expectedCurrent: null,
    });
    const original = await runtime.execute("project_read", owner);
    driver = await browser({ evidence, viewport: { width: 1600, height: 1100 } });
    const page = driver.page;
    page.setDefaultTimeout(10000);
    page.on("request", (request) => {
      const url = new URL(request.url());
      if (["http:", "https:"].includes(url.protocol) && !["127.0.0.1", "localhost", "[::1]"].includes(url.hostname))
        external.add(url.origin);
    });
    const ready = () =>
      page
        .locator("[aria-live]")
        .filter({ hasText: /^就绪$/ })
        .waitFor();
    const shown = () => page.getByLabel("预览状态", { exact: true }).filter({ hasText: "预览就绪" }).waitFor();
    const click = async (name: string) => {
      await page.getByRole("button", { name, exact: true }).click();
      await ready();
    };
    const instance = () => page.getByLabel("合成上下文", { exact: true }).getAttribute("data-instance");
    const enter = async (id: string) => {
      await page.getByLabel("合成实例", { exact: true }).selectOption(id);
      await click("进入合成");
      await expect.poll(instance).toBe(id);
      await shown();
    };
    const rootContext = async () => {
      await click("主合成");
      await expect.poll(instance).toBe("");
    };
    const frame = () => page.frameLocator("iframe:not([hidden])");
    const seek = async (local: number, global: number) => {
      await page.getByLabel("定位秒", { exact: true }).fill(String(local));
      await click("定位");
      await expect
        .poll(async () => Number(await page.getByLabel("全局播放时间", { exact: true }).textContent()))
        .toBeCloseTo(global, 2);
      await expect
        .poll(async () => Number(await page.getByLabel("播放时间", { exact: true }).textContent()))
        .toBeCloseTo(local, 2);
    };
    await page.goto(web);
    await ready();
    await shown();
    await seek(2.5, 2.5);
    await page.getByLabel("合成实例", { exact: true }).selectOption("hf-b");
    await page
      .getByLabel("合成实例", { exact: true })
      .evaluate((element) => element.setAttribute("data-probe", "stable-context"));
    await click("切换主题");
    expect(await page.getByLabel("合成实例", { exact: true }).getAttribute("data-probe")).toBe("stable-context");
    expect(await page.getByLabel("合成实例", { exact: true }).inputValue()).toBe("hf-b");
    await enter("hf-b");
    await seek(0.5, 6.5);
    await click("关闭预览");
    await click("打开预览");
    await shown();
    await expect
      .poll(async () => Number(await page.getByLabel("全局播放时间", { exact: true }).textContent()))
      .toBeCloseTo(6, 2);
    await seek(0.5, 6.5);
    await page.getByLabel("定位秒", { exact: true }).fill("5");
    await click("定位");
    await page.getByLabel("预览状态", { exact: true }).filter({ hasText: "局部播放时间超出" }).waitFor();
    expect(Number(await page.getByLabel("全局播放时间", { exact: true }).textContent())).toBeCloseTo(6.5, 2);
    await seek(0.5, 6.5);
    await page.getByRole("treeitem", { name: "Shared title", exact: true }).click();
    await ready();
    await page.getByLabel("文本内容", { exact: true }).fill("Shared changed");
    await page.route("**/api/project_save", (route) => route.abort("failed"));
    await page.getByRole("button", { name: "应用更改", exact: true }).click();
    await expect.poll(() => page.getByRole("button", { name: "重试", exact: true }).isEnabled()).toBe(true);
    expect(await instance()).toBe("hf-b");
    expect(await page.getByRole("button", { name: "主合成", exact: true }).isDisabled()).toBe(true);
    expect((await runtime.execute("project_read", owner)).revision).toBe(original.revision);
    expect(await page.getByLabel("文本内容", { exact: true }).inputValue()).toBe("Shared changed");
    await driver.capture("failed-shared-source-save");
    await page.unroute("**/api/project_save");
    await click("重试");
    await shown();
    await expect.poll(() => frame().getByText("Shared changed", { exact: true }).count()).toBe(2);
    const changed = await runtime.execute("project_read", owner);
    expect(changed.files.find((file) => file.path === "index.html")).toEqual(
      original.files.find((file) => file.path === "index.html"),
    );
    expect(changed.files.find((file) => file.path === "leaf.html")).toEqual(
      original.files.find((file) => file.path === "leaf.html"),
    );
    expect(changed.files.find((file) => file.path === "card.html")?.content).toContain("<template");
    expect(changed.files.map((file) => file.content).join("")).not.toContain("data-open-motion-instance");
    await enter("hf-b/hf-leaf");
    await seek(0.5, 8.5);
    const target = await frame()
        .locator('[data-open-motion-instance="hf-b/hf-leaf"] span')
        .evaluate((node) => {
          const rect = node.getBoundingClientRect();
          return { x: rect.x + rect.width / 2, y: rect.y + rect.height / 2, width: innerWidth, height: innerHeight };
        }),
      viewport = await page.locator("iframe:not([hidden])").boundingBox();
    if (!viewport) throw Error("missing native viewport");
    await page.mouse.click(
      viewport.x + (target.x * viewport.width) / target.width,
      viewport.y + (target.y * viewport.height) / target.height,
    );
    await ready();
    await expect.poll(() => page.getByLabel("文本内容", { exact: true }).inputValue()).toBe("Nested title");
    await page.mouse.move(
      viewport.x + (target.x * viewport.width) / target.width,
      viewport.y + (target.y * viewport.height) / target.height,
    );
    await page.mouse.down();
    await page.mouse.move(
      viewport.x + ((target.x + 12) * viewport.width) / target.width,
      viewport.y + ((target.y + 8) * viewport.height) / target.height,
      { steps: 5 },
    );
    await page.mouse.up();
    await ready();
    await shown();
    await page.getByText("外观与静态位移", { exact: true }).click();
    await expect
      .poll(async () => Number(await page.getByLabel("偏移 X", { exact: true }).inputValue()))
      .toBeCloseTo(12, 0);
    await expect
      .poll(async () => Number(await page.getByLabel("偏移 Y", { exact: true }).inputValue()))
      .toBeCloseTo(8, 0);
    await page.getByLabel("文本内容", { exact: true }).fill("Nested changed");
    await click("应用更改");
    await shown();
    await expect.poll(() => frame().getByText("Nested changed", { exact: true }).count()).toBe(2);
    const nested = await runtime.execute("project_read", owner);
    expect(nested.files.find((file) => file.path === "card.html")).toEqual(
      changed.files.find((file) => file.path === "card.html"),
    );
    await driver.capture("nested-context-shared-writeback");
    await rootContext();
    await expect
      .poll(async () => Number(await page.getByLabel("播放时间", { exact: true }).textContent()))
      .toBeCloseTo(2.5, 2);
    await enter("hf-b");
    await page.getByRole("treeitem", { name: "Shared changed", exact: true }).click();
    await ready();
    await page.getByText("关键帧动画", { exact: true }).click();
    await expect.poll(() => page.getByLabel("关键帧 2 值", { exact: true }).inputValue()).toBe("80");
    await page.getByLabel("关键帧 2 值", { exact: true }).fill("160");
    await click("保存动画");
    await shown();
    await seek(0.5, 6.5);
    await expect
      .poll(() =>
        frame()
          .locator('[data-open-motion-instance="hf-b"] p')
          .evaluate((element) => new DOMMatrix(getComputedStyle(element).transform).m41),
      )
      .toBeCloseTo(20, 1);
    await click("撤销");
    await shown();
    await seek(0.5, 6.5);
    await expect
      .poll(() =>
        frame()
          .locator('[data-open-motion-instance="hf-b"] p')
          .evaluate((element) => new DOMMatrix(getComputedStyle(element).transform).m41),
      )
      .toBeCloseTo(10, 1);
    await click("重做");
    await shown();
    const saved = await runtime.execute("project_read", owner);
    await page.reload();
    await ready();
    await shown();
    await expect.poll(instance).toBe("");
    await runtime.close();
    expect(await observeProcesses(root)).toHaveLength(0);
    runtime = await open({ root, scope, version: "0.6.1-dev.1" });
    web = (await runtime.status()).web;
    expect((await runtime.execute("project_read", owner)).files).toEqual(saved.files);
    await page.goto(web);
    await ready();
    await shown();
    await enter("hf-b");
    await seek(0.5, 6.5);
    await expect
      .poll(() =>
        frame()
          .locator('[data-open-motion-instance="hf-b"] p')
          .evaluate((element) => new DOMMatrix(getComputedStyle(element).transform).m41),
      )
      .toBeCloseTo(20, 1);
    expect(driver.errors).toEqual([]);
    expect([...external]).toEqual([]);
    report.revision = saved.revision;
    report.cases = [
      "instance-navigation-stable-selector",
      "local-global-clocks-and-parent-restoration",
      "failed-shared-source-save-retry",
      "shared-template-source-only-write",
      "scoped-nested-canvas-selection-and-drag",
      "nested-file-writeback",
      "local-animation-paint-and-history",
      "reload-and-cold-carrier-restoration",
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
