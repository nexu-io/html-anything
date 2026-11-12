import { spawn } from "node:child_process";
import { randomUUID } from "node:crypto";
import { mkdir, mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { channel, namespace } from "@odsuite/protocol";
import { inspectRecovery, observeProcesses, recover } from "@odsuite/sidecar";
import { Client as APIClient } from "@open-motion/daemon/client";
import { expect, it } from "vitest";
import { open } from "@";

it("rejects a SIGKILL-interrupted root until explicit fingerprint recovery and retains real data", async () => {
  const root = await mkdtemp(join(tmpdir(), "standalone-crash-"));
  const hostTemporary = join(root, "host-temporary");
  await mkdir(hostTemporary);
  const built = JSON.parse(await readFile(resolve("dist/runtime/runtime.json"), "utf8"));
  const child = spawn(
    process.execPath,
    [resolve("dist/runtime/main.mjs"), "--root", root, "--channel", built.channel, "--namespace", "crash"],
    { stdio: ["ignore", "pipe", "pipe"], env: { ...process.env, TMPDIR: hostTemporary } },
  );
  const scope = { channel: channel(built.channel), namespace: namespace("crash") };
  let runtime: Awaited<ReturnType<typeof open>> | undefined;
  let passed = false;
  try {
    const status = await new Promise<{ web: string }>((done, reject) => {
      let bytes = "";
      const timer = setTimeout(() => reject(new Error("CLI startup timeout")), 7000);
      child.stdout.on("data", (chunk) => {
        bytes += chunk;
        if (bytes.includes("\n")) {
          clearTimeout(timer);
          done(JSON.parse(bytes.split("\n")[0] ?? ""));
        }
      });
      child.once("exit", (code) => {
        clearTimeout(timer);
        reject(new Error(`CLI exited ${code}`));
      });
    });
    const bootstrap = await (await fetch(`${status.web}/bootstrap.json`)).json();
    const api = new APIClient(bootstrap.daemon, bootstrap.token);
    const session = await api.execute("session_create", {
      requestId: randomUUID(),
      title: "survives-crash",
      mode: "motion",
    });
    const exited = new Promise<void>((done) => child.once("exit", () => done()));
    child.kill("SIGKILL");
    await exited;
    const deadline = Date.now() + 5000;
    while ((await observeProcesses(root)).length && Date.now() < deadline)
      await new Promise((done) => setTimeout(done, 25));
    expect(await observeProcesses(root)).toEqual([]);
    await expect(open({ root, scope, version: built.version })).rejects.toThrow();
    const plan = await inspectRecovery(root);
    expect(plan.phase).toBe("ready");
    await expect(recover(root, { expected: "wrong" })).rejects.toThrow();
    await recover(root, { expected: plan.fingerprint });
    runtime = await open({ root, scope, version: built.version });
    expect((await runtime.execute("session_get", { sessionId: session.id })).title).toBe("survives-crash");
    passed = true;
  } finally {
    if (child.exitCode === null && child.signalCode === null) child.kill("SIGTERM");
    await runtime?.close();
    if (passed) await rm(root, { recursive: true, force: true });
    else process.stderr.write(`retained recovery evidence: ${root}\n`);
  }
}, 15000);
