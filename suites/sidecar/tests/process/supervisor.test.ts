import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { mkdir, mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createInterface } from "node:readline";
import { channel, digest, namespace } from "@odsuite/protocol";
import { it } from "vitest";
import { observeProcesses, readDirectory, serve } from "@";
import { argument, rootKey } from "../../src/process/identity.js";
import { capture, exact, owned } from "../../src/process/observe.js";

const scope = { channel: channel("stable"), namespace: namespace("probe") };
const entry = new URL("../../dist/index.mjs", import.meta.url).href;
const pause = () => new Promise((done) => setTimeout(done, 25));

it("recognizes an independently managed supervisor beneath a foreign stamped ancestor", async () => {
  const root = await mkdtemp(join(tmpdir(), "stamped-composition-"));
  const nestedRoot = join(root, "nested");
  const host = await serve(join(root, "manager.sock"));
  const factory = host.factory(scope);
  try {
    const body = `import{serve}from ${JSON.stringify(entry)};
      const host=await serve(${JSON.stringify(join(nestedRoot, "manager.sock"))});
      await host.factory(${JSON.stringify(scope)}).start({service:'inner',generation:${JSON.stringify(digest("inner"))},command:process.execPath,args:['-e',"console.log('inner-ready');setInterval(()=>{},1000)"],ready:'inner-ready'});
      console.log('outer-ready');`;
    const lease = await factory.start({
      service: "outer",
      generation: digest("outer"),
      command: process.execPath,
      args: ["--input-type=module", "-e", body],
      ready: "outer-ready",
    });
    const outer = await observeProcesses(root, scope);
    const inner = await observeProcesses(nestedRoot, scope);
    assert.equal(outer.length, 1);
    assert.equal(inner.length, 1);
    assert.ok((inner[0]?.processes.length ?? 0) >= 2);
    assert.ok(!outer[0]?.processes.some((p) => p.pid === inner[0]?.supervisor.pid));
    assert.equal((await factory.release(lease)).status, "stopped");
    for (const item of [...outer, ...inner]) for (const p of item.processes) await gone(p.pid);
    assert.deepEqual(await observeProcesses(nestedRoot, scope), []);
    assert.equal((await readDirectory(nestedRoot)).manager.phase, "interrupted");
  } finally {
    await host.close();
    await rm(root, { recursive: true, force: true });
  }
});
async function gone(pid: number) {
  const deadline = Date.now() + 5000;
  while (Date.now() < deadline) {
    if (!(await capture()).some((p) => p.pid === pid)) return;
    await pause();
  }
  throw new Error(`process survives: ${pid}`);
}

it("keeps stable stamped ownership when the target rewrites argv and launches a detached helper", async () => {
  const root = await mkdtemp(join(tmpdir(), "stamped-tree-"));
  const host = await serve(join(root, "manager.sock"));
  const factory = host.factory(scope);
  try {
    const helperReceipt = join(root, "helper.pid");
    const lease = await factory.start({
      service: "worker",
      generation: digest("one"),
      command: process.execPath,
      args: [
        "-e",
        `
      const {spawn}=require('node:child_process');
      process.title='rewritten-workload';
      const helper=spawn(process.execPath,['-e','setInterval(()=>{},1000)'],{detached:true,stdio:'ignore'});
      helper.once('spawn',()=>{require('node:fs').writeFileSync(${JSON.stringify(helperReceipt)},String(helper.pid));console.log('ready')});setInterval(()=>{},1000);
    `,
      ],
      ready: "ready",
    });
    const facts = await observeProcesses(root, scope);
    assert.equal(facts.length, 1);
    assert.equal(facts[0]?.incarnation, lease.incarnation);
    const helperPid = Number(await readFile(helperReceipt, "utf8"));
    assert.ok(facts[0]?.processes.some((p) => p.pid === helperPid));
    assert.ok(facts[0]?.processes.some((p) => p.pid === lease.pid));
    const directory = host.directory(scope);
    assert.equal(directory.schema, 4);
    assert.notEqual(directory.instances[0]?.process?.root.pid, lease.pid);
    const tracked = facts[0]!.processes.map((p) => p.pid);
    assert.equal((await factory.release(lease)).status, "stopped");
    for (const pid of tracked) await gone(pid);
    assert.deepEqual(await observeProcesses(root, scope), []);
  } finally {
    await host.close();
    await rm(root, { recursive: true, force: true });
  }
});

