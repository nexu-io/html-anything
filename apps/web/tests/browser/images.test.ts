// @vitest-environment node
import { createHash, randomUUID } from "node:crypto";
import { writeFile } from "node:fs/promises";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { browser } from "@odsuite/automation";
import { channel, digest, namespace } from "@odsuite/protocol";
import { source } from "@odsuite/serve";
import { managerEndpoint, observeProcesses, readDirectory, serve } from "@odsuite/sidecar";
import { serve as daemonServe } from "@open-motion/daemon";
import { Client } from "@open-motion/daemon/client";
import { expect, it } from "vitest";
import type { Config } from "@";

it("extends and trims a static image while keeping its end, source attributes, receipts and native visibility", async () => {
  const repo = fileURLToPath(new URL("../../../../", import.meta.url)),
    evidence = join(repo, ".artifacts", "image-trim", randomUUID()),
    root = join(evidence, "sidecar"),
    manager = await serve(managerEndpoint(root), { root }),
    factory = manager.factory({ channel: channel("dev"), namespace: namespace("image") });
  let config: Config | undefined,
    daemon: Awaited<ReturnType<typeof daemonServe>> | undefined,
    capability: Awaited<ReturnType<typeof factory.issue>> | undefined,
    driver: Awaited<ReturnType<typeof browser>> | undefined;
  const report: Record<string, unknown> = {};
  try {
    const web = await source(factory, {
      name: "web",
      directory: join(repo, "apps/web/dist"),
      documents: {
        "/bootstrap.json": () => {
          if (!config) throw Error("not ready");
          return { type: "application/json", body: JSON.stringify(config) };
        },
      },
    });
    await factory.expose({
      identity: { service: "daemon", generation: digest("project-image-trim-browser") },
      handlers: {},
      lifecycle: {
        initialize: async (context) => {
          const socket = await context.allocate({ kind: "socket", name: "daemon" }),
            port = await context.allocate({ kind: "port", name: "daemon", scheme: "http" });
          capability = await factory.issue({ owner: `n${context.incarnation.replaceAll("-", "")}`, service: "daemon" });
          daemon = await daemonServe({
            data: context.roots.data,
            origin: web.endpoint.url,
            socket: socket.value,
            token: capability.token,
            endpoint: port.value,
          });
          await context.forward(port.value, socket.value);
          config = {
            daemon: port.value,
            token: capability.token,
            environment: {
              schema: 1,
              carrier: "browser-fixture",
              system: { platform: process.platform, release: "test", arch: process.arch },
              runtime: { name: "node", version: process.versions.node },
            },
          };
        },
        quiesce: async () => daemon?.quiesce(),
        stop: async () => {
          await daemon?.close();
          if (capability) await factory.retire(capability);
        },
      },
    });
    if (!config) throw Error("missing fixture");
    const client = new Client(config.daemon, config.token),
      session = await client.execute("session_create", {
        requestId: randomUUID(),
        title: "Image trim",
        mode: "motion",
      }),
      artifact = await client.execute("artifact_create", {
        requestId: randomUUID(),
        sessionId: session.id,
        title: "Image start edge",
        files: [
          {
            path: "index.html",
            content:
              '<html><body><main data-composition-id="main" data-width="640" data-height="360" data-duration="8"><img id="image" data-hf-id="image" src="assets/photo.png" data-start="3" data-duration="2" data-media-start="0" data-playback-start="0" width="160" height="120"></main><script>window.__timelines={main:gsap.timeline({paused:true}).to({},{duration:8})};</script></body></html>',
          },
        ],
      }),
      owner = { sessionId: session.id, artifactId: artifact.id },
      initial = await client.execute("project_read", owner),
      bytes = Buffer.from(
        "iVBORw0KGgoAAAANSUhEUgAAACAAAAAYCAYAAACbU/80AAAAPklEQVR4AcXBMQEAIAzAsK5CuPEvChtMRpN5535CEpOYxCQmMYlJTGISk5jEJCYxiUlMYhKTmMQkJjGJSWwBYl8CWwMRvGQAAAAASUVORK5CYII=",
        "base64",
      ),
      imported = await client.importResource(
        {
          ...owner,
          requestId: randomUUID(),
          expectedRevision: initial.revision,
          path: "assets/photo.png",
          name: "Photo",
          digest: `sha256:${createHash("sha256").update(bytes).digest("hex")}`,
          bytes: bytes.length,
        },
        new Blob([Uint8Array.from(bytes)]),
      );
    if (!imported.project) throw Error("missing import");
    await client.execute("artifact_open", {
      ...owner,
      requestId: randomUUID(),
      expectedSelection: 0,
      expectedCurrent: null,
    });
    driver = await browser({ evidence, viewport: { width: 1600, height: 1000 } });
    const page = driver.page;
    const ready = () =>
        page
          .locator("[aria-live]")
          .filter({ hasText: /^就绪$/ })
          .waitFor(),
      click = async (name: string) => {
        await page.getByRole("button", { name, exact: true }).click();
        await ready();
      },
      read = () => client.execute("project_read", owner);
    const state = async () => {
      const project = await read(),
        file = project.files[0];
      if (!file) throw Error("missing source");
      const model = await client.inspectMotion(file.content),
        clip = model.clips.find((c) => c.id === "image");
      if (!clip) throw Error("missing image");
      return { project, clip };
    };
    const handle = () => page.locator('[data-clip-id="image"] [data-start-edge][tabindex="0"]');
    const seek = async (time: number) => {
      await page.getByLabel("预览状态", { exact: true }).filter({ hasText: "预览就绪" }).waitFor();
      await page.getByLabel("定位秒", { exact: true }).fill(String(time));
      await click("定位");
      await expect
        .poll(() =>
          page
            .frameLocator("iframe:not([hidden])")
            .locator("body")
            .evaluate(() => Reflect.get(window, "__timelines").main.time()),
        )
        .toBeCloseTo(time, 2);
    };
    const visible = () =>
      page
        .frameLocator("iframe:not([hidden])")
        .locator("#image")
        .evaluate((node) => {
          const view = getComputedStyle(node);
          return view.display !== "none" && view.visibility !== "hidden" && Number(view.opacity) > 0.5;
        });
    const drag = async (delta: number, cancel = false) => {
      await handle().waitFor();
      const box = await handle().boundingBox();
      if (!box) throw Error("missing handle");
      const pps = await page.getByLabel("原生时间轴轨道", { exact: true }).evaluate((node) => {
        const svg = node as SVGSVGElement;
        return (
          ((svg.getBoundingClientRect().width / svg.viewBox.baseVal.width) * (svg.viewBox.baseVal.width - 180)) / 8
        );
      });
      await page.mouse.move(box.x + 4, box.y + 20);
      await page.mouse.down();
      await page.mouse.move(box.x + 4 + delta * pps, box.y + 20, { steps: 6 });
      if (cancel) await page.keyboard.press("Escape");
      await page.mouse.up();
    };
    await page.goto(web.endpoint.url);
    await ready();
    await handle().waitFor();
    await seek(2);
    expect(await visible()).toBe(false);
    const ids: string[] = [];
    let lose = true;
    await page.route("**/api/project_save", async (route) => {
      ids.push(route.request().postDataJSON().requestId);
      if (lose) {
        lose = false;
        const response = await route.fetch();
        expect(response.status()).toBe(200);
        await route.abort("failed");
      } else await route.continue();
    });
    const oldFrame = await page.locator("iframe:not([hidden])").elementHandle();
    await drag(-1.5);
    await expect.poll(() => page.getByRole("button", { name: "重试", exact: true }).isEnabled()).toBe(true);
    const committed = await state();
    expect(committed.clip).toMatchObject({ start: 1.5, duration: 3.5 });
    expect(committed.project.resources).toEqual(imported.project.resources);
    expect(await page.locator("iframe:not([hidden])").evaluate((node, old) => node === old, oldFrame)).toBe(true);
    await click("重试");
    await page.unroute("**/api/project_save");
    expect(ids).toHaveLength(2);
    expect(ids[0]).toBe(ids[1]);
    await seek(2);
    await expect.poll(visible).toBe(true);
    await driver.capture("extended-image");
    await click("撤销");
    expect((await state()).clip).toMatchObject({ start: 3, duration: 2 });
    await seek(2);
    await expect.poll(visible).toBe(false);
    await click("重做");
    await seek(2);
    await expect.poll(visible).toBe(true);
    await handle().focus();
    await page.keyboard.press("ArrowRight");
    await ready();
    expect((await state()).clip).toMatchObject({ start: 1.6, duration: 3.4 });
    expect(await handle().evaluate((node) => node === document.activeElement)).toBe(true);
    const beforeCancel = await read();
    await drag(-0.5, true);
    expect(await read()).toEqual(beforeCancel);
    await handle().focus();
    await page.keyboard.press("Shift+ArrowLeft");
    await ready();
    expect((await state()).clip).toMatchObject({ start: 0.6, duration: 4.4 });
    await handle().focus();
    await page.keyboard.press("Shift+ArrowLeft");
    await ready();
    const last = await state();
    expect(last.clip).toMatchObject({ start: 0, duration: 5 });
    expect(last.project.files[0]?.content).toContain('data-media-start="0"');
    expect(last.project.files[0]?.content).toContain('data-playback-start="0"');
    await page.reload();
    await ready();
    await seek(0.5);
    await expect.poll(visible).toBe(true);
    expect(await read()).toEqual(last.project);
    await seek(5.5);
    await expect.poll(visible).toBe(false);
    await driver.capture("trimmed-image-end-preserved");
    expect(driver.errors).toEqual([]);
    Object.assign(report, {
      first: committed.clip,
      final: last.clip,
      history: last.project.history,
      sameSaveReceipt: ids[0] === ids[1],
      escapeNoSave: true,
      keyboardFocus: true,
      reload: true,
      sourceClockAttributesPreserved: true,
    });
  } catch (error) {
    report.failure = String(error);
    report.status = await driver?.page.locator("[aria-live]").allTextContents();
    await driver?.capture("failure").catch(() => {});
    throw error;
  } finally {
    await driver?.close();
    await manager.close();
    report.phase = (await readDirectory(root)).manager.phase;
    report.processes = await observeProcesses(root);
    await writeFile(join(evidence, "report.json"), JSON.stringify(report, null, 2));
  }
  expect(report.phase).toBe("closed");
  expect(report.processes).toEqual([]);
}, 90000);
