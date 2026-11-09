import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { browser } from "@odsuite/automation";
import { channel, namespace } from "@odsuite/protocol";
import { observeProcesses, readDirectory } from "@odsuite/sidecar";
import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";
import { open } from "@";

const externalOrigins = new Set<string>();
const evidence = fileURLToPath(new URL(`../../../.artifacts/animation-browser/${randomUUID()}/`, import.meta.url)),
  root = join(evidence, "sidecar"),
  scope = { channel: channel("dev"), namespace: namespace("animation-browser") },
  report: Record<string, unknown> = { evidence, cases: [], main: "ab0e69ac532b0c76ce415c11ab7db84ab6a2dc70" };
let runtime: Awaited<ReturnType<typeof open>>,
  driver: Awaited<ReturnType<typeof browser>>,
  url = "";
const template = (script: string) =>
  `<!doctype html><html><head><meta charset="utf-8"></head><body><main data-composition-id="main" data-width="1920" data-height="1080" data-duration="5"><p data-hf-id="hf-text" data-start="0" data-duration="4">Native lanes</p></main><script>const tl=gsap.timeline({paused:true});${script}window.__timelines={main:tl};</script></body></html>`;
const flat = template(
    `tl.fromTo('[data-hf-id="hf-text"]',{x:0,y:20,opacity:0.2},{x:240,y:120,opacity:1,duration:4,ease:"power2.inOut"},0);`,
  ),
  curved = template(
    `tl.to('[data-hf-id="hf-text"]',{keyframes:{"0%":{x:0},"25%":{x:80,ease:"power1.inOut"},"100%":{x:240,ease:"none"}},duration:4,ease:"power2.inOut"},0);`,
  );
const ready = () =>
  driver.page
    .locator("[aria-live]")
    .filter({ hasText: /^就绪$/ })
    .waitFor();
