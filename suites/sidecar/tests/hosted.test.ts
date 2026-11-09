import { execFile } from "node:child_process";
import { mkdtemp, realpath, rm, stat } from "node:fs/promises";
import { createServer } from "node:http";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { promisify } from "node:util";
import { channel, digest, namespace } from "@odsuite/protocol";
import { afterEach, expect, it, vi } from "vitest";
import { Client, type Expose, type Service, serve } from "@";
import { Resources } from "../src/runtime/resource.js";

type Methods = { echo: { input: string; output: string }; count: { input: number; output: number } };
const identity = {
  channel: channel("stable"),
  namespace: namespace("probe"),
  generation: digest("first"),
  service: "probe",
};
const services: Service[] = [];
const roots: string[] = [];
afterEach(async () => {
  await Promise.all(services.splice(0).map((s) => s.close()));
  await Promise.all(roots.splice(0).map((r) => rm(r, { recursive: true, force: true })));
});
function deferred() {
  let done = () => {};
  const promise = new Promise<void>((r) => {
    done = r;
  });
  return { promise, done };
}
async function fixture() {
  const root = await realpath(await mkdtemp(join(tmpdir(), "hosted-")));
  roots.push(root);
  const server = await serve(join(root, "manager.sock"));
  services.push(server);
  const client = new Client(server.endpoint, server.authority);
  const options: Expose<Methods> = {
    identity,
    handlers: { echo: async (s) => s, count: async (n) => n + 1 },
    lifecycle: { initialize: async () => {}, stop: async () => {} },
  };
  return { root, server, client, options };
}

it("provides caller-owned methods to a separate process and injects managed roots", async () => {
  const { root, server, client, options } = await fixture();
  const attached = await server.expose<Methods>(options);
  for (const path of Object.values(attached.context.roots)) {
    expect(path.startsWith(`${root}/`)).toBe(true);
    expect((await stat(path)).isDirectory()).toBe(true);
  }
  const peer = await client.connect<Methods>(identity);
  expect(await peer.call("count", 4)).toBe(5);
  const probe = await peer.probe();
  expect(probe.identity).toEqual(identity);
  expect(JSON.stringify(probe)).not.toContain("token");
  const script = `import {Client} from ${JSON.stringify(new URL("../dist/index.mjs", import.meta.url).href)};
    const peer = await new Client(process.argv[1],process.env.ODSUITE_TEST_AUTHORITY).connect(JSON.parse(process.argv[2]));
    process.stdout.write(JSON.stringify(await peer.call('echo','separate process')));`;
  const result = await promisify(execFile)(
    process.execPath,
    ["--input-type=module", "-e", script, server.endpoint, JSON.stringify(identity)],
    { env: { ...process.env, ODSUITE_TEST_AUTHORITY: server.authority } },
  );
  expect(JSON.parse(result.stdout)).toBe("separate process");
  await peer.stop();
  await attached.closed;
  await expect(stat(attached.context.roots.runtime)).rejects.toMatchObject({ code: "ENOENT" });
  expect((await stat(attached.context.roots.data)).isDirectory()).toBe(true);
});

it("does not publish readiness until initialize completes; duplicate exposure cannot take ownership", async () => {
  const { server, client, options } = await fixture();
  const gate = deferred();
  options.lifecycle.initialize = () => gate.promise;
  const opening = server.expose<Methods>(options);
  await expect(client.connect(identity)).rejects.toThrow("not ready");
  await expect(server.expose<Methods>(options)).rejects.toThrow("already owned");
  gate.done();
  const attached = await opening;
  expect((await (await client.connect(identity)).probe()).phase).toBe("ready");
  await attached.close();
});

it("fences old clients and old attachment close after same-generation replacement", async () => {
  const { server, client, options } = await fixture();
  const first = await server.expose<Methods>(options);
  const old = await client.connect<Methods>(identity);
  await first.close();
  const second = await server.expose<Methods>(options);
  await first.close();
  await expect(old.call("count", 0)).rejects.toThrow("fenced");
  await expect(old.stop()).rejects.toThrow("fenced");
  expect(await (await client.connect<Methods>(identity)).call("echo", "new")).toBe("new");
  expect(second.context.incarnation).not.toBe(first.context.incarnation);
});

it("drains in-flight calls and coalesces local and remote stop", async () => {
  const { server, client, options } = await fixture();
  const entered = deferred();
  const gate = deferred();
  let stops = 0;
  options.handlers.echo = async () => {
    entered.done();
    await gate.promise;
    return "drained";
  };
  options.lifecycle.stop = async () => {
    stops++;
  };
  const attached = await server.expose<Methods>(options);
  const peer = await client.connect<Methods>(identity);
  const call = peer.call("echo", "");
  await entered.promise;
  const stopping = attached.close();
  const remote = peer.stop();
  expect((await peer.probe()).phase).toBe("stopping");
  await expect(peer.call("count", 1)).rejects.toThrow("not ready");
  expect(stops).toBe(0);
  gate.done();
  expect(await call).toBe("drained");
  await Promise.all([stopping, remote, attached.closed]);
  expect(stops).toBe(1);
});

