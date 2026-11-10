import { constants } from "node:fs";
import { access, lstat, realpath } from "node:fs/promises";
import { resolve, sep } from "node:path";
import { type Library, resourceKey, type Use } from "@odsuite/blob";
import type { Context } from "@odsuite/sidecar";
import { Fault } from "@open-motion/workspace/contract";
import type { Tools } from "../index.js";
import type { NativePreparation } from "./contract.js";

const names = ["browser", "ffmpeg", "ffprobe"] as const;
/** One finite background controller under the renderer's existing resource authority. */
export class Preparation {
  private status: NativePreparation;
  private running: Promise<void>;
  private stopping = false;
  private pending = false;
  private abort?: AbortController;
  private wake = () => {};
  private completed = (_value: NativePreparation) => {};
  private completion?: Promise<NativePreparation>;
  private uses = new Set<Use>();
  constructor(private options: { context: Context; library: Library; tools: Tools }) {
    this.status = { attempt: 0, state: "idle", components: this.components() };
    this.running = options.context.background(() => this.pump());
    void this.running.catch(() => {});
  }
  private components(): NativePreparation["components"] {
    const component = (name: keyof Tools) => ({
      state: "pending" as const,
      resourceKey: resourceKey(this.options.tools[name].resource),
    });
    return { browser: component("browser"), ffmpeg: component("ffmpeg"), ffprobe: component("ffprobe") };
  }
  read(): NativePreparation {
    return structuredClone(this.status);
  }
  start(): NativePreparation {
    if (this.stopping) throw new Fault("conflict", "native preparation is stopping");
    if (this.status.state === "preparing") return this.read();
    if (this.uses.size) throw new Fault("integrity", "native preparation cleanup requires reconciliation");
    this.status = { attempt: this.status.attempt + 1, state: "preparing", components: this.components() };
    this.completion = new Promise<NativePreparation>((done) => {
      this.completed = done;
    });
    this.pending = true;
    this.wake();
    return this.read();
  }
  /** Composer convenience: call outside a factory/business lane, unlike the immediate operator method. */
  async prepare(): Promise<NativePreparation> {
    this.start();
    if (!this.completion) throw Error("native preparation was not scheduled");
    return this.completion;
  }
  private async release(use: Use) {
    await this.options.context.cleanup(() => this.options.library.session((library) => library.release(use)));
    this.uses.delete(use);
  }
  private async component(name: keyof Tools, signal: AbortSignal) {
    const status = this.status.components[name],
      tool = this.options.tools[name];
    status.state = "preparing";
    let use: Use | undefined;
    try {
      signal.throwIfAborted();
      use = await this.options.library.acquire(tool.resource, (librarySignal) =>
        tool.load(AbortSignal.any([librarySignal, signal])),
      );
      this.uses.add(use);
      signal.throwIfAborted();
      const path = resolve(use.path, tool.executable);
      if (!path.startsWith(use.path + sep) || (await realpath(path)) !== path || !(await lstat(path)).isFile())
        throw Error("native executable escaped its verified resource");
      if (process.platform !== "win32") await access(path, constants.X_OK);
      signal.throwIfAborted();
      status.state = "ready";
    } catch {
      status.state = signal.aborted ? "cancelled" : "failed";
      status.error = signal.aborted ? "Native preparation cancelled" : "Native resource preparation failed";
    } finally {
      if (use) {
        try {
          await this.release(use);
        } catch {
          status.state = "failed";
          status.error = "Native resource cleanup requires reconciliation";
        }
      }
    }
  }
  private async pump() {
    try {
      while (!this.stopping) {
        if (!this.pending) {
          await new Promise<void>((done) => {
            this.wake = done;
          });
          continue;
        }
        this.pending = false;
        const abort = new AbortController();
        this.abort = abort;
        await Promise.allSettled(names.map((name) => this.component(name, abort.signal)));
        this.abort = undefined;
        const ready = names.filter((name) => this.status.components[name].state === "ready").length;
        this.status.state = this.stopping ? "cancelled" : ready === 3 ? "ready" : ready ? "partial" : "failed";
        this.completed(this.read());
      }
    } finally {
      if (this.status.state === "preparing") {
        for (const name of names)
          if (this.status.components[name].state === "pending") this.status.components[name].state = "cancelled";
        this.status.state = "cancelled";
      }
      this.completed(this.read());
    }
  }
  async close() {
    this.stopping = true;
    this.abort?.abort(Error("Native preparation stopped"));
    this.wake();
    await this.running;
    await Promise.all([...this.uses].map((use) => this.release(use)));
  }
}
