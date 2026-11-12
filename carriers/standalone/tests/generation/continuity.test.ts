import { createHash, randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import { createServer, type ServerResponse } from "node:http";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { browser } from "@odsuite/automation";
import { channel, digest, namespace } from "@odsuite/protocol";
import * as sidecar from "@odsuite/sidecar";
import { Client } from "@open-motion/daemon/client";
import type { GenerationInput } from "@open-motion/gateway/contract";
import { initialFiles } from "@open-motion/workspace/contract";
import { expect, it } from "vitest";
import type { Methods } from "@";

const png = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAACAAAAAYCAYAAACbU/80AAAAPklEQVR4AcXBMQEAIAzAsK5CuPEvChtMRpN5535CEpOYxCQmMYlJTGISk5jEJCYxiUlMYhKTmMQkJjGJSWwBYl8CWwMRvGQAAAAASUVORK5CYII=",
  "base64",
);
const contentHash = `sha256:${createHash("sha256").update(png).digest("hex")}`;
type Remote = {
  id: string;
  input: GenerationInput<"generation_create">;
  reads: number;
  cancels: number;
  aborted: number;
  released: boolean;
  confirm: boolean;
  waiting: Set<ServerResponse>;
};
async function fixture() {
  const evidence = fileURLToPath(
      new URL(`../../../../.artifacts/generation-continuity/${randomUUID()}/`, import.meta.url),
    ),
    root = join(evidence, "sidecar"),
    providerRoot = join(evidence, "provider"),
    entry = join(evidence, "carrier.mjs"),
    scope = { channel: channel("dev"), namespace: namespace("continuity") },
    records: Remote[] = [];
  await mkdir(evidence, { recursive: true });
  const service = await sidecar.serve(sidecar.managerEndpoint(providerRoot), { root: providerRoot }),
    factory = service.factory({ channel: channel("dev"), namespace: namespace("provider") });
  const answer = (response: ServerResponse, value: unknown) => {
    if (!response.destroyed) response.end(JSON.stringify(value));
  };
  const result = { state: "succeeded", data: png.toString("base64") };
  const server = createServer(async (request, response) => {
    try {
      const parts: Buffer[] = [];
      for await (const part of request) parts.push(Buffer.from(part));
      const path = request.url ?? "";
      if (path === "/submit") {
        const input = JSON.parse(Buffer.concat(parts).toString()) as Remote["input"],
          remote: Remote = {
            id: randomUUID(),
            input,
            reads: 0,
            cancels: 0,
            aborted: 0,
            released: false,
            confirm: false,
            waiting: new Set(),
          };
        records.push(remote);
        if (input.prompt.includes("unknown")) response.statusCode = 503;
        answer(response, { remoteId: remote.id });
        return;
      }
      const [operation, id] = path.slice(1).split("/"),
        remote = records.find((value) => value.id === id);
      if (!remote) {
        response.statusCode = 404;
        response.end();
        return;
      }
      if (operation === "cancel") {
        remote.cancels++;
        answer(response, { confirmed: remote.confirm });
        return;
      }
      if (operation !== "read") {
        response.statusCode = 404;
        response.end();
        return;
      }
      remote.reads++;
      if (remote.released) {
        answer(response, result);
        return;
      }
      if (!remote.input.prompt.includes("held")) {
        answer(response, { state: "pending" });
        return;
      }
      remote.waiting.add(response);
      response.once("close", () => {
        if (!response.writableEnded) remote.aborted++;
        remote.waiting.delete(response);
      });
    } catch {
      response.statusCode = 500;
      response.end();
    }
  });
  let origin = "",
    manager: sidecar.Manager | undefined,
    api: Client | undefined,
    web = "";
  await factory.expose({
    identity: { service: "providerfixture", generation: digest("generation continuity HTTP fixture") },
    handlers: {},
    lifecycle: {
      initialize: async (context) => {
        const port = await context.allocate({ kind: "port", name: "provider", scheme: "http" }),
          socket = await context.allocate({ kind: "socket", name: "provider" });
        await new Promise<void>((done) => server.listen(socket.value, done));
        await context.forward(port.value, socket.value);
        origin = port.value;
      },
      quiesce: async () => {
        server.closeAllConnections();
      },
      stop: () => new Promise<void>((done, reject) => server.close((error) => (error ? reject(error) : done()))),
    },
  });
  await writeFile(
    entry,
    `import {open} from ${JSON.stringify(new URL("../../dist/index.mjs", import.meta.url).href)};
import {managerReady,managerArguments} from ${JSON.stringify(import.meta.resolve("@odsuite/sidecar"))};
const request=async(path,body,signal)=>{const response=await fetch(${JSON.stringify(origin)}+path,{method:"POST",body:JSON.stringify(body),signal});if(!response.ok)throw Error("fixture transport outcome unknown");return response.json()};
const provider={id:"continuity",version:"account-one-v1",models:[{id:"png",label:"Controlled PNG"}],submit:(input,signal)=>request("/submit",input,signal),read:async(id,signal)=>{const result=await request("/read/"+encodeURIComponent(id),{},signal);return result.state==="succeeded"?{state:"succeeded",bytes:Buffer.from(result.data,"base64")}:result},cancel:(id,signal)=>request("/cancel/"+encodeURIComponent(id),{},signal)};
const root=${JSON.stringify(root)},scope=${JSON.stringify(scope)},runtime=await open({root,scope,version:"0.6.1-dev.1",...(managerArguments()[0]==="offline"?{}:{gateway:provider})});
await managerReady(runtime.manager,root,scope);
let stopping;process.once("SIGTERM",()=>{stopping??=runtime.close().catch(error=>{process.stderr.write(error.message);process.exitCode=1})});
`,
  );
  const boot = async (offline = false) => {
    manager = await sidecar.startManager({
      root,
      scope,
      command: process.execPath,
      args: [entry, offline ? "offline" : "online"],
      log: join(evidence, "manager.log"),
    });
    const control = await sidecar.connectRoot(root, scope),
      instance = (await control.factory.directory()).instances.find(
        (value) => value.service === "standalone" && value.phase === "ready",
      );
    if (!instance) throw Error("standalone fixture identity missing");
    const peer = await control.factory.connect<Methods>({ service: instance.service, generation: instance.generation }),
      status = await peer.call("status", null);
    web = status.web;
    const bootstrap = await (await fetch(new URL("bootstrap.json", web))).json();
    api = new Client(bootstrap.daemon, bootstrap.token);
    return manager;
  };
  const stop = async () => {
    if (manager) await sidecar.stopManager(manager);
    manager = undefined;
  };
  return {
    evidence,
    root,
    providerRoot,
    records,
    boot,
    stop,
    get api() {
      if (!api) throw Error("fixture is not started");
      return api;
    },
    get web() {
      return web;
    },
    release(remote: Remote) {
      remote.released = true;
      for (const response of remote.waiting) answer(response, result);
    },
    async kill() {
      if (!manager || !(await sidecar.managerAlive(manager))) throw Error("exact manager is not alive");
      const owner = manager;
      process.kill(owner.pid, "SIGKILL");
      await expect.poll(() => sidecar.managerAlive(owner), { timeout: 10000 }).toBe(false);
      manager = undefined;
      await expect.poll(async () => (await sidecar.observeProcesses(root)).length, { timeout: 10000 }).toBe(0);
    },
    async recover() {
      const plan = await sidecar.inspectRecovery(root);
      expect(plan.phase).toBe("ready");
      await sidecar.recover(root, { expected: plan.fingerprint });
      return plan.fingerprint;
    },
    async close() {
      await stop();
      const directory = await sidecar.readDirectory(root);
      if (directory.manager.phase !== "closed") {
        const plan = await sidecar.inspectRecovery(root);
        if (plan.phase !== "ready") throw Error("preserve unresolved fixture authority");
        await sidecar.recover(root, { expected: plan.fingerprint });
      }
      await service.close();
    },
  };
}

