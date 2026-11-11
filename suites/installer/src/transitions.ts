import { lstatSync } from "node:fs";
import { join } from "node:path";
import { DatabaseSync } from "node:sqlite";
import { canonical } from "@odsuite/protocol";
import { z } from "zod";
import { InstallerFault, type Transition } from "./types.js";

function encoded(value: unknown) {
  const text = canonical(value);
  if (Buffer.byteLength(text) > 65536) throw new InstallerFault("invalid", "transition data exceeds limit");
  return text;
}
/** Durable installation coordination facts. Only sidecar proves runtime ownership. */
export class Transitions {
  private db: DatabaseSync;
  constructor(root: string, established: boolean) {
    const path = join(root, "transitions.sqlite");
    let exists = false;
    try {
      if (!lstatSync(path).isFile()) throw Error("transition journal is not regular");
      exists = true;
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
    }
    if (established !== exists) throw new InstallerFault("integrity", "transition journal ownership mismatch");
    this.db = new DatabaseSync(path);
    try {
      this.db.exec("PRAGMA synchronous=FULL; PRAGMA busy_timeout=5000;");
      const version = Number(this.db.prepare("PRAGMA user_version").get()?.user_version);
      if (established && version !== 1) throw Error("transition journal format changed");
      if (!established) {
        if (version || this.db.prepare("SELECT name FROM sqlite_master WHERE type='table'").get())
          throw Error("unclaimed transition journal");
        this.db.exec(
          "BEGIN IMMEDIATE; CREATE TABLE transitions(id TEXT PRIMARY KEY,intent TEXT NOT NULL,record TEXT NOT NULL); CREATE TABLE active(id INTEGER PRIMARY KEY CHECK(id=1),request_id TEXT NOT NULL); PRAGMA user_version=1; COMMIT;",
        );
      }
    } catch (error) {
      this.db.close();
      throw error;
    }
  }
  private transaction<T>(work: () => T) {
    this.db.exec("BEGIN IMMEDIATE");
    try {
      const result = work();
      this.db.exec("COMMIT");
      return result;
    } catch (error) {
      this.db.exec("ROLLBACK");
      throw error;
    }
  }
  read(requestId?: string): Transition | undefined {
    if (requestId !== undefined) z.uuid().parse(requestId);
    const id = requestId ?? this.db.prepare("SELECT request_id FROM active WHERE id=1").get()?.request_id;
    if (!id) return undefined;
    const row = this.db.prepare("SELECT intent,record FROM transitions WHERE id=?").get(id);
    if (!row) {
      if (requestId !== undefined) return undefined;
      throw new InstallerFault("integrity", "transition intent missing");
    }
    const value = JSON.parse(String(row.record)) as Transition;
    if (
      value.requestId !== id ||
      !Number.isSafeInteger(value.revision) ||
      value.revision < 0 ||
      typeof value.complete !== "boolean"
    )
      throw new InstallerFault("integrity", "invalid transition record");
    if (encoded(value.intent) !== row.intent) throw new InstallerFault("integrity", "transition intent changed");
    encoded(value.data);
    return value;
  }
  begin(input: { requestId: string; intent: unknown; data: unknown }) {
    z.uuid().parse(input.requestId);
    const intent = encoded(input.intent);
    encoded(input.data);
    return this.transaction(() => {
      const previous = this.read(input.requestId);
      if (previous) {
        if (encoded(previous.intent) !== intent)
          throw new InstallerFault("idempotency", "transition request reused for another intent");
        return previous;
      }
      if (this.read()) throw new InstallerFault("conflict", "unfinished installation transition must resume first");
      const record: Transition = { ...input, revision: 0, complete: false };
      this.db.prepare("INSERT INTO transitions VALUES(?,?,?)").run(input.requestId, intent, encoded(record));
      this.db.prepare("INSERT INTO active VALUES(1,?)").run(input.requestId);
      return record;
    });
  }
  advance(input: { requestId: string; expectedRevision: number; data: unknown; complete?: boolean }) {
    encoded(input.data);
    return this.transaction(() => {
      const old = this.read(input.requestId);
      if (!old || old.complete || old.revision !== input.expectedRevision || this.read()?.requestId !== input.requestId)
        throw new InstallerFault("conflict", "transition changed or completed");
      const next = { ...old, data: input.data, revision: old.revision + 1, complete: input.complete ?? false };
      this.db.prepare("UPDATE transitions SET record=? WHERE id=?").run(encoded(next), input.requestId);
      if (next.complete) this.db.prepare("DELETE FROM active WHERE id=1").run();
      return next;
    });
  }
  close() {
    this.db.close();
  }
}
