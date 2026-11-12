import { Fault, type Input, type Selection } from "./contract.js";
import type { Database } from "./database.js";
import type { Projects } from "./projects.js";
import type { Sessions } from "./sessions.js";
export class Selections {
  constructor(
    private db: Database,
    private projects: Projects,
    private sessions: Sessions,
  ) {}
  get(): Selection {
    return this.db.one(
      "SELECT revision,session_id AS sessionId,artifact_id AS artifactId FROM selection WHERE id=1",
    ) as unknown as Selection;
  }
  private check(input: Input<"session_open"> | Input<"artifact_open">) {
    const current = this.get();
    if (current.revision !== input.expectedSelection) throw new Fault("conflict", "workspace selection changed");
    if (current.artifactId && current.sessionId) {
      const project = this.projects.read({ sessionId: current.sessionId, artifactId: current.artifactId });
      if (
        input.expectedCurrent?.artifactId !== current.artifactId ||
        input.expectedCurrent.revision !== project.revision
      )
        throw new Fault(
          "conflict",
          "current project must be saved and its latest revision acknowledged before switching",
        );
    } else if (input.expectedCurrent !== null) throw new Fault("conflict", "workspace has no current artifact");
    return current;
  }
  entry(input: Input<"project_entry">) {
    const project = this.projects.read(input);
    if (project.revision !== input.expectedRevision || project.history.version !== input.expectedHistory)
      throw new Fault("conflict", "entry target revision or history version changed");
    return {
      sessionId: project.sessionId,
      artifactId: project.artifactId,
      revision: project.revision,
      historyVersion: project.history.version,
    };
  }
  enter(input: Input<"artifact_enter">): Selection {
    this.entry(input);
    return this.open(input);
  }
  open(input: Input<"artifact_open">): Selection {
    this.projects.owner(input.sessionId, input.artifactId);
    const current = this.check(input);
    this.db.run(
      "UPDATE selection SET revision=?,session_id=?,artifact_id=? WHERE id=1",
      current.revision + 1,
      input.sessionId,
      input.artifactId,
    );
    this.db.run("UPDATE sessions SET last_artifact_id=? WHERE id=?", input.artifactId, input.sessionId);
    return this.get();
  }
  session(input: Input<"session_open">): Selection {
    const session = this.sessions.get(input.sessionId);
    const current = this.check(input);
    const artifactId = session.activeArtifactId ?? session.artifacts[0]?.id ?? null;
    if (artifactId) this.projects.owner(input.sessionId, artifactId);
    this.db.run(
      "UPDATE selection SET revision=?,session_id=?,artifact_id=? WHERE id=1",
      current.revision + 1,
      input.sessionId,
      artifactId,
    );
    this.db.run("UPDATE sessions SET last_artifact_id=? WHERE id=?", artifactId, input.sessionId);
    return this.get();
  }
}
