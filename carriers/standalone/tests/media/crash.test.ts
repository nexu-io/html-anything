import { spawn } from "node:child_process";
import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { channel, digest, namespace } from "@odsuite/protocol";
import { connectRoot, inspectRecovery, observeProcesses, readDirectory, recover } from "@odsuite/sidecar";
import { Client } from "@open-motion/daemon/client";
import type { Tools } from "@open-motion/render";
import { initialFiles } from "@open-motion/workspace/contract";
import { expect, it } from "vitest";
import { open } from "@";

it("preserves running export intent after SIGKILL and requires actual sidecar recovery before retry", async () => {
  const evidence = fileURLToPath(new URL(`../../../../.artifacts/export-crash/${randomUUID()}/`, import.meta.url)),
    root = join(evidence, "sidecar"),
    scope = { channel: channel("dev"), namespace: namespace("export-crash") },
    entry = join(evidence, "host.mjs");
  await mkdir(evidence, { recursive: true });
  const resource = {
    type: "directory" as const,
    artifact: { kind: "blob" as const, slot: "fixture", bytes: 0, digest: digest("") },
  };
  await writeFile(
    entry,
    `import {open} from ${JSON.stringify(new URL("../../dist/index.mjs", import.meta.url).href)};
const tool={resource:${JSON.stringify(resource)},executable:"tool",load:async(signal)=>new Promise((resolve,reject)=>signal.addEventListener("abort",()=>reject(signal.reason),{once:true}))};
const runtime=await open({root:${JSON.stringify(root)},scope:${JSON.stringify(scope)},version:"0.6.1-dev.1",tools:{browser:tool,ffmpeg:tool,ffprobe:tool}});
process.stdout.write(JSON.stringify(await runtime.status())+"\\n");
process.once("SIGTERM",()=>{runtime.close().then(()=>{process.exitCode=0}).catch(e=>{process.stderr.write(e.message);process.exitCode=1})});`,
  );
  const child = spawn(process.execPath, [entry], { stdio: ["ignore", "pipe", "pipe"] });
  let runtime: Awaited<ReturnType<typeof open>> | undefined;
  try {
    const status = await new Promise<{ web: string }>((done, reject) => {
      let text = "",
        errors = "";
      const timeout = setTimeout(() => reject(Error(`fixture startup timeout: ${errors.slice(-500)}`)), 10000);
      child.stderr.on("data", (b) => {
        errors += b;
      });
      child.stdout.on("data", (b) => {
        text += b;
        if (text.includes("\n")) {
          clearTimeout(timeout);
          try {
            done(JSON.parse(text.split("\n")[0]!));
          } catch (e) {
            reject(e);
          }
        }
      });
      child.once("exit", (code) => {
        clearTimeout(timeout);
        reject(Error(`fixture exited ${code}: ${errors.slice(-500)}`));
      });
    });
    const bootstrap = await (await fetch(`${status.web}/bootstrap.json`)).json(),
      api = new Client(bootstrap.daemon, bootstrap.token),
      session = await api.execute("session_create", { requestId: randomUUID(), title: "Crash export", mode: "motion" }),
      artifact = await api.execute("artifact_create", {
        requestId: randomUUID(),
        sessionId: session.id,
        title: "Film",
        files: initialFiles(),
      }),
      owner = { sessionId: session.id, artifactId: artifact.id },
      project = await api.execute("project_read", owner),
      job = await api.execute("export_create", {
        ...owner,
        requestId: randomUUID(),
        revision: project.revision,
        fps: { num: 12, den: 1 },
      });
    const control = await connectRoot(root, scope);
    await expect
      .poll(
        async () =>
          (await control.factory.directory()).instances.some(
            (p) => p.service === "render" && p.phase === "ready" && !!p.process,
          ),
        { timeout: 15000 },
      )
      .toBe(true);
    const exited = new Promise<void>((done) => child.once("exit", () => done()));
    child.kill("SIGKILL");
    await exited;
    await expect.poll(async () => (await observeProcesses(root)).length, { timeout: 10000 }).toBe(0);
    const failed = {
        resource,
        executable: "tool",
        load: async (): Promise<Uint8Array> => {
          throw Error("fixture unavailable");
        },
      },
      tools: Tools = { browser: failed, ffmpeg: failed, ffprobe: failed };
    await expect(open({ root, scope, tools, version: "0.6.1-dev.1" })).rejects.toThrow();
    const plan = await inspectRecovery(root);
    expect(plan.phase).toBe("ready");
    await recover(root, { expected: plan.fingerprint });
    runtime = await open({ root, scope, tools, version: "0.6.1-dev.1" });
    const restored = await runtime.execute("export_read", { ...owner, id: job.id });
    expect(restored.state).toBe("interrupted");
    expect(restored.revision).toBe(project.revision);
    await runtime.execute("export_retry", {
      ...owner,
      id: job.id,
      requestId: randomUUID(),
      expectedVersion: restored.version,
    });
    await expect
      .poll(async () => (await runtime!.execute("export_read", { ...owner, id: job.id })).state, { timeout: 15000 })
      .toBe("failed");
    expect((await runtime.execute("project_read", owner)).files).toEqual(project.files);
    await writeFile(
      join(evidence, "result.json"),
      JSON.stringify(
        { job: await runtime.execute("export_read", { ...owner, id: job.id }), recovery: plan.fingerprint },
        null,
        2,
      ),
    );
  } finally {
    if (child.exitCode === null && child.signalCode === null) child.kill("SIGTERM");
    await runtime?.close();
  }
  expect((await readDirectory(root)).manager.phase).toBe("closed");
  expect(await observeProcesses(root)).toEqual([]);
}, 60000);
