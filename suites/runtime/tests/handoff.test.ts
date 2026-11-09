import assert from "node:assert/strict";
import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { channel } from "@odsuite/protocol";
import { compose, emitUnit, resolve } from "@odsuite/release";
import { it } from "vitest";
import { Bootstrap, Session, writeProduct } from "@";

async function fixture(baselineMode = "normal") {
  const root = await mkdtemp(join(tmpdir(), "capsule-handoff-"));
  const entry = pathToFileURL(join(process.cwd(), "dist/index.mjs")).href;
  const manifest = (version: string) => resolve({}, { channel: channel("stable"), version });
  const capsule = async (version: string, mode = "normal") => {
    const path = join(root, `capsule-${version}-${mode}`);
    await mkdir(path);
    await writeFile(
      join(path, "index.mjs"),
      `import{readFile}from"node:fs/promises";export const mode=${JSON.stringify(mode)};export const control={failStop:mode==="stop-fail",entered:false,release:()=>{}};export function create(){let c;return {handlers:{resource:async()=>({pid:process.pid,path:c.blobs.model,value:await readFile(c.blobs.model,"utf8")}),version:()=>({version:c.version}),health:()=>c.daemon.request('health'),work:async()=>{control.entered=true;await new Promise(r=>control.release=r);await c.resources.allocate({kind:'lock',name:'method'});return 'allocated';}},async initialize(x){c=x;${mode === "init-fail" ? "throw Error('injected init failure');" : ""}return{window:{title:'capsule-${version}'},loading:'loading-${version}',witness:'capsule-${version}'}},async ready(){await c.updates.start();},async stop(){await c.updates.stop();if(control.failStop)throw Error('injected stop failure');}};}`,
    );
    return path;
  };
  const web = async (version: string, api = "probe/1") => {
    const path = join(root, `web-${version}`);
    await mkdir(path);
    await writeFile(join(path, "index.html"), version);
    await emitUnit(path, { schema: 1, kind: "web", version, api });
    return path;
  };
  const daemon = async (version: string, api = "probe/1") => {
    const path = join(root, `daemon-${version}`);
    await mkdir(path);
    await writeFile(
      join(path, "main.mjs"),
      `import{serveDaemon}from ${JSON.stringify(entry)};await serveDaemon('${version}');`,
    );
    await emitUnit(path, { schema: 1, kind: "daemon", version, api });
    return path;
  };
  let w = await web("0.1.0"),
    d = await daemon("0.1.0");
  const product = async (version: string, mode = "normal", carrier = 1) => {
    const model = join(root, `model-${version}-${mode}`);
    await writeFile(model, `model-${version}`);
    return compose(manifest(version), {
      carrier,
      capsule: await capsule(version, mode),
      web: w,
      daemon: d,
      blobs: [{ slot: "model", path: model }],
    });
  };
  const baseline = await product("0.1.0", baselineMode);
  await writeProduct(join(root, "seed"), baseline);
  let commitFault = false;
  let stoppedDocument: { nonce: string; accepted: boolean } | undefined;
  const options = {
    blobRetentionMs: 0,
    root: join(root, "state"),
    seed: join(root, "seed"),
    carrier: 1,
    manifest: baseline.manifest,
    namespace: "probe",
    executable: process.execPath,
    onActivation: async (c: { stage: string }) => {
      if (c.stage === "capsule-stopped")
        stoppedDocument = { nonce: session.documentNonce(), accepted: session.acceptDocument(session.documentNonce()) };
      if (commitFault && c.stage === "committed") throw Error("injected postcommit failure");
    },
  };
  let session = await Session.open(options);
  let controllerFault = false;
  let starts = 0,
    stops = 0;
  const environment = {
    updates: async () => {
      starts++;
      if (controllerFault) throw Error("injected controller start failure");
      return {
        close: async () => {
          stops++;
        },
      };
    },
  };
  const composition = await session.activate(environment);
  await session.start();
  await session.documentStart(async () => {});
  await session.documentReady();
  await session.confirm(composition, "web");
  const renderer = {
    compose: async () => {},
    reload: async () => {
      await session.documentStart(async () => {});
      await session.documentReady();
      return "web";
    },
    probe: async () => "web",
  };
  return {
    root,
    baseline,
    options,
    environment,
    renderer,
    product,
    web,
    daemon,
    session,
    coordinated: async () => {
      w = await web("0.2.0", "probe/2");
      d = await daemon("0.2.0", "probe/2");
    },
    controllerFault: () => {
      controllerFault = true;
    },
    fault: () => {
      commitFault = true;
    },
    counts: () => ({ starts, stops }),
    stoppedDocument: () => stoppedDocument,
    replace: (s: Session) => {
      session = s;
    },
    close: async () => {
      await session.close();
      await rm(root, { recursive: true, force: true });
    },
  };
}

