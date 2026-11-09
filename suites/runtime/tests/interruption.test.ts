import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { resolve as absolute, join } from "node:path";
import { channel, namespace, startup } from "@odsuite/protocol";
import { compose, emitUnit, resolve } from "@odsuite/release";
import { readBinding, serve } from "@odsuite/sidecar";
import { it } from "vitest";
import { type ActivationCheckpoint, type Receipt, writeProduct } from "@";

const entry = new URL("../dist/index.mjs", import.meta.url).href;
const childBody = `import {Session,readProduct} from ${JSON.stringify(entry)};
const [file,point]=process.argv.slice(1); const options=JSON.parse(await(await import('node:fs/promises')).readFile(file,'utf8'));
let session;
session=await Session.open({...options,onActivation:async checkpoint=>{
 if(checkpoint.stage!==point) return;
 process.send({checkpoint,snapshot:await session.snapshot()});
 await new Promise(()=>{});
}});
const composition=await session.activate();await session.start();await session.documentStart(async()=>{});await session.documentReady();await session.confirm(composition,'baseline');
await session.request('write',{retained:'factory-data'});
await session.applyLeaf(await readProduct(options.candidatePath),{
 reload:async()=>{await session.documentStart(async()=>{});await session.documentReady();return 'candidate';},probe:async()=> 'baseline'
});`;

it.each(["prepared", "daemon-stopped", "ready", "committed"] as const)(
  "retains exact binding and refuses interrupted ownership after SIGKILL at %s",
  async (point) => {
    const root = absolute("../../.artifacts/interruption", `${Date.now()}-${point}`);
    await mkdir(root, { recursive: true });
    const capsule = join(root, "capsule");
    await mkdir(capsule);
    await writeFile(
      join(capsule, "index.mjs"),
      'export function create(){return {handlers:{},ready:async()=>{},initialize:async()=>({loading:"Loading",window:{title:"probe"},witness:"capsule"}),stop:async()=>{}}}',
    );
    const manifest = resolve({}, { channel: channel("stable"), version: "0.1.0" });
    async function unit(kind: "web" | "daemon", version: string) {
      const path = join(root, `${kind}-${version}`);
      await mkdir(path);
      await emitUnit(path, { schema: 1, kind, version, api: "probe/1" });
      await writeFile(
        join(path, kind === "web" ? "index.html" : "main.mjs"),
        kind === "web"
          ? version
          : `import{serveDaemon}from ${JSON.stringify(entry)};await serveDaemon(${JSON.stringify(version)});`,
      );
      return path;
    }
    const initial = await compose(manifest, {
      capsule,
      web: await unit("web", "0.1.0"),
      daemon: await unit("daemon", "0.1.0"),
      carrier: 1,
    });
    const candidate = await compose(manifest, {
      capsule,
      web: await unit("web", "0.2.0"),
      daemon: await unit("daemon", "0.2.0"),
      carrier: 1,
    });
    await writeProduct(join(root, "seed"), initial);
    await writeProduct(join(root, "candidate"), candidate);
    const options = {
      root: join(root, "state"),
      seed: join(root, "seed"),
      candidatePath: join(root, "candidate"),
      manifest,
      namespace: "probe",
      executable: process.execPath,
      carrier: 1,
    };
    await writeFile(join(root, "options.json"), JSON.stringify(options));
    const child = spawn(process.execPath, ["--input-type=module", "-e", childBody, join(root, "options.json"), point], {
      stdio: ["ignore", "pipe", "pipe", "ipc"],
    });
    let stderr = "";
    child.stderr?.on("data", (chunk) => {
      stderr += chunk;
    });
    try {
      const evidence = await new Promise<{ checkpoint: ActivationCheckpoint; snapshot: Receipt }>((done, reject) => {
        const timer = setTimeout(() => reject(new Error(`checkpoint timeout: ${stderr}`)), 10000);
        child.once("message", (value) => {
          clearTimeout(timer);
          done(value as { checkpoint: ActivationCheckpoint; snapshot: Receipt });
        });
        child.once("exit", (code) => {
          clearTimeout(timer);
          reject(new Error(`early exit ${code}: ${stderr}`));
        });
        child.once("error", (error) => {
          clearTimeout(timer);
          reject(error);
        });
      });
      assert.equal(evidence.checkpoint.target, candidate.envelope.digest);
      const exited = new Promise<void>((done) => child.once("exit", () => done()));
      child.kill("SIGKILL");
      await exited;
      const scope = { channel: channel("stable"), namespace: namespace("probe") };
      const observed = await readBinding(options.root, scope);
      assert.equal(observed.directory.manager.phase, "interrupted");
      assert.equal(
        observed.journal.state.current,
        point === "committed" ? candidate.envelope.digest : initial.envelope.digest,
      );
      if (point === "committed") assert.equal(observed.journal.state.attempt, undefined);
      else {
        assert.equal(observed.journal.state.attempt?.nonce, evidence.checkpoint.nonce);
        assert.equal(observed.journal.state.attempt?.status, "running");
        assert.equal(startup(observed.journal.state).mode, "blocked");
      }
      const files = ["manager.sqlite", "factories/stable/probe/binding.json", "factories/stable/probe/registry.json"];
      const before = await Promise.all(files.map((file) => readFile(join(options.root, file))));
      await assert.rejects(
        serve(join(tmpdir(), `interrupted-${process.pid}.sock`), { root: options.root }),
        /interrupted; recovery required/,
      );
      const { Session } = await import("@");
      for (const recover of [false, true])
        await assert.rejects(Session.open({ ...options, recover }), /interrupted; recovery required/);
      assert.deepEqual(await Promise.all(files.map((file) => readFile(join(options.root, file)))), before);
      const pids = observed.directory.instances
        .filter((x) => x.kind === "process" && x.pid)
        .map((x) => x.pid as number);
      const end = Date.now() + 5000;
      const alive = (pid: number) => {
        try {
          process.kill(pid, 0);
          return true;
        } catch {
          return false;
        }
      };
      while (pids.some(alive) && Date.now() < end) await new Promise((done) => setTimeout(done, 20));
      assert.deepEqual(pids.filter(alive), []);
      await writeFile(
        join(root, "receipt.json"),
        JSON.stringify(
          {
            point,
            evidence,
            observed,
            trackedPids: pids,
            survivors: pids.filter(alive),
            result: "passed",
            recovery: "blocked; not recovered",
          },
          null,
          2,
        ),
      );
    } finally {
      if (child.exitCode === null && child.signalCode === null) child.kill("SIGKILL");
    }
  },
  20000,
);
