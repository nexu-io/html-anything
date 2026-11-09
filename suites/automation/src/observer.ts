import { type ChildProcessWithoutNullStreams, execFile, spawn } from "node:child_process";
import { mkdir, mkdtemp, writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import { setTimeout as delay } from "node:timers/promises";
import { promisify } from "node:util";
import { swift } from "./native.js";
import type { CaseReceipt, Mark, NativeEvent, Options, Snapshot, Trace } from "./types.js";
import { fullscreen, nativeEvent, snapshot, verdict } from "./verdict.js";

const execute = promisify(execFile);
export class ObservationUnavailable extends Error {}
export class ObservationError extends Error {
  constructor(
    readonly receipt: CaseReceipt,
    readonly path: string,
  ) {
    super(`desktop ${receipt.result}: ${receipt.reasons.join("; ")} (${path})`);
  }
}
export class Observer {
  get pid(): number | undefined {
    return this.child.pid;
  }
  private events: NativeEvent[] = [];
  private latest?: NativeEvent;
  private fault?: string;
  private closing = false;
  private closed = false;
  private active = false;
  private names = new Set<string>();
  private constructor(
    private child: ChildProcessWithoutNullStreams,
    readonly directory: string,
    private options: Options,
  ) {
    let buffer = "";
    child.stdout.on("data", (bytes: Buffer) => {
      buffer += bytes.toString();
      if (buffer.length > 1024 * 1024) {
        this.fault = "native observer buffer overflow";
        return;
      }
      let boundary = buffer.indexOf("\n");
      while (boundary >= 0) {
        const line = buffer.slice(0, boundary);
        buffer = buffer.slice(boundary + 1);
        boundary = buffer.indexOf("\n");
        try {
          const raw = JSON.parse(line);
          if (raw.event === "error") throw new Error(String(raw.reason));
          const event = nativeEvent(raw);
          if (event.sequence !== (this.events.at(-1)?.sequence ?? 0) + 1) throw new Error("native event gap");
          this.events.push(event);
          if (this.events.length > 100000) throw new Error("native observer capacity exceeded");
          if (event.event === "sample") this.latest = event;
        } catch (fault) {
          this.fault = String(fault);
        }
      }
    });
    child.stderr.on("data", (bytes: Buffer) => {
      this.fault = `native observer stderr: ${bytes.toString().slice(0, 500)}`;
    });
    child.on("error", (fault) => {
      this.fault = fault.message;
    });
    child.on("exit", () => {
      this.closed = true;
      if (!this.closing) this.fault = "native observer exited unexpectedly";
    });
  }
  static async open(options: Options): Promise<Observer> {
    if (process.platform !== "darwin") throw new ObservationUnavailable("native desktop observation requires macOS");
    if (!/^[a-z0-9]+(?:[.-][a-z0-9]+)*$/i.test(options.bundle)) throw new Error("invalid target bundle identity");
    if (
      options.settleMs !== undefined &&
      (!Number.isSafeInteger(options.settleMs) || options.settleMs < 1000 || options.settleMs > 5000)
    )
      throw new Error("desktop observation tail must be 1000–5000 ms");
    await mkdir(options.directory, { recursive: true, mode: 0o700 });
    const directory = await mkdtemp(join(resolve(options.directory), "observer-"));
    const source = join(directory, "observer.swift"),
      binary = join(directory, "observer");
    await writeFile(source, swift, { mode: 0o600 });
    try {
      await execute("xcrun", ["swiftc", source, "-o", binary], { timeout: 60000 });
    } catch (fault) {
      throw new ObservationUnavailable(`native observer toolchain unavailable: ${String(fault)}`);
    }
    const observer = new Observer(spawn(binary, [options.bundle], { stdio: "pipe" }), directory, options);
    try {
      await observer.fresh();
      return observer;
    } catch (fault) {
      await observer.close();
      throw new ObservationUnavailable(String(fault));
    }
  }
  private async fresh(): Promise<NativeEvent> {
    const sequence = this.latest?.sequence ?? 0,
      deadline = Date.now() + 3000;
    while (Date.now() < deadline) {
      if (this.fault || this.closed) throw new Error(this.fault ?? "native observer closed");
      if (this.latest && this.latest.sequence > sequence) return this.latest;
      await delay(10);
    }
    throw new Error("native observer heartbeat timeout");
  }
  async capture<T>(name: string, operation: (trace: Trace) => Promise<T>): Promise<{ value: T; receipt: CaseReceipt }> {
    if (this.active || this.closing || this.closed) throw new Error("desktop observer unavailable or capture overlaps");
    if (!/^[a-z][a-z0-9-]{0,60}$/.test(name) || this.names.has(name))
      throw new Error("invalid or duplicate desktop case name");
    this.names.add(name);
    this.active = true;
    let value!: T, failure: unknown;
    const marks: Mark[] = [];
    const started = Date.now(),
      index = this.events.length;
    let baseline: Snapshot = { activeDisplay: "", spaces: [] };
    try {
      baseline = snapshot((await this.fresh()).snapshot);
      if (this.options.requireFullscreen && !fullscreen(baseline))
        failure = new Error("initial Space is not native fullscreen");
      if (!failure) {
        let tracing = true;
        const available = () => {
          if (!tracing) throw new Error("desktop trace is expired");
        };
        const trace: Trace = {
          track: (pid) => {
            available();
            if (
              typeof pid !== "number" ||
              !Number.isSafeInteger(pid) ||
              Number(pid) < 1 ||
              marks.some((m) => m.event === "spawn" && m.pid === pid)
            )
              throw new Error("invalid or duplicate tracked PID");
            marks.push({ event: "spawn", pid, time: Date.now() });
          },
          mark: (event, pid, data = {}) => {
            available();
            if (
              !["ready-observed", "stop-request", "exit"].includes(event) ||
              !marks.some((m) => m.event === "spawn" && m.pid === pid)
            )
              throw new Error("mark requires a tracked host PID");
            marks.push({ event, pid, time: Date.now(), ...data });
          },
        };
        try {
          value = await operation(trace);
        } catch (fault) {
          failure = fault;
        } finally {
          tracing = false;
        }
        await delay(this.options.settleMs ?? 1500);
        await this.fresh();
      }
    } catch (fault) {
      this.fault ??= String(fault);
      failure ??= fault;
    } finally {
      this.active = false;
    }
    let receipt = verdict(
      {
        schema: 1,
        name,
        result: "unqualified",
        reasons: [],
        requireFullscreen: !!this.options.requireFullscreen,
        baseline,
        marks,
        events: this.events.slice(index),
        started,
        ended: Date.now(),
        settleMs: this.options.settleMs ?? 1500,
      },
      this.fault,
    );
    if (failure && receipt.result === "passed") receipt = { ...receipt, result: "failed", reasons: [String(failure)] };
    const path = join(this.directory, `${name}.json`);
    await writeFile(path, `${JSON.stringify(receipt, null, 2)}\n`, { mode: 0o600 });
    if (receipt.result !== "passed") throw new ObservationError(receipt, path);
    if (failure) throw failure;
    return { value, receipt };
  }
  async close(): Promise<void> {
    if (this.active) throw new Error("cannot close desktop observer during capture");
    if (!this.closed) {
      this.closing = true;
      this.child.kill("SIGTERM");
      const deadline = Date.now() + 3000;
      while (!this.closed && Date.now() < deadline) await delay(10);
      if (!this.closed) {
        this.child.kill("SIGKILL");
        throw new Error("native observer failed to stop");
      }
    }
    await writeFile(join(this.directory, "native.jsonl"), `${this.events.map((e) => JSON.stringify(e)).join("\n")}\n`, {
      mode: 0o600,
    });
  }
}
