import type { DatabaseSync } from "node:sqlite";
import { canonical, digest } from "@odsuite/protocol";
import { z } from "zod";
import { type CollectionPlan, type CollectionRecord, InstallerFault } from "../types.js";

/** Durable code-retirement facts, never process or user-data authority. */
export class CollectionJournal {
  constructor(private db: DatabaseSync) {}
  state(path: string): { requestId: string; state: "retiring" | "retired" } | undefined {
    const row = this.db.prepare("SELECT request_id,state FROM retirements WHERE path=?").get(path);
    if (!row) return undefined;
    if (!["retiring", "retired"].includes(String(row.state)))
      throw new InstallerFault("integrity", "invalid retirement state");
    return { requestId: String(row.request_id), state: row.state as "retiring" | "retired" };
  }
  read(id?: string): CollectionRecord | undefined {
    if (id !== undefined) z.uuid().parse(id);
    const rows =
      id === undefined
        ? this.db
            .prepare("SELECT id,record,hash FROM collections WHERE json_extract(record,'$.complete')=0 LIMIT 2")
            .all()
        : this.db.prepare("SELECT id,record,hash FROM collections WHERE id=?").all(id);
    if (rows.length > 1) throw new InstallerFault("integrity", "multiple pending collections");
    const row = rows[0];
    if (!row) return undefined;
    if (digest(String(row.record)) !== row.hash)
      throw new InstallerFault("integrity", "collection journal content changed");
    const record = JSON.parse(String(row.record)) as CollectionRecord;
    if (
      record.requestId !== row.id ||
      typeof record.complete !== "boolean" ||
      !Array.isArray(record.retired) ||
      !Array.isArray(record.plan?.entries) ||
      !/^sha256:[a-f0-9]{64}$/.test(record.plan.fingerprint) ||
      record.plan.entries.length > 4096 ||
      record.retired.some((path) => !record.plan.entries.some((e) => e.receipt.path === path && !e.reasons.length))
    )
      throw new InstallerFault("integrity", "invalid collection record");
    return record;
  }
  begin(requestId: string, plan: CollectionPlan): CollectionRecord {
    z.uuid().parse(requestId);
    if (this.read()) throw new InstallerFault("conflict", "unfinished collection must resume first");
    const record: CollectionRecord = { requestId, plan, retired: [], complete: false };
    this.db.exec("BEGIN IMMEDIATE");
    try {
      this.db
        .prepare("INSERT INTO collections VALUES(?,?,?)")
        .run(requestId, canonical(record), digest(canonical(record)));
      for (const entry of plan.entries.filter((e) => !e.reasons.length))
        this.db.prepare("INSERT INTO retirements VALUES(?,?,?)").run(entry.receipt.path, requestId, "retiring");
      this.db.exec("COMMIT");
      return record;
    } catch (error) {
      this.db.exec("ROLLBACK");
      throw error;
    }
  }
  removed(record: CollectionRecord, path: string) {
    this.db.exec("BEGIN IMMEDIATE");
    try {
      const changed = this.db
        .prepare("UPDATE retirements SET state='retired' WHERE path=? AND request_id=? AND state='retiring'")
        .run(path, record.requestId);
      if (changed.changes !== 1) throw new InstallerFault("integrity", "retirement intent changed");
      record.retired.push(path);
      this.db
        .prepare("UPDATE collections SET record=?,hash=? WHERE id=?")
        .run(canonical(record), digest(canonical(record)), record.requestId);
      this.db.exec("COMMIT");
    } catch (error) {
      this.db.exec("ROLLBACK");
      throw error;
    }
  }
  finish(record: CollectionRecord) {
    if (record.plan.entries.filter((e) => !e.reasons.length).some((e) => !record.retired.includes(e.receipt.path)))
      throw new InstallerFault("integrity", "collection has unfinished retirements");
    record.complete = true;
    this.db
      .prepare("UPDATE collections SET record=?,hash=? WHERE id=?")
      .run(canonical(record), digest(canonical(record)), record.requestId);
    return record;
  }
}
