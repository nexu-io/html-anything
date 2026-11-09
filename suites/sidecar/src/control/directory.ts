import { type FactoryScope, factoryKey, factoryScope } from "@odsuite/protocol";
import { type ProcessInstance, processInstance, processWitness } from "../process/observe.js";
import { type SessionRecord, sessionKey, sessionScope } from "./session.js";
import { type Identity, identity } from "./types.js";

export type Phase = "initializing" | "ready" | "stopping" | "failed" | "retired";
export interface Instance extends Identity {
  incarnation: string;
  manager: string;
  kind: "hosted" | "process";
  phase: Phase;
  pid?: number;
  process?: ProcessInstance;
}
export interface FactoryEntry {
  binding: boolean;
  channel: FactoryScope["channel"];
  namespace: FactoryScope["namespace"];
  manager: string;
  incarnation?: string;
  phase: "unopened" | "opening" | "ready" | "failed" | "closed";
}
export interface Directory {
  schema: 4;
  revision: number;
  manager: { incarnation: string; pid: number; birth: string; phase: "active" | "closed" | "interrupted" };
  factories: FactoryEntry[];
  instances: Instance[];
  sessions: SessionRecord[];
}
export interface Observer {
  run?<T>(scope: Identity, operation: () => Promise<T>): Promise<T>;
  claim(scope: Identity, incarnation: string): void;
  change(scope: Identity, incarnation: string, phase: Phase, pid?: number, process?: ProcessInstance): void;
}
export const slot = (scope: Identity) => JSON.stringify([scope.namespace, scope.channel, scope.service]);
const uuid = (value: unknown): string => {
  if (typeof value !== "string" || !/^[0-9a-f-]{36}$/.test(value)) throw new Error("invalid directory incarnation");
  return value;
};
export function parse(input: unknown, owner: Directory["manager"]): Directory {
  if (!input || typeof input !== "object") throw new Error("directory is missing; recovery required");
  const data = input as Directory;
  if (
    data.schema !== 4 ||
    !Number.isSafeInteger(data.revision) ||
    data.revision < 0 ||
    data.manager?.incarnation !== owner.incarnation ||
    data.manager?.pid !== owner.pid ||
    data.manager?.birth !== owner.birth ||
    !Array.isArray(data.factories) ||
    !Array.isArray(data.instances)
  )
    throw new Error("invalid directory; recovery required");
  if (!Array.isArray(data.sessions)) throw new Error("session directory missing; recovery required");
  const sessions = (data.sessions ?? []).map((entry): SessionRecord => {
    const scope = sessionScope(entry);
    if (
      !["automatic", "local", "remote"].includes(entry.kind) ||
      !["active", "closing", "completed", "failed", "interrupted"].includes(entry.phase) ||
      (entry.reason !== undefined && !["callback", "operation", "disconnect"].includes(entry.reason))
    )
      throw new Error("invalid session record");
    if (!["completed", "failed"].includes(entry.phase) && entry.manager !== owner.incarnation)
      throw new Error("session owner mismatch");
    return {
      ...scope,
      incarnation: uuid(entry.incarnation),
      controller: processWitness(entry.controller),
      manager: uuid(entry.manager),
      kind: entry.kind,
      phase: entry.phase,
      ...(entry.reason ? { reason: entry.reason } : {}),
    };
  });
  if (new Set(sessions.map(sessionKey)).size !== sessions.length) throw new Error("duplicate session scope");
  if (owner.phase === "closed" && sessions.some((entry) => !["completed", "failed"].includes(entry.phase)))
    throw new Error("closed manager has incomplete sessions");
  const factories = data.factories.map((entry): FactoryEntry => {
    if (!["unopened", "opening", "ready", "failed", "closed"].includes(entry.phase))
      throw new Error("invalid factory phase");
    if (typeof entry.binding !== "boolean") throw new Error("binding authority marker missing");
    const scope = factoryScope(entry);
    const value = {
      ...scope,
      binding: entry.binding,
      manager: uuid(entry.manager),
      phase: entry.phase,
      ...(entry.incarnation === undefined ? {} : { incarnation: uuid(entry.incarnation) }),
    };
    if (value.phase === "ready" && !value.incarnation) throw new Error("factory owner is unpublished");
    if (!["unopened", "closed"].includes(value.phase) && value.manager !== owner.incarnation)
      throw new Error("factory owner mismatch");
    return value;
  });
  const instances = data.instances.map((entry): Instance => {
    const scope = identity(entry);
    if (
      !["hosted", "process"].includes(entry.kind) ||
      !["initializing", "ready", "stopping", "failed", "retired"].includes(entry.phase)
    )
      throw new Error("invalid instance phase or kind");
    if (entry.pid !== undefined && (!Number.isSafeInteger(entry.pid) || entry.pid < 1))
      throw new Error("invalid instance pid");
    if (entry.phase === "ready" && entry.pid === undefined) throw new Error("ready instance has no pid");
    if (
      entry.phase !== "retired" &&
      (entry.manager !== owner.incarnation || (entry.kind === "hosted" && entry.pid !== owner.pid))
    )
      throw new Error("instance owner mismatch");
    const process = entry.process === undefined ? undefined : processInstance(entry.process);
    if (entry.kind === "process" && ["ready", "stopping"].includes(entry.phase) && !process)
      throw new Error("process ownership witness missing");
    if (
      process &&
      (process.target.pid !== entry.pid ||
        process.stamp.incarnation !== entry.incarnation ||
        process.stamp.channel !== scope.channel ||
        process.stamp.namespace !== scope.namespace ||
        process.stamp.generation !== scope.generation ||
        process.stamp.service !== scope.service)
    )
      throw new Error("process witness identity mismatch");
    return {
      ...scope,
      manager: uuid(entry.manager),
      incarnation: uuid(entry.incarnation),
      kind: entry.kind,
      phase: entry.phase,
      ...(entry.pid === undefined ? {} : { pid: entry.pid }),
      ...(process ? { process } : {}),
    };
  });
  if (
    new Set(factories.map(factoryKey)).size !== factories.length ||
    new Set(instances.map(slot)).size !== instances.length
  )
    throw new Error("duplicate directory identity");
  if (
    owner.phase === "closed" &&
    (instances.some((entry) => entry.phase !== "retired") ||
      factories.some((entry) => !["closed", "unopened"].includes(entry.phase)))
  )
    throw new Error("closed manager has unretired directory entries");
  const indexed = new Set(factories.map(factoryKey));
  if ([...instances, ...sessions].some((entry) => !indexed.has(factoryKey(entry))))
    throw new Error("directory entry has no factory authority");
  return {
    schema: 4,
    revision: data.revision,
    manager: { incarnation: owner.incarnation, pid: owner.pid, birth: owner.birth, phase: owner.phase },
    factories,
    instances,
    sessions,
  };
}
