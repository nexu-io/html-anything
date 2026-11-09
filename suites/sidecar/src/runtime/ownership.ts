import { randomUUID } from "node:crypto";
import { lstat, mkdir, open, realpath } from "node:fs/promises";
import { basename, dirname, join } from "node:path";
import { DatabaseSync } from "node:sqlite";
import { capture } from "../process/observe.js";

export interface EndpointWitness {
  path: string;
  dev: number;
  ino: number;
  ctime: number;
}
export interface OwnerRecord {
  schema: 3;
  format: "stamped-supervisor";
  directory: boolean;
  scope: string;
  incarnation: string;
  pid: number;
  birth: string;
  endpoint?: EndpointWitness;
  phase: "active" | "closed";
}

// SQLite's exclusive locking mode retains the OS lock across commits. Keeping
// the database open fences other processes while the committed owner survives a
// crash. Never unlink this file, steal by PID/mtime, or treat a partial claim as absent.
export class Ownership {
  readonly fresh: boolean;
  readonly incarnation: string;
  private closed = false;
  private directory = false;
  private birth = "";
  private endpoint?: EndpointWitness;
  private constructor(
    private db: DatabaseSync,
    readonly previous: OwnerRecord | undefined,
    private scope: string,
    fresh: boolean,
    incarnation?: string,
  ) {
    this.incarnation = incarnation ?? randomUUID();
    this.fresh = fresh;
  }

  static async claim(path: string, incarnation?: string): Promise<Ownership> {
    await mkdir(dirname(path), { recursive: true, mode: 0o700 });
    const parent = await realpath(dirname(path));
    const scope = join(parent, basename(path));
    let fresh = false;
    try {
      const file = await open(scope, "wx", 0o600);
      await file.close();
      fresh = true;
    } catch (fault) {
      if ((fault as NodeJS.ErrnoException).code !== "EEXIST") throw fault;
    }
    if (!(await lstat(scope)).isFile()) throw new Error("ownership must be a regular file");
    const db = new DatabaseSync(scope, { timeout: 0 });
    try {
      db.exec("PRAGMA locking_mode=EXCLUSIVE");
      // A reader of the just-created, unpublished file can briefly win SQLite's
      // lock before its unique creator initializes the schema. Only that creator
      // retries; no contender can use this wait to take over an existing claim.
      const deadline = Date.now() + 500;
      for (;;) {
        try {
          db.exec("BEGIN EXCLUSIVE");
          break;
        } catch (fault) {
          if (!fresh || (fault as { errcode?: number }).errcode !== 5 || Date.now() >= deadline) throw fault;
          await new Promise((done) => setTimeout(done, 5));
        }
      }
      if (fresh) db.exec("CREATE TABLE authority (id INTEGER PRIMARY KEY CHECK(id=1), record TEXT NOT NULL) STRICT;");
      const row = db.prepare("SELECT record FROM authority WHERE id=1").get();
      if (!row && !fresh) throw new Error("ownership is unpublished; recovery required");
      let previous: OwnerRecord | undefined;
      if (row) {
        const value = Ownership.decode(row.record, scope);
        if (db.prepare("SELECT name FROM sqlite_schema WHERE name='recovery'").get()) {
          const journal = db.prepare("SELECT record FROM recovery WHERE id=1").get();
          if (!journal || JSON.parse(String(journal.record)).phase !== "complete")
            throw new Error("ownership recovery incomplete; recovery required");
        }
        if (value.phase === "active") throw new Error("ownership was interrupted; recovery required");
        previous = value;
      }
      const owner = new Ownership(db, previous, scope, fresh, incarnation);
      owner.directory = previous?.directory === true;
      const self = (await capture()).find((p) => p.pid === process.pid);
      if (!self) throw new Error("owner birth witness unavailable");
      owner.birth = self.birth;
      owner.save("active");
      db.exec("COMMIT");
      return owner;
    } catch (fault) {
      db.close();
      if ([5, 6].includes((fault as { errcode?: number }).errcode ?? 0))
        throw new Error("ownership is held by another manager", { cause: fault });
      if (fault instanceof Error && fault.message.startsWith("ownership")) throw fault;
      throw new Error("ownership is invalid or unpublished; recovery required", { cause: fault });
    }
  }

  // Release after verified normal drain only. Failed startup/cleanup uses abandon
  // so the next opener sees an interrupted authority and cannot erase resources.
  close(): void {
    if (this.closed) return;
    this.db.exec("BEGIN EXCLUSIVE");
    try {
      this.save("closed");
      this.db.exec("COMMIT");
    } catch (fault) {
      this.db.exec("ROLLBACK");
      throw fault;
    }
    this.db.close();
    this.closed = true;
  }

