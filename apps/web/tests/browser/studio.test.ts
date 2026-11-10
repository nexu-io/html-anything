// @vitest-environment node
import { randomUUID } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { browser, imageDifference } from "@odsuite/automation";
import { channel, digest, namespace } from "@odsuite/protocol";
import { source } from "@odsuite/serve";
import { serve as manage, managerEndpoint, observeProcesses, readDirectory } from "@odsuite/sidecar";
import { serve as daemonServe } from "@open-motion/daemon";
import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";
import type { Config } from "@";

const repo = fileURLToPath(new URL("../../../../", import.meta.url)),
  evidence = join(repo, ".artifacts", "browser", randomUUID()),
  root = join(evidence, "sidecar");
let manager: Awaited<ReturnType<typeof manage>>,
  driver: Awaited<ReturnType<typeof browser>>,
  url = "";
const report: Record<string, unknown> = {
  reference: "21c3e5aaef1af34b0f126f7db90a86927e2ef325",
  evidence,
  cases: [],
  mode: "Real sidecar-hosted Daemon/SQLite and built Web; separate standalone/Electron carrier qualification remains independent",
};
const ready = async () => {
  await driver.page
    .locator("[aria-live]")
    .filter({ hasText: /^就绪$/ })
    .waitFor();
};
const click = async (name: string) => {
  await driver.page.getByRole("button", { name, exact: true }).click();
  await ready();
};
async function scene(name: string) {
  const page = driver.page;
  await page.goto(url);
  await ready();
  await page.getByText("会话选项", { exact: true }).click();
  await page.getByLabel("会话标题", { exact: true }).fill(name);
  await click("创建会话");
  await page.getByLabel("工程标题", { exact: true }).fill(name);
  await click("创建工程");
  await click("添加文本");
  await page.getByLabel("文本内容", { exact: true }).fill("Motion baseline");
  await click("应用更改");
  await page.getByLabel("预览状态", { exact: true }).filter({ hasText: "预览就绪" }).waitFor();
  await page.waitForFunction(() => {
    const text = document.querySelector<HTMLInputElement>('[aria-label="文本内容"]');
    return text?.value === "Motion baseline" && !text.readOnly && !text.disabled;
  });
}
async function selected() {
  await driver.page.getByRole("treeitem", { name: "Motion baseline", exact: true }).click();
  await ready();
}

