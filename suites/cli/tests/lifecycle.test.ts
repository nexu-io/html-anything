import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { expect, it } from "vitest";
import { run } from "@";

it("prepares actual content through the formal release entry and rejects invalid options", async () => {
  const root = await mkdtemp(join(tmpdir(), "release cli "));
  const messages: string[] = [];
  const output = { stdout: (s: string) => messages.push(s), stderr: (s: string) => messages.push(s) };
  try {
    await writeFile(
      join(root, "odsuite.yaml"),
      "schemaVersion: 1\nruntime:\n  appid: io.openmotion.fixture\n  carrier: 1\n  channel: stable\n  name: fixture\n  namespace: fixture\n  scheme: fixture\n  version: 1.0.0\n",
    );
    for (const name of ["capsule", "daemon", "web"]) {
      await mkdir(join(root, name));
      await writeFile(join(root, name, "index.mjs"), "export const probe=1;");
    }
    await writeFile(join(root, "probe.bin"), "blob probe");
    const args = [
      "release",
      "--capsule",
      "capsule",
      "--daemon",
      "daemon",
      "--web",
      "web",
      "--blob",
      "probe=probe.bin",
      "--output",
      "seed",
    ];
    expect(await run(args, root, output)).toBe(0);
    const envelope = JSON.parse(await readFile(join(root, "seed/generation.json"), "utf8"));
    expect(envelope.generation.blobs).toHaveLength(1);
    expect(await run([...args, "--output", "other"], root, output)).toBe(2);
    expect(await run(["release", "--unexpected", "x"], root, output)).toBe(2);
    expect(await run(["pack", "--carrier", "capsule", "--seed", "seed", "--output", "."], root, output)).toBe(2);
    expect(await readFile(join(root, "capsule/index.mjs"), "utf8")).toContain("probe");
    expect(await run(["pack", "--carrier", "capsule", "--seed", "missing", "--output", "package"], root, output)).toBe(
      2,
    );
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

it("routes short version and quality entries without injecting stable quality policy", async () => {
  const messages: string[] = [];
  const output = { stdout: (s: string) => messages.push(s), stderr: (s: string) => messages.push(s) };
  expect(await run(["version", "--channel", "qa2", "--base", "1.2.3", "--number", "4"], "/missing", output)).toBe(0);
  expect(JSON.parse(messages.at(-1) ?? "")).toEqual({ channel: "qa2", version: "1.2.3-qa2.4" });
  expect(await run(["version", "--channel", "stable", "--version", "1.2.3"], "/missing", output)).toBe(0);
  expect(await run(["version", "--channel", "stable", "--number", "4", "--base", "1.2.3"], "/missing", output)).toBe(2);
  expect(await run(["version", "--channel", "qa2", "--number", "0", "--base", "1.2.3"], "/missing", output)).toBe(2);
  expect(await run(["check", "--channel", "stable", "--gate", "unknown"], "/missing", output)).toBe(2);
  expect(await run(["build", "--help"], "/missing", output)).toBe(0);
});
