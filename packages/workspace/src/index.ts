import {
  type Artifact,
  Fault,
  type Input,
  type Operation,
  type Output,
  type SourceFile,
  type SourceIntent,
  schemas,
  sourceIntent,
} from "./contract.js";
import { Database } from "./database.js";
import { sources } from "./native.js";
import { Projects } from "./projects.js";
import { Resources } from "./resources/store.js";
import { Selections } from "./selection.js";
import { Sessions } from "./sessions.js";

export * from "./contract.js";
/** The one product transaction authority; consumers supply a sidecar-granted data root. */
export class Workspace {
  private db: Database;
  private sessions: Sessions;
  private projects: Projects;
  private selection: Selections;
  private resources: Resources;
  private closed = false;
  constructor(root: string) {
    this.db = new Database(root);
    this.sessions = new Sessions(this.db);
    this.projects = new Projects(this.db, this.sessions);
    this.resources = new Resources(this.db, this.projects);
    this.selection = new Selections(this.db, this.projects, this.sessions);
  }
  execute<K extends Operation>(operation: K, input: Input<K>): Output<K> {
    if (this.closed) throw new Fault("integrity", "workspace is closed");
    if (!Object.hasOwn(schemas, operation)) throw new Fault("invalid", "unknown workspace operation");
    const parsed = schemas[operation].safeParse(input);
    if (!parsed.success) throw new Fault("invalid", "workspace input does not match the operation schema");
    const data = parsed.data as Record<string, unknown>;
    if ("files" in data) data.files = sources(data.files as SourceFile[]);
    const perform = () => this.dispatch(operation, data);
    if (typeof data.requestId === "string")
      return this.db.request(operation, { ...data, requestId: data.requestId }, perform) as Output<K>;
    // Reads also pin one SQLite snapshot across ownership/revision queries.
    return this.db.transaction(perform, false) as Output<K>;
  }
  /** Confirm a committed immutable source intent before any external source resolution. */
  sourceReceipt(input: SourceIntent): Artifact | undefined {
    if (this.closed) throw new Fault("integrity", "workspace is closed");
    const parsed = sourceIntent.safeParse(input);
    if (!parsed.success) throw new Fault("invalid", "invalid immutable source intent");
    const data = parsed.data;
    return this.db.transaction(() => this.db.receipt<Artifact>("artifact_source_create", data), false);
  }
  /** Workspace atomically owns source-derived project, history and command receipt. */
  createSource(input: SourceIntent, files: SourceFile[]): Artifact {
    if (this.closed) throw new Fault("integrity", "workspace is closed");
    const parsed = sourceIntent.safeParse(input);
    if (!parsed.success) throw new Fault("invalid", "invalid immutable source intent");
    const data = parsed.data;
    return this.db.request("artifact_source_create", data, () => {
      const create = schemas.artifact_create.safeParse({
        requestId: data.requestId,
        sessionId: data.sessionId,
        title: data.title,
        files,
      });
      if (!create.success) throw new Fault("invalid", "invalid immutable source files");
      return this.projects.create({ ...create.data, files: sources(create.data.files) });
    });
  }
  private dispatch(operation: Operation, input: unknown): Output<Operation> {
    switch (operation) {
      case "workspace_state":
        return { sessions: this.sessions.list(), selection: this.selection.get() };
      case "session_rename":
        return this.sessions.rename(input as Input<"session_rename">);
      case "session_get":
        return this.sessions.get((input as Input<"session_get">).sessionId);
      case "session_create":
        return this.sessions.create(input as Input<"session_create">);
      case "message_append":
        return this.sessions.message(input as Input<"message_append">);
      case "artifact_create":
        return this.projects.create(input as Input<"artifact_create">);
      case "resource_import":
        return this.resources.import(input as Input<"resource_import">);
      case "resource_remove":
        return this.resources.remove(input as Input<"resource_remove">);
      case "resource_read":
        return this.resources.read(input as Input<"resource_read">);
      case "project_snapshot":
        return this.projects.snapshot(input as Input<"project_snapshot">);
      case "project_read":
        return this.projects.read(input as Input<"project_read">);
      case "project_undo":
        return this.projects.move(input as Input<"project_undo">, -1);
      case "project_redo":
        return this.projects.move(input as Input<"project_redo">, 1);
      case "project_save":
        return this.projects.save(input as Input<"project_save">);
      case "artifact_open":
        return this.selection.open(input as Input<"artifact_open">);
      case "session_open":
        return this.selection.session(input as Input<"session_open">);
    }
  }
  close() {
    if (!this.closed) {
      this.db.close();
      this.closed = true;
    }
  }
}
