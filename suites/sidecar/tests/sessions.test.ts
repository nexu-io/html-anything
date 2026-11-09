import { type ChildProcess, spawn } from "node:child_process";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createInterface } from "node:readline";
import { channel, digest, namespace } from "@odsuite/protocol";
import { expect, it } from "vitest";
import { Client, type Lease, readDirectory, type Service, type Spec, serve } from "@";
import { Sessions } from "@/runtime/sessions.js";

const scope = { namespace: namespace("main"), channel: channel("stable") };
const identity = { ...scope, service: "probe", generation: digest("one") };
const other = { ...scope, channel: channel("beta") };
const options = { identity, handlers: {}, lifecycle: { initialize: async () => {}, stop: async () => {} } };
const spec = (service = "daemon"): Spec => ({
  ...scope,
  service,
  generation: identity.generation,
  command: process.execPath,
  args: ["-e", "process.stdout.write('ready\\n');setInterval(()=>{},1000)"],
  ready: "ready",
  grace: 100,
});
function deferred() {
  let done = () => {};
  const promise = new Promise<void>((resolve) => {
    done = resolve;
  });
  return { promise, done };
}
async function fixture(run: (server: Service, client: Client, root: string) => Promise<void>) {
  const root = await mkdtemp(join(tmpdir(), "sessions-"));
  const server = await serve(join(root, "manager.sock"));
  try {
    await run(server, new Client(server.endpoint, server.authority), root);
  } finally {
    await server.close();
    await rm(root, { recursive: true, force: true });
  }
}
it("reenters local and loopback sessions during initialize and stop without waiting on itself", async () => {
  await fixture(async (server, client) => {
    let child: Lease | undefined;
    const trace: string[] = [];
    const attached = await server.session(scope, () =>
      server.session(scope, () =>
        server.expose({
          ...options,
          lifecycle: {
            initialize: async () => {
              trace.push("initializing");
              await client.session(scope, async (scoped) => {
                child = await scoped.start(spec());
              });
              trace.push("ready");
            },
            stop: async () => {
              if (child) await client.release(child);
              trace.push("retired");
            },
          },
        }),
      ),
    );
    expect(trace).toEqual(["initializing", "ready"]);
    expect(server.directory().sessions[0]).toMatchObject({ ...scope, kind: "local", phase: "completed" });
    await attached.close();
    expect(trace).toEqual(["initializing", "ready", "retired"]);
    expect(server.directory().instances.every((entry) => entry.phase === "retired")).toBe(true);
  });
});
it("serializes remote batches and commands while other namespace/channel lanes progress", async () => {
  await fixture(async (server, client, root) => {
    const entered = deferred(),
      gate = deferred();
    const trace: string[] = [];
    let secondEntered = false;
    let retained: Client | undefined;
    const first = client.session(scope, async () => {
      trace.push("first");
      entered.done();
      await gate.promise;
      trace.push("first-end");
    });
    await entered.promise;
    const file = join(root, "order.log");
    const command = (name: string, delay: number): Spec => ({
      ...spec(name),
      args: [
        "-e",
        `const fs=require('node:fs');fs.appendFileSync(${JSON.stringify(file)},'${name}:start\\n');setTimeout(()=>{fs.appendFileSync(${JSON.stringify(file)},'${name}:ready\\n');process.stdout.write('ready\\n');},${delay});setInterval(()=>{},1000);`,
      ],
    });
    const second = client.session(scope, async (scoped) => {
      secondEntered = true;
      retained = scoped;
      trace.push("second");
      const leases = await Promise.all([scoped.start(command("one", 30)), scoped.start(command("two", 0))]);
      await Promise.all(leases.map((lease) => scoped.release(lease)));
    });
    try {
      await server.session(other, async () => {
        trace.push("other");
      });
      expect(secondEntered).toBe(false);
      expect((await client.directory(scope)).sessions.find((entry) => entry.channel === scope.channel)?.phase).toBe(
        "active",
      );
    } finally {
      gate.done();
    }
    await Promise.all([first, second]);
    expect(trace.indexOf("second")).toBeGreaterThan(trace.indexOf("first-end"));
    expect((await readFile(file, "utf8")).trim().split("\n")).toEqual([
      "one:start",
      "one:ready",
      "two:start",
      "two:ready",
    ]);
    expect(retained).toBeTruthy();
    await expect(retained?.inspect()).rejects.toThrow("expired");
    const view = server.directory();
    expect(view.sessions.every((entry) => entry.phase === "completed")).toBe(true);
    expect(JSON.stringify(view.sessions)).not.toMatch(/token|authority|capability/);
  });
});
it("records failed callbacks, fences expired contexts and refuses cross-scope or manager-close cycles", async () => {
  await fixture(async (server, client) => {
    await expect(
      client.session(scope, async () => {
        throw new Error("secret callback detail");
      }),
    ).rejects.toThrow("secret callback detail");
    expect(server.directory().sessions[0]).toMatchObject({ phase: "failed", reason: "callback" });
    expect(JSON.stringify(server.directory())).not.toContain("secret callback detail");
    const trigger = deferred();
    let late: Promise<unknown> | undefined;
    await server.session(scope, async () => {
      late = trigger.promise.then(() => server.expose(options));
      await expect(server.session(other, async () => {})).rejects.toThrow("cross-scope");
      await expect(server.close()).rejects.toThrow("inside lifecycle session");
    });
    trigger.done();
    await expect(late).rejects.toThrow("expired");
    await client.session(scope, async (scoped) => {
      await expect(scoped.session(other, async () => {})).rejects.toThrow("cross-scope");
    });
    await server.expose(options);
  });
});
it("keeps business payloads caller-owned and requires a controller session for lifecycle writes", async () => {
  await fixture(async (server, client) => {
    let lease: Lease | undefined;
    type Methods = { start: { input: null; output: number } };
    await server.expose<Methods>({
      identity,
      handlers: {
        start: async (input) => {
          expect(input).toBeNull();
          lease = await client.start(spec());
          return lease.pid;
        },
      },
      lifecycle: {
        initialize: async () => {},
        stop: async () => {
          if (lease) await client.release(lease);
        },
      },
    });
    const peer = await client.connect<Methods>(identity);
    await expect(peer.call("start", null)).rejects.toThrow("controller session");
    const pid = await client.session(scope, async (scoped) =>
      (await scoped.connect<Methods>(identity)).call("start", null),
    );
    expect(pid).toBe(lease?.pid);
    await peer.stop();
    expect(server.directory().instances.every((entry) => entry.phase === "retired")).toBe(true);
  });
});
it("waits for an explicit callback and its accepted work before shutdown", async () => {
  await fixture(async (server, client) => {
    const entered = deferred(),
      gate = deferred();
    let closed = false;
    const session = client.session(scope, async (scoped) => {
      await scoped.start(spec());
      entered.done();
      await gate.promise;
    });
    await entered.promise;
    const shutdown = server.close().then(() => {
      closed = true;
    });
    expect(closed).toBe(false);
    gate.done();
    await Promise.all([session, shutdown]);
    expect(closed).toBe(true);
  });
});
const module = new URL("../dist/index.mjs", import.meta.url).href;
async function child(program: string, args: string[]) {
  const process = spawn(globalThis.process.execPath, ["--input-type=module", "-e", program, ...args], {
    stdio: ["pipe", "pipe", "pipe"],
  });
  const lines = createInterface({ input: process.stdout });
  const first = await new Promise<string>((done, reject) => {
    const timer = setTimeout(() => {
      process.kill("SIGKILL");
      reject(new Error("session fixture timeout"));
    }, 5000);
    process.once("error", (error) => {
      clearTimeout(timer);
      reject(error);
    });
    process.once("exit", () => {
      clearTimeout(timer);
      reject(new Error("session fixture exited"));
    });
    lines.once("line", (line) => {
      clearTimeout(timer);
      lines.close();
      done(line);
    });
  });
  return { process, first };
}
async function finish(process: ChildProcess, signal: NodeJS.Signals = "SIGTERM") {
  if (process.exitCode !== null || process.signalCode !== null) return;
  const ended = new Promise<void>((done) => process.once("exit", () => done()));
  process.kill(signal);
  await ended;
}
const ownerProgram = `import {Client} from ${JSON.stringify(module)};
 const [endpoint,authority,scope,mode]=process.argv.slice(1);const c=new Client(endpoint,authority,200);
 await c.session(JSON.parse(scope),async scoped=>{console.log('entered');process.stdin.resume();
   await new Promise(done=>process.stdin.once('data',()=>done()));});process.stdin.destroy();`;