it("executes Capsule-only then coordinated candidates under one Electron owner and preserves data", async () => {
  const f = await fixture();
  try {
    const initialResource = (await f.session.call("resource", null)) as { path: string; value: string; pid: number };
    assert.equal(initialResource.value, "model-0.1.0");
    assert.equal(initialResource.pid, process.pid);
    const initialState = await f.session.blobStatus();
    const initialUses = Object.values(initialState.entries)
      .flatMap((entry) => entry.uses)
      .filter((use) => use.path === initialResource.path);
    assert.equal(initialUses.length, 1);
    assert.equal(initialUses[0]?.owner.service, "electron");
    const before = await f.session.snapshot(),
      nonce = f.session.documentNonce();
    await f.session.request("write", { retained: true });
    const next = await f.product("0.2.0");
    const receipt = await f.session.applyCapsule(next, f.renderer);
    assert.equal(receipt.capsule, "capsule-0.2.0");
    assert.equal(receipt.product?.version, "0.2.0");
    assert.equal(receipt.daemon.pid, before.daemon.pid);
    assert.equal(receipt.anchor, before.anchor);
    assert.notEqual(f.session.documentNonce(), nonce);
    assert.deepEqual(f.stoppedDocument(), { nonce, accepted: false });
    assert.equal(receipt.counts.document, before.counts.document + 1);
    assert.deepEqual(await f.session.call("version", null), { version: "0.2.0" });
    assert.deepEqual(f.counts(), { starts: 2, stops: 1 });
    const nextResource = (await f.session.call("resource", null)) as { path: string; value: string; pid: number };
    assert.equal(nextResource.value, "model-0.2.0");
    assert.deepEqual(await f.session.collectBlobs(), []);
    assert.equal(await readFile(initialResource.path, "utf8"), "model-0.1.0");
    await f.coordinated();
    const combined = await f.product("0.3.0");
    const swapped = await f.session.applyCapsule(combined, f.renderer);
    assert.notEqual(swapped.daemon.pid, receipt.daemon.pid);
    assert.equal(swapped.units.web.version, "0.2.0");
    assert.ok(swapped.directory.instances.every((i) => i.service !== "capsule"));
    const state = await f.session.blobStatus();
    assert.deepEqual(state.references.map((r) => r.kind).sort(), ["current", "recovery"]);
    assert.equal(Object.values(state.entries).flatMap((e) => e.uses).length, 4);
    assert.equal((await f.session.collectBlobs()).length, 2);
    await assert.rejects(readFile(initialResource.path), /ENOENT/);
    assert.equal(await readFile(nextResource.path, "utf8"), "model-0.2.0");
    assert.equal(((await f.session.call("resource", null)) as { value: string }).value, "model-0.3.0");
    assert.deepEqual(await f.session.request("read"), { retained: true });
    await f.session.close();
    const cold = await Session.open(f.options);
    f.replace(cold);
    const c = await cold.activate(f.environment);
    await cold.start();
    const ready = await cold.confirm(c, "web");
    assert.equal(ready.generation, combined.envelope.digest);
    assert.equal(ready.product?.version, "0.3.0");
    assert.equal(((await cold.call("resource", null)) as { value: string }).value, "model-0.3.0");
    assert.deepEqual(await cold.collectBlobs(), []);
  } finally {
    await f.close();
  }
}, 20000);

