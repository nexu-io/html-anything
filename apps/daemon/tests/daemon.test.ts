import { randomUUID } from "node:crypto";
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { request } from "node:http";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { channel, digest, namespace } from "@odsuite/protocol";
import {
  Client,
  type Lease,
  managerEndpoint,
  observeProcesses,
  readDirectory,
  type Service,
  serve,
} from "@odsuite/sidecar";
import { host as gatewayHost } from "@open-motion/gateway/host";
import { initialFiles } from "@open-motion/workspace";
import { afterEach, describe, expect, it } from "vitest";
import { Client as APIClient } from "@/client.js";
import { serve as serveDaemon } from "@/service.js";

const roots: string[] = [];
const services: Service[] = [];

function call(
  endpoint: string,
  path: string,
  token: string,
  value?: unknown,
): Promise<{ body: unknown; status: number }> {
  const address = new URL(endpoint);
  const body = value === undefined ? undefined : JSON.stringify(value);
  return new Promise((resolve, reject) => {
    const operation = request(
      {
        headers: {
          ...(body ? { "content-length": Buffer.byteLength(body) } : {}),
          authorization: `Bearer ${token}`,
          origin: "open-motion://carrier",
        },
        host: address.hostname,
        method: body ? "POST" : "GET",
        path,
        port: address.port,
      },
      (response) => {
        const chunks: Buffer[] = [];
        response.on("data", (chunk: Buffer) => chunks.push(chunk));
        response.once("end", () =>
          resolve({
            body: JSON.parse(Buffer.concat(chunks).toString("utf8")),
            status: response.statusCode ?? 0,
          }),
        );
      },
    );
    operation.once("error", reject);
    operation.end(body);
  });
}

function preflight(endpoint: string, origin: string): Promise<{ allow?: string; status: number }> {
  const address = new URL(endpoint);
  return new Promise((resolve, reject) => {
    const operation = request(
      {
        headers: { origin },
        host: address.hostname,
        method: "OPTIONS",
        path: "/api/workspace_state",
        port: address.port,
      },
      (response) => {
        response.resume();
        response.once("end", () =>
          resolve({
            allow: response.headers["access-control-allow-origin"],
            status: response.statusCode ?? 0,
          }),
        );
      },
    );
    operation.once("error", reject);
    operation.end();
  });
}

afterEach(async () => {
  await Promise.all(services.splice(0).map((service) => service.close()));
  await Promise.all(roots.splice(0).map((root) => rm(root, { force: true, recursive: true })));
});

describe("daemon", () => {
  it.runIf(process.platform !== "win32")("consumes only sidecar granted resources", async () => {
    const root = await mkdtemp(join(tmpdir(), "odsuite-daemon-"));
    roots.push(root);
    const endpoint = join(root, "sidecar.sock");
    const sidecar = await serve(endpoint);
    services.push(sidecar);
    const client = new Client(endpoint, sidecar.authority);
    const scope = namespace("main");
    const owner = "attempt";
    const token = "fixturesecret";
    const data = await client.grant(
      { namespace: scope, channel: channel("stable") },
      { kind: "data", name: "daemon", scope: "factory" },
    );
    const socket = await client.grant(
      { namespace: scope, channel: channel("stable") },
      { kind: "socket", name: "daemon", owner, scope: "attempt" },
    );
    const port = await client.grant(
      { namespace: scope, channel: channel("stable") },
      { kind: "port", name: "daemon", owner, scope: "attempt", scheme: "http" },
    );
    const env = {
      ODSUITE_RUNTIME_DATA: data.value,
      ODSUITE_RUNTIME_ORIGIN: "open-motion://carrier",
      ODSUITE_RUNTIME_SOCKET: socket.value,
      ODSUITE_RUNTIME_TOKEN: token,
    };
    const here = dirname(fileURLToPath(import.meta.url));
    let lease: Lease | undefined;

    try {
      lease = await client.start({
        args: [join(here, "../dist/main.mjs")],
        channel: channel("stable"),
        command: process.execPath,
        env,
        generation: digest("daemonone"),
        namespace: scope,
        ready: "ready",
        service: "daemon",
      });
      await client.forward({ namespace: scope, channel: channel("stable") }, port.lease, socket.lease);

      expect(await preflight(port.value, "https://forged.invalid")).toMatchObject({ status: 403 });
      expect(await preflight(port.value, "open-motion://carrier")).toEqual({
        allow: "open-motion://carrier",
        status: 204,
      });
      expect(await call(port.value, "/health", "forged")).toMatchObject({ status: 401 });
      expect(await call(port.value, "/health", token)).toMatchObject({ body: { ok: true }, status: 200 });
      const api = new APIClient(port.value, token);
      const command = { requestId: randomUUID(), title: "persisted session", mode: "motion" as const };
      const created = await api.execute("session_create", command);
      expect(await api.execute("session_create", command)).toEqual(created);
      expect(await call(port.value, "/state", token)).toMatchObject({ status: 404 });
      await client.release(lease);
      lease = await client.start({
        args: [join(here, "../dist/main.mjs")],
        channel: channel("stable"),
        command: process.execPath,
        env,
        generation: digest("daemontwo"),
        namespace: scope,
        ready: "ready",
        service: "daemon",
      });
      expect((await api.execute("session_get", { sessionId: created.id })).title).toBe("persisted session");
    } finally {
      if (lease) await client.release(lease);
      await client.revoke({ namespace: scope, channel: channel("stable") }, port.lease);
      await client.revoke({ namespace: scope, channel: channel("stable") }, socket.lease);
    }
  });
});

