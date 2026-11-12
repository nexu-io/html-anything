// @vitest-environment node
import { createHash, randomUUID } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { browser } from "@odsuite/automation";
import { channel, digest, namespace } from "@odsuite/protocol";
import { source } from "@odsuite/serve";
import { managerEndpoint, observeProcesses, readDirectory, serve } from "@odsuite/sidecar";
import { serve as daemonServe } from "@open-motion/daemon";
import { Client } from "@open-motion/daemon/client";
import { initialFiles } from "@open-motion/workspace/contract";
import { expect, it } from "vitest";
import type { Config } from "@";

it("downloads the saved native revision and imports the real ZIP once through a lost creation response, retaining later edits after restart", async () => {
  const evidence = fileURLToPath(new URL(`../../../../.artifacts/archive-browser/${randomUUID()}/`, import.meta.url)),
    root = join(evidence, "sidecar"),
    report: Record<string, unknown> = {};
  await mkdir(evidence, { recursive: true });
  let manager = await serve(managerEndpoint(root), { root }),
    driver: Awaited<ReturnType<typeof browser>> | undefined,
    api: Client | undefined,
    url = "";
  const start = async () => {
    let config: Config | undefined, daemon: Awaited<ReturnType<typeof daemonServe>> | undefined;
    const factory = manager.factory({ channel: channel("dev"), namespace: namespace("archivebrowser") }),
      web = await source(factory, {
        name: "web",
        directory: fileURLToPath(new URL("../../dist/", import.meta.url)),
        documents: {
          "/bootstrap.json": () => {
            if (!config) throw Error("not ready");
            return { type: "application/json", body: JSON.stringify(config) };
          },
        },
      });
    url = web.endpoint.url;
    await factory.expose({
      identity: { service: "daemon", generation: digest("archive browser") },
      handlers: {},
      lifecycle: {
        initialize: async (context) => {
          const socket = await context.allocate({ kind: "socket", name: "daemon" }),
            port = await context.allocate({ kind: "port", name: "daemon", scheme: "http" });
          daemon = await daemonServe({
            data: context.roots.data,
            origin: url,
            socket: socket.value,
            token: "archive-browser-fixture",
            endpoint: port.value,
          });
          await context.forward(port.value, socket.value);
          config = {
            daemon: port.value,
            token: "archive-browser-fixture",
            environment: {
              schema: 1,
              carrier: "browser-fixture",
              system: { platform: process.platform, arch: process.arch, release: "test" },
              runtime: { name: "node", version: process.versions.node },
            },
          };
          api = new Client(port.value, config.token);
        },
        quiesce: async () => daemon?.quiesce(),
        stop: async () => daemon?.close(),
      },
    });
  };
  const client = () => {
    if (!api) throw Error("api not ready");
    return api;
  };
  try {
    await start();
    const session = await client().execute("session_create", {
        requestId: randomUUID(),
        title: "ZIP workspace",
        mode: "motion",
      }),
      original = await client().execute("artifact_create", {
        requestId: randomUUID(),
        sessionId: session.id,
        title: "Original",
        files: initialFiles(),
      }),
      owner = { sessionId: session.id, artifactId: original.id },
      before = await client().execute("project_read", owner);
    await client().execute("artifact_open", {
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
          .waitFor();
    page.setDefaultTimeout(8000);
    await page.goto(url);
    await ready();
    if ((await page.getByRole("button", { name: "源码", exact: true }).getAttribute("aria-pressed")) !== "true") {
      await page.getByRole("button", { name: "源码", exact: true }).click();
      await ready();
    }
    const savedContent = `${before.files.find((file) => file.path === "index.html")!.content}\n<!-- saved before ZIP -->`;
    await page.getByRole("textbox", { name: "index.html", exact: true }).fill(savedContent);
    await page
      .locator("summary")
      .filter({ hasText: /^工程 ZIP$/ })
      .click();
    const downloading = page.waitForEvent("download");
    await page.getByRole("button", { name: "下载工程 ZIP", exact: true }).click();
    const download = await downloading,
      archivePath = join(evidence, "project.zip");
    await download.saveAs(archivePath);
    await ready();
    expect(await download.failure()).toBeNull();
    const bytes = await readFile(archivePath),
      identity = `sha256:${createHash("sha256").update(bytes).digest("hex")}`,
      frozen = await client().execute("project_read", owner);
    expect(frozen.files.find((file) => file.path === "index.html")?.content).toBe(savedContent);
    let lost = false;
    const requests: { requestId: string; uploadId?: string }[] = [];
    await page.route("**/api/archive_import", async (route) => {
      const input = route.request().postDataJSON();
      requests.push(input);
      if (input.uploadId && !lost) {
        lost = true;
        await route.fetch();
        await route.abort("failed");
      } else await route.continue();
    });
    await page.getByLabel("ZIP 工程标题", { exact: true }).fill("Imported ZIP");
    await page.getByLabel("导入 ZIP", { exact: true }).setInputFiles(archivePath);
    await page.getByRole("button", { name: "导入 ZIP 工程", exact: true }).click();
    await page.getByRole("button", { name: "重试", exact: true }).waitFor();
    await expect
      .poll(async () => (await client().execute("session_get", { sessionId: session.id })).artifacts.length)
      .toBe(2);
    await page.getByRole("button", { name: "重试", exact: true }).click();
    await ready();
    expect(new Set(requests.map((request) => request.requestId)).size).toBe(1);
    expect(requests.filter((request) => request.uploadId)).toHaveLength(1);
    const artifacts = (await client().execute("session_get", { sessionId: session.id })).artifacts,
      imported = artifacts.find((artifact) => artifact.id !== original.id);
    if (!imported) throw Error("import absent");
    expect(imported.title).toBe("Imported ZIP");
    const importedOwner = { sessionId: session.id, artifactId: imported.id },
      project = await client().execute("project_read", importedOwner);
    expect(project.revision).toBe(frozen.revision);
    expect(project.history).toEqual({ version: 0, canUndo: false, canRedo: false });
    expect((await client().execute("workspace_state", {})).selection.artifactId).toBe(imported.id);
    if ((await page.getByRole("button", { name: "源码", exact: true }).getAttribute("aria-pressed")) !== "true") {
      await page.getByRole("button", { name: "源码", exact: true }).click();
      await ready();
    }
    const currentSource = page.getByRole("textbox", { name: "index.html", exact: true });
    await currentSource.fill(`${savedContent}\n<!-- later imported edit -->`);
    await page.getByRole("button", { name: "保存", exact: true }).click();
    await ready();
    const later = await client().execute("project_read", importedOwner);
    await driver.capture("archive-imported");
    await page.unroute("**/api/archive_import");
    await manager.close();
    expect(await observeProcesses(root)).toEqual([]);
    manager = await serve(managerEndpoint(root), { root });
    await start();
    await page.goto(url);
    await ready();
    expect(await client().execute("project_read", importedOwner)).toEqual(later);
    expect((await client().execute("session_get", { sessionId: session.id })).artifacts).toHaveLength(2);
    expect((await client().execute("project_read", owner)).revision).toBe(frozen.revision);
    expect(driver.errors).toEqual([]);
    report.acceptance = {
      digest: identity,
      bytes: bytes.length,
      browserDownload: true,
      savedRevision: frozen.revision,
      importedRevision: project.revision,
      originalRequestPreserved: true,
      oneIndependentImport: true,
      coldEditPreserved: true,
    };
  } catch (error) {
    report.failure = String(error);
    throw error;
  } finally {
    await driver?.close();
    await manager.close();
    report.phase = (await readDirectory(root)).manager.phase;
    report.workloads = await observeProcesses(root);
    await writeFile(join(evidence, "result.json"), JSON.stringify(report, null, 2));
  }
  expect(report.phase).toBe("closed");
  expect(report.workloads).toEqual([]);
}, 60000);