it("coordinates real independent controllers and retains an interrupted lane without timeout stealing", async () => {
  const root = await mkdtemp(join(tmpdir(), "session-process-"));
  const children: ChildProcess[] = [];
  const authority = "session-fixture-authority";
  const endpoint = join(root, "manager.sock");
  try {
    const manager = await child(
      `import {serve} from ${JSON.stringify(module)};
      const s=await serve(process.argv[1], { authority: process.argv[2] });console.log('ready');process.stdin.resume();
      process.stdin.on('data',async()=>{try{await s.close();console.log('closed');process.stdin.destroy();}catch(error){console.log(error.message);}});`,
      [endpoint, authority],
    );
    children.push(manager.process);
    const first = await child(ownerProgram, [endpoint, authority, JSON.stringify(scope), "hold"]);
    children.push(first.process);
    const client = new Client(endpoint, authority);
    const ready = await client.directory(scope);
    expect(ready.sessions[0]?.kind).toBe("remote");
    let entered = false;
    const next = client.session(scope, async () => {
      entered = true;
    });
    const nextRejected = expect(next).rejects.toThrow("interrupted");
    await client.session(other, async () => {
      await new Promise((done) => setTimeout(done, 300));
    });
    expect(entered).toBe(false);
    await finish(first.process, "SIGKILL");
    await nextRejected;
    const view = await client.directory(scope);
    expect(view.sessions.find((entry) => entry.channel === scope.channel)).toMatchObject({
      phase: "interrupted",
      reason: "disconnect",
    });
    await expect(client.session(scope, async () => {})).rejects.toThrow("interrupted");
    await expect(client.factory(scope).grant({ kind: "data", name: "late", scope: "factory" })).rejects.toThrow(
      "interrupted",
    );
    await client.session(other, async () => {});
    const lines = createInterface({ input: manager.process.stdout as NonNullable<ChildProcess["stdout"]> });
    const reply = new Promise<string>((done) =>
      lines.once("line", (line) => {
        lines.close();
        done(line);
      }),
    );
    manager.process.stdin?.write("close");
    expect(await reply).toContain("recovery required");
    await finish(manager.process, "SIGKILL");
    const offline = await readDirectory(root);
    expect(offline.manager.phase).toBe("interrupted");
    expect(offline.sessions.find((entry) => entry.channel === scope.channel)?.phase).toBe("interrupted");
  } finally {
    await Promise.all(children.map((process) => finish(process, "SIGKILL")));
    await rm(root, { recursive: true, force: true });
  }
}, 15000);

