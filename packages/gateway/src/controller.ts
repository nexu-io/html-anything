import { readFile } from "node:fs/promises";
import type { Library } from "@odsuite/blob";
import type { Digest } from "@odsuite/protocol";
import type { Context } from "@odsuite/sidecar";
import { identifyResource } from "@open-motion/workspace";
import { Fault } from "@open-motion/workspace/contract";
import { persistCandidate } from "./candidates.js";
import type { Job } from "./contract.js";
import { providerDescriptor } from "./contract.js";
import type { Provider } from "./provider.js";
import { Store } from "./store.js";

class InvalidPNG extends Error {}

/** One serial injected provider controller. Never holds a factory lane during provider I/O. */
export class Controller {
  readonly store: Store;
  private stopping = false;
  private running?: Promise<void>;
  private active?: { id: string; abort: AbortController };
  private wake = () => {};
  private closed?: Promise<void>;
  private deferred = new Set<string>();
  private activate = () => {};
  private ready = new Promise<void>((resolve) => {
    this.activate = resolve;
  });
  constructor(private options: { context: Context; library: Library; provider?: Provider }) {
    if (options.provider) {
      const parsed = providerDescriptor.safeParse({
        id: options.provider.id,
        version: options.provider.version,
        models: options.provider.models,
      });
      if (!parsed.success || new Set(parsed.data.models.map((value) => value.id)).size !== parsed.data.models.length)
        throw new Fault("invalid", "invalid provider descriptor");
    }
    this.store = new Store(options.context.roots.data);
    for (const value of this.store.scan()) {
      if (value.state === "submitting" || (value.state === "cancelling" && value.submission === "unknown")) {
        value.state = "interrupted";
        value.error = "Submission outcome unknown; automatic resubmission is forbidden";
        this.store.write(value);
      } else if (value.state === "interrupted" && value.submission === "accepted" && this.matches(value)) {
        value.state = "running";
        delete value.error;
        this.store.write(value);
      }
    }
  }
  matches(value: Pick<Job, "providerId" | "providerVersion" | "modelId">) {
    const provider = this.options.provider;
    return (
      !!provider &&
      provider.id === value.providerId &&
      provider.version === value.providerVersion &&
      provider.models.some((model) => model.id === value.modelId)
    );
  }
  available(value: Pick<Job, "providerId" | "providerVersion" | "modelId">) {
    if (this.stopping) throw new Fault("conflict", "generation owner is stopping");
    if (!this.matches(value)) throw new Fault("invalid", "selected provider/model is not configured");
  }
  start() {
    this.running = this.options.context.background(async () => {
      await this.ready;
      await this.pump();
    });
    void this.running.catch(() => {});
  }
  readyOwner() {
    this.activate();
  }
  signal() {
    this.wake();
  }
  cancel(id: string) {
    this.deferred.delete(id);
    if (this.active?.id === id) this.active.abort.abort();
    this.signal();
  }
  private async wait(signal?: AbortSignal) {
    if (signal?.aborted || this.stopping) return;
    await new Promise<void>((resolve) => {
      const complete = () => {
        clearTimeout(timer);
        signal?.removeEventListener("abort", complete);
        this.wake = () => {};
        resolve();
      };
      const timer = setTimeout(complete, 1000);
      this.wake = complete;
      signal?.addEventListener("abort", complete, { once: true });
    });
  }
  private async pump() {
    while (!this.stopping) {
      const value = this.store
        .scan()
        .find(
          (value) =>
            ["queued", "running", "cancelling"].includes(value.state) &&
            this.matches(value) &&
            !this.deferred.has(value.id),
        );
      if (!value) {
        await this.wait();
        continue;
      }
      const abort = new AbortController();
      this.active = { id: value.id, abort };
      try {
        await this.execute(value, abort.signal);
      } catch (error) {
        const latest = this.store.read(value.id);
        if (latest.state === "cancelling" && latest.submission === "accepted" && !this.stopping) {
          const cancellation = new AbortController();
          this.active = { id: latest.id, abort: cancellation };
          try {
            await this.confirmCancel(latest, cancellation.signal);
          } catch {
            latest.state = "cancelling";
            latest.error = "Cancellation outcome unconfirmed";
            this.deferred.add(latest.id);
            this.store.write(latest);
          }
        } else if (!["succeeded", "cancelled", "failed"].includes(latest.state)) {
          latest.state =
            latest.state === "cancelling" && latest.submission === "accepted"
              ? "cancelling"
              : error instanceof InvalidPNG && latest.submission === "accepted"
                ? "failed"
                : "interrupted";
          latest.error =
            latest.submission === "unknown"
              ? "Submission outcome unknown; automatic resubmission is forbidden"
              : latest.state === "failed"
                ? "Provider result failed PNG verification"
                : "Execution interrupted; accepted remote identity is preserved";
          this.store.write(latest);
        }
      } finally {
        this.active = undefined;
      }
    }
  }
  private async confirmCancel(value: Job, signal: AbortSignal) {
    signal.throwIfAborted();
    if (!value.remoteId) {
      value.state = "interrupted";
      value.error = "Submission unknown; cancellation cannot be confirmed";
      this.store.write(value);
      return;
    }
    const provider = this.options.provider;
    if (!provider) throw new Fault("invalid", "provider is not configured");
    const result = await provider.cancel(value.remoteId, signal);
    value = this.store.read(value.id);
    if (result.confirmed === true) {
      value.state = "cancelled";
      delete value.error;
    } else {
      value.state = "cancelling";
      value.error = "Cancellation outcome unconfirmed";
      this.deferred.add(value.id);
    }
    this.store.write(value);
  }
  private async execute(value: Job, signal: AbortSignal) {
    const provider = this.options.provider;
    if (!provider) throw new Fault("invalid", "provider is not configured");
    if (value.state === "cancelling") {
      await this.confirmCancel(value, signal);
      return;
    }
    if (value.state === "queued") {
      value.state = "submitting";
      value.submission = "unknown";
      this.store.write(value);
      const intent = {
        sessionId: value.sessionId,
        artifactId: value.artifactId,
        revision: value.revision,
        providerId: value.providerId,
        providerVersion: value.providerVersion,
        modelId: value.modelId,
        prompt: value.prompt,
        requestId: value.requestId,
      };
      const result = await provider.submit(intent, signal);
      if (typeof result.remoteId !== "string" || !result.remoteId.length || result.remoteId.length > 256)
        throw Error("invalid remote identity");
      value = this.store.read(value.id);
      value.remoteId = result.remoteId;
      value.submission = "accepted";
      if (value.state !== "cancelling") value.state = "running";
      this.store.write(value);
    }
    while (!this.stopping) {
      value = this.store.read(value.id);
      if (value.state === "cancelling") {
        await this.confirmCancel(value, signal);
        return;
      }
      signal.throwIfAborted();
      if (!value.remoteId) throw new Fault("integrity", "accepted generation has no remote identity");
      const result = await provider.read(value.remoteId, signal);
      if (result.state === "pending") {
        await this.wait(signal);
        continue;
      }
      if (result.state === "failed") {
        value = this.store.read(value.id);
        value.state = "failed";
        value.error = "Provider reported generation failure";
        this.store.write(value);
        return;
      }
      if (result.state !== "succeeded" || !(result.bytes instanceof Uint8Array))
        throw Error("invalid provider response");
      await this.complete(value, result.bytes);
      value = this.store.read(value.id);
      if (value.state === "cancelling") await this.confirmCancel(value, signal);
      return;
    }
    throw Error("generation owner stopped");
  }
  private async complete(value: Job, data: Uint8Array) {
    const bytes = Buffer.from(data);
    let facts: ReturnType<typeof identifyResource>;
    try {
      facts = identifyResource("assets/candidate.png", "Candidate", bytes);
    } catch {
      throw new InvalidPNG("Provider result failed PNG verification");
    }
    if (facts.type !== "image/png") throw new Fault("invalid", "only PNG generation is supported");
    const use = await this.options.library.acquire(
      {
        type: "file",
        artifact: { kind: "blob", slot: "candidate", digest: facts.digest as Digest, bytes: facts.bytes },
      },
      async () => bytes,
    );
    try {
      const candidate = await persistCandidate(this.options.context.roots.data, value, await readFile(use.path));
      value = this.store.read(value.id);
      value.candidate = candidate;
      if (value.state !== "cancelling") {
        value.state = "succeeded";
        delete value.error;
      }
      this.store.write(value);
    } finally {
      await this.options.context.cleanup(() => this.options.library.session((session) => session.release(use)));
    }
  }
  close() {
    this.closed ??= (async () => {
      this.stopping = true;
      this.activate();
      this.active?.abort.abort();
      this.signal();
      await this.running;
    })();
    return this.closed;
  }
}
