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
const stages: { name: string; elapsed: number }[] = [],
  began = Date.now();
async function stage(name: string) {
  report.stage = name;
  stages.push({ name, elapsed: Date.now() - began });
  report.stages = stages;
  console.info(`[workspace] ${name}`);
  await writeFile(join(evidence, "progress.json"), JSON.stringify(report, null, 2));
}
const ready = async () => {
  await driver.page
    .locator("[aria-live]")
    .filter({ hasText: /^就绪$/ })
    .waitFor();
};
async function click(name: string) {
  await stage(`click ${name}`);
  await driver.page.getByRole("button", { name, exact: true }).click();
  await ready();
  await stage(`ready after ${name}`);
}
async function seek(time: number) {
  await stage(`seek ${time}`);
  const page = driver.page,
    frame = page.frameLocator("iframe:not([hidden])");
  await expect.poll(() => page.locator("iframe:not([hidden])").isVisible()).toBe(true);
  await page.getByLabel("定位秒", { exact: true }).fill(String(time));
  await click("定位");
  await expect
    .poll(() => frame.locator("body").evaluate(() => Reflect.get(window, "__timelines").main.time()))
    .toBeCloseTo(time, 2);
  await expect.poll(() => frame.locator("body").evaluate(() => document.fonts.status)).toBe("loaded");
  await expect
    .poll(() => frame.locator("body").evaluate(() => Reflect.get(window, "__timelines").main.time()))
    .toBeCloseTo(time, 2);
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
      quiesce: async () => daemon?.quiesce(),
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
  const failures: unknown[] = [];
  try {
    await driver?.page.unrouteAll({ behavior: "wait" });
  } catch (error) {
    failures.push(error);
  }
  try {
    await driver?.close();
  } catch (error) {
    failures.push(error);
  }
  try {
    await manager?.close();
  } catch (error) {
    failures.push(error);
  }
  try {
    report.phase = (await readDirectory(root)).manager.phase;
    report.processes = await observeProcesses(root);
  } catch (error) {
    failures.push(error);
  }
  report.closed = report.phase === "closed";
  report.errors = driver?.errors ?? [];
  report.cleanupErrors = failures.map(String);
  await writeFile(join(evidence, "report.json"), JSON.stringify(report, null, 2));
  expect(failures).toEqual([]);
  expect(report.phase).toBe("closed");
  expect(report.processes).toEqual([]);
}, 30000);

afterEach(async (context) => {
  if (context.task.result?.state === "fail" && driver) {
    await writeFile(
      join(evidence, "failure.txt"),
      context.task.result.errors?.map((error) => error.message).join("\n") ?? "failed",
    );
    try {
      await driver.capture("failure");
    } catch (error) {
      report.captureFailure = String(error);
      await writeFile(join(evidence, "progress.json"), JSON.stringify(report, null, 2));
    }
  }
});

it("keeps project handoff and navigation explicit across workspace views", async () => {
  const page = driver.page;
  await stage("open workspace");
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
  await stage("capture workspace-expanded");
  await driver.capture("workspace-expanded");
  await stage("captured workspace-expanded");
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
  await stage("capture workspace-focused");
  await driver.capture("workspace-focused");
  await stage("captured workspace-focused");
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
  let accepted = false,
    saveFailure: string | undefined;
  await page.route("**/api/project_save", async (route) => {
    saveIds.push(route.request().postDataJSON().requestId);
    if (!lose) return route.continue();
    lose = false;
    try {
      const response = await route.fetch();
      report.saveStatus = response.status();
      if (!response.ok()) throw Error("save response was unsuccessful");
      accepted = true;
      await route.abort("failed");
    } catch (error) {
      saveFailure = error instanceof Error ? error.name : "unknown";
      report.saveFailure = saveFailure;
      await route.abort("failed").catch(() => undefined);
    }
  });
  await stage("unknown save receipt");
  await page.getByRole("button", { name: "创建工程", exact: true }).click();
  const retry = page.getByRole("button", { name: "重试", exact: true });
  await expect.poll(() => accepted || Boolean(saveFailure)).toBe(true);
  expect(saveFailure).toBeUndefined();
  expect(accepted).toBe(true);
  await expect.poll(() => retry.isEnabled()).toBe(true);
  expect(await page.locator("#app").getAttribute("data-artifact-id")).toBe(original);
  const acceptedWrites = writes.length;
  await page.getByRole("button", { name: "隐藏会话", exact: true }).click();
  await page.getByRole("button", { name: "显示会话", exact: true }).click();
  expect(writes).toHaveLength(acceptedWrites);
  expect(await note.getAttribute("data-retained")).toBe("note");
  await stage("retry same save receipt");
  await click("重试");
  await stage("save receipt replayed");
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
  await stage("capture workspace-handoff");
  await driver.capture("workspace-handoff");
  await stage("captured workspace-handoff");
  await page.setViewportSize({ width: 960, height: 900 });
  await page.getByRole("button", { name: "隐藏工作区导航", exact: true }).click();
  await page.getByRole("button", { name: "隐藏会话", exact: true }).click();
  expect(
    await page
      .getByRole("region", { name: "编辑工作区", exact: true })
      .evaluate((node) => node.getBoundingClientRect().width),
  ).toBe(960);
  await stage("capture workspace-narrow");
  await driver.capture("workspace-narrow");
  await stage("captured workspace-narrow");
  await stage("close before cold reopen");
  await manager.close();
  await stage("closed before cold reopen");
  expect((await readDirectory(root)).manager.phase).toBe("closed");
  expect(await observeProcesses(root)).toEqual([]);
  await stage("start cold reopen");
  await start();
  await stage("started cold reopen");
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
  await stage("capture workspace-restored");
  await driver.capture("workspace-restored");
  await stage("captured workspace-restored");
  report.handoff = { original, second, retrySameRequest: saveIds[0] === saveIds[1], restored: true };
  expect(driver.errors).toEqual([]);
}, 90000);

