import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { browser } from "@odsuite/automation";
import { channel, namespace } from "@odsuite/protocol";
import { observeProcesses, readDirectory } from "@odsuite/sidecar";
import { expect, it } from "vitest";
import { open } from "@";

const files = () =>
  [
    {
      path: "index.html",
      content:
        '<html><head></head><body><main data-composition-id="main" data-width="640" data-height="360" data-duration="8"><p data-hf-id="hf-outside">Outside</p><section data-hf-id="hf-a" data-composition-id="card" data-composition-src="scenes/card.html" data-start="0" data-duration="2"></section><section data-hf-id="hf-b" data-composition-id="card" data-composition-src="scenes/card.html" data-start="1" data-duration="2"></section></main><script>window.__timelines={main:gsap.timeline({paused:true}).to({},{duration:8})};</script></body></html>',
    },
    {
      path: "scenes/card.html",
      content:
        '<html><head><style>p{color:rgb(22,33,44)}.art{background-image:url(./art.svg)}</style><link rel="stylesheet" href="./shared.css"></head><body><div data-composition-id="card" data-width="200" data-height="100" data-duration="2"><p id="title" data-hf-id="hf-title" data-start="0" data-duration="2">Card</p><img class="art" src="./art.svg?revision=1"><svg><defs><clipPath id="clip"><rect width="10" height="10"/></clipPath></defs><rect clip-path="url(#clip)" width="10" height="10"/></svg><section data-hf-id="hf-leaf" data-composition-id="leaf" data-composition-src="nested/leaf.html" data-start="1" data-duration="1"></section></div><script src="./helper.js"></script><script>const tl=gsap.timeline({paused:true});tl.to(document.getElementById("title"),{x:100,duration:2,ease:"none"},0);window.__timelines=window.__timelines||{};window.__timelines.card=tl;</script></body></html>',
    },
    {
      path: "scenes/nested/leaf.html",
      content:
        '<template data-composition-id="leaf"><div data-composition-id="leaf" data-width="80" data-height="20" data-duration="1"><b data-hf-id="hf-title" data-start="0" data-duration="1">Leaf</b></div><script>window.__timelines=window.__timelines||{};window.__timelines.leaf=gsap.timeline({paused:true}).to("b",{x:40,duration:1,ease:"none"},0);</script></template>',
    },
    {
      path: "scenes/art.svg",
      content:
        '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16"><rect fill="blue" width="16" height="16"/></svg>',
    },
    { path: "scenes/shared.css", content: ".art{width:16px;height:16px}" },
    { path: "scenes/helper.js", content: "window.helperRuns=(window.helperRuns||0)+1;" },
  ].sort((a, b) => (a.path < b.path ? -1 : a.path > b.path ? 1 : 0));
