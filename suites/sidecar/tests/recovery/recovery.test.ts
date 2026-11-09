import assert from "node:assert/strict";
import { type ChildProcess, spawn } from "node:child_process";
import { mkdir, readFile, rename, rm, symlink, writeFile } from "node:fs/promises";
import { createServer } from "node:net";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { createInterface } from "node:readline";
import { channel, digest, namespace } from "@odsuite/protocol";
import { it, vi } from "vitest";
import { inspectRecovery, observeProcesses, readBinding, readDirectory, recover, serve } from "@";

const fault = vi.hoisted(() => ({ point: "", file: "" }));
vi.mock("node:fs/promises", async (original) => {
  const fs = await original<typeof import("node:fs/promises")>();
  return {
    ...fs,
    rename: async (...args: Parameters<typeof fs.rename>) => {
      if (fault.point === "rename" && String(args[1]) === fault.file)
        throw new Error("injected registry rename failure");
      return fs.rename(...args);
    },
    open: async (...args: Parameters<typeof fs.open>) => {
      const file = await fs.open(...args),
        sync = file.sync.bind(file),
        write = file.writeFile.bind(file);
      file.writeFile = async (...input: Parameters<typeof file.writeFile>) => {
        if (fault.point === "write" && String(args[0]).startsWith(fault.file + ".recovery-")) {
          await write(String(input[0]).slice(0, 17));
          throw new Error("injected partial write failure");
        }
        return write(...input);
      };
      file.sync = async () => {
        if (fault.point === "sync" && args[1] === "r" && String(args[0]) === fault.file)
          throw new Error("injected directory sync failure");
        return sync();
      };
      return file;
    },
  };
});
const entry = new URL("../../dist/index.mjs", import.meta.url).href;
const scope = { channel: channel("stable"), namespace: namespace("probe") };
const sleep = () => new Promise((done) => setTimeout(done, 25));
async function line(child: ChildProcess): Promise<string> {
  return new Promise((done, reject) => {
    const reader = createInterface({ input: child.stdout! });
    let errors = "";
    child.stderr?.on("data", (chunk) => {
      errors += chunk;
    });
    const timer = setTimeout(() => {
      child.kill("SIGKILL");
      reject(new Error(`fixture timeout: ${errors}`));
    }, 10000);
    reader.once("line", (value) => {
      clearTimeout(timer);
      reader.close();
      done(value);
    });
    child.once("exit", () => {
      clearTimeout(timer);
      reject(new Error(`fixture exited: ${errors}`));
    });
  });
}
async function kill(child: ChildProcess) {
  if (child.exitCode !== null || child.signalCode !== null) return;
  const ended = new Promise((done) => child.once("exit", done));
  child.kill("SIGKILL");
  await ended;
}
async function fixture(name: string) {
  const root = resolve("../../.artifacts/recovery", `${Date.now()}-${name}`);
  await mkdir(root, { recursive: true });
  const endpoint = join(tmpdir(), `recover-${digest(root).slice(7, 23)}.sock`);
  const current = digest("current"),
    candidate = digest("candidate");
  const body = `import{serve}from ${JSON.stringify(entry)};import{writeFile}from'node:fs/promises';import{join}from'node:path';
    const root=process.argv[1],host=await serve(process.argv[2],{root});const results=[];
    for(const channel of ['stable','preview']){
      const f=host.factory({channel,namespace:'probe'});
      const cas=await f.grant({kind:'cas',name:'artifact',scope:'factory'});await writeFile(join(cas.value,'blob.bin'),'verified-cas-bytes');
      const data=await f.grant({kind:'data',name:'probe',scope:'factory'});await writeFile(join(data.value,'state.json'),JSON.stringify({retained:channel}));
      const stage=await f.grant({kind:'staging',name:'probe',scope:'attempt',owner:'attempt'});await writeFile(join(stage.value,'partial.bin'),'retained until authorized cleanup');
      const port=await f.grant({kind:'port',name:'probe',scope:'attempt',owner:'attempt',scheme:'tcp'});
      await f.grant({kind:'socket',name:'probe',scope:'attempt',owner:'attempt'});await f.grant({kind:'lock',name:'probe',scope:'attempt',owner:'attempt'});
      let j=await f.binding();const transit=async event=>{const r=await f.transit(j.revision,event);if(!r.ok)throw new Error(r.fault);j=r.journal;};
      await transit({type:'arm',mode:'update',target:${JSON.stringify(current)}});await transit({type:'begin',target:${JSON.stringify(current)},nonce:'initial'});
      for(const gate of ['capsule','renderer','daemon','web','product'])await transit({type:'ready',target:${JSON.stringify(current)},nonce:'initial',gate});
      await transit({type:'commit',target:${JSON.stringify(current)},nonce:'initial'});
      await transit({type:'arm',mode:'update',target:${JSON.stringify(candidate)}});await transit({type:'begin',target:${JSON.stringify(candidate)},nonce:'interrupted'});
      await f.start({command:process.execPath,args:['-e',"console.log('ready');setInterval(()=>{},1000)"],service:'worker',generation:${JSON.stringify(current)},ready:'ready'});
      results.push({channel,data:data.value,cas:cas.value,stage:stage.value,port:port.value});
    }
    console.log(JSON.stringify(results));process.stdin.resume();`;
  const child = spawn(process.execPath, ["--input-type=module", "-e", body, root, endpoint], {
    stdio: ["pipe", "pipe", "pipe"],
  });
  const resources = JSON.parse(await line(child)) as Array<{
    channel: string;
    data: string;
    cas: string;
    stage: string;
    port: string;
  }>;
  const crash = async () => {
    await kill(child);
    const end = Date.now() + 5000;
    while ((await observeProcesses(root)).length && Date.now() < end) await sleep();
    assert.deepEqual(await observeProcesses(root), []);
  };
  return { root, endpoint, child, resources, current, candidate, crash };
}
async function authority(root: string) {
  return Promise.all(
    [
      "manager.sqlite",
      "factories/stable/probe/ownership.sqlite",
      "factories/preview/probe/ownership.sqlite",
      "factories/stable/probe/registry.json",
      "factories/preview/probe/registry.json",
      "factories/stable/probe/binding.json",
      "factories/preview/probe/binding.json",
    ].map((file) => readFile(join(root, file))),
  );
}

