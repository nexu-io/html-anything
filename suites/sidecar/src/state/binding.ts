import { randomUUID } from "node:crypto";
import { mkdir, open, readFile, rename, rm } from "node:fs/promises";
import { join, resolve } from "node:path";

import {
  type Binding,
  type Channel,
  canonical,
  channel,
  type Digest,
  type Event,
  type Fault,
  gates,
  type Namespace,
  namespace,
  reduce,
  valid,
} from "@odsuite/protocol";

export interface Journal {
  revision: number;
  state: Binding;
}

export type Change =
  | { changed: boolean; journal: Journal; ok: true }
  | { fault: Fault | "revision"; journal: Journal; ok: false };

function record(value: unknown, name: string): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new TypeError(`${name} must be an object`);
  }
  return value as Record<string, unknown>;
}

function target(value: unknown, name: string): Digest {
  if (typeof value !== "string" || !valid(value)) throw new TypeError(`${name} is invalid`);
  return value;
}

export function parse(value: unknown, scope: Namespace, lane: Channel): Journal {
  const data = record(value, "journal");
  const state = record(data.state, "journal.state");
  if (!Number.isSafeInteger(data.revision) || Number(data.revision) < 0) {
    throw new TypeError("journal.revision is invalid");
  }
  if (channel(String(state.channel)) !== lane || namespace(String(state.namespace)) !== scope) {
    throw new TypeError("journal identity mismatch");
  }
  const binding: Binding = { channel: lane, namespace: scope };
  if (state.current !== undefined) binding.current = target(state.current, "binding.current");
  if (state.handoff !== undefined) {
    const handoff = record(state.handoff, "binding.handoff");
    if (handoff.mode !== "update" && handoff.mode !== "recovery") {
      throw new TypeError("binding.handoff.mode is invalid");
    }
    binding.handoff = {
      mode: handoff.mode,
      target: target(handoff.target, "binding.handoff.target"),
    };
  }
  if (state.attempt !== undefined) binding.attempt = attempt(state.attempt);
  if (binding.attempt && binding.handoff?.target !== binding.attempt.target) {
    throw new TypeError("binding attempt is detached");
  }
  return { revision: data.revision as number, state: binding };
}

function attempt(value: unknown): NonNullable<Binding["attempt"]> {
  const data = record(value, "binding.attempt");
  if (typeof data.nonce !== "string" || !data.nonce) throw new TypeError("binding.attempt.nonce is invalid");
  if (data.status !== "running" && data.status !== "failed") {
    throw new TypeError("binding.attempt.status is invalid");
  }
  const values = data.ready;
  if (!Array.isArray(values) || values.some((gate) => !gates.includes(gate))) {
    throw new TypeError("binding.attempt.ready is invalid");
  }
  const ready = gates.filter((gate) => values.includes(gate));
  if (ready.length !== values.length) throw new TypeError("binding.attempt.ready is invalid");
  const result: NonNullable<Binding["attempt"]> = {
    nonce: data.nonce,
    ready,
    status: data.status,
    target: target(data.target, "binding.attempt.target"),
  };
  if (data.error !== undefined) {
    if (typeof data.error !== "string" || !data.error) throw new TypeError("binding.attempt.error is invalid");
    result.error = data.error;
  }
  return result;
}

export class Bindings {
  readonly #root: string;
  readonly #pending = new Map<string, Promise<void>>();
  readonly #seen = new Set<string>();
  readonly #known = new Set<string>();
  readonly #uncertain = new Set<string>();

  constructor(root: string) {
    this.#root = resolve(root, "factories");
  }

  /** Exact on-disk facts only; does not fail or recover a running attempt. */
  static async inspect(root: string, scope: Namespace, lane: Channel): Promise<Journal> {
    namespace(scope);
    channel(lane);
    return parse(
      JSON.parse(await readFile(join(resolve(root), "factories", lane, scope, "binding.json"), "utf8")),
      scope,
      lane,
    );
  }

  read(scope: Namespace, lane: Channel): Promise<Journal> {
    return this.#run(scope, lane, () => this.#load(scope, lane));
  }

  transit(scope: Namespace, lane: Channel, revision: number, event: Event): Promise<Change> {
    return this.#run(scope, lane, async () => {
      const journal = await this.#load(scope, lane);
      if (journal.revision !== revision) return { fault: "revision", journal, ok: false };
      const transition = reduce(journal.state, event);
      if (!transition.ok) return { fault: transition.fault, journal, ok: false };
      if (!transition.changed) return { changed: false, journal, ok: true };
      const next = { revision: revision + 1, state: transition.state };
      await this.#save(scope, lane, next);
      return { changed: true, journal: next, ok: true };
    });
  }

  async #load(scope: Namespace, lane: Channel): Promise<Journal> {
    const identity = `${lane}:${scope}`;
    if (this.#uncertain.has(identity)) throw new Error("binding persistence uncertain; recovery required");
    let journal: Journal;
    try {
      journal = parse(JSON.parse(await readFile(this.#path(scope, lane), "utf8")), scope, lane);
      this.#known.add(identity);
    } catch (fault) {
      if ((fault as NodeJS.ErrnoException).code !== "ENOENT") throw fault;
      if (this.#known.has(identity)) throw new Error("binding missing; recovery required");
      journal = { revision: 0, state: { channel: lane, namespace: scope } };
    }
    if (this.#seen.has(identity)) return journal;
    if (journal.state.attempt?.status !== "running") {
      this.#seen.add(identity);
      return journal;
    }
    const attempt = journal.state.attempt;
    const transition = reduce(journal.state, {
      error: "sidecar restart",
      nonce: attempt.nonce,
      target: attempt.target,
      type: "fail",
    });
    if (!transition.ok) throw new Error(`binding recovery ${transition.fault}`);
    const recovered = { revision: journal.revision + 1, state: transition.state };
    await this.#save(scope, lane, recovered);
    this.#seen.add(identity);
    return recovered;
  }

  #path(scope: Namespace, lane: Channel): string {
    return join(this.#root, lane, scope, "binding.json");
  }

  #run<T>(scope: Namespace, lane: Channel, action: () => Promise<T>): Promise<T> {
    const identity = `${lane}:${scope}`;
    const prior = this.#pending.get(identity) ?? Promise.resolve();
    const result = prior.then(action, action);
    const pending = result.then(
      () => undefined,
      () => undefined,
    );
    this.#pending.set(identity, pending);
    pending.finally(() => {
      if (this.#pending.get(identity) === pending) this.#pending.delete(identity);
    });
    return result;
  }

  async #save(scope: Namespace, lane: Channel, journal: Journal): Promise<void> {
    const root = join(this.#root, lane, scope);
    const path = this.#path(scope, lane);
    const temporary = `${path}.${randomUUID()}.tmp`;
    await mkdir(root, { mode: 0o700, recursive: true });
    let renamed = false;
    try {
      const file = await open(temporary, "wx", 0o600);
      try {
        await file.writeFile(`${canonical(journal)}\n`);
        await file.sync();
      } finally {
        await file.close();
      }
      await rename(temporary, path);
      renamed = true;
      this.#known.add(`${lane}:${scope}`);
      // Windows does not support opening directory handles through this API.
      // File synchronization + atomic rename are used there; power-loss durability is unqualified.
      if (process.platform !== "win32") {
        const directory = await open(root, "r");
        try {
          await directory.sync();
        } finally {
          await directory.close();
        }
      }
    } catch (error) {
      if (renamed) this.#uncertain.add(`${lane}:${scope}`);
      throw error;
    } finally {
      await rm(temporary, { force: true }).catch(() => {});
    }
  }
}
