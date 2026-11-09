import { spawn } from "node:child_process";
import { mkdir, readFile, rm } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { setTimeout as delay } from "node:timers/promises";
import type { Observer } from "./observer.js";
import type { CaseReceipt, Trace } from "./types.js";
import { assertAutomation } from "./verdict.js";

export interface LaunchOptions {
  name: string;
  executable: string;
  args?: string[];
  cwd?: string;
  env?: NodeJS.ProcessEnv;
  receipt: string;
  mode: "exit" | "failure" | "kill";
  message?: string;
  timeout?: number;
  observer?: Observer;
}
export interface LaunchResult<T> {
  pid: number;
  exit: { code: number | null; signal: NodeJS.Signals | null };
  observed?: T;
  stop?: { status: string; survivors: number[] };
  stdout: string;
  stderr: string;
  desktop?: CaseReceipt;
}
export function alive(pid: unknown): boolean {
  if (!Number.isSafeInteger(pid) || Number(pid) < 1) throw new Error("invalid observed PID");
  try {
    process.kill(Number(pid), 0);
    return true;
  } catch (fault) {
    if ((fault as NodeJS.ErrnoException).code !== "ESRCH") throw fault;
    return false;
  }
}
export async function waitGone(pid: unknown, timeout = 5000): Promise<void> {
  const deadline = Date.now() + timeout;
  while (alive(pid) && Date.now() < deadline) await delay(20);
  if (alive(pid)) throw new Error("observed process survived exit");
}
async function execute<T extends { pid: number; automation: unknown }>(
  options: LaunchOptions,
  trace?: Trace,
): Promise<LaunchResult<T>> {
  await mkdir(dirname(options.receipt), { recursive: true, mode: 0o700 });
  await rm(options.receipt, { force: true });
  await rm(`${options.receipt}.stop.json`, { force: true });
  const env: NodeJS.ProcessEnv = {
    ...process.env,
    ...options.env,
    ODSUITE_AUTOMATION: "1",
    ODSUITE_RECEIPT: options.receipt,
    ODSUITE_PROBE: options.mode === "kill" ? "0" : "1",
  };
  delete env.ELECTRON_RUN_AS_NODE;
  const child = spawn(options.executable, options.args ?? [], {
    cwd: options.cwd,
    env,
    stdio: ["ignore", "pipe", "pipe"],
  });
  const pid = child.pid;
  let stdout = "",
    stderr = "",
    fault: Error | undefined,
    exited = false;
  child.stdout.on("data", (b: Buffer) => {
    stdout = (stdout + b.toString()).slice(-1024 * 1024);
  });
  child.stderr.on("data", (b: Buffer) => {
    stderr = (stderr + b.toString()).slice(-1024 * 1024);
  });
  child.on("error", (error) => {
    fault = error;
  });
  child.on("exit", (code, signal) => {
    exited = true;
    if (pid) trace?.mark("exit", pid, { code, ...(signal ? { signal } : {}) });
  });
  const closed = new Promise<{ code: number | null; signal: NodeJS.Signals | null }>((done) => {
    child.once("close", (code, signal) => done({ code, signal }));
  });
  if (!pid) {
    await closed;
    throw fault ?? new Error("Electron host PID unavailable");
  }
  trace?.track(pid);
  let observed: T | undefined;
  const deadline = Date.now() + (options.timeout ?? 30000);
  try {
    if (options.mode === "kill") {
      while (!exited && !fault && Date.now() < deadline) {
        try {
          observed = JSON.parse(await readFile(options.receipt, "utf8")) as T;
          break;
        } catch (error) {
          if (!(error instanceof SyntaxError) && (error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
        }
        await delay(10);
      }
      if (!observed || observed.pid !== pid) throw new Error(`host never reached matching readiness: ${stderr}`);
      assertAutomation(observed.automation);
      trace?.mark("ready-observed", pid);
      trace?.mark("stop-request", pid, { signal: "SIGKILL" });
      child.kill("SIGKILL");
    }
    while (!exited && !fault && Date.now() < deadline) await delay(10);
    if (fault) throw fault;
    if (!exited) throw new Error(`Electron host timed out: ${stderr}`);
    const exit = await closed;
    if (options.mode === "kill" ? exit.signal !== "SIGKILL" : exit.code !== (options.mode === "failure" ? 1 : 0))
      throw new Error(`unexpected Electron exit ${exit.code}/${exit.signal}: ${stderr}`);
    if (options.message && !stderr.includes(options.message)) throw new Error(`expected failure missing: ${stderr}`);
    let stop: LaunchResult<T>["stop"];
    if (options.mode === "exit") {
      observed = JSON.parse(await readFile(options.receipt, "utf8")) as T;
      if (observed.pid !== pid) throw new Error("readiness receipt belongs to a different host");
      assertAutomation(observed.automation);
      trace?.mark("ready-observed", pid);
      stop = JSON.parse(await readFile(`${options.receipt}.stop.json`, "utf8"));
      if (stop?.status !== "stopped" || !Array.isArray(stop.survivors) || stop.survivors.length)
        throw new Error("host did not stop its managed processes");
    }
    return { pid, exit, observed, stop, stdout, stderr };
  } finally {
    if (!exited) {
      trace?.mark("stop-request", pid, { signal: "SIGKILL" });
      child.kill("SIGKILL");
    }
    await closed;
  }
}
/** Validation launcher only; product process/resource authority remains in sidecar. */
export async function runElectron<T extends { pid: number; automation: unknown }>(
  options: LaunchOptions,
): Promise<LaunchResult<T>> {
  options = { ...options, receipt: resolve(options.cwd ?? process.cwd(), options.receipt) };
  if (!["exit", "failure", "kill"].includes(options.mode)) throw new Error("invalid automation launch mode");
  if (!options.observer) return execute<T>(options);
  const result = await options.observer.capture(options.name, (trace) => execute<T>(options, trace));
  return { ...result.value, desktop: result.receipt };
}