it("refuses a live manager without changing authority", async () => {
  const f = await fixture("live");
  try {
    const before = await authority(f.root);
    await assert.rejects(inspectRecovery(f.root), /authority/);
    assert.deepEqual(await authority(f.root), before);
  } finally {
    await f.crash();
  }
}, 15000);

it("recovers all factories, preserves committed data, fences old plans and permits a fresh owner", async () => {
  const f = await fixture("complete");
  await f.crash();
  const before = await authority(f.root),
    plan = await inspectRecovery(f.root);
  assert.equal(plan.factories.length, 2);
  assert.equal(plan.phase, "ready");
  assert.deepEqual(await authority(f.root), before);
  await assert.rejects(recover(f.root, { expected: digest("stale") }), /fingerprint/);
  assert.deepEqual(await authority(f.root), before);
  const result = await recover(f.root, { expected: plan.fingerprint });
  assert.equal(result.phase, "complete");
  const completed = await authority(f.root);
  assert.equal((await recover(f.root, { expected: plan.fingerprint })).phase, "complete");
  assert.deepEqual(await authority(f.root), completed);
  for (const r of f.resources) {
    await assert.rejects(readFile(join(r.stage, "partial.bin")), /ENOENT/);
    assert.equal(JSON.parse(await readFile(join(r.data, "state.json"), "utf8")).retained, r.channel);
    assert.equal(await readFile(join(r.cas, "blob.bin"), "utf8"), "verified-cas-bytes");
  }
  assert.equal((await readDirectory(f.root)).manager.phase, "closed");
  const retained = await readBinding(f.root, scope);
  assert.equal(retained.journal.state.current, f.current);
  assert.equal(retained.journal.state.attempt?.status, "failed");
  const host = await serve(f.endpoint, { root: f.root });
  const factory = host.factory(scope);
  assert.notEqual(host.directory().manager.incarnation, plan.manager);
  assert.equal((await factory.binding()).state.current, f.current);
  await host.close();
  await assert.rejects(recover(f.root, { expected: plan.fingerprint }), /interrupted owner/);
  await writeFile(
    join(f.root, "receipt.json"),
    JSON.stringify({ result, retained, dataPreserved: true, scope: "dead owner recovery; no live adoption" }, null, 2),
  );
}, 15000);