async function preview() {
  const state = await runtime.execute("workspace_state", {}),
    selected = state.selection;
  if (!selected.sessionId || !selected.artifactId) throw Error("missing project");
  const project = await runtime.execute("project_read", {
    sessionId: selected.sessionId,
    artifactId: selected.artifactId,
  });
  await expect.poll(() => driver.page.locator("[data-revision]").getAttribute("data-revision")).toBe(project.revision);
  await driver.page.getByLabel("预览状态", { exact: true }).filter({ hasText: "预览就绪" }).waitFor();
}
async function click(name: string) {
  await driver.page.getByRole("button", { name, exact: true }).click();
  await ready();
}
async function scene(html: string, title: string) {
  const session = await runtime.execute("session_create", { requestId: randomUUID(), title, mode: "motion" }),
    artifact = await runtime.execute("artifact_create", {
      requestId: randomUUID(),
      sessionId: session.id,
      title,
      files: [{ path: "index.html", content: html }],
    }),
    state = await runtime.execute("workspace_state", {}),
    current =
      state.selection.sessionId && state.selection.artifactId
        ? await runtime.execute("project_read", {
            sessionId: state.selection.sessionId,
            artifactId: state.selection.artifactId,
          })
        : null;
  await runtime.execute("artifact_open", {
    requestId: randomUUID(),
    sessionId: session.id,
    artifactId: artifact.id,
    expectedSelection: state.selection.revision,
    expectedCurrent: current ? { artifactId: current.artifactId, revision: current.revision } : null,
  });
  await driver.page.goto(url);
  await ready();
  await driver.page.getByRole("treeitem", { name: "Native lanes", exact: true }).click();
  await ready();
  await driver.page.getByText("关键帧动画", { exact: true }).click();
  await preview();
  return { sessionId: session.id, artifactId: artifact.id };
}
async function paint(time: number) {
  const page = driver.page;
  await page.getByLabel("定位秒", { exact: true }).fill(String(time));
  await preview();
  await click("定位");
  await expect
    .poll(async () =>
      Math.abs(
        (await driver.page
          .frameLocator("iframe:not([hidden])")
          .locator("p")
          .evaluate(() => Reflect.get(window, "__timelines").main.time())) - time,
      ),
    )
    .toBeLessThan(0.04);
  return page
    .frameLocator("iframe:not([hidden])")
    .locator("p")
    .evaluate((e) => {
      const c = getComputedStyle(e),
        m = new DOMMatrix(c.transform);
      return { x: m.m41, y: m.m42, opacity: Number(c.opacity) };
    });
}
const sample = async () => {
  const result = [];
  for (const time of [0, 0.25, 1, 2.5, 3.9]) result.push({ time, ...(await paint(time)) });
  return result;
};
function samePaint(a: Awaited<ReturnType<typeof sample>>, b: Awaited<ReturnType<typeof sample>>) {
  for (let i = 0; i < a.length; i++)
    for (const key of ["x", "y", "opacity"] as const) expect(a[i]?.[key]).toBeCloseTo(b[i]?.[key] ?? NaN, 2);
}
beforeAll(async () => {
  await mkdir(evidence, { recursive: true });
  runtime = await open({ root, scope, version: "0.6.1-dev.1" });
  const status = await runtime.status();
  url = status.web;
  expect(status.daemon.pid).not.toBe(process.pid);
  report.daemon = { pid: status.daemon.pid, carrier: status.environment.carrier };
  driver = await browser({ evidence, viewport: { width: 1600, height: 1000 } });
  driver.page.on("request", (request) => {
    const url = new URL(request.url());
    if (["http:", "https:"].includes(url.protocol) && !["127.0.0.1", "localhost", "[::1]"].includes(url.hostname))
      externalOrigins.add(url.origin);
  });
  driver.page.setDefaultTimeout(8000);
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
afterAll(async () => {
  try {
    await driver?.close();
  } finally {
    await runtime?.close();
  }
  expect((await readDirectory(root)).manager.phase).toBe("closed");
  expect(await observeProcesses(root)).toHaveLength(0);
  report.externalOrigins = [...externalOrigins];
  expect([...externalOrigins]).toEqual([]);
  report.closed = true;
  report.errors = driver?.errors ?? [];
  await writeFile(join(evidence, "report.json"), JSON.stringify(report, null, 2));
}, 30000);
describe.sequential("standalone native animation transactions", () => {
  it("preserves real GSAP paint through conversion and separation, edits one lane, retries and cold-restores history", async () => {
    const owner = await scene(flat, "Literal fromTo"),
      page = driver.page,
      before = await sample();
    await click("转换原生关键帧");
    await preview();
    const converted = await sample();
    samePaint(before, converted);
    await click("拆分属性轨道");
    await preview();
    const separated = await sample();
    samePaint(before, separated);
    expect(await page.getByLabel("动画选择", { exact: true }).locator("option").count()).toBe(4);
    expect(await page.locator("[data-lane-id]").allTextContents()).toEqual(["x", "y", "opacity"]);
    const xBox = await page.getByRole("button", { name: "x 100%", exact: true }).boundingBox(),
      yBox = await page.getByRole("button", { name: "y 100%", exact: true }).boundingBox();
    if (!xBox || !yBox) throw Error("missing property lanes");
    expect(yBox.y - xBox.y).toBeGreaterThan(15);
    const x = await page
      .getByLabel("动画选择", { exact: true })
      .locator("option")
      .filter({ hasText: "动画 X" })
      .getAttribute("value");
    if (!x) throw Error("missing x lane");
    await page.getByLabel("动画选择", { exact: true }).selectOption(x);
    await writeFile(
      join(evidence, "before-edit.json"),
      JSON.stringify({
        project: await runtime.execute("project_read", owner),
        easing: await page.getByLabel("关键帧 2 缓动", { exact: true }).inputValue(),
        overall: await page.getByLabel("动画整体缓动", { exact: true }).inputValue(),
      }),
    );
    await page.getByLabel("关键帧 2 值", { exact: true }).fill("480");
    expect(await page.getByLabel("持续秒", { exact: true }).getAttribute("readonly")).not.toBeNull();
    await page.route("**/api/project_save", (route) => route.abort("failed"));
    await page.getByRole("button", { name: "保存动画", exact: true }).click();
    await expect.poll(() => page.getByRole("button", { name: "重试", exact: true }).isEnabled()).toBe(true);
    expect(await page.getByLabel("关键帧 2 值", { exact: true }).inputValue()).toBe("480");
    await page.unroute("**/api/project_save");
    await click("重试");
    const changed = await sample();
    await writeFile(
      join(evidence, "after-edit.json"),
      JSON.stringify({ project: await runtime.execute("project_read", owner), before, changed }),
    );
    for (let i = 0; i < before.length; i++) {
      expect(changed[i]?.x).toBeCloseTo((before[i]?.x ?? NaN) * 2, 2);
      expect(changed[i]?.y).toBeCloseTo(before[i]?.y ?? NaN, 2);
      expect(changed[i]?.opacity).toBeCloseTo(before[i]?.opacity ?? NaN, 2);
    }
    const y = await page
      .getByLabel("动画选择", { exact: true })
      .locator("option")
      .filter({ hasText: "动画 Y" })
      .getAttribute("value");
    if (!y) throw Error("missing y lane");
    await page.getByLabel("动画选择", { exact: true }).selectOption(y);
    await page.getByRole("button", { name: "y 100%", exact: true }).focus();
    await page.keyboard.press("ArrowLeft");
    await ready();
    await preview();
    await expect.poll(() => page.getByLabel("动画持续秒", { exact: true }).inputValue()).toBe("3.9");
    expect(await page.getByLabel("动画属性", { exact: true }).inputValue()).toBe("y");
    expect(await page.evaluate(() => document.activeElement?.getAttribute("data-keyframe-focus"))).toBe(
      JSON.stringify(["hf-text", "y", 1]),
    );
    await click("撤销");
    await preview();
    samePaint(changed, await sample());
    await click("撤销");
    samePaint(before, await sample());
    await click("重做");
    samePaint(changed, await sample());
    await driver.capture("separated-lanes");
    const saved = await runtime.execute("project_read", owner);
    await runtime.close();
    expect(await observeProcesses(root)).toHaveLength(0);
    runtime = await open({ root, scope, version: "0.6.1-dev.1" });
    url = (await runtime.status()).web;
    expect((await runtime.execute("project_read", owner)).revision).toBe(saved.revision);
    await page.goto(url);
    await ready();
    await preview();
    samePaint(changed, await sample());
    report.conversion = { before, converted, separated, changed, savedRevision: saved.revision };
    (report.cases as string[]).push("conversion-separation-paint-lane-isolation-retry-history-cold-carrier");
  }, 60000);
  it("places eased keys at real time, drags an interior key, resizes its endpoint and moves an animated clip", async () => {
    const owner = await scene(curved, "Eased time"),
      page = driver.page;
    await page.getByRole("button", { name: "x 25%", exact: true }).focus();
    await page.keyboard.press("Enter");
    await expect
      .poll(async () => Number(await page.getByLabel("播放时间", { exact: true }).textContent()))
      .toBeGreaterThan(1.5);
    await expect
      .poll(() =>
        page
          .frameLocator("iframe:not([hidden])")
          .locator("p")
          .evaluate((e) => new DOMMatrix(getComputedStyle(e).transform).m41),
      )
      .toBeCloseTo(80, 0);
    const key = await page.getByRole("button", { name: "x 25%", exact: true }).boundingBox(),
      surface = await page.locator(".om-time__surface").boundingBox();
    if (!key || !surface) throw Error("missing time geometry");
    const revision = (await runtime.execute("project_read", owner)).revision;
    await page.mouse.move(key.x + key.width / 2, key.y + key.height / 2);
    await page.mouse.down();
    await page.mouse.move(key.x + key.width / 2 + 20, key.y + key.height / 2, { steps: 4 });
    await page.keyboard.press("Escape");
    await page.mouse.up();
    expect((await runtime.execute("project_read", owner)).revision).toBe(revision);
    expect(await page.getByLabel("关键帧 2 位置", { exact: true }).inputValue()).toBe("25");
    const target = surface.x + 160 + ((surface.width - 180) * 2) / 5;
    await page.mouse.move(key.x + key.width / 2, key.y + key.height / 2);
    await page.mouse.down();
    await page.mouse.move(target, key.y + key.height / 2, { steps: 8 });
    await page.mouse.up();
    await ready();
    await expect
      .poll(async () => Number(await page.getByLabel("关键帧 2 位置", { exact: true }).inputValue()))
      .toBeCloseTo(50, 0);
    expect((await paint(2)).x).toBeCloseTo(80, 0);
    await page.getByRole("button", { name: "x 0%", exact: true }).focus();
    await page.keyboard.press("ArrowRight");
    await ready();
    await expect.poll(() => page.getByLabel("动画开始秒", { exact: true }).inputValue()).toBe("0.1");
    expect((await paint(2)).x).toBeCloseTo(80, 0);
    await page.getByLabel("开始秒", { exact: true }).fill("1");
    await page.getByLabel("持续秒", { exact: true }).fill("3");
    await click("应用更改");
    await expect.poll(() => page.getByLabel("动画开始秒", { exact: true }).inputValue()).toBe("1.075");
    expect((await paint(2.5)).x).toBeCloseTo(80, 0);
    await driver.capture("retimed-keys");
    const saved = await runtime.execute("project_read", owner);
    await page.reload();
    await ready();
    await preview();
    expect((await paint(2.5)).x).toBeCloseTo(80, 0);
    expect(driver.errors).toEqual([]);
    report.retime = { savedRevision: saved.revision };
    (report.cases as string[]).push("nonlinear-key-seek-pointer-retime-endpoint-clip-scale-reload");
  }, 60000);
});
