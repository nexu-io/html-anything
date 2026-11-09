import assert from "node:assert/strict";
import { mkdir, mkdtemp, readFile, rm, stat, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { channel, namespace } from "@odsuite/protocol";
import { compose, resolve } from "@odsuite/release";
import { type Context, connectRoot } from "@odsuite/sidecar";
import { it } from "vitest";
import { Session, writeProduct } from "@";

async function fixture(legacy = false) {
  const root = await mkdtemp(join(tmpdir(), "capsule-body-"));
  for (const name of ["capsule", "daemon", "web"]) await mkdir(join(root, name));
  const code = `import{readFile,writeFile}from'node:fs/promises';import{join}from'node:path';
    export const control={hold:false,waiting:false,release:()=>{},failInit:false,failStop:false,invalid:false,creates:0,events:[],resources:undefined,entered:false,drain:()=>{}};
    export function create(){control.creates++;let resources;return{handlers:{status:()=>({ready:true}),wait:async()=>{control.entered=true;return new Promise(r=>control.drain=()=>r('drained'));}},
      async ready(){},
      async initialize(c){resources=c.resources;control.resources=resources;control.events.push('initialize');
        await resources.allocate({kind:'lock',name:'probe'});
        await writeFile(join(resources.roots.runtime,'active'),'capsule-owned');
        let count=0;try{count=Number(await readFile(join(resources.roots.data,'count'),'utf8'));}catch(e){if(e.code!=='ENOENT')throw e;}
        await writeFile(join(resources.roots.data,'count'),String(count+1));
        if(control.hold)await new Promise(r=>{control.release=r;control.waiting=true;});
        if(control.failInit)throw Error('injected capsule initialize failure');
        return control.invalid?{}:{loading:"Loading",window:{title:'product'},witness:c.generation};
      },
      async stop(){control.events.push('stop');if(control.failStop)throw Error('injected capsule stop failure');
        await writeFile(join(resources.roots.data,'stopped'),'drained');}
    }};`;
  await writeFile(
    join(root, "capsule/index.mjs"),
    legacy ? "export async function activate(){return {title:'old'}}" : code,
  );
  const sdk = pathToFileURL(join(process.cwd(), "dist/index.mjs")).href;
  await writeFile(
    join(root, "daemon/main.mjs"),
    `import{serveDaemon}from ${JSON.stringify(sdk)};await serveDaemon('probe');`,
  );
  await writeFile(join(root, "web/index.html"), "probe");
  const manifest = resolve({}, { channel: channel("stable"), version: "1.0.0" });
  const release = await compose(manifest, {
    carrier: 1,
    capsule: join(root, "capsule"),
    daemon: join(root, "daemon"),
    web: join(root, "web"),
  });
  await writeProduct(join(root, "seed"), release);
  const options = {
    carrier: 1,
    executable: process.execPath,
    manifest,
    namespace: "probe",
    root: join(root, "state"),
    seed: join(root, "seed"),
  };
  let session = await Session.open(options);
  const control = legacy
    ? undefined
    : ((await import(pathToFileURL(join(session.mount.capsule, "index.mjs")).href)).control as {
        hold: boolean;
        waiting: boolean;
        release: () => void;
        failInit: boolean;
        failStop: boolean;
        invalid: boolean;
        creates: number;
        events: string[];
        resources: Context;
        entered: boolean;
        drain: () => void;
      });
  const { factory } = await connectRoot(options.root, { channel: manifest.channel, namespace: namespace("probe") });
  return {
    root,
    options,
    release,
    session,
    control: control!,
    factory,
    replace: (value: Session) => {
      session = value;
    },
    close: async () => {
      if (control) {
        control.drain();
        control.failStop = false;
        control.release();
      }
      await session.close();
      await rm(root, { recursive: true, force: true });
    },
  };
}

it("gates readiness, preserves authority on failed drain, and creates a fresh cold instance", async () => {
  const f = await fixture();
  try {
    await assert.rejects(f.session.start(), /not initialized/);
    f.control.hold = true;
    const activation = f.session.activate();
    await assert.rejects(f.session.activate(), /already initialized/);
    while (!f.control.waiting) await new Promise((r) => setTimeout(r, 10));
    assert.ok((await f.factory.directory()).instances.every((x) => x.service !== "capsule"));
    await assert.rejects(f.session.call("status", null), /not ready/);
    f.control.release();
    const composition = await activation;
    const peer = f.session;
    await f.session.start();
    const before = await f.session.confirm(composition, "renderer");
    assert.equal(before.product?.artifact, f.release.envelope.generation.capsule.digest);
    assert.equal(f.control.resources.identity.service, "electron");
    const temporary = f.control.resources.roots.runtime,
      data = f.control.resources.roots.data;
    f.control.failStop = true;
    await assert.rejects(f.session.close(), /stop failure/);
    assert.equal((await f.session.snapshot()).phase, "failed");
    assert.equal((await f.factory.directory()).instances.find((x) => x.service === "electron")?.phase, "ready");
    assert.equal((await stat(join(temporary, "active"))).isFile(), true);
    assert.equal((await f.session.request("health")).pid, before.daemon.pid);

    f.control.failStop = false;
    await f.session.close();
    await assert.rejects(stat(temporary), /ENOENT/);
    assert.equal(await readFile(join(data, "stopped"), "utf8"), "drained");
    f.control.hold = false;
    const cold = await Session.open(f.options);
    f.replace(cold);
    const next = await cold.activate();
    await cold.start();
    const receipt = await cold.confirm(next, "renderer2");
    assert.equal(f.control.creates, 2);
    assert.equal(receipt.product?.artifact, before.product?.artifact);
    assert.ok(receipt.directory.instances.every((x) => x.service !== "capsule"));
    assert.equal(await readFile(join(data, "count"), "utf8"), "2");
    await assert.rejects(peer.call("status", null), /closed/);
  } finally {
    await f.close();
  }
}, 15000);

it.each([false, true])(
  "cleans failed initialization and retains a failed cleanup until explicit retry (%s)",
  async (failedStop) => {
    const f = await fixture();
    try {
      f.control.failInit = true;
      f.control.failStop = failedStop;
      await assert.rejects(
        f.session.activate(),
        failedStop ? /adapter initialization and cleanup failed/ : /initialize failure/,
      );
      const instance = (await f.factory.directory()).instances.find((x) => x.service === "electron");
      assert.equal(instance?.phase, "ready");
      await assert.rejects(f.session.start(), /not ready/);
      if (failedStop) assert.equal((await stat(f.control.resources.roots.runtime)).isDirectory(), true);
      f.control.failStop = false;
      await f.session.close();
      await assert.rejects(stat(f.control.resources.roots.runtime), /ENOENT/);
    } finally {
      await f.close();
    }
  },
  15000,
);

it("rejects an invalid composition and drains its initialized body", async () => {
  const f = await fixture();
  try {
    f.control.invalid = true;
    await assert.rejects(f.session.activate(), /invalid capsule composition/);
    assert.deepEqual(f.control.events, ["initialize", "stop"]);
    assert.ok((await f.factory.directory()).instances.every((x) => x.service !== "capsule"));
  } finally {
    await f.close();
  }
});

it("rejects the removed activate-only module protocol", async () => {
  const f = await fixture(true);
  try {
    await assert.rejects(f.session.activate(), /create entry required/);
  } finally {
    await f.close();
  }
});

it("drains accepted Capsule methods before invoking product stop", async () => {
  const f = await fixture();
  try {
    const composition = await f.session.activate();
    await f.session.start();
    await f.session.confirm(composition, "renderer");
    const peer = f.session;
    const call = peer.call("wait", null);
    while (!f.control.entered) await new Promise((r) => setTimeout(r, 10));
    const close = f.session.close();
    await new Promise((r) => setTimeout(r, 25));
    assert.deepEqual(f.control.events, ["initialize"]);
    f.control.drain();
    assert.equal(await call, "drained");
    await close;
    assert.deepEqual(f.control.events, ["initialize", "stop"]);
  } finally {
    f.control.drain();
    await f.close();
  }
}, 15000);

it("waits for adapter initialization before host cleanup when quit arrives during loading", async () => {
  const f = await fixture();
  try {
    f.control.hold = true;
    const activation = f.session.activate();
    while (!f.control.waiting) await new Promise((done) => setTimeout(done, 10));
    const closing = f.session.close();
    await new Promise((done) => setTimeout(done, 25));
    assert.deepEqual(f.control.events, ["initialize"]);
    f.control.release();
    await activation;
    await closing;
    assert.deepEqual(f.control.events, ["initialize", "stop"]);
    await assert.rejects(stat(f.control.resources.roots.runtime), /ENOENT/);
  } finally {
    await f.close();
  }
}, 15000);

it("drains old Web reads across epochs and preserves occupancy after renderer stop failure", async () => {
  const f = await fixture();
  let release = () => {},
    failedStop = false,
    stops = 0;
  const stop = async () => {
    stops++;
    if (failedStop) throw Error("renderer stop failed");
  };
  try {
    await f.session.activate();
    await f.session.start();
    await f.session.documentStart(stop);
    await f.session.documentReady();
    const old = f.session.documentNonce();
    let entered = () => {};
    const started = new Promise<void>((done) => {
        entered = done;
      }),
      gate = new Promise<void>((done) => {
        release = done;
      });
    const reading = f.session.webAsset(async (root) => {
      entered();
      await gate;
      return readFile(join(root, "index.html"), "utf8");
    });
    await started;
    await f.session.documentStart(stop);
    const next = f.session.documentNonce();
    assert.notEqual(old, next);
    let ready = false;
    const drain = f.session.documentReady().then(() => {
      ready = true;
    });
    await new Promise((done) => setImmediate(done));
    assert.equal(ready, false);
    const before = await f.session.blobStatus(),
      web = Object.values(before.entries).find((e) => e.resource.artifact.kind === "web")!;
    assert.deepEqual(web.uses.map((u) => u.owner.epoch).sort(), [`web:${old}`, `web:${next}`].sort());
    assert.ok(web.uses.every((u) => u.owner.service === "electron"));
    release();
    assert.equal(await reading, "probe");
    await drain;
    const live = Object.values((await f.session.blobStatus()).entries).find((e) => e.resource.artifact.kind === "web")!;
    assert.equal(live.uses.length, 1);
    failedStop = true;
    await assert.rejects(f.session.close(), /renderer stop failed/);
    assert.equal(f.session.acceptDocument(next), false);
    const retained = Object.values((await f.session.blobStatus()).entries).find(
      (e) => e.resource.artifact.kind === "web",
    )!;
    assert.equal(retained.uses.length, 1);
    failedStop = false;
    await f.session.close();
    assert.equal(stops, 2);
  } finally {
    failedStop = false;
    release();
    await f.close();
  }
}, 20000);