  abandon(): void {
    if (this.closed) return;
    this.db.close();
    this.closed = true;
  }

  get info(): OwnerRecord {
    if (this.closed) throw new Error("ownership is closed");
    return {
      schema: 3,
      format: "stamped-supervisor",
      scope: this.scope,
      incarnation: this.incarnation,
      pid: process.pid,
      birth: this.birth,
      ...(this.endpoint ? { endpoint: this.endpoint } : {}),
      phase: "active",
      directory: this.directory,
    };
  }
  readDirectory(): unknown {
    this.info;
    return Ownership.data(this.db);
  }
  writeDirectory(value: unknown): void {
    this.info;
    this.db.exec("BEGIN EXCLUSIVE");
    const before = this.directory;
    try {
      this.db.exec(
        "CREATE TABLE IF NOT EXISTS directory (id INTEGER PRIMARY KEY CHECK(id=1), record TEXT NOT NULL) STRICT",
      );
      this.db.prepare("INSERT OR REPLACE INTO directory(id,record) VALUES(1,?)").run(JSON.stringify(value));
      this.directory = true;
      this.save("active");
      this.db.exec("COMMIT");
    } catch (fault) {
      this.directory = before;
      this.db.exec("ROLLBACK");
      throw fault;
    }
  }
  static async inspect<T = undefined>(
    path: string,
    read?: () => Promise<T>,
  ): Promise<{ owner: OwnerRecord; directory: unknown; value?: T }> {
    const scope = join(await realpath(dirname(path)), basename(path));
    if (!(await lstat(scope)).isFile()) throw new Error("ownership must be a regular file");
    const db = new DatabaseSync(scope, { readOnly: true, timeout: 0 });
    try {
      db.exec("BEGIN");
      const row = db.prepare("SELECT record FROM authority WHERE id=1").get();
      const owner = Ownership.decode(row?.record, scope);
      const directory = Ownership.data(db);
      const value = await read?.();
      db.exec("COMMIT");
      return { owner, directory, value };
    } catch (fault) {
      if ([5, 6].includes((fault as { errcode?: number }).errcode ?? 0))
        throw new Error("directory is held; query the active manager", { cause: fault });
      throw new Error("directory is invalid or unpublished; recovery required", { cause: fault });
    } finally {
      db.close();
    }
  }
  static data(db: DatabaseSync): unknown {
    if (!db.prepare("SELECT name FROM sqlite_schema WHERE type='table' AND name='directory'").get()) return undefined;
    const row = db.prepare("SELECT record FROM directory WHERE id=1").get();
    if (!row) throw new Error("directory is unpublished; recovery required");
    return JSON.parse(String(row.record));
  }
  static decode(raw: unknown, scope: string): OwnerRecord {
    const value = JSON.parse(String(raw)) as OwnerRecord;
    if (
      value?.schema !== 3 ||
      value.format !== "stamped-supervisor" ||
      value.scope !== scope ||
      typeof value.incarnation !== "string" ||
      !/^[0-9a-f-]{36}$/.test(value.incarnation) ||
      !Number.isSafeInteger(value.pid) ||
      value.pid < 1 ||
      typeof value.birth !== "string" ||
      !value.birth ||
      !["active", "closed"].includes(value.phase) ||
      typeof value.directory !== "boolean"
    )
      throw new Error("ownership is invalid or unpublished; recovery required");
    if (
      value.endpoint &&
      (typeof value.endpoint.path !== "string" ||
        !value.endpoint.path ||
        !Number.isSafeInteger(value.endpoint.dev) ||
        !Number.isSafeInteger(value.endpoint.ino) ||
        !Number.isFinite(value.endpoint.ctime))
    )
      throw new Error("invalid endpoint witness");
    return value;
  }
  publishEndpoint(endpoint: EndpointWitness): void {
    this.info;
    this.db.exec("BEGIN EXCLUSIVE");
    try {
      this.endpoint = endpoint;
      this.save("active");
      this.db.exec("COMMIT");
    } catch (error) {
      this.db.exec("ROLLBACK");
      throw error;
    }
  }

  private save(phase: OwnerRecord["phase"]): void {
    const record: OwnerRecord = {
      schema: 3,
      format: "stamped-supervisor",
      directory: this.directory,
      scope: this.scope,
      incarnation: this.incarnation,
      pid: process.pid,
      birth: this.birth,
      ...(this.endpoint ? { endpoint: this.endpoint } : {}),
      phase,
    };
    this.db.prepare("INSERT OR REPLACE INTO authority(id,record) VALUES(1,?)").run(JSON.stringify(record));
  }
}
