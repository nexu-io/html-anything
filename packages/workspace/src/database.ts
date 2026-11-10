import { createHash } from "node:crypto";
import { lstatSync, mkdirSync, realpathSync } from "node:fs";
import { join } from "node:path";
import { DatabaseSync, type SQLInputValue } from "node:sqlite";
import { Fault, type Operation } from "./contract.js";
export class Database {
  readonly sql: DatabaseSync;
  constructor(root: string) {
    mkdirSync(root, { recursive: true });
    const path = join(realpathSync(root), "workspace.sqlite");
    try {
      if (!lstatSync(path).isFile()) throw new Fault("integrity", "workspace database must be a regular file");
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
    }
    this.sql = new DatabaseSync(path);
    try {
      this.sql.exec("PRAGMA busy_timeout=5000; PRAGMA foreign_keys=ON; PRAGMA synchronous=FULL;");
      this.transaction(() => {
        const version = Number(this.one("PRAGMA user_version")?.user_version);
        if (version !== 0 && version !== 3) throw new Fault("integrity", "unsupported workspace database schema");
        if (version === 0) {
          if (this.one("SELECT name FROM sqlite_master WHERE type='table'"))
            throw new Fault("integrity", "unknown workspace database");
          this.sql.exec(`
          CREATE TABLE sessions(id TEXT PRIMARY KEY,title TEXT NOT NULL,mode TEXT NOT NULL CHECK(mode='motion'),created_at INTEGER NOT NULL,last_artifact_id TEXT REFERENCES artifacts(id));
          CREATE TABLE messages(id TEXT PRIMARY KEY,session_id TEXT NOT NULL REFERENCES sessions(id),role TEXT NOT NULL CHECK(role IN ('user','assistant')),content TEXT NOT NULL,created_at INTEGER NOT NULL);
          CREATE TABLE projects(id TEXT PRIMARY KEY,current_revision TEXT NOT NULL,cursor INTEGER NOT NULL,history_version INTEGER NOT NULL);
          CREATE TABLE artifacts(id TEXT PRIMARY KEY,session_id TEXT NOT NULL REFERENCES sessions(id),project_id TEXT NOT NULL UNIQUE REFERENCES projects(id),title TEXT NOT NULL,created_at INTEGER NOT NULL);
          CREATE TABLE revisions(project_id TEXT NOT NULL REFERENCES projects(id),revision TEXT NOT NULL,files TEXT NOT NULL,resources TEXT NOT NULL,PRIMARY KEY(project_id,revision));
          CREATE TABLE resources(digest TEXT PRIMARY KEY,bytes BLOB NOT NULL);
          CREATE TABLE history(project_id TEXT NOT NULL REFERENCES projects(id),position INTEGER NOT NULL,revision TEXT NOT NULL,PRIMARY KEY(project_id,position),FOREIGN KEY(project_id,revision) REFERENCES revisions(project_id,revision));
          CREATE TABLE selection(id INTEGER PRIMARY KEY CHECK(id=1),revision INTEGER NOT NULL,session_id TEXT REFERENCES sessions(id),artifact_id TEXT REFERENCES artifacts(id));
          INSERT INTO selection VALUES(1,0,NULL,NULL);
          CREATE TABLE requests(id TEXT PRIMARY KEY,fingerprint TEXT NOT NULL,result TEXT NOT NULL);
          PRAGMA user_version=3;`);
        }
      });
    } catch (error) {
      this.sql.close();
      throw error;
    }
  }
  one(sql: string, ...args: SQLInputValue[]) {
    return this.sql.prepare(sql).get(...args);
  }
  all(sql: string, ...args: SQLInputValue[]) {
    return this.sql.prepare(sql).all(...args);
  }
  run(sql: string, ...args: SQLInputValue[]) {
    return this.sql.prepare(sql).run(...args);
  }
  transaction<T>(operation: () => T, write = true): T {
    this.sql.exec(write ? "BEGIN IMMEDIATE" : "BEGIN");
    try {
      const result = operation();
      this.sql.exec("COMMIT");
      return result;
    } catch (error) {
      this.sql.exec("ROLLBACK");
      throw error;
    }
  }
  receipt<T>(
    operation: Operation | "artifact_source_create" | "resource_source_import",
    input: object & { requestId: string },
  ): T | undefined {
    const fingerprint = createHash("sha256")
      .update(JSON.stringify([operation, input]))
      .digest("hex");
    const prior = this.one("SELECT fingerprint,result FROM requests WHERE id=?", input.requestId);
    if (!prior) return undefined;
    if (prior.fingerprint !== fingerprint)
      throw new Fault("idempotency", "requestId was already used for another payload");
    return JSON.parse(String(prior.result)) as T;
  }
  request<T>(
    operation: Operation | "artifact_source_create" | "resource_source_import",
    input: object & { requestId: string },
    perform: () => T,
  ): T {
    const fingerprint = createHash("sha256")
      .update(JSON.stringify([operation, input]))
      .digest("hex");
    return this.transaction(() => {
      const prior = this.one("SELECT fingerprint,result FROM requests WHERE id=?", input.requestId);
      if (prior) {
        if (prior.fingerprint !== fingerprint)
          throw new Fault("idempotency", "requestId was already used for another payload");
        return JSON.parse(String(prior.result)) as T;
      }
      const result = perform();
      this.run("INSERT INTO requests VALUES(?,?,?)", input.requestId, fingerprint, JSON.stringify(result));
      return result;
    });
  }
  close() {
    this.sql.close();
  }
}