it("creates, edits, copies, renames and removes source files through persistent history and repairs broken references", async () => {
  const page = driver.page;
  await page.goto(url);
  await ready();
  await page.getByText("会话选项", { exact: true }).click();
  await page.getByLabel("会话标题", { exact: true }).fill("Source file lifecycle");
  await click("创建会话");
  await page.getByRole("button", { name: "新建工程", exact: true }).click();
  await page.getByLabel("工程标题", { exact: true }).fill("Editable files");
  await click("创建工程");
  await page.getByRole("tab", { name: "文件", exact: true }).click();
  const path = page.getByLabel("源文件路径", { exact: true }),
    select = page.getByLabel("管理源文件", { exact: true }),
    panel = page.getByLabel("工程源文件", { exact: true });
  const add = async (value: string) => {
    await path.fill(value);
    await click("新建源文件");
  };
  await add("scenes/card.html");
  const content =
    '<main data-composition-id="card" data-width="160" data-height="90" data-duration="1"><p>Editable child</p></main>';
  await page.getByRole("textbox", { name: "scenes/card.html", exact: true }).fill(content);
  await click("保存");
  await expect.poll(() => select.inputValue()).toBe("scenes/card.html");
  await path.fill("copy.html");
  await click("复制源文件");
  await expect.poll(() => page.getByRole("textbox", { name: "copy.html", exact: true }).inputValue()).toBe(content);
  const ids: string[] = [];
  let lose = true;
  await page.route("**/api/project_save", async (route) => {
    ids.push(route.request().postDataJSON().requestId);
    if (!lose) return route.continue();
    lose = false;
    await route.fetch();
    await route.abort("failed");
  });
  await path.fill("parts/renamed.html");
  await page.getByRole("button", { name: "重命名源文件", exact: true }).click();
  await expect.poll(() => page.getByRole("button", { name: "重试", exact: true }).isEnabled()).toBe(true);
  await expect.poll(() => path.isEnabled()).toBe(false);
  await click("重试");
  await page.unrouteAll({ behavior: "wait" });
  expect(ids).toHaveLength(2);
  expect(ids[0]).toBe(ids[1]);
  await expect.poll(() => select.inputValue()).toBe("parts/renamed.html");
  await expect
    .poll(() => page.getByRole("textbox", { name: "parts/renamed.html", exact: true }).inputValue())
    .toBe(content);
  await click("撤销");
  await expect.poll(() => panel.getByRole("button", { name: "copy.html", exact: true }).count()).toBe(1);
  await click("重做");
  await expect.poll(() => panel.getByRole("button", { name: "copy.html", exact: true }).count()).toBe(0);
  await click("index.html");
  const root = page.getByRole("textbox", { name: "index.html", exact: true }),
    original = await root.inputValue();
  await root.fill(
    original.replace(
      "</main>",
      '<div data-hf-id="file-card" data-composition-id="card" data-composition-src="parts/renamed.html" data-start="0" data-duration="1"></div></main>',
    ),
  );
  await click("保存");
  await page.getByLabel("预览状态", { exact: true }).filter({ hasText: "预览就绪" }).waitFor();
  await select.selectOption("parts/renamed.html");
  await path.fill("parts/final.html");
  await click("重命名源文件");
  await expect.poll(() => page.getByLabel("预览状态", { exact: true }).textContent()).not.toBe("预览就绪");
  await expect.poll(() => select.isEnabled()).toBe(true);
  await expect.poll(() => panel.getByRole("button", { name: "index.html", exact: true }).isEnabled()).toBe(true);
  await click("index.html");
  await expect.poll(() => page.getByRole("button", { name: "删除源文件", exact: true }).isEnabled()).toBe(false);
  expect(await root.inputValue()).toContain("parts/renamed.html");
  await root.fill((await root.inputValue()).replace("parts/renamed.html", "parts/final.html"));
  await click("保存");
  await page.getByLabel("预览状态", { exact: true }).filter({ hasText: "预览就绪" }).waitFor();
  await select.selectOption("scenes/card.html");
  await expect.poll(() => page.getByRole("button", { name: "删除源文件", exact: true }).isEnabled()).toBe(false);
  await page.getByLabel("确认删除源文件", { exact: true }).check();
  await click("删除源文件");
  await expect.poll(() => panel.getByRole("button", { name: "scenes/card.html", exact: true }).count()).toBe(0);
  await click("撤销");
  await expect.poll(() => panel.getByRole("button", { name: "scenes/card.html", exact: true }).count()).toBe(1);
  await click("重做");
  await expect.poll(() => panel.getByRole("button", { name: "scenes/card.html", exact: true }).count()).toBe(0);
  await page.reload();
  await ready();
  await page.getByRole("tab", { name: "文件", exact: true }).click();
  await expect.poll(() => panel.getByRole("button", { name: "parts/final.html", exact: true }).count()).toBe(1);
  await expect.poll(() => panel.getByRole("button", { name: "scenes/card.html", exact: true }).count()).toBe(0);
  await click("parts/final.html");
  await expect
    .poll(() => page.getByRole("textbox", { name: "parts/final.html", exact: true }).inputValue())
    .toBe(content);
  expect(driver.errors).toEqual([]);
  expect(await page.locator("style,[style]").count()).toBe(0);
  await driver.capture("source-file-lifecycle");
  report.sourceFiles = {
    reference: "eabdaa06dd1f27ca96cd8c4450a4d984f06fc316",
    retryIds: ids,
    retained: "parts/final.html",
    removed: "scenes/card.html",
  };
}, 60000);
