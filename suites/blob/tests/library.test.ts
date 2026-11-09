import assert from "node:assert/strict";
import { mkdir, mkdtemp, readdir, readFile, realpath, rename, writeFile } from "node:fs/promises";
import { createServer } from "node:http";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { channel, digest, namespace } from "@odsuite/protocol";
import { bundle } from "@odsuite/release";
import { type Context, managerEndpoint, serve } from "@odsuite/sidecar";
import { it } from "vitest";
import { Library, type Resource, resourceKey, source } from "@";

const spec = (bytes: Uint8Array, type: "file" | "directory" = "file"): Resource => ({
  artifact: { kind: "blob", slot: "probe", bytes: bytes.length, digest: digest(bytes) },
  type,
});
async function fixture(retentionMs = 0, intervalMs = 60000) {
  const root = await realpath(await mkdtemp(join(tmpdir(), "blob-library-"))),
    service = await serve(managerEndpoint(root), { root });
  const factory = service.factory({ channel: channel("stable"), namespace: namespace("primary") });
  let library!: Library,
    context!: Context,
    origin = "",
    requests = 0;
  const contents = new Map<string, Uint8Array>();
  const server = createServer((request, response) => {
    requests++;
    const bytes = contents.get(request.url!);
    if (!bytes) {
      response.statusCode = 404;
      response.end();
    } else response.end(bytes);
  });
  const attachment = await factory.expose({
    identity: { service: "electron", generation: digest("host") },
    handlers: {},
    lifecycle: {
      initialize: async (ctx) => {
        context = ctx;
        library = await Library.open({ factory, context: ctx, retentionMs, intervalMs });
        const port = await ctx.allocate({ kind: "port", name: "source", scheme: "http" }),
          socket = await ctx.allocate({ kind: "socket", name: "source" });
        origin = port.value;
        await new Promise<void>((done, reject) => server.listen(socket.value, done).once("error", reject));
        await ctx.forward(port.value, socket.value);
      },
      stop: async () => {},
    },
  });
  return {
    root,
    factory,
    library,
    context,
    contents,
    origin,
    get requests() {
      return requests;
    },
    close: async () => {
      await library.close();
      await new Promise<void>((done, reject) => server.close((e) => (e ? reject(e) : done())));
      await attachment.close();
      await service.close();
    },
  };
}
it("deduplicates demand loading and materializes verified files/directories under granted paths", async () => {
  const f = await fixture();
  try {
    const file = Buffer.from("model bytes"),
      tree = join(f.context.roots.runtime, "source-tree");
    await mkdir(join(tree, "nested"), { recursive: true });
    await writeFile(join(tree, "nested/value.txt"), "directory bytes");
    const archive = await bundle(tree),
      a = spec(file),
      b = spec(archive, "directory");
    f.contents.set("/file", file);
    f.contents.set("/tree", archive);
    await f.library.retain("current", "v1", [a, b]);
    const uses = await Promise.all([
      f.library.acquire(a, source(f.origin + "/file", a)),
      f.library.acquire(a, source(f.origin + "/file", a)),
      f.library.acquire(b, source(f.origin + "/tree", b)),
    ]);
    assert.equal(f.requests, 2);
    assert.equal(uses[0]!.path, uses[1]!.path);
    assert.notEqual(uses[0]!.id, uses[1]!.id);
    assert.equal(await readFile(uses[0]!.path, "utf8"), "model bytes");
    assert.equal(await readFile(join(uses[2]!.path, "nested/value.txt"), "utf8"), "directory bytes");
    for (const use of uses) await f.library.release(use);
    assert.deepEqual(await f.library.collect(), []);
    await f.library.unretain("current", "v1");
    assert.equal((await f.library.collect()).length, 2);
    for (const use of uses) await assert.rejects(readFile(use.path), /ENOENT/);
    const cas = (await f.factory.resources()).grants.find((g) => g.kind === "cas" && g.name === "blob")!;
    assert.deepEqual(await readdir(join(cas.value, "objects")), []);
  } finally {
    await f.close();
  }
});
it("retains actual process occupancy until sidecar proves retirement", async () => {
  const f = await fixture();
  try {
    const bytes = Buffer.from("process resource"),
      a = spec(bytes);
    f.contents.set("/file", bytes);
    const first = await f.library.acquire(a, source(f.origin + "/file", a));
    const lease = await f.factory.start({
      service: "reader",
      generation: digest("reader"),
      command: process.execPath,
      args: [
        "--input-type=module",
        "-e",
        "import{readFile}from'node:fs/promises';console.log('read:'+await readFile(process.argv[1],'utf8'));setInterval(()=>{},1000)",
        first.path,
      ],
      ready: "read:process resource",
    });
    const occupied = await f.library.acquire(a, source(f.origin + "/file", a), lease);
    await f.library.release(first);
    assert.deepEqual(await f.library.collect(), []);
    const entry = (await f.library.status()).entries[resourceKey(a)]!;
    assert.equal(entry.uses[0]!.owner.incarnation, lease.incarnation);
    assert.equal((await f.factory.release(lease)).status, "stopped");
    assert.deepEqual(await f.library.collect(), [resourceKey(a)]);
    assert.equal(await f.library.release(occupied), false);
  } finally {
    await f.close();
  }
});
it("applies a grace period and cancels candidacy when references return", async () => {
  const f = await fixture(60);
  try {
    const bytes = Buffer.from("retention"),
      a = spec(bytes);
    f.contents.set("/file", bytes);
    await writeFile(join(f.context.roots.data, "user-state"), "persistent user data");
    await f.library.prefetch(a, source(f.origin + "/file", a));
    const initial = (await f.library.status()).entries[resourceKey(a)]!.idleSince;
    assert.ok(initial);
    for (const kind of ["current", "prepared", "recovery"] as const) await f.library.retain(kind, "retained", [a]);
    assert.equal((await f.library.status()).entries[resourceKey(a)]!.idleSince, undefined);
    for (const kind of ["current", "prepared", "recovery"] as const) await f.library.unretain(kind, "retained");
    assert.deepEqual(await f.library.collect(), []);
    await new Promise((done) => setTimeout(done, 80));
    assert.deepEqual(await f.library.collect(), [resourceKey(a)]);
    assert.equal(await readFile(join(f.context.roots.data, "user-state"), "utf8"), "persistent user data");
    await f.library.prefetch(a, source(f.origin + "/file", a));
    assert.equal(f.requests, 2);
  } finally {
    await f.close();
  }
});
it("rejects type/platform/identity and corruption faults, then retries a failed fetch", async () => {
  const f = await fixture();
  try {
    const bytes = Buffer.from("expected"),
      a = spec(bytes);
    f.contents.set("/file", Buffer.from("corrupt!"));
    await assert.rejects(f.library.acquire(a, source(f.origin + "/file", a)), /integrity/);
    let status = await f.library.status();
    assert.equal(status.entries[resourceKey(a)]!.phase, "failed");
    assert.equal(status.entries[resourceKey(a)]!.uses.length, 0);
    f.contents.set("/file", bytes);
    const use = await f.library.acquire(a, source(f.origin + "/file", a));
    await writeFile(use.path, "corrupt cache");
    await assert.rejects(f.library.acquire(a, source(f.origin + "/file", a)), /integrity/);
    assert.deepEqual(await f.library.collect(), []);
    await f.library.release(use);
    await f.library.collect();
    await assert.rejects(
      async () =>
        f.library.acquire(
          { ...a, platform: process.platform === "darwin" ? "linux" : "darwin" },
          source(f.origin + "/file", a),
        ),
      /platform/,
    );
    await assert.rejects(
      f.library.acquire(a, source(f.origin + "/file", a), {
        service: "capsule",
        generation: digest("fake"),
        incarnation: f.context.incarnation,
      }),
      /subject/,
    );
    const directory = spec(bytes, "directory");
    await assert.rejects(f.library.acquire(directory, source(f.origin + "/file", directory)));
    status = await f.library.status();
    assert.equal(status.entries[resourceKey(directory)]!.phase, "failed");
    assert.equal(
      (await f.factory.resources()).grants.filter((g) => g.name === "blob" && g.kind === "staging").length,
      0,
    );
  } finally {
    await f.close();
  }
});

