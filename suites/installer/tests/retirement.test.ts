import { spawn } from "node:child_process";
import { randomUUID } from "node:crypto";
import { lstat, mkdir, mkdtemp, readFile, writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { channel, namespace } from "@odsuite/protocol";
import { bundle } from "@odsuite/release";
import { inspectRecovery, observeProcesses, readDirectory, recover } from "@odsuite/sidecar";
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

for (const phase of ["retiring", "file", "removed"] as const)
  it(`recovers actual SIGKILL at collection ${phase} without discarding authority or user history`, async () => {
    const f = await fixture(),
      parent = await open(f.options),
      plan = await parent.gc.plan([]),
      input = { requestId: randomUUID(), expected: plan.fingerprint, protectedReceipts: [] };
    await parent.close();
    const script = `import{open}from ${JSON.stringify(pathToFileURL(resolve("dist/index.mjs")).href)};const f=JSON.parse(process.argv[1]);const s=await open({...f.options,onCollectionCheckpoint:async e=>{if(e.phase===f.phase){console.log(JSON.stringify(e));await new Promise(()=>{});}}});await s.gc.apply(f.input);throw Error("checkpoint missed");`;
    const child = spawn(
      process.execPath,
      ["--input-type=module", "-e", script, JSON.stringify({ ...f, input, phase })],
      { stdio: ["ignore", "pipe", "pipe"] },
    );
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
            return output.includes("\n");
          },
          { timeout: 15000 },
        )
        .toBe(true);
      const event = JSON.parse(output.trim());
      expect(event.phase).toBe(phase);
      if (phase !== "retiring") await expect(lstat(event.path)).rejects.toMatchObject({ code: "ENOENT" });
      expect(child.kill("SIGKILL")).toBe(true);
      await exited;
      await expect(open(f.options)).rejects.toThrow();
      const authority = join(f.options.home, "authority", f.options.product),
        recovery = await inspectRecovery(authority);
      expect(recovery.phase).toBe("ready");
      await recover(authority, { expected: recovery.fingerprint });
      const resumed = await open(f.options);
      try {
        expect((await resumed.gc.read())?.requestId).toBe(input.requestId);
        const result = await resumed.gc.apply(input);
        expect(result.complete).toBe(true);
        expect(result.retired).toEqual([f.old.path]);
        expect(await resumed.gc.apply(input)).toEqual(result);
        expect(await resumed.read("standalone")).toEqual(f.current);
        await expect(resumed.install(f.a)).rejects.toMatchObject({ code: "retired" });
        expect(await readFile(join(f.data, "user-project.txt"), "utf8")).toBe("persistent project and history");
      } finally {
        await resumed.close();
      }
      expect((await readDirectory(authority)).manager.phase).toBe("closed");
      expect(await observeProcesses(authority)).toEqual([]);
    } finally {
      if (child.exitCode === null && child.signalCode === null) child.kill("SIGKILL");
      await exited;
    }
  }, 30000);