it("converges the workload and helper after the real controller is SIGKILLed", async () => {
  const root = await mkdtemp(join(tmpdir(), "stamped-orphan-"));
  const body = `import{serve}from ${JSON.stringify(entry)};
    const root=process.argv[1];const host=await serve(root+'/manager.sock');
    const lease=await host.factory(${JSON.stringify(scope)}).start({service:'worker',generation:${JSON.stringify(digest("one"))},command:process.execPath,args:['-e',"const{spawn}=require('node:child_process');const helper=spawn(process.execPath,['-e','setInterval(()=>{},1000)'],{stdio:'ignore'});require('node:fs').writeFileSync(process.env.PROBE_HELPER,String(helper.pid));console.log('ready');setInterval(()=>{},1000)"],ready:'ready',env:{PROBE_HELPER:root+'/helper.pid'}});
    console.log(JSON.stringify({lease}));process.stdin.resume();`;
  const child = spawn(process.execPath, ["--input-type=module", "-e", body, root], { stdio: ["pipe", "pipe", "pipe"] });
  let errors = "";
  child.stderr.on("data", (chunk) => {
    errors += chunk;
  });
  try {
    const lines = createInterface({ input: child.stdout });
    await new Promise<void>((done, reject) => {
      const timer = setTimeout(() => reject(new Error(`controller timeout: ${errors}`)), 10000);
      lines.once("line", () => {
        clearTimeout(timer);
        lines.close();
        done();
      });
      child.once("exit", () => {
        clearTimeout(timer);
        reject(new Error(errors));
      });
    });
    const before = await observeProcesses(root, scope);
    const helperPid = Number(await readFile(join(root, "helper.pid"), "utf8"));
    assert.ok(before[0]?.processes.some((p) => p.pid === helperPid));
    const exit = new Promise<void>((done) => child.once("exit", () => done()));
    child.kill("SIGKILL");
    await exit;
    for (const p of before[0]!.processes) await gone(p.pid);
    assert.deepEqual(await observeProcesses(root, scope), []);
    assert.equal((await readDirectory(root)).manager.phase, "interrupted");
  } finally {
    child.kill("SIGKILL");
    await rm(root, { recursive: true, force: true });
  }
});

it("excludes a differently stamped resource subtree from terminal signalling", async () => {
  const root = await mkdtemp(join(tmpdir(), "stamped-nested-"));
  const foreign = {
    ...scope,
    service: "nested",
    generation: digest("nested"),
    root: rootKey(root),
    incarnation: "11111111-1111-4111-8111-111111111111",
  };
  const host = await serve(join(root, "manager.sock"));
  const factory = host.factory(scope);
  let nestedPid: number | undefined;
  try {
    const record = join(root, "nested.json");
    const lease = await factory.start({
      service: "worker",
      generation: digest("outer"),
      command: process.execPath,
      args: [
        "-e",
        `
      const {spawn}=require('node:child_process');const fs=require('node:fs');
      const c=spawn(process.execPath,['-e','setInterval(()=>{},1000)','--',${JSON.stringify(argument(foreign))}],{stdio:'ignore'});
      c.once('spawn',()=>{fs.writeFileSync(${JSON.stringify(record)},JSON.stringify({pid:c.pid}));console.log('ready')});setInterval(()=>{},1000);
    `,
      ],
      ready: "ready",
    });
    nestedPid = JSON.parse(await readFile(record, "utf8")).pid;
    const all = await capture();
    const observation = host.directory(scope).instances.find((x) => x.service === "worker")?.process;
    assert.ok(observation);
    assert.ok(!owned(all, observation.root, observation.stamp).some((p) => p.pid === nestedPid));
    const nested = all.find((p) => p.pid === nestedPid);
    assert.ok(nested);
    await factory.release(lease);
    assert.ok((await capture()).some((p) => exact(p, nested)));
  } finally {
    if (nestedPid) {
      process.kill(nestedPid, "SIGKILL");
      await gone(nestedPid);
    }
    await host.close();
    await rm(root, { recursive: true, force: true });
  }
});