it("preserves occupancy for a failed stop and reclaims only after verified retirement", async () => {
  const f = await fixture();
  let fail = true;
  try {
    const bytes = Buffer.from("uncertain consumer"),
      a = spec(bytes);
    f.contents.set("/file", bytes);
    const subject = await f.factory.expose({
      identity: { service: "uncertain", generation: digest("uncertain") },
      handlers: {},
      lifecycle: {
        initialize: async () => {},
        stop: async () => {
          if (fail) throw Error("stop failed");
        },
      },
    });
    const use = await f.library.acquire(a, source(f.origin + "/file", a), {
      ...subject.context.identity,
      incarnation: subject.context.incarnation,
    });
    await assert.rejects(subject.close(), /stop failed/);
    assert.deepEqual(await f.library.collect(), []);
    assert.equal(await readFile(use.path, "utf8"), "uncertain consumer");
    fail = false;
    await subject.close();
    assert.deepEqual(await f.library.collect(), [resourceKey(a)]);
  } finally {
    await f.close();
  }
});
it("shares bytes across declared slots and fences independent logical epochs", async () => {
  const f = await fixture();
  try {
    const bytes = Buffer.from("shared object"),
      a = spec(bytes),
      b = { ...a, artifact: { ...a.artifact, slot: "other" } };
    f.contents.set("/file", bytes);
    const owner = { ...f.context.identity, incarnation: f.context.incarnation };
    const [first, second] = await Promise.all([
      f.library.acquire(a, source(f.origin + "/file", a), { ...owner, epoch: "document1" }),
      f.library.acquire(b, source(f.origin + "/file", b), { ...owner, epoch: "document2" }),
    ]);
    assert.equal(f.requests, 1);
    assert.notEqual(first.path, second.path);
    assert.deepEqual(Object.keys(first.owner).sort(), ["epoch", "generation", "incarnation", "manager", "service"]);
    await f.library.release(first);
    assert.deepEqual(await f.library.collect(), [resourceKey(a)]);
    assert.equal(await readFile(second.path, "utf8"), "shared object");
    await f.library.release(second);
    assert.deepEqual(await f.library.collect(), [resourceKey(b)]);
  } finally {
    await f.close();
  }
});

