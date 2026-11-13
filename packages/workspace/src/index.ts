import { createHash } from "node:crypto";
import {
  type Artifact,
  Fault,
  type Input,
  type Operation,
  type Output,
  type Project,
  type ResourceSourceIntent,
  resourceSourceIntent,
  type SourceFile,
  type SourceIntent,
  type SourcePayload,
  schemas,
  sourceIntent,
} from "./contract.js";
import { Database } from "./database.js";
import { sources } from "./native.js";
import { Projects } from "./projects.js";
import { resourceBytesLimit, resourceCountLimit, resourceLimit } from "./resources/contract.js";
import { checksum } from "./resources/formats.js";
import { Resources } from "./resources/store.js";
import { Selections } from "./selection.js";
import { Sessions } from "./sessions.js";

export * from "./contract.js";
export { identify as identifyResource } from "./resources/formats.js";
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
    if (operation !== "resource_import" && typeof data.requestId === "string")
      return this.db.request(operation, { ...data, requestId: data.requestId }, perform) as Output<K>;
    // Reads also pin one SQLite snapshot across ownership/revision queries.
    return this.db.transaction(perform, false) as Output<K>;
  }
  /** Caller resolves bounded bytes outside SQLite; receipt replay precedes byte resolution. */
  importResource(input: Input<"resource_import">, bytes: Uint8Array): Project {
    if (this.closed) throw new Fault("integrity", "workspace is closed");
    const parsed = schemas.resource_import.safeParse(input);
    if (!parsed.success) throw new Fault("invalid", "invalid resource import intent");
    const data = parsed.data;
    return this.db.request("resource_import", data, () => {
      if (bytes.byteLength !== data.bytes || checksum(bytes) !== data.digest)
        throw new Fault("integrity", "resource bytes differ from fixed import intent");
      return this.resources.importBytes(data, Buffer.from(bytes));
    });
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
  createSource(input: SourceIntent, payload: SourcePayload): Artifact {
    if (this.closed) throw new Fault("integrity", "workspace is closed");
    const parsed = sourceIntent.safeParse(input);
    if (!parsed.success) throw new Fault("invalid", "invalid immutable source intent");
    const data = parsed.data;
    return this.db.request("artifact_source_create", data, () => {
      if (!payload || typeof payload !== "object") throw new Fault("invalid", "immutable source payload is required");
      const create = schemas.artifact_create.safeParse({
        requestId: data.requestId,
        sessionId: data.sessionId,
        title: data.title,
        files: payload.files,
      });
      if (!create.success) throw new Fault("invalid", "invalid immutable source files");
      if (!Array.isArray(payload.resources) || payload.resources.length > resourceCountLimit)
        throw new Fault("invalid", "immutable source resources exceed supported bounds");
      let bytes = 0;
      for (const entry of payload.resources) {
        if (!entry || !(entry.bytes instanceof Uint8Array)) throw new Fault("invalid", "resource bytes are required");
        if (!entry.bytes.byteLength || entry.bytes.byteLength > resourceLimit)
          throw new Fault("invalid", "resource bytes outside supported bounds");
        bytes += entry.bytes.byteLength;
        if (bytes > resourceBytesLimit) throw new Fault("invalid", "resource snapshot exceeds 64 MiB");
      }
      const resources = payload.resources.map((entry) => this.resources.retain(entry, Buffer.from(entry.bytes)));
      return this.projects.create({ ...create.data, files: sources(create.data.files) }, resources);
    });
  }
  /** Check before resolving any external candidate, including after edits/offline restart. */
  resourceSourceReceipt(input: ResourceSourceIntent): Project | undefined {
    if (this.closed) throw new Fault("integrity", "workspace is closed");
    const parsed = resourceSourceIntent.safeParse(input);
    if (!parsed.success) throw new Fault("invalid", "invalid immutable resource intent");
    return this.db.transaction(() => this.db.receipt<Project>("resource_source_import", parsed.data), false);
  }
  /** One atomic resource/history/receipt transaction; caller resolves bytes outside SQLite. */
  importResourceSource(input: ResourceSourceIntent, bytes: Uint8Array): Project {
    if (this.closed) throw new Fault("integrity", "workspace is closed");
    const parsed = resourceSourceIntent.safeParse(input);
    if (!parsed.success) throw new Fault("invalid", "invalid immutable resource intent");
    const data = parsed.data;
    return this.db.request("resource_source_import", data, () => {
      const checked = Buffer.from(bytes);
      const resource = this.resources.importBytes(data, checked);
      if (resource.resources.find((entry) => entry.path === data.path)?.digest !== data.source.contentHash)
        throw new Fault("invalid", "immutable resource digest does not match source intent");
      return resource;
    });
  }
  private dispatch(operation: Operation, input: unknown): Output<Operation> {
    switch (operation) {
      case "workspace_observe": {
        const state = { sessions: this.sessions.list(), selection: this.selection.get() },
          selected = state.selection,
          session = selected.sessionId ? this.sessions.head(selected.sessionId) : null,
          project =
            selected.sessionId && selected.artifactId
              ? this.projects.head({ sessionId: selected.sessionId, artifactId: selected.artifactId })
              : null;
        const token =
          "sha256:" + createHash("sha256").update(JSON.stringify({ state, session, project })).digest("hex");
        return { token, state, project };
      }
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
        return this.projects.create(input as Input<"artifact_create">, []);
      case "resource_import": {
        const data = input as Input<"resource_import">,
          project = this.db.receipt<Project>("resource_import", data);
        if (!project) this.resources.prepare(data);
        return { project: project ?? null };
      }
      case "resource_remove":
        return this.resources.remove(input as Input<"resource_remove">);
      case "resource_read":
        return this.resources.read(input as Input<"resource_read">);
      case "project_snapshot":
        return this.projects.snapshot(input as Input<"project_snapshot">);
      case "project_list":
        return this.projects.list(input as Input<"project_list">);
      case "project_read":
        return this.projects.read(input as Input<"project_read">);
      case "project_undo":
        return this.projects.move(input as Input<"project_undo">, -1);
      case "project_redo":
        return this.projects.move(input as Input<"project_redo">, 1);
      case "project_save":
        return this.projects.save(input as Input<"project_save">);
      case "project_entry":
        return this.selection.entry(input as Input<"project_entry">);
      case "artifact_enter":
        return this.selection.enter(input as Input<"artifact_enter">);
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
