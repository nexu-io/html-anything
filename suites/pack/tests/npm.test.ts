import { execFile } from "node:child_process";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { promisify } from "node:util";
import { afterEach, expect, it } from "vitest";
import { npm } from "@";
import { inspectNpm } from "../src/tar.js";

const roots: string[] = [],
  execute = promisify(execFile);
afterEach(async () => {
  await Promise.all(roots.splice(0).map((p) => rm(p, { recursive: true, force: true })));
});
it("packs only explicit files and executes the actual local tgz without dependencies or install hooks", async () => {
  const root = await mkdtemp(join(tmpdir(), "npm-payload-"));
  roots.push(root);
  const output = join(root, "candidate.tgz"),
    bin = '#!/usr/bin/env node\nconsole.log(JSON.stringify({args:process.argv.slice(2),value:"closed payload"}));';
  const result = await npm({
    name: "@fixture/closed-app",
    version: "1.2.3-beta.4",
    bin: { fixture: "dist/main.mjs" },
    files: { "dist/main.mjs": Buffer.from(bin), "payload/manifest.json": Buffer.from('{"version":"1.2.3-beta.4"}') },
    output,
  });
  const inspected = inspectNpm(await readFile(output));
  expect(inspected.metadata).toMatchObject({ name: "@fixture/closed-app", version: "1.2.3-beta.4" });
  expect([...inspected.files.keys()].sort()).toEqual(["dist/main.mjs", "package.json", "payload/manifest.json"]);
  expect(result.bytes).toBeGreaterThan(100);
  expect(result.integrity).toMatch(/^sha512-/);
  const cli = join(
    dirname(process.execPath),
    process.platform === "win32" ? "node_modules/npm/bin/npm-cli.js" : "../lib/node_modules/npm/bin/npm-cli.js",
  );
  const run = await execute(
    process.execPath,
    [
      cli,
      "exec",
      "--offline",
      "--yes",
      "--ignore-scripts",
      "--package",
      output,
      "--",
      "fixture",
      "literal value",
      "a&b",
    ],
    {
      cwd: root,
      env: { ...process.env, npm_config_cache: join(root, "cache"), npm_config_update_notifier: "false" },
      timeout: 30000,
    },
  );
  expect(JSON.parse(run.stdout)).toEqual({ args: ["literal value", "a&b"], value: "closed payload" });
  await expect(
    npm({
      name: "fixture",
      version: "1.2.3",
      bin: { fixture: "main.mjs" },
      files: { "main.mjs": Buffer.from(bin) },
      output,
    }),
  ).rejects.toThrow();
  // Own the bounded npm pack (120s) and execution (30s) until actual exit before afterEach removes their roots.
}, 180000);
it("rejects undeclared bins, unsafe/reserved paths and special filesystem inputs", async () => {
  const root = await mkdtemp(join(tmpdir(), "npm-invalid-"));
  roots.push(root);
  const base = { name: "fixture", version: "1.2.3", bin: { fixture: "main.mjs" }, output: join(root, "candidate.tgz") };
  const invalid: Record<string, string | Uint8Array>[] = [
    { "../main.mjs": Buffer.from("") },
    { ".npmrc": Buffer.from("secret") },
    { "main.mjs": root },
  ];
  for (const files of invalid) await expect(npm({ ...base, files })).rejects.toThrow();
  await expect(npm({ ...base, files: { "other.mjs": Buffer.from("") } })).rejects.toThrow("declared");
});
