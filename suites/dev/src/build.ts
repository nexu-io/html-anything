import { randomUUID } from "node:crypto";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { digest } from "@odsuite/protocol";
import type { Context, Factory, Lease } from "@odsuite/sidecar";
import type { BuildState } from "./types.js";
export class Builder {
  readonly state: BuildState = { phase: "idle", restartRequired: false };
  private cancelled = false;
  private flight?: Promise<void>;
  constructor(
    private factory: Factory,
    private context: Context,
    private repo: string,
  ) {}
  run(source: string): Promise<void> {
    if (this.flight) throw new Error("build already in progress");
    if (this.cancelled) throw new Error("development is stopping");
    this.flight = this.perform(source).finally(() => {
      this.flight = undefined;
    });
    return this.flight;
  }
  private async perform(source: string) {
    const id = randomUUID(),
      result = join(this.context.roots.runtime, `${id}.json`),
      log = join(this.context.roots.logs, `${id}.log`);
    Object.assign(this.state, { phase: "building", source, log, error: undefined });
    let lease: Lease | undefined;
    let fault: Error | undefined;
    try {
      lease = await this.factory.start({
        service: "devbuild",
        generation: digest(id),
        command: process.execPath,
        args: [fileURLToPath(new URL("./worker.mjs", import.meta.url))],
        cwd: this.repo,
        ready: "ready",
        grace: 3000,
        timeout: 15000,
        env: {
          ODSUITE_DEV_BUILD_REPO: this.repo,
          ODSUITE_DEV_BUILD_LOG: log,
          ODSUITE_DEV_BUILD_RESULT: result,
          ODSUITE_DEV_BUILD_ID: id,
        },
      });
      const deadline = Date.now() + 180000;
      for (;;) {
        if (this.cancelled) throw new Error("development build cancelled");
        if (Date.now() > deadline) throw new Error("development build exceeded 180 seconds");
        let receipt: { schema: number; id: string; code: number; error?: string } | undefined;
        try {
          receipt = JSON.parse(await readFile(result, "utf8"));
        } catch (error) {
          if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
        }
        if (receipt) {
          if (receipt.schema !== 1 || receipt.id !== id || !Number.isInteger(receipt.code))
            throw new Error("invalid managed build receipt");
          if (receipt.code !== 0)
            throw new Error(`build failed; see ${log}${receipt.error ? `: ${receipt.error}` : ""}`);
          break;
        }
        if (!(await this.factory.inspect()).some((p) => p.pid === lease?.pid && p.state === "running"))
          throw new Error("managed build exited without a result");
        await new Promise((r) => setTimeout(r, 100));
      }
    } catch (error) {
      fault = error instanceof Error ? error : new Error(String(error));
    }
    if (lease) {
      try {
        const stopped = await this.factory.release(lease);
        if (stopped.status !== "stopped" || stopped.survivors.length)
          throw new Error("build process tree did not retire");
      } catch (error) {
        fault = new AggregateError([...(fault ? [fault] : []), error], "managed build and drain failed");
      }
    }
    this.state.phase = fault ? "failed" : "succeeded";
    if (fault) {
      this.state.error = fault.message;
      throw fault;
    }
  }
  async stop() {
    this.cancelled = true;
    await this.flight?.catch(() => {});
  }
}