it("refuses ABI/version changes before binding mutation and resumes only the previous leaf observer", async () => {
  const f = await fixture();
  try {
    const before = await f.session.content();
    await assert.rejects(f.session.applyCapsule(await f.product("0.1.0", "same"), f.renderer), /version must increase/);
    await assert.rejects(f.session.applyCapsule(await f.product("0.2.0", "abi", 999), f.renderer), /incompatible/);
    assert.equal((await f.session.content()).envelope.digest, before.envelope.digest);
    assert.equal((await f.session.snapshot()).phase, "ready");
    assert.deepEqual(f.counts(), { starts: 1, stops: 0 });
  } finally {
    await f.close();
  }
}, 15000);

it("cleans a failed new adapter and explicitly restores the committed baseline before cold recovery", async () => {
  const f = await fixture();
  try {
    await assert.rejects(
      f.session.applyCapsule(await f.product("0.2.0", "init-fail"), f.renderer),
      /baseline restored=true/,
    );
    assert.equal((await f.session.snapshot()).generation, f.baseline.envelope.digest);
    assert.deepEqual(await f.session.call("version", null), { version: "0.1.0" });
    await f.session.close();
    await assert.rejects(Session.open(f.options), /blocked/);
    const recovered = await Session.open({ ...f.options, recover: true });
    f.replace(recovered);
    const c = await recovered.activate();
    await recovered.start();
    assert.equal((await recovered.confirm(c, "web")).generation, f.baseline.envelope.digest);
  } finally {
    await f.close();
  }
}, 15000);

it("does not roll back a persisted Capsule commit when its postcommit observation fails", async () => {
  const f = await fixture();
  try {
    const next = await f.product("0.2.0");
    f.fault();
    await assert.rejects(f.session.applyCapsule(next, f.renderer), /commit persisted/);
    assert.equal((await f.session.snapshot()).generation, next.envelope.digest);
    await f.session.close();
    const cold = await Session.open(f.options);
    f.replace(cold);
    const c = await cold.activate();
    await cold.start();
    assert.equal((await cold.confirm(c, "web")).generation, next.envelope.digest);
  } finally {
    await f.close();
  }
}, 15000);

it("retains the old adapter when its stop fails and never claims a restored baseline", async () => {
  const f = await fixture("stop-fail");
  const module = await import(pathToFileURL(join(f.session.mount.capsule, "index.mjs")).href);
  try {
    const before = await f.session.snapshot();
    await assert.rejects(f.session.applyCapsule(await f.product("0.2.0"), f.renderer), /baseline restored=false/);
    assert.equal((await f.session.snapshot()).product?.artifact, before.product?.artifact);
    assert.equal((await f.session.snapshot()).daemon.pid, before.daemon.pid);
    await assert.rejects(f.session.call("version", null), /not ready/);
  } finally {
    module.control.failStop = false;
    await f.close();
  }
}, 15000);

it("keeps a committed candidate selected after a new controller start failure and still drains the real owner", async () => {
  const f = await fixture();
  try {
    const next = await f.product("0.2.0");
    f.controllerFault();
    await assert.rejects(f.session.applyCapsule(next, f.renderer), /commit persisted; controller start failed/);
    assert.equal((await f.session.snapshot()).generation, next.envelope.digest);
    await f.session.close();
    const cold = await Session.open(f.options);
    f.replace(cold);
    const c = await cold.activate();
    await cold.start();
    assert.equal((await cold.confirm(c, "web")).product?.version, "0.2.0");
  } finally {
    await f.close();
  }
}, 15000);

it("drains accepted adapter work that still needs a resource lane before taking the handoff lane", async () => {
  const f = await fixture();
  const module = await import(pathToFileURL(join(f.session.mount.capsule, "index.mjs")).href);
  try {
    const work = f.session.call("work", null);
    while (!module.control.entered) await new Promise((done) => setTimeout(done, 10));
    const changing = f.session.applyCapsule(await f.product("0.2.0"), f.renderer);
    await new Promise((done) => setTimeout(done, 25));
    module.control.release();
    assert.equal(await work, "allocated");
    assert.equal((await changing).product?.version, "0.2.0");
  } finally {
    module.control.release();
    await f.close();
  }
}, 15000);

