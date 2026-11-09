import { randomBytes, randomUUID } from "node:crypto";
import {
  type Channel,
  canonical,
  channel,
  type Digest,
  digest,
  type Namespace,
  namespace,
  valid,
} from "@odsuite/protocol";
import type { Observer } from "./control/directory.js";
import type { Identity } from "./control/types.js";
import { rootKey } from "./process/identity.js";
import { type Launch, LaunchFault, launch, type Running, type Stop } from "./process/runner.js";

export interface Spec extends Launch {
  channel: Channel;
  generation: Digest;
  namespace: Namespace;
  service: string;
}

export interface Lease {
  incarnation: string;
  attachment: string;
  capability: string;
  channel: Channel;
  generation: Digest;
  namespace: Namespace;
  pid: number;
  service: string;
}

export interface Snapshot {
  attachments: number;
  channel: Channel;
  generation: Digest;
  namespace: Namespace;
  pid: number;
  service: string;
  state: "running" | "exited" | "stopping" | "failed";
}

export interface Release {
  status: "retained" | Stop["status"];
  survivors: number[];
}

interface Entry {
  incarnation: string;
  retired?: boolean;
  state: "running" | "stopping" | "failed";
  stopping?: Promise<Stop>;
  fault?: unknown;
  attachments: Map<string, string>;
  channel: Channel;
  fingerprint: Digest;
  generation: Digest;
  namespace: Namespace;
  running: Running;
  service: string;
}

interface Retired {
  capability: string;
  result: Release;
}

function fingerprint(spec: Spec): Digest {
  return digest(
    canonical({
      args: spec.args ?? [],
      command: spec.command,
      cwd: spec.cwd ?? process.cwd(),
      env: spec.env ?? {},
      grace: spec.grace ?? 1000,
      ready: spec.ready,
      timeout: spec.timeout ?? 5000,
    }),
  );
}

function key(value: Pick<Spec, "channel" | "generation" | "namespace" | "service">): string {
  return [value.namespace, value.channel, value.service, value.generation].join(":");
}

function lease(entry: Entry): Lease {
  const attachment = randomUUID();
  const capability = randomBytes(32).toString("base64url");
  entry.attachments.set(attachment, capability);

  return {
    attachment,
    capability,
    incarnation: entry.incarnation,
    channel: entry.channel,
    generation: entry.generation,
    namespace: entry.namespace,
    pid: entry.running.pid,
    service: entry.service,
  };
}

const scope = (value: Pick<Spec, "namespace" | "channel" | "generation" | "service">): Identity => ({
  namespace: value.namespace,
  channel: value.channel,
  generation: value.generation,
  service: value.service,
});

export class Sidecar {
  constructor(
    private root: string,
    private observer?: Observer,
  ) {}
  /** @internal Bind an empty host to its one persistent manager before launching. */
  observe(observer: Observer): void {
    if (this.observer || this.#entries.size || this.#released.size) throw new Error("host is already in use");
    this.observer = observer;
  }
  readonly #entries = new Map<string, Promise<Entry>>();
  readonly #released = new Map<string, Retired>();

  #discard(identity: string, pending: Promise<Entry>): void {
    if (this.#entries.get(identity) === pending) this.#entries.delete(identity);
  }

  async #create(spec: Spec, mark: Digest): Promise<Entry> {
    const incarnation = randomUUID();
    this.observer?.claim(scope(spec), incarnation);
    let running: Running | undefined;
    const entry = (value: Running, state: Entry["state"], fault?: unknown): Entry => ({
      attachments: new Map(),
      channel: spec.channel,
      fingerprint: mark,
      generation: spec.generation,
      namespace: spec.namespace,
      running: value,
      service: spec.service,
      incarnation,
      state,
      fault,
    });
    try {
      running = await launch(spec, { ...scope(spec), root: rootKey(this.root), incarnation });
      this.observer?.change(scope(spec), incarnation, "ready", running.pid, running.instance);
      return entry(running, "running");
    } catch (fault) {
      let stopped: Stop;
      if (fault instanceof LaunchFault) {
        running = fault.running;
        stopped = fault.stopped;
      } else if (running) {
        try {
          stopped = await running.stop();
        } catch {
          stopped = { status: "partial", survivors: [running.pid] };
        }
      } else {
        this.observer?.change(scope(spec), incarnation, "failed");
        throw fault;
      }
      let outcome = fault;
      try {
        this.observer?.change(
          scope(spec),
          incarnation,
          stopped.status === "stopped" ? "retired" : "failed",
          running?.pid,
        );
      } catch (metadata) {
        outcome = new AggregateError([fault, metadata], "startup and directory publication failed");
      }
      if (stopped.status !== "stopped" && running) return entry(running, "failed", outcome);
      throw outcome;
    }
  }

