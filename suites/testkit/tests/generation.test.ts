import { randomUUID } from "node:crypto";
import { createReadStream } from "node:fs";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { createServer } from "node:http";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { browser } from "@odsuite/automation";
import { channel, digest, namespace } from "@odsuite/protocol";
import { managerEndpoint, observeProcesses, readDirectory, serve } from "@odsuite/sidecar";
import type { Provider } from "@open-motion/gateway";
import type { GenerationInput } from "@open-motion/gateway/contract";
import type { Tools } from "@open-motion/render";
import { open } from "@open-motion/standalone";
import { initialFiles } from "@open-motion/workspace/contract";
import { PNG } from "pngjs";
import { expect, it } from "vitest";

// Public OS/network/persistence readiness has a finite budget above the provider polling period.
const poll = <T>(read: () => T | Promise<T>, options = { timeout: 10000 }) => expect.poll(read, options);

it("hands a generated PNG from unknown Web responses to explicit adoption, manual insertion and a persistent native film", async () => {
  const evidence = fileURLToPath(new URL(`../../../.artifacts/generation-web/${randomUUID()}/`, import.meta.url)),
    root = join(evidence, "product"),
    fixtureRoot = join(evidence, "fixture"),
    scope = { channel: channel("dev"), namespace: namespace("generation-web") },
    report: Record<string, unknown> = { proof: "loopback provider protocol/lifecycle; no actual model execution" };
  await mkdir(evidence, { recursive: true });
  const image = new PNG({ width: 256, height: 256 });
  let seed = 29;
  for (let offset = 0; offset < image.data.length; offset += 4) {
    for (let color = 0; color < 3; color++) {
      seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
      image.data[offset + color] = seed >>> 24;
    }
    image.data[offset + 3] = 255;
  }
  for (let y = 0; y < 64; y++)
    for (let x = 0; x < 64; x++) {
      const offset = (y * image.width + x) * 4;
      image.data.set([0, 240, 0, 255], offset);
    }
  const png = PNG.sync.write(image),
    hash = digest(png);
  expect(png.length).toBeGreaterThan(65536);
  const fixture = await serve(managerEndpoint(fixtureRoot), { root: fixtureRoot });
  let origin = "",
    online = true,
    submits = 0,
    reads = 0;
  const submitted: unknown[] = [],
    cleanupErrors: unknown[] = [];
  const remote = createServer(async (request, response) => {
    if (!online) {
      response.writeHead(503);
      response.end();
      return;
    }
    if (request.url === "/submit" && request.method === "POST") {
      const chunks: Buffer[] = [];
      for await (const chunk of request) chunks.push(Buffer.from(chunk));
      submitted.push(JSON.parse(Buffer.concat(chunks).toString("utf8")));
      submits++;
      response.setHeader("content-type", "application/json");
      response.end(JSON.stringify({ remoteId: "web-png" }));
    } else if (request.url === "/read/web-png") {
      reads++;
      response.setHeader("content-type", "image/png");
      response.end(png);
    } else {
      response.writeHead(404);
      response.end();
    }
  });
  const gateway: Provider = {
    id: "fixture",
    version: "1",
    models: [{ id: "png", label: "Loopback PNG" }],
    submit: async (input, signal) => {
      const response = await fetch(`${origin}/submit`, { method: "POST", body: JSON.stringify(input), signal });
      if (!response.ok) throw Error("fixture unavailable");
      return response.json();
    },
    read: async (id, signal) => {
      const response = await fetch(`${origin}/read/${id}`, { signal });
      if (!response.ok) throw Error("fixture unavailable");
      return { state: "succeeded", bytes: new Uint8Array(await response.arrayBuffer()) };
    },
    cancel: async () => ({ confirmed: false }),
  };
  let runtime: Awaited<ReturnType<typeof open>> | undefined,
    driver: Awaited<ReturnType<typeof browser>> | undefined,
    failure: unknown;
  try {
    await fixture.expose({
      identity: { ...scope, service: "provider", generation: digest("web-provider") },
      handlers: {},
      lifecycle: {
        initialize: async (context) => {
          const socket = await context.allocate({ kind: "socket", name: "provider" }),
            port = await context.allocate({ kind: "port", name: "provider", scheme: "http" });
          await new Promise<void>((done) => remote.listen(socket.value, done));
          await context.forward(port.value, socket.value);
          origin = port.value;
        },
        stop: () => new Promise<void>((done, reject) => remote.close((error) => (error ? reject(error) : done()))),
      },
    });
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
    runtime = await open({ root, scope, gateway, tools, version: "0.6.1-dev.1" });
    const session = await runtime.execute("session_create", {
        requestId: randomUUID(),
        title: "PNG handoff",
        mode: "motion",
      }),
      artifact = await runtime.execute("artifact_create", {
        requestId: randomUUID(),
        sessionId: session.id,
        title: "PNG project",
        files: initialFiles().map((file) => ({
          ...file,
          content: file.content.replace('data-duration="5"', 'data-duration="2"').replace("duration:5", "duration:2"),
        })),
      }),
      owner = { sessionId: session.id, artifactId: artifact.id },
      original = await runtime.execute("project_read", owner);
    await runtime.execute("artifact_open", {
      ...owner,
      requestId: randomUUID(),
      expectedSelection: 0,
      expectedCurrent: null,
    });
    const selected = await runtime.execute("workspace_state", {});
    driver = await browser({ evidence, viewport: { width: 1600, height: 1100 } });
    const page = driver.page,
      ready = () =>
        page
          .locator("[aria-live]")
          .filter({ hasText: /^就绪$/ })
          .waitFor(),
      shown = () => page.getByLabel("预览状态", { exact: true }).filter({ hasText: "预览就绪" }).waitFor();
    await page.goto((await runtime.status()).web);
    await ready();
    await shown();
    await page.getByRole("tab", { name: "媒体", exact: true }).click();
    const panel = page.getByLabel("PNG 素材生成", { exact: true });
    await panel.locator("summary").click();
    await panel.getByLabel("图片生成模型", { exact: true }).selectOption(JSON.stringify(["fixture", "1", "png"]));
    await panel.getByLabel("图片描述", { exact: true }).fill("Actual PNG candidate 界🙂 with durable handoff");
    const createRequests: unknown[] = [];
    let create: GenerationInput<"generation_create"> | undefined;
    await page.route("**/api/generation_create", async (route) => {
      createRequests.push(route.request().postDataJSON());
      const response = await route.fetch();
      if (!create) {
        expect(response.ok()).toBe(true);
        await response.body();
        create = route.request().postDataJSON();
        await route.abort("failed");
      } else await route.fulfill({ response });
    });
    await panel.getByRole("button", { name: "生成新的 PNG 候选", exact: true }).click();
    await panel.getByRole("button", { name: "重试同一素材提交", exact: true }).waitFor();
    await panel.getByRole("button", { name: "重试同一素材提交", exact: true }).click();
    await poll(() => createRequests.length).toBe(2);
    expect(createRequests[1]).toEqual(createRequests[0]);
    expect(submits).toBe(1);
    expect(submitted).toEqual([create]);
    const card = panel.locator('[data-generation-state="succeeded"]');
    await card.waitFor();
    const id = await card.getAttribute("data-generation-id");
    if (!id || !create) throw Error("committed task identity missing");
    const job = { ...owner, id },
      result = await runtime.execute("generation_result", job);
    expect(result.candidate).toMatchObject({ contentHash: hash, bytes: png.length, width: 256, height: 256 });
    expect(await runtime.execute("project_read", owner)).toEqual(original);
    expect(await runtime.execute("workspace_state", {})).toEqual(selected);
    await card.getByRole("button", { name: "预览 PNG 候选", exact: true }).click();
    const candidate = panel.getByRole("img", { name: `PNG 候选：${create.prompt}`, exact: true });
    await poll(() => candidate.evaluate((element) => (element as HTMLImageElement).naturalWidth)).toBe(256);
    expect(
      await candidate.evaluate((element) => {
        const canvas = document.createElement("canvas");
        canvas.width = canvas.height = 256;
        const context = canvas.getContext("2d")!;
        context.drawImage(element as HTMLImageElement, 0, 0);
        return [...context.getImageData(16, 16, 1, 1).data];
      }),
    ).toEqual([0, 240, 0, 255]);
    await driver.capture("verified-candidate-before-adoption");
    const adopts: GenerationInput<"generation_adopt">[] = [];
    await page.route("**/api/generation_adopt", async (route) => {
      adopts.push(route.request().postDataJSON());
      const response = await route.fetch();
      if (adopts.length === 1) {
        expect(response.ok()).toBe(true);
        await response.body();
        await route.abort("failed");
      } else await route.fulfill({ response });
    });
    await card.getByRole("button", { name: "采用为工程资源", exact: true }).click();
    const retry = page.getByRole("button", { name: "重试", exact: true });
    await retry.waitFor();
    await retry.click();
    await ready();
    await poll(() => adopts.length).toBe(2);
    expect(adopts[1]).toEqual(adopts[0]);
    const adopted = await runtime.execute("project_read", owner);
    expect(adopted.files).toEqual(original.files);
    expect(adopted.resources).toHaveLength(1);
    await expect(
      runtime.execute("generation_adopt", { ...adopts[0]!, requestId: randomUUID(), path: "assets/stale.png" }),
    ).rejects.toThrow();
    const other = await runtime.execute("session_create", { requestId: randomUUID(), title: "Other", mode: "motion" });
    await expect(runtime.execute("generation_result", { ...job, sessionId: other.id })).rejects.toThrow();
    expect(await runtime.execute("project_read", owner)).toEqual(adopted);
    await page.getByRole("button", { name: `插入 PNG ${id.slice(0, 8)}`, exact: true }).click();
    await ready();
    await shown();
    const frame = () => page.frameLocator("iframe:not([hidden])");
    await poll(() => frame().locator("img").count()).toBe(1);
    expect(
      await frame()
        .locator("img")
        .evaluate((element) => (element as HTMLImageElement).naturalWidth),
    ).toBe(256);
    await page.getByRole("tab", { name: "文件", exact: true }).click();
    await page.getByRole("button", { name: "index.html", exact: true }).click();
    const inserted = await runtime.execute("project_read", owner),
      entry = inserted.files.find((file) => file.path === "index.html");
    if (!entry) throw Error("source missing");
    await page
      .getByRole("textbox", { name: "index.html", exact: true })
      .fill(entry.content.replace("</main>", '<h1 data-start="0" data-duration="2">PNG human confirmed</h1></main>'));
    await page.getByRole("button", { name: "保存", exact: true }).click();
    await ready();
    await page.getByRole("button", { name: "预览", exact: true }).click();
    await shown();
    const saved = await runtime.execute("project_read", owner);
    expect(await runtime.execute("generation_adopt", adopts[0]!)).toEqual(adopted);
    expect(await runtime.execute("project_read", owner)).toEqual(saved);
    expect(await frame().locator("h1").textContent()).toBe("PNG human confirmed");
    await page.getByLabel("定位秒", { exact: true }).fill("1");
    await page.getByRole("button", { name: "定位", exact: true }).click();
    await ready();
    await poll(() =>
      frame()
        .locator("body")
        .evaluate(() => Reflect.get(window, "__timelines").main.time()),
    ).toBeCloseTo(1, 2);
    await driver.capture("generated-png-manual-handoff");
    report.task = {
      id,
      submits,
      reads,
      pngBytes: png.length,
      hash,
      createUnknownRetry: true,
      adoptUnknownRetry: true,
      finalRevision: saved.revision,
    };
    if (tools) {
      const film = await runtime.execute("export_create", {
        ...owner,
        requestId: randomUUID(),
        revision: saved.revision,
        fps: { num: 12, den: 1 },
      });
      await poll(async () => (await runtime!.execute("export_read", { ...owner, id: film.id })).state, {
        timeout: 180000,
      }).toBe("succeeded");
      const exported = await runtime.execute("export_read", { ...owner, id: film.id }),
        ticket = await runtime.execute("export_download", { ...owner, id: film.id }),
        bytes = Buffer.from(await (await fetch(ticket.url)).arrayBuffer());
      expect(digest(bytes)).toBe(exported.result?.verification.digest);
      expect(exported.result?.spec).toMatchObject({ width: 1920, height: 1080, duration: 2, frames: 24 });
      await writeFile(join(evidence, "generated-png.mp4"), bytes);
      report.native = exported;
      const playback = await page.context().newPage();
      try {
        await playback.setContent('<video muted controls width="960" height="540"></video>');
        await playback.evaluate((data) => {
          const bytes = Uint8Array.from(atob(data), (c) => c.charCodeAt(0));
          document.querySelector("video")!.src = URL.createObjectURL(new Blob([bytes], { type: "video/mp4" }));
        }, bytes.toString("base64"));
        await playback.waitForFunction(() => (document.querySelector("video")?.readyState ?? 0) >= 2);
        const video = playback.locator("video");
        await video.evaluate((element) => (element as HTMLVideoElement).play());
        await poll(() => video.evaluate((element) => (element as HTMLVideoElement).currentTime)).toBeGreaterThan(0.1);
        await video.evaluate((element) => {
          (element as HTMLVideoElement).pause();
          (element as HTMLVideoElement).currentTime = 1;
        });
        await poll(() =>
          video.evaluate(
            (element) => !(element as HTMLVideoElement).seeking && (element as HTMLVideoElement).currentTime,
          ),
        ).toBe(1);
        const greenPixels = await video.evaluate((element) => {
          const canvas = document.createElement("canvas");
          canvas.width = 1920;
          canvas.height = 1080;
          const context = canvas.getContext("2d")!;
          context.drawImage(element as HTMLVideoElement, 0, 0);
          const pixels = context.getImageData(0, 0, canvas.width, canvas.height).data;
          let green = 0;
          for (let i = 0; i < pixels.length; i += 4)
            if (pixels[i]! < 60 && pixels[i + 1]! > 180 && pixels[i + 2]! < 60) green++;
          return green;
        });
        expect(greenPixels).toBeGreaterThan(1000);
        report.decodedCandidatePixels = greenPixels;
        await video.screenshot({ path: join(evidence, "actual-film-candidate.png") });
      } finally {
        await playback.evaluate(() => URL.revokeObjectURL(document.querySelector("video")?.src ?? ""));
        await playback.close();
      }
    } else report.native = "unqualified without explicit native seed manifest";
    await page.unrouteAll({ behavior: "wait" });
    await runtime.close();
    runtime = undefined;
    expect((await readDirectory(root)).manager.phase).toBe("closed");
    expect(await observeProcesses(root)).toEqual([]);
    online = false;
    const counts = { submits, reads };
    runtime = await open({ root, scope, tools, version: "0.6.1-dev.1" });
    expect(await runtime.execute("generation_status", {})).toMatchObject({ configured: false });
    expect(await runtime.execute("generation_result", job)).toEqual(result);
    expect(await runtime.execute("generation_adopt", adopts[0]!)).toEqual(adopted);
    expect(await runtime.execute("generation_create", create)).toMatchObject({ id });
    expect(await runtime.execute("project_read", owner)).toEqual(saved);
    expect({ submits, reads }).toEqual(counts);
    await page.goto((await runtime.status()).web);
    await ready();
    await shown();
    expect(await frame().locator("h1").textContent()).toBe("PNG human confirmed");
    expect(
      await frame()
        .locator("img")
        .evaluate((element) => (element as HTMLImageElement).naturalWidth),
    ).toBe(256);
    await driver.capture("cold-restored-generated-png");
    expect(driver.errors).toEqual([]);
  } catch (error) {
    failure = error;
    await driver?.capture("failure").catch(() => {});
  } finally {
    for (const finish of [
      () => driver?.page.unrouteAll({ behavior: "wait" }),
      () => driver?.close(),
      () => runtime?.close(),
      () => fixture.close(),
    ]) {
      try {
        await finish();
      } catch (error) {
        cleanupErrors.push(error);
      }
    }
    for (const [name, path] of [
      ["product", root],
      ["fixture", fixtureRoot],
    ] as const) {
      try {
        report[name] = { phase: (await readDirectory(path)).manager.phase, processes: await observeProcesses(path) };
      } catch (error) {
        report[name] = { observation: "unknown" };
        cleanupErrors.push(error);
      }
    }
    if (failure) report.failure = String(failure);
    if (cleanupErrors.length) report.cleanupErrors = cleanupErrors.map(String);
    await writeFile(join(evidence, "result.json"), JSON.stringify(report, null, 2));
  }
  if (failure || cleanupErrors.length)
    throw new AggregateError(
      [...(failure ? [failure] : []), ...cleanupErrors],
      "Generation Web acceptance failed; evidence retained",
    );
  expect(report.product).toEqual({ phase: "closed", processes: [] });
  expect(report.fixture).toEqual({ phase: "closed", processes: [] });
}, 240000);