it("keeps accepted/unknown generation and explicit adoption consistent across real Web disposal, context changes, normal restart and SIGKILL recovery", async () => {
  const f = await fixture(),
    report: Record<string, unknown> = {},
    errors: string[] = [];
  let driver: Awaited<ReturnType<typeof browser>> | undefined;
  try {
    const firstOwner = await f.boot(),
      session = await f.api.execute("session_create", {
        requestId: randomUUID(),
        title: "Generation A",
        mode: "motion",
      }),
      artifact = await f.api.execute("artifact_create", {
        requestId: randomUUID(),
        sessionId: session.id,
        title: "Original owner",
        files: initialFiles(),
      }),
      owner = { sessionId: session.id, artifactId: artifact.id },
      original = await f.api.execute("project_read", owner);
    await f.api.execute("artifact_open", {
      ...owner,
      requestId: randomUUID(),
      expectedSelection: 0,
      expectedCurrent: null,
    });
    driver = await browser({ evidence: f.evidence, viewport: { width: 1440, height: 1000 } });
    const context = driver.page.context();
    let page = driver.page;
    const ready = () =>
      page
        .locator("[aria-live]")
        .filter({ hasText: /^就绪$/ })
        .waitFor();
    const openPage = async () => {
      page = await context.newPage();
      page.on("pageerror", (error) => errors.push(error.message));
      await page.goto(f.web);
      await ready();
      await page.getByRole("tab", { name: "媒体", exact: true }).click();
      const panel = page.getByLabel("PNG 素材生成", { exact: true });
      await panel.locator("summary").click();
      return panel;
    };
    const submissions: string[] = [];
    let drop = true;
    await page.route("**/api/generation_create", async (route) => {
      submissions.push(route.request().postDataJSON().requestId);
      const response = await route.fetch();
      if (drop) {
        drop = false;
        await response.body();
        await route.abort("failed");
      } else await route.fulfill({ response });
    });
    await page.goto(f.web);
    await ready();
    await page.getByRole("tab", { name: "媒体", exact: true }).click();
    let panel = page.getByLabel("PNG 素材生成", { exact: true });
    await panel.locator("summary").click();
    const model = JSON.stringify(["continuity", "account-one-v1", "png"]);
    await expect.poll(() => panel.getByLabel("图片生成模型", { exact: true }).locator("option").count()).toBe(2);
    await panel.getByLabel("图片生成模型", { exact: true }).selectOption(model);
    await panel.getByLabel("图片描述", { exact: true }).fill("held original owner");
    await panel.getByRole("button", { name: "生成新的 PNG 候选", exact: true }).click();
    await panel.getByRole("button", { name: "重试同一素材提交", exact: true }).click();
    await ready();
    expect(submissions).toHaveLength(2);
    expect(submissions[0]).toBe(submissions[1]);
    await expect.poll(() => f.records.length).toBe(1);
    const remote = f.records[0]!;
    await expect.poll(() => remote.waiting.size).toBe(1);
    const first = (await f.api.execute("generation_list", owner)).jobs[0]!;
    expect(first).toMatchObject({
      revision: original.revision,
      state: "running",
      submission: "accepted",
      remoteId: remote.id,
    });
    await page.close();
    expect(remote.cancels).toBe(0);
    const other = await f.api.execute("session_create", {
        requestId: randomUUID(),
        title: "Generation B",
        mode: "motion",
      }),
      otherArtifact = await f.api.execute("artifact_create", {
        requestId: randomUUID(),
        sessionId: other.id,
        title: "Unrelated owner",
        files: initialFiles(),
      }),
      otherOwner = { sessionId: other.id, artifactId: otherArtifact.id },
      otherProject = await f.api.execute("project_read", otherOwner),
      selection = (await f.api.execute("workspace_state", {})).selection;
    await f.api.execute("artifact_open", {
      ...otherOwner,
      requestId: randomUUID(),
      expectedSelection: selection.revision,
      expectedCurrent: { artifactId: artifact.id, revision: original.revision },
    });
    await f.stop();
    await expect.poll(() => remote.aborted).toBe(1);
    expect((await sidecar.readDirectory(f.root)).manager.phase).toBe("closed");
    const secondOwner = await f.boot();
    expect(secondOwner.incarnation).not.toBe(firstOwner.incarnation);
    await expect.poll(() => remote.waiting.size).toBe(1);
    expect(f.records).toHaveLength(1);
    panel = await openPage();
    expect(await panel.locator("[data-generation-id]").count()).toBe(0);
    f.release(remote);
    await expect
      .poll(async () => (await f.api.execute("generation_read", { ...owner, id: first.id })).state)
      .toBe("succeeded");
    expect(await f.api.execute("project_read", otherOwner)).toEqual(otherProject);
    expect(await f.api.execute("project_read", owner)).toEqual(original);
    expect((await f.api.execute("workspace_state", {})).selection.artifactId).toBe(otherArtifact.id);
    expect(await panel.locator("[data-generation-id]").count()).toBe(0);
    await page.close();
    const saved = await f.api.execute("project_save", {
        ...owner,
        requestId: randomUUID(),
        expectedRevision: original.revision,
        files: original.files.map((file) => ({
          ...file,
          content: file.content + "\n<!-- before explicit adoption -->",
        })),
      }),
      completed = await f.api.execute("generation_read", { ...owner, id: first.id });
    expect(completed.candidate?.contentHash).toBe(contentHash);
    await expect(
      f.api.execute("generation_adopt", {
        ...owner,
        id: first.id,
        requestId: randomUUID(),
        expectedRevision: original.revision,
        contentHash,
        path: "assets/stale.png",
        name: "Stale",
      }),
    ).rejects.toThrow();
    const selected = (await f.api.execute("workspace_state", {})).selection;
    await f.api.execute("artifact_open", {
      ...owner,
      requestId: randomUUID(),
      expectedSelection: selected.revision,
      expectedCurrent: { artifactId: otherArtifact.id, revision: otherProject.revision },
    });
    panel = await openPage();
    const card = panel.locator(`[data-generation-id="${first.id}"]`);
    await card.getByRole("button", { name: "预览 PNG 候选", exact: true }).click();
    await expect
      .poll(() => panel.getByRole("img").evaluate((node) => (node as HTMLImageElement).naturalWidth))
      .toBe(32);
    let lose = true;
    const adoptions: string[] = [];
    await page.route("**/api/generation_adopt", async (route) => {
      adoptions.push(route.request().postDataJSON().requestId);
      const response = await route.fetch();
      if (lose) {
        lose = false;
        await response.body();
        await route.abort("failed");
      } else await route.fulfill({ response });
    });
    await card.getByRole("button", { name: "采用为工程资源", exact: true }).click();
    await expect.poll(async () => (await f.api.execute("project_read", owner)).resources.length).toBe(1);
    const adopted = await f.api.execute("project_read", owner),
      newer = await f.api.execute("project_save", {
        ...owner,
        requestId: randomUUID(),
        expectedRevision: adopted.revision,
        files: saved.files.map((file) => ({
          ...file,
          content: file.content + "\n<!-- newer than adoption receipt -->",
        })),
      });
    await page.getByRole("button", { name: "重试", exact: true }).click();
    await ready();
    await expect.poll(() => page.getByLabel("revision", { exact: true }).textContent()).toBe(newer.revision);
    expect(adoptions).toHaveLength(2);
    expect(adoptions[0]).toBe(adoptions[1]);
    expect(await f.api.execute("project_read", owner)).toEqual(newer);
    const bytes = await f.api.execute("resource_read", {
      ...owner,
      revision: newer.revision,
      path: newer.resources[0]!.path,
    });
    expect(Buffer.from(bytes.data, "base64")).toEqual(png);
    await page.screenshot({ path: join(f.evidence, "adoption-after-context-and-restart.png") });
    await page.close();
    const base = {
        ...owner,
        revision: newer.revision,
        providerId: "continuity",
        providerVersion: "account-one-v1",
        modelId: "png",
      },
      unknownInput = { ...base, requestId: randomUUID(), prompt: "unknown acceptance" },
      unknown = await f.api.execute("generation_create", unknownInput);
    await expect
      .poll(async () => (await f.api.execute("generation_read", { ...owner, id: unknown.id })).state)
      .toBe("interrupted");
    const known = await f.api.execute("generation_create", {
      ...base,
      requestId: randomUUID(),
      prompt: "held across SIGKILL",
    });
    await expect
      .poll(async () => (await f.api.execute("generation_read", { ...owner, id: known.id })).submission)
      .toBe("accepted");
    const knownJob = await f.api.execute("generation_read", { ...owner, id: known.id }),
      knownRemote = f.records.find((record) => record.id === knownJob.remoteId)!;
    await expect.poll(() => knownRemote.waiting.size).toBe(1);
    expect(f.records).toHaveLength(3);
    await f.kill();
    await expect(f.boot()).rejects.toThrow();
    report.recoveryFingerprint = await f.recover();
    await f.boot(true);
    expect(await f.api.execute("generation_status", {})).toMatchObject({ configured: false });
    expect(await f.api.execute("project_read", owner)).toEqual(newer);
    expect((await f.api.execute("generation_result", { ...owner, id: first.id })).data).toBe(png.toString("base64"));
    expect(await f.api.execute("generation_read", { ...owner, id: unknown.id })).toMatchObject({
      state: "interrupted",
      submission: "unknown",
    });
    expect((await f.api.execute("generation_read", { ...owner, id: known.id })).remoteId).toBe(knownRemote.id);
    expect(f.records).toHaveLength(3);
    await f.stop();
    await f.boot();
    await expect.poll(() => knownRemote.waiting.size).toBe(1);
    expect(f.records).toHaveLength(3);
    expect((await f.api.execute("generation_create", unknownInput)).id).toBe(unknown.id);
    panel = await openPage();
    const cancelling = panel.locator(`[data-generation-id="${known.id}"]`);
    await cancelling.getByRole("button", { name: "取消素材任务", exact: true }).click();
    await expect.poll(() => knownRemote.cancels).toBe(1);
    await expect
      .poll(async () => (await f.api.execute("generation_read", { ...owner, id: known.id })).error)
      .toBe("Cancellation outcome unconfirmed");
    await expect.poll(() => cancelling.getAttribute("data-generation-state")).toBe("cancelling");
    await expect
      .poll(() => cancelling.getByRole("button", { name: "取消素材任务", exact: true }).isDisabled())
      .toBe(true);
    await page.screenshot({ path: join(f.evidence, "cancellation-unconfirmed.png") });
    await page.close();
    const reads = knownRemote.reads;
    knownRemote.confirm = true;
    await f.stop();
    await f.boot();
    await expect
      .poll(async () => (await f.api.execute("generation_read", { ...owner, id: known.id })).state)
      .toBe("cancelled");
    expect(knownRemote.cancels).toBe(2);
    expect(knownRemote.reads).toBe(reads);
    expect(f.records).toHaveLength(3);
    expect(await f.api.execute("generation_read", { ...owner, id: unknown.id })).toMatchObject({
      state: "interrupted",
      submission: "unknown",
    });
    await expect(f.api.execute("generation_result", { ...owner, id: known.id })).rejects.toThrow();
    expect((await f.api.execute("generation_result", { ...owner, id: first.id })).data).toBe(png.toString("base64"));
    expect(await f.api.execute("project_read", owner)).toEqual(newer);
    expect(await f.api.execute("project_read", otherOwner)).toEqual(otherProject);
    expect(errors).toEqual([]);
    expect(driver.errors).toEqual([]);
    report.owner = owner;
    report.otherOwner = otherOwner;
    report.originalRevision = original.revision;
    report.currentRevision = newer.revision;
    report.jobs = await f.api.execute("generation_list", owner);
    report.records = f.records.map((record) => ({
      id: record.id,
      requestId: record.input.requestId,
      reads: record.reads,
      cancels: record.cancels,
      aborted: record.aborted,
    }));
    report.submissionRequests = submissions;
    report.adoptionRequests = adoptions;
    report.candidateHash = contentHash;
  } catch (error) {
    report.failure = String(error);
    throw error;
  } finally {
    await driver?.close();
    await f.close();
    report.phase = (await sidecar.readDirectory(f.root)).manager.phase;
    report.workloads = await sidecar.observeProcesses(f.root);
    report.providerPhase = (await sidecar.readDirectory(f.providerRoot)).manager.phase;
    await writeFile(join(f.evidence, "result.json"), JSON.stringify(report, null, 2));
  }
  expect(report.phase).toBe("closed");
  expect(report.workloads).toEqual([]);
  expect(report.providerPhase).toBe("closed");
}, 180000);
