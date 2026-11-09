import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { run } from "@";

describe("unified CLI", () => {
  it("rejects old standalone/staged surfaces and unknown options", async () => {
    for (const args of [[], ["unknown"], ["guard", "--staged"], ["guard", "--root"], ["guard", "--unknown"]]) {
      const messages: string[] = [];
      expect(
        await run(args, process.cwd(), {
          stdout: (value) => messages.push(value),
          stderr: (value) => messages.push(value),
        }),
      ).toBe(2);
      expect(messages.join("")).toContain("odsuite");
    }
  });

  it("runs from a non-Git directory, reports findings and configuration errors", async () => {
    const root = await mkdtemp(join(tmpdir(), "odsuite-cli-"));
    let text = "";
    const output = {
      stdout: (value: string) => {
        text = value;
      },
      stderr: (value: string) => {
        text = value;
      },
    };
    try {
      await mkdir(join(root, "src"));
      await writeFile(join(root, "src", "view.css"), "body {}");
      expect(await run(["guard", "--root", root, "--json"], root, output)).toBe(1);
      expect(JSON.parse(text).findings).toContainEqual(expect.objectContaining({ rule: "file.style" }));
      await writeFile(join(root, "odsuite.yaml"), "schemaVersion: 2\n");
      expect(await run(["guard", "--root", root, "--json"], root, output)).toBe(2);
      expect(JSON.parse(text).error.kind).toBe("operational");
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  });
});
