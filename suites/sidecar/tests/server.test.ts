import { type ChildProcess, spawn } from "node:child_process";
import { randomBytes } from "node:crypto";
import { mkdtemp, rm, stat } from "node:fs/promises";
import { createConnection, createServer, Socket } from "node:net";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { channel, digest, namespace } from "@odsuite/protocol";
import { afterEach, describe, expect, it, vi } from "vitest";

import { Client, Peer, type Service, type Spec, serve } from "@";
import { selfWitness } from "../src/process/observe.js";

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

// Observe real receive events without replacing bytes, callbacks or dispatch. The sender
// waits until the receiver consumed the incomplete code point before writing its suffix.
async function fragmented(target: Socket, frame: Buffer, split: number) {
  const prefix = frame.subarray(0, split);
  const received = new Map<Socket, Buffer>();
  let observed = () => {};
  const arrival = new Promise<void>((done) => {
    observed = done;
  });
  const emit = Socket.prototype.emit;
  const tap = vi.spyOn(Socket.prototype, "emit").mockImplementation(function (
    this: Socket,
    event: string | symbol,
    ...args: unknown[]
  ) {
    if (event === "data" && Buffer.isBuffer(args[0])) {
      const bytes = Buffer.concat([received.get(this) ?? Buffer.alloc(0), args[0]]);
      received.set(this, bytes);
      if (bytes.equals(prefix)) observed();
    }
    return Reflect.apply(emit, this, [event, ...args]) as boolean;
  });
  try {
    target.write(prefix);
    await arrival;
  } finally {
    tap.mockRestore();
  }
  target.write(frame.subarray(split));
}

function exchange(endpoint: string, frame: Buffer, split: number) {
  return new Promise<{ ok: boolean; value?: unknown; error?: string }>((done, reject) => {
    const connection = createConnection(endpoint),
      chunks: Buffer[] = [];
    connection.once("error", reject);
    connection.once("connect", () => {
      void fragmented(connection, frame, split).catch(reject);
    });
    connection.on("data", (chunk: Buffer) => chunks.push(chunk));
    connection.once("end", () => {
      try {
        done(JSON.parse(Buffer.concat(chunks).toString("utf8")));
      } catch (error) {
        reject(error);
      }
    });
  });
}

it("preserves fragmented request and response Unicode with exact raw-byte bounds", async () => {
  const endpoint = await socket(),
    service = await serve(endpoint);
  services.push(service);
  const identity = {
    channel: channel("dev"),
    namespace: namespace("wire"),
    generation: digest("wire"),
    service: "echo",
  };
  let seen = "",
    output = "界🙂e\u0301";
  const attached = await service.expose<{ echo: { input: string; output: string } }>({
    identity,
    handlers: {
      echo: (input) => {
        seen = input;
        return output;
      },
    },
    lifecycle: { initialize: async () => {}, stop: async () => {} },
  });
  const peer = await new Client(endpoint, service.authority).connect<{ echo: { input: string; output: string } }>(
    identity,
  );
  const descriptor = peer.connection().capability,
    actor = await selfWitness();
  const request = (input: string) =>
    Buffer.from(`${JSON.stringify({ type: "invoke", operation: "call", descriptor, method: "echo", input, actor })}\n`);
  const word = "界🙂e\u0301",
    limit = 65536;
  let input = word.repeat(6000);
  input += "a".repeat(limit - request(input).length);
  const exact = request(input);
  expect(exact.length).toBe(limit);
  expect((await exchange(endpoint, exact, exact.indexOf(Buffer.from("界")) + 1)).ok).toBe(true);
  expect(seen).toBe(input);
  expect(seen).not.toContain("\ufffd");
  const over = request(`${input}a`);
  expect(over.length).toBe(limit + 1);
  expect(await exchange(endpoint, over, 200)).toMatchObject({ ok: false, error: "request exceeds limit" });
  const invalid = request(word);
  invalid[invalid.indexOf(Buffer.from("界"))] = 255;
  expect((await exchange(endpoint, invalid, 100)).ok).toBe(false);
  expect((await exchange(endpoint, Buffer.concat([Buffer.from([239, 187, 191]), request(word)]), 100)).ok).toBe(false);
  expect(seen).toBe(input);

  let proxyEndpoint = "",
    corrupt: "none" | "invalid" | "bom" = "none";
  const relay = createServer((downstream) => {
    const upstream = createConnection(endpoint),
      chunks: Buffer[] = [];
    downstream.pipe(upstream);
    upstream.on("error", () => downstream.destroy());
    downstream.on("error", () => upstream.destroy());
    downstream.once("close", () => upstream.destroy());
    upstream.on("data", (chunk: Buffer) => chunks.push(chunk));
    upstream.once("end", () => {
      let frame = Buffer.concat(chunks);
      const position = frame.indexOf(Buffer.from("界"));
      if (corrupt === "invalid") frame[position] = 255;
      if (corrupt === "bom") frame = Buffer.concat([Buffer.from([239, 187, 191]), frame]);
      void fragmented(downstream, frame, position + 2).then(
        () => downstream.end(),
        () => downstream.destroy(),
      );
    });
  });
  await service.expose({
    identity: { ...identity, service: "relay" },
    handlers: {},
    lifecycle: {
      initialize: async (context) => {
        const grant = await context.allocate({ kind: "socket", name: "relay" });
        proxyEndpoint = grant.value;
        await new Promise<void>((done) => relay.listen(grant.value, done));
      },
      stop: () => new Promise<void>((done, reject) => relay.close((error) => (error ? reject(error) : done()))),
    },
  });
  const relayed = new Peer<{ echo: { input: string; output: string } }>(proxyEndpoint, descriptor);
  output = word.repeat(6500);
  const response = () => Buffer.from(`${JSON.stringify({ ok: true, value: output })}\n`);
  output += "a".repeat(limit - response().length);
  expect(response().length).toBe(limit);
  expect(await relayed.call("echo", "response exact")).toBe(output);
  output += "a";
  expect(response().length).toBe(limit + 1);
  await expect(relayed.call("echo", "response over")).rejects.toThrow("response exceeds limit");
  output = word;
  corrupt = "invalid";
  await expect(relayed.call("echo", "response invalid")).rejects.toThrow();
  corrupt = "bom";
  await expect(relayed.call("echo", "response bom")).rejects.toThrow();
  await attached.close();
  expect(await new Client(endpoint, service.authority).inspect()).toEqual([]);
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
