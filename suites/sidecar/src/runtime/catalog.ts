import { lstat } from "node:fs/promises";
import { join } from "node:path";
import { type FactoryScope, factoryKey, factoryScope } from "@odsuite/protocol";
import {
  type Directory,
  type FactoryEntry,
  type Instance,
  type Observer,
  type Phase,
  parse,
  slot,
} from "../control/directory.js";
import { type SessionRecord, sessionKey } from "../control/session.js";
import type { Identity } from "../control/types.js";
import type { ProcessInstance } from "../process/observe.js";
import { Bindings, type Journal } from "../state/binding.js";
import { Ownership } from "./ownership.js";

export class Catalog {
  private constructor(
    private owner: Ownership,
    private state: Directory,
  ) {}
  static open(owner: Ownership): Catalog {
    const prior = owner.readDirectory();
    if (prior === undefined && owner.previous?.directory) throw new Error("directory missing; recovery required");
    const old = prior === undefined ? undefined : parse(prior, owner.previous ?? owner.info);
    const state: Directory = {
      schema: 4,
      revision: (old?.revision ?? -1) + 1,
      manager: { incarnation: owner.incarnation, pid: owner.info.pid, birth: owner.info.birth, phase: "active" },
      factories: old?.factories ?? [],
      instances: old?.instances ?? [],
      sessions: old?.sessions ?? [],
    };
    owner.writeDirectory(state);
    return new Catalog(owner, state);
  }
  snapshot(scope?: FactoryScope): Directory {
    const info = this.owner.info;
    const result = parse(this.state, info);
    if (scope !== undefined) {
      factoryScope(scope);
      result.factories = result.factories.filter((entry) => factoryKey(entry) === factoryKey(scope));
      result.instances = result.instances.filter((entry) => factoryKey(entry) === factoryKey(scope));
      result.sessions = result.sessions.filter((entry) => factoryKey(entry) === factoryKey(scope));
    }
    return result;
  }
  private update(change: (next: Directory) => void): void {
    this.owner.info;
    const next = structuredClone(this.state);
    change(next);
    next.revision++;
    const parsed = parse(next, this.owner.info);
    this.owner.writeDirectory(parsed);
    this.state = parsed;
  }
  factory(scope: FactoryScope, phase: FactoryEntry["phase"], incarnation?: string): void {
    factoryScope(scope);
    this.update((next) => {
      const index = next.factories.findIndex((entry) => factoryKey(entry) === factoryKey(scope));
      const entry: FactoryEntry = {
        ...factoryScope(scope),
        binding: index < 0 ? false : next.factories[index]!.binding,
        manager: next.manager.incarnation,
        phase,
        ...(incarnation ? { incarnation } : {}),
      };
      if (index < 0) next.factories.push(entry);
      else next.factories[index] = entry;
    });
  }
  binding(scope: FactoryScope) {
    const current = this.state.factories.find((entry) => factoryKey(entry) === factoryKey(scope));
    if (!current) throw new Error("binding factory unavailable");
    if (current.binding) return;
    this.update((next) => {
      next.factories.find((entry) => factoryKey(entry) === factoryKey(scope))!.binding = true;
    });
  }
  claim(scope: Identity, incarnation: string, kind: Instance["kind"]): void {
    this.update((next) => {
      const index = next.instances.findIndex((entry) => slot(entry) === slot(scope));
      if (!next.factories.some((entry) => factoryKey(entry) === factoryKey(scope)))
        next.factories.push({
          ...factoryScope(scope),
          manager: next.manager.incarnation,
          phase: "unopened",
          binding: false,
        });
      if (index >= 0 && next.instances[index]?.phase !== "retired") throw new Error("service already owned");
      const entry: Instance = {
        ...scope,
        incarnation,
        manager: next.manager.incarnation,
        kind,
        phase: "initializing",
        ...(kind === "hosted" ? { pid: process.pid } : {}),
      };
      if (index < 0) next.instances.push(entry);
      else next.instances[index] = entry;
    });
  }
  change(scope: Identity, incarnation: string, phase: Phase, pid?: number, process?: ProcessInstance): void {
    const current = this.state.instances.find((entry) => slot(entry) === slot(scope));
    if (!current || current.incarnation !== incarnation || current.generation !== scope.generation)
      throw new Error("directory incarnation is fenced");
    if (current.phase === phase && (pid === undefined || pid === current.pid)) return;
    const transitions: Record<Phase, Phase[]> = {
      initializing: ["ready", "stopping", "failed", "retired"],
      ready: ["stopping", "failed"],
      stopping: ["failed", "retired"],
      failed: ["stopping"],
      retired: [],
    };
    if (!transitions[current.phase].includes(phase)) throw new Error("invalid directory transition");
    this.update((next) => {
      const entry = next.instances.find((entry) => slot(entry) === slot(scope)) as Instance;
      entry.phase = phase;
      if (pid !== undefined) entry.pid = pid;
      if (process !== undefined) entry.process = process;
    });
  }
  observer(): Observer {
    return {
      claim: (scope, id) => this.claim(scope, id, "process"),
      change: (scope, id, phase, pid, process) => this.change(scope, id, phase, pid, process),
    };
  }
  session(record: Omit<SessionRecord, "manager">): void {
    this.update((next) => {
      if (!next.factories.some((entry) => factoryKey(entry) === factoryKey(record)))
        next.factories.push({
          ...factoryScope(record),
          manager: next.manager.incarnation,
          phase: "unopened",
          binding: false,
        });
      const index = next.sessions.findIndex((entry) => sessionKey(entry) === sessionKey(record));
      const prior = next.sessions[index];
      if (prior && record.phase !== "active" && prior.incarnation !== record.incarnation)
        throw new Error("session incarnation is fenced");
      const value = { ...record, manager: next.manager.incarnation };
      if (index < 0) next.sessions.push(value);
      else next.sessions[index] = value;
    });
  }
  drained(): void {
    if (this.state.sessions.some((entry) => !["completed", "failed"].includes(entry.phase)))
      throw new Error("directory has incomplete sessions");
    if (this.state.instances.some((entry) => entry.phase !== "retired"))
      throw new Error("directory has unretired instances");
    if (this.state.factories.some((entry) => !["closed", "unopened"].includes(entry.phase)))
      throw new Error("directory has unclosed factories");
  }
}

