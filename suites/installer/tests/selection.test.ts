import { randomUUID } from "node:crypto";
import { mkdir, mkdtemp, writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import { channel, namespace } from "@odsuite/protocol";
import { bundle } from "@odsuite/release";
import { observeProcesses, readDirectory } from "@odsuite/sidecar";
import { expect, it } from "vitest";
import { open, type Session } from "@";
import { hash } from "../src/archive.js";

async function fixture() {
  const base = resolve("../../.artifacts/installer-selection");
  await mkdir(base, { recursive: true });
  const root = await mkdtemp(join(base, "selection-")),
    options = {
      home: join(root, "home"),
      product: "io.test.app",
      scope: { channel: channel("stable"), namespace: namespace("selection") },
    },
    data = join(root, "runtime");
  const input = async (carrier: string, version: string) => {
    const dir = join(root, carrier + version);
    await mkdir(dir);
    await writeFile(join(dir, "main.mjs"), "export const fixture=true;");
    await writeFile(
      join(dir, "runtime.json"),
      JSON.stringify({ carrier, version, channel: "stable", files: ["main.mjs", "runtime.json"] }),
    );
    const bytes = await bundle(dir);
    return { data, requestId: randomUUID(), source: { bytes, sha256: hash(bytes) } };
  };
  return { root, options, input };
}
it("stages without selecting, verifies same-intent replay and atomically switches a complete matching set", async () => {
  const f = await fixture(),
    s = await open(f.options);
  try {
    const a = {
        standalone: await s.install(await f.input("standalone", "1.0.0")),
        codexplugin: await s.install(await f.input("codexplugin", "1.0.0")),
      },
      input = await f.input("standalone", "2.0.0"),
      b = { standalone: await s.stage(input), codexplugin: await s.stage(await f.input("codexplugin", "2.0.0")) };
    expect(await s.stage(input)).toEqual(b.standalone);
    await expect(s.install(input)).rejects.toMatchObject({ code: "idempotency" });
    expect(await s.read("standalone")).toEqual(a.standalone);
    const expected = Object.fromEntries(Object.entries(a).map(([k, v]) => [k, v.requestId])),
      receipts = Object.fromEntries(Object.entries(b).map(([k, v]) => [k, v.requestId]));
    await expect(s.select({ expected: { ...expected, codexplugin: null }, receipts })).rejects.toMatchObject({
      code: "conflict",
    });
    expect(await s.read("standalone")).toEqual(a.standalone);
    expect(await s.read("codexplugin")).toEqual(a.codexplugin);
    await expect(
      s.select({ expected, receipts: { ...receipts, codexplugin: a.codexplugin.requestId } }),
    ).rejects.toThrow("share version");
    expect(await s.select({ expected, receipts })).toHaveLength(2);
    expect(await s.read("standalone")).toEqual(b.standalone);
    expect(await s.read("codexplugin")).toEqual(b.codexplugin);
    await s.select({ expected, receipts });
  } finally {
    await s.close();
  }
  expect(await observeProcesses(join(f.options.home, "authority", f.options.product))).toEqual([]);
});
it("persists one transition, fences competing selections and replays completed intent without rewinding", async () => {
  const f = await fixture();
  let s: Session = await open(f.options);
  const requestId = randomUUID(),
    intent = { target: "2.0.0", data: join(f.root, "runtime") };
  try {
    const record = await s.transitions.begin({ requestId, intent, data: { phase: "staging" } });
    expect(await s.transitions.begin({ requestId, intent, data: { phase: "ignored" } })).toEqual(record);
    await expect(
      s.transitions.begin({ requestId, intent: { ...intent, target: "3.0.0" }, data: null }),
    ).rejects.toMatchObject({ code: "idempotency" });
    await expect(s.transitions.begin({ requestId: randomUUID(), intent, data: null })).rejects.toMatchObject({
      code: "conflict",
    });
    await expect(s.install(await f.input("standalone", "1.0.0"))).rejects.toThrow("resume first");
    await s.close();
    s = await open(f.options);
    expect(await s.transitions.read()).toEqual(record);
    const next = await s.transitions.advance({ requestId, expectedRevision: 0, data: { phase: "staged" } });
    await expect(
      s.transitions.advance({ requestId, expectedRevision: 0, data: { phase: "lost" } }),
    ).rejects.toMatchObject({ code: "conflict" });
    const done = await s.transitions.advance({
      requestId,
      expectedRevision: next.revision,
      data: { phase: "done" },
      complete: true,
    });
    expect(await s.transitions.read()).toBeUndefined();
    expect(await s.transitions.begin({ requestId, intent, data: null })).toEqual(done);
    await s.install(await f.input("standalone", "2.0.0"));
  } finally {
    await s.close();
  }
  expect((await readDirectory(join(f.options.home, "authority", f.options.product))).manager.phase).toBe("closed");
});