it("periodically rechecks unreferenced content after its grace period", async () => {
  const f = await fixture(30, 20);
  try {
    const bytes = Buffer.from("periodic collection"),
      a = spec(bytes);
    f.contents.set("/file", bytes);
    await f.library.prefetch(a, source(f.origin + "/file", a));
    const deadline = Date.now() + 2000;
    while ((await f.library.status()).entries[resourceKey(a)]) {
      if (Date.now() > deadline) throw Error("periodic GC did not retire the resource");
      await new Promise((done) => setTimeout(done, 20));
    }
  } finally {
    await f.close();
  }
});

it("refuses malformed directory archives before any path escapes its staging grant", async () => {
  const f = await fixture();
  try {
    const sentinel = join(f.context.roots.data, "sentinel");
    await writeFile(sentinel, "user bytes");
    const entry = (path: string, mode = 0o644) => ({
      path,
      mode,
      bytes: Buffer.from("replacement").toString("base64"),
    });
    for (const files of [
      [entry(sentinel)],
      [entry("../escape")],
      [entry("a/./b")],
      [entry("a"), entry("a")],
      [entry("a"), entry("a/file")],
      [entry("link", 0o120777)],
    ]) {
      const bytes = Buffer.from(JSON.stringify({ files, schema: 1 })),
        a = spec(bytes, "directory");
      f.contents.set("/archive", bytes);
      await assert.rejects(f.library.acquire(a, source(f.origin + "/archive", a)));
      const state = await f.library.status();
      assert.equal(state.entries[resourceKey(a)]!.phase, "failed");
      assert.equal(state.entries[resourceKey(a)]!.operation, undefined);
      assert.equal(await readFile(sentinel, "utf8"), "user bytes");
    }
  } finally {
    await f.close();
  }
});

it("cancels and drains an accepted prefetch as one lifecycle operation", async () => {
  const f = await fixture();
  try {
    const bytes = Buffer.from("pending prefetch"),
      a = spec(bytes);
    let loading = false;
    const work = f.library.prefetch(a, async (signal) => {
      loading = true;
      await new Promise<void>((_done, reject) => {
        signal.addEventListener("abort", () => reject(signal.reason), { once: true });
      });
      return bytes;
    });
    void work.catch(() => {});
    const deadline = Date.now() + 2000;
    while (!loading) {
      if (Date.now() > deadline) throw Error("prefetch did not start");
      await new Promise((done) => setTimeout(done, 10));
    }
    await f.library.close();
    await assert.rejects(work, /stopped/);
    const data = (await f.factory.resources()).grants.find((g) => g.kind === "data" && g.name === "blob")!.value;
    const state = JSON.parse(await readFile(join(data, "library.json"), "utf8"));
    assert.equal(state.owner, undefined);
    assert.equal(state.entries[resourceKey(a)].uses.length, 0);
    assert.equal(state.entries[resourceKey(a)].operation, undefined);
  } finally {
    await f.close();
  }
});