/** Last committed facts only; an interrupted manager does not imply its child PIDs are dead. */
export async function readDirectory(root: string, scope?: FactoryScope): Promise<Directory> {
  const snapshot = await Ownership.inspect(join(root, "manager.sqlite"));
  if (!snapshot.owner.directory) throw new Error("directory unavailable; recovery required");
  const result = parse(snapshot.directory, {
    ...snapshot.owner,
    phase: snapshot.owner.phase === "active" ? "interrupted" : "closed",
  });
  if (scope !== undefined) {
    factoryScope(scope);
    result.factories = result.factories.filter((entry) => factoryKey(entry) === factoryKey(scope));
    result.instances = result.instances.filter((entry) => factoryKey(entry) === factoryKey(scope));
    result.sessions = result.sessions.filter((entry) => factoryKey(entry) === factoryKey(scope));
  }
  return result;
}

/** Offline, read-only binding and directory facts under the same manager exclusion lock. */
export async function readBinding(
  root: string,
  scope: FactoryScope,
): Promise<{ directory: Directory; journal: Journal }> {
  const identity = factoryScope(scope);
  const snapshot = await Ownership.inspect(join(root, "manager.sqlite"), () =>
    Bindings.inspect(root, identity.namespace, identity.channel),
  );
  if (!snapshot.owner.directory) throw new Error("factory directory unavailable; recovery required");
  const directory = parse(snapshot.directory, {
    ...snapshot.owner,
    phase: snapshot.owner.phase === "active" ? "interrupted" : "closed",
  });
  if (!directory.factories.some((entry) => factoryKey(entry) === factoryKey(identity)))
    throw new Error("factory unavailable");
  if (!snapshot.value) throw new Error("binding unavailable; recovery required");
  directory.factories = directory.factories.filter((entry) => factoryKey(entry) === factoryKey(identity));
  directory.instances = directory.instances.filter((entry) => factoryKey(entry) === factoryKey(identity));
  directory.sessions = directory.sessions.filter((entry) => factoryKey(entry) === factoryKey(identity));
  return { directory, journal: snapshot.value };
}

/** Distinguish an unclaimed bootstrap root from incomplete or interrupted authority. */
export async function readAuthority(root: string): Promise<Directory | undefined> {
  try {
    await lstat(join(root, "manager.sqlite"));
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
    for (const name of ["control.json", "factories"]) {
      try {
        await lstat(join(root, name));
      } catch (error) {
        if ((error as NodeJS.ErrnoException).code === "ENOENT") continue;
        throw error;
      }
      throw new Error("manager authority is incomplete; explicit recovery is required");
    }
    return undefined;
  }
  return readDirectory(root);
}
