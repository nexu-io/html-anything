import { lstatSync } from "node:fs";
import { join } from "node:path";
import { DatabaseSync } from "node:sqlite";
import { canonical, digest } from "@odsuite/protocol";
import { z } from "zod";
import type { File } from "./archive.js";
import { InstallerFault, type Receipt } from "./types.js";

const text = z.string().min(1).max(4096),
  sha = z.string().regex(/^[a-f0-9]{64}$/),
  uuid = z.uuid();
const file = z.strictObject({
  path: z.string().min(1).max(240),
  bytes: z
    .number()
    .int()
    .nonnegative()
    .max(64 * 1024 ** 2),
  sha256: sha,
  mode: z.union([z.literal(420), z.literal(493)]),
});
const receipt = z
  .strictObject({
    requestId: uuid,
    product: text,
    carrier: text,
    channel: text,
    namespace: text,
    version: text,
    digest: z.string().regex(/^sha256:[a-f0-9]{64}$/),
    path: text,
    data: text,
  })
  .transform((value) => ({ ...value, digest: value.digest as Receipt["digest"] }));
const intent = z.strictObject({
  receipt,
  fingerprint: z.string().regex(/^sha256:[a-f0-9]{64}$/),
  files: z.array(file).min(1).max(4096),
  phase: z.enum(["intent", "materialized", "installed", "selected"]),
  previous: uuid.nullable(),
  stages: z.array(uuid).max(32),
});
export type Intent = z.infer<typeof intent>;
const decode = <T>(schema: z.ZodType<T>, input: unknown): T => {
  try {
    return schema.parse(JSON.parse(String(input)));
  } catch {
    throw new InstallerFault("integrity", "invalid installation journal record");
  }
};
export const fingerprint = (value: {
  requestId: string;
  data: string;
  sha256: string;
  product: string;
  channel: string;
  namespace: string;
}) => digest(canonical(value));
/** Artifact intent/selection/receipt authority only. OS authority belongs exclusively to sidecar. */
export class Store {
  private db: DatabaseSync;
  private closed = false;
  constructor(root: string) {
    const path = join(root, "installations.sqlite");
    try {
      if (!lstatSync(path).isFile()) throw new InstallerFault("integrity", "installation journal is not regular");
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
    }
    this.db = new DatabaseSync(path);
    try {
      this.db.exec("PRAGMA foreign_keys=ON; PRAGMA busy_timeout=5000; PRAGMA synchronous=FULL;");
      const version = Number(this.db.prepare("PRAGMA user_version").get()?.user_version);
      if (version === 0) {
        if (this.db.prepare("SELECT name FROM sqlite_master WHERE type='table'").get())
          throw new InstallerFault("integrity", "unknown installation journal");
        this.db.exec(
          "BEGIN IMMEDIATE; CREATE TABLE policy(id INTEGER PRIMARY KEY CHECK(id=1),data TEXT NOT NULL); CREATE TABLE versions(carrier TEXT NOT NULL,version TEXT NOT NULL,digest TEXT NOT NULL,files TEXT NOT NULL,PRIMARY KEY(carrier,version)); CREATE TABLE intents(id TEXT PRIMARY KEY,record TEXT NOT NULL); CREATE TABLE receipts(id TEXT PRIMARY KEY,fingerprint TEXT NOT NULL,result TEXT NOT NULL); CREATE TABLE selections(carrier TEXT PRIMARY KEY,request_id TEXT NOT NULL REFERENCES receipts(id)); PRAGMA user_version=1; COMMIT;",
        );
      } else if (version !== 1) throw new InstallerFault("integrity", "unsupported installation journal");
    } catch (error) {
      this.db.close();
      throw error;
    }
  }
  private transaction<T>(work: () => T): T {
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
  lookup(id: string, fingerprint: string) {
    const row = this.db.prepare("SELECT * FROM receipts WHERE id=?").get(id);
    if (!row) return undefined;
    if (row.fingerprint !== fingerprint)
      throw new InstallerFault("idempotency", "installation requestId reused for another intent");
    const result = decode(receipt, row.result);
    if (result.requestId !== id) throw new InstallerFault("integrity", "installation receipt identity changed");
    return result;
  }
  pending(id: string, fingerprint: string) {
    const row = this.db.prepare("SELECT record FROM intents WHERE id=?").get(id);
    if (!row) return undefined;
    const value = decode(intent, row.record);
    if (value.receipt.requestId !== id) throw new InstallerFault("integrity", "installation intent identity changed");
    if (value.fingerprint !== fingerprint)
      throw new InstallerFault("idempotency", "installation requestId reused for another intent");
    return value;
  }
  prepare(value: Receipt, fingerprint: string, files: File[]) {
    return this.transaction(() => {
      const old = this.pending(value.requestId, fingerprint);
      if (old) return old;
      const policy = this.db.prepare("SELECT data FROM policy WHERE id=1").get();
      if (policy && policy.data !== value.data)
        throw new InstallerFault("conflict", "installation runtime data path changed");
      const version = this.db
        .prepare("SELECT digest,files FROM versions WHERE carrier=? AND version=?")
        .get(value.carrier, value.version);
      if (version && (version.digest !== value.digest || version.files !== JSON.stringify(files)))
        throw new InstallerFault("conflict", "immutable carrier version already has different content");
      this.db.prepare("INSERT OR IGNORE INTO policy VALUES(1,?)").run(value.data);
      this.db
        .prepare("INSERT OR IGNORE INTO versions VALUES(?,?,?,?)")
        .run(value.carrier, value.version, value.digest, JSON.stringify(files));
      const selected = this.db.prepare("SELECT request_id FROM selections WHERE carrier=?").get(value.carrier);
      const installed =
        version &&
        this.db
          .prepare(
            "SELECT id FROM receipts WHERE json_extract(result,'$.carrier')=? AND json_extract(result,'$.version')=? AND json_extract(result,'$.digest')=? LIMIT 1",
          )
          .get(value.carrier, value.version, value.digest);
      const record: Intent = {
        receipt: value,
        fingerprint,
        files,
        phase: installed ? "installed" : "intent",
        previous: selected ? String(selected.request_id) : null,
        stages: [],
      };
      this.db.prepare("INSERT INTO intents VALUES(?,?)").run(value.requestId, JSON.stringify(record));
      return record;
    });
  }
  save(value: Intent) {
    const checked = intent.parse(value);
    this.db.prepare("UPDATE intents SET record=? WHERE id=?").run(JSON.stringify(checked), value.receipt.requestId);
  }
  files(value: Receipt) {
    const row = this.db
      .prepare("SELECT digest,files FROM versions WHERE carrier=? AND version=?")
      .get(value.carrier, value.version);
    if (!row || row.digest !== value.digest)
      throw new InstallerFault("integrity", "installed version manifest is missing or changed");
    return decode(z.array(file).min(1).max(4096), row.files);
  }
  read(carrier: string) {
    const row = this.db
      .prepare("SELECT r.result FROM selections s JOIN receipts r ON r.id=s.request_id WHERE s.carrier=?")
      .get(carrier);
    return row ? decode(receipt, row.result) : undefined;
  }
  complete(value: Intent) {
    return this.transaction(() => {
      const prior = this.lookup(value.receipt.requestId, value.fingerprint);
      if (prior) return prior;
      const selected = this.db.prepare("SELECT request_id FROM selections WHERE carrier=?").get(value.receipt.carrier);
      if ((selected ? String(selected.request_id) : null) !== value.previous)
        throw new InstallerFault("conflict", "installation selection changed while the intent was interrupted");
      this.db
        .prepare("INSERT INTO receipts VALUES(?,?,?)")
        .run(value.receipt.requestId, value.fingerprint, JSON.stringify(value.receipt));
      this.db
        .prepare("INSERT INTO selections VALUES(?,?) ON CONFLICT(carrier) DO UPDATE SET request_id=excluded.request_id")
        .run(value.receipt.carrier, value.receipt.requestId);
      value.phase = "selected";
      this.save(value);
      return value.receipt;
    });
  }
  close() {
    if (!this.closed) {
      this.db.close();
      this.closed = true;
    }
  }
}
