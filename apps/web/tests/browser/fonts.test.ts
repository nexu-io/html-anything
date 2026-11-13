// @vitest-environment node
import { randomUUID } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { browser } from "@odsuite/automation";
import { channel, digest, namespace } from "@odsuite/protocol";
import { source } from "@odsuite/serve";
import { managerEndpoint, observeProcesses, readDirectory, serve } from "@odsuite/sidecar";
import { serve as daemonServe } from "@open-motion/daemon";
import { Client } from "@open-motion/daemon/client";
import { resourceFontFamily } from "@open-motion/workspace/contract";
import { expect, it } from "vitest";
import type { Config } from "@";

it("imports an actual font through unknown receipts, paints its exact face, preserves inheritance/history and cold entry", async () => {
  const repo = fileURLToPath(new URL("../../../../", import.meta.url)),
    evidence = join(repo, ".artifacts", "project-fonts", randomUUID()),
    root = join(evidence, "sidecar"),
    manager = await serve(managerEndpoint(root), { root }),
    factory = manager.factory({ channel: channel("dev"), namespace: namespace("fonts") });
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
      identity: { service: "daemon", generation: digest("project-font-browser") },
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
      session = await client.execute("session_create", { requestId: randomUUID(), title: "Font", mode: "motion" }),
      artifact = await client.execute("artifact_create", {
        requestId: randomUUID(),
        sessionId: session.id,
        title: "Typography",
        files: [
          {
            path: "index.html",
            content:
              '<html><head></head><body><main data-composition-id="main" data-width="640" data-height="360" data-duration="1"><p id="title" data-hf-id="title" data-start="0" data-duration="1" style="font-size:36px;font-family:serif">Imported typography</p></main><script>window.fontAtBuild=document.fonts.check("36px "+getComputedStyle(document.getElementById("title")).fontFamily);window.__timelines={main:gsap.timeline({paused:true}).to("#title",{opacity:1,duration:1})};</script></body></html>',
          },
        ],
      }),
      owner = { sessionId: session.id, artifactId: artifact.id };
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
      };
    await page.goto(web.endpoint.url);
    await ready();
    await page.getByRole("tab", { name: "媒体", exact: true }).click();
    const data = JSON.parse(await readFile(join(repo, "packages/templates/src/native/fonts.json"), "utf8"))
        .faces[0] as { data: string },
      bytes = Buffer.from(data.data, "base64"),
      ids: string[] = [];
    let lose = true;
    await page.route("**/api/resource_import", async (route) => {
      ids.push(route.request().postDataJSON().requestId);
      if (!route.request().postDataJSON().uploadId) {
        await route.continue();
        return;
      }
      if (lose) {
        lose = false;
        const response = await route.fetch();
        report.importStatus = response.status();
        if (response.ok()) await route.abort("failed");
        else {
          report.importError = await response.text();
          await route.fulfill({ response });
        }
      } else await route.continue();
    });
    await page
      .getByLabel("导入媒体", { exact: true })
      .setInputFiles({ name: "Inter.woff2", mimeType: "font/woff2", buffer: bytes });
    await page.getByRole("button", { name: "重试", exact: true }).waitFor();
    await expect.poll(() => page.getByRole("button", { name: "重试", exact: true }).isEnabled()).toBe(true);
    const committed = await client.execute("project_read", owner);
    expect(report.importStatus, String(report.importError)).toBe(200);
    expect(committed.resources).toHaveLength(1);
    expect(committed.files[0]!.content).not.toContain("OpenMotionFont_");
    await click("重试");
    await page.unroute("**/api/resource_import");
    expect(ids).toHaveLength(3);
    expect(new Set(ids).size).toBe(1);
    expect(ids[0]).toBe(ids[1]);
    const face = committed.resources[0]!,
      family = resourceFontFamily(face.digest);
    await page.getByLabel("图层选择", { exact: true }).selectOption("title");
    await page.getByLabel("字体", { exact: true }).selectOption(family);
    await click("应用更改");
    const selected = await client.execute("project_read", owner);
    expect(selected.files[0]!.content).toContain(family);
    expect(selected.files[0]!.content).not.toContain("@font-face");
    const loaded = async () => {
      await page.getByLabel("预览状态", { exact: true }).filter({ hasText: "预览就绪" }).waitFor();
      const frame = page.frameLocator("iframe:not([hidden])");
      await expect
        .poll(() =>
          frame.locator("body").evaluate(async (_body, family) => {
            await document.fonts.ready;
            return [...document.fonts].some(
              (face) => face.family.replaceAll('"', "") === family && face.status === "loaded",
            );
          }, family),
        )
        .toBe(true);
      return frame.locator('[data-hf-id="title"]').evaluate((node) => ({
        family: getComputedStyle(node).fontFamily,
        text: node.textContent,
        fontAtBuild: Reflect.get(window, "fontAtBuild"),
      }));
    };
    report.first = await loaded();
    expect((report.first as { fontAtBuild: boolean }).fontAtBuild).toBe(true);
    await driver.capture("font-selected");
    await click("撤销");
    expect((await client.execute("project_read", owner)).files[0]!.content).not.toContain(family);
    await click("重做");
    report.redo = await loaded();
    await page.getByLabel("图层选择", { exact: true }).selectOption("title");
    await page.getByLabel("字体", { exact: true }).selectOption("");
    await click("应用更改");
    expect((await client.execute("project_read", owner)).files[0]!.content).not.toContain(family);
    await click("撤销");
    await loaded();
    await page.reload();
    await ready();
    report.reload = await loaded();
    const confirmed = await page.locator("iframe:not([hidden])").elementHandle();
    await page.route("**/preview/**/assets/*.woff2", (route) =>
      route.fulfill({ contentType: "font/woff2", body: "invalid font payload" }),
    );
    await page.getByLabel("图层选择", { exact: true }).selectOption("title");
    await page.getByLabel("字号", { exact: true }).fill("37");
    await click("应用更改");
    await page.getByLabel("预览状态", { exact: true }).filter({ hasText: "工程字体加载失败" }).waitFor();
    expect(
      await page.locator("iframe:not([hidden])").evaluate((current, previous) => current === previous, confirmed),
    ).toBe(true);
    await driver.capture("font-load-failure-retains-confirmed-frame");
    await page.unroute("**/preview/**/assets/*.woff2");
    await click("打开预览");
    await loaded();
    await page.getByRole("tab", { name: "媒体", exact: true }).click();
    await click("移除资源 Inter.woff2");
    await page.getByLabel("预览状态", { exact: true }).filter({ hasText: "missing project font" }).waitFor();
    expect(await page.locator("iframe:not([hidden])").isVisible()).toBe(true);
    const retained = await client.readResource({ ...owner, revision: selected.revision, path: face.path });
    expect(Buffer.from(await retained.data.arrayBuffer()).toString("base64")).toBe(data.data);
    await driver.capture("missing-font-retains-confirmed-frame");
    await click("撤销");
    report.restored = await loaded();
    report.sameImportReceipt = ids[0] === ids[1];
    report.family = family;
    report.font = face;
    report.metadata = await client.execute("project_read", owner);
    expect(driver.errors).toEqual([]);
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

it("edits multiline text and visible text styles through unknown saves, inheritance, history and reopening", async () => {
  const repo = fileURLToPath(new URL("../../../../", import.meta.url)),
    evidence = join(repo, ".artifacts", "text-editing", randomUUID()),
    root = join(evidence, "sidecar"),
    manager = await serve(managerEndpoint(root), { root }),
    factory = manager.factory({ channel: channel("dev"), namespace: namespace("text") });
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
      identity: { service: "daemon", generation: digest("project-text-browser") },
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
      session = await client.execute("session_create", { requestId: randomUUID(), title: "Text", mode: "motion" }),
      original =
        '<html><body><main data-hf-id="root" data-composition-id="main" data-width="640" data-height="360" data-duration="2" style="direction:rtl;text-align:end;font-size:28px"><p id="title" data-hf-id="title" data-start="0" data-duration="2" style="white-space:pre-wrap;width:240px;font-weight:600;font-style:italic;line-height:1.4;letter-spacing:2px">Original</p></main><script>window.__timelines={main:gsap.timeline({paused:true}).to({},{duration:2})};</script></body></html>',
      artifact = await client.execute("artifact_create", {
        requestId: randomUUID(),
        sessionId: session.id,
        title: "Text styling",
        files: [{ path: "index.html", content: original }],
      }),
      owner = { sessionId: session.id, artifactId: artifact.id };
    await client.execute("artifact_open", {
      ...owner,
      requestId: randomUUID(),
      expectedSelection: 0,
      expectedCurrent: null,
    });
    driver = await browser({ evidence, viewport: { width: 1600, height: 1000 } });
    const page = driver.page,
      ready = () =>
        page
          .locator("[aria-live]")
          .filter({ hasText: /^就绪$/ })
          .waitFor(),
      click = async (name: string) => {
        await page.getByRole("button", { name, exact: true }).click();
        await ready();
      },
      read = () => client.execute("project_read", owner),
      editable = () =>
        page.waitForFunction(() => !document.querySelector<HTMLTextAreaElement>('[aria-label="文本内容"]')?.readOnly),
      facts = async () => {
        await page.getByLabel("预览状态", { exact: true }).filter({ hasText: "预览就绪" }).waitFor();
        return page
          .frameLocator("iframe:not([hidden])")
          .locator("#title")
          .evaluate((node) => {
            const s = getComputedStyle(node);
            return {
              text: (node as HTMLElement).innerText,
              align: s.textAlign,
              decoration: s.textDecorationLine,
              weight: s.fontWeight,
              slant: s.fontStyle,
              spacing: s.letterSpacing,
              whiteSpace: s.whiteSpace,
            };
          });
      };
    await page.goto(web.endpoint.url);
    await ready();
    await page.getByLabel("图层选择", { exact: true }).selectOption("title");
    await ready();
    await editable();
    expect(await facts()).toMatchObject({
      text: "Original",
      align: "end",
      decoration: "none",
      weight: "600",
      slant: "italic",
      spacing: "2px",
      whiteSpace: "pre-wrap",
    });
    const multiline = "First <line>\nSecond & line",
      ids: string[] = [];
    let lose = true,
      patches = 0;
    await page.route("**/motion/patch", async (route) => {
      patches++;
      await route.continue();
    });
    await page.route("**/api/project_save", async (route) => {
      ids.push(route.request().postDataJSON().requestId);
      if (lose) {
        lose = false;
        const response = await route.fetch();
        expect(response.status()).toBe(200);
        await route.abort("failed");
      } else await route.continue();
    });
    const field = page.getByLabel("文本内容", { exact: true }),
      initialField = await field.elementHandle();
    await field.fill(multiline);
    await page.getByLabel("文本对齐", { exact: true }).selectOption("center");
    await page.getByLabel("文本装饰", { exact: true }).selectOption("underline");
    const oldFrame = await page.locator("iframe:not([hidden])").elementHandle();
    await page.getByRole("button", { name: "应用更改", exact: true }).click();
    await expect.poll(() => page.getByRole("button", { name: "重试", exact: true }).isEnabled()).toBe(true);
    const committed = await read();
    expect(committed.files[0]?.content).toContain("First &lt;line&gt;<br>Second &amp; line");
    expect(await page.locator("iframe:not([hidden])").evaluate((node, old) => node === old, oldFrame)).toBe(true);
    await click("重试");
    await editable();
    expect(ids).toHaveLength(2);
    expect(ids[0]).toBe(ids[1]);
    expect(patches).toBe(1);
    await page.unroute("**/api/project_save");
    await page.unroute("**/motion/patch");
    expect(await field.evaluate((node, old) => node === old, initialField)).toBe(true);
    expect(await facts()).toMatchObject({
      text: multiline,
      align: "center",
      decoration: "underline",
      weight: "600",
      slant: "italic",
      spacing: "2px",
      whiteSpace: "pre-wrap",
    });
    await driver.capture("multiline-text-styled");
    await click("撤销");
    expect((await read()).files[0]?.content).toBe(original);
    expect(await facts()).toMatchObject({ text: "Original", align: "end", decoration: "none" });
    await click("重做");
    await editable();
    expect(await facts()).toMatchObject({ text: multiline, align: "center", decoration: "underline" });
    await page.getByLabel("文本对齐", { exact: true }).selectOption("");
    await page.getByLabel("文本装饰", { exact: true }).selectOption("");
    await click("应用更改");
    await editable();
    const reset = await read();
    expect(reset.files[0]?.content).toContain("text-align:end");
    expect(reset.files[0]?.content).not.toContain("text-decoration-line");
    expect(await facts()).toMatchObject({
      text: multiline,
      align: "end",
      decoration: "none",
      weight: "600",
      slant: "italic",
      spacing: "2px",
      whiteSpace: "pre-wrap",
    });
    await page.getByLabel("图层选择", { exact: true }).selectOption("root");
    await ready();
    expect(await page.getByLabel("文本对齐", { exact: true }).isVisible()).toBe(false);
    expect(await page.getByLabel("文本对齐", { exact: true }).isDisabled()).toBe(true);
    expect(await read()).toEqual(reset);
    await page.reload();
    await ready();
    expect(await read()).toEqual(reset);
    expect(await facts()).toMatchObject({ text: multiline, align: "end", decoration: "none" });
    await driver.capture("reopened-text-inheritance");
    expect(driver.errors).toEqual([]);
    Object.assign(report, {
      multiline: true,
      sameSaveReceipt: ids[0] === ids[1],
      nativePatches: patches,
      history: reset.history,
      inheritanceReset: true,
      untouchedTypography: true,
      stableTextField: true,
      reload: true,
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