  private stop(identity: string, entry: Entry): Promise<Stop> {
    if (entry.retired) return Promise.resolve({ status: "stopped", survivors: [] });
    if (entry.stopping) return entry.stopping;
    entry.state = "stopping";
    const pending = (async () => {
      this.observer?.change(scope(entry), entry.incarnation, "stopping", entry.running.pid);
      try {
        const result = await entry.running.stop();
        this.observer?.change(
          scope(entry),
          entry.incarnation,
          result.status === "stopped" ? "retired" : "failed",
          entry.running.pid,
        );
        if (result.status === "stopped") {
          entry.retired = true;
          for (const [attachment, capability] of entry.attachments)
            this.#released.set(attachment, { capability, result });
          this.#entries.delete(identity);
        } else entry.state = "failed";
        return result;
      } catch (fault) {
        entry.state = "failed";
        this.observer?.change(scope(entry), entry.incarnation, "failed", entry.running.pid);
        throw fault;
      }
    })();
    entry.stopping = pending.finally(() => {
      entry.stopping = undefined;
    });
    return entry.stopping;
  }

  async start(spec: Spec): Promise<Lease> {
    if (!valid(spec.generation)) throw new TypeError("invalid generation");
    channel(spec.channel);
    namespace(spec.namespace);
    if (!/^[a-z][a-z0-9]*$/.test(spec.service)) throw new TypeError("invalid service");
    const mark = fingerprint(spec);
    const identity = key(spec);
    let pending = this.#entries.get(identity);

    if (!pending) {
      const created = this.#create(spec, mark);
      pending = created;
      this.#entries.set(identity, created);
      created.catch(() => this.#discard(identity, created));
    }

    const entry = await pending;
    if (entry.fingerprint !== mark) throw new Error("generation config mismatch");
    if (entry.state !== "running") throw entry.fault ?? new Error("generation is not accepting attachments");
    if (!(await entry.running.active())) throw new Error("generation process exited");
    return lease(entry);
  }

  async attach(value: Lease): Promise<Lease> {
    const pending = this.#entries.get(key(value));
    if (!pending) throw new Error("generation unavailable");
    const entry = await pending;

    if (value.incarnation !== entry.incarnation || entry.attachments.get(value.attachment) !== value.capability) {
      throw new Error("invalid capability");
    }

    if (entry.state !== "running") throw entry.fault ?? new Error("generation is not accepting attachments");
    if (!(await entry.running.active())) throw new Error("generation process exited");
    return lease(entry);
  }

  async release(value: Lease): Promise<Release> {
    const prior = this.#released.get(value.attachment);
    if (prior && prior.capability !== value.capability) throw new Error("invalid capability");
    if (prior) return prior.result;
    const identity = key(value);
    const pending = this.#entries.get(identity);
    if (!pending) throw new Error("generation unavailable");
    const entry = await pending;

    if (value.incarnation !== entry.incarnation || entry.attachments.get(value.attachment) !== value.capability) {
      throw new Error("invalid capability");
    }

    if (entry.attachments.size > 1) {
      entry.attachments.delete(value.attachment);
      const result: Release = { status: "retained", survivors: [] };
      this.#released.set(value.attachment, { capability: value.capability, result });
      return result;
    }

    return this.stop(identity, entry);
  }

  async inspect(): Promise<Snapshot[]> {
    const entries = await Promise.all(this.#entries.values());

    return Promise.all(
      entries.map(async (entry) => ({
        attachments: entry.attachments.size,
        channel: entry.channel,
        generation: entry.generation,
        namespace: entry.namespace,
        pid: entry.running.pid,
        service: entry.service,
        state: entry.state === "running" ? ((await entry.running.active()) ? "running" : "exited") : entry.state,
      })),
    );
  }

  async close(): Promise<Stop[]> {
    const pending = [...this.#entries.entries()];
    const results = await Promise.all(
      pending.map(async ([identity, value]) => {
        try {
          const entry = await value;
          return await (this.observer?.run
            ? this.observer.run(scope(entry), () => this.stop(identity, entry))
            : this.stop(identity, entry));
        } catch (fault) {
          if (this.#entries.has(identity)) throw fault;
          return { status: "stopped", survivors: [] } as Stop;
        }
      }),
    );
    return results;
  }
}
