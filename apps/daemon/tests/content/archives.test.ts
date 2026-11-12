import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import { request as httpRequest } from "node:http";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { channel, digest, namespace } from "@odsuite/protocol";
import { managerEndpoint, observeProcesses, readDirectory, serve } from "@odsuite/sidecar";
import { initialFiles } from "@open-motion/workspace";
import { expect, it } from "vitest";
import { Client } from "@/client.js";
import type { ArchiveUpload } from "@/contract.js";
import { serve as daemonServe } from "@/service.js";

function wave() {
  const b = Buffer.alloc(6 * 1024 ** 2);
  b.write("RIFF");
  b.writeUInt32LE(b.length - 8, 4);
  b.write("WAVEfmt ", 8);
  b.writeUInt32LE(16, 16);
  b.writeUInt16LE(1, 20);
  b.writeUInt16LE(1, 22);
  b.writeUInt32LE(8000, 24);
  b.writeUInt32LE(16000, 28);
  b.writeUInt16LE(2, 32);
  b.writeUInt16LE(16, 34);
  b.write("data", 36);
  b.writeUInt32LE(b.length - 44, 40);
  return b;
}
it("transfers a ZIP beyond JSON limits, retires the source and confirms the original import after a lost response and cold restart", async () => {
  const evidence = fileURLToPath(new URL(`../../../../.artifacts/archive-transfer/${randomUUID()}/`, import.meta.url)),
    root = join(evidence, "sidecar"),
    token = "archive-fixture-authority",
    report: Record<string, unknown> = {};
  await mkdir(evidence, { recursive: true });
  let manager = await serve(managerEndpoint(root), { root });
  const host = async (name: string) => {
    const factory = manager.factory({ channel: channel("dev"), namespace: namespace(name) });
    let daemon: Awaited<ReturnType<typeof daemonServe>> | undefined,
      api: Client | undefined,
      endpoint = "";
    const owner = await factory.expose({
      identity: { service: "daemon", generation: digest("archive transfer") },
      handlers: {},
      lifecycle: {
        initialize: async (context) => {
          const socket = await context.allocate({ kind: "socket", name: "daemon" }),
            port = await context.allocate({ kind: "port", name: "daemon", scheme: "http" });
          endpoint = port.value;
          daemon = await daemonServe({
            data: context.roots.data,
            socket: socket.value,
            token,
            origin: "http://fixture.invalid",
            endpoint,
          });
          await context.forward(port.value, socket.value);
          api = new Client(endpoint, token);
        },
        quiesce: async () => daemon?.quiesce(),
        stop: async () => daemon?.close(),
      },
    });
    if (!api) throw Error("Daemon missing");
    return { api: api as Client, endpoint, owner };
  };
  try {
    const sender = await host("sender"),
      target = await host("receiver"),
      sourceSession = await sender.api.execute("session_create", {
        requestId: randomUUID(),
        title: "Source",
        mode: "motion",
      }),
      original = await sender.api.execute("artifact_create", {
        requestId: randomUUID(),
        sessionId: sourceSession.id,
        title: "Source",
        files: initialFiles(),
      }),
      owner = { sessionId: sourceSession.id, artifactId: original.id };
    let project = await sender.api.execute("project_read", owner);
    const wav = wave(),
      data = wav.toString("base64");
    for (let index = 0; index < 6; index++)
      project = await sender.api.execute("resource_import", {
        ...owner,
        requestId: randomUUID(),
        expectedRevision: project.revision,
        path: `assets/sound${index}.wav`,
        name: `Sound ${index}`,
        data,
      });
    const frozen = project,
      request = { ...owner, requestId: randomUUID(), revision: frozen.revision },
      ticket = await sender.api.execute("archive_export", request);
    expect(ticket.bytes).toBeGreaterThan(32 * 1024 ** 2);
    expect(await sender.api.execute("archive_export", request)).toEqual(ticket);
    expect(JSON.stringify(ticket)).not.toContain(root);
    await expect(
      sender.api.execute("archive_export", { ...request, revision: digest("different") }),
    ).rejects.toMatchObject({ code: "idempotency" });
    await sender.api.execute("project_save", {
      ...owner,
      requestId: randomUUID(),
      expectedRevision: frozen.revision,
      files: [...frozen.files, { path: "later.txt", content: "Not part of selected revision" }],
    });
    const zip = await sender.api.downloadArchive(ticket);
    await sender.api.execute("archive_release", { id: ticket.id });
    expect((await fetch(ticket.url)).status).toBe(404);
    await sender.owner.close();
    await expect(sender.api.health()).rejects.toThrow();
    const destination = await target.api.execute("session_create", {
        requestId: randomUUID(),
        title: "Imported",
        mode: "motion",
      }),
      intent = {
        requestId: randomUUID(),
        sessionId: destination.id,
        title: "Independent source",
        digest: ticket.digest,
      };
    expect(await target.api.execute("archive_import", intent)).toEqual({ artifact: null });
    const uploadInput = { requestId: randomUUID(), digest: ticket.digest, bytes: ticket.bytes },
      upload = await target.api.execute("archive_upload", uploadInput);
    expect(await target.api.execute("archive_upload", uploadInput)).toEqual(upload);
    await target.api.uploadArchive(upload, zip);
    let lost = true;
    const losing = new Client(target.endpoint, token, async (url, init) => {
      const response = await fetch(url, init);
      if (String(url).endsWith("/api/archive_import") && lost) {
        lost = false;
        await response.text();
        throw Error("response lost after commit");
      }
      return response;
    });
    await expect(losing.execute("archive_import", { ...intent, uploadId: upload.id })).rejects.toThrow(
      "lost after commit",
    );
    const created = await target.api.execute("archive_import", intent);
    if (!created.artifact) throw Error("receipt absent");
    expect(created.artifact.id).not.toBe(original.id);
    expect(created.artifact.projectId).not.toBe(original.projectId);
    const importedOwner = { sessionId: destination.id, artifactId: created.artifact.id },
      imported = await target.api.execute("project_read", importedOwner);
    expect(imported.revision).toBe(frozen.revision);
    expect(imported.files).toEqual(frozen.files);
    expect(imported.resources).toEqual(frozen.resources);
    expect(imported.history).toEqual({ version: 0, canUndo: false, canRedo: false });
    expect((await target.api.execute("workspace_state", {})).selection.artifactId).toBeNull();
    const later = await target.api.execute("project_save", {
      ...importedOwner,
      requestId: randomUUID(),
      expectedRevision: imported.revision,
      files: [...imported.files, { path: "receiver.txt", content: "Preserve later edit" }],
    });
    expect(await target.api.execute("archive_import", { ...intent, uploadId: randomUUID() })).toEqual(created);
    await expect(target.api.execute("archive_import", { ...intent, title: "changed" })).rejects.toMatchObject({
      code: "idempotency",
    });
    await manager.close();
    expect((await readDirectory(root)).manager.phase).toBe("closed");
    manager = await serve(managerEndpoint(root), { root });
    const cold = await host("receiver");
    expect(await cold.api.execute("archive_import", { ...intent, uploadId: upload.id })).toEqual(created);
    expect(await cold.api.execute("project_read", importedOwner)).toEqual(later);
    expect((await cold.api.execute("session_get", { sessionId: destination.id })).artifacts).toHaveLength(1);
    const historical = await cold.api.execute("resource_read", {
      ...importedOwner,
      revision: frozen.revision,
      path: "assets/sound0.wav",
    });
    expect(Buffer.from(historical.data, "base64").equals(wav)).toBe(true);
    report.acceptance = {
      archive: { digest: ticket.digest, bytes: ticket.bytes },
      resources: imported.resources.length,
      sourceRetiredBeforeUpload: true,
      lostResponseReceipt: true,
      coldReplayPreservesLaterEdit: true,
    };
  } catch (error) {
    report.failure = String(error);
    throw error;
  } finally {
    await manager.close();
    report.phase = (await readDirectory(root)).manager.phase;
    report.workloads = await observeProcesses(root);
    await writeFile(join(evidence, "result.json"), JSON.stringify(report, null, 2));
  }
  expect(report.phase).toBe("closed");
  expect(report.workloads).toEqual([]);
}, 60000);

