import { type ChildProcess, spawn } from "node:child_process";
import { readStamp, sameStamp } from "./identity.js";
import { capture, exact, owned, type ProcessInstance, signalOwned, type Witness } from "./observe.js";
import type { Launch } from "./runner.js";

const incomingIdentity = readStamp(process.argv.slice(1).join(" "));
if (!incomingIdentity || !process.send) throw new Error("supervisor requires stamp and private controller");
const identity = incomingIdentity;
const self = (await capture()).find((p) => p.pid === process.pid);
if (!self?.stamp || !sameStamp(self.stamp, identity)) throw new Error("supervisor OS identity mismatch");
const report = (value: unknown) => {
  if (process.connected) process.send?.(value);
};
let child: ChildProcess | undefined;
let target: Witness | undefined;
let stopping: Promise<void> | undefined;
let grace = 1000;
let tracked: Witness[] = [];
let monitor: ReturnType<typeof setInterval> | undefined;
const observe = async () => {
  const all = await capture();
  tracked = tracked.filter((w) => all.some((p) => exact(p, w)));
  const current = owned(all, self, identity);
  for (const p of current)
    if (p.pid !== self.pid && !tracked.some((w) => exact(p, w))) tracked.push({ pid: p.pid, birth: p.birth });
  return all;
};
async function stop() {
  if (monitor) clearInterval(monitor);
  await observe();
  child?.stdin?.end();
  await signalOwned(tracked, "SIGTERM", identity);
  const deadline = Date.now() + grace;
  let all = await capture();
  while (tracked.some((w) => all.some((p) => exact(p, w))) && Date.now() < deadline) {
    await new Promise((done) => setTimeout(done, 25));
    all = await observe();
  }
  // Refresh only while this exact stamped supervisor owns the tree.
  await observe();
  await signalOwned(tracked, "SIGKILL", identity);
  const tail = Date.now() + 1000;
  do {
    await new Promise((done) => setTimeout(done, 25));
    all = await capture();
  } while (tracked.some((w) => all.some((p) => exact(p, w))) && Date.now() < tail);
  const survivors = tracked.filter((w) => all.some((p) => exact(p, w))).map((w) => w.pid);
  report({ type: "stopped", status: survivors.length ? "partial" : "stopped", survivors });
  if (!survivors.length) process.exit(0);
}
const stoppingOnce = () => {
  stopping ??= stop()
    .catch((error) => {
      report({ type: "error", error: String(error) });
      process.exitCode = 1;
    })
    .finally(() => {
      stopping = undefined;
    });
  return stopping;
};
process.on("disconnect", () => void stoppingOnce());
process.on("SIGTERM", () => void stoppingOnce());
process.on("SIGINT", () => void stoppingOnce());
process.on("message", async (input: unknown) => {
  const message = input as { type: string; spec: Launch };
  try {
    if (message?.type === "stop") {
      await stoppingOnce();
      return;
    }
    if (message?.type !== "start" || child || stopping) throw new Error("invalid supervisor operation");
    const spec = message.spec;
    grace = spec.grace ?? 1000;
    const env: NodeJS.ProcessEnv = {};
    for (const [key, value] of Object.entries(spec.env ?? {})) if (value !== null) env[key] = value;
    delete env.ODSUITE_RUNTIME_SIDECAR_AUTHORITY;
    delete env.ODSUITE_RUNTIME_SIDECAR_ENDPOINT;
    child = spawn(spec.command, spec.args ?? [], { cwd: spec.cwd, env, stdio: ["pipe", "pipe", "pipe"] });
    child.stderr?.pipe(process.stderr);
    child.once("error", (error) => {
      report({ type: "error", error: String(error) });
      void stoppingOnce();
    });
    let output = "",
      announced = false;
    child.stdout?.on("data", async (chunk) => {
      process.stdout.write(chunk);
      output = (output + chunk.toString()).slice(-65536);
      if (announced || !output.includes(spec.ready)) return;
      announced = true;
      try {
        const all = await observe();
        const p = all.find((p) => p.pid === child?.pid && p.ppid === self.pid);
        if (!p) throw new Error("target ownership witness missing");
        target = { pid: p.pid, birth: p.birth };
        const instance: ProcessInstance = { root: { pid: self.pid, birth: self.birth }, target, stamp: identity };
        report({ type: "ready", instance });
      } catch (error) {
        report({ type: "error", error: String(error) });
        void stoppingOnce();
      }
    });
    monitor = setInterval(
      () =>
        void observe().catch((error) => {
          report({ type: "error", error: String(error) });
          void stoppingOnce();
        }),
      100,
    );
    child.once("exit", () => {
      if (!stopping) {
        report({ type: "error", error: "target exited" });
        void stoppingOnce();
      }
    });
    await observe();
  } catch (error) {
    report({ type: "error", error: String(error) });
    void stoppingOnce();
  }
});
