import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import { createServer } from "node:http";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { browser } from "@odsuite/automation";
import { channel, digest, namespace } from "@odsuite/protocol";
import { serve as manage, managerEndpoint, observeProcesses, readDirectory } from "@odsuite/sidecar";
import { initialFiles } from "@open-motion/workspace";
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
it("edits parent host windows without stretching shared child source and restores nested clocks through failure, history and restart", async () => {
  const evidence = fileURLToPath(new URL(`../../../.artifacts/host-browser/${randomUUID()}/`, import.meta.url)),
    root = join(evidence, "sidecar"),
    scope = { channel: channel("dev"), namespace: namespace("host-browser") },
    report: Record<string, unknown> = {};
  await mkdir(evidence, { recursive: true });
  let runtime: Awaited<ReturnType<typeof open>> | undefined, driver: Awaited<ReturnType<typeof browser>> | undefined;
  const external = new Set<string>();
  try {
    runtime = await open({ root, scope, version: "0.6.1-dev.1" });
    const session = await runtime.execute("session_create", {
        requestId: randomUUID(),
        title: "Host timing",
        mode: "motion",
      }),
      artifact = await runtime.execute("artifact_create", {
        requestId: randomUUID(),
        sessionId: session.id,
        title: "Parent windows",
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
    const seek = async (local: number, global: number) => {
      await page.getByLabel("定位秒", { exact: true }).fill(String(local));
      await click("定位");
      await expect
        .poll(async () => Number(await page.getByLabel("全局播放时间", { exact: true }).textContent()))
        .toBeCloseTo(global, 2);
    };
    const paint = async (scope: string, selector: string, x: number) => {
      await expect
        .poll(() =>
          page
            .frameLocator("iframe:not([hidden])")
            .locator(`[data-open-motion-instance="${scope}"] ${selector}`)
            .evaluate((element) => new DOMMatrix(getComputedStyle(element).transform).m41),
        )
        .toBeCloseTo(x, 1);
    };
    const row = (id: string) => page.locator(`[data-clip-id="${id}"]`);
    const read = () => runtime!.execute("project_read", owner);
    const drag = async (id: string, resize: boolean, delta: number, duration: number) => {
      const track = row(id),
        target = track.locator(resize ? ".om-time__handle" : ".om-time__bar"),
        box = await target.boundingBox(),
        svg = page.getByRole("group", { name: "原生时间轴轨道", exact: true }),
        bounds = await svg.boundingBox(),
        width = await svg.evaluate((element) => (element as SVGSVGElement).viewBox.baseVal.width);
      if (!box || !bounds) throw Error("missing host track bounds");
      const x = box.x + (resize ? box.width / 2 : Math.min(16, box.width / 2)),
        y = box.y + box.height / 2;
      await page.mouse.move(x, y);
      await page.mouse.down();
      await page.mouse.move(x + ((delta / duration) * (width - 180) * bounds.width) / width, y, { steps: 6 });
      await page.mouse.up();
      await ready();
      await shown();
    };
    await page.goto((await runtime.status()).web);
    await ready();
    await shown();
    await seek(1.5, 1.5);
    await paint("hf-a", "p", 10);
    await row("hf-a").focus();
    await row("hf-a").press("ArrowRight");
    await ready();
    await shown();
    await expect.poll(() => row("hf-a").getAttribute("aria-label")).toContain("1.10秒");
    await seek(1.5, 1.5);
    await paint("hf-a", "p", 8);
    await drag("hf-a", false, 0.9, 12);
    await expect.poll(() => row("hf-a").getAttribute("aria-label")).toContain("2.00秒 / 4.00秒");
    await drag("hf-a", true, -2, 12);
    await expect.poll(() => row("hf-a").getAttribute("aria-label")).toContain("2.00秒 / 2.00秒");
    await seek(2.5, 2.5);
    await paint("hf-a", "p", 10);
    await seek(6.5, 6.5);
    await paint("hf-b", "p", 10);
    const trimmed = await read();
    for (const path of ["card.html", "leaf.html"])
      expect(trimmed.files.find((file) => file.path === path)).toEqual(
        original.files.find((file) => file.path === path),
      );
    await row("hf-a").press("Enter");
    await ready();
    await page.getByLabel("开始秒", { exact: true }).fill("3");
    await page.getByLabel("持续秒", { exact: true }).fill("1.5");
    await page.route("**/api/project_save", (route) => route.abort("failed"));
    await page.getByRole("button", { name: "应用更改", exact: true }).click();
    await expect.poll(() => page.getByRole("button", { name: "重试", exact: true }).isEnabled()).toBe(true);
    expect((await read()).revision).toBe(trimmed.revision);
    expect(await page.getByLabel("开始秒", { exact: true }).inputValue()).toBe("3");
    await driver.capture("host-save-failure");
    await page.unrouteAll({ behavior: "wait" });
    await click("重试");
    await shown();
    await expect.poll(() => row("hf-a").getAttribute("aria-label")).toContain("3.00秒 / 1.50秒");
    const parentSaved = await read();
    await enter("hf-a");
    await seek(0.5, 3.5);
    await paint("hf-a", "p", 10);
    await click("主合成");
    await enter("hf-b");
    await row("hf-leaf").focus();
    await row("hf-leaf").press("Shift+ArrowLeft");
    await ready();
    await shown();
    await expect.poll(() => row("hf-leaf").getAttribute("aria-label")).toContain("1.00秒 / 1.00秒");
    const nested = await read();
    expect(nested.files.find((file) => file.path === "index.html")).toEqual(
      parentSaved.files.find((file) => file.path === "index.html"),
    );
    expect(nested.files.find((file) => file.path === "leaf.html")).toEqual(
      original.files.find((file) => file.path === "leaf.html"),
    );
    expect(nested.files.find((file) => file.path === "card.html")?.content).toContain('data-start="1"');
    await enter("hf-b/hf-leaf");
    await seek(0.5, 7.5);
    await paint("hf-b/hf-leaf", "span", 20);
    await click("撤销");
    await shown();
    await seek(0.5, 8.5);
    await paint("hf-b/hf-leaf", "span", 20);
    await click("重做");
    await shown();
    await seek(0.5, 7.5);
    await paint("hf-b/hf-leaf", "span", 20);
    await page.getByRole("tab", { name: "文件", exact: true }).click();
    await page.getByRole("button", { name: "index.html", exact: true }).click();
    const source = page.getByRole("textbox", { name: "index.html", exact: true });
    await source.fill((await source.inputValue()).replace('data-start="6"', 'data-start="9"'));
    await expect
      .poll(() => page.getByRole("button", { name: "放弃本地修改并刷新", exact: true }).isEnabled())
      .toBe(true);
    expect(await instance()).toBe("hf-b/hf-leaf");
    expect(Number(await page.getByLabel("全局播放时间", { exact: true }).textContent())).toBeCloseTo(7.5, 2);
    expect(await page.getByRole("button", { name: "定位", exact: true }).isDisabled()).toBe(true);
    await click("放弃本地修改并刷新");
    await shown();
    await click("预览");
    await seek(0.5, 7.5);
    await paint("hf-b/hf-leaf", "span", 20);
    await driver.capture("nested-host-timing-confirmed");
    const saved = await read();
    expect(saved.files).toEqual(nested.files);
    await page.reload();
    await ready();
    await shown();
    await expect.poll(instance).toBe("");
    await runtime.close();
    expect(await observeProcesses(root)).toHaveLength(0);
    runtime = await open({ root, scope, version: "0.6.1-dev.1" });
    expect((await read()).files).toEqual(saved.files);
    await page.goto((await runtime.status()).web);
    await ready();
    await shown();
    await enter("hf-a");
    await enter("hf-a/hf-leaf");
    await seek(0.2, 4.2);
    await paint("hf-a/hf-leaf", "span", 8);
    await seek(0.5, 4.5);
    expect(driver.errors).toEqual([]);
    expect([...external]).toEqual([]);
    report.revision = saved.revision;
    report.cases = [
      "keyboard-host-move",
      "pointer-host-move-and-right-trim",
      "unaltered-child-source-and-native-rate",
      "failed-parent-save-retry",
      "shared-parent-retime",
      "nested-window-intersection",
      "undo-redo-clocks",
      "uncommitted-root-draft-keeps-confirmed-clock",
      "reload-and-cold-restore",
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

it("quiesces real child Prism reads before entering process retirement", async () => {
  const evidence = fileURLToPath(new URL(`../../../.artifacts/child-drain/${randomUUID()}/`, import.meta.url)),
    productRoot = join(evidence, "product"),
    publicationRoot = join(evidence, "publication"),
    scope = { channel: channel("dev"), namespace: namespace("child-drain") };
  await mkdir(evidence, { recursive: true });
  const publication = await manage(managerEndpoint(publicationRoot), { root: publicationRoot }),
    factory = publication.factory(scope),
    files = initialFiles();
  let origin = "",
    release = () => {},
    sourceStarted = false;
  const gate = new Promise<void>((done) => {
      release = done;
    }),
    report: Record<string, unknown> = {};
  const stage = async (name: string) => {
    report.stage = name;
    console.info(`[child-drain] ${name}`);
    await writeFile(join(evidence, "progress.json"), JSON.stringify(report, null, 2));
  };
  let runtime: Awaited<ReturnType<typeof open>> | undefined, reading: Promise<unknown> | undefined, failure: unknown;
  const errors: unknown[] = [];
  const remote = createServer((request, response) => {
    if (request.url?.startsWith("/resources/")) {
      response.writeHead(200, { "content-type": "application/json" });
      response.end(
        JSON.stringify({
          resourceId: "1500c9af-186b-457f-b74d-a58113f657d8",
          environment: "dev",
          channel: "default",
          publicationId: "child-drain",
          defaultLocale: "en",
          content: {
            en: {
              templates: [
                {
                  templateId: "child-drain",
                  sortOrder: 1,
                  original: { templateName: "Child drain", license: "Apache-2.0" },
                  files: files.map((file) => ({
                    path: file.path,
                    url: `${origin}/files/${digest(file.content).slice(7)}`,
                    bytes: Buffer.byteLength(file.content),
                    sha256: digest(file.content).slice(7),
                  })),
                },
              ],
            },
          },
        }),
      );
      return;
    }
    const file = files.find((file) => request.url === `/files/${digest(file.content).slice(7)}`);
    if (!file) {
      response.writeHead(404);
      response.end();
      return;
    }
    response.writeHead(200);
    response.write(Buffer.from(file.content).subarray(0, 1));
    sourceStarted = true;
    void gate.then(() => response.end(Buffer.from(file.content).subarray(1)));
  });
  try {
    await factory.expose({
      identity: { service: "publication", generation: digest("child-drain") },
      handlers: {},
      lifecycle: {
        initialize: async (context) => {
          const socket = await context.allocate({ kind: "socket", name: "publication" }),
            port = await context.allocate({ kind: "port", name: "publication", scheme: "http" });
          await new Promise<void>((done) => remote.listen(socket.value, done));
          await context.forward(port.value, socket.value);
          origin = port.value;
        },
        stop: async () =>
          new Promise<void>((done, reject) => remote.close((error) => (error ? reject(error) : done()))),
      },
    });
    await stage("start actual child");
    runtime = await open({
      root: productRoot,
      scope,
      version: "0.6.1-dev.1",
      prism: {
        origin,
        environment: "dev",
        channel: "default",
        locale: "en",
        resourceId: "1500c9af-186b-457f-b74d-a58113f657d8",
      },
    });
    const pid = (await runtime.status()).daemon.pid;
    expect(pid).not.toBe(process.pid);
    expect(
      (await observeProcesses(productRoot)).some((entry) => entry.processes.some((process) => process.pid === pid)),
    ).toBe(true);
    await stage("read publication catalog");
    const catalog = (await runtime.execute("template_list", {})).catalog;
    const entry = catalog?.entries[0];
    if (!entry) throw Error("published child template is missing");
    expect(entry.availability).toBe("source-required");
    await stage("wait actual partial source");
    reading = runtime.execute("template_read", { id: entry.id, contentHash: entry.contentHash });
    let outcome = "pending";
    void reading.then(
      () => {
        outcome = "succeeded";
      },
      (error) => {
        outcome = "failed";
        report.readFailure = error instanceof Error ? error.name : "unknown";
      },
    );
    await expect.poll(() => sourceStarted || outcome !== "pending").toBe(true);
    expect(sourceStarted).toBe(true);
    await stage("quiesce actual child");
    const closing = runtime.close();
    await expect(reading).rejects.toThrow();
    await closing;
    report.partialSourceAborted = true;
    report.childRetired = true;
    await stage("actual child retired");
  } catch (error) {
    failure = error;
    report.failure = error instanceof Error ? error.name : "unknown";
  } finally {
    release();
    await reading?.catch(() => {});
    try {
      await runtime?.close();
    } catch (error) {
      errors.push(error);
    }
    try {
      await publication.close();
    } catch (error) {
      errors.push(error);
    }
    for (const [name, root] of [
      ["product", productRoot],
      ["publication", publicationRoot],
    ] as const) {
      report[`${name}Phase`] = "unknown";
      report[`${name}Processes`] = "unknown";
      try {
        report[`${name}Phase`] = (await readDirectory(root)).manager.phase;
      } catch (error) {
        errors.push(error);
      }
      try {
        report[`${name}Processes`] = await observeProcesses(root);
      } catch (error) {
        errors.push(error);
      }
    }
    report.cleanupErrors = errors.map((error) => (error instanceof Error ? error.name : "unknown"));
    await writeFile(join(evidence, "report.json"), JSON.stringify(report, null, 2));
  }
  if (failure || errors.length)
    throw new AggregateError([...(failure ? [failure] : []), ...errors], "child drain failed");
  expect(errors).toEqual([]);
  expect(report.productPhase).toBe("closed");
  expect(report.publicationPhase).toBe("closed");
  expect(report.productProcesses).toEqual([]);
  expect(report.publicationProcesses).toEqual([]);
}, 20000);