it("refuses a missing established ledger without losing live protection", async () => {
  const f = await fixture();
  try {
    const bytes = Buffer.from("live protected resource"),
      a = spec(bytes);
    f.contents.set("/file", bytes);
    const use = await f.library.acquire(a, source(f.origin + "/file", a));
    const data = (await f.factory.resources()).grants.find((g) => g.kind === "data" && g.name === "blob")!.value,
      ledger = join(data, "library.json"),
      evidence = join(data, "ledger-evidence.json");
    await rename(ledger, evidence);
    try {
      await assert.rejects(f.library.collect(), /metadata missing.*reconciliation/);
      await assert.rejects(
        f.factory.expose({
          identity: { service: "replacement", generation: digest("replacement") },
          handlers: {},
          lifecycle: {
            initialize: async (context) => {
              await Library.open({ factory: f.factory, context, retentionMs: 0 });
            },
            stop: async () => {},
          },
        }),
        /metadata missing.*reconciliation/,
      );
      await assert.rejects(readFile(ledger), /ENOENT/);
      assert.equal(await readFile(use.path, "utf8"), "live protected resource");
    } finally {
      await rename(evidence, ledger);
    }
    assert.deepEqual(await f.library.collect(), []);
    await f.library.release(use);
    await f.library.collect();
  } finally {
    await f.close();
  }
});

it("composes inside an existing factory lane, serializes parallel mutations and expires scoped handles", async () => {
  const f = await fixture();
  try {
    let escaped!: import("@").LibrarySession;
    const a = spec(Buffer.from("inline A")),
      b = spec(Buffer.from("inline B"));
    await f.factory.session(async () =>
      f.library.session(async (library) => {
        escaped = library;
        await Promise.all([library.retain("prepared", "a", [a]), library.retain("prepared", "b", [b])]);
        await library.prefetch(a, async () => Buffer.from("inline A"));
        const use = await library.acquire(a, async () => {
          throw Error("cache must be reused");
        });
        assert.equal(await readFile(use.path, "utf8"), "inline A");
        await library.release(use);
      }),
    );
    await assert.rejects(escaped.unretain("prepared", "a"), /expired/);
    assert.equal((await f.library.status()).references.length, 2);
    await f.library.unretain("prepared", "a");
    await f.library.unretain("prepared", "b");
    assert.equal((await f.library.collect()).length, 2);
  } finally {
    await f.close();
  }
});

it("aborts and drains accepted in-lane loads before controller shutdown", async () => {
  const f = await fixture();
  let entered!: () => void;
  const loading = new Promise<void>((done) => {
    entered = done;
  });
  try {
    const pending = f.factory.session(() =>
      f.library.session(async (library) => {
        await library.prefetch(spec(Buffer.from("interrupted inline")), (signal) => {
          entered();
          return new Promise((_done, reject) =>
            signal.addEventListener("abort", () => reject(signal.reason), { once: true }),
          );
        });
      }),
    );
    const refused = assert.rejects(pending, /stopped/);
    await loading;
    await f.library.close();
    await refused;
  } finally {
    await f.close();
  }
});

it("reads typed unit archives within the GC lane and exposes paths only under retained roots", async () => {
  const f = await fixture();
  let release = () => {};
  try {
    const directory = join(f.context.roots.runtime, "unit");
    await mkdir(directory);
    await writeFile(join(directory, "module.mjs"), "export const value=42;");
    const archive = await bundle(directory),
      unit: Resource = {
        type: "directory",
        artifact: { kind: "web", slot: "main", digest: digest(archive), bytes: archive.length },
      };
    assert.throws(() => resourceKey({ ...unit, type: "file" }), /directory type/);
    await f.library.prefetch(unit, async () => archive);
    await assert.rejects(
      f.library.session((l) => l.referencedPath(unit)),
      /retained reference/,
    );
    await f.library.retain("prepared", "unit", [unit]);
    const path = await f.library.session((l) => l.referencedPath(unit));
    assert.equal(await readFile(join(path, "module.mjs"), "utf8"), "export const value=42;");
    await f.library.unretain("prepared", "unit");
    let entered = () => {};
    const started = new Promise<void>((done) => {
      entered = done;
    });
    const gate = new Promise<void>((done) => {
      release = done;
    });
    const reading = f.library.session(async (l) => {
      assert.deepEqual(Buffer.from(await l.read(unit)), archive);
      entered();
      await gate;
    });
    await started;
    let collected = false;
    const gc = f.library.collect().then((v) => {
      collected = true;
      return v;
    });
    await new Promise((done) => setImmediate(done));
    assert.equal(collected, false);
    release();
    await reading;
    assert.deepEqual(await gc, [resourceKey(unit)]);
    await assert.rejects(
      f.library.session((l) => l.read(unit)),
      /cached content missing/,
    );
  } finally {
    release();
    await f.close();
  }
});
