import { createHash, randomUUID } from "node:crypto";
import { createReadStream } from "node:fs";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { browser, imageDifference } from "@odsuite/automation";
import { channel, namespace } from "@odsuite/protocol";
import { observeProcesses, readDirectory } from "@odsuite/sidecar";
import type { Tools } from "@open-motion/render";
import { expect, it } from "vitest";
import { open } from "@";

it("creates real templates through Web/Agent contracts, renders offline fonts and restores editable source plus verified output", async () => {
  const evidence = fileURLToPath(new URL(`../../../../.artifacts/template-browser/${randomUUID()}/`, import.meta.url)),
    root = join(evidence, "sidecar"),
    scope = { channel: channel("dev"), namespace: namespace("template-browser") };
  await mkdir(evidence, { recursive: true });
  let tools: Tools | undefined;
  if (process.env.OPEN_MOTION_NATIVE_MANIFEST) {
    const path = resolve(process.env.OPEN_MOTION_NATIVE_MANIFEST),
      manifest = JSON.parse(await readFile(path, "utf8"));
    const tool = (name: string) => {
      const item = manifest[name] as { path: string; resource: Tools["browser"]["resource"]; executable: string };
      return {
        resource: item.resource,
        executable: item.executable,
        load: async () => createReadStream(resolve(dirname(path), item.path)),
      };
    };
    tools = { browser: tool("browser"), ffmpeg: tool("ffmpeg"), ffprobe: tool("ffprobe") };
  }
  let runtime: Awaited<ReturnType<typeof open>> | undefined, driver: Awaited<ReturnType<typeof browser>> | undefined;
  const report: Record<string, unknown> = {
      native: tools ? "requested" : "unqualified without explicit native seed manifest",
    },
    external = new Set<string>(),
    failed: string[] = [];
  try {
    runtime = await open({ root, scope, tools, version: "0.6.1-dev.1" });
    const session = await runtime.execute("session_create", {
      requestId: randomUUID(),
      title: "Template production",
      mode: "motion",
    });
    await runtime.execute("session_open", {
      requestId: randomUUID(),
      sessionId: session.id,
      expectedSelection: 0,
      expectedCurrent: null,
    });
    driver = await browser({ evidence, viewport: { width: 1600, height: 1100 } });
    const page = driver.page;
    page.setDefaultTimeout(15000);
    page.on("request", (request) => {
      const url = new URL(request.url());
      if (["http:", "https:"].includes(url.protocol) && !["127.0.0.1", "localhost", "[::1]"].includes(url.hostname))
        external.add(url.origin);
    });
    page.on("response", (response) => {
      if (response.url().includes("/preview/") && response.status() >= 400) failed.push(response.url());
    });
    const ready = () =>
        page
          .locator("[aria-live]")
          .filter({ hasText: /^就绪$/ })
          .waitFor(),
      shown = () => page.getByLabel("预览状态", { exact: true }).filter({ hasText: "预览就绪" }).waitFor(),
      frame = () => page.frameLocator("iframe:not([hidden])"),
      click = async (name: string) => {
        await page.getByRole("button", { name, exact: true }).click();
        await ready();
      },
      seek = async (time: number) => {
        await expect.poll(() => page.locator("iframe:not([hidden])").isVisible()).toBe(true);
        await page.getByLabel("定位秒", { exact: true }).fill(String(time));
        await click("定位");
        await expect
          .poll(() =>
            frame()
              .locator("body")
              .evaluate(() => Reflect.get(window, "__timelines").main.time()),
          )
          .toBeCloseTo(time, 2);
        await frame()
          .locator("body")
          .evaluate(async () => {
            await document.fonts.ready;
            await new Promise<void>((done) => requestAnimationFrame(() => requestAnimationFrame(() => done())));
          });
      };
    await page.goto((await runtime.status()).web);
    await ready();
    await page.getByRole("button", { name: "新建工程", exact: true }).click();
    const panel = page.getByLabel("原生模板", { exact: true });
    await panel.locator("summary").click();
    await expect.poll(() => panel.getByLabel("模板", { exact: true }).locator("option").count()).toBe(3);
    await panel.getByLabel("模板工程标题", { exact: true }).fill("Product starter");
    let drop = true;
    await page.route("**/api/template_create", async (route) => {
      const response = await route.fetch();
      if (drop) {
        drop = false;
        await response.body();
        await route.abort("failed");
      } else await route.fulfill({ response });
    });
    await panel.getByRole("button", { name: "创建模板工程", exact: true }).click();
    await click("重试");
    await shown();
    expect((await runtime.execute("session_get", { sessionId: session.id })).artifacts).toHaveLength(1);
    const state = await runtime.execute("workspace_state", {}),
      first = { sessionId: session.id, artifactId: state.selection.artifactId! };
    expect(
      (await runtime.execute("project_read", first)).files.some((file) => file.path === "compositions/captions.html"),
    ).toBe(true);
    for (const [time, text] of [
      [2, "Starting with a blank canvas."],
      [6, "Three cursors. One file. Zero meetings."],
      [11, "Components in. Feedback resolved. No one waited."],
    ] as const) {
      await seek(time);
      expect(await frame().locator(".caption-line").textContent()).toBe(text);
      expect(
        await frame()
          .locator("body")
          .evaluate(() => document.fonts.check('600 48px "Inter"')),
      ).toBe(true);
      expect(
        await frame()
          .locator("body")
          .evaluate(() =>
            [...document.fonts].some(
              (face) => face.family.replace(/["']/g, "") === "Inter" && face.status === "loaded",
            ),
          ),
      ).toBe(true);
      await page.locator("iframe:not([hidden])").screenshot({ path: join(evidence, `promo-${time}.png`) });
    }
    const catalog = await runtime.execute("template_list", {}),
      created = [first];
    let edited: Awaited<ReturnType<typeof runtime.execute<"project_read">>> | undefined;
    for (const template of catalog.templates.filter((entry) => entry.id !== "product-promo")) {
      const input = {
          id: template.id,
          contentHash: template.contentHash,
          requestId: randomUUID(),
          sessionId: session.id,
          title: template.title,
        },
        artifact = await runtime.execute("template_create", input),
        selection = (await runtime.execute("workspace_state", {})).selection,
        current = await runtime.execute("project_read", { sessionId: session.id, artifactId: selection.artifactId! }),
        owner = { sessionId: session.id, artifactId: artifact.id };
      expect(await runtime.execute("template_create", input)).toEqual(artifact);
      expect((await runtime.execute("workspace_state", {})).selection).toEqual(selection);
      await runtime.execute("artifact_open", {
        ...owner,
        requestId: randomUUID(),
        expectedSelection: selection.revision,
        expectedCurrent: { artifactId: current.artifactId, revision: current.revision },
      });
      await page.getByLabel("外部修改", { exact: true }).waitFor();
      await expect.poll(() => page.getByRole("button", { name: "刷新", exact: true }).isDisabled()).toBe(true);
      await expect
        .poll(() => page.locator("[data-artifact-id]").getAttribute("data-artifact-id"))
        .toBe(current.artifactId);
      await click("放弃本地草稿并同步");
      await expect.poll(() => page.locator("[data-artifact-id]").getAttribute("data-artifact-id")).toBe(artifact.id);
      await shown();
      const font = template.id === "nyt-graph" ? '400 48px "Libre Baskerville"' : '400 48px "Inter"';
      await seek(2);
      const begin = await page.locator("iframe:not([hidden])").screenshot();
      await seek(8);
      const later = await page
        .locator("iframe:not([hidden])")
        .screenshot({ path: join(evidence, `${template.id}.png`) });
      expect(imageDifference(begin, later).ratio).toBeGreaterThan(0.001);
      expect(
        await frame()
          .locator("body")
          .evaluate((_node, font) => document.fonts.check(font), font),
      ).toBe(true);
      const loaded = await frame()
        .locator("body")
        .evaluate(() =>
          [...document.fonts]
            .filter((face) => face.status === "loaded")
            .map((face) => face.family.replace(/["']/g, "")),
        );
      expect(loaded).toEqual(
        expect.arrayContaining(template.id === "nyt-graph" ? ["Libre Baskerville", "Libre Franklin"] : ["Inter"]),
      );
      if (template.id === "nyt-graph") {
        const project = await runtime.execute("project_read", owner),
          path = "compositions/nyt-chart.html",
          source = project.files.find((file) => file.path === path)!;
        await page.getByRole("tab", { name: "文件", exact: true }).click();
        await click(path);
        await page
          .getByRole("textbox", { name: path, exact: true })
          .fill(source.content.replace("Monthly Revenue vs. Conversion Rate", "Agent and human confirmed"));
        await click("保存");
        await click("预览");
        await shown();
        await seek(8);
        expect(await frame().locator("h1").textContent()).toBe("Agent and human confirmed");
        edited = await runtime.execute("project_read", owner);
        expect(
          edited.files.filter((file, index) => file.content !== project.files[index]?.content).map((file) => file.path),
        ).toEqual([path]);
      }
      created.push(owner);
    }
    if (!edited) throw Error("missing edited template");
    report.edited = edited;
    report.templates = created;
    if (tools) {
      const owner = { sessionId: edited.sessionId, artifactId: edited.artifactId },
        intent = await runtime.execute("export_create", {
          ...owner,
          revision: edited.revision,
          requestId: randomUUID(),
          fps: { num: 12, den: 1 },
        });
      await expect
        .poll(async () => (await runtime!.execute("export_read", { ...owner, id: intent.id })).state, {
          timeout: 180000,
        })
        .toBe("succeeded");
      const job = await runtime.execute("export_read", { ...owner, id: intent.id }),
        ticket = await runtime.execute("export_download", { ...owner, id: intent.id }),
        bytes = Buffer.from(await (await fetch(ticket.url)).arrayBuffer());
      expect(`sha256:${createHash("sha256").update(bytes).digest("hex")}`).toBe(job.result?.verification.digest);
      expect(job.result?.verification.frames).toBe(180);
      expect(job.result?.spec).toMatchObject({ width: 1920, height: 1080, duration: 15 });
      await writeFile(join(evidence, "edited-template.mp4"), bytes);
      const playback = await page.context().newPage();
      try {
        await playback.setContent('<video width="960" height="540" muted controls></video>');
        await playback.evaluate((data) => {
          const bytes = Uint8Array.from(atob(data), (character) => character.charCodeAt(0));
          const element = document.querySelector("video")!;
          element.src = URL.createObjectURL(new Blob([bytes], { type: "video/mp4" }));
        }, bytes.toString("base64"));
        await playback.waitForFunction(() => (document.querySelector("video")?.readyState ?? 0) >= 2);
        const video = playback.locator("video");
        await video.evaluate((element) => (element as HTMLVideoElement).play());
        await expect
          .poll(() => video.evaluate((element) => (element as HTMLVideoElement).currentTime))
          .toBeGreaterThan(0.2);
        await video.evaluate((element) => {
          (element as HTMLVideoElement).pause();
          (element as HTMLVideoElement).currentTime = 7.5;
        });
        await expect
          .poll(() =>
            video.evaluate(
              (element) => !(element as HTMLVideoElement).seeking && (element as HTMLVideoElement).currentTime,
            ),
          )
          .toBe(7.5);
        report.playback = await video.evaluate((element) => ({
          width: (element as HTMLVideoElement).videoWidth,
          height: (element as HTMLVideoElement).videoHeight,
          duration: (element as HTMLVideoElement).duration,
          time: (element as HTMLVideoElement).currentTime,
        }));
        expect(report.playback).toMatchObject({ width: 1920, height: 1080, duration: 15, time: 7.5 });
        await video.screenshot({ path: join(evidence, "film-playback.png") });
      } finally {
        await playback.evaluate(() => URL.revokeObjectURL(document.querySelector("video")?.src ?? ""));
        await playback.close();
      }
      report.native = job;
    }
    expect(external.size).toBe(0);
    expect(failed).toEqual([]);
    expect(driver.errors).toEqual([]);
    await runtime.close();
    runtime = undefined;
    expect((await readDirectory(root)).manager.phase).toBe("closed");
    expect(await observeProcesses(root)).toEqual([]);
    runtime = await open({ root, scope, tools, version: "0.6.1-dev.1" });
    expect(
      await runtime.execute("project_read", { sessionId: edited.sessionId, artifactId: edited.artifactId }),
    ).toEqual(edited);
    const selection = (await runtime.execute("workspace_state", {})).selection,
      current = await runtime.execute("project_read", { sessionId: session.id, artifactId: selection.artifactId! });
    await runtime.execute("artifact_open", {
      sessionId: edited.sessionId,
      artifactId: edited.artifactId,
      requestId: randomUUID(),
      expectedSelection: selection.revision,
      expectedCurrent: { artifactId: current.artifactId, revision: current.revision },
    });
    await page.goto((await runtime.status()).web);
    await ready();
    await shown();
    await seek(8);
    expect(await frame().locator("h1").textContent()).toBe("Agent and human confirmed");
    await driver.capture("restored-template");
  } catch (error) {
    await driver?.capture("failure").catch(() => {});
    throw error;
  } finally {
    await driver?.close();
    await runtime?.close();
  }
  report.closed = (await readDirectory(root)).manager.phase;
  report.processes = await observeProcesses(root);
  await writeFile(join(evidence, "result.json"), JSON.stringify(report, null, 2));
}, 240000);