it.each(["prepared", "resources", "files"] as const)(
  "resumes after recovery SIGKILL at %s and excludes competing controllers",
  async (stage) => {
    const f = await fixture(stage);
    await f.crash();
    const plan = await inspectRecovery(f.root);
    const body = `import{recover}from ${JSON.stringify(entry)};await recover(process.argv[1],{expected:process.argv[2],onCheckpoint:async c=>{if(c.stage===process.argv[3]){console.log(JSON.stringify(c));await new Promise(()=>{});}}});`;
    const actor = spawn(process.execPath, ["--input-type=module", "-e", body, f.root, plan.fingerprint, stage], {
      stdio: ["ignore", "pipe", "pipe"],
    });
    try {
      await line(actor);
      await assert.rejects(inspectRecovery(f.root), /authority/);
      await assert.rejects(recover(f.root, { expected: plan.fingerprint }), /authority/);
      await kill(actor);
      await assert.rejects(serve(join(f.root, "blocked.sock")), /recovery/);
      const resumed = await inspectRecovery(f.root);
      assert.equal(resumed.phase, "recovering");
      assert.equal(resumed.fingerprint, plan.fingerprint);
      assert.equal((await recover(f.root, { expected: plan.fingerprint })).phase, "complete");
      await writeFile(
        join(f.root, "receipt.json"),
        JSON.stringify({ stage, resumed, result: await readDirectory(f.root) }, null, 2),
      );
    } finally {
      await kill(actor);
    }
  },
  20000,
);

it.each(["write", "rename", "sync"])(
  "retains intent after actual %s failure and retries without inventing rollback",
  async (point) => {
    const f = await fixture(point);
    await f.crash();
    const plan = await inspectRecovery(f.root);
    fault.file = join(f.root, "factories/preview/probe", point !== "sync" ? "registry.json" : "");
    fault.point = point;
    try {
      await assert.rejects(recover(f.root, { expected: plan.fingerprint }), /injected/);
    } finally {
      fault.point = "";
    }
    assert.equal((await inspectRecovery(f.root)).phase, "recovering");
    assert.equal((await recover(f.root, { expected: plan.fingerprint })).phase, "complete");
  },
  15000,
);

it("refuses a reused port and a missing published binding without resetting either", async () => {
  const f = await fixture("refusal");
  await f.crash();
  const server = createServer(),
    address = new URL(f.resources[0]!.port);
  await new Promise<void>((done) => server.listen(Number(address.port), "127.0.0.1", done));
  try {
    const before = await authority(f.root);
    await assert.rejects(inspectRecovery(f.root));
    assert.deepEqual(await authority(f.root), before);
  } finally {
    await new Promise<void>((done) => server.close(() => done()));
  }
  const path = join(f.root, "factories/stable/probe/binding.json"),
    saved = await readFile(path);
  await rm(path);
  await assert.rejects(inspectRecovery(f.root), /binding authority missing/);
  await assert.rejects(readFile(path), /ENOENT/);
  await writeFile(path, saved);
  const marker = join(f.root, "factories/preview/unknown");
  await mkdir(marker);
  await assert.rejects(inspectRecovery(f.root), /unknown factory/);
  await rm(marker, { recursive: true });
  assert.equal((await recover(f.root, { expected: (await inspectRecovery(f.root)).fingerprint })).phase, "complete");
}, 15000);

it("fences a plan when another factory's metadata changes after inspection", async () => {
  const f = await fixture("changed");
  await f.crash();
  const plan = await inspectRecovery(f.root);
  const file = join(f.root, "factories/preview/probe/registry.json"),
    saved = await readFile(file, "utf8");
  const value = JSON.parse(saved);
  value.revision++;
  await writeFile(file, JSON.stringify(value));
  const before = await authority(f.root);
  await assert.rejects(recover(f.root, { expected: plan.fingerprint }), /fingerprint/);
  assert.deepEqual(await authority(f.root), before);
  await writeFile(file, saved);
  await recover(f.root, { expected: plan.fingerprint });
}, 15000);

