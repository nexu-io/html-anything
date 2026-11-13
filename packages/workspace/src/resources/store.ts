import { Fault, type Input, type Resource, resourceBytesLimit, resourceCountLimit } from "../contract.js";
import type { Database } from "../database.js";
import type { Projects } from "../projects.js";
import { checksum, identify } from "./formats.js";
/** Persistent user bytes. Only owned immutable revision manifests grant reads; no cache/GC authority. */
export class Resources {
  constructor(
    private db: Database,
    private projects: Projects,
  ) {}
  importBytes(
    input: Pick<Input<"resource_import">, "sessionId" | "artifactId" | "expectedRevision" | "path" | "name">,
    bytes: Buffer,
  ) {
    const project = this.prepare({ ...input, bytes: bytes.length });
    const resource = this.retain(input, bytes);
    return this.projects.commit(project, project.files, [...project.resources, resource]);
  }
  prepare(input: Pick<Input<"resource_import">, "sessionId" | "artifactId" | "expectedRevision" | "path" | "bytes">) {
    const project = this.current(input);
    if (project.resources.some((entry) => entry.path === input.path))
      throw new Fault("conflict", "resource path already exists");
    if (
      project.resources.length >= resourceCountLimit ||
      project.resources.reduce((size, entry) => size + entry.bytes, input.bytes) > resourceBytesLimit
    )
      throw new Fault("invalid", "resource snapshot exceeds 64 resources / 64 MiB");
    return project;
  }
  /** Called only inside the workspace transaction owning the resulting manifest. */
  retain(input: Pick<Resource, "path" | "name">, bytes: Buffer) {
    const resource = identify(input.path, input.name, bytes),
      prior = this.db.one("SELECT bytes FROM resources WHERE digest=?", resource.digest);
    if (prior && !Buffer.from(prior.bytes as Uint8Array).equals(bytes))
      throw new Fault("integrity", "persistent resource content mismatch");
    this.db.run("INSERT OR IGNORE INTO resources VALUES(?,?)", resource.digest, bytes);
    return resource;
  }
  remove(input: Input<"resource_remove">) {
    const project = this.current(input);
    if (!project.resources.some((entry) => entry.path === input.path))
      throw new Fault("missing", "resource path is missing");
    return this.projects.commit(
      project,
      project.files,
      project.resources.filter((entry) => entry.path !== input.path),
    );
  }
  read(input: Input<"resource_read">) {
    const resource = this.projects.snapshot(input).resources.find((entry) => entry.path === input.path);
    if (!resource) throw new Fault("missing", "resource does not belong to this revision");
    const entry = this.db.one("SELECT bytes FROM resources WHERE digest=?", resource.digest);
    if (!entry) throw new Fault("integrity", "persistent resource bytes are missing");
    const bytes = Buffer.from(entry.bytes as Uint8Array);
    if (bytes.length !== resource.bytes || checksum(bytes) !== resource.digest)
      throw new Fault("integrity", "persistent resource bytes are corrupt");
    return { resource, data: bytes.toString("base64") };
  }
  private current(input: Pick<Input<"resource_import">, "sessionId" | "artifactId" | "expectedRevision">) {
    const project = this.projects.read(input);
    if (project.revision !== input.expectedRevision)
      throw new Fault("conflict", "project revision changed; read before changing resources");
    return project;
  }
}
