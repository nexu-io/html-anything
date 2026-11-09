import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { configuration, load } from "@";

describe("configuration", () => {
  it("leaves the runtime namespace to its own authority", () => {
    expect(configuration({ schemaVersion: 1, guard: {}, runtime: { carrier: 1 } }).rules["file.lines"]?.max).toBe(500);
  });
  it("merges fields and replaces arrays without changing defaults", () => {
    const value = configuration({ schemaVersion: 1, guard: { exclude: [], rules: { "file.lines": { max: 12 } } } });
    expect(value.exclude).toEqual([]);
    expect(value.rules["file.lines"]).toEqual({ enabled: true, max: 12 });
    expect(configuration(undefined).rules["file.lines"]?.max).toBe(500);
  });

  it.each([
    { schemaVersion: 2 },
    { schemaVersion: 1, guard: { unknown: true } },
    { schemaVersion: 1, guard: { rules: { missing: {} } } },
    { schemaVersion: 1, guard: { rules: { "file.lines": { max: -1 } } } },
    { schemaVersion: 1, guard: { rules: { "file.lines": { enabled: "false" } } } },
    { schemaVersion: 1, guard: { exclude: ["../outside/**"] } },
    { schemaVersion: 1, guard: { components: ["**/components"] } },
    {
      schemaVersion: 1,
      guard: { exceptions: [{ paths: ["src/**"], rules: ["toString"], reason: "unknown inherited key" }] },
    },
    { schemaVersion: 1, guard: { exceptions: [{ paths: ["src/**"], rules: ["file.lines"], reason: "" }] } },
  ])("rejects invalid policy %j", (input) => expect(() => configuration(input)).toThrow());

  it("rejects duplicate YAML keys and does not read guard.yaml", async () => {
    const root = await mkdtemp(join(tmpdir(), "odsuite-config-"));
    try {
      await writeFile(join(root, "guard.yaml"), "not: [yaml");
      expect((await load(root)).rules["file.lines"]?.max).toBe(500);
      await writeFile(join(root, "odsuite.yaml"), "schemaVersion: 1\nschemaVersion: 1\n");
      await expect(load(root)).rejects.toThrow("odsuite.yaml");
      await writeFile(join(root, "odsuite.yaml"), "");
      expect((await load(root)).rules["file.lines"]?.max).toBe(500);
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  });
});
