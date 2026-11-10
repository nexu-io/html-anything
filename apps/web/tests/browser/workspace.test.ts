// @vitest-environment node
import { randomUUID } from "node:crypto";
import { access, mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { browser } from "@odsuite/automation";
import { channel, digest, namespace } from "@odsuite/protocol";
import { source } from "@odsuite/serve";
import { serve as manage, managerEndpoint, observeProcesses, readDirectory } from "@odsuite/sidecar";
import { serve as daemonServe } from "@open-motion/daemon";
import { chromium } from "playwright";
import { afterAll, afterEach, beforeAll, expect, it } from "vitest";
import type { Config } from "@";

const repo = fileURLToPath(new URL("../../../../", import.meta.url)),
  evidence = join(repo, ".artifacts", "workspace-parity", randomUUID()),
  root = join(evidence, "sidecar"),
  report: Record<string, unknown> = { reference: "03d6df8615a2cb87727241406b9671c184ff497a" };
let manager: Awaited<ReturnType<typeof manage>>,
  driver: Awaited<ReturnType<typeof browser>>,
  url = "";
const ready = async () => {
  await driver.page
    .locator("[aria-live]")
    .filter({ hasText: /^就绪$/ })
    .waitFor();
};
async function click(name: string) {
  await driver.page.getByRole("button", { name, exact: true }).click();
  await ready();
}
async function seek(time: number) {
  const page = driver.page,
    frame = page.frameLocator("iframe:not([hidden])");
  await expect.poll(() => page.locator("iframe:not([hidden])").isVisible()).toBe(true);
  await page.getByLabel("定位秒", { exact: true }).fill(String(time));
  await click("定位");
  await expect
    .poll(() => frame.locator("body").evaluate(() => Reflect.get(window, "__timelines").main.time()))
    .toBeCloseTo(time, 2);
  await frame.locator("body").evaluate(async () => {
    await document.fonts.ready;
    await new Promise<void>((done) => requestAnimationFrame(() => requestAnimationFrame(() => done())));
  });
}
async function start() {
  manager = await manage(managerEndpoint(root), { root });
  const factory = manager.factory({ channel: channel("dev"), namespace: namespace("workspace") });
  let bootstrap: Config | undefined,
    daemon: Awaited<ReturnType<typeof daemonServe>> | undefined,
    capability: Awaited<ReturnType<typeof factory.issue>> | undefined;
  const web = await source(factory, {
    name: "web",
    directory: fileURLToPath(new URL("../../dist/", import.meta.url)),
    documents: {
      "/bootstrap.json": () => {
        if (!bootstrap) throw Error("fixture not ready");
        return { type: "application/json", body: JSON.stringify(bootstrap) };
      },
    },
  });
  url = web.endpoint.url;
  await factory.expose({
    identity: { service: "daemon", generation: digest("workspace-parity") },
    handlers: {},
    lifecycle: {
      initialize: async (context) => {
        const socket = await context.allocate({ kind: "socket", name: "daemon" }),
          port = await context.allocate({ kind: "port", name: "daemon", scheme: "http" });
        capability = await factory.issue({ owner: `n${context.incarnation.replaceAll("-", "")}`, service: "daemon" });
        daemon = await daemonServe({
          data: context.roots.data,
          origin: url,
          socket: socket.value,
          token: capability.token,
        });
        await context.forward(port.value, socket.value);
        bootstrap = {
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
      stop: async () => {
        await daemon?.close();
        if (capability) await factory.retire(capability);
      },
    },
  });
}
beforeAll(async () => {
  await mkdir(evidence, { recursive: true });
  await start();
  driver = await browser({ evidence, viewport: { width: 1600, height: 1000 } });
  driver.page.setDefaultTimeout(8000);
  await access(chromium.executablePath());
  expect(chromium.executablePath().startsWith(join(repo, "node_modules"))).toBe(true);
  report.browser = {
    version: driver.page.context().browser()?.version(),
    installedExecutable: chromium.executablePath(),
    viewport: driver.page.viewportSize(),
    reducedMotion: "reduce",
    deviceScaleFactor: 1,
    locale: "zh-CN",
  };
}, 30000);
afterAll(async () => {
  try {
    await driver?.close();
  } finally {
    await manager?.close();
  }
  if (manager) {
    expect((await readDirectory(root)).manager.phase).toBe("closed");
    expect(await observeProcesses(root)).toEqual([]);
  }
  report.closed = true;
  report.processes = await observeProcesses(root);
  report.errors = driver?.errors ?? [];
  await writeFile(join(evidence, "report.json"), JSON.stringify(report, null, 2));
}, 30000);

afterEach(async (context) => {
  if (context.task.result?.state === "fail" && driver) {
    await driver.capture("failure");
    await writeFile(
      join(evidence, "failure.txt"),
      context.task.result.errors?.map((error) => error.message).join("\n") ?? "failed",
    );
  }
});

it("keeps project handoff and navigation explicit across workspace views", async () => {
  const page = driver.page;
  await page.goto(url);
  await ready();
  await page.getByText("会话选项", { exact: true }).click();
  await page.getByLabel("会话标题", { exact: true }).fill("Brand launch");
  await click("创建会话");
  await page.getByLabel("工程标题", { exact: true }).fill("Separate empty-project idea");
  await page.getByText("从模板创建", { exact: true }).click();
  await page.getByLabel("模板", { exact: true }).selectOption("product-promo");
  await page.getByLabel("模板工程标题", { exact: true }).fill("Product Promo");
  await click("创建模板工程");
  await page.getByLabel("预览状态", { exact: true }).filter({ hasText: "预览就绪" }).waitFor();
  await seek(6);
  await driver.capture("workspace-expanded");
  report.selection = await page.locator("[data-artifact-id]").first().getAttribute("data-artifact-id");
  expect(report.selection).toBeTruthy();
  const expanded = await page.getByRole("region", { name: "编辑工作区", exact: true }).boundingBox();
  const original = String(report.selection);
  const note = page.getByLabel("消息", { exact: true });
  await note.fill("Preserve this creative note");
  await note.evaluate((node) => node.setAttribute("data-retained", "note"));
  await click("源码");
  const code = page.getByRole("textbox", { name: "index.html", exact: true });
  expect(await code.isVisible()).toBe(true);
  expect(await page.locator("iframe").isVisible()).toBe(false);
  const edited = `${await code.inputValue()}\n<!-- Workspace handoff confirmed -->`;
  await code.fill(edited);
  await code.evaluate((node) => {
    node.setAttribute("data-retained", "source");
    (node as HTMLTextAreaElement).setSelectionRange(7, 19);
  });
  const writes: string[] = [];
  page.on("request", (request) => {
    const operation = new URL(request.url()).pathname.split("/api/")[1];
    if (
      operation &&
      !operation.endsWith("_read") &&
      !operation.endsWith("_get") &&
      !operation.endsWith("_list") &&
      operation !== "workspace_state"
    )
      writes.push(operation);
  });
  await page.getByRole("button", { name: "隐藏工作区导航", exact: true }).click();
  await page.getByRole("button", { name: "隐藏会话", exact: true }).click();
  expect(await page.getByRole("button", { name: "显示工作区导航", exact: true }).getAttribute("aria-expanded")).toBe(
    "false",
  );
  expect(await page.getByRole("button", { name: "显示会话", exact: true }).getAttribute("aria-expanded")).toBe("false");
  expect(
    await page
      .getByRole("button", { name: "显示会话", exact: true })
      .evaluate((node) => document.activeElement === node),
  ).toBe(true);
  expect(await note.inputValue()).toBe("Preserve this creative note");
  expect(await note.getAttribute("data-retained")).toBe("note");
  expect(await code.inputValue()).toBe(edited);
  expect(await code.getAttribute("data-retained")).toBe("source");
  expect(await code.evaluate((node) => (node as HTMLTextAreaElement).selectionStart)).toBe(7);
  expect(await page.locator("#app").getAttribute("data-artifact-id")).toBe(original);
  expect(await page.getByLabel("保存状态", { exact: true }).textContent()).toBe("未保存");
  expect(writes).toEqual([]);
  const focused = await page.getByRole("region", { name: "编辑工作区", exact: true }).boundingBox();
  if (!focused || !expanded) throw Error("workspace geometry is missing");
  expect(focused.width - expanded.width).toBeGreaterThan(500);
  await click("预览");
  expect(await code.isVisible()).toBe(false);
  expect(await page.locator("iframe").isVisible()).toBe(true);
  expect(await page.getByRole("button", { name: "预览", exact: true }).getAttribute("aria-pressed")).toBe("true");
  expect(await page.getByRole("button", { name: "源码", exact: true }).getAttribute("aria-pressed")).toBe("false");
  await driver.capture("workspace-focused");
  report.widths = { expanded: expanded?.width, focused: focused?.width };
  await page.getByRole("button", { name: "显示工作区导航", exact: true }).click();
  await page.getByRole("button", { name: "新建工程", exact: true }).click();
  expect(await page.getByRole("button", { name: "隐藏会话", exact: true }).getAttribute("aria-expanded")).toBe("true");
  expect(await page.getByLabel("工程标题", { exact: true }).evaluate((node) => document.activeElement === node)).toBe(
    true,
  );
  expect(await note.inputValue()).toBe("Preserve this creative note");
  expect(await page.getByLabel("工程标题", { exact: true }).inputValue()).toBe("Separate empty-project idea");
  await page.getByLabel("工程标题", { exact: true }).fill("Second project");
  let lose = true;
  const saveIds: string[] = [];
  await page.route("**/api/project_save", async (route) => {
    saveIds.push(route.request().postDataJSON().requestId);
    if (!lose) return route.continue();
    lose = false;
    await route.fetch();
    await route.abort("failed");
  });
  await page.getByRole("button", { name: "创建工程", exact: true }).click();
  await page.getByRole("button", { name: "重试", exact: true }).waitFor();
  expect(await page.locator("#app").getAttribute("data-artifact-id")).toBe(original);
  const acceptedWrites = writes.length;
  await page.getByRole("button", { name: "隐藏会话", exact: true }).click();
  await page.getByRole("button", { name: "显示会话", exact: true }).click();
  expect(writes).toHaveLength(acceptedWrites);
  expect(await note.getAttribute("data-retained")).toBe("note");
  await click("重试");
  expect(saveIds).toHaveLength(2);
  expect(saveIds[0]).toBe(saveIds[1]);
  await page.unroute("**/api/project_save");
  const second = await page.locator("#app").getAttribute("data-artifact-id");
  expect(second).not.toBe(original);
  const card = (name: string) =>
    page.getByRole("complementary", { name: "会话", exact: true }).getByRole("button", { name, exact: true });
  expect(await card("Second project").getAttribute("aria-current")).toBe("true");
  expect(await card("Product Promo").getAttribute("aria-current")).toBeNull();
  await card("Product Promo").click();
  await ready();
  expect(await card("Product Promo").getAttribute("aria-current")).toBe("true");
  await click("源码");
  expect(await code.inputValue()).toBe(edited);
  await page.getByLabel("会话标题", { exact: true }).fill("Another session");
  await click("创建会话");
  const sessions = page.getByRole("navigation", { name: "会话", exact: true });
  const another = sessions.getByRole("button", { name: "Another session", exact: true });
  await another.focus();
  await page.keyboard.press("End");
  expect(
    await sessions
      .getByRole("button")
      .last()
      .evaluate((node) => document.activeElement === node),
  ).toBe(true);
  expect(await another.getAttribute("aria-current")).toBe("true");
  await sessions.getByRole("button", { name: "Brand launch", exact: true }).focus();
  await page.keyboard.press("Enter");
  await ready();
  expect(await page.locator("#app").getAttribute("data-artifact-id")).toBe(original);
  expect(await note.inputValue()).toBe("Preserve this creative note");
  await page.getByLabel("搜索会话", { exact: true }).fill("Missing session");
  expect(await sessions.textContent()).toContain("没有匹配的会话");
  await page.getByLabel("搜索会话", { exact: true }).fill("");
  expect(await sessions.getByRole("button").count()).toBe(2);
  await click("预览");
  await page.getByLabel("预览状态", { exact: true }).filter({ hasText: "预览就绪" }).waitFor();
  await seek(6);
  await driver.capture("workspace-handoff");
  await page.setViewportSize({ width: 960, height: 900 });
  await page.getByRole("button", { name: "隐藏工作区导航", exact: true }).click();
  await page.getByRole("button", { name: "隐藏会话", exact: true }).click();
  expect(
    await page
      .getByRole("region", { name: "编辑工作区", exact: true })
      .evaluate((node) => node.getBoundingClientRect().width),
  ).toBe(960);
  await driver.capture("workspace-narrow");
  await manager.close();
  expect((await readDirectory(root)).manager.phase).toBe("closed");
  expect(await observeProcesses(root)).toEqual([]);
  await start();
  await page.setViewportSize({ width: 1600, height: 1000 });
  await page.goto(url);
  await ready();
  expect(await page.locator("#app").getAttribute("data-artifact-id")).toBe(original);
  expect(await card("Product Promo").getAttribute("aria-current")).toBe("true");
  await click("源码");
  expect(await code.inputValue()).toBe(edited);
  await click("预览");
  await page.getByLabel("预览状态", { exact: true }).filter({ hasText: "预览就绪" }).waitFor();
  await seek(6);
  await page.getByRole("button", { name: "隐藏工作区导航", exact: true }).click();
  await page.getByRole("button", { name: "隐藏会话", exact: true }).click();
  await driver.capture("workspace-restored");
  report.handoff = { original, second, retrySameRequest: saveIds[0] === saveIds[1], restored: true };
  expect(driver.errors).toEqual([]);
}, 90000);
