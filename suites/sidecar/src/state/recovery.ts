import { join } from "node:path";
import { canonical, factoryKey, reduce, valid } from "@odsuite/protocol";
import { type Directory, parse as parseDirectory } from "../control/directory.js";
import { registry } from "../runtime/resource.js";
import { parse as parseBinding } from "./binding.js";
import { atomic, bytes, remove } from "./files.js";
import { baseFor, fingerprint, Inventory } from "./inventory.js";
import type { Baseline, RecoveryOptions, RecoveryPlan, RecoveryRecord } from "./types.js";

interface Write {
  path: string;
  before: string;
  after: string;
}
function writes(baseline: Baseline, id: string): Write[] {
  const output: Write[] = [];
  for (const f of baseline.factories) {
    const base = baseFor(baseline.root, f);
    if (f.registry !== undefined) {
      const state = registry(JSON.parse(f.registry), base, f.scope);
      const persistent = state.grants.filter((g) => g.scope === "factory");
      if (persistent.length !== state.grants.length)
        output.push({
          path: join(base, "registry.json"),
          before: f.registry,
          after: canonical({ ...state, grants: persistent, revision: state.revision + 1 }) + "\n",
        });
    }
    if (f.binding !== undefined) {
      const journal = parseBinding(JSON.parse(f.binding), f.scope.namespace, f.scope.channel);
      const a = journal.state.attempt;
      if (a?.status === "running") {
        const next = reduce(journal.state, {
          type: "fail",
          nonce: a.nonce,
          target: a.target,
          error: `owner interrupted; recovery ${id}`,
        });
        if (!next.ok) throw new Error("binding recovery transition refused");
        output.push({
          path: join(base, "binding.json"),
          before: f.binding,
          after: canonical({ revision: journal.revision + 1, state: next.state }) + "\n",
        });
      }
    }
  }
  return output;
}
function retired(baseline: Baseline): Directory {
  const value = structuredClone(baseline.directory);
  value.revision++;
  value.manager.phase = "closed";
  for (const f of value.factories) if (f.phase !== "unopened") f.phase = "closed";
  for (const p of value.instances) p.phase = "retired";
  for (const session of value.sessions)
    if (!["failed", "completed"].includes(session.phase)) {
      session.phase = "failed";
      session.reason = "disconnect";
    }
  return parseDirectory(value, { ...baseline.owner, phase: "closed" });
}
function plan(record: RecoveryRecord, phase: RecoveryPlan["phase"]): RecoveryPlan {
  return {
    schema: 1,
    root: record.baseline.root,
    manager: record.baseline.owner.incarnation,
    fingerprint: record.id,
    phase,
    factories: record.baseline.factories.map((f) => ({
      ...f.scope,
      retireTransient:
        f.registry === undefined
          ? 0
          : registry(JSON.parse(f.registry), baseFor(record.baseline.root, f), f.scope).grants.filter(
              (g) => g.scope === "attempt",
            ).length,
      bindingAction:
        f.binding === undefined
          ? "absent"
          : parseBinding(JSON.parse(f.binding), f.scope.namespace, f.scope.channel).state.attempt?.status === "running"
            ? "fail-attempt"
            : "retain",
    })),
  };
}
async function load(view: Inventory): Promise<RecoveryRecord> {
  const saved = view.record(view.manager.journal());
  if (saved && saved.baseline.owner.incarnation === view.current.owner.incarnation) return saved;
  if (saved && saved.phase !== "complete") throw new Error("recovery owner changed");
  if (view.current.owner.phase !== "active") throw new Error("manager has no interrupted owner");
  await view.quiescent(view.current);
  view.current.cleanup = await view.cleanup(view.current);
  return { schema: 1, id: fingerprint(view.current), phase: "prepared", baseline: view.current };
}
async function unchanged(view: Inventory, record: RecoveryRecord) {
  const before = record.baseline,
    current = view.current;
  if (
    canonical(current.owner) !== canonical(before.owner) &&
    canonical(current.owner) !== canonical({ ...before.owner, phase: "closed" })
  )
    throw new Error("owner changed during recovery");
  if (
    canonical(current.directory) !== canonical(before.directory) &&
    canonical(current.directory) !== canonical(retired(before))
  )
    throw new Error("directory changed during recovery");
  if (current.factories.length !== before.factories.length) throw new Error("factory set changed during recovery");
  const changes = writes(before, record.id);
  for (const f of before.factories) {
    const actual = current.factories.find((x) => factoryKey(x.scope) === factoryKey(f.scope));
    if (
      !actual ||
      (f.owner
        ? canonical(actual.owner) !== canonical(f.owner) &&
          canonical(actual.owner) !== canonical({ ...f.owner, phase: "closed" })
        : actual.owner !== undefined)
    )
      throw new Error("factory owner changed");
    for (const field of ["registry", "binding"] as const) {
      const patch = changes.find((x) => x.path === join(baseFor(view.root, f), `${field}.json`));
      if (actual[field] !== f[field] && actual[field] !== patch?.after) throw new Error("factory metadata changed");
    }
  }
  await view.validateCleanup(before);
}
export async function inspectRecovery(root: string): Promise<RecoveryPlan> {
  const view = await Inventory.open(root);
  try {
    const record = await load(view);
    await unchanged(view, record);
    if (record.phase === "complete") {
      await view.quiescent(record.baseline, false);
      return plan(record, "complete");
    }
    // A fresh load already holds port reservations. A resumed intent must reacquire them.
    await view.quiescent(record.baseline, view.reservations.length === 0);
    return plan(
      record,
      view.manager.journal() === undefined || (view.manager.journal() as RecoveryRecord).id !== record.id
        ? "ready"
        : "recovering",
    );
  } finally {
    await view.close();
  }
}
export async function recover(root: string, options: RecoveryOptions): Promise<RecoveryPlan> {
  if (!valid(options.expected)) throw new Error("invalid recovery fingerprint");
  const view = await Inventory.open(root);
  try {
    const record = await load(view);
    if (record.id !== options.expected) throw new Error("recovery fingerprint changed");
    await unchanged(view, record);
    if (record.phase === "complete") {
      await view.quiescent(record.baseline, false);
      return plan(record, "complete");
    }
    await view.quiescent(record.baseline, view.reservations.length === 0);
    view.manager.persist(record);
    const checkpoint = async (stage: "prepared" | "resources" | "files" | "complete") =>
      options.onCheckpoint?.(Object.freeze({ id: record.id, stage }));
    await checkpoint("prepared");
    for (const item of record.baseline.cleanup) await remove(item);
    await checkpoint("resources");
    for (const item of writes(record.baseline, record.id)) {
      const current = await bytes(item.path);
      if (current !== item.before && current !== item.after) throw new Error("recovery metadata changed before write");
      await atomic(item.path, item.after, record.id);
    }
    for (const lock of view.locks) lock.retire();
    record.phase = "files";
    view.manager.persist(record);
    await checkpoint("files");
    await view.quiescent(record.baseline, false);
    const changes = writes(record.baseline, record.id);
    for (const f of record.baseline.factories)
      for (const field of ["registry", "binding"] as const) {
        const path = join(baseFor(view.root, f), `${field}.json`);
        const expected = changes.find((item) => item.path === path)?.after ?? f[field];
        if ((await bytes(path)) !== expected) throw new Error("recovery metadata changed before completion");
      }
    record.phase = "complete";
    view.manager.complete(retired(record.baseline), record);
    await checkpoint("complete");
    return plan(record, "complete");
  } finally {
    await view.close();
  }
}
