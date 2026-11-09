import { lstat, realpath } from "node:fs/promises";
import { basename, dirname, join } from "node:path";
import { DatabaseSync } from "node:sqlite";
import type { Directory } from "../control/directory.js";
import { type OwnerRecord, Ownership } from "../runtime/ownership.js";

/** Holds the existing OS authority; never creates or claims a replacement. */
export class AuthorityLock {
  private constructor(
    readonly path: string,
    private db: DatabaseSync,
    readonly owner: OwnerRecord,
    readonly directory: unknown,
  ) {}
  static async open(path: string) {
    path = join(await realpath(dirname(path)), basename(path));
    if (!(await lstat(path)).isFile()) throw new Error("authority must be a regular file");
    const db = new DatabaseSync(path, { timeout: 0 });
    try {
      db.exec("PRAGMA locking_mode=EXCLUSIVE; PRAGMA synchronous=FULL; BEGIN EXCLUSIVE");
      const row = db.prepare("SELECT record FROM authority WHERE id=1").get();
      const owner = Ownership.decode(row?.record, path);
      const directory = Ownership.data(db);
      db.exec("COMMIT");
      return new AuthorityLock(path, db, owner, directory);
    } catch (error) {
      db.close();
      throw new Error("authority unavailable; recovery blocked", { cause: error });
    }
  }
  journal(): unknown {
    if (!this.db.prepare("SELECT name FROM sqlite_schema WHERE name='recovery'").get()) return undefined;
    const row = this.db.prepare("SELECT record FROM recovery WHERE id=1").get();
    if (!row) throw new Error("recovery journal missing");
    return JSON.parse(String(row.record));
  }
  persist(value: unknown) {
    this.transaction(() => {
      this.db.exec(
        "CREATE TABLE IF NOT EXISTS recovery(id INTEGER PRIMARY KEY CHECK(id=1),record TEXT NOT NULL) STRICT",
      );
      this.db.prepare("INSERT OR REPLACE INTO recovery VALUES(1,?)").run(JSON.stringify(value));
    });
  }
  retire() {
    this.transaction(() => this.saveOwner());
  }
  complete(directory: Directory, journal: unknown) {
    this.transaction(() => {
      this.db.prepare("UPDATE directory SET record=? WHERE id=1").run(JSON.stringify(directory));
      this.saveOwner();
      this.db.prepare("UPDATE recovery SET record=? WHERE id=1").run(JSON.stringify(journal));
    });
  }
  private saveOwner() {
    this.db.prepare("UPDATE authority SET record=? WHERE id=1").run(JSON.stringify({ ...this.owner, phase: "closed" }));
  }
  private transaction(action: () => void) {
    this.db.exec("BEGIN EXCLUSIVE");
    try {
      action();
      this.db.exec("COMMIT");
    } catch (error) {
      this.db.exec("ROLLBACK");
      throw error;
    }
  }
  close() {
    this.db.close();
  }
}