it("fails closed instead of hanging when terminal session publication fails", async () => {
  for (const failing of ["closing", "completed"]) {
    const records: string[] = [];
    const sessions = new Sessions("fixture", {
      session: (record) => {
        records.push(record.phase);
        if (record.phase === failing) throw new Error("injected persistence failure");
      },
    });
    await expect(sessions.local(scope, async () => {})).rejects.toThrow("persistence failure");
    await expect(sessions.local(scope, async () => {})).rejects.toThrow("interrupted");
    await expect(sessions.shutdown(async () => {})).rejects.toThrow("recovery required");
    expect(records).toEqual(failing === "closing" ? ["active", "closing"] : ["active", "closing", "completed"]);
  }
});

it("does not quiesce a service before a competing lifecycle session releases its lane", async () => {
  await fixture(async (server, client) => {
    const attached = await server.expose(options);
    const peer = await client.connect(identity);
    const entered = deferred(),
      gate = deferred();
    const owner = client.session(scope, async () => {
      entered.done();
      await gate.promise;
    });
    await entered.promise;
    const stopped = attached.close();
    try {
      await server.session(other, async () => {});
      expect((await peer.probe()).phase).toBe("ready");
    } finally {
      gate.done();
    }
    await Promise.all([owner, stopped]);
    await expect(peer.probe()).rejects.toThrow("fenced");
  });
});

it("rejects allocations queued behind service drain without waiting for itself", async () => {
  await fixture(async (server, client) => {
    const attached = await server.expose(options);
    const entered = deferred(),
      gate = deferred();
    const owner = client.session(scope, async () => {
      entered.done();
      await gate.promise;
    });
    await entered.promise;
    const stopping = attached.close();
    const allocation = attached.context.allocate({ kind: "lock", name: "late" });
    const rejected = expect(allocation).rejects.toThrow("not allocating");
    gate.done();
    await Promise.all([owner, stopping, rejected]);
    expect(server.directory().instances[0]?.phase).toBe("retired");
  });
});
