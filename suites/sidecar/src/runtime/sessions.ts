import { randomBytes, randomUUID } from "node:crypto";
import type { Socket } from "node:net";
import {
  type SessionHint,
  type SessionRecord,
  type SessionScope,
  sessionKey,
  sessionScope,
} from "../control/session.js";
import { capture, exact, selfWitness, type Witness } from "../process/observe.js";
import type { Catalog } from "./catalog.js";
import { ambient } from "./sessionwire.js";

type Holder = {
  actor: Witness;
  scope: SessionScope;
  hint: SessionHint;
  kind: SessionRecord["kind"];
  phase: SessionRecord["phase"];
  tail: Promise<void>;
  operations: Map<string, Promise<unknown>>;
  finished?: Promise<void>;
  done: Promise<void>;
  resolve: () => void;
};
type Waiter = {
  actor: Witness;
  scope: SessionScope;
  kind: SessionRecord["kind"];
  resolve: (holder: Holder) => void;
  reject: (fault: Error) => void;
  signal?: AbortSignal;
};
type Lane = { active?: Holder; queue: Waiter[]; interrupted: boolean };

export class Sessions {
  private lanes = new Map<string, Lane>();
  private closing = false;
  constructor(
    private endpoint: string,
    private catalog: Pick<Catalog, "session">,
  ) {}
  current(scope: SessionScope): boolean {
    const current = ambient.getStore();
    return (
      !!current?.hint &&
      current.endpoint === this.endpoint &&
      sessionKey(current.hint) === sessionKey(scope) &&
      !!current.valid?.()
    );
  }
  private acquire(
    scope: SessionScope,
    kind: SessionRecord["kind"],
    signal?: AbortSignal,
    actor?: Witness,
  ): Promise<Holder> {
    scope = sessionScope(scope);
    if (this.closing && !ambient.getStore()?.internal) return Promise.reject(new Error("lifecycle manager is closing"));
    if (signal?.aborted) return Promise.reject(new Error("lifecycle acquisition cancelled"));
    const key = sessionKey(scope);
    let lane = this.lanes.get(key);
    if (!lane) {
      lane = { queue: [], interrupted: false };
      this.lanes.set(key, lane);
    }
    if (lane.interrupted) return Promise.reject(new Error("lifecycle session interrupted; recovery required"));
    const target = lane;
    return new Promise((resolve, reject) => {
      const waiter: Waiter = { scope, kind, resolve, reject, signal, actor: actor! };
      const cancel = () => {
        const index = target.queue.indexOf(waiter);
        if (index >= 0) {
          target.queue.splice(index, 1);
          reject(new Error("lifecycle acquisition cancelled"));
        }
      };
      signal?.addEventListener("abort", cancel, { once: true });
      waiter.resolve = (holder) => {
        signal?.removeEventListener("abort", cancel);
        resolve(holder);
      };
      target.queue.push(waiter);
      this.pump(target);
    });
  }
  private pump(lane: Lane): void {
    if (lane.active || lane.interrupted) return;
    const waiter = lane.queue.shift();
    if (!waiter) return;
    if (waiter.signal?.aborted) {
      waiter.reject(new Error("lifecycle acquisition cancelled"));
      this.pump(lane);
      return;
    }
    const incarnation = randomUUID();
    let done = () => {};
    const holder: Holder = {
      scope: waiter.scope,
      actor: waiter.actor,
      hint: { ...waiter.scope, incarnation, token: randomBytes(32).toString("base64url") },
      kind: waiter.kind,
      phase: "active",
      tail: Promise.resolve(),
      operations: new Map(),
      done: new Promise((resolve) => {
        done = resolve;
      }),
      resolve: () => done(),
    };
    try {
      this.record(holder, "active");
      lane.active = holder;
      waiter.resolve(holder);
    } catch (fault) {
      waiter.reject(fault instanceof Error ? fault : new Error(String(fault)));
      this.pump(lane);
    }
  }
  private record(holder: Holder, phase: SessionRecord["phase"], reason?: SessionRecord["reason"]): void {
    this.catalog.session({
      ...holder.scope,
      controller: holder.actor,
      incarnation: holder.hint.incarnation,
      kind: holder.kind,
      phase,
      ...(reason ? { reason } : {}),
    });
    holder.phase = phase;
  }
  private find(scope: SessionScope, hint: SessionHint): Holder {
    if (sessionKey(scope) !== sessionKey(hint)) throw new Error("lifecycle scope mismatch");
    const holder = this.lanes.get(sessionKey(scope))?.active;
    if (
      !holder ||
      holder.hint.incarnation !== hint.incarnation ||
      holder.hint.token !== hint.token ||
      holder.phase === "interrupted"
    )
      throw new Error("lifecycle context is fenced");
    return holder;
  }
  private execute<T>(holder: Holder, operation: () => Promise<T>): Promise<T> {
    const id = randomUUID();
    const work = Promise.resolve().then(() =>
      ambient.run(
        {
          endpoint: this.endpoint,
          actor: holder.actor,
          scope: holder.scope,
          hint: { ...holder.hint, parent: id },
          valid: () => holder.operations.has(id) && holder.phase !== "interrupted",
          internal: ambient.getStore()?.internal,
        },
        operation,
      ),
    );
    holder.operations.set(id, work);
    return work.finally(() => holder.operations.delete(id));
  }
  private command<T>(holder: Holder, operation: () => Promise<T>, parent?: string): Promise<T> {
    if (parent) {
      if (!holder.operations.has(parent)) return Promise.reject(new Error("lifecycle parent is expired"));
      return this.execute(holder, operation);
    }
    if (holder.phase !== "active") return Promise.reject(new Error("lifecycle session is not accepting operations"));
    const work = holder.tail.then(() => this.execute(holder, operation));
    holder.tail = work.then(
      () => undefined,
      () => undefined,
    );
    return work;
  }
  async run<T>(scope: SessionScope, operation: () => Promise<T>, hint?: SessionHint, signal?: AbortSignal): Promise<T> {
    scope = sessionScope(scope);
    const current = ambient.getStore();
    const inherited = hint ?? (current?.endpoint === this.endpoint ? current.hint : undefined);
    if (inherited) {
      if (!hint && !current?.valid?.()) throw new Error("lifecycle context is expired");
      return this.command(this.find(scope, inherited), operation, inherited.parent);
    }
    if (current?.hint) throw new Error("cross-scope lifecycle nesting is not supported");
    if (current?.business) throw new Error("business lifecycle writes require a controller session");
    const holder = await this.acquire(scope, "automatic", signal, current?.actor ?? (await selfWitness()));
    let succeeded = false;
    try {
      const result = await this.command(holder, operation);
      succeeded = true;
      return result;
    } finally {
      await this.finish(holder, succeeded, "operation");
    }
  }
  cleanup<T>(scope: SessionScope, operation: () => Promise<T>, hint?: SessionHint, signal?: AbortSignal): Promise<T> {
    return ambient.run({ ...ambient.getStore(), endpoint: this.endpoint, internal: true }, () =>
      this.run(scope, operation, hint, signal),
    );
  }
  outside(): void {
    const current = ambient.getStore();
    if (current?.endpoint === this.endpoint && current.hint)
      throw new Error("cannot close manager inside lifecycle session");
  }
  async local<T>(scope: SessionScope, operation: () => Promise<T>): Promise<T> {
    scope = sessionScope(scope);
    const current = ambient.getStore();
    if (current?.hint) {
      if (!this.current(scope)) throw new Error("cross-scope or expired lifecycle nesting");
      return operation();
    }
    if (current?.business) throw new Error("business lifecycle writes require a controller session");
    const holder = await this.acquire(scope, "local", undefined, await selfWitness());
    let succeeded = false;
    try {
      const result = await ambient.run(
        {
          endpoint: this.endpoint,
          actor: holder.actor,
          scope,
          hint: holder.hint,
          valid: () => holder.phase === "active",
        },
        operation,
      );
      succeeded = true;
      return result;
    } finally {
      await this.finish(holder, succeeded, "callback");
    }
  }
  private finish(
    holder: Holder,
    succeeded: boolean,
    reason: SessionRecord["reason"],
    interrupted = false,
  ): Promise<void> {
    if (holder.finished) return holder.finished;
    const poison = (fault: unknown): never => {
      const lane = this.lanes.get(sessionKey(holder.scope)) as Lane;
      lane.interrupted = true;
      lane.active = undefined;
      holder.phase = "interrupted";
      holder.resolve();
      for (const waiter of lane.queue.splice(0))
        waiter.reject(new Error("lifecycle session interrupted; recovery required"));
      throw fault;
    };
    // Closing prevents new top-level admissions; accepted operations and their nested work drain first.
    try {
      this.record(holder, "closing", reason);
    } catch (fault) {
      holder.finished = Promise.resolve().then(() => poison(fault));
      return holder.finished;
    }
    holder.finished = (async () => {
      await holder.tail;
      while (holder.operations.size) await Promise.allSettled([...holder.operations.values()]);
      this.record(
        holder,
        interrupted ? "interrupted" : succeeded ? "completed" : "failed",
        succeeded ? undefined : reason,
      );
      const lane = this.lanes.get(sessionKey(holder.scope)) as Lane;
      lane.interrupted = interrupted;
      lane.active = undefined;
      holder.resolve();
      if (interrupted) {
        for (const waiter of lane.queue.splice(0))
          waiter.reject(new Error("lifecycle session interrupted; recovery required"));
      } else this.pump(lane);
    })().catch(poison);
    return holder.finished;
  }
  async accept(socket: Socket, scope: SessionScope, actor: Witness): Promise<void> {
    if (!(await capture()).some((p) => exact(p, actor))) throw new Error("controller process witness mismatch");
    const controller = new AbortController();
    socket.once("close", () => controller.abort());
    const holder = await this.acquire(scope, "remote", controller.signal, actor);
    let completion = false,
      input = "";
    const abort = () => {
      if (!completion) void this.finish(holder, false, "disconnect", true).catch(() => {});
    };
    socket.once("close", abort);
    socket.on("error", () => {});
    if (socket.destroyed) {
      abort();
      return;
    }
    socket.write(`${JSON.stringify({ ok: true, value: holder.hint })}\n`);
    socket.on("data", (chunk: Buffer) => {
      input += chunk.toString("utf8");
      if (Buffer.byteLength(input) > 65536) {
        socket.destroy();
        return;
      }
      const end = input.indexOf("\n");
      if (end < 0) return;
      socket.pause();
      try {
        const frame = JSON.parse(input.slice(0, end)) as { type: string; succeeded: boolean };
        if (frame.type !== "finish" || typeof frame.succeeded !== "boolean")
          throw new Error("invalid lifecycle completion");
        completion = true;
        void this.finish(holder, frame.succeeded, "callback").then(
          () => socket.end(`${JSON.stringify({ ok: true, value: null })}\n`),
          () => socket.destroy(),
        );
      } catch {
        socket.destroy();
      }
    });
    socket.resume();
  }
  async shutdown<T>(operation: () => Promise<T>): Promise<T> {
    this.outside();
    this.closing = true;
    for (const lane of this.lanes.values())
      for (const waiter of lane.queue.splice(0)) waiter.reject(new Error("lifecycle manager is closing"));
    await Promise.all([...this.lanes.values()].flatMap((lane) => (lane.active ? [lane.active.done] : [])));
    if ([...this.lanes.values()].some((lane) => lane.interrupted))
      throw new Error("lifecycle session interrupted; recovery required");
    return ambient.run({ endpoint: this.endpoint, internal: true }, operation);
  }
}
