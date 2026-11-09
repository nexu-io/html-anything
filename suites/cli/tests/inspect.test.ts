import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { createHash } from "node:crypto";
import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { readDirectory } from "@odsuite/sidecar";
import { it } from "vitest";
import { run } from "@/index.js";

it("uses real CLI static sources, exact inspect targets and preserves interrupted truth after SIGKILL", async () => {
  const root = await mkdtemp(join(tmpdir(), "inspect-cli-")),
    data = join(root, "state");
  await mkdir(join(root, "content"));
  await writeFile(join(root, "content", "value.txt"), "real-data");
  await writeFile(
    join(root, "odsuite.yaml"),
    "schemaVersion: 1\nserve:\n  data: state\n  sources:\n    source:\n      directory: content\n",
  );
  const executable = resolve("dist/index.mjs");
  // Invoke the package's real public entry in another process, retaining the owner.
  const child = spawn(
    process.execPath,
    [
      "--input-type=module",
      "-e",
      `import {run} from ${JSON.stringify(`file://${executable}`)}; process.exitCode=await run(process.argv.slice(1),process.cwd(),{stdout:v=>process.stdout.write(v),stderr:v=>process.stderr.write(v)});`,
      "serve",
      "--root",
      root,
      "--channel",
      "beta",
      "--namespace",
      "probe",
    ],
    { stdio: ["ignore", "pipe", "pipe"] },
  );
  let errors = "";
  child.stderr.on("data", (v) => {
    errors += v;
  });
  const exited = new Promise<void>((done) => child.once("exit", () => done()));
  try {
    const ready = await new Promise<{
      sources: { service: string; generation: string; incarnation: string; url: string }[];
    }>((done, reject) => {
      let text = "";
      const timer = setTimeout(() => reject(new Error(`serve timeout ${errors}`)), 10000);
      child.once("exit", () => {
        clearTimeout(timer);
        reject(new Error(`serve exited ${errors}`));
      });
      child.stdout.on("data", (value) => {
        text += value;
        if (text.includes("\n")) {
          clearTimeout(timer);
          done(JSON.parse(text.slice(0, text.indexOf("\n"))));
        }
      });
    });
    const source = ready.sources[0];
    assert.ok(source);
    assert.equal(await (await fetch(`${source.url}/value.txt`)).text(), "real-data");
    const base = ["--data", data, "--channel", "beta", "--namespace", "probe"];
    const target = [
      "--service",
      source.service,
      "--generation",
      source.generation,
      "--incarnation",
      source.incarnation,
    ];
    const invoke = async (args: string[]) => {
      let text = "";
      const code = await run(args, root, {
        stdout: (v) => {
          text += v;
        },
        stderr: (v) => {
          text += v;
        },
      });
      assert.ok(!text.includes('"authority"'));
      assert.ok(!text.includes('"token"'));
      return { code, value: JSON.parse(text) };
    };
    assert.equal((await invoke(["inspect", "list", ...base])).code, 0);
    const status = await invoke(["inspect", "call", ...base, ...target, "--method", "status"]);
    assert.equal(status.code, 0);
    assert.equal(status.value.result.value.url, source.url);
    assert.equal((await invoke(["inspect", "call", ...base, ...target, "--method", "missing"])).code, 2);
    assert.equal((await invoke(["inspect", "stop", ...base, ...target.slice(0, -2)])).code, 2);
    child.kill("SIGKILL");
    await exited;
    const interrupted = await readDirectory(data);
    assert.equal(interrupted.manager.phase, "interrupted");
    const fingerprint = async () =>
      createHash("sha256")
        .update(await readFile(join(data, "manager.sqlite")))
        .digest("hex");
    const before = await fingerprint();
    assert.equal((await invoke(["serve", "--root", root, "--channel", "beta", "--namespace", "probe"])).code, 2);
    assert.equal(await fingerprint(), before);
    assert.deepEqual(await readDirectory(data), interrupted);
    await assert.rejects(fetch(`${source.url}/value.txt`, { signal: AbortSignal.timeout(1000) }));
  } finally {
    if (child.exitCode === null && child.signalCode === null) child.kill("SIGKILL");
    await exited;
    await rm(root, { recursive: true, force: true });
  }
}, 20000);