it("drains an accepted resource call before acquiring the normal shutdown lane", async () => {
  const f = await fixture();
  const module = await import(pathToFileURL(join(f.session.mount.capsule, "index.mjs")).href);
  try {
    const work = f.session.call("work", null);
    while (!module.control.entered) await new Promise((done) => setTimeout(done, 10));
    const closing = f.session.close();
    await new Promise((done) => setTimeout(done, 25));
    module.control.release();
    assert.equal(await work, "allocated");
    assert.equal((await closing).status, "stopped");
  } finally {
    module.control.release();
    await f.close();
  }
}, 15000);

it("holds real Electron bootstrap authority before staging and transfers that exact owner to runtime", async () => {
  const f = await fixture();
  let boot: Bootstrap | undefined;
  let runtime: Session | undefined;
  try {
    const options = { ...f.options, root: join(f.root, "fresh") };
    boot = await Bootstrap.open(options);
    assert.equal(boot.context.identity.service, "electron");
    await boot.close();
    // Closing a blocked first-launch bootstrap leaves no failed binding attempt.
    boot = await Bootstrap.open(options);
    const owner = boot.context.incarnation;
    runtime = await Session.open(options, boot);
    boot = undefined;
    const composition = await runtime.activate();
    assert.equal((await runtime.bootstrap()).incarnation, owner);
    await runtime.start();
    await runtime.confirm(composition, "web");
    assert.ok((await runtime.snapshot()).directory.instances.every((i) => i.service !== "capsule"));
  } finally {
    await runtime?.close();
    await boot?.close();
    await f.close();
  }
}, 15000);

it("fences a running product immediately and drains accepted resource work before native blocking", async () => {
  const f = await fixture();
  const module = await import(pathToFileURL(join(f.session.mount.capsule, "index.mjs")).href);
  try {
    const nonce = f.session.documentNonce(),
      work = f.session.call("work", null);
    while (!module.control.entered) await new Promise((done) => setTimeout(done, 10));
    const blocked = f.session.block("minimum shell changed");
    assert.equal(f.session.acceptDocument(nonce), false);
    await assert.rejects(f.session.call("version", null), /closed/);
    module.control.release();
    assert.equal(await work, "allocated");
    await blocked;
    assert.equal((await f.session.snapshot()).phase, "blocked");
    await assert.rejects(f.session.applyCapsule(await f.product("0.2.0"), f.renderer), /not accepting/);
  } finally {
    module.control.release();
    await f.close();
  }
}, 15000);

it("preserves the last distinct recovery resource across same-generation recovery commits", async () => {
  const f = await fixture();
  try {
    const old = (await f.session.call("resource", null)) as { path: string };
    const next = await f.product("0.2.0");
    await f.session.applyCapsule(next, f.renderer);
    const broken = await f.product("0.3.0", "init-fail");
    await assert.rejects(f.session.applyCapsule(broken, f.renderer), /baseline restored=true/);
    await f.session.close();
    const cold = await Session.open({ ...f.options, recover: true });
    f.replace(cold);
    const composition = await cold.activate();
    await cold.start();
    await cold.confirm(composition, "web");
    const state = await cold.blobStatus();
    assert.deepEqual(
      state.references.map((r) => [r.kind, r.name]).sort(),
      [
        ["current", next.envelope.digest],
        ["recovery", f.baseline.envelope.digest],
      ].sort(),
    );
    assert.equal((await cold.collectBlobs()).length, 2);
    assert.equal(await readFile(old.path, "utf8"), "model-0.1.0");
    assert.equal(((await cold.call("resource", null)) as { value: string }).value, "model-0.2.0");
  } finally {
    await f.close();
  }
}, 20000);