it("takes every factory lock and releases earlier locks after a later conflict", async () => {
  const f = await fixture("factory-lock");
  await f.crash();
  const path = join(f.root, "factories/stable/probe/ownership.sqlite");
  const code = `import{DatabaseSync}from'node:sqlite';const db=new DatabaseSync(process.argv[1]);db.exec('PRAGMA locking_mode=EXCLUSIVE; BEGIN EXCLUSIVE');console.log('held');process.stdin.resume();`;
  const actor = spawn(process.execPath, ["--input-type=module", "-e", code, path], { stdio: ["pipe", "pipe", "pipe"] });
  try {
    await line(actor);
    const before = await authority(f.root);
    await assert.rejects(inspectRecovery(f.root), /authority/);
    assert.deepEqual(await authority(f.root), before);
  } finally {
    await kill(actor);
  }
  const plan = await inspectRecovery(f.root);
  assert.equal((await recover(f.root, { expected: plan.fingerprint })).phase, "complete");
}, 15000);

it("refuses a replaced live manager endpoint without deleting it", async () => {
  const f = await fixture("endpoint");
  await f.crash();
  await rm(f.endpoint);
  const server = createServer();
  await new Promise<void>((done) => server.listen(f.endpoint, done));
  try {
    const before = await authority(f.root);
    await assert.rejects(inspectRecovery(f.root), /endpoint changed/);
    assert.deepEqual(await authority(f.root), before);
  } finally {
    await new Promise<void>((done) => server.close(() => done()));
  }
  const plan = await inspectRecovery(f.root);
  await recover(f.root, { expected: plan.fingerprint });
}, 15000);

it("recovers a process-only factory without manufacturing allocator authority", async () => {
  const root = resolve("../../.artifacts/recovery", `${Date.now()}-processonly`);
  await mkdir(root, { recursive: true });
  const endpoint = join(tmpdir(), `recover-${digest(root).slice(7, 23)}.sock`);
  const code = `import{serve}from ${JSON.stringify(entry)};const host=await serve(process.argv[2],{root:process.argv[1]});await host.factory(${JSON.stringify(scope)}).start({service:'worker',generation:${JSON.stringify(digest("processonly"))},command:process.execPath,args:['-e',"console.log('ready');setInterval(()=>{},1000)"],ready:'ready'});console.log('owned');process.stdin.resume();`;
  const child = spawn(process.execPath, ["--input-type=module", "-e", code, root, endpoint], {
    stdio: ["pipe", "pipe", "pipe"],
  });
  try {
    await line(child);
  } finally {
    await kill(child);
  }
  const end = Date.now() + 5000;
  while ((await observeProcesses(root)).length && Date.now() < end) await sleep();
  const plan = await inspectRecovery(root);
  assert.equal(plan.factories[0]?.retireTransient, 0);
  await recover(root, { expected: plan.fingerprint });
  assert.equal((await readDirectory(root)).factories[0]?.phase, "unopened");
  await assert.rejects(readFile(join(root, "factories/stable/probe/ownership.sqlite")), /ENOENT/);
  const host = await serve(endpoint, { root });
  await host.close();
}, 15000);

it("refuses recovery while an external lifecycle controller remains alive", async () => {
  const f = await fixture("controller");
  const body = `import{connectRoot}from ${JSON.stringify(entry)};
    const {factory}=await connectRoot(process.argv[1],{channel:'stable',namespace:'probe'});
    process.stdin.resume();
    await factory.session(async()=>{console.log('held');await new Promise(()=>{});}).catch(()=>{});`;
  const child = spawn(process.execPath, ["--input-type=module", "-e", body, f.root], {
    stdio: ["pipe", "pipe", "pipe"],
  });
  try {
    assert.equal(await line(child), "held");
    await f.crash();
    const before = await authority(f.root);
    await assert.rejects(inspectRecovery(f.root), /controller remains alive/);
    assert.deepEqual(await authority(f.root), before);
    await kill(child);
    const plan = await inspectRecovery(f.root);
    assert.equal((await recover(f.root, { expected: plan.fingerprint })).phase, "complete");
  } finally {
    await kill(child);
    await f.crash();
  }
}, 15000);

it("refuses a linked factory storage root without touching the target", async () => {
  const f = await fixture("linked-storage");
  await f.crash();
  const before = await authority(f.root),
    path = join(f.root, "factories"),
    target = join(f.root, "moved-factories");
  await rename(path, target);
  await symlink(target, path);
  try {
    await assert.rejects(inspectRecovery(f.root), /factory storage/);
    assert.deepEqual(await authority(f.root), before);
  } finally {
    await rm(path);
    await rename(target, path);
  }
}, 15000);
