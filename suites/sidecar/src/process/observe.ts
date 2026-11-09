import { execFile } from "node:child_process";
import { realpath } from "node:fs/promises";
import { promisify } from "node:util";
import { type FactoryScope, factoryScope } from "@odsuite/protocol";
import type { Identity } from "../control/types.js";
import {
  type ManagerStamp,
  stamp as normalizeStamp,
  readManagerStamp,
  readStamp,
  rootKey,
  type Stamp,
  sameStamp,
} from "./identity.js";

export interface Witness {
  pid: number;
  birth: string;
}
export interface Process extends Witness {
  ppid: number;
  pgid: number;
  command: string;
  stamp?: Stamp;
  invalidStamp?: boolean;
  manager?: ManagerStamp;
}
export interface ProcessInstance {
  root: Witness;
  target: Witness;
  stamp: Stamp;
}
export async function capture(): Promise<Process[]> {
  if (process.platform !== "darwin" && process.platform !== "linux") throw new Error("process observation unsupported");
  const pending = promisify(execFile)("ps", ["-ww", "-axo", "pid=,ppid=,pgid=,lstart=,args="], {
    env: { ...process.env, LC_ALL: "C", TZ: "UTC" },
    maxBuffer: 32 * 1024 * 1024,
    timeout: 5000,
  });
  const { stdout } = await pending;
  const observerPid = pending.child?.pid;
  return stdout
    .split("\n")
    .filter(Boolean)
    .map((line) => {
      const match = /^\s*(\d+)\s+(\d+)\s+(\d+)\s+(\S+\s+\S+\s+\d+\s+\S+\s+\d+)\s+(.*)$/.exec(line);
      if (!match) throw new Error("invalid OS process observation");
      const command = match[5]!;
      let value: Stamp | undefined;
      let invalidStamp = false;
      let manager: ManagerStamp | undefined;
      try {
        value = readStamp(command);
        manager = readManagerStamp(command);
      } catch {
        invalidStamp = true;
      }
      return {
        pid: Number(match[1]),
        ppid: Number(match[2]),
        pgid: Number(match[3]),
        birth: match[4]!.replace(/\s+/g, " "),
        command,
        stamp: value,
        invalidStamp,
        manager,
      };
    })
    .filter((p) => p.pid !== observerPid);
}
export const exact = (value: Process, witness: Witness) => value.pid === witness.pid && value.birth === witness.birth;
export function owned(all: Process[], root: Witness, identity: Stamp): Process[] {
  const found = all.find((p) => exact(p, root));
  if (!found || !found.stamp || !sameStamp(found.stamp, identity)) return [];
  const excluded = new Set(
    all.filter((p) => p.manager || (p.stamp && !sameStamp(p.stamp, identity))).map((p) => p.pid),
  );
  for (;;) {
    const next = all.filter(
      (p) => excluded.has(p.ppid) && !excluded.has(p.pid) && !(p.stamp && sameStamp(p.stamp, identity)),
    );
    if (!next.length) break;
    for (const p of next) excluded.add(p.pid);
  }
  const result = [found];
  const ids = new Set([found.pid]);
  for (;;) {
    if (all.some((p) => (ids.has(p.ppid) || (found.pgid === found.pid && p.pgid === found.pid)) && p.invalidStamp))
      throw new Error("invalid stamp in owned process tree");
    const next = all.filter(
      (p) =>
        !ids.has(p.pid) &&
        !excluded.has(p.pid) &&
        (ids.has(p.ppid) || (found.pgid === found.pid && p.pgid === found.pid)) &&
        (!p.stamp || sameStamp(p.stamp, identity)),
    );
    if (!next.length) return result;
    for (const p of next) {
      ids.add(p.pid);
      result.push(p);
    }
  }
}
export async function signalOwned(values: Witness[], signal: NodeJS.Signals, identity: Stamp) {
  const now = await capture();
  const foreign = new Set(
    now.filter((p) => p.manager || p.invalidStamp || (p.stamp && !sameStamp(p.stamp, identity))).map((p) => p.pid),
  );
  for (;;) {
    const children = now.filter(
      (p) => foreign.has(p.ppid) && !foreign.has(p.pid) && !(p.stamp && sameStamp(p.stamp, identity)),
    );
    if (!children.length) break;
    for (const p of children) foreign.add(p.pid);
  }
  for (const witness of [...values].reverse()) {
    if (foreign.has(witness.pid)) continue;
    if (!now.some((p) => exact(p, witness))) continue;
    try {
      process.kill(witness.pid, signal);
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== "ESRCH") throw error;
    }
  }
}

export function processInstance(input: unknown): ProcessInstance {
  const value = input as ProcessInstance;
  for (const witness of [value?.root, value?.target]) {
    if (!Number.isSafeInteger(witness?.pid) || witness.pid < 1 || typeof witness.birth !== "string" || !witness.birth)
      throw new Error("invalid process witness");
  }
  if (value.root.pid === value.target.pid) throw new Error("supervisor and target must be distinct");
  return { root: { ...value.root }, target: { ...value.target }, stamp: normalizeStamp(value.stamp) };
}
export interface ProcessObservation {
  identity: Identity;
  incarnation: string;
  supervisor: Witness;
  processes: Witness[];
}
/** OS facts only. This does not claim a lease, adopt a process or rewrite authority. */
export async function observeProcesses(root: string, scope?: FactoryScope): Promise<ProcessObservation[]> {
  const key = rootKey(await realpath(root));
  if (scope) factoryScope(scope);
  const all = await capture();
  return all
    .filter(
      (p) =>
        p.stamp?.root === key &&
        (!scope || (p.stamp.channel === scope.channel && p.stamp.namespace === scope.namespace)),
    )
    .map((p) => {
      const s = p.stamp!;
      return {
        identity: { channel: s.channel, namespace: s.namespace, generation: s.generation, service: s.service },
        incarnation: s.incarnation,
        supervisor: { pid: p.pid, birth: p.birth },
        processes: owned(all, p, s).map((x) => ({ pid: x.pid, birth: x.birth })),
      };
    });
}

export function processWitness(input: unknown): Witness {
  const value = input as Witness;
  if (!Number.isSafeInteger(value?.pid) || value.pid < 1 || typeof value.birth !== "string" || !value.birth)
    throw new Error("invalid process witness");
  return { pid: value.pid, birth: value.birth };
}
let localWitness: Promise<Witness> | undefined;
export function selfWitness(): Promise<Witness> {
  localWitness ??= capture().then((all) => {
    const self = all.find((p) => p.pid === process.pid);
    if (!self) throw new Error("controller birth unavailable");
    return { pid: self.pid, birth: self.birth };
  });
  return localWitness;
}
