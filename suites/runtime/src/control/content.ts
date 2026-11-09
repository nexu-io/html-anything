import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { type Consumer, type Library, type LibrarySession, type Resource, resourceKey, type Use } from "@odsuite/blob";
import { type Artifact, type Binding, type Digest, type Envelope, envelope, type Kind } from "@odsuite/protocol";
import type { Directory, Factory } from "@odsuite/sidecar";
import type { Content } from "../generations.js";

export const resource = (artifact: Artifact): Resource => ({
  artifact,
  type: artifact.kind === "blob" ? "file" : "directory",
});
export const resources = (value: Envelope): Resource[] => {
  const g = value.generation;
  return [g.capsule, g.daemon, g.web, ...g.blobs].map(resource);
};
const unavailable = async (): Promise<Uint8Array> => {
  throw Error("committed content missing; reconciliation required");
};
function observed(name: string, directory: Directory) {
  const match = /^observer:(updates|bootstrapupdates):([a-f0-9-]{36})$/.exec(name);
  if (!match) return false;
  const entry = directory.instances.find((i) => i.service === match[1]);
  return !entry || (entry.incarnation === match[2] && entry.phase !== "retired");
}
/** Binding and actual subjects are authoritative; references retire last. */
export class ContentResources {
  constructor(
    readonly library: Library,
    private factory: Factory,
  ) {}
  async manifest(target: Digest) {
    const data = await this.factory.grant({ kind: "data", name: "capsule", scope: "factory" });
    const value = envelope(
      JSON.parse(await readFile(join(data.value, "generations", `${target.slice(7)}.json`), "utf8")),
    );
    if (value.digest !== target) throw Error("generation receipt mismatch");
    return value;
  }
  async prepare(value: Envelope, contents: Content[], name: string = value.digest) {
    await this.library.session(async (library) => {
      await library.retain("prepared", name, resources(value));
      const cached = await library.status();
      for (const spec of resources(value)) {
        const asset = contents.find(
          (c) => c.artifact.kind === spec.artifact.kind && c.artifact.slot === spec.artifact.slot,
        );
        if (!asset) throw Error("generation content missing");
        if (cached.entries[resourceKey(spec)]?.phase === "ready") await library.referencedPath(spec);
        else await library.prefetch(spec, async () => Buffer.from(asset.bytes));
      }
    });
  }
  async synchronize(state: Binding, recovery?: Digest) {
    await this.library.session(async (library) => {
      const retained = await library.status(),
        directory = await this.factory.directory(),
        wanted = new Set<string>();
      const keep = async (kind: "current" | "prepared" | "recovery", target: Digest) => {
        await library.retain(kind, target, resources(await this.manifest(target)));
        wanted.add(`${kind}:${target}`);
      };
      if (state.current) await keep("current", state.current);
      const pending = state.attempt?.target ?? state.handoff?.target;
      if (pending) await keep("prepared", pending);
      if (recovery && recovery !== state.current) await keep("recovery", recovery);
      for (const ref of retained.references) {
        if (ref.kind === "recovery" && recovery === undefined) continue;
        if (ref.kind === "prepared" && observed(ref.name, directory)) continue;
        if (!wanted.has(`${ref.kind}:${ref.name}`)) await library.unretain(ref.kind, ref.name);
      }
    });
  }
  async beforeCommit(state: Binding) {
    if (state.current && state.attempt?.target !== state.current)
      await this.library.session(async (library) => {
        await library.retain("recovery", state.current!, resources(await this.manifest(state.current!)));
      });
  }
  async use(target: Digest, roles: readonly Kind[], who?: Consumer) {
    return this.library.session(async (library) =>
      this.acquire(
        library,
        resources(await this.manifest(target)).filter((s) => roles.includes(s.artifact.kind)),
        who,
      ),
    );
  }
  private async acquire(library: LibrarySession, specs: Resource[], who?: Consumer) {
    const uses: Use[] = [];
    try {
      for (const spec of specs) uses.push(await library.acquire(spec, unavailable, who));
      return uses;
    } catch (error) {
      for (const use of uses) await library.release(use);
      throw error;
    }
  }
  async release(uses: Use[]) {
    await this.library.session(async (library) => {
      for (const use of uses) await library.release(use);
    });
  }
  async paths(value: Envelope) {
    return this.library.session(async (library) => {
      const specs = resources(value),
        paths: string[] = [];
      for (const spec of specs) paths.push(await library.referencedPath(spec));
      const path = (kind: Kind) => paths[specs.findIndex((s) => s.artifact.kind === kind)]!;
      return {
        capsule: path("capsule"),
        daemon: path("daemon"),
        web: path("web"),
        blobs: Object.fromEntries(
          specs.flatMap((s, i) => (s.artifact.kind === "blob" ? [[s.artifact.slot, paths[i]!]] : [])),
        ),
      };
    });
  }
  async bytes(value: Envelope): Promise<Content[]> {
    return this.library.session(async (library) => {
      const assets: Content[] = [];
      for (const spec of resources(value)) assets.push({ artifact: spec.artifact, bytes: await library.read(spec) });
      return assets;
    });
  }
  async cached(artifact: Artifact) {
    return this.library.session(async (library) => {
      const spec = resource(artifact),
        state = await library.status();
      if (state.entries[resourceKey(spec)]?.phase !== "ready") return undefined;
      return library.read(spec);
    });
  }
}
