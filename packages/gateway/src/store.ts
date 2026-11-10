import { randomUUID } from "node:crypto";
import { lstatSync } from "node:fs";
import { join } from "node:path";
import { DatabaseSync } from "node:sqlite";
import { canonical, digest } from "@odsuite/protocol";
import { Fault } from "@open-motion/workspace/contract";
import { type GenerationInput, type Job, job } from "./contract.js";

/** Intent/status only; candidate bytes are persistent user content, not another editable project. */
export class Store {
  private db: DatabaseSync;
  private closed = false;
  constructor(root: string) {
    const path = join(root, "generations.sqlite");
    try {
      if (!lstatSync(path).isFile()) throw new Fault("integrity", "generation journal is not regular");
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
    }
    this.db = new DatabaseSync(path);
    try {
      this.db.exec("PRAGMA busy_timeout=5000; PRAGMA synchronous=FULL;");
      const version = Number(this.db.prepare("PRAGMA user_version").get()?.user_version);
      if (version === 0) {
        if (this.db.prepare("SELECT name FROM sqlite_master WHERE type='table'").get())
          throw new Fault("integrity", "unknown generation journal");
        this.db.exec(
          "BEGIN IMMEDIATE; CREATE TABLE jobs(id TEXT PRIMARY KEY,record TEXT NOT NULL); CREATE TABLE requests(id TEXT PRIMARY KEY,fingerprint TEXT NOT NULL,result TEXT NOT NULL); PRAGMA user_version=1; COMMIT;",
        );
      } else if (version !== 1) throw new Fault("integrity", "unsupported generation journal");
      this.scan();
    } catch (error) {
      this.db.close();
      throw error;
    }
  }
  private decode(value: unknown): Job {
    let parsed: unknown;
    try {
      parsed = JSON.parse(String(value));
    } catch {
      throw new Fault("integrity", "invalid generation journal");
    }
    const result = job.safeParse(parsed);
    if (!result.success) throw new Fault("integrity", "invalid generation record");
    const data = result.data;
    const validSubmission =
      data.state === "queued"
        ? data.submission === "not-started"
        : data.state === "submitting"
          ? data.submission === "unknown"
          : ["running", "succeeded", "failed"].includes(data.state)
            ? data.submission === "accepted"
            : data.state === "cancelled"
              ? data.submission !== "unknown"
              : data.submission !== "not-started";
    if (
      !validSubmission ||
      (data.submission === "accepted") !== !!data.remoteId ||
      (data.candidate &&
        (data.candidate.jobId !== data.id ||
          data.candidate.providerId !== data.providerId ||
          data.candidate.providerVersion !== data.providerVersion ||
          data.candidate.modelId !== data.modelId)) ||
      (data.state === "succeeded" && !data.candidate)
    )
      throw new Fault("integrity", "inconsistent generation record");
    return data;
  }
  scan(): Job[] {
    return this.db
      .prepare("SELECT record FROM jobs ORDER BY rowid")
      .all()
      .map((row) => this.decode(row.record));
  }
  read(id: string): Job {
    const row = this.db.prepare("SELECT record FROM jobs WHERE id=?").get(id);
    if (!row) throw new Fault("missing", "generation job is missing");
    const value = this.decode(row.record);
    if (value.id !== id) throw new Fault("integrity", "generation row identity mismatch");
    return value;
  }
  owned(input: { id: string; sessionId: string; artifactId: string }) {
    const value = this.read(input.id);
    if (value.sessionId !== input.sessionId || value.artifactId !== input.artifactId)
      throw new Fault("ownership", "generation belongs to another artifact");
    return value;
  }
  list(input: GenerationInput<"generation_list">) {
    if (input.before) this.owned({ ...input, id: input.before });
    const limit = input.limit ?? 12;
    const rows = this.db
      .prepare(
        "SELECT record FROM jobs WHERE json_extract(record,'$.sessionId')=? AND json_extract(record,'$.artifactId')=? AND (? IS NULL OR rowid<(SELECT rowid FROM jobs WHERE id=?)) ORDER BY rowid DESC LIMIT ?",
      )
      .all(input.sessionId, input.artifactId, input.before ?? null, input.before ?? null, limit + 1);
    const jobs: Job[] = [];
    for (const row of rows.slice(0, limit)) {
      const value = this.decode(row.record);
      const bytes = Buffer.byteLength(JSON.stringify({ jobs: [...jobs, value], next: value.id }));
      if (bytes > 48 * 1024 && jobs.length) break;
      // Escaped legal text can exceed the normal page target; never hide a complete first job.
      if (bytes > 60 * 1024) throw new Fault("integrity", "generation record exceeds the control projection budget");
      jobs.push(value);
    }
    return { jobs, next: rows.length > jobs.length ? (jobs.at(-1)?.id ?? null) : null };
  }
  write(value: Job) {
    value.version++;
    value.updatedAt = Date.now();
    const checked = this.decode(JSON.stringify(value));
    this.db.prepare("UPDATE jobs SET record=? WHERE id=?").run(JSON.stringify(checked), value.id);
  }
  private request(operation: string, input: { requestId: string }, perform: () => Job): Job {
    this.db.exec("BEGIN IMMEDIATE");
    try {
      const fingerprint = digest(canonical({ operation, input })),
        prior = this.db.prepare("SELECT * FROM requests WHERE id=?").get(input.requestId);
      if (prior && prior.fingerprint !== fingerprint)
        throw new Fault("idempotency", "generation requestId reused with a different intent");
      const value = prior ? this.decode(prior.result) : perform();
      if (!prior)
        this.db.prepare("INSERT INTO requests VALUES(?,?,?)").run(input.requestId, fingerprint, JSON.stringify(value));
      this.db.exec("COMMIT");
      return value;
    } catch (error) {
      this.db.exec("ROLLBACK");
      throw error;
    }
  }
  create(input: GenerationInput<"generation_create">, available: () => void): Job {
    return this.request("generation_create", input, () => {
      available();
      if (
        this.scan().filter(
          (value) =>
            ["queued", "submitting", "running", "cancelling"].includes(value.state) ||
            (value.state === "interrupted" && value.submission !== "not-started"),
        ).length >= 32
      )
        throw new Fault("invalid", "generation queue is full; unresolved tasks require reconciliation");
      const now = Date.now(),
        value: Job = {
          ...input,
          id: randomUUID(),
          version: 0,
          state: "queued",
          submission: "not-started",
          createdAt: now,
          updatedAt: now,
        };
      this.db.prepare("INSERT INTO jobs VALUES(?,?)").run(value.id, JSON.stringify(value));
      return value;
    });
  }
  cancel(input: GenerationInput<"generation_cancel">, committed?: (id: string) => void): Job {
    let changed = false;
    const result = this.request("generation_cancel", input, () => {
      const value = this.owned(input);
      if (value.version !== input.expectedVersion) throw new Fault("conflict", "generation version changed");
      if (["succeeded", "failed", "cancelled"].includes(value.state))
        throw new Fault("conflict", "generation is already terminal");
      value.state = value.submission === "not-started" ? "cancelled" : "cancelling";
      this.write(value);
      changed = true;
      return value;
    });
    if (changed) committed?.(result.id);
    return result;
  }
  close() {
    if (!this.closed) {
      this.db.close();
      this.closed = true;
    }
  }
}
