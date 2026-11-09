import { once } from "node:events";
import { mkdir, mkdtemp, readFile, realpath, rm, stat, symlink, writeFile } from "node:fs/promises";
import { connect, createServer } from "node:net";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { channel, digest, namespace } from "@odsuite/protocol";
import { afterEach, describe, expect, it } from "vitest";
import { serve } from "@";
import { Resources } from "../src/runtime/resource.js";

const hosts: Resources[] = [];

afterEach(async () => {
  await Promise.all(hosts.splice(0).map((item) => item.close()));
});

async function create(name: string, root?: string): Promise<{ host: Resources; root: string }> {
  const directory = root ?? (await mkdtemp(join(tmpdir(), "odsuite-resource-")));
  const host = await Resources.open({ channel: channel("stable"), namespace: namespace(name), root: directory });
  hosts.push(host);
  return { host, root: directory };
}

describe("resources", () => {
  it("registers a canonical durable installation target without deleting or silently aliasing it", async () => {
    const root = await realpath(await mkdtemp(join(tmpdir(), "installation-grant-"))),
      target = join(root, "target.app");
    await mkdir(target);
    await writeFile(join(target, "keep"), "installation bytes");
    const { host } = await create("installation", join(root, "authority"));
    const grant = await host.grant({ kind: "installation", name: "application", scope: "factory", target });
    expect(grant.value).toBe(target);
    await expect(host.release(grant.lease)).rejects.toThrow(/persistent/);
    await expect(host.grant({ kind: "installation", name: "other", scope: "factory", target })).rejects.toThrow(
      /resource/,
    );
    await expect(
      host.grant({ kind: "installation", name: "relative", scope: "factory", target: "../escape" }),
    ).rejects.toThrow(/target/);
    const alias = join(root, "alias.app");
    await symlink(target, alias);
    await expect(host.grant({ kind: "installation", name: "alias", scope: "factory", target: alias })).rejects.toThrow(
      /symlink/,
    );
    await host.close();
    expect(await readFile(join(target, "keep"), "utf8")).toBe("installation bytes");
  });
  it("keeps a granted port reserved until release", async () => {
    const { host } = await create("first");
    const grant = await host.grant({ kind: "port", name: "daemon", owner: "attempt", scope: "attempt" });
    const address = new URL(grant.value);
    const contender = createServer();

    await expect(
      new Promise<void>((done, reject) => {
        contender.once("error", reject);
        contender.listen(Number(address.port), address.hostname, done);
      }),
    ).rejects.toMatchObject({ code: "EADDRINUSE" });

    await host.release(grant.lease);
    await new Promise<void>((done, reject) => {
      contender.once("error", reject);
      contender.listen(Number(address.port), address.hostname, done);
    });
    await new Promise<void>((done) => contender.close(() => done()));
  });

  it("isolates durable paths by namespace and persists their truth", async () => {
    const root = await mkdtemp(join(tmpdir(), "odsuite-resource-"));
    const first = await create("first", root);
    const second = await create("second", root);
    const left = await first.host.grant({ kind: "data", name: "daemon", scope: "factory" });
    const right = await second.host.grant({ kind: "data", name: "daemon", scope: "factory" });

    expect(left.value).not.toBe(right.value);
    expect(await first.host.grant({ kind: "data", name: "daemon", scope: "factory" })).toEqual(left);
    const stored = JSON.parse(await readFile(join(root, "factories", "stable", "first", "registry.json"), "utf8"));
    expect(stored.grants).toEqual([left]);
  });

  it("reaps attempt resources only after its namespace closed cleanly", async () => {
    const root = await mkdtemp(join(tmpdir(), "odsuite-resource-"));
    const first = await create("main", root);
    const staging = await first.host.grant({
      kind: "staging",
      name: "capsule",
      owner: "attempt",
      scope: "attempt",
    });
    await first.host.close();
    hosts.splice(hosts.indexOf(first.host), 1);

    const second = await create("main", root);
    expect(second.host.snapshot().grants).toEqual([]);
    await expect(stat(staging.value)).rejects.toMatchObject({ code: "ENOENT" });
  });

  it("refuses scope confusion and cleanup with survivors", async () => {
    const { host } = await create("main");
    await expect(host.grant({ kind: "data", name: "daemon", owner: "attempt", scope: "attempt" })).rejects.toThrow(
      "scope mismatch",
    );
    const grant = await host.grant({ kind: "lock", name: "daemon", owner: "attempt", scope: "attempt" });
    await expect(host.release(grant.lease, [process.pid])).rejects.toThrow("survivors");
    expect(host.snapshot().grants).toContainEqual(grant);
  });

  it.runIf(process.platform !== "win32")("forwards a held port to a granted socket", async () => {
    const { host } = await create("main");
    const owner = "attempt";
    const port = await host.grant({ kind: "port", name: "daemon", owner, scope: "attempt" });
    const socket = await host.grant({ kind: "socket", name: "daemon", owner, scope: "attempt" });
    const target = createServer((connection) => connection.end("ready"));
    await new Promise<void>((done, reject) => {
      target.once("error", reject);
      target.listen(socket.value, done);
    });
    await host.forward(port.lease, socket.lease);
    const address = new URL(port.value);

    const output = await new Promise<string>((done, reject) => {
      const client = connect(Number(address.port), address.hostname);
      let value = "";
      client.on("data", (chunk) => (value += chunk.toString()));
      client.once("end", () => done(value));
      client.once("error", reject);
    });

    expect(output).toBe("ready");
    await new Promise<void>((done) => target.close(() => done()));
  });
});