it("retains ownership and temporary resources when stop fails; allows an explicit retry", async () => {
  const { server, client, options } = await fixture();
  let fail = true;
  options.lifecycle.stop = async () => {
    if (fail) throw new Error("body still owns resources");
  };
  const attached = await server.expose<Methods>(options);
  const peer = await client.connect<Methods>(identity);
  await expect(attached.close()).rejects.toThrow("still owns");
  expect((await peer.probe()).phase).toBe("failed");
  expect((await stat(attached.context.roots.runtime)).isDirectory()).toBe(true);
  await expect(server.expose<Methods>(options)).rejects.toThrow("already owned");
  await expect(server.close()).rejects.toThrow("did not drain");
  await expect(server.expose<Methods>({ ...options, identity: { ...identity, service: "other" } })).rejects.toThrow(
    "closing",
  );
  fail = false;
  await attached.close();
  await attached.closed;
});

it("drains initialization failure before allowing a replacement", async () => {
  const { server, client, options } = await fixture();
  let drained = false;
  options.lifecycle.initialize = async () => {
    throw new Error("init failed");
  };
  options.lifecycle.stop = async () => {
    drained = true;
  };
  await expect(server.expose<Methods>(options)).rejects.toThrow("init failed");
  expect(drained).toBe(true);
  await expect(client.connect(identity)).rejects.toThrow("not ready");
  options.lifecycle.initialize = async () => {};
  await server.expose<Methods>(options);
});

it("does not let shutdown retire a service while initialization is still running", async () => {
  const { server, options } = await fixture();
  const gate = deferred();
  let drained = false;
  const entered = deferred();
  options.lifecycle.initialize = async () => {
    entered.done();
    await gate.promise;
  };
  options.lifecycle.stop = async () => {
    drained = true;
  };
  const opening = server.expose<Methods>(options);
  await entered.promise;
  const rejected = expect(opening).rejects.toThrow("stopped during initialization");
  const stopping = server.close();
  expect(drained).toBe(false);
  gate.done();
  await Promise.all([rejected, stopping]);
  expect(drained).toBe(true);
});

it("rejects non-serializable call input without crashing the host", async () => {
  const { server, client, options } = await fixture();
  await server.expose<Methods>(options);
  const peer = await client.connect<Methods>(identity);
  await expect(peer.call("count", 1n as unknown as number)).rejects.toThrow();
  expect(await peer.call("count", 1)).toBe(2);
  await expect(client.connect({ ...identity, namespace: namespace("other") })).rejects.toThrow("not ready");
});

it("holds a managed port, forwards only owned sockets and releases resources after body drain", async () => {
  const { server, client, options } = await fixture();
  const http = createServer((_request, response) => response.end("caller protocol"));
  let endpoint = "";
  let socketPath = "";
  options.lifecycle.initialize = async (context) => {
    const socket = await context.allocate({ kind: "socket", name: "transport" });
    const port = await context.allocate({ kind: "port", name: "transport", scheme: "http" });
    socketPath = socket.value;
    endpoint = port.value;
    await new Promise<void>((done, reject) => {
      http.once("error", reject);
      http.listen(socket.value, done);
    });
    await expect(context.forward(port.value, "/unowned.sock")).rejects.toThrow("ownership mismatch");
    await context.forward(port.value, socket.value);
  };
  options.lifecycle.stop = () =>
    new Promise<void>((done, reject) => http.close((error) => (error ? reject(error) : done())));
  const attached = await server.expose<Methods>(options);
  expect(await (await fetch(endpoint, { headers: { connection: "close" } })).text()).toBe("caller protocol");
  const grants = (await client.resources(identity)).grants;
  expect(grants.filter((g) => g.kind === "port" || g.kind === "socket")).toHaveLength(2);
  await attached.close();
  await expect(fetch(endpoint, { signal: AbortSignal.timeout(1000) })).rejects.toThrow();
  await expect(stat(socketPath)).rejects.toMatchObject({ code: "ENOENT" });
  await expect(attached.context.allocate({ kind: "port", name: "late" })).rejects.toThrow("not allocating");
  expect((await client.resources(identity)).grants.every((g) => g.scope === "factory")).toBe(true);
});

