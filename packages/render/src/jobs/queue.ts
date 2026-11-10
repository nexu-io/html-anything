import { lstat, readFile } from "node:fs/promises";
import { join } from "node:path";
import type { Library } from "@odsuite/blob";
import { digest } from "@odsuite/protocol";
import type { Context, Factory } from "@odsuite/sidecar";
import { render, type Tools } from "../index.js";
import type { Snapshot } from "../snapshot.js";
import type { Receipt } from "./contract.js";
import { type Record, Store } from "./store.js";

export class Queue {
  private closing = false;
  private closingTask?: Promise<void>;
  private wake = () => {};
  private running?: Promise<void>;
  private active?: { record: Record; abort: AbortController };
  readonly store: Store;
  constructor(
    private options: { factory: Factory; context: Context; library: Library; tools: Tools; worker?: string },
  ) {
    this.store = new Store(options.context.roots.data);
  }
  async initialize() {
    const directory = await this.options.factory.directory();
    for (const record of this.store.scan([
      "preparing",
      "capturing",
      "encoding",
      "verifying",
      "cancelling",
      "recovering",
    ])) {
      if (["queued", "succeeded", "failed", "cancelled", "interrupted"].includes(record.job.state)) continue;
      const identity = directory.instances.filter(
        (i) => i.service === "render" && i.generation === digest(record.job.attempt),
      );
      if (identity.some((i) => i.phase !== "retired")) {
        record.job.state = "recovering";
        record.job.error = "Execution ownership requires explicit reconciliation";
      } else {
        try {
          const receipt = JSON.parse(
            await readFile(join(this.options.context.roots.data, "exports", `${record.job.attempt}.json`), "utf8"),
          ) as Receipt;
          this.complete(record, receipt);
        } catch (e) {
          if ((e as NodeJS.ErrnoException).code !== "ENOENT") throw e;
          record.job.state = record.job.state === "cancelling" ? "cancelled" : "interrupted";
          record.job.error = "Execution interrupted; retry preserves the accepted source revision";
        }
      }
      this.store.write(record);
    }
  }
  start() {
    this.running = this.options.context.background(() => this.pump());
    void this.running.catch(() => {});
  }
  signal() {
    this.wake();
  }
  cancel(id: string) {
    if (this.active?.record.job.id === id) this.active.abort.abort(Error("Export cancelled"));
    this.signal();
  }
  private complete(record: Record, receipt: Receipt) {
    const job = record.job;
    if (
      receipt.id !== job.attempt ||
      receipt.sessionId !== job.sessionId ||
      receipt.artifactId !== job.artifactId ||
      receipt.revision !== job.revision
    )
      throw Error("export receipt does not match accepted intent");
    const { path: _path, ...film } = receipt;
    job.result = film;
    job.state = "succeeded";
    delete job.error;
  }
  private async pump() {
    while (!this.closing) {
      // A still-owned interrupted worker blocks replacement, regardless of elapsed time.
      const all = this.store.scan(["queued", "recovering"]),
        record = all.some((r) => r.job.state === "recovering") ? undefined : all.find((r) => r.job.state === "queued");
      if (!record) {
        await new Promise<void>((done) => {
          this.wake = done;
        });
        continue;
      }
      record.job.state = "preparing";
      this.store.write(record, false);
      const abort = new AbortController();
      this.active = { record, abort };
      try {
        const path = join(this.options.context.roots.data, "inbox", `${record.projection.digest.slice(7)}.json`),
          info = await lstat(path);
        if (
          !info.isFile() ||
          info.isSymbolicLink() ||
          info.size !== record.projection.bytes ||
          info.size > 128 * 1024 ** 2
        )
          throw Error("invalid frozen export input");
        const bytes = await readFile(path);
        if (digest(bytes) !== record.projection.digest) throw Error("frozen export input integrity mismatch");
        const input = JSON.parse(bytes.toString()) as Snapshot;
        if (
          input.project.revision !== record.job.revision ||
          input.project.sessionId !== record.job.sessionId ||
          input.project.artifactId !== record.job.artifactId ||
          input.spec.fps.num !== record.job.fps.num ||
          input.spec.fps.den !== record.job.fps.den
        )
          throw Error("export input differs from accepted intent");
        const receipt = await render({
          ...this.options,
          id: record.job.attempt,
          input,
          signal: abort.signal,
          progress: (phase) => {
            const current = this.store.read(record.job.id);
            if (current.job.state !== "cancelling") {
              current.job.state = phase;
              this.store.write(current, false);
            }
          },
        });
        const current = this.store.read(record.job.id);
        if (current.job.state === "cancelling") current.job.state = "cancelled";
        else this.complete(current, receipt);
        this.store.write(current);
      } catch (e) {
        const current = this.store.read(record.job.id),
          stillOwned = (await this.options.factory.directory()).instances.some(
            (i) => i.service === "render" && i.generation === digest(current.job.attempt) && i.phase !== "retired",
          );
        current.job.state = stillOwned
          ? "recovering"
          : current.job.state === "cancelling"
            ? "cancelled"
            : this.closing
              ? "interrupted"
              : "failed";
        current.diagnostic = Buffer.from(e instanceof Error ? e.message : String(e))
          .subarray(0, 8192)
          .toString("utf8");
        current.job.error = stillOwned
          ? "Execution ownership requires explicit sidecar recovery"
          : current.job.state === "interrupted"
            ? "Execution interrupted; retry preserves the accepted source revision"
            : current.job.state === "cancelled"
              ? "Export cancelled"
              : "Export execution failed; inspect renderer journal diagnostics";
        this.store.write(current);
      } finally {
        this.active = undefined;
      }
    }
  }
  close() {
    this.closingTask ??= (async () => {
      this.closing = true;
      this.active?.abort.abort(Error("Renderer stopped"));
      this.wake();
      await this.running;
      this.store.close();
    })();
    return this.closingTask;
  }
}
