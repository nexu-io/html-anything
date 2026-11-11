import { canonical, digest } from "@odsuite/protocol";
import { observeProcesses, readAuthority } from "@odsuite/sidecar";
import { z } from "zod";
import { type CollectionEntry, type CollectionPlan, InstallerFault, type Options } from "../types.js";
import { observations } from "../usage.js";
import { remove } from "./removal.js";
import type { Transaction } from "./transaction.js";

export class Collector {
  constructor(
    private transaction: Transaction,
    private options: Options,
    private transition: () => Promise<unknown>,
  ) {}
  private protected(values: string[]) {
    const ids = z.array(z.uuid()).max(4096).parse(values);
    if (new Set(ids).size !== ids.length) throw new InstallerFault("invalid", "duplicate protected receipt");
    for (const id of ids) this.transaction.store.receipt(id);
    return ids.sort();
  }
  async plan(protectedReceipts: string[], resume?: string): Promise<CollectionPlan> {
    const store = this.transaction.store,
      active = store.collection.read();
    if (active && active.requestId !== resume)
      throw new InstallerFault("conflict", "unfinished collection must resume first");
    if (await this.transition())
      throw new InstallerFault("conflict", "unfinished installation transition must resume first");
    const protectedIds = this.protected(protectedReceipts),
      inventory = store.inventory(),
      uses = await observations(this.transaction);
    const entries = new Map<string, CollectionEntry>();
    let runtime: unknown = null;
    if (inventory.length) {
      const roots = [...new Set(inventory.map((v) => v.receipt.data))];
      if (roots.length !== 1) throw new InstallerFault("integrity", "installation data policy changed");
      const directory = await readAuthority(roots[0]!);
      if (
        directory &&
        (directory.manager.phase !== "closed" ||
          directory.factories.some((f) => !["closed", "unopened"].includes(f.phase)) ||
          directory.instances.some((i) => i.phase !== "retired") ||
          (await observeProcesses(roots[0]!)).length)
      )
        throw new InstallerFault("conflict", "runtime must be closed and retired through sidecar before collection");
      runtime = directory ?? null;
    }
    for (const record of inventory) {
      const receipt = record.receipt;
      this.transaction.check(receipt);
      const retirement = store.collection.state(receipt.path);
      if (retirement?.state === "retired" && retirement.requestId !== resume) continue;
      let entry = entries.get(receipt.path);
      if (!entry) {
        const files = store.files(receipt);
        entry = { receipt, requests: [], bytes: files.reduce((n, f) => n + f.bytes, 0), reasons: [] };
        entries.set(receipt.path, entry);
      }
      entry.requests.push(receipt.requestId);
      if (!record.complete) entry.reasons.push("incomplete-installation");
      if (record.phase !== "selected") entry.reasons.push("unselected-preparation");
      if (store.read(receipt.carrier)?.path === receipt.path) entry.reasons.push("current-selection");
      if (protectedIds.includes(receipt.requestId)) entry.reasons.push("caller-reference");
      if (uses.some((u) => u.receipt.path === receipt.path && u.state === "alive")) entry.reasons.push("live-consumer");
      if (retirement && retirement.requestId !== resume) entry.reasons.push("retirement");
    }
    const list = [...entries.values()].sort((a, b) => a.receipt.path.localeCompare(b.receipt.path));
    for (const entry of list) {
      entry.requests.sort();
      entry.reasons = [...new Set(entry.reasons)].sort();
    }
    return {
      entries: list,
      fingerprint: digest(
        canonical({
          product: this.options.product,
          scope: this.options.scope,
          home: this.options.home,
          protectedIds,
          inventory,
          uses,
          runtime,
          entries: list,
        }),
      ),
    };
  }
  async apply(input: { requestId: string; expected: string; protectedReceipts: string[] }) {
    z.uuid().parse(input.requestId);
    if (!/^sha256:[a-f0-9]{64}$/.test(input.expected))
      throw new InstallerFault("invalid", "invalid collection fingerprint");
    const store = this.transaction.store;
    let record = store.collection.read(input.requestId);
    if (record && record.plan.fingerprint !== input.expected)
      throw new InstallerFault("idempotency", "collection request changed its plan");
    if (record?.complete) return record;
    const plan = await this.plan(input.protectedReceipts, record?.requestId);
    if (!record) {
      if (plan.fingerprint !== input.expected) throw new InstallerFault("conflict", "collection plan is stale");
      for (const entry of plan.entries.filter((e) => !e.reasons.length)) await this.transaction.verified(entry.receipt);
      record = store.collection.begin(input.requestId, plan);
      await this.options.onCollectionCheckpoint?.({ requestId: record.requestId, phase: "retiring" });
    }
    for (const entry of record.plan.entries.filter((e) => !e.reasons.length)) {
      if (record.retired.includes(entry.receipt.path)) continue;
      const current = plan.entries.find((e) => e.receipt.path === entry.receipt.path);
      if (!current || current.reasons.length || canonical(current.requests) !== canonical(entry.requests))
        throw new InstallerFault("conflict", "retiring version acquired a protection; collection retained");
      this.transaction.check(entry.receipt);
      await remove(entry.receipt.path, store.files(entry.receipt), async (path) => {
        await this.options.onCollectionCheckpoint?.({ requestId: record!.requestId, phase: "file", path });
      });
      await this.options.onCollectionCheckpoint?.({
        requestId: record.requestId,
        phase: "removed",
        path: entry.receipt.path,
      });
      store.collection.removed(record, entry.receipt.path);
    }
    store.collection.finish(record);
    await this.options.onCollectionCheckpoint?.({ requestId: record.requestId, phase: "complete" });
    return record;
  }
}