it("runs repeated native compositions, isolates local clocks/assets and retains previews through invalid revisions and cold restoration", async () => {
  const evidence = fileURLToPath(new URL(`../../../.artifacts/composition-browser/${randomUUID()}/`, import.meta.url)),
    root = join(evidence, "sidecar"),
    scope = { channel: channel("dev"), namespace: namespace("composition-browser") };
  await mkdir(evidence, { recursive: true });
  let runtime: Awaited<ReturnType<typeof open>> | undefined, driver: Awaited<ReturnType<typeof browser>> | undefined;
  const external = new Set<string>(),
    failedResources: string[] = [],
    report: Record<string, unknown> = { evidence };
  try {
    runtime = await open({ root, scope, version: "0.6.1-dev.1" });
    let status = await runtime.status();
    expect(status.daemon.pid).not.toBe(process.pid);
    report.daemonPid = status.daemon.pid;
    const session = await runtime.execute("session_create", {
        requestId: randomUUID(),
        title: "Nested source",
        mode: "motion",
      }),
      artifact = await runtime.execute("artifact_create", {
        requestId: randomUUID(),
        sessionId: session.id,
        title: "Repeated instances",
        files: files(),
      }),
      state = await runtime.execute("workspace_state", {}),
      owner = { sessionId: session.id, artifactId: artifact.id };
    await runtime.execute("artifact_open", {
      requestId: randomUUID(),
      ...owner,
      expectedSelection: state.selection.revision,
      expectedCurrent: null,
    });
    driver = await browser({ evidence, viewport: { width: 1600, height: 1000 } });
    const page = driver.page;
    page.setDefaultTimeout(10000);
    page.on("request", (request) => {
      const url = new URL(request.url());
      if (["http:", "https:"].includes(url.protocol) && !["127.0.0.1", "localhost", "[::1]"].includes(url.hostname))
        external.add(url.origin);
    });
    page.on("response", (response) => {
      if (/\/preview\/[a-f0-9-]+\//.test(response.url()) && response.status() >= 400)
        failedResources.push(response.url());
    });
    const ready = async () => {
      await page
        .locator("[aria-live]")
        .filter({ hasText: /^就绪$/ })
        .waitFor();
    };
    const shown = async () => {
      await page.getByLabel("预览状态", { exact: true }).filter({ hasText: "预览就绪" }).waitFor();
    };
    const click = async (name: string) => {
      await page.getByRole("button", { name, exact: true }).click();
      await ready();
    };
    const frame = () => page.frameLocator("iframe:not([hidden])");
    const paint = async (time: number) => {
      await page.getByLabel("定位秒", { exact: true }).fill(String(time));
      await click("定位");
      await expect
        .poll(() =>
          frame()
            .locator("main")
            .evaluate(() => Reflect.get(window, "__timelines").main.time()),
        )
        .toBeCloseTo(time, 2);
      return frame()
        .locator("main")
        .evaluate(() =>
          [...document.querySelectorAll("[data-open-motion-instance]")].map((host) => {
            const text = host.querySelector("[data-hf-id=hf-title]");
            return {
              id: host.getAttribute("data-open-motion-instance"),
              x: text ? new DOMMatrix(getComputedStyle(text).transform).m41 : null,
            };
          }),
        );
    };
    await page.goto(status.web);
    await ready();
    await shown();
    expect(await frame().locator("[data-open-motion-instance]").count()).toBe(4);
    expect(
      await frame()
        .locator("img")
        .evaluateAll((images) =>
          images.every((image) => image instanceof HTMLImageElement && image.complete && image.naturalWidth === 16),
        ),
    ).toBe(true);
    expect(
      await frame()
        .locator("p#title")
        .evaluateAll((elements) => elements.map((element) => getComputedStyle(element).color)),
    ).toEqual(["rgb(22, 33, 44)", "rgb(22, 33, 44)"]);
    expect(
      await frame()
        .locator("#title")
        .first()
        .evaluate(() => Reflect.get(window, "helperRuns")),
    ).toBe(1);
    const svg = await frame()
      .locator("clipPath")
      .evaluateAll((elements) =>
        elements.map((element) => ({
          id: element.id,
          reference: element.closest("svg")?.querySelector("svg > rect")?.getAttribute("clip-path"),
        })),
      );
    expect(new Set(svg.map((entry) => entry.id)).size).toBe(2);
    for (const entry of svg) expect(entry.reference).toBe(`url(#${entry.id})`);
    const early = await paint(0.5),
      late = await paint(1.5);
    expect(early.find((instance) => instance.id === "hf-a")?.x).toBeCloseTo(25, 1);
    expect(late.find((instance) => instance.id === "hf-b")?.x).toBeCloseTo(25, 1);
    expect(late.find((instance) => instance.id === "hf-a")?.x).toBeCloseTo(75, 1);
    const nested = await paint(1.5);
    expect(nested.find((instance) => instance.id === "hf-a/hf-leaf")?.x).toBeCloseTo(20, 1);
    report.paint = { early, late, nested };
    await page.evaluate(() => {
      addEventListener("message", (event) => {
        if (event.data?.source === "open-motion-editor" && event.data.type === "select")
          Reflect.set(window, "compositionSelection", event.data.id);
        if (event.data?.source === "open-motion-editor" && event.data.type === "geometry")
          Reflect.set(window, "compositionGeometry", event.data);
      });
    });
    await frame().locator("p#title").nth(1).dispatchEvent("pointerdown", { button: 0, pointerId: 1 });
    await expect.poll(() => page.evaluate(() => Reflect.get(window, "compositionSelection"))).toBe("hf-b/hf-title");
    await page.locator("iframe:not([hidden])").evaluate((element) => {
      if (!(element instanceof HTMLIFrameElement)) throw Error("missing frame");
      element.contentWindow?.postMessage(
        { source: "open-motion-editor", type: "selection", id: "hf-b/hf-title", enabled: true },
        "*",
      );
    });
    await expect
      .poll(() => page.evaluate(() => Reflect.get(window, "compositionGeometry")))
      .toMatchObject({ id: "hf-b/hf-title", movable: false });
    await driver.capture("repeated-native-compositions");
    const source = await runtime.execute("project_read", owner),
      prior = await page.locator("iframe:not([hidden])").getAttribute("src");
    expect(source.files).toEqual(files());
    await page.getByRole("tab", { name: "文件", exact: true }).click();
    await click("index.html");
    const authored = source.files.find((file) => file.path === "index.html");
    if (!authored) throw Error("missing authored entry");
    await page
      .getByRole("textbox", { name: "index.html", exact: true })
      .fill(authored.content.replaceAll("scenes/card.html", "scenes/missing.html"));
    await click("保存");
    await page.getByLabel("预览状态", { exact: true }).filter({ hasText: "missing composition" }).waitFor();
    expect(await page.locator("iframe:not([hidden])").getAttribute("src")).toBe(prior);
    expect(await frame().locator("p#title").first().textContent()).toBe("Card");
    await driver.capture("failed-candidate-retains-confirmed-frame");
    await click("撤销");
    await shown();
    expect((await runtime.execute("project_read", owner)).files).toEqual(source.files);
    await page.reload();
    await ready();
    await shown();
    await runtime.close();
    expect(await observeProcesses(root)).toHaveLength(0);
    runtime = await open({ root, scope, version: "0.6.1-dev.1" });
    status = await runtime.status();
    expect((await runtime.execute("project_read", owner)).files).toEqual(source.files);
    await page.goto(status.web);
    await ready();
    await shown();
    expect(await frame().locator("[data-open-motion-instance]").count()).toBe(4);
    expect(await paint(1.5)).toEqual(nested);
    expect(driver.errors).toEqual([]);
    expect(failedResources).toEqual([]);
    expect([...external]).toEqual([]);
    report.revision = source.revision;
    report.cases = [
      "repeated-instance-source-identity",
      "scoped-canvas-selection-with-nested-editing-disabled",
      "native-local-clock-and-GSAP-paint",
      "template-grandchild",
      "relative-assets-and-scoped-CSS",
      "colliding-SVG-IDs",
      "failed-candidate-retention-and-undo",
      "browser-reload-and-cold-carrier-restore",
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
    report.externalOrigins = [...external];
    report.errors = driver?.errors ?? [];
    await writeFile(join(evidence, "report.json"), JSON.stringify(report, null, 2));
  }
}, 60000);
