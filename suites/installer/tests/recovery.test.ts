import { spawn } from "node:child_process";
import { randomUUID } from "node:crypto";
import { mkdir, mkdtemp, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { channel, namespace } from "@odsuite/protocol";
import { bundle } from "@odsuite/release";
import { inspectRecovery, observeProcesses, readDirectory, recover } from "@odsuite/sidecar";
import { expect, it } from "vitest";
import { type Options, open } from "@";
import { hash } from "../src/archive.js";

async function fixture() {
  const base = fileURLToPath(new URL("../../../.artifacts/installer/", import.meta.url));
  await mkdir(base, { recursive: true });
  const root = await mkdtemp(join(base, "recovery-")),
    home = join(root, "home"),
    data = join(root, "runtime"),
    source = join(root, "source");
  await mkdir(source);
  const options: Options = {
    home,
    product: "io.test.motion",
    scope: { channel: channel("stable"), namespace: namespace("primary") },
  };
  await writeFile(join(source, "main.mjs"), "export const recovered=true;");
  await writeFile(
    join(source, "runtime.json"),
    JSON.stringify({
      carrier: "codexplugin",
      version: "1.0.0",
      channel: "stable",
      files: ["main.mjs", "runtime.json"],
    }),
  );
  const bytes = await bundle(source),
    archive = join(root, "archive.bundle");
  await writeFile(archive, bytes);
  return { options, root, data, archive, bytes, sha256: hash(bytes), requestId: randomUUID() };
}
for (const phase of ["intent", "materialized", "installed", "selected"] as const)
  it(`recovers actual SIGKILL after ${phase} only after explicit sidecar recovery`, async () => {
    const f = await fixture(),
      entry = pathToFileURL(fileURLToPath(new URL("../dist/index.mjs", import.meta.url))).href;
    const script = `import {readFile} from 'node:fs/promises';import {open} from ${JSON.stringify(entry)};const f=JSON.parse(process.argv[1]);const session=await open({...f.options,onCheckpoint:async event=>{if(event.phase===f.phase){console.log('CHECKPOINT');await new Promise(()=>{});}}});await session.install({data:f.data,requestId:f.requestId,source:{bytes:await readFile(f.archive),sha256:f.sha256}});await session.close();`;
    const child = spawn(
      process.execPath,
      ["--input-type=module", "-e", script, JSON.stringify({ ...f, bytes: undefined, phase })],
      { stdio: ["ignore", "pipe", "pipe"] },
    );
    let stdout = "",
      stderr = "";
    child.stderr.on("data", (chunk) => {
      stderr += chunk.toString();
    });
    const exited = new Promise<void>((resolve, reject) => {
      child.once("error", reject);
      child.once("exit", () => resolve());
    });
    try {
      await new Promise<void>((resolve, reject) => {
        child.stdout.on("data", (chunk) => {
          stdout += chunk.toString();
          if (stdout.includes("CHECKPOINT")) resolve();
        });
        child.once("exit", () => reject(Error(`installer exited before checkpoint: ${stderr}`)));
      });
      child.kill("SIGKILL");
      await exited;
      await expect(open(f.options)).rejects.toThrow();
      const authority = join(f.options.home, "authority", f.options.product),
        plan = await inspectRecovery(authority);
      expect(plan.phase).toBe("ready");
      await recover(authority, { expected: plan.fingerprint });
      const session = await open(f.options);
      try {
        const value = await session.install({
          data: f.data,
          requestId: f.requestId,
          source: { sha256: f.sha256, bytes: phase === "selected" ? new Uint8Array() : f.bytes },
        });
        expect(value.version).toBe("1.0.0");
        expect(await session.read("codexplugin")).toEqual(value);
      } finally {
        await session.close();
      }
      expect((await readDirectory(authority)).manager.phase).toBe("closed");
      expect(await observeProcesses(authority)).toEqual([]);
    } finally {
      if (child.exitCode === null && child.signalCode === null) child.kill("SIGKILL");
      await exited;
    }
  }, 30000);
it("drains accepted installation work before closing its owner and rejects new calls", async () => {
  const f = await fixture();
  let release = () => {},
    entered = () => {};
  const gate = new Promise<void>((resolve) => {
      release = resolve;
    }),
    started = new Promise<void>((resolve) => {
      entered = resolve;
    });
  const session = await open({
    ...f.options,
    onCheckpoint: async (event) => {
      if (event.phase === "intent") {
        entered();
        await gate;
      }
    },
  });
  const task = session.install({ data: f.data, requestId: f.requestId, source: { bytes: f.bytes, sha256: f.sha256 } });
  try {
    await started;
    const closing = session.close();
    await expect(session.read("codexplugin")).rejects.toMatchObject({ code: "conflict" });
    release();
    const result = await task;
    await closing;
    const cold = await open(f.options);
    try {
      expect(await cold.read("codexplugin")).toEqual(result);
    } finally {
      await cold.close();
    }
  } finally {
    release();
    await task.catch(() => {});
    await session.close();
  }
}, 15000);

it("retains a committed transition after actual SIGKILL and explicit authority recovery", async () => {
  const f = await fixture(),
    entry = pathToFileURL(fileURLToPath(new URL("../dist/index.mjs", import.meta.url))).href;
  const intent = { target: "2.0.0", data: f.data },
    id = randomUUID();
  const script = `import {open}from ${JSON.stringify(entry)};const f=JSON.parse(process.argv[1]);const s=await open(f.options);await s.transitions.begin({requestId:f.id,intent:f.intent,data:{phase:'staging'}});console.log('TRANSITION-COMMITTED');await new Promise(()=>{});`;
  const child = spawn(
    process.execPath,
    ["--input-type=module", "-e", script, JSON.stringify({ options: f.options, id, intent })],
    { stdio: ["ignore", "pipe", "pipe"] },
  );
  let output = "",
    errors = "";
  child.stdout.on("data", (b) => {
    output += b;
  });
  child.stderr.on("data", (b) => {
    errors += b;
  });
  const exited = new Promise<void>((done, reject) => {
    child.once("exit", () => done());
    child.once("error", reject);
  });
  try {
    await expect
      .poll(
        () => {
          if (child.exitCode !== null) throw Error(errors);
          return output.includes("TRANSITION-COMMITTED");
        },
        { timeout: 10000 },
      )
      .toBe(true);
    expect(child.kill("SIGKILL")).toBe(true);
    await exited;
    await expect(open(f.options)).rejects.toThrow();
    const root = join(f.options.home, "authority", f.options.product),
      plan = await inspectRecovery(root);
    expect(plan.phase).toBe("ready");
    await recover(root, { expected: plan.fingerprint });
    const s = await open(f.options);
    try {
      const record = await s.transitions.read(id);
      expect(record).toMatchObject({ intent, data: { phase: "staging" }, complete: false });
      await expect(
        s.install({ data: f.data, requestId: f.requestId, source: { bytes: f.bytes, sha256: f.sha256 } }),
      ).rejects.toThrow("resume first");
      await s.transitions.advance({
        requestId: id,
        expectedRevision: record!.revision,
        data: { phase: "done" },
        complete: true,
      });
      expect(await s.transitions.read()).toBeUndefined();
    } finally {
      await s.close();
    }
    expect(await observeProcesses(root)).toEqual([]);
  } finally {
    if (child.exitCode === null && child.signalCode === null) child.kill("SIGKILL");
    await exited;
  }
}, 30000);
