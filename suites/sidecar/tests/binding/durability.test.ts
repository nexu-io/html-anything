import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { channel, digest, gates, namespace } from "@odsuite/protocol";
import { expect, it, vi } from "vitest";
import { Bindings } from "../../src/state/binding.js";

const fault = vi.hoisted(() => ({ point: "" }));
vi.mock("node:fs/promises", async (original) => {
  const fs = await original<typeof import("node:fs/promises")>();
  return {
    ...fs,
    rename: async (...args: Parameters<typeof fs.rename>) => {
      if (fault.point === "rename") throw new Error("injected rename failure");
      return fs.rename(...args);
    },
    open: async (...args: Parameters<typeof fs.open>) => {
      const file = await fs.open(...args);
      const sync = file.sync.bind(file);
      file.sync = async () => {
        const point = args[1] === "r" ? "directory-sync" : "file-sync";
        if (fault.point === point) throw new Error(`injected ${point} failure`);
        return sync();
      };
      return file;
    },
  };
});

it.each(["file-sync", "rename", "directory-sync"])("does not acknowledge a failed %s", async (point) => {
  if (point === "directory-sync" && process.platform === "win32") return;
  const root = await mkdtemp(join(tmpdir(), "durable-binding-"));
  const lane = channel("stable"),
    scope = namespace("probe"),
    target = digest("candidate");
  const binding = new Bindings(root);
  try {
    await binding.read(scope, lane);
    const armed = await binding.transit(scope, lane, 0, { type: "arm", mode: "update", target });
    expect(armed.ok).toBe(true);
    let journal = await binding.read(scope, lane);
    const begin = await binding.transit(scope, lane, journal.revision, { type: "begin", target, nonce: "new" });
    if (!begin.ok) throw new Error(begin.fault);
    journal = begin.journal;
    for (const gate of gates) {
      const ready = await binding.transit(scope, lane, journal.revision, { type: "ready", target, nonce: "new", gate });
      if (!ready.ok) throw new Error(ready.fault);
      journal = ready.journal;
    }
    const commit = { type: "commit" as const, target, nonce: "new" };
    const path = join(root, "factories", lane, scope, "binding.json");
    const before = await readFile(path, "utf8");
    fault.point = point;
    await expect(binding.transit(scope, lane, journal.revision, commit)).rejects.toThrow("injected");
    fault.point = "";
    if (point === "directory-sync") {
      // Rename was visible, but its durability could not be confirmed. The live owner
      // refuses further interpretation/writes rather than claiming rollback or success.
      expect((await Bindings.inspect(root, scope, lane)).state.current).toBe(target);
      await expect(binding.read(scope, lane)).rejects.toThrow("uncertain");
      await expect(
        binding.transit(scope, lane, journal.revision + 1, { type: "fail", target, nonce: "new", error: "late" }),
      ).rejects.toThrow("uncertain");
    } else {
      expect(await readFile(path, "utf8")).toBe(before);
      expect(await binding.transit(scope, lane, journal.revision, commit)).toMatchObject({
        ok: true,
        journal: { revision: journal.revision + 1, state: { current: target } },
      });
    }
  } finally {
    fault.point = "";
    await rm(root, { recursive: true, force: true });
  }
});

it("does not recreate a binding that disappears from a live owner's known state", async () => {
  const root = await mkdtemp(join(tmpdir(), "missing-binding-"));
  const scope = namespace("probe"),
    lane = channel("stable");
  try {
    const bindings = new Bindings(root);
    await bindings.transit(scope, lane, 0, { type: "arm", mode: "update", target: digest("first") });
    await rm(join(root, "factories", lane, scope, "binding.json"));
    await expect(bindings.read(scope, lane)).rejects.toThrow("binding missing");
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