it("keeps one service service across generations until successful retirement", async () => {
  const { server, client, options } = await fixture();
  let fail = true;
  const first = await server.expose<Methods>({
    ...options,
    lifecycle: {
      initialize: async () => {},
      stop: async () => {
        if (fail) throw new Error("drain failed");
      },
    },
  });
  const peer = await client.connect<Methods>(identity);
  const next = { ...options, identity: { ...identity, generation: digest("next") } };
  await expect(server.expose<Methods>(next)).rejects.toThrow("already owned");
  await expect(first.close()).rejects.toThrow("drain failed");
  await expect(server.expose<Methods>(next)).rejects.toThrow("already owned");
  fail = false;
  await first.close();
  const replacement = await server.expose<Methods>(next);
  expect(replacement.context.incarnation).not.toBe(first.context.incarnation);
  expect(replacement.context.roots.data).toBe(first.context.roots.data);
  await expect(client.connect(identity)).rejects.toThrow("not ready");
  await expect(peer.stop()).rejects.toThrow("fenced");
  await expect(first.context.allocate({ kind: "lock", name: "late" })).rejects.toThrow("not allocating");
  await first.close();
  expect(await (await client.connect<Methods>(next.identity)).call("echo", "next")).toBe("next");
});
it("retries partial grant retirement without releasing an already retired grant again", async () => {
  const { server, options } = await fixture();
  const paths: string[] = [];
  const attached = await server.expose<Methods>({
    ...options,
    lifecycle: {
      initialize: async (context) => {
        paths.push((await context.allocate({ kind: "lock", name: "first" })).value);
        paths.push((await context.allocate({ kind: "lock", name: "second" })).value);
      },
      stop: async () => {},
    },
  });
  const release = Resources.prototype.release;
  let calls = 0;
  const spy = vi.spyOn(Resources.prototype, "release").mockImplementation(function (this: Resources, ...args) {
    if (++calls === 2) return Promise.reject(new Error("injected retirement failure"));
    return release.apply(this, args);
  });
  try {
    await expect(attached.close()).rejects.toThrow("injected retirement failure");
    await expect(stat(paths[0] as string)).rejects.toMatchObject({ code: "ENOENT" });
    expect((await stat(paths[1] as string)).isFile()).toBe(true);
    await attached.close();
    await expect(stat(paths[1] as string)).rejects.toMatchObject({ code: "ENOENT" });
    await attached.closed;
  } finally {
    spy.mockRestore();
  }
});

it("drains a background controller before the remote stop lane and runs quiesce once", async () => {
  const { server, client, options } = await fixture();
  const gate = deferred();
  let work: Promise<void> = Promise.resolve(),
    quiesces = 0,
    stops = 0;
  const factory = client.factory(identity);
  options.lifecycle.initialize = async (context) => {
    work = context.background(() =>
      gate.promise.then(() =>
        factory.session(async (f) => {
          await f.grant({ kind: "data", name: "drained", scope: "factory" });
        }),
      ),
    );
  };
  options.lifecycle.quiesce = async () => {
    quiesces++;
    gate.done();
    await work;
  };
  options.lifecycle.stop = async () => {
    stops++;
    expect((await factory.resources()).grants.some((g) => g.name === "drained")).toBe(true);
  };
  const attached = await server.expose(options),
    peer = await client.connect(identity);
  await Promise.all([peer.stop(), attached.close(), attached.closed]);
  expect(quiesces).toBe(1);
  expect(stops).toBe(1);
});

it("preserves ownership after quiesce failure and retries before retiring resources", async () => {
  const { server, client, options } = await fixture();
  let fail = true,
    stops = 0;
  options.lifecycle.quiesce = async () => {
    if (fail) throw Error("background still owns work");
  };
  options.lifecycle.stop = async () => {
    stops++;
  };
  const attached = await server.expose(options),
    peer = await client.connect(identity);
  await expect(peer.stop()).rejects.toThrow("background still owns work");
  expect((await peer.probe()).phase).toBe("failed");
  expect(stops).toBe(0);
  expect((await stat(attached.context.roots.runtime)).isDirectory()).toBe(true);
  fail = false;
  await attached.close();
  await attached.closed;
  expect(stops).toBe(1);
});

it("publishes all hosted stopping phases before a blocked lifecycle can drain", async () => {
  const { server, options } = await fixture();
  const gate = deferred(),
    entered = deferred();
  const first = await server.expose<Methods>({
    ...options,
    lifecycle: {
      initialize: async () => {},
      stop: async () => {
        entered.done();
        await gate.promise;
      },
    },
  });
  await server.expose<Methods>({ ...options, identity: { ...identity, service: "other" } });
  const stopping = server.close();
  await entered.promise;
  let phases: string[] = [];
  try {
    phases = (await server.directory()).instances.filter((i) => i.kind === "hosted").map((i) => i.phase);
  } finally {
    gate.done();
    await stopping;
    await first.closed;
  }
  expect(phases).toEqual(["stopping", "stopping"]);
});
