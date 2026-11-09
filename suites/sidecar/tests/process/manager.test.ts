import assert from "node:assert/strict";
import { fork } from "node:child_process";
import { mkdir, mkdtemp, readFile, realpath, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { channel, digest, namespace } from "@odsuite/protocol";
import { it } from "vitest";
import { connectRoot, managerAlive, observeOwner, readAuthority, serve, startManager, stopManager } from "@";

it("hands a stamped independent manager to its own authority and survives launcher exit", async () => {
  const root = await realpath(await mkdtemp(join(tmpdir(), "manager-life-")));
  const library = pathToFileURL(join(process.cwd(), "dist/index.mjs")).href,
    scope = { channel: channel("stable"), namespace: namespace("installation") };
  const program = join(root, "manager.mjs"),
    target = join(root, "target.app");
  await mkdir(target);
  await writeFile(join(target, "retained"), "user installation");
  await writeFile(
    program,
    `import{serve,managerReady}from ${JSON.stringify(library)};const root=process.argv[2];const scope=${JSON.stringify(scope)};const s=await serve(root+'.sock',{root});await s.factory(scope).grant({kind:'installation',name:'application',scope:'factory',target:${JSON.stringify(target)}});await s.factory(scope).expose({identity:{service:'installer',generation:${JSON.stringify(digest("installer"))}},handlers:{status:()=>({pid:process.pid}),finish:()=>{setTimeout(async()=>{await s.close();process.exit(0)},20);return true;}},lifecycle:{initialize:async()=>{},stop:async()=>{}}});process.on('SIGTERM',async()=>{await s.close();process.exit(0)});await managerReady(s,root,scope);`,
  );
  const launcher = join(root, "launcher.mjs");
  await writeFile(
    launcher,
    `import{startManager}from ${JSON.stringify(library)};const result=await startManager({root:${JSON.stringify(join(root, "state"))},scope:${JSON.stringify(scope)},log:${JSON.stringify(join(root, "manager.log"))},command:process.execPath,args:[${JSON.stringify(program)},${JSON.stringify(join(root, "state"))}]});process.send(result);process.disconnect();`,
  );
  const child = fork(launcher, [], { stdio: ["ignore", "ignore", "pipe", "ipc"] });
  let errors = "";
  child.stderr?.on("data", (c) => (errors += c.toString()));
  const witness = await new Promise<Awaited<ReturnType<typeof startManager>>>((done, reject) => {
    child.on("message", (v) => done(v as never));
    child.on("error", reject);
    child.on("exit", (code) => {
      if (code) reject(Error(`launcher exit ${code}: ${errors}`));
    });
  });
  await new Promise<void>((done) => child.once("exit", () => done()));
  try {
    assert.equal(await managerAlive(witness), true);
    assert.deepEqual(await observeOwner(witness.root, scope), witness);
    await assert.rejects(
      startManager({
        root: witness.root,
        scope,
        command: process.execPath,
        args: [program, witness.root],
        timeout: 3000,
        log: join(root, "contender.log"),
      }),
      /held|before readiness/,
    );
    const { factory } = await connectRoot(witness.root, scope);
    assert.equal((await factory.resources()).grants.find((g) => g.kind === "installation")?.value, target);
    const peer = await factory.connect<{ finish: { input: null; output: boolean } }>({
      service: "installer",
      generation: digest("installer"),
    });
    assert.equal(await peer.call("finish", null), true);
    const deadline = Date.now() + 5000;
    while (await managerAlive(witness)) {
      if (Date.now() > deadline) throw Error("manager survived finish");
      await new Promise((done) => setTimeout(done, 20));
    }
    assert.equal(await readFile(join(target, "retained"), "utf8"), "user installation");
    const controller = await serve(join(root, "controller.sock"), { root: join(root, "controller") });
    const detachedLauncher = join(root, "managed-launcher.mjs"),
      state = join(root, "managed-state"),
      receipt = join(root, "managed.json");
    await writeFile(
      detachedLauncher,
      `import{startManager}from ${JSON.stringify(library)};import{writeFile}from'node:fs/promises';const manager=await startManager({root:${JSON.stringify(state)},scope:${JSON.stringify(scope)},log:${JSON.stringify(join(root, "managed.log"))},command:process.execPath,args:[${JSON.stringify(program)},${JSON.stringify(state)}]});await writeFile(${JSON.stringify(receipt)},JSON.stringify(manager));console.log('independent-ready');setInterval(()=>{},1000);`,
    );
    const controllerFactory = controller.factory({ ...scope, namespace: namespace("validation") });
    const lease = await controllerFactory.start({
      service: "launcher",
      generation: digest("launcher"),
      command: process.execPath,
      args: [detachedLauncher],
      ready: "independent-ready",
    });
    const independent = JSON.parse(await readFile(receipt, "utf8")) as typeof witness;
    try {
      assert.equal((await controllerFactory.release(lease)).status, "stopped");
      assert.equal(await managerAlive(independent), true);
      const next = await connectRoot(independent.root, scope),
        peer = await next.factory.connect<{ finish: { input: null; output: boolean } }>({
          service: "installer",
          generation: digest("installer"),
        });
      await peer.call("finish", null);
      const until = Date.now() + 5000;
      while (await managerAlive(independent)) {
        if (Date.now() > until) throw Error("independent manager did not stop");
        await new Promise((done) => setTimeout(done, 20));
      }
    } finally {
      if (await managerAlive(independent)) process.kill(independent.pid, "SIGTERM");
      await controller.close();
    }
  } finally {
    if (await managerAlive(witness)) process.kill(witness.pid, "SIGTERM");
  }
}, 20000);

it("escalates a failed independent bootstrap without retiring interrupted authority", async () => {
  const root = await realpath(await mkdtemp(join(tmpdir(), "manager-failed-"))),
    library = pathToFileURL(join(process.cwd(), "dist/index.mjs")).href,
    state = join(root, "state"),
    program = join(root, "failed.mjs"),
    receipt = join(root, "pid.json"),
    scope = { channel: channel("stable"), namespace: namespace("installation") };
  await writeFile(
    program,
    `import{serve}from ${JSON.stringify(library)};import{writeFile}from'node:fs/promises';await serve(${JSON.stringify(join(root, "manager.sock"))},{root:${JSON.stringify(state)}});process.on('SIGTERM',()=>{});await writeFile(${JSON.stringify(receipt)},JSON.stringify({pid:process.pid}));setInterval(()=>{},1000);`,
  );
  await assert.rejects(
    startManager({
      root: state,
      scope,
      command: process.execPath,
      args: [program],
      timeout: 1000,
      log: join(root, "manager.log"),
    }),
    /readiness timeout/,
  );
  const { pid } = JSON.parse(await readFile(receipt, "utf8"));
  assert.throws(() => process.kill(pid, 0), /ESRCH/);
  await assert.rejects(serve(join(root, "new.sock"), { root: state }), /interrupted.*recovery/);
}, 10000);

it("refuses an unstamped manager stop and distinguishes unclaimed bootstrap from incomplete authority", async () => {
  const root = await realpath(await mkdtemp(join(tmpdir(), "manager-control-")));
  assert.equal(await readAuthority(root), undefined);
  const scope = { channel: channel("dev"), namespace: namespace("default") };
  const service = await serve(join(root, "manager.sock"), { root });
  try {
    const owner = await observeOwner(root, scope);
    assert.ok(owner);
    await assert.rejects(stopManager(owner), /witness mismatch/);
  } finally {
    await service.close();
  }
  const incomplete = join(root, "incomplete");
  await mkdir(join(incomplete, "factories"), { recursive: true });
  await assert.rejects(readAuthority(incomplete), /incomplete/);
});
