import { type ChildProcess, spawn } from "node:child_process";
import { randomBytes } from "node:crypto";
import { mkdtemp, rm, stat } from "node:fs/promises";
import { createConnection } from "node:net";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { channel, digest, namespace } from "@odsuite/protocol";
import { afterEach, describe, expect, it } from "vitest";

import { Client, type Service, type Spec, serve } from "@";

const roots: string[] = [];
const services: Service[] = [];
const children: ChildProcess[] = [];

function spec(name: string): Spec {
  return {
    args: ["-e", "process.stdout.write('ready\\n');setInterval(()=>{},1000)"],
    channel: channel("stable"),
    command: process.execPath,
    generation: digest(name),
    grace: 200,
    namespace: namespace("main"),
    ready: "ready",
    service: "daemon",
    timeout: 500,
  };
}

async function socket(): Promise<string> {
  const root = await mkdtemp(join(tmpdir(), "sidecar-"));
  roots.push(root);
  return join(root, "socket");
}

function ready(child: ChildProcess): Promise<void> {
  return new Promise((resolve, reject) => {
    child.once("error", reject);
    child.stdout?.on("data", (chunk: Buffer) => {
      if (chunk.toString("utf8").includes("ready")) resolve();
    });
  });
}

function exit(child: ChildProcess): Promise<void> {
  return new Promise((resolve) => child.once("exit", () => resolve()));
}

function raw(endpoint: string, input: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const socket = createConnection(endpoint);
    let output = "";

    socket.once("connect", () => socket.write(input));
    socket.once("error", reject);
    socket.on("data", (chunk: Buffer) => {
      output += chunk.toString("utf8");
      if (output.includes("\n")) {
        socket.destroy();
        resolve(output);
      }
    });
  });
}

afterEach(async () => {
  await Promise.all(services.splice(0).map((service) => service.close()));

  for (const child of children.splice(0)) {
    if (child.exitCode === null) child.kill("SIGTERM");
    if (child.exitCode === null) await exit(child);
  }

  await Promise.all(roots.splice(0).map((root) => rm(root, { force: true, recursive: true })));
});

describe("server", () => {
  it("isolates management authority from attachment capabilities", async () => {
    const endpoint = await socket();
    const service = await serve(endpoint);
    services.push(service);
    const client = new Client(endpoint, service.authority);
    const first = await client.start(spec("ipc"));
    const second = await client.attach(first);

    expect(second.capability).not.toBe(first.capability);
    await expect(new Client(endpoint, "forged").inspect()).rejects.toThrow("authority");
    expect(await client.release(first)).toMatchObject({ status: "retained" });
    await expect(client.attach(first)).rejects.toThrow("capability");
    expect(await client.release(second)).toMatchObject({ status: "stopped" });
  });

  it("contains malformed requests", async () => {
    const endpoint = await socket();
    const service = await serve(endpoint);
    services.push(service);

    expect(JSON.parse(await raw(endpoint, "{broken}\n"))).toMatchObject({ ok: false });
    expect(await new Client(endpoint, service.authority).inspect()).toEqual([]);
  });

  it("serves namespace resource truth over the management channel", async () => {
    const endpoint = await socket();
    const service = await serve(endpoint);
    services.push(service);
    const client = new Client(endpoint, service.authority);
    const scope = namespace("main");
    const grant = await client.grant(
      { channel: channel("stable"), namespace: scope },
      {
        kind: "staging",
        name: "capsule",
        owner: "attempt",
        scope: "attempt",
      },
    );

    expect((await client.resources({ channel: channel("stable"), namespace: scope })).grants).toEqual([grant]);
    await expect(
      new Client(endpoint, "forged").resources({ channel: channel("stable"), namespace: scope }),
    ).rejects.toThrow("authority");
    expect((await client.revoke({ channel: channel("stable"), namespace: scope }, grant.lease)).grants).toEqual([]);
  });

  it("issues attempt capabilities across channel and namespace boundaries", async () => {
    const endpoint = await socket();
    const service = await serve(endpoint);
    services.push(service);
    const client = new Client(endpoint, service.authority);
    const permit = {
      channel: channel("beta"),
      namespace: namespace("main"),
      owner: "attempt",
      service: "daemon",
    };
    const first = await client.issue(permit);
    const repeated = await client.issue(permit);
    const isolated = await client.issue({ ...permit, namespace: namespace("preview") });

    expect(repeated).toEqual(first);
    expect(isolated.token).not.toBe(first.token);
    await expect(new Client(endpoint, "forged").issue(permit)).rejects.toThrow("authority");
    expect(await client.retire(first)).toBe(true);
    expect((await client.issue(permit)).token).not.toBe(first.token);
    expect(await client.retire(first)).toBe(false);
  });

  it("serializes binding transitions behind management authority", async () => {
    const endpoint = await socket();
    const service = await serve(endpoint);
    services.push(service);
    const client = new Client(endpoint, service.authority);
    const scope = namespace("main");
    const lane = channel("beta");
    const target = digest("generation");
    const initial = await client.binding(scope, lane);
    const changed = await client.transit(scope, lane, initial.revision, {
      mode: "update",
      target,
      type: "arm",
    });
    const stale = await client.transit(scope, lane, initial.revision, {
      nonce: "attempt",
      target,
      type: "begin",
    });

    expect(changed).toMatchObject({ changed: true, journal: { revision: 1 }, ok: true });
    expect(stale).toMatchObject({ fault: "revision", journal: { revision: 1 }, ok: false });
    await expect(new Client(endpoint, "forged").binding(scope, lane)).rejects.toThrow("authority");
  });

  it.runIf(process.platform !== "win32")("runs as an independent supervisor", async () => {
    const endpoint = await socket();
    const authority = randomBytes(32).toString("base64url");
    const here = dirname(fileURLToPath(import.meta.url));
    const main = join(here, "../dist/main.mjs");
    const child = spawn(process.execPath, [main], {
      env: {
        ...process.env,
        ODSUITE_RUNTIME_SIDECAR_AUTHORITY: authority,
        ODSUITE_RUNTIME_SIDECAR_ENDPOINT: endpoint,
      },
      stdio: ["ignore", "pipe", "pipe"],
    });
    children.push(child);
    await ready(child);
    const mode = (await stat(endpoint)).mode & 0o777;
    const client = new Client(endpoint, authority);
    const lease = await client.start(spec("process"));

    expect(mode).toBe(0o600);
    expect(lease.pid).not.toBe(child.pid);
    expect(await client.inspect()).toHaveLength(1);
    child.kill("SIGTERM");
    await exit(child);
    expect(() => process.kill(lease.pid, 0)).toThrow();
  });
});