it("bounds tickets, verifies uploads and releases business grants without creating projects", async () => {
  const evidence = fileURLToPath(new URL(`../../../../.artifacts/archive-faults/${randomUUID()}/`, import.meta.url)),
    root = join(evidence, "sidecar");
  await mkdir(evidence, { recursive: true });
  const manager = await serve(managerEndpoint(root), { root });
  let daemon: Awaited<ReturnType<typeof daemonServe>> | undefined, api: Client | undefined;
  try {
    await manager.factory({ channel: channel("dev"), namespace: namespace("faults") }).expose({
      identity: { service: "daemon", generation: digest("faults") },
      handlers: {},
      lifecycle: {
        initialize: async (context) => {
          const socket = await context.allocate({ kind: "socket", name: "daemon" }),
            port = await context.allocate({ kind: "port", name: "daemon", scheme: "http" });
          daemon = await daemonServe({
            data: context.roots.data,
            socket: socket.value,
            token: "fixture",
            origin: "http://fixture.invalid",
            endpoint: port.value,
          });
          await context.forward(port.value, socket.value);
          api = new Client(port.value, "fixture");
        },
        quiesce: async () => daemon?.quiesce(),
        stop: async () => daemon?.close(),
      },
    });
    if (!api) throw Error("api missing");
    const client = api as Client,
      input = { requestId: randomUUID(), digest: digest("bad ZIP"), bytes: 22 },
      first = await client.execute("archive_upload", input),
      second = await client.execute("archive_upload", { ...input, requestId: randomUUID() });
    await expect(client.execute("archive_upload", { ...input, bytes: 23 })).rejects.toMatchObject({
      code: "idempotency",
    });
    await expect(client.execute("archive_upload", { ...input, requestId: randomUUID() })).rejects.toMatchObject({
      code: "conflict",
    });
    expect((await fetch(first.url, { method: "POST", body: new Blob([new Uint8Array(22)]) })).status).toBe(400);
    await expect(client.uploadArchive(first, new Blob([new Uint8Array(22)]))).rejects.toMatchObject({
      code: "integrity",
    });
    await client.execute("archive_release", { id: first.id });
    expect(await client.execute("archive_release", { id: first.id })).toEqual({ released: true });
    expect((await fetch(first.url)).status).toBe(404);
    const third = await client.execute("archive_upload", { ...input, requestId: randomUUID() });
    expect(third.id).not.toBe(first.id);
    await client.execute("archive_release", { id: second.id });
    await client.execute("archive_release", { id: third.id });
    expect((await client.execute("workspace_state", {})).sessions).toEqual([]);
    const held = await client.execute("archive_upload", { ...input, requestId: randomUUID() });
    const opening = () => {
      const req = httpRequest(
        held.url,
        { method: "POST", headers: { "content-type": "application/zip", "content-length": held.bytes } },
        (response) => response.resume(),
      );
      req.on("error", () => {});
      req.write(Buffer.from([0]));
      return req;
    };
    const req = opening();
    const competing = () =>
      fetch(held.url, { method: "POST", headers: { "content-type": "application/zip" }, body: new Blob() }).then(
        async (response) => {
          await response.arrayBuffer();
          return response.status;
        },
      );
    await expect.poll(competing).toBe(409);
    await client.execute("archive_release", { id: held.id });
    const reserved = await client.execute("archive_upload", { ...input, requestId: randomUUID() });
    const next = { ...input, requestId: randomUUID() };
    await expect(client.execute("archive_upload", next)).rejects.toMatchObject({ code: "conflict" });
    req.destroy();
    let admitted: ArchiveUpload | undefined;
    await expect
      .poll(async () => {
        try {
          admitted = await client.execute("archive_upload", next);
          return true;
        } catch {
          return false;
        }
      })
      .toBe(true);
    await client.execute("archive_release", { id: reserved.id });
    if (!admitted) throw Error("transfer capacity was not returned");
    await client.execute("archive_release", { id: admitted.id });
    const stopping = await client.execute("archive_upload", { ...input, requestId: randomUUID() });
    const stalled = httpRequest(
      stopping.url,
      { method: "POST", headers: { "content-type": "application/zip", "content-length": stopping.bytes } },
      (response) => response.resume(),
    );
    stalled.on("error", () => {});
    stalled.write(Buffer.from([0]));
    await expect
      .poll(() =>
        fetch(stopping.url, { method: "POST", headers: { "content-type": "application/zip" }, body: new Blob() }).then(
          async (response) => {
            await response.arrayBuffer();
            return response.status;
          },
        ),
      )
      .toBe(409);
    await manager.close();
    expect((await readDirectory(root)).manager.phase).toBe("closed");
    expect(await observeProcesses(root)).toEqual([]);
    stalled.destroy();
  } finally {
    await manager.close();
    await writeFile(
      join(evidence, "result.json"),
      JSON.stringify(
        { phase: (await readDirectory(root)).manager.phase, workloads: await observeProcesses(root) },
        null,
        2,
      ),
    );
  }
}, 15000);
