import { randomUUID } from "node:crypto";
import { mkdtemp, rm } from "node:fs/promises";
import { request } from "node:http";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { channel, digest, namespace } from "@odsuite/protocol";
import { Client, type Lease, type Service, serve } from "@odsuite/sidecar";
import { afterEach, describe, expect, it } from "vitest";
import { Client as APIClient } from "@/client.js";

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
