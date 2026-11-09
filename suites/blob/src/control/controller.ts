import { MessageChannel } from "node:worker_threads";
import type { Context } from "@odsuite/sidecar";

/** A real subject initializes this controller outside business/lifecycle ALS. */
export class Controller {
  private accepting = true;
  private pending = new Set<Promise<unknown>>();
  private queue: (() => void)[] = [];
  private channel: MessageChannel;
  readonly abort = new AbortController();
  constructor(context: Context) {
    this.channel = context.background(() => {
      const channel = new MessageChannel();
      channel.port1.on("message", () => {
        this.queue.shift()?.();
      });
      channel.port1.unref();
      channel.port2.unref();
      return channel;
    });
  }
  run<T>(operation: () => Promise<T>): Promise<T> {
    if (!this.accepting) return Promise.reject(Error("blob library is closing"));
    const result = new Promise<T>((done, reject) => {
      this.queue.push(() => {
        void Promise.resolve().then(operation).then(done, reject);
      });
      this.channel.port2.postMessage(null);
    });
    return this.track(() => result);
  }
  track<T>(operation: () => Promise<T>): Promise<T> {
    if (!this.accepting) return Promise.reject(Error("blob library is closing"));
    const result = Promise.resolve().then(operation);
    this.pending.add(result);
    void result.then(
      () => this.pending.delete(result),
      () => this.pending.delete(result),
    );
    return result;
  }
  async drain() {
    this.accepting = false;
    this.abort.abort(Error("blob library stopped"));
    await Promise.allSettled([...this.pending]);
    this.channel.port1.close();
    this.channel.port2.close();
  }
}
