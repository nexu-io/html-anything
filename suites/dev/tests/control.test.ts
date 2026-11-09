import { mkdir, mkdtemp, readFile, realpath, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { channel, namespace } from "@odsuite/protocol";
import { inspectRecovery, observeProcesses, readDirectory, recover } from "@odsuite/sidecar";
import { expect, it } from "vitest";
import { managerRoot, plan, restart, start, status, stop } from "@";

async function fixture() {
  const repo = await realpath(await mkdtemp(join(tmpdir(), "odsuite-dev-")));
  await mkdir(join(repo, "carriers/sample/src"), { recursive: true });
  await mkdir(join(repo, "carriers/sample/dist"), { recursive: true });
  const product = JSON.stringify({
    name: "dev-fixture",
    private: true,
    type: "module",
    version: "1.2.3",
    packageManager: "pnpm@11.13.0",
    scripts: { build: "node build.mjs" },
  });
  const config =
    "schemaVersion: 1\ndev:\n  channels:\n    dev:\n      number: 7\n  carriers:\n    sample:\n      entry: carriers/sample/dist/dev.mjs\n    docker:\n      unsupported: scaffold\n";
  await writeFile(join(repo, "package.json"), product);
  await writeFile(join(repo, "pnpm-workspace.yaml"), "packages: []\n");
  await writeFile(join(repo, "odsuite.yaml"), config);
  await writeFile(join(repo, "carriers/sample/src/main.ts"), "alpha");
  await writeFile(
    join(repo, "build.mjs"),
    `import{readFile,writeFile}from'node:fs/promises';const source=await readFile('carriers/sample/src/main.ts','utf8');await writeFile('building.txt',source);if(source==='broken')process.exit(1);if(source==='slow')await new Promise(r=>setTimeout(r,10000));await writeFile('carriers/sample/dist/source.txt',source);`,
  );
  await writeFile(
    join(repo, "carriers/sample/dist/dev.mjs"),
    `import{createServer}from'node:http';import{readFile,writeFile}from'node:fs/promises';import{join}from'node:path';export async function open({factory,repo}){let server,worker,url,marker;const source=await readFile(join(repo,'carriers/sample/dist/source.txt'),'utf8');await factory.expose({identity:{service:'sample',generation:'sha256:'+'a'.repeat(64)},handlers:{},lifecycle:{initialize:async context=>{const persistent=join(context.roots.data,'marker.txt');try{marker=await readFile(persistent,'utf8')}catch{marker=crypto.randomUUID();await writeFile(persistent,marker)}const socket=await context.allocate({kind:'socket',name:'app'}),port=await context.allocate({kind:'port',name:'app',scheme:'http'});server=createServer((req,res)=>{res.end(JSON.stringify({source,marker}))});await new Promise(r=>server.listen(socket.value,r));await context.forward(port.value,socket.value);url=port.value;worker=await factory.start({command:process.execPath,args:['-e',"console.log('ready');setInterval(()=>{},1000)"],ready:'ready',service:'sampleworker',generation:'sha256:'+'b'.repeat(64)});},stop:async()=>{await new Promise(r=>server.close(r));server.closeAllConnections();if(worker){const retired=await factory.release(worker);if(retired.status!=='stopped')throw Error('worker survived')}}}});return{status:async()=>({healthy:(await factory.inspect()).some(p=>p.service==='sampleworker'&&p.state==='running'),url,source,marker})};}`,
  );
  return {
    repo,
    config,
    product,
    target: { repo, scope: { channel: channel("dev"), namespace: namespace("default") }, carrier: "sample" },
    write: async (value: string) => writeFile(join(repo, "carriers/sample/src/main.ts"), value),
    read: async (name: string) => readFile(join(repo, name), "utf8"),
    remove: () => rm(repo, { recursive: true, force: true }),
  };
}
async function until(check: () => Promise<boolean>, timeout = 15000) {
  const deadline = Date.now() + timeout;
  while (Date.now() < deadline) {
    if (await check()) return;
    await new Promise((r) => setTimeout(r, 50));
  }
  throw new Error("condition timed out");
}

it("owns real builds and factory state, isolates namespaces and controls independently of source config", async () => {
  const f = await fixture(),
    other = { ...f.target, scope: { ...f.target.scope, namespace: namespace("other") } };
  let passed = false;
  try {
    expect((await status(f.target)).state).toBe("stopped");
    const candidate = await plan({ ...f.target, watch: false });
    expect(candidate.version).toBe("1.2.3-dev.7");
    const active = await start(candidate);
    if (active.state !== "running") throw Error("not running");
    expect(active.runtime.source).toBe("alpha");
    const marker = active.runtime.marker;
    await expect(start(candidate)).rejects.toThrow("factory is running");
    await start(await plan({ ...other, watch: false }));
    await writeFile(join(f.repo, "odsuite.yaml"), "invalid: [");
    await writeFile(join(f.repo, "package.json"), "{");
    expect((await status(f.target)).state).toBe("running");
    expect((await stop(f.target)).state).toBe("stopped");
    expect((await status(other)).state).toBe("running");
    await writeFile(join(f.repo, "odsuite.yaml"), f.config);
    await writeFile(join(f.repo, "package.json"), f.product);
    const next = await restart(await plan({ ...f.target, watch: false }));
    if (next.state !== "running") throw Error("not running");
    expect(next.runtime.marker).toBe(marker);
    expect(next.manager.incarnation).not.toBe(active.manager.incarnation);
    await expect(status({ ...f.target, carrier: "different" })).rejects.toThrow("carrier does not match");
    await expect(plan({ ...f.target, carrier: "docker" })).rejects.toThrow("scaffold");
    passed = true;
  } finally {
    await stop(f.target);
    await stop(other);
    expect((await observeProcesses(managerRoot(f.repo, f.target.scope))).length).toBe(0);
    expect((await readDirectory(managerRoot(f.repo, f.target.scope))).manager.phase).toBe("closed");
    if (passed) await f.remove();
    else process.stderr.write(`retained dev evidence: ${f.repo}\n`);
  }
}, 45000);
it("watches controlled source, preserves the running generation on build failure and drains an in-flight rebuild", async () => {
  const f = await fixture();
  let passed = false;
  try {
    await start(await plan(f.target));
    await f.write("bravo");
    await until(async () => {
      const s = await status(f.target);
      return s.state === "running" && s.build.phase === "succeeded" && s.build.restartRequired;
    });
    const current = await status(f.target);
    if (current.state !== "running") throw Error("not running");
    expect(current.runtime.source).toBe("alpha");
    expect(await f.read("carriers/sample/dist/source.txt")).toBe("bravo");
    await f.write("broken");
    await until(async () => {
      const s = await status(f.target);
      return s.state === "running" && s.build.phase === "failed";
    });
    await f.write("slow");
    await until(async () => {
      const s = await status(f.target);
      return s.state === "running" && s.build.phase === "building";
    });
    const before = Date.now();
    await stop(f.target);
    expect(Date.now() - before).toBeLessThan(8000);
    expect((await observeProcesses(managerRoot(f.repo, f.target.scope))).length).toBe(0);
    passed = true;
  } finally {
    await stop(f.target);
    if (passed) await f.remove();
    else process.stderr.write(`retained watcher evidence: ${f.repo}\n`);
  }
}, 45000);

it("refuses interrupted takeover, retires the stamped workload tree and preserves data through explicit recovery", async () => {
  const f = await fixture();
  let passed = false;
  try {
    const candidate = await plan({ ...f.target, watch: false });
    const first = await start(candidate);
    if (first.state !== "running") throw Error("not running");
    process.kill(first.manager.pid, "SIGKILL");
    const root = managerRoot(f.repo, f.target.scope);
    await until(async () => (await observeProcesses(root)).length === 0);
    expect((await status(f.target)).state).toBe("interrupted");
    await expect(start(candidate)).rejects.toThrow("interrupted");
    await expect(restart(candidate)).rejects.toThrow("explicitly");
    const recovery = await inspectRecovery(root);
    await recover(root, { expected: recovery.fingerprint });
    const next = await start(candidate);
    if (next.state !== "running") throw Error("not running");
    expect(next.runtime.marker).toBe(first.runtime.marker);
    passed = true;
  } finally {
    const state = await status(f.target);
    if (state.state !== "interrupted") await stop(f.target);
    if (passed) await f.remove();
    else process.stderr.write(`retained recovery evidence: ${f.repo}\n`);
  }
}, 45000);

it("observes stopping through sidecar while a lifecycle is still draining", async () => {
  const f = await fixture();
  const entry = join(f.repo, "carriers/sample/dist/dev.mjs");
  const source = await readFile(entry, "utf8");
  await writeFile(
    entry,
    source.replace(
      "stop:async()=>{",
      "stop:async()=>{await writeFile(join(repo,'stopping.txt'),'yes');while((await readFile(join(repo,'gate.txt'),'utf8'))!=='open')await new Promise(r=>setTimeout(r,20));",
    ),
  );
  await writeFile(join(f.repo, "gate.txt"), "closed");
  let stopping: ReturnType<typeof stop> | undefined,
    passed = false;
  try {
    await start(await plan({ ...f.target, watch: false }));
    stopping = stop({ repo: f.repo, scope: f.target.scope });
    await until(async () => (await f.read("stopping.txt").catch(() => "")) === "yes");
    expect((await status({ repo: f.repo, scope: f.target.scope })).state).toBe("stopping");
    await expect(status(f.target)).rejects.toThrow("identity is not ready");
    await writeFile(join(f.repo, "gate.txt"), "open");
    expect((await stopping).state).toBe("stopped");
    passed = true;
  } finally {
    await writeFile(join(f.repo, "gate.txt"), "open");
    await stopping;
    await stop(f.target);
    if (passed) await f.remove();
    else process.stderr.write(`retained stopping evidence: ${f.repo}\n`);
  }
}, 20000);