beforeAll(async () => {
  await mkdir(evidence, { recursive: true });
  manager = await manage(managerEndpoint(root), { root });
  const factory = manager.factory({ channel: channel("dev"), namespace: namespace("browser") });
  let bootstrap: Config | undefined,
    daemon: Awaited<ReturnType<typeof daemonServe>> | undefined,
    capability: Awaited<ReturnType<typeof factory.issue>> | undefined;
  const web = await source(factory, {
    name: "web",
    directory: fileURLToPath(new URL("../../dist/", import.meta.url)),
    documents: {
      "/bootstrap.json": () => {
        if (!bootstrap) throw new Error("fixture is not ready");
        return { type: "application/json", body: JSON.stringify(bootstrap) };
      },
    },
  });
  url = web.endpoint.url;
  await factory.expose({
    identity: { service: "daemon", generation: digest("web-browser-fixture") },
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
  driver = await browser({ evidence, viewport: { width: 1600, height: 1000 } });
  driver.page.setDefaultTimeout(8000);
}, 30000);
afterAll(async () => {
  try {
    await driver?.close();
  } finally {
    await manager?.close();
  }
  if (manager) {
    expect((await readDirectory(root)).manager.phase).toBe("closed");
    expect(await observeProcesses(root)).toHaveLength(0);
  }
  report.errors = driver?.errors ?? [];
  report.closed = true;
  await writeFile(join(evidence, "report.json"), JSON.stringify(report, null, 2));
}, 30000);

afterEach(async (context) => {
  if (context.task.result?.state === "fail" && driver) {
    await driver.capture("failure");
    await writeFile(
      join(evidence, "failure.txt"),
      `${driver.errors.join("\n")}\n${await driver.page.locator("body").textContent()}`,
    );
  }
});

describe.sequential("persistent Studio view and native browser controls", () => {
  it("retains message draft, selection, input identity and scroll across theme and a save", async () => {
    await scene("Draft state");
    const page = driver.page,
      message = page.getByLabel("消息", { exact: true });
    await message.fill("Keep this unsent note");
    await message.evaluate((element) => {
      element.setAttribute("data-probe", "stable-note");
      (element as HTMLTextAreaElement).setSelectionRange(4, 9);
    });
    const seek = page.getByLabel("定位秒", { exact: true });
    await seek.fill("1.25");
    await seek.evaluate((e) => e.setAttribute("data-probe", "stable-seek"));
    await click("切换主题");
    expect(await seek.inputValue()).toBe("1.25");
    expect(await seek.getAttribute("data-probe")).toBe("stable-seek");
    expect(await message.inputValue()).toBe("Keep this unsent note");
    expect(await message.getAttribute("data-probe")).toBe("stable-note");
    await selected();
    const text = page.getByLabel("文本内容", { exact: true });
    await text.evaluate((element) => element.setAttribute("data-probe", "stable-text"));
    await text.fill("Edited baseline");
    await click("保存");
    expect(await text.getAttribute("data-probe")).toBe("stable-text");
    expect(await message.inputValue()).toBe("Keep this unsent note");
    await page.getByRole("tab", { name: "文件", exact: true }).click();
    await click("index.html");
    const code = page.getByRole("textbox", { name: "index.html", exact: true });
    await code.focus();
    await code.evaluate((element) => {
      element.setAttribute("data-probe", "stable-code");
      (element as HTMLTextAreaElement).setSelectionRange(12, 24);
    });
    await page.keyboard.press("ControlOrMeta+s");
    await ready();
    expect(await code.getAttribute("data-probe")).toBe("stable-code");
    expect(await code.evaluate((e) => (e as HTMLTextAreaElement).selectionStart)).toBe(12);
    expect(await message.inputValue()).toBe("Keep this unsent note");
    (report.cases as string[]).push("stable-input-and-drafts");
  }, 30000);
  it("keeps drafts per session and operates the menu with keyboard and Escape", async () => {
    await scene("Session draft");
    const page = driver.page;
    await page.getByLabel("消息", { exact: true }).fill("Draft owned by this session");
    await page.getByRole("button", { name: "会话操作", exact: true }).click();
    await page.getByRole("menuitem", { name: "编辑会话名称", exact: true }).waitFor();
    await page.waitForFunction(() => document.activeElement?.getAttribute("aria-label") === "编辑会话名称");
    await page.keyboard.press("ArrowDown");
    expect(await page.evaluate(() => document.activeElement?.getAttribute("aria-label"))).toBe("新建影片工程");
    await page.keyboard.press("Escape");
    expect(await page.getByRole("menu").count()).toBe(0);
    expect(
      await page.getByRole("button", { name: "会话操作", exact: true }).evaluate((e) => document.activeElement === e),
    ).toBe(true);
    await page
      .getByRole("navigation", { name: "会话", exact: true })
      .getByRole("button", { name: "Draft state", exact: true })
      .click();
    await ready();
    expect(await page.getByLabel("消息", { exact: true }).inputValue()).toBe("");
    await page
      .getByRole("navigation", { name: "会话", exact: true })
      .getByRole("button", { name: "Session draft", exact: true })
      .click();
    await ready();
    expect(await page.getByLabel("消息", { exact: true }).inputValue()).toBe("Draft owned by this session");
    (report.cases as string[]).push("session-draft-owner-and-menu");
  }, 30000);
  it("uses actual tree navigation, semantic tabs and validates incomplete numeric drafts", async () => {
    await scene("Controls");
    const page = driver.page,
      tree = page.getByRole("tree", { name: "工程图层", exact: true });
    await tree.focus();
    await page.keyboard.press("Home");
    await page.keyboard.press("ArrowRight");
    await page.keyboard.press("ArrowDown");
    await page.keyboard.press("Enter");
    await ready();
    const duration = page.getByLabel("持续秒", { exact: true });
    await duration.fill("");
    await page.getByRole("button", { name: "保存", exact: true }).click();
    await page
      .locator("[aria-live]")
      .filter({ hasText: /有效数值/ })
      .waitFor();
    expect(await duration.inputValue()).toBe("");
    await duration.fill("2.5");
    await click("应用更改");
    expect(await duration.inputValue()).toBe("2.5");
    await page.waitForFunction(
      () => !document.querySelector<HTMLButtonElement>('[role="tab"][data-tab="layers"]')?.disabled,
    );
    await page.getByRole("tab", { name: "图层", exact: true }).focus();
    await page.keyboard.press("ArrowRight");
    expect(await page.getByRole("tab", { name: "文件", exact: true }).getAttribute("aria-selected")).toBe("true");
    await click("hyperframes.json");
    expect(await page.getByRole("textbox", { name: "hyperframes.json", exact: true }).isVisible()).toBe(true);
    (report.cases as string[]).push("tree-tabs-numeric-draft");
  }, 30000);
  it("enforces pinned main design values and restores pixels when switching a theme round-trip", async () => {
    await scene("Visual contract");
    const page = driver.page;
    await page.mouse.move(0, 0);
    await page.evaluate(async () => {
      await document.fonts.ready;
    });
    const contract = JSON.parse(
      await readFile(fileURLToPath(new URL("./reference.json", import.meta.url)), "utf8"),
    ) as { tokens: Record<string, string>; reference: string };
    const actual = await page.evaluate((keys) => {
      const root = document.querySelector("#app");
      if (!root) throw Error("missing root");
      const computed = getComputedStyle(root);
      return Object.fromEntries(keys.map((k) => [k, computed.getPropertyValue(k).trim()]));
    }, Object.keys(contract.tokens));
    expect(actual).toEqual(contract.tokens);
    const before = await driver.capture("light");
    await click("切换主题");
    await page.mouse.move(0, 0);
    await driver.capture("dark");
    await click("切换主题");
    await page.mouse.move(0, 0);
    const restored = await driver.capture("light-restored");
    const difference = imageDifference(before, restored);
    expect(difference.ratio).toBeLessThan(0.002);
    report.themeRestoration = difference;
    report.designContract = contract;
    for (const size of [
      { width: 1440, height: 900 },
      { width: 1024, height: 900 },
      { width: 390, height: 1000 },
    ]) {
      await page.setViewportSize(size);
      await page.waitForFunction(
        () => Math.abs((document.querySelector<SVGSVGElement>(".om-time__surface")?.getScreenCTM()?.a ?? 0) - 1) < 0.01,
      );
      expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(size.width);
      await driver.capture(`width-${size.width}`);
    }
    await page.setViewportSize({ width: 1600, height: 1000 });
    expect(driver.errors).toEqual([]);
    (report.cases as string[]).push("pinned-main-contract-pixel-restoration-responsive");
  }, 30000);
  it("drains a mounted view, revokes its URLs and remounts through the same public owner", async () => {
    await scene("Dispose owner");
    const page = driver.page,
      old = await page.locator("iframe").getAttribute("src");
    expect(old).toBeTruthy();
    await page.evaluate(`(async () => { await (await import("/main.js")).view.dispose(); })()`);
    expect(await page.locator(".om-shell").count()).toBe(0);
    if (old) expect((await fetch(old)).status).toBe(404);
    await page.evaluate(`(async () => {
      const module = await import("/main.js");
      const config = await (await fetch("/bootstrap.json")).json();
      globalThis.testView = module.mount(document.querySelector("#app"), config);
    })()`);
    await ready();
    await page.getByLabel("预览状态", { exact: true }).filter({ hasText: "预览就绪" }).waitFor();
    expect(await page.locator(".om-shell").count()).toBe(1);
    await page.evaluate(`(async () => { await globalThis.testView.dispose(); })()`);
    expect(driver.errors).toEqual([]);
    (report.cases as string[]).push("drain-url-revoke-remount");
  }, 30000);
  it("persists closed appearance and canvas movement in intrinsic coordinates, then undoes the real move", async () => {
    await scene("Native geometry");
    const page = driver.page;
    await page.getByText("外观与静态位移", { exact: true }).click();
    await page.getByLabel("偏移 X", { exact: true }).fill("40");
    await page.getByLabel("偏移 Y", { exact: true }).fill("20");
    await page.getByLabel("文字颜色", { exact: true }).fill("#123456");
    await page.getByLabel("不透明度", { exact: true }).fill("0.75");
    await click("应用更改");
    await page.waitForFunction(
      () =>
        document.querySelector<HTMLInputElement>('[aria-label="偏移 X"]')?.value === "40" &&
        !document.querySelector<HTMLInputElement>('[aria-label="偏移 X"]')?.readOnly,
    );
    await page.getByLabel("预览状态", { exact: true }).filter({ hasText: "预览就绪" }).waitFor();
    const frame = page.frameLocator("iframe:not([hidden])"),
      paint = await frame.locator("p").evaluate((e) => {
        const c = getComputedStyle(e);
        return { translate: c.translate, color: c.color, opacity: c.opacity, width: innerWidth };
      });
    expect(paint).toMatchObject({ translate: "40px 20px", color: "rgb(18, 52, 86)", opacity: "0.75" });
    const old = await page.locator("iframe:not([hidden])").boundingBox(),
      rect = await frame.locator("p").boundingBox();
    if (!old || !rect) throw Error("missing native geometry");
    const dx = 24,
      scale = old.width / paint.width;
    await page.mouse.move(rect.x + rect.width / 2, rect.y + rect.height / 2);
    await page.mouse.down();
    await page.mouse.move(rect.x + rect.width / 2 + dx, rect.y + rect.height / 2 + 10, { steps: 5 });
    await page.mouse.up();
    await ready();
    await page.waitForFunction(
      () => Number(document.querySelector<HTMLInputElement>('[aria-label="偏移 X"]')?.value) > 40,
    );
    expect(Number(await page.getByLabel("偏移 X", { exact: true }).inputValue())).toBeCloseTo(40 + dx / scale, 0);
    await click("撤销");
    await page.waitForFunction(() => document.querySelector<HTMLInputElement>('[aria-label="偏移 X"]')?.value === "40");
    await click("重做");
    await page.waitForFunction(
      () => Number(document.querySelector<HTMLInputElement>('[aria-label="偏移 X"]')?.value) > 40,
    );
    await driver.capture("native-geometry");
    (report.cases as string[]).push("native-appearance-intrinsic-canvas-move-history");
  }, 30000);
  it("writes and edits actual GSAP keyframes, seeks diamonds and preserves the draft on a failed save", async () => {
    await scene("Native animation");
    const page = driver.page;
    await page.getByText("关键帧动画", { exact: true }).click();
    await page.getByLabel("动画属性", { exact: true }).selectOption("x");
    await click("保存动画");
    await page.waitForFunction(
      () =>
        document.querySelector<HTMLInputElement>('[aria-label="关键帧 2 值"]')?.value === "240" &&
        !document.querySelector<HTMLInputElement>('[aria-label="关键帧 2 值"]')?.readOnly,
    );
    await page.getByLabel("预览状态", { exact: true }).filter({ hasText: "预览就绪" }).waitFor();
    await expect.poll(() => page.locator("[data-keyframe-id]").count()).toBe(2);
    await page.getByLabel("定位秒", { exact: true }).fill("1.5");
    await click("定位");
    const frame = page.frameLocator("iframe:not([hidden])");
    await expect
      .poll(() => frame.locator("p").evaluate((e) => new DOMMatrix(getComputedStyle(e).transform).m41))
      .toBeCloseTo(120, 0);
    await page.getByLabel("关键帧 2 值", { exact: true }).fill("360");
    await page.route("**/api/project_save", (route) => route.abort("failed"));
    await page.getByRole("button", { name: "保存动画", exact: true }).click();
    await expect.poll(() => page.getByRole("button", { name: "重试", exact: true }).isEnabled()).toBe(true);
    expect(await page.getByLabel("关键帧 2 值", { exact: true }).inputValue()).toBe("360");
    await page.unroute("**/api/project_save");
    await click("重试");
    await page.getByLabel("预览状态", { exact: true }).filter({ hasText: "预览就绪" }).waitFor();
    await page.waitForFunction(
      () =>
        document.querySelector<HTMLInputElement>('[aria-label="关键帧 2 值"]')?.value === "360" &&
        !document.querySelector<HTMLInputElement>('[aria-label="关键帧 2 值"]')?.readOnly,
    );
    await page.getByRole("button", { name: "x 100%", exact: true }).focus();
    await page.keyboard.press("Enter");
    await expect
      .poll(() =>
        page
          .frameLocator("iframe:not([hidden])")
          .locator("p")
          .evaluate((e) => new DOMMatrix(getComputedStyle(e).transform).m41),
      )
      .toBeCloseTo(360, 0);
    await page.getByRole("button", { name: "添加关键帧", exact: true }).click();
    await page.getByLabel("关键帧 2 位置", { exact: true }).fill("60");
    await page.getByLabel("关键帧 2 值", { exact: true }).fill("240");
    await click("保存动画");
    await expect.poll(() => page.locator("[data-keyframe-id]").count()).toBe(3);
    await driver.capture("native-keyframes");
    await page.reload();
    await ready();
    await selected();
    await page.getByText("关键帧动画", { exact: true }).click();
    expect(await page.getByLabel("关键帧 2 位置", { exact: true }).inputValue()).toBe("60");
    await click("删除动画");
    await expect.poll(() => page.locator("[data-keyframe-id]").count()).toBe(0);
    await click("撤销");
    await expect.poll(() => page.locator("[data-keyframe-id]").count()).toBe(3);
    expect(driver.errors).toEqual([]);
    (report.cases as string[]).push("native-keyframes-real-seek-failure-retry-cold-reload-history");
  }, 30000);
  it("maps a canvas drag through a rotated/scaled parent and cancels a gesture with Escape", async () => {
    await scene("Parent transform");
    const page = driver.page;
    await page.getByRole("tab", { name: "文件", exact: true }).click();
    await click("index.html");
    const code = page.getByRole("textbox", { name: "index.html", exact: true }),
      source = (await code.inputValue()).replace(/font-size:\s*96px/, "font-size:2em");
    await code.fill(
      source
        .replace(
          "<p data-",
          '<div data-hf-id="hf-parent" data-start="0" data-duration="3" style="transform:rotate(30deg) scale(0.8);transform-origin:0 0"><p data-',
        )
        .replace("</p>", "</p></div>"),
    );
    await page.keyboard.press("ControlOrMeta+s");
    await ready();
    await click("预览");
    await page.waitForFunction(() => !document.querySelector<HTMLInputElement>('[aria-label="文本内容"]')?.readOnly);
    await page.getByLabel("预览状态", { exact: true }).filter({ hasText: "预览就绪" }).waitFor();
    await page.getByLabel("文本内容", { exact: true }).fill("Relative typography");
    await click("应用更改");
    await page.waitForFunction(
      () =>
        document.querySelector<HTMLInputElement>('[aria-label="文本内容"]')?.value === "Relative typography" &&
        !document.querySelector<HTMLInputElement>('[aria-label="文本内容"]')?.readOnly,
    );
    expect(await page.getByLabel("字号", { exact: true }).inputValue()).toBe("");
    await page.getByLabel("预览状态", { exact: true }).filter({ hasText: "预览就绪" }).waitFor();
    const native = page.frameLocator("iframe:not([hidden])"),
      data = await native.locator("p").evaluate((e) => {
        if (!e.parentElement) throw Error("missing parent");
        const matrix = new DOMMatrix(getComputedStyle(e.parentElement).transform).inverse();
        return { a: matrix.a, b: matrix.b, c: matrix.c, d: matrix.d, width: innerWidth };
      });
    const frame = await page.locator("iframe:not([hidden])").boundingBox(),
      box = await native.locator("p").boundingBox();
    if (!frame || !box) throw Error("missing frame");
    const x = box.x + box.width / 2,
      y = box.y + box.height / 2,
      scale = frame.width / data.width;
    await page.mouse.move(x, y);
    await page.mouse.down();
    await page.mouse.move(x + 12, y + 8, { steps: 5 });
    await page.keyboard.press("Escape");
    await page.mouse.up();
    await page.getByText("外观与静态位移", { exact: true }).click();
    expect(await page.getByLabel("偏移 X", { exact: true }).inputValue()).toBe("");
    await page.mouse.move(x, y);
    await page.mouse.down();
    await page.mouse.move(x + 12, y + 8, { steps: 5 });
    await page.mouse.up();
    await ready();
    await page.waitForFunction(() => !!document.querySelector<HTMLInputElement>('[aria-label="偏移 X"]')?.value);
    expect(Number(await page.getByLabel("偏移 X", { exact: true }).inputValue())).toBeCloseTo(
      (data.a * 12 + data.c * 8) / scale,
      0,
    );
    expect(Number(await page.getByLabel("偏移 Y", { exact: true }).inputValue())).toBeCloseTo(
      (data.b * 12 + data.d * 8) / scale,
      0,
    );
    expect(driver.errors).toEqual([]);
    (report.cases as string[]).push("parent-transform-inverse-and-escape");
  }, 30000);
});
