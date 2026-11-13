import { createHash, randomUUID } from "node:crypto";
import { once } from "node:events";
import { writeFile } from "node:fs/promises";
import { request } from "node:http";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { channel, digest, namespace } from "@odsuite/protocol";
import { managerEndpoint, observeProcesses, readDirectory, serve } from "@odsuite/sidecar";
import { initialFiles, resourceLimit } from "@open-motion/workspace";
import { expect, it } from "vitest";
import { serve as daemonServe } from "@/service.js";
import { Client } from "@/transport/client.js";

const hash = (bytes: Uint8Array) => `sha256:${createHash("sha256").update(bytes).digest("hex")}`;
function wave() {
  const b = Buffer.alloc(resourceLimit);
  b.write("RIFF");
  b.writeUInt32LE(b.length - 8, 4);
  b.write("WAVEfmt ", 8);
  b.writeUInt32LE(16, 16);
  b.writeUInt16LE(1, 20);
  b.writeUInt16LE(2, 22);
  b.writeUInt32LE(48000, 24);
  b.writeUInt32LE(192000, 28);
  b.writeUInt16LE(4, 32);
  b.writeUInt16LE(16, 34);
  b.write("data", 36);
  b.writeUInt32LE(b.length - 44, 40);
  return b;
}
async function fixture() {
  const evidence = fileURLToPath(new URL(`../../../../.artifacts/resource-transfer/${randomUUID()}/`, import.meta.url)),
    root = join(evidence, "sidecar"),
    token = "resource-fixture-authority";
  let manager = await serve(managerEndpoint(root), { root });
  const host = async () => {
    let daemon: Awaited<ReturnType<typeof daemonServe>> | undefined,
      api: Client | undefined,
      endpoint = "";
    await manager.factory({ channel: channel("dev"), namespace: namespace("resources") }).expose({
      identity: { service: "daemon", generation: digest("resource-transfer") },
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
    if (!api) throw Error("missing fixture");
    return { api: api as Client, endpoint };
  };
  return {
    root,
    evidence,
    token,
    host,
    close: () => manager.close(),
    restart: async () => {
      await manager.close();
      manager = await serve(managerEndpoint(root), { root });
    },
  };
}

it("imports 16 MiB through raw bytes and confirms original receipts before restaging, later edits or cold restart", async () => {
  const f = await fixture();
  const report: Record<string, unknown> = {};
  try {
    const { api, endpoint } = await f.host(),
      session = await api.execute("session_create", {
        requestId: randomUUID(),
        title: "Raw resources",
        mode: "motion",
      }),
      artifact = await api.execute("artifact_create", {
        requestId: randomUUID(),
        sessionId: session.id,
        title: "Large media",
        files: initialFiles(),
      }),
      owner = { sessionId: session.id, artifactId: artifact.id },
      before = await api.execute("project_read", owner),
      bytes = wave(),
      file = new Blob([Uint8Array.from(bytes)]),
      input = {
        ...owner,
        requestId: randomUUID(),
        expectedRevision: before.revision,
        path: "assets/maximum.wav",
        name: "Maximum WAV",
        digest: hash(bytes),
        bytes: bytes.length,
      };
    let lose = true,
      uploads = 0;
    const controls: string[] = [];
    const lossy = new Client(endpoint, f.token, async (url, init) => {
      if (String(url).includes("/resources/upload/")) {
        uploads++;
        if (!(init?.body instanceof Blob)) throw Error("expected a binary upload body");
        expect(init.body.size).toBe(resourceLimit);
      }
      if (String(url).endsWith("/api/resource_import")) controls.push(String(init?.body));
      const response = await fetch(url, init);
      if (String(url).endsWith("/api/resource_import") && JSON.parse(String(init?.body)).uploadId && lose) {
        lose = false;
        expect(response.status).toBe(200);
        await response.arrayBuffer();
        throw Error("response lost after resource commit");
      }
      return response;
    });
    await expect(lossy.importResource(input, file)).rejects.toThrow("response lost");
    const committed = await api.execute("project_read", owner);
    expect(committed.history.version).toBe(1);
    expect(committed.resources[0]).toMatchObject({ bytes: resourceLimit, digest: input.digest, type: "audio/wav" });
    expect(await lossy.importResource(input, new Blob(["receipt must precede bytes"]))).toEqual({ project: committed });
    expect(uploads).toBe(1);
    expect(controls).toHaveLength(3);
    expect(controls.every((value) => value.length < 1024 && !value.includes('"data"'))).toBe(true);
    const saved = await api.execute("project_save", {
      ...owner,
      requestId: randomUUID(),
      expectedRevision: committed.revision,
      files: [{ path: "index.html", content: committed.files[0]!.content + "\n<!-- retained later edit -->" }],
    });
    expect(await api.execute("resource_import", input)).toEqual({ project: committed });
    expect(await api.execute("project_read", owner)).toEqual(saved);
    const read = await api.readResource({ ...owner, revision: committed.revision, path: input.path });
    expect(hash(Buffer.from(await read.data.arrayBuffer()))).toBe(input.digest);
    const readOnly = await api.execute("resource_read", { ...owner, revision: committed.revision, path: input.path });
    await expect(
      api.execute("resource_import", {
        ...input,
        requestId: randomUUID(),
        expectedRevision: saved.revision,
        path: "assets/copy.wav",
        uploadId: readOnly.id,
      }),
    ).rejects.toMatchObject({ code: "missing" });
    await api.execute("resource_release", { id: readOnly.id });
    const preview = await api.preview(saved),
      asset = new URL(input.path, preview.url).href,
      range = await fetch(asset, { headers: { range: "bytes=0-43" } });
    expect(range.status).toBe(206);
    expect(Buffer.from(await range.arrayBuffer())).toEqual(bytes.subarray(0, 44));
    await api.closePreviews();
    await expect(api.execute("resource_import", { ...input, digest: digest("different") })).rejects.toMatchObject({
      code: "idempotency",
    });
    await expect(api.execute("resource_import", { ...input, data: "obsolete" } as never)).rejects.toMatchObject({
      code: "invalid",
    });
    await f.restart();
    const cold = await f.host();
    expect(await cold.api.execute("resource_import", { ...input, uploadId: randomUUID() })).toEqual({
      project: committed,
    });
    expect(await cold.api.execute("project_read", owner)).toEqual(saved);
    expect(
      hash(
        new Uint8Array(
          await (
            await cold.api.readResource({ ...owner, revision: committed.revision, path: input.path })
          ).data.arrayBuffer(),
        ),
      ) === input.digest,
    ).toBe(true);
    Object.assign(report, {
      bytes: bytes.length,
      digest: input.digest,
      rawUploads: uploads,
      controlBytes: controls.map((value) => value.length),
      sameRequest: controls.every((value) => JSON.parse(value).requestId === input.requestId),
      coldRestart: true,
      history: saved.history,
    });
  } finally {
    await f.close();
    report.phase = (await readDirectory(f.root)).manager.phase;
    report.processes = await observeProcesses(f.root);
    await writeFile(join(f.evidence, "report.json"), JSON.stringify(report, null, 2));
  }
  expect(report.phase).toBe("closed");
  expect(report.processes).toEqual([]);
}, 60000);

it("bounds upload capacity and size, rejects bad digests/formats atomically and drains a partial upload on shutdown", async () => {
  const f = await fixture();
  try {
    const { api } = await f.host(),
      bytes = Buffer.from("test"),
      intent = { digest: hash(bytes), bytes: bytes.length },
      first = await api.execute("resource_upload", { requestId: randomUUID(), ...intent }),
      second = await api.execute("resource_upload", { requestId: randomUUID(), ...intent });
    await expect(api.execute("resource_upload", { requestId: randomUUID(), ...intent })).rejects.toMatchObject({
      code: "conflict",
    });
    await expect(
      api.execute("resource_upload", { requestId: randomUUID(), digest: intent.digest, bytes: resourceLimit + 1 }),
    ).rejects.toMatchObject({ code: "invalid" });
    await expect(api.uploadResource(first, new Blob(["best"]))).rejects.toMatchObject({ code: "invalid" });
    await api.uploadResource(first, new Blob([bytes]));
    const session = await api.execute("session_create", { requestId: randomUUID(), title: "Invalid", mode: "motion" }),
      artifact = await api.execute("artifact_create", {
        requestId: randomUUID(),
        sessionId: session.id,
        title: "Project",
        files: initialFiles(),
      }),
      owner = { sessionId: session.id, artifactId: artifact.id },
      before = await api.execute("project_read", owner),
      input = {
        ...owner,
        requestId: randomUUID(),
        expectedRevision: before.revision,
        path: "assets/bad.wav",
        name: "Invalid",
        ...intent,
      };
    await expect(api.execute("resource_import", { ...input, uploadId: first.id })).rejects.toMatchObject({
      code: "invalid",
    });
    expect(await api.execute("resource_import", input)).toEqual({ project: null });
    expect(await api.execute("project_read", owner)).toEqual(before);
    await api.execute("resource_release", { id: first.id });
    expect(
      (await fetch(first.url, { method: "POST", headers: { "content-type": "application/octet-stream" }, body: bytes }))
        .status,
    ).toBe(404);
    const partial = await api.execute("resource_upload", { requestId: randomUUID(), ...intent }),
      req = request(partial.url, {
        method: "POST",
        headers: { "content-type": "application/octet-stream", "content-length": bytes.length, expect: "100-continue" },
      });
    req.on("error", () => {});
    req.flushHeaders();
    await once(req, "continue");
    req.write(bytes.subarray(0, 1));
    await api.execute("resource_release", { id: partial.id });
    await expect(api.execute("resource_upload", { requestId: randomUUID(), ...intent })).rejects.toMatchObject({
      code: "conflict",
    });
    const closed = new Promise<void>((done) => req.once("close", done));
    await f.close();
    await closed;
    await expect(api.uploadResource(second, new Blob([bytes]))).rejects.toThrow();
  } finally {
    await f.close();
  }
  expect((await readDirectory(f.root)).manager.phase).toBe("closed");
  expect(await observeProcesses(f.root)).toEqual([]);
}, 30000);
