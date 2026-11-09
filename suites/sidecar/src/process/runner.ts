import { spawn } from "node:child_process";
import { argument, type Stamp } from "./identity.js";
import { capture, exact, owned, type ProcessInstance, processInstance } from "./observe.js";

declare const ODSUITE_SUPERVISOR_SOURCE: string;
export interface Launch {
  args?: string[];
  command: string;
  cwd?: string;
  env?: Record<string, string | null>;
  grace?: number;
  ready: string;
  timeout?: number;
}
export interface Stop {
  status: "stopped" | "partial";
  survivors: number[];
}
export interface Running {
  active(): Promise<boolean>;
  pid: number;
  instance: ProcessInstance;
  stop(): Promise<Stop>;
}
export class LaunchFault extends Error {
  constructor(
    cause: unknown,
    readonly stopped: Stop,
    readonly running?: Running,
  ) {
    super(cause instanceof Error ? cause.message : String(cause), { cause });
  }
}
export async function launch(spec: Launch, stamp: Stamp): Promise<Running> {
  // Establish supported OS observation before allocating a supervisor.
  await capture();
  const env: NodeJS.ProcessEnv = { ...process.env, ELECTRON_RUN_AS_NODE: "1" };
  delete env.ODSUITE_RUNTIME_SIDECAR_AUTHORITY;
  delete env.ODSUITE_RUNTIME_SIDECAR_ENDPOINT;
  const child = spawn(
    process.execPath,
    ["--input-type=module", "-e", ODSUITE_SUPERVISOR_SOURCE, "--", argument(stamp)],
    {
      env,
      detached: true,
      stdio: ["ignore", "pipe", "pipe", "ipc"],
      windowsHide: true,
    },
  );
  let instance: ProcessInstance | undefined;
  let stopped: Stop | undefined;
  let errors = "";
  let ended = false;
  child.stderr?.on("data", (chunk) => {
    errors = (errors + chunk.toString()).slice(-16384);
  });
  child.stdout?.resume();
  const exit = new Promise<void>((done) =>
    child.once("exit", () => {
      ended = true;
      done();
    }),
  );
  let finishStop: ((value: Stop) => void) | undefined;
  child.on("message", (input: unknown) => {
    const value = input as { type: string; status: Stop["status"]; survivors: number[] };
    if (value?.type === "stopped") {
      stopped = { status: value.status, survivors: value.survivors };
      finishStop?.(stopped);
    }
  });
  const stop = async (): Promise<Stop> => {
    if (stopped?.status === "stopped") {
      await exit;
      return stopped;
    }
    if (ended) {
      if (!instance) return { status: "partial", survivors: [child.pid as number] };
      const now = await capture();
      const survivors = [instance.root, instance.target].filter((w) => now.some((p) => exact(p, w))).map((w) => w.pid);
      return { status: "partial", survivors };
    }
    const result = new Promise<Stop>((done) => {
      finishStop = done;
    });
    if (child.connected) child.send({ type: "stop" });
    let timer: ReturnType<typeof setTimeout> | undefined;
    const value = await Promise.race([
      result,
      new Promise<Stop>((done) => {
        timer = setTimeout(
          () => done({ status: "partial", survivors: [child.pid as number] }),
          (spec.grace ?? 1000) + 1500,
        );
      }),
    ]);
    if (timer) clearTimeout(timer);
    if (value.status === "stopped") await exit;
    return value;
  };
  try {
    instance = await new Promise<ProcessInstance>((done, reject) => {
      const timer = setTimeout(
        () => reject(new Error(`readiness timeout${errors ? `: ${errors}` : ""}`)),
        spec.timeout ?? 5000,
      );
      const settle = (action: () => void) => {
        clearTimeout(timer);
        child.off("message", message);
        action();
      };
      const message = (input: unknown) => {
        const value = input as { type: string; instance: ProcessInstance; error: string };
        if (value?.type === "ready") {
          try {
            const checked = processInstance(value.instance);
            settle(() => done(checked));
          } catch (error) {
            settle(() => reject(error));
          }
        }
        if (value?.type === "error") settle(() => reject(new Error(`${value.error}${errors ? `: ${errors}` : ""}`)));
      };
      child.on("message", message);
      child.once("error", (error) => settle(() => reject(error)));
      child.once("exit", (code) =>
        settle(() => reject(new Error(`supervisor exited before readiness: ${code}: ${errors}`))),
      );
      const targetEnv: NodeJS.ProcessEnv = { ...process.env };
      for (const [key, value] of Object.entries(spec.env ?? {})) {
        if (value === null) delete targetEnv[key];
        else targetEnv[key] = value;
      }
      child.send({ type: "start", spec: { ...spec, env: targetEnv } });
    });
    const now = await capture();
    const tree = owned(now, instance.root, stamp);
    if (instance.root.pid !== child.pid || !tree.some((p) => exact(p, instance!.target)))
      throw new Error("supervisor/target ownership mismatch");
    const captured = instance;
    return {
      pid: captured.target.pid,
      instance: captured,
      active: async () => owned(await capture(), captured.root, stamp).some((p) => exact(p, captured.target)),
      stop,
    };
  } catch (error) {
    const result = await stop();
    throw new LaunchFault(
      error,
      result,
      instance ? { pid: instance.target.pid, instance, active: async () => false, stop } : undefined,
    );
  }
}
