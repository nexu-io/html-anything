// @vitest-environment node
import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { browser } from "@odsuite/automation";
import { channel, digest, namespace } from "@odsuite/protocol";
import { source } from "@odsuite/serve";
import { managerEndpoint, observeProcesses, readDirectory, serve } from "@odsuite/sidecar";
import { serve as daemonServe } from "@open-motion/daemon";
import { Client } from "@open-motion/daemon/client";
import { initialFiles, type Project } from "@open-motion/workspace/contract";
import { afterAll, beforeAll, expect, it } from "vitest";
import type { Config } from "@";

const evidence = join(
    fileURLToPath(new URL("../../../../", import.meta.url)),
    ".artifacts/collaboration",
    randomUUID(),
  ),
  root = join(evidence, "sidecar");
let manager: Awaited<ReturnType<typeof serve>>,
  driver: Awaited<ReturnType<typeof browser>>,
  client: Client,
  url = "";
const report: Record<string, unknown> = {};
beforeAll(async () => {
  await mkdir(evidence, { recursive: true });
  manager = await serve(managerEndpoint(root), { root });
  const factory = manager.factory({ channel: channel("dev"), namespace: namespace("observe") });
  let config: Config | undefined,
    daemon: Awaited<ReturnType<typeof daemonServe>> | undefined,
    capability: Awaited<ReturnType<typeof factory.issue>> | undefined;
  const web = await source(factory, {
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
    identity: { service: "daemon", generation: digest("observation-browser") },
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
        client = new Client(port.value, capability.token);
      },
      quiesce: async () => daemon?.quiesce(),
      stop: async () => {
        await daemon?.close();
        if (capability) await factory.retire(capability);
      },
    },
  });
  driver = await browser({ evidence, viewport: { width: 1440, height: 1000 } });
}, 30000);
afterAll(async () => {
  const failures: unknown[] = [];
  for (const action of [() => driver?.close(), () => manager?.close()])
    try {
      await action();
    } catch (error) {
      failures.push(error);
    }
  report.phase = (await readDirectory(root)).manager.phase;
  report.processes = await observeProcesses(root);
  report.errors = driver?.errors;
  await writeFile(join(evidence, "report.json"), JSON.stringify(report, null, 2));
  expect(failures).toEqual([]);
  expect(report.phase).toBe("closed");
  expect(report.processes).toEqual([]);
}, 30000);
it("coordinates two actual Web views and an external writer across clean refresh, local conflicts, deletion, disconnect and context return", async () => {
  const session = await client.execute("session_create", {
      requestId: randomUUID(),
      title: "Collaboration",
      mode: "motion",
    }),
    artifact = await client.execute("artifact_create", {
      requestId: randomUUID(),
      sessionId: session.id,
      title: "Shared project",
      files: [...initialFiles(), { path: "card.html", content: "base card" }],
    }),
    owner = { sessionId: session.id, artifactId: artifact.id };
  const state = await client.execute("workspace_state", {});
  await client.execute("artifact_open", {
    requestId: randomUUID(),
    ...owner,
    expectedSelection: state.selection.revision,
    expectedCurrent: null,
  });
  const page = driver.page,
    second = await page.context().newPage();
  const ready = (p = page) =>
    p
      .locator("[aria-live]")
      .filter({ hasText: /^就绪$/ })
      .waitFor();
  const click = async (name: string) => {
    await page.getByRole("button", { name, exact: true }).click();
    await ready();
  };
  const code = page.getByRole("textbox", { name: "index.html", exact: true });
  const remote = async (path: string, content: string) => {
    const project = await client.execute("project_read", owner);
    return client.execute("project_save", {
      ...owner,
      requestId: randomUUID(),
      expectedRevision: project.revision,
      files: project.files.map((f) => (f.path === path ? { path, content } : f)),
    });
  };
  try {
    await page.goto(url);
    await ready();
    await click("源码");
    await second.goto(url);
    await ready(second);
    await second.getByRole("button", { name: "源码", exact: true }).click();
    const original = await code.inputValue();
    await remote("index.html", original + "\n<!-- CLEAN EXTERNAL -->");
    await expect.poll(() => code.inputValue(), { timeout: 10000 }).toContain("CLEAN EXTERNAL");
    await expect
      .poll(() => second.getByRole("textbox", { name: "index.html", exact: true }).inputValue(), { timeout: 10000 })
      .toContain("CLEAN EXTERNAL");
    await code.fill((await code.inputValue()) + "\n<!-- LOCAL ONLY -->");
    await remote("card.html", "REMOTE OTHER FILE");
    await page.getByLabel("外部修改", { exact: true }).waitFor();
    expect(await code.inputValue()).toContain("LOCAL ONLY");
    expect(
      (await client.execute("project_read", owner)).files.find((f) => f.path === "index.html")?.content,
    ).not.toContain("LOCAL ONLY");
    await click("合并到本地草稿");
    await click("保存");
    let saved = await client.execute("project_read", owner);
    expect(saved.files).toContainEqual({ path: "card.html", content: "REMOTE OTHER FILE" });
    expect(saved.files.find((f) => f.path === "index.html")?.content).toContain("LOCAL ONLY");
    await expect
      .poll(() => second.getByRole("textbox", { name: "index.html", exact: true }).inputValue(), { timeout: 10000 })
      .toContain("LOCAL ONLY");
    await code.fill((await code.inputValue()) + "\n<!-- LOCAL CONFLICT -->");
    await remote(
      "index.html",
      (saved.files.find((f) => f.path === "index.html")?.content ?? "") + "\n<!-- AGENT CONFLICT -->",
    );
    await page.getByLabel("冲突选择 index.html", { exact: true }).waitFor();
    expect(await code.inputValue()).toContain("LOCAL CONFLICT");
    await page.getByLabel("冲突选择 index.html", { exact: true }).selectOption("local");
    await click("合并到本地草稿");
    expect((await client.execute("project_read", owner)).files.find((f) => f.path === "index.html")?.content).toContain(
      "AGENT CONFLICT",
    );
    await click("保存");
    await page.getByRole("tab", { name: "文件", exact: true }).click();
    await click("card.html");
    const card = page.getByRole("textbox", { name: "card.html", exact: true });
    await card.fill("RESURRECT LOCAL");
    saved = await client.execute("project_read", owner);
    await client.execute("project_save", {
      ...owner,
      requestId: randomUUID(),
      expectedRevision: saved.revision,
      files: saved.files.filter((f) => f.path !== "card.html"),
    });
    await page.getByLabel("冲突选择 card.html", { exact: true }).waitFor();
    await page.getByLabel("冲突选择 card.html", { exact: true }).selectOption("local");
    await click("合并到本地草稿");
    await click("保存");
    expect((await client.execute("project_read", owner)).files).toContainEqual({
      path: "card.html",
      content: "RESURRECT LOCAL",
    });
    await click("index.html");
    await code.fill((await code.inputValue()) + "\n<!-- OFFLINE DRAFT -->");
    await page.route("**/api/workspace_observe", (route) => route.abort("failed"));
    await expect
      .poll(() => page.getByLabel("协作连接状态", { exact: true }).textContent(), { timeout: 10000 })
      .toContain("暂不可用");
    await remote("card.html", "AFTER RECONNECT");
    expect(await code.inputValue()).toContain("OFFLINE DRAFT");
    await page.unroute("**/api/workspace_observe");
    await page.getByLabel("外部修改", { exact: true }).waitFor();
    await click("合并到本地草稿");
    await click("保存");
    const other = await client.execute("session_create", {
      requestId: randomUUID(),
      title: "Other context",
      mode: "motion",
    });
    saved = await client.execute("project_read", owner);
    const current = await client.execute("workspace_state", {});
    await code.fill((await code.inputValue()) + "\n<!-- CONTEXT DRAFT -->");
    await client.execute("session_open", {
      requestId: randomUUID(),
      sessionId: other.id,
      expectedSelection: current.selection.revision,
      expectedCurrent: { artifactId: artifact.id, revision: saved.revision },
    });
    await page.getByRole("button", { name: "返回本地工程并保留草稿", exact: true }).waitFor();
    expect(await code.inputValue()).toContain("CONTEXT DRAFT");
    await click("返回本地工程并保留草稿");
    await click("保存");
    report.owner = owner;
    report.project = await client.execute("project_read", owner);
    report.cases = [
      "two-web-views",
      "clean-refresh",
      "independent-file-merge",
      "same-file-choice",
      "delete-resurrection",
      "disconnect-reconnect",
      "explicit-context-return",
    ];
    await driver.capture("collaboration");
    expect(driver.errors).toEqual([]);
  } catch (error) {
    report.failure = String(error);
    report.status = await page.locator("[aria-live]").allTextContents();
    await driver.capture("failure").catch(() => undefined);
    throw error;
  } finally {
    await second.close();
  }
}, 90000);