it("binds complete factory APIs and isolates equal resource names across distribution channels", async () => {
  const root = await mkdtemp(join(tmpdir(), "factories-"));
  const server = await serve(join(root, "manager.sock"));
  const scope = { namespace: namespace("release-shared"), channel: channel("stable") };
  const left = server.factory(scope),
    right = server.factory({ ...scope, channel: channel("beta") });
  try {
    const [a, b] = await Promise.all([
      left.grant({ kind: "data", name: "same", scope: "factory" }),
      right.grant({ kind: "data", name: "same", scope: "factory" }),
    ]);
    expect(a.value).not.toBe(b.value);
    await writeFile(join(a.value, "witness"), "stable");
    await writeFile(join(b.value, "witness"), "beta");
    const pa = await left.grant({ kind: "port", name: "same", owner: "one", scope: "attempt" });
    const pb = await right.grant({ kind: "port", name: "same", owner: "one", scope: "attempt" });
    const sa = await left.grant({ kind: "socket", name: "same", owner: "one", scope: "attempt" });
    const sb = await right.grant({ kind: "socket", name: "same", owner: "one", scope: "attempt" });
    expect(pa.value).not.toBe(pb.value);
    expect(sa.value).not.toBe(sb.value);
    await expect(left.revoke(pb.lease)).rejects.toThrow("unknown");
    await expect(left.forward(pa.lease, sb.lease)).rejects.toThrow("invalid forward");
    const identity = { service: "same", generation: digest("one") };
    const options = { identity, handlers: {}, lifecycle: { initialize: async () => {}, stop: async () => {} } };
    const [one, two] = await Promise.all([left.expose(options), right.expose(options)]);
    expect(one.context.roots.data).not.toBe(two.context.roots.data);
    await writeFile(join(one.context.roots.data, "retained"), "same-factory");
    const peer = await right.connect(identity);
    expect((await peer.probe()).phase).toBe("ready");
    await one.close();
    const next = await left.expose({ ...options, identity: { ...identity, generation: digest("two") } });
    expect(await readFile(join(next.context.roots.data, "retained"), "utf8")).toBe("same-factory");
    await expect(left.start({ ...scope, channel: channel("beta"), service: "foreign" } as never)).rejects.toThrow(
      "factory identity mismatch",
    );
    const lease = await left.start({
      generation: identity.generation,
      service: "child",
      command: process.execPath,
      args: ["-e", "console.log('ready');setInterval(()=>{},1000)"],
      ready: "ready",
      grace: 100,
    });
    await expect(right.release(lease)).rejects.toThrow("factory identity mismatch");
    await left.release(lease);
    expect((await left.directory()).factories).toHaveLength(1);
    expect((await right.directory()).instances.every((entry) => entry.channel === "beta")).toBe(true);
    await left.session(async (factory) => {
      await factory.grant({ kind: "logs", name: "batch", scope: "factory" });
    });
    let retained: typeof left | undefined;
    await left.session(async (factory) => {
      retained = factory;
    });
    await expect(retained?.expose(options)).rejects.toThrow("expired");
    await server.close();
    const reopened = await serve(join(root, "next.sock"));
    try {
      expect(await reopened.factory(scope).grant({ kind: "data", name: "same", scope: "factory" })).toEqual(a);
      expect(await readFile(join(b.value, "witness"), "utf8")).toBe("beta");
      const view = await reopened.factory(scope).directory();
      expect(view.factories[0]).toMatchObject({ ...scope, phase: "ready" });
    } finally {
      await reopened.close();
    }
  } finally {
    await server.close();
    await rm(root, { recursive: true, force: true });
  }
});
it("rejects missing scope, legacy layout and factory-mismatched registry bytes", async () => {
  const root = await mkdtemp(join(tmpdir(), "factory-format-"));
  try {
    await expect(Resources.open({ root, namespace: namespace("main") } as never)).rejects.toThrow("channel");
    await mkdir(join(root, "namespaces"));
    await expect(serve(join(root, "old.sock"))).rejects.toThrow("unsupported");
    await expect(stat(join(root, "manager.sqlite"))).rejects.toMatchObject({ code: "ENOENT" });
    await rm(join(root, "namespaces"), { recursive: true });
    const a = await Resources.open({ root, channel: channel("stable"), namespace: namespace("main") });
    await a.grant({ kind: "data", name: "same", scope: "factory" });
    await a.close();
    const file = join(root, "factories/stable/main/registry.json");
    const state = JSON.parse(await readFile(file, "utf8"));
    state.channel = "beta";
    await writeFile(file, JSON.stringify(state));
    const before = await readFile(file);
    await expect(Resources.open({ root, channel: channel("stable"), namespace: namespace("main") })).rejects.toThrow(
      "invalid registry",
    );
    expect(await readFile(file)).toEqual(before);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

it.runIf(process.platform !== "win32")(
  "removes explicitly unset inherited environment fields inside the sidecar-owned process tree",
  async () => {
    const root = await mkdtemp(join(tmpdir(), "sidecar-env-"));
    const service = await serve(join(root, "manager.sock"), { root });
    const scope = { channel: channel("dev"), namespace: namespace("environment") },
      factory = service.factory(scope);
    const prior = process.env.ODSUITE_ENV_REMOVAL;
    process.env.ODSUITE_ENV_REMOVAL = "present";
    try {
      const lease = await factory.start({
        service: "environment",
        generation: digest("environment"),
        command: process.execPath,
        args: [
          "-e",
          "if(process.env.ODSUITE_ENV_REMOVAL!==undefined)process.exit(2);console.log('ready');setInterval(()=>{},1000)",
        ],
        ready: "ready",
        env: { ODSUITE_ENV_REMOVAL: null },
      });
      expect((await factory.release(lease)).status).toBe("stopped");
    } finally {
      if (prior === undefined) delete process.env.ODSUITE_ENV_REMOVAL;
      else process.env.ODSUITE_ENV_REMOVAL = prior;
      await service.close();
    }
  },
);

it.each(["release", "close"] as const)(
  "retires idle forwarded sockets when their port owner chooses %s",
  async (operation) => {
    const { host } = await create("idle");
    const port = await host.grant({ kind: "port", name: "front", owner: "attempt", scope: "attempt" });
    const socket = await host.grant({ kind: "socket", name: "back", owner: "attempt", scope: "attempt" });
    const target = createServer();
    await new Promise<void>((done) => target.listen(socket.value, done));
    await host.forward(port.lease, socket.lease);
    const accepted = once(target, "connection");
    const url = new URL(port.value),
      client = connect(Number(url.port), url.hostname);
    client.on("error", () => {});
    const [back] = await accepted;
    const clientClosed = once(client, "close");
    const stopping = operation === "release" ? host.release(port.lease) : host.close();
    let finished = false;
    try {
      finished = await Promise.race([
        stopping.then(() => true),
        new Promise<false>((done) => setTimeout(() => done(false), 500)),
      ]);
    } finally {
      client.destroy();
      back.destroy();
      await clientClosed;
      await stopping;
      await new Promise<void>((done) => target.close(() => done()));
    }
    expect(finished).toBe(true);
  },
);
