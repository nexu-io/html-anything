import { randomUUID } from "node:crypto";
import { type Artifact, Fault, type Input, type Project, type SourceFile } from "./contract.js";
import type { Database } from "./database.js";
import { digest, sources } from "./native.js";
import type { Sessions } from "./sessions.js";
export class Projects {
  constructor(
    private db: Database,
    private sessions: Sessions,
  ) {}
  owner(sessionId: string, artifactId: string): Artifact {
    this.sessions.get(sessionId);
    const artifact = this.db.one(
      "SELECT id,session_id AS sessionId,project_id AS projectId,'motion-project' AS kind,title,created_at AS createdAt FROM artifacts WHERE id=?",
      artifactId,
    );
    if (!artifact || artifact.sessionId !== sessionId)
      throw new Fault("ownership", "artifact does not belong to session");
    return artifact as unknown as Artifact;
  }
  create(input: Input<"artifact_create">): Artifact {
    this.sessions.get(input.sessionId);
    const files = sources(input.files),
      revision = digest(files),
      projectId = randomUUID(),
      id = randomUUID();
    this.db.run("INSERT INTO projects VALUES(?,?,0,0)", projectId, revision);
    this.db.run("INSERT INTO revisions VALUES(?,?,?)", projectId, revision, JSON.stringify(files));
    this.db.run("INSERT INTO history VALUES(?,0,?)", projectId, revision);
    const artifact: Artifact = {
      id,
      projectId,
      sessionId: input.sessionId,
      title: input.title,
      kind: "motion-project",
      createdAt: Date.now(),
    };
    this.db.run(
      "INSERT INTO artifacts VALUES(?,?,?,?,?)",
      id,
      input.sessionId,
      projectId,
      input.title,
      artifact.createdAt,
    );
    return artifact;
  }
  read(input: Input<"project_read">): Project {
    const owner = this.owner(input.sessionId, input.artifactId);
    const entry = this.db.one(
      "SELECT r.revision,r.files,p.cursor,p.history_version FROM projects p JOIN revisions r ON r.project_id=p.id AND r.revision=p.current_revision WHERE p.id=?",
      owner.projectId,
    );
    if (!entry) throw new Fault("integrity", "project revision is missing");
    const files = JSON.parse(String(entry.files)) as SourceFile[];
    if (digest(files) !== entry.revision) throw new Fault("integrity", "native revision content mismatch");
    return {
      id: owner.projectId,
      artifactId: owner.id,
      sessionId: owner.sessionId,
      revision: String(entry.revision),
      files,
      history: {
        version: Number(entry.history_version),
        canUndo: Number(entry.cursor) > 0,
        canRedo: !!this.db.one(
          "SELECT 1 FROM history WHERE project_id=? AND position>?",
          owner.projectId,
          Number(entry.cursor),
        ),
      },
    };
  }
  move(input: Input<"project_undo">, direction: -1 | 1): Project {
    const current = this.read(input);
    if (current.revision !== input.expectedRevision || current.history.version !== input.expectedHistory)
      throw new Fault("conflict", "project history changed; read before moving history");
    const cursor = Number(this.db.one("SELECT cursor FROM projects WHERE id=?", current.id)?.cursor) + direction;
    const target = this.db.one("SELECT revision FROM history WHERE project_id=? AND position=?", current.id, cursor);
    if (!target) throw new Fault("invalid", direction < 0 ? "nothing to undo" : "nothing to redo");
    this.db.run(
      "UPDATE projects SET current_revision=?,cursor=?,history_version=history_version+1 WHERE id=?",
      String(target.revision),
      cursor,
      current.id,
    );
    return this.read(input);
  }
  save(input: Input<"project_save">): Project {
    const current = this.read(input);
    if (current.revision !== input.expectedRevision)
      throw new Fault("conflict", "project revision changed; read before saving");
    const files = sources(input.files),
      revision = digest(files);
    if (revision === current.revision) return current;
    const cursor = Number(this.db.one("SELECT cursor FROM projects WHERE id=?", current.id)?.cursor);
    this.db.run("INSERT OR IGNORE INTO revisions VALUES(?,?,?)", current.id, revision, JSON.stringify(files));
    this.db.run("DELETE FROM history WHERE project_id=? AND position>?", current.id, cursor);
    this.db.run("INSERT INTO history VALUES(?,?,?)", current.id, cursor + 1, revision);
    this.db.run(
      "UPDATE projects SET current_revision=?,cursor=?,history_version=history_version+1 WHERE id=?",
      revision,
      cursor + 1,
      current.id,
    );
    return this.read(input);
  }
}
