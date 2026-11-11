import { spawn } from "node:child_process";
import { randomUUID } from "node:crypto";
import { chmod, lstat, mkdir, mkdtemp, readFile, writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import { DatabaseSync } from "node:sqlite";
import { pathToFileURL } from "node:url";
import { channel, namespace } from "@odsuite/protocol";
import { bundle } from "@odsuite/release";
import { managerEndpoint, observeProcesses, serve } from "@odsuite/sidecar";
import { expect, it } from "vitest";
import { open } from "@";
import { hash } from "../src/archive.js";

async function fixture() {
  const base = resolve("../../.artifacts/installation-gc");
  await mkdir(base, { recursive: true });
  const root = await mkdtemp(join(base, "gc-")),
    data = join(root, "runtime"),
    options = {
      home: join(root, "home"),
      product: "io.test.app",
      scope: { channel: channel("stable"), namespace: namespace("collection") },
    };
  await mkdir(data);
  await writeFile(join(data, "user-project.txt"), "persistent project and history");
  const input = async (carrier: string, version: string) => {
    const source = join(root, carrier + version + randomUUID());
    await mkdir(join(source, "nested"), { recursive: true });
    await writeFile(join(source, "main.mjs"), "export const installed=true;");
    await writeFile(join(source, "nested", "data.json"), '{"fixture":true}');
    await writeFile(
      join(source, "runtime.json"),
      JSON.stringify({ carrier, version, channel: "stable", files: ["main.mjs", "nested/data.json", "runtime.json"] }),
    );
    const bytes = await bundle(source);
    return { data, requestId: randomUUID(), source: { bytes, sha256: hash(bytes) } };
  };
  const a = await input("standalone", "1.0.0"),
    b = await input("standalone", "2.0.0"),
    s = await open(options);
  try {
    return { root, data, options, input, a, b, old: await s.install(a), current: await s.install(b) };
  } finally {
    await s.close();
  }
}

it("collects only superseded closures and retains selection, staged code, references, receipts and user data", async () => {
  const f = await fixture(),
    s = await open(f.options);
  try {
    const staged = await s.stage(await f.input("codexplugin", "3.0.0")),
      referenced = await s.install(await f.input("codexplugin", "1.0.0"));
    await s.install(await f.input("codexplugin", "2.0.0"));
    const plan = await s.gc.plan([referenced.requestId]);
    expect(plan.entries.find((e) => e.receipt.path === f.old.path)?.reasons).toEqual([]);
    expect(plan.entries.find((e) => e.receipt.path === f.current.path)?.reasons).toContain("current-selection");
    expect(plan.entries.find((e) => e.receipt.path === staged.path)?.reasons).toContain("unselected-preparation");
    expect(plan.entries.find((e) => e.receipt.path === referenced.path)?.reasons).toContain("caller-reference");
    const input = { requestId: randomUUID(), expected: plan.fingerprint, protectedReceipts: [referenced.requestId] },
      result = await s.gc.apply(input);
    expect(result.complete).toBe(true);
    expect(result.retired).toEqual([f.old.path]);
    await expect(lstat(f.old.path)).rejects.toMatchObject({ code: "ENOENT" });
    expect(await s.read("standalone")).toEqual(f.current);
    expect(await readFile(join(staged.path, "main.mjs"), "utf8")).toContain("installed=true");
    expect(await readFile(join(referenced.path, "main.mjs"), "utf8")).toContain("installed=true");
    expect(await readFile(join(f.data, "user-project.txt"), "utf8")).toBe("persistent project and history");
    await expect(s.install(f.a)).rejects.toMatchObject({ code: "retired" });
    await expect(s.install({ ...f.a, requestId: randomUUID() })).rejects.toMatchObject({ code: "retired" });
    const db = new DatabaseSync(join(s.context.roots.data, "installations.sqlite"), { readOnly: true });
    try {
      expect(db.prepare("SELECT id FROM receipts WHERE id=?").get(f.a.requestId)?.id).toBe(f.a.requestId);
    } finally {
      db.close();
    }
    const newer = await s.install(await f.input("standalone", "4.0.0"));
    expect(await s.gc.apply(input)).toEqual(result);
    expect(await s.read("standalone")).toEqual(newer);
    expect((await s.gc.plan([])).entries.some((e) => e.receipt.path === f.old.path)).toBe(false);
  } finally {
    await s.close();
  }
});

it("rejects stale plans after selection or references change, without beginning deletion", async () => {
  const f = await fixture(),
    s = await open(f.options);
  try {
    const plan = await s.gc.plan([]);
    await expect(
      s.gc.apply({ requestId: randomUUID(), expected: plan.fingerprint, protectedReceipts: [f.old.requestId] }),
    ).rejects.toThrow("stale");
    await s.install(await f.input("standalone", "3.0.0"));
    await expect(
      s.gc.apply({ requestId: randomUUID(), expected: plan.fingerprint, protectedReceipts: [] }),
    ).rejects.toThrow("stale");
    expect(await s.gc.read()).toBeUndefined();
    expect((await lstat(f.old.path)).isDirectory()).toBe(true);
  } finally {
    await s.close();
  }
});

it("requires explicit transition reconciliation and retains incomplete installation intent", async () => {
  const f = await fixture(),
    requestId = randomUUID();
  const s = await open({
    ...f.options,
    onCheckpoint: async (event) => {
      if (event.requestId === requestId && event.phase === "installed") throw Error("interrupted install");
    },
  });
  try {
    const input = { ...(await f.input("codexplugin", "1.0.0")), requestId };
    await expect(s.install(input)).rejects.toThrow("interrupted install");
    const entry = (await s.gc.plan([])).entries.find((e) => e.receipt.requestId === requestId);
    expect(entry?.reasons).toContain("incomplete-installation");
    const transition = await s.transitions.begin({ requestId: randomUUID(), intent: { fixture: true }, data: null });
    await expect(s.gc.plan([])).rejects.toThrow("transition must resume");
    await s.transitions.advance({ requestId: transition.requestId, expectedRevision: 0, data: null, complete: true });
    expect((await s.gc.plan([])).entries.some((e) => e.receipt.requestId === requestId)).toBe(true);
  } finally {
    await s.close();
  }
});

it("refuses a live runtime and only plans after sidecar confirms complete retirement", async () => {
  const f = await fixture(),
    s = await open(f.options),
    service = await serve(managerEndpoint(f.data), { root: f.data });
  try {
    await expect(s.gc.plan([])).rejects.toThrow();
    expect((await lstat(f.old.path)).isDirectory()).toBe(true);
    await service.close();
    expect(await observeProcesses(f.data)).toEqual([]);
    expect((await s.gc.plan([])).entries.find((e) => e.receipt.path === f.old.path)?.reasons).toEqual([]);
  } finally {
    await service.close();
    await s.close();
  }
});

it("protects an actually surviving old entry process after installer closure, then collects after real exit", async () => {
  const f = await fixture(),
    s = await open(f.options);
  await s.select({ expected: { standalone: f.current.requestId }, receipts: { standalone: f.old.requestId } });
  await s.close();
  const script = `import{open}from ${JSON.stringify(pathToFileURL(resolve("dist/index.mjs")).href)};const f=JSON.parse(process.argv[1]),s=await open(f.options);await s.use({requestId:f.old.requestId,application:f.old.path,data:f.data,carrier:"standalone"});await s.close();console.log("ready");setInterval(()=>{},1000);`;
  const child = spawn(process.execPath, ["--input-type=module", "-e", script, JSON.stringify(f)], {
    stdio: ["ignore", "pipe", "pipe"],
  });
  let output = "",
    errors = "";
  child.stdout.on("data", (b) => (output += b));
  child.stderr.on("data", (b) => (errors += b));
  const exited = new Promise<void>((done, reject) => {
    child.once("exit", () => done());
    child.once("error", reject);
  });
  try {
    await expect
      .poll(
        () => {
          if (child.exitCode !== null) throw Error(errors);
          return output.includes("ready");
        },
        { timeout: 10000 },
      )
      .toBe(true);
    const current = await open(f.options);
    try {
      await current.select({
        expected: { standalone: f.old.requestId },
        receipts: { standalone: f.current.requestId },
      });
      const plan = await current.gc.plan([]);
      expect(plan.entries.find((e) => e.receipt.path === f.old.path)?.reasons).toContain("live-consumer");
      const blocked = await current.gc.apply({
        requestId: randomUUID(),
        expected: plan.fingerprint,
        protectedReceipts: [],
      });
      expect(blocked.retired).toEqual([]);
      expect((await lstat(f.old.path)).isDirectory()).toBe(true);
      expect(child.kill("SIGTERM")).toBe(true);
      await exited;
      const free = await current.gc.plan([]),
        result = await current.gc.apply({ requestId: randomUUID(), expected: free.fingerprint, protectedReceipts: [] });
      expect(result.retired).toEqual([f.old.path]);
      expect(await current.read("standalone")).toEqual(f.current);
    } finally {
      await current.close();
    }
  } finally {
    if (child.exitCode === null && child.signalCode === null) child.kill("SIGKILL");
    await exited;
  }
}, 30000);

for (const phase of ["retiring", "file", "removed"] as const)
  it(`resumes exact collection after interruption at ${phase} and fences conflicting mutations`, async () => {
    const f = await fixture();
    let once = true;
    let s = await open({
      ...f.options,
      onCollectionCheckpoint: async (event) => {
        if (once && event.phase === phase) {
          once = false;
          throw Error("interrupted collector");
        }
      },
    });
    const plan = await s.gc.plan([]),
      input = { requestId: randomUUID(), expected: plan.fingerprint, protectedReceipts: [] };
    try {
      await expect(s.gc.apply(input)).rejects.toThrow("interrupted collector");
      expect((await s.gc.read())?.complete).toBe(false);
      await expect(s.install(f.b)).rejects.toThrow("collection must resume");
      await expect(s.stage(f.b)).rejects.toThrow("collection must resume");
      await expect(s.gc.apply({ ...input, requestId: randomUUID() })).rejects.toThrow("collection must resume");
      await expect(s.gc.apply({ ...input, expected: `sha256:${"0".repeat(64)}` })).rejects.toMatchObject({
        code: "idempotency",
      });
      await s.close();
      s = await open(f.options);
      expect((await s.gc.apply(input)).complete).toBe(true);
      expect(await s.gc.read()).toBeUndefined();
      await expect(lstat(f.old.path)).rejects.toMatchObject({ code: "ENOENT" });
      expect(await s.read("standalone")).toEqual(f.current);
    } finally {
      await s.close();
    }
  });

it("retains uncertain partial deletion when an unexpected file appears and never touches that file", async () => {
  const f = await fixture(),
    s = await open({
      ...f.options,
      onCollectionCheckpoint: async (event) => {
        if (event.phase === "retiring") throw Error("paused");
      },
    });
  try {
    const plan = await s.gc.plan([]),
      input = { requestId: randomUUID(), expected: plan.fingerprint, protectedReceipts: [] };
    await expect(s.gc.apply(input)).rejects.toThrow("paused");
    await chmod(f.old.path, 0o700);
    await writeFile(join(f.old.path, "foreign.txt"), "not owned");
    await expect(s.gc.apply(input)).rejects.toThrow("unexpected retiring closure entry");
    expect(await readFile(join(f.old.path, "foreign.txt"), "utf8")).toBe("not owned");
    expect(await readFile(join(f.old.path, "main.mjs"), "utf8")).toContain("installed=true");
    expect((await s.gc.read())?.complete).toBe(false);
  } finally {
    await s.close();
  }
});
