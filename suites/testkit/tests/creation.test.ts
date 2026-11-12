import { randomUUID } from "node:crypto";
import { createReadStream } from "node:fs";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { browser } from "@odsuite/automation";
import { channel, digest, namespace } from "@odsuite/protocol";
import { source } from "@odsuite/serve";
import { managerEndpoint, observeProcesses, readDirectory, serve } from "@odsuite/sidecar";
import type { Tools } from "@open-motion/render";
import { open } from "@open-motion/standalone";
import { initialFiles } from "@open-motion/workspace/contract";
import { expect, it } from "vitest";

it("hands a verified remote template from guidance and Web creation to manual editing, offline recovery and an actual film", async () => {
  const evidence = fileURLToPath(new URL(`../../../.artifacts/creation/${randomUUID()}/`, import.meta.url)),
    fixtureRoot = join(evidence, "publication-sidecar"),
    root = join(evidence, "product-sidecar"),
    directory = join(evidence, "publication"),
    scope = { channel: channel("dev"), namespace: namespace("creation-acceptance") },
    fixtureScope = { channel: channel("dev"), namespace: namespace("publication-fixture") },
    resourceId = randomUUID();
  await mkdir(directory, { recursive: true });
  const report: Record<string, unknown> = { productionFeed: "not qualified; explicit loopback publication fixture" };
  const cleanupErrors: unknown[] = [];
  let fixture: Awaited<ReturnType<typeof serve>> | undefined,
    failure: unknown,
    runtime: Awaited<ReturnType<typeof open>> | undefined,
    driver: Awaited<ReturnType<typeof browser>> | undefined,
    fixtureClosed = false;
  try {
    fixture = await serve(managerEndpoint(fixtureRoot), { root: fixtureRoot });
    let origin = "",
      filesRead = 0,
      catalogsRead = 0,
      publicationAvailable = false,
      publicationVersion = 1;
    const files = initialFiles().map((file) => ({
        ...file,
        content: file.content
          .replace('data-duration="5"', 'data-duration="2"')
          .replace("duration:5", "duration:2")
          .replace(
            "<head>",
            "<head><style>html,body{margin:0;width:1920px;height:1080px;background:#164080;color:white}main{width:1920px;height:1080px}h1{margin:0;padding:120px;font:96px sans-serif}</style>",
          )
          .replace(
            "</main>",
            '<h1 id="caption" class="clip" data-start="0" data-duration="2" data-track-index="0">Prism accepted source</h1></main>',
          ),
      })),
      manifest = files.map((file) => ({
        path: file.path,
        bytes: Buffer.byteLength(file.content),
        sha256: digest(file.content).slice("sha256:".length),
      })),
      publication = () => ({
        resourceId,
        environment: "prod",
        channel: "default",
        publicationId: `creation-acceptance-${publicationVersion}`,
        defaultLocale: "zh-CN",
        content: {
          "zh-CN": {
            templates: [
              {
                templateId: "creation-acceptance",
                sortOrder: 0,
                original: {
                  templateName: "Verified Prism starter",
                  summary: "A finite native project for shared creation acceptance",
                  sourceUrl: "https://example.com/creation-acceptance",
                  license: "Apache-2.0",
                },
                files: manifest.map((file) => ({ ...file, url: `${origin}/files/${file.sha256}` })),
              },
              {
                templateId: "unsupported-video",
                sortOrder: 1,
                original: { templateName: "Unsupported video starter", license: "Apache-2.0" },
                files: [
                  ...manifest.map((file) => ({ ...file, url: `${origin}/files/${file.sha256}` })),
                  { path: "clip.mp4", bytes: 1, sha256: "0".repeat(64), url: `${origin}/files/video` },
                ],
              },
            ],
          },
        },
      }),
      documents = Object.fromEntries([
        [
          `/resources/${resourceId}/channels/default/main.json`,
          () => {
            catalogsRead++;
            if (!publicationAvailable) throw Error("publication fixture unavailable");
            return { type: "application/json", body: JSON.stringify(publication()) };
          },
        ],
        ...files.map((file, index) => [
          `/files/${manifest[index]!.sha256}`,
          () => {
            filesRead++;
            return { type: "text/plain; charset=utf-8", body: file.content };
          },
        ]),
      ]);
    const hosted = await source(fixture.factory(fixtureScope), { name: "publication", directory, documents });
    origin = hosted.endpoint.url;
    const prism = { origin, environment: "prod" as const, resourceId, channel: "default", locale: "zh-CN" };
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
    runtime = await open({ root, scope, prism, tools, version: "0.6.1-dev.1" });
    const unavailable = await runtime.execute("template_list", {});
    expect(unavailable.templates).toHaveLength(3);
    expect(unavailable.catalog).toBeNull();
    expect(unavailable.catalogError).toBeTruthy();
    publicationAvailable = true;
    const session = await runtime.execute("session_create", {
      requestId: randomUUID(),
      title: "Shared creation acceptance",
      mode: "motion",
    });
    const firstContext = await runtime.execute("artifact_create", {
      requestId: randomUUID(),
      sessionId: session.id,
      title: session.title,
      files: initialFiles(),
    });
    await runtime.execute("session_open", {
      requestId: randomUUID(),
      sessionId: session.id,
      expectedSelection: 0,
      expectedCurrent: null,
    });
    const web = (await runtime.status()).web,
      bootstrap = await (await fetch(`${web}/bootstrap.json`)).json(),
      headers = { authorization: `Bearer ${bootstrap.token}` },
      guidance = (await (await fetch(`${bootstrap.daemon}/guidance`, { headers })).json()) as {
        name: string;
        uri: string;
        contentHash: string;
      }[];
    expect(guidance.map((entry) => entry.name)).toEqual(expect.arrayContaining(["production", "director", "recreate"]));
    expect(guidance.length).toBeGreaterThanOrEqual(25);
    for (const entry of guidance) {
      const body = await (await fetch(`${bootstrap.daemon}/guidance/${entry.name}`, { headers })).json();
      expect(body.documentId).toBe(entry.uri);
      expect(digest(body.content)).toBe(entry.contentHash);
      for (const reference of body.references) expect(guidance.some((item) => item.uri === reference)).toBe(true);
    }
    const catalog = await runtime.execute("template_list", {}),
      unsupported = catalog.catalog?.entries.find((entry) => entry.availability === "unsupported");
    expect((await runtime.status()).manifest.channel).toBe("dev");
    expect(catalog.catalog).toMatchObject({ environment: "prod", channel: "default" });
    report.identity = {
      productChannel: "dev",
      namespace: scope.namespace,
      publicationEnvironment: "prod",
      publicationChannel: "default",
    };
    let remote = catalog.catalog?.entries.find((entry) => entry.title === "Verified Prism starter");
    if (!remote) throw Error("remote template was not discovered");
    expect(remote.availability).toBe("source-required");
    expect(filesRead).toBe(0);
    driver = await browser({ evidence, viewport: { width: 1600, height: 1100 } });
    const page = driver.page;
    const ready = () =>
      page
        .locator("[aria-live]")
        .filter({ hasText: /^就绪$/ })
        .waitFor();
    const shown = () => page.getByLabel("预览状态", { exact: true }).filter({ hasText: "预览就绪" }).waitFor();
    await page.goto(web);
    await ready();
    await page.getByRole("button", { name: "新建项目", exact: true }).click();
    const panel = page.getByLabel("原生模板", { exact: true });
    await panel.locator("summary").click();
    await expect.poll(() => panel.getByLabel("模板", { exact: true }).locator("option").count()).toBe(5);
    if (!unsupported) throw Error("unsupported resources were not classified");
    await panel.getByLabel("模板", { exact: true }).selectOption(unsupported.id);
    await expect.poll(() => panel.getByRole("button", { name: "创建模板项目", exact: true }).isDisabled()).toBe(true);
    await panel.getByLabel("模板", { exact: true }).selectOption(remote.id);
    await panel.getByLabel("模板项目标题", { exact: true }).fill("Prism handoff");
    const second = await runtime.execute("session_create", {
      requestId: randomUUID(),
      title: "Other template draft",
      mode: "motion",
    });
    const secondContext = await runtime.execute("artifact_create", {
      requestId: randomUUID(),
      sessionId: second.id,
      title: second.title,
      files: initialFiles(),
    });
    const chooseSession = async (title: string) => {
      await page.keyboard.press("Escape");
      await page.getByRole("button", { name: "打开项目列表", exact: true }).click();
      await page
        .getByRole("navigation", { name: "项目", exact: true })
        .getByRole("button", { name: title, exact: true })
        .click();
      await ready();
      await page.getByRole("button", { name: "新建项目", exact: true }).click();
    };
    await chooseSession(second.title);
    await panel.getByLabel("模板", { exact: true }).selectOption("nyt-graph");
    await panel.getByLabel("模板项目标题", { exact: true }).fill("Session B draft");
    await chooseSession(session.title);
    await expect.poll(() => panel.getByLabel("模板", { exact: true }).inputValue()).toBe(remote.id);
    await expect.poll(() => panel.getByLabel("模板项目标题", { exact: true }).inputValue()).toBe("Prism handoff");
    const priorHash = remote.contentHash;
    publicationVersion = 2;
    await panel.getByRole("button", { name: "刷新模板", exact: true }).click();
    await expect.poll(() => panel.getByLabel("模板目录状态").textContent()).toContain("creation-acceptance-2");
    await expect.poll(() => panel.getByRole("button", { name: "创建模板项目", exact: true }).isDisabled()).toBe(true);
    await expect
      .poll(() => panel.getByText("所选模板版本已变化或不可用，请重新选择", { exact: true }).isVisible())
      .toBe(true);
    await expect.poll(() => panel.getByLabel("模板项目标题", { exact: true }).inputValue()).toBe("Prism handoff");
    await chooseSession(second.title);
    await expect.poll(() => panel.getByLabel("模板", { exact: true }).inputValue()).toBe("nyt-graph");
    await expect.poll(() => panel.getByLabel("模板项目标题", { exact: true }).inputValue()).toBe("Session B draft");
    await chooseSession(session.title);
    await expect.poll(() => panel.getByRole("button", { name: "创建模板项目", exact: true }).isDisabled()).toBe(true);
    await expect.poll(() => panel.getByLabel("模板项目标题", { exact: true }).inputValue()).toBe("Prism handoff");
    const refreshed = await runtime.execute("template_list", {});
    remote = refreshed.catalog?.entries.find((entry) => entry.id === remote!.id);
    if (!remote) throw Error("updated publication lost its stable template identity");
    expect(remote.contentHash).not.toBe(priorHash);
    expect(filesRead).toBe(0);
    await panel.getByLabel("模板", { exact: true }).selectOption(remote.id);
    let lost = false;
    await page.route("**/api/template_create", async (route) => {
      try {
        if (route.request().method() !== "POST") return await route.continue();
        const response = await route.fetch();
        const result = await response.json();
        report.creationResponse = { status: response.status(), artifactId: result.id, error: result.error };
        if (!response.ok()) return await route.fulfill({ response });
        if (!lost) {
          lost = true;
          await response.body();
          await route.abort("failed");
        } else await route.fulfill({ response });
      } catch (error) {
        // Playwright request errors include headers; retain only their diagnostic first line.
        cleanupErrors.push(new Error(`Template interception: ${(error as Error).message.split("\n")[0]}`));
        await route.abort("failed").catch(() => {});
      }
    });
    await panel.getByRole("button", { name: "创建模板项目", exact: true }).click();
    await expect.poll(() => report.creationResponse, { timeout: 15000 }).toBeDefined();
    expect(lost, JSON.stringify(report.creationResponse)).toBe(true);
    await expect.poll(() => page.getByRole("button", { name: "继续创建", exact: true }).isEnabled()).toBe(true);
    const createdProjects = (await runtime.execute("project_list", { query: "Prism handoff" })).projects;
    expect(createdProjects).toHaveLength(1);
    const creationSession = createdProjects[0]!.sessionId;
    expect(creationSession).not.toBe(session.id);
    expect((await runtime.execute("session_get", { sessionId: session.id })).artifacts.map((item) => item.id)).toEqual([
      firstContext.id,
    ]);
    expect((await runtime.execute("session_get", { sessionId: second.id })).artifacts.map((item) => item.id)).toEqual([
      secondContext.id,
    ]);
    await fixture.close();
    fixtureClosed = true;
    const downloads = filesRead;
    await page.getByRole("button", { name: "继续创建", exact: true }).click();
    await ready();
    await shown();
    expect(filesRead).toBe(downloads);
    const detail = await runtime.execute("session_get", { sessionId: creationSession });
    expect(detail.artifacts).toHaveLength(1);
    const owner = { sessionId: creationSession, artifactId: detail.artifacts[0]!.id },
      project = await runtime.execute("project_read", owner),
      entry = project.files.find((file) => file.path === "index.html")!;
    await page.getByRole("tab", { name: "文件", exact: true }).click();
    await page.getByRole("button", { name: "index.html", exact: true }).click();
    await page
      .getByRole("textbox", { name: "index.html", exact: true })
      .fill(entry.content.replace("Prism accepted source", "Prism human confirmed"));
    await page.getByRole("button", { name: "保存", exact: true }).click();
    await ready();
    await page.getByRole("button", { name: "预览", exact: true }).click();
    await shown();
    expect(await page.frameLocator("iframe:not([hidden])").locator("h1").textContent()).toBe("Prism human confirmed");
    const saved = await runtime.execute("project_read", owner);
    await driver.capture("edited-remote-template");
    report.source = { id: remote.id, contentHash: remote.contentHash, revision: saved.revision };
    report.guidance = guidance.map(({ name, contentHash }) => ({ name, contentHash }));
    report.requests = { catalogs: catalogsRead, files: filesRead };
    if (tools) {
      const job = await runtime.execute("export_create", {
        ...owner,
        requestId: randomUUID(),
        revision: saved.revision,
        fps: { num: 12, den: 1 },
      });
      await expect
        .poll(async () => (await runtime!.execute("export_read", { ...owner, id: job.id })).state, {
          timeout: 180000,
        })
        .toBe("succeeded");
      const result = await runtime.execute("export_read", { ...owner, id: job.id }),
        ticket = await runtime.execute("export_download", { ...owner, id: job.id }),
        bytes = Buffer.from(await (await fetch(ticket.url)).arrayBuffer());
      expect(digest(bytes)).toBe(result.result?.verification.digest);
      expect(result.result?.spec).toMatchObject({ width: 1920, height: 1080, duration: 2, frames: 24 });
      await writeFile(join(evidence, "remote-template.mp4"), bytes);
      report.native = result;
      const playback = await page.context().newPage();
      try {
        await playback.setContent('<video width="960" height="540" muted controls></video>');
        await playback.evaluate((data) => {
          const bytes = Uint8Array.from(atob(data), (character) => character.charCodeAt(0));
          document.querySelector("video")!.src = URL.createObjectURL(new Blob([bytes], { type: "video/mp4" }));
        }, bytes.toString("base64"));
        await playback.waitForFunction(() => (document.querySelector("video")?.readyState ?? 0) >= 2);
        const video = playback.locator("video");
        await video.evaluate((element) => (element as HTMLVideoElement).play());
        await expect
          .poll(() => video.evaluate((element) => (element as HTMLVideoElement).currentTime))
          .toBeGreaterThan(0.1);
        await video.evaluate((element) => {
          (element as HTMLVideoElement).pause();
          (element as HTMLVideoElement).currentTime = 1;
        });
        await expect
          .poll(() =>
            video.evaluate(
              (element) => !(element as HTMLVideoElement).seeking && (element as HTMLVideoElement).currentTime,
            ),
          )
          .toBe(1);
        report.playback = await video.evaluate((element) => ({
          width: (element as HTMLVideoElement).videoWidth,
          height: (element as HTMLVideoElement).videoHeight,
          duration: (element as HTMLVideoElement).duration,
          time: (element as HTMLVideoElement).currentTime,
        }));
        expect(report.playback).toEqual({ width: 1920, height: 1080, duration: 2, time: 1 });
        const decodedCaptionPixels = () =>
          video.evaluate((element) => {
            const canvas = document.createElement("canvas");
            canvas.width = 1200;
            canvas.height = 160;
            const context = canvas.getContext("2d")!;
            context.drawImage(element as HTMLVideoElement, 100, 100, 1200, 160, 0, 0, 1200, 160);
            const pixels = context.getImageData(0, 0, 1200, 160).data;
            let bright = 0;
            for (let i = 0; i < pixels.length; i += 4)
              if (pixels[i]! > 220 && pixels[i + 1]! > 220 && pixels[i + 2]! > 220) bright++;
            return bright;
          });
        await expect.poll(decodedCaptionPixels).toBeGreaterThan(5000);
        report.decodedCaptionPixels = await decodedCaptionPixels();
        await video.screenshot({ path: join(evidence, "film-playback.png") });
      } finally {
        await playback.evaluate(() => URL.revokeObjectURL(document.querySelector("video")?.src ?? ""));
        await playback.close();
      }
    } else report.native = "unqualified without explicit native seed manifest";
    await runtime.close();
    runtime = undefined;
    expect((await readDirectory(root)).manager.phase).toBe("closed");
    expect(await observeProcesses(root)).toEqual([]);
    runtime = await open({ root, scope, prism, tools, version: "0.6.1-dev.1" });
    expect(await runtime.execute("project_read", owner)).toEqual(saved);
    await page.goto((await runtime.status()).web);
    await ready();
    await shown();
    expect(await page.frameLocator("iframe:not([hidden])").locator("h1").textContent()).toBe("Prism human confirmed");
    await driver.capture("cold-restored-remote-template");
    expect(driver.errors).toEqual([]);
  } catch (error) {
    failure = error;
    await driver?.capture("failure").catch(() => {});
  } finally {
    for (const close of [
      () => driver?.page.unrouteAll({ behavior: "wait" }),
      () => driver?.close(),
      () => runtime?.close(),
      () => !fixtureClosed && fixture?.close(),
    ]) {
      try {
        await close();
      } catch (error) {
        cleanupErrors.push(error);
      }
    }
    for (const [key, owned] of [
      ["product", root],
      ["publication", fixtureRoot],
    ] as const) {
      try {
        report[key] = { phase: (await readDirectory(owned)).manager.phase, processes: await observeProcesses(owned) };
      } catch (error) {
        report[key] = { observation: "unknown", error: (error as Error).message };
        cleanupErrors.push(error);
      }
    }
    if (failure) report.failure = (failure as Error).message;
    if (cleanupErrors.length) report.cleanupErrors = cleanupErrors.map((error) => String(error));
    await writeFile(join(evidence, "result.json"), JSON.stringify(report, null, 2));
  }
  if (failure || cleanupErrors.length)
    throw new AggregateError(
      [...(failure ? [failure] : []), ...cleanupErrors],
      "Combined creation failed; evidence retained",
    );
  expect(report.product).toEqual({ phase: "closed", processes: [] });
  expect(report.publication).toEqual({ phase: "closed", processes: [] });
}, 240000);