it("preserves an escaped singleton over Peer and replays PNG adoption after edits and offline restart", async () => {
  const evidence = fileURLToPath(new URL(`../../../.artifacts/generation-adapter/${randomUUID()}/`, import.meta.url)),
    root = join(evidence, "sidecar"),
    scope = { channel: channel("dev"), namespace: namespace("adoption") },
    identity = "x".repeat(120),
    prompt = "\u0001".repeat(8000),
    png =
      "iVBORw0KGgoAAAANSUhEUgAAACAAAAAYCAYAAACbU/80AAAAPklEQVR4AcXBMQEAIAzAsK5CuPEvChtMRpN5535CEpOYxCQmMYlJTGISk5jEJCYxiUlMYhKTmMQkJjGJSWwBYl8CWwMRvGQAAAAASUVORK5CYII=";
  await mkdir(evidence, { recursive: true });
  let manager: Service | undefined,
    api: APIClient | undefined,
    submissions = 0,
    failure: unknown;
  const report: Record<string, unknown> = {},
    errors: unknown[] = [];
  const start = async (configured: boolean) => {
    manager = await serve(managerEndpoint(root), { root });
    const factory = manager.factory(scope),
      gateway = await gatewayHost(factory, {
        generation: digest("adoption-gateway"),
        provider: configured
          ? {
              id: identity,
              version: identity,
              models: [{ id: identity, label: "Fixture PNG" }],
              submit: async () => {
                submissions++;
                return { remoteId: "\u0001".repeat(256) };
              },
              read: async () => ({ state: "succeeded", bytes: Buffer.from(png, "base64") }),
              cancel: async () => ({ confirmed: true }),
            }
          : undefined,
      });
    let daemon: Awaited<ReturnType<typeof serveDaemon>> | undefined;
    await factory.expose({
      identity: { service: "daemon", generation: digest("adoption-daemon") },
      handlers: {},
      lifecycle: {
        initialize: async (context) => {
          const socket = await context.allocate({ kind: "socket", name: "daemon" }),
            port = await context.allocate({ kind: "port", name: "daemon", scheme: "http" });
          daemon = await context.background(() =>
            serveDaemon({
              data: context.roots.data,
              origin: "http://fixture.invalid",
              socket: socket.value,
              token: "fixture-authority",
              gateway,
            }),
          );
          await context.forward(port.value, socket.value);
          api = new APIClient(port.value, "fixture-authority");
        },
        quiesce: async () => daemon?.quiesce(),
        stop: async () => daemon?.close(),
      },
    });
  };
  try {
    await start(true);
    const client = () => {
      if (!api) throw Error("Daemon not ready");
      return api;
    };
    expect((await client().execute("generation_status", {})).configured).toBe(true);
    const session = await client().execute("session_create", {
        requestId: randomUUID(),
        title: "Material",
        mode: "motion",
      }),
      artifact = await client().execute("artifact_create", {
        requestId: randomUUID(),
        sessionId: session.id,
        title: "Project",
        files: initialFiles(),
      }),
      owner = { sessionId: session.id, artifactId: artifact.id },
      project = await client().execute("project_read", owner),
      selection = (await client().execute("workspace_state", {})).selection,
      create = {
        ...owner,
        requestId: randomUUID(),
        revision: project.revision,
        providerId: identity,
        providerVersion: identity,
        modelId: identity,
        prompt,
      },
      created = await client().execute("generation_create", create),
      selected = { ...owner, id: created.id };
    await expect.poll(async () => (await client().execute("generation_read", selected)).state).toBe("succeeded");
    expect(await client().execute("generation_create", create)).toEqual(created);
    expect(submissions).toBe(1);
    const page = await client().execute("generation_list", owner);
    expect(page.jobs.map((job) => job.id)).toEqual([created.id]);
    expect(page.jobs[0]?.prompt).toBe(prompt);
    expect(Buffer.byteLength(JSON.stringify(page))).toBeGreaterThan(48 * 1024);
    expect(Buffer.byteLength(JSON.stringify({ ok: true, value: { ok: true, value: page } }))).toBeLessThan(64 * 1024);
    expect(await client().execute("project_read", owner)).toEqual(project);
    expect((await client().execute("workspace_state", {})).selection).toEqual(selection);
    const result = await client().execute("generation_result", selected);
    expect(result.data).toBe(png);
    expect(result.candidate).toMatchObject({
      jobId: created.id,
      width: 32,
      height: 24,
      contentHash: digest(Buffer.from(png, "base64")),
    });
    expect(JSON.stringify(result)).not.toContain(root);
    const adopt = {
        ...selected,
        requestId: randomUUID(),
        expectedRevision: project.revision,
        path: "assets/generated.png",
        name: "Generated fixture",
        contentHash: result.candidate.contentHash,
      },
      adopted = await client().execute("generation_adopt", adopt);
    expect(adopted.files).toEqual(project.files);
    expect(adopted.resources).toHaveLength(1);
    expect((await client().execute("workspace_state", {})).selection).toEqual(selection);
    expect(await client().execute("generation_adopt", adopt)).toEqual(adopted);
    const later = await client().execute("project_save", {
      ...owner,
      requestId: randomUUID(),
      expectedRevision: adopted.revision,
      files: adopted.files.map((file) =>
        file.path === "index.html" ? { ...file, content: `${file.content}<!-- human edit -->` } : file,
      ),
    });
    expect(await client().execute("generation_adopt", adopt)).toEqual(adopted);
    expect(await client().execute("project_read", owner)).toEqual(later);
    await expect(
      client().execute("generation_adopt", { ...adopt, requestId: randomUUID(), path: "assets/stale.png" }),
    ).rejects.toMatchObject({ code: "conflict" });
    const other = await client().execute("session_create", { requestId: randomUUID(), title: "Other", mode: "motion" });
    await expect(client().execute("generation_result", { ...selected, sessionId: other.id })).rejects.toMatchObject({
      code: "ownership",
    });
    await expect(
      client().execute("generation_adopt", { ...adopt, requestId: randomUUID(), sessionId: other.id }),
    ).rejects.toMatchObject({ code: "ownership" });
    await manager!.close();
    expect((await readDirectory(root)).manager.phase).toBe("closed");
    expect(await observeProcesses(root)).toEqual([]);
    await start(false);
    expect((await client().execute("generation_status", {})).configured).toBe(false);
    expect((await client().execute("generation_list", owner)).jobs.map((job) => job.id)).toEqual([created.id]);
    expect(await client().execute("generation_result", selected)).toEqual(result);
    expect(await client().execute("generation_adopt", adopt)).toEqual(adopted);
    expect(await client().execute("project_read", owner)).toEqual(later);
    expect(submissions).toBe(1);
    report.acceptance = {
      id: created.id,
      candidate: result.candidate,
      adoptionRevision: adopted.revision,
      laterRevision: later.revision,
      offlineReceiptReplay: true,
      providerSubmissions: submissions,
      transport: "real authenticated HTTP; deterministic injected Provider, no model execution",
    };
  } catch (error) {
    failure = error;
  } finally {
    try {
      await manager?.close();
    } catch (error) {
      errors.push(error);
    }
    try {
      report.phase = (await readDirectory(root)).manager.phase;
      report.processes = await observeProcesses(root);
    } catch (error) {
      report.observation = "unknown";
      errors.push(error);
    }
    if (failure) report.failure = (failure as Error).message;
    report.cleanupErrors = errors.map(String);
    await writeFile(join(evidence, "result.json"), JSON.stringify(report, null, 2));
  }
  if (failure || errors.length)
    throw new AggregateError(
      [...(failure ? [failure] : []), ...errors],
      "Generation adapter acceptance failed; evidence retained",
    );
  expect(report.phase).toBe("closed");
  expect(report.processes).toEqual([]);
}, 20000);
