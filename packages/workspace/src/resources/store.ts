import { Fault, type Input, type Resource } from "../contract.js";
import type { Database } from "../database.js";
import type { Projects } from "../projects.js";
import { checksum, decode, identify } from "./formats.js";
/** Persistent user bytes. Only owned immutable revision manifests grant reads; no cache/GC authority. */
export class Resources {
  constructor(
    private db: Database,
    private projects: Projects,
  ) {}
  import(input: Input<"resource_import">) {
    return this.importBytes(input, decode(input.data));
  }
  importBytes(input: Omit<Input<"resource_import">, "data">, bytes: Buffer) {
    const project = this.current(input);
    if (project.resources.some((entry) => entry.path === input.path))
      throw new Fault("conflict", "resource path already exists");
    const resource = this.retain(input, bytes);
    return this.projects.commit(project, project.files, [...project.resources, resource]);
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
  private current(input: Omit<Input<"resource_import">, "data"> | Input<"resource_remove">) {
    const project = this.projects.read(input);
    if (project.revision !== input.expectedRevision)
      throw new Fault("conflict", "project revision changed; read before changing resources");
    return project;
  }
}
