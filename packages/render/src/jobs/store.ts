import { randomUUID } from "node:crypto";
import { lstatSync } from "node:fs";
import { join } from "node:path";
import { DatabaseSync } from "node:sqlite";
import { canonical, digest } from "@odsuite/protocol";
import { Fault } from "@open-motion/workspace/contract";
import { z } from "zod";
import type { ExportInput, ExportOperation, Job, Projection } from "./contract.js";
import { fps, specification } from "./contract.js";

export interface Record {
  job: Job;
  projection: Projection;
  diagnostic?: string;
}
const active = new Set(["preparing", "capturing", "encoding", "verifying", "cancelling", "recovering"]);
const hash = z.string().regex(/^sha256:[a-f0-9]{64}$/),
  number = z.number().finite().nonnegative();
const film = z.strictObject({
  id: z.uuid(),
  revision: hash,
  sessionId: z.uuid(),
  artifactId: z.uuid(),
  spec: specification,
  verification: z.strictObject({
    digest: hash,
    bytes: number,
    frames: number,
    duration: number,
    audio: z.boolean(),
    seek: z.array(number).length(3),
  }),
  toolchain: z.strictObject({ browser: hash, ffmpeg: hash, ffprobe: hash }),
});
const saved = z.strictObject({
  diagnostic: z.string().max(8192).optional(),
  projection: z.strictObject({
    digest: hash,
    bytes: z
      .number()
      .int()
      .positive()
      .max(128 * 1024 ** 2),
  }),
  job: z.strictObject({
    id: z.uuid(),
    sessionId: z.uuid(),
    artifactId: z.uuid(),
    revision: hash,
    fps,
    version: z.number().int().nonnegative(),
    attempt: z.uuid(),
    state: z.enum([
      "queued",
      "preparing",
      "capturing",
      "encoding",
      "verifying",
      "cancelling",
      "succeeded",
      "failed",
      "cancelled",
      "interrupted",
      "recovering",
    ]),
    createdAt: number,
    updatedAt: number,
    result: film.optional(),
    error: z.string().max(512).optional(),
  }),
});
const decode = (value: unknown): Record => {
  const parsed = saved.safeParse(JSON.parse(String(value)));
  if (!parsed.success) throw new Fault("integrity", "invalid export journal record");
  return parsed.data as Record;
};
/** Export intent journal only. Source/media/history stay in workspace; process facts stay in sidecar. */
export class Store {
  private db: DatabaseSync;
  constructor(root: string) {
    const path = join(root, "exports.sqlite");
    try {
      if (!lstatSync(path).isFile()) throw Error("export journal must be a regular file");
    } catch (e) {
      if ((e as NodeJS.ErrnoException).code !== "ENOENT") throw e;
    }
    this.db = new DatabaseSync(path);
    try {
      this.db.exec("PRAGMA busy_timeout=5000; PRAGMA synchronous=FULL;");
      const version = Number(this.db.prepare("PRAGMA user_version").get()?.user_version);
      if (version === 0) {
        if (this.db.prepare("SELECT name FROM sqlite_master WHERE type='table'").get())
          throw Error("unknown export journal");
        this.db.exec(
          "CREATE TABLE jobs(id TEXT PRIMARY KEY,record TEXT NOT NULL); CREATE TABLE requests(id TEXT PRIMARY KEY,fingerprint TEXT NOT NULL,result TEXT NOT NULL); CREATE INDEX job_state ON jobs(json_extract(record,'$.job.state')); CREATE INDEX job_owner ON jobs(json_extract(record,'$.job.sessionId'),json_extract(record,'$.job.artifactId')); PRAGMA user_version=1;",
        );
      } else if (version !== 1) throw Error("unsupported export journal");
    } catch (e) {
      this.db.close();
      throw e;
    }
  }
  private transaction<T>(work: () => T): T {
    this.db.exec("BEGIN IMMEDIATE");
    try {
      const result = work();
      this.db.exec("COMMIT");
      return result;
    } catch (e) {
      this.db.exec("ROLLBACK");
      throw e;
    }
  }
  private request<T>(op: ExportOperation, input: { requestId: string }, work: () => T): T {
    return this.transaction(() => {
      const fingerprint = digest(canonical({ op, input })),
        existing = this.db.prepare("SELECT * FROM requests WHERE id=?").get(input.requestId);
      if (existing) {
        if (existing.fingerprint !== fingerprint)
          throw new Fault("idempotency", "export request identity reused with different input");
        return JSON.parse(String(existing.result)) as T;
      }
      const result = work();
      this.db.prepare("INSERT INTO requests VALUES(?,?,?)").run(input.requestId, fingerprint, JSON.stringify(result));
      return result;
    });
  }
  scan(states: string[]): Record[] {
    return this.db
      .prepare(
        `SELECT record FROM jobs WHERE json_extract(record,'$.job.state') IN (${states.map(() => "?").join(",")}) ORDER BY rowid`,
      )
      .all(...states)
      .map((r) => decode(r.record));
  }
  list(input: ExportInput<"export_list">) {
    const before = input.before ? this.owned({ ...input, id: input.before }).job.id : null;
    const rows = this.db
        .prepare(
          "SELECT record FROM jobs WHERE json_extract(record,'$.job.sessionId')=? AND json_extract(record,'$.job.artifactId')=? AND (? IS NULL OR rowid<(SELECT rowid FROM jobs WHERE id=?)) ORDER BY rowid DESC LIMIT ?",
        )
        .all(input.sessionId, input.artifactId, before, before, (input.limit ?? 12) + 1),
      jobs = rows.slice(0, input.limit ?? 12).map((r) => decode(r.record).job);
    return { jobs, next: rows.length > (input.limit ?? 12) ? jobs.at(-1)!.id : null };
  }
  read(id: string): Record {
    const row = this.db.prepare("SELECT record FROM jobs WHERE id=?").get(id);
    if (!row) throw new Fault("missing", "export job missing");
    return decode(row.record);
  }
  owned(input: { id: string; sessionId: string; artifactId: string }): Record {
    const record = this.read(input.id);
    if (record.job.sessionId !== input.sessionId || record.job.artifactId !== input.artifactId)
      throw new Fault("ownership", "export does not belong to artifact");
    return record;
  }
  write(record: Record, bump = true) {
    if (bump) record.job.version++;
    record.job.updatedAt = Date.now();
    this.db.prepare("UPDATE jobs SET record=? WHERE id=?").run(JSON.stringify(record), record.job.id);
  }
  create(input: ExportInput<"export_create"> & { projection: Projection }): Job {
    return this.request("export_create", input, () => {
      if (this.scan(["queued", ...active]).length >= 32) throw new Fault("invalid", "export queue is full");
      const now = Date.now(),
        record: Record = {
          projection: input.projection,
          job: {
            id: randomUUID(),
            sessionId: input.sessionId,
            artifactId: input.artifactId,
            revision: input.revision,
            fps: input.fps,
            version: 0,
            attempt: randomUUID(),
            state: "queued",
            createdAt: now,
            updatedAt: now,
          },
        };
      this.db.prepare("INSERT INTO jobs VALUES(?,?)").run(record.job.id, JSON.stringify(record));
      return record.job;
    });
  }
  control(operation: "export_cancel" | "export_retry", input: ExportInput<"export_cancel">): Job {
    return this.request(operation, input, () => {
      const record = this.owned(input),
        job = record.job;
      if (job.version !== input.expectedVersion)
        throw new Fault("conflict", "export job changed; refresh before control");
      if (operation === "export_retry") {
        if (!["failed", "cancelled", "interrupted"].includes(job.state))
          throw new Fault("invalid", "export cannot retry in its current state");
        if (this.scan(["queued", ...active]).length >= 32) throw new Fault("invalid", "export queue is full");
        delete record.diagnostic;
        job.attempt = randomUUID();
        job.state = "queued";
        delete job.result;
        delete job.error;
      } else {
        if (job.state === "recovering")
          throw new Fault("invalid", "execution ownership requires explicit sidecar recovery");
        if (job.state === "queued") job.state = "cancelled";
        else if (active.has(job.state)) job.state = "cancelling";
        else throw new Fault("invalid", "export is already terminal");
      }
      this.write(record);
      return job;
    });
  }
  close() {
    this.db.close();
  }
}
