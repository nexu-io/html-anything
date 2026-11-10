import { randomUUID } from "node:crypto";
import { createReadStream } from "node:fs";
import { mkdtemp, readFile, realpath, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import type { Resource, State } from "@odsuite/blob";
import { canonical, channel, digest, namespace } from "@odsuite/protocol";
import { managerEndpoint, observeProcesses, Peer, readDirectory, serve } from "@odsuite/sidecar";
import { expect, it } from "vitest";
import type { Tools } from "@";
import { host } from "@/host.js";
import type { RenderMethods } from "@/jobs/contract.js";

const names = ["browser", "ffmpeg", "ffprobe"] as const;
const poll = <T>(read: () => T | Promise<T>) => expect.poll(read, { timeout: 10000 });
function gate() {
  let release = () => {};
  const promise = new Promise<void>((done) => {
    release = done;
  });
  return { promise, release };
}
function tool(name: string, load?: (signal: AbortSignal) => Promise<void>, mode = 0o755) {
  const bytes = Buffer.from(
    canonical({
      schema: 1,
      files: [{ path: "binary", mode, bytes: Buffer.from(`fixture ${name}`).toString("base64") }],
    }),
  );
  return {
    resource: {
      type: "directory",
      artifact: { kind: "blob", slot: name, bytes: bytes.length, digest: digest(bytes) },
    } as Resource,
    executable: "binary",
    load: async (signal: AbortSignal) => {
      await load?.(signal);
      return bytes;
    },
  };
}
async function fixture(tools: Tools) {
  const root = await realpath(await mkdtemp(join(tmpdir(), "native-prepare-"))),
    manager = await serve(managerEndpoint(root), { root }),
    factory = manager.factory({ channel: channel("dev"), namespace: namespace("preparation") }),
    generation = digest("renderer prepare"),
    renderer = await host(factory, { generation, tools });
  const libraryRoot = (await factory.resources()).grants.find(
    (grant) => grant.kind === "data" && grant.name === "blob",
  )?.value;
  if (!libraryRoot) throw Error("actual renderer blob grant is missing");
  return {
    root,
    manager,
    factory,
    renderer,
    generation,
    ledger: async () => JSON.parse(await readFile(join(libraryRoot, "library.json"), "utf8")) as State,
    close: async () => {
      await manager.close();
      expect((await readDirectory(root)).manager.phase).toBe("closed");
      expect(await observeProcesses(root)).toEqual([]);
    },
  };
}

it("starts without waiting on loaders, settles all components, and reuses verified siblings on explicit retry and reopen", async () => {
  const browser = gate(),
    counts = { browser: 0, ffmpeg: 0, ffprobe: 0 };
  let fail = true;
  const tools: Tools = {
      browser: tool("browser", async () => {
        counts.browser++;
        await browser.promise;
      }),
      ffmpeg: tool("ffmpeg", async () => {
        counts.ffmpeg++;
        if (fail) throw Error("private upstream URL/credential/path must stay hidden");
      }),
      ffprobe: tool("ffprobe", async () => {
        counts.ffprobe++;
      }),
    },
    f = await fixture(tools),
    peer = new Peer<RenderMethods>(f.renderer.connection.endpoint, f.renderer.connection.capability);
  try {
    expect(await peer.call("native_prepare_read", {})).toMatchObject({
      ok: true,
      value: { attempt: 0, state: "idle" },
    });
    expect(await peer.call("native_prepare", {})).toMatchObject({
      ok: true,
      value: { attempt: 1, state: "preparing" },
    });
    expect(await peer.call("native_prepare", {})).toMatchObject({ ok: true, value: { attempt: 1 } });
    await poll(() => counts).toEqual({ browser: 1, ffmpeg: 1, ffprobe: 1 });
    await poll(() => f.renderer.prepareRead().components.ffprobe.state).toBe("ready");
    expect(await peer.call("export_list", { sessionId: randomUUID(), artifactId: randomUUID() })).toMatchObject({
      ok: true,
      value: { jobs: [] },
    });
    const ledger = await f.ledger(),
      uses = Object.values(ledger.entries).flatMap((entry) => entry.uses),
      owner = f.manager.directory().instances.find((entry) => entry.service === "renderer");
    expect(uses.some((use) => use.owner.service === "renderer" && use.owner.incarnation === owner?.incarnation)).toBe(
      true,
    );
    const awaiting = f.renderer.prepare();
    browser.release();
    const first = await awaiting;
    expect(first).toMatchObject({
      attempt: 1,
      state: "partial",
      components: { browser: { state: "ready" }, ffmpeg: { state: "failed" }, ffprobe: { state: "ready" } },
    });
    expect(JSON.stringify(first)).not.toContain("credential");
    expect(Object.values((await f.ledger()).entries).flatMap((entry) => entry.uses)).toEqual([]);
    fail = false;
    expect(await f.renderer.prepare()).toMatchObject({ attempt: 2, state: "ready" });
    expect(counts).toEqual({ browser: 1, ffmpeg: 2, ffprobe: 1 });
    expect(await f.renderer.prepare()).toMatchObject({ attempt: 3, state: "ready" });
    expect(counts).toEqual({ browser: 1, ffmpeg: 2, ffprobe: 1 });
    await f.renderer.close();
    const reopened = await host(f.factory, { generation: f.generation, tools });
    expect(reopened.prepareRead().state).toBe("idle");
    expect(await reopened.prepare()).toMatchObject({ attempt: 1, state: "ready" });
    expect(counts).toEqual({ browser: 1, ffmpeg: 2, ffprobe: 1 });
  } finally {
    browser.release();
    await f.close();
  }
});

it("quiesces pending materialization before retiring the renderer and keeps its real Use until loader drain", async () => {
  const started = gate(),
    aborted = gate(),
    drained = gate();
  const tools: Tools = {
      browser: tool("browser", async (signal) => {
        started.release();
        await new Promise<void>((done) => {
          if (signal.aborted) done();
          else signal.addEventListener("abort", () => done(), { once: true });
        });
        aborted.release();
        await drained.promise;
        signal.throwIfAborted();
      }),
      ffmpeg: tool("ffmpeg"),
      ffprobe: tool("ffprobe"),
    },
    f = await fixture(tools);
  let closing: Promise<void> | undefined,
    closed = false;
  try {
    const preparation = f.renderer.prepare();
    await started.promise;
    closing = f.manager.close().then(() => {
      closed = true;
    });
    await aborted.promise;
    expect(closed).toBe(false);
    expect(
      Object.values((await f.ledger()).entries)
        .flatMap((entry) => entry.uses)
        .some((use) => use.owner.service === "renderer"),
    ).toBe(true);
    drained.release();
    expect((await preparation).state).toBe("cancelled");
    await closing;
    expect(Object.values((await f.ledger()).entries).flatMap((entry) => entry.uses)).toEqual([]);
    await expect(f.renderer.prepare()).rejects.toThrow("stopping");
    expect((await readDirectory(f.root)).manager.phase).toBe("closed");
    expect(await observeProcesses(f.root)).toEqual([]);
  } finally {
    drained.release();
    await closing;
    await f.manager.close();
  }
});

it("rejects a non-executable or escaping declared path independently from prepared siblings", async () => {
  const tools: Tools = {
      browser: { ...tool("browser"), executable: "../escape" },
      ffmpeg: tool("ffmpeg", undefined, 0o644),
      ffprobe: tool("ffprobe"),
    },
    f = await fixture(tools);
  try {
    const result = await f.renderer.prepare();
    expect(result).toMatchObject({
      state: "partial",
      components: {
        browser: { state: "failed" },
        ffmpeg: { state: process.platform === "win32" ? "ready" : "failed" },
        ffprobe: { state: "ready" },
      },
    });
    expect(JSON.stringify(result)).not.toContain(f.root);
    expect(Object.values((await f.ledger()).entries).flatMap((entry) => entry.uses)).toEqual([]);
  } finally {
    await f.close();
  }
});

it.runIf(Boolean(process.env.OPEN_MOTION_NATIVE_MANIFEST))(
  "materializes the actual pinned native archives without claiming an execution probe",
  async () => {
    const path = resolve(process.env.OPEN_MOTION_NATIVE_MANIFEST!),
      manifest = JSON.parse(await readFile(path, "utf8")),
      counts = { browser: 0, ffmpeg: 0, ffprobe: 0 };
    const tool = (name: keyof Tools) => {
      const entry = manifest[name] as { path: string; resource: Resource; executable: string };
      return {
        resource: entry.resource,
        executable: entry.executable,
        load: async () => {
          counts[name]++;
          return createReadStream(resolve(dirname(path), entry.path));
        },
      };
    };
    const f = await fixture({ browser: tool("browser"), ffmpeg: tool("ffmpeg"), ffprobe: tool("ffprobe") });
    try {
      expect(await f.renderer.prepare()).toMatchObject({ state: "ready" });
      expect(await f.renderer.prepare()).toMatchObject({ state: "ready" });
      expect(counts).toEqual({ browser: 1, ffmpeg: 1, ffprobe: 1 });
      expect(Object.values((await f.ledger()).entries).flatMap((entry) => entry.uses)).toEqual([]);
      expect(await f.factory.inspect()).toEqual([]);
      await writeFile(
        join(f.root, "preparation-proof.json"),
        JSON.stringify(
          {
            qualification: "verified materialization/executable permission only; no execution probe",
            counts,
            status: f.renderer.prepareRead(),
          },
          null,
          2,
        ),
      );
    } finally {
      await f.close();
    }
  },
  60000,
);
