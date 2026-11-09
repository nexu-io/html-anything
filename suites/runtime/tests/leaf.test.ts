import assert from "node:assert/strict";
import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { channel } from "@odsuite/protocol";
import { compose, emitUnit, resolve } from "@odsuite/release";
import { it } from "vitest";
import { Session, writeProduct } from "@";

it("activates only changed units, fences compatibility and leaves failed binding for explicit recovery", async () => {
  const root = await mkdtemp(join(tmpdir(), "leaf-"));
  const manifest = resolve({}, { channel: channel("stable"), version: "0.1.0" });
  const capsule = join(root, "capsule");
  await mkdir(capsule);
  await writeFile(
    join(capsule, "index.mjs"),
    'export function create(){return {handlers:{},ready:async()=>{},initialize:async()=>({loading:"Loading",window:{title:"fixture"},witness:"capsule1"}),stop:async()=>{}}}',
  );
  const entry = pathToFileURL(join(process.cwd(), "dist/index.mjs")).href;
  const web = async (version: string, api = "probe/1") => {
    const p = join(root, `web-${version}`);
    await mkdir(p);
    await writeFile(join(p, "index.html"), version);
    await emitUnit(p, { schema: 1, kind: "web", version, api });
    return p;
  };
  const daemon = async (version: string, api = "probe/1") => {
    const p = join(root, `daemon-${version}`);
    await mkdir(p);
    await writeFile(
      join(p, "main.mjs"),
      `import{serveDaemon}from ${JSON.stringify(entry)};await serveDaemon(${JSON.stringify(version)});`,
    );
    await emitUnit(p, { schema: 1, kind: "daemon", version, api });
    return p;
  };
  let w = await web("0.1.0"),
    d = await daemon("0.1.0");
  const product = () => compose(manifest, { capsule, web: w, daemon: d, carrier: 1 });
  const initial = await product(),
    seed = join(root, "seed");
  await writeProduct(seed, initial);
  let commitFault = false;
  const options = {
    onActivation: async (checkpoint: { stage: string }) => {
      if (commitFault && checkpoint.stage === "committed") throw new Error("injected postcommit observer failure");
    },
    root: join(root, "state"),
    seed,
    manifest,
    namespace: "probe",
    executable: process.execPath,
    carrier: 1,
  };
  let session = await Session.open(options);
  try {
    const payload = await session.activate();
    await session.start();
    await session.documentStart(async () => {});
    await session.documentReady();
    let witness = "web:0.1.0";
    const renderer = {
      reload: async () => {
        await session.documentStart(async () => {});
        await session.documentReady();
        const value = JSON.parse(await readFile(join(session.mount.web, "unit.json"), "utf8"));
        if (value.version === "0.4.0") throw new Error("injected web failure");
        witness = `web:${value.version}`;
        return witness;
      },
      probe: async () => witness,
    };
    const baseline = await session.confirm(payload, witness),
      pid = baseline.daemon.pid;
    await session.request("write", { retained: "yes" });
    w = await web("0.2.0");
    const first = await product();
    const a = await session.applyLeaf(first, renderer);
    assert.equal(a.daemon.pid, pid);
    assert.deepEqual(a.counts, { daemon: 1, document: 2 });
    assert.equal(a.units.web.version, "0.2.0");
    assert.equal(a.units.daemon.version, "0.1.0");
    assert.equal(a.units.daemon.digest, initial.envelope.generation.daemon.digest);
    assert.equal(a.daemon.generation, initial.envelope.digest);
    const nonce = a.units.web.nonce;
    d = await daemon("0.2.0");
    const second = await product();
    const b = await session.applyLeaf(second, renderer);
    assert.notEqual(b.daemon.pid, pid);
    assert.equal(b.units.web.nonce, nonce);
    assert.deepEqual(b.counts, { daemon: 2, document: 2 });
    assert.deepEqual(await session.request("read"), { retained: "yes" });
    w = await web("0.3.0", "probe/2");
    d = await daemon("0.3.0", "probe/2");
    const coordinated = await product();
    const c = await session.applyLeaf(coordinated, renderer);
    assert.deepEqual(c.counts, { daemon: 3, document: 3 });
    assert.equal(c.capsule, baseline.capsule);
    const current = await session.content();
    w = await web("0.5.0", "probe/3");
    await assert.rejects(session.applyLeaf(await product(), renderer), /incompatible/);
    assert.equal((await session.snapshot()).generation, coordinated.envelope.digest);
    assert.deepEqual((await session.snapshot()).counts, c.counts);
    w = await web("0.4.0", "probe/2");
    await assert.rejects(session.applyLeaf(await product(), renderer), /baseline restored=true/);
    const failed = await session.snapshot();
    assert.equal(failed.phase, "failed");
    assert.equal(failed.generation, current.envelope.digest);
    assert.equal(failed.units.web.version, "0.3.0");
    assert.equal(failed.daemon.pid, c.daemon.pid);
    await session.close();
    await assert.rejects(Session.open(options), /blocked/);
    session = await Session.open({ ...options, recover: true });
    const restoredComposition = await session.activate();
    await session.start();
    await session.documentStart(async () => {});
    await session.documentReady();
    const restored = await session.confirm(restoredComposition, "web:0.3.0");
    assert.equal(restored.generation, coordinated.envelope.digest);
    assert.equal(restored.units.daemon.version, "0.3.0");
    assert.deepEqual(await session.request("read"), { retained: "yes" });
    w = await web("0.6.0", "probe/2");
    const committedDespiteFault = await product();
    commitFault = true;
    await assert.rejects(session.applyLeaf(committedDespiteFault, renderer), /commit persisted; cleanup failed/);
    assert.equal((await session.snapshot()).generation, committedDespiteFault.envelope.digest);
    assert.equal((await session.snapshot()).units.web.version, "0.6.0");
    await session.close();
    session = await Session.open(options);
    const committedComposition = await session.activate();
    await session.start();
    await session.documentStart(async () => {});
    await session.documentReady();
    const coldCommitted = await session.confirm(committedComposition, "web:0.6.0");
    assert.equal(coldCommitted.generation, committedDespiteFault.envelope.digest);
    assert.deepEqual(await session.request("read"), { retained: "yes" });
  } finally {
    await session.close();
    await rm(root, { recursive: true, force: true });
  }
}, 20000);
