import {
  type Artifact,
  type Channel,
  canonical,
  type Distribution,
  digest,
  type Pointer,
  verify,
} from "@odsuite/protocol";
import type { Release } from "@odsuite/publish";
import { bundleFile, decode, unit } from "@odsuite/release";
import { CatalogState } from "./catalog/state.js";
import { endpoint, read, Unavailable } from "./http.js";
import { type Metadata, metadata, negotiate, product, type Shell, shellPath } from "./metadata.js";
import { type Head, trustHead } from "./signature.js";

export interface CatalogOptions {
  endpoint: string;
  publickey: string;
  product: string;
  channel: Channel;
  shellVersion: string;
  platform: string;
  arch: string;
  /** A real sidecar owner's granted data path. No manager authority files. */
  root: string;
}
export class Catalog {
  private state: CatalogState<{ head: Head; metadata: Metadata }>;
  private get selected() {
    return this.state.value;
  }
  private pending?: Promise<Metadata>;
  readonly base: string;
  constructor(readonly options: CatalogOptions) {
    this.base = `${endpoint(options.endpoint)}/products/${product(options.product)}`;
    this.state = new CatalogState(options.root, "distribution.json", (head, body) => this.checked(head, body));
  }
  private checked(head: unknown, body: unknown) {
    const h = trustHead(head, this.options.publickey, this.options),
      m = metadata(body);
    if (
      digest(canonical(m)) !== h.metadata ||
      m.version !== h.version ||
      m.revision !== h.revision ||
      m.product !== h.product ||
      m.channel !== h.channel
    )
      throw new Error("metadata head mismatch");
    return { head: h, metadata: m };
  }
  refresh(signal?: AbortSignal): Promise<Metadata> {
    this.pending ??= this.refreshWithin(signal).finally(() => {
      this.pending = undefined;
    });
    return this.pending;
  }
  private async refreshWithin(signal?: AbortSignal) {
    await this.state.load();
    let bytes: Uint8Array;
    try {
      bytes = await read(`${this.base}/channels/${this.options.channel}/head.json`, 1024 * 1024, signal);
    } catch (error) {
      signal?.throwIfAborted();
      if (error instanceof Unavailable && this.selected) return this.selected.metadata;
      throw error;
    }
    const head = trustHead(JSON.parse(Buffer.from(bytes).toString("utf8")), this.options.publickey, this.options);
    const old = this.selected?.head;
    this.state.assert(head);
    if (old && canonical(head) === canonical(old)) return this.selected!.metadata;
    const body = JSON.parse(
      Buffer.from(await read(`${this.base}/releases/v${head.version}/metadata.json`, 1024 * 1024, signal)).toString(
        "utf8",
      ),
    );
    const next = this.checked(head, body);
    await this.state.commit(next);
    return next.metadata;
  }
  async head(lane: Channel, signal?: AbortSignal): Promise<Distribution> {
    if (lane !== this.options.channel) throw new Error("catalog channel mismatch");
    const m = await this.refresh(signal);
    negotiate(m, this.options.shellVersion, this.options.platform, this.options.arch);
    return {
      channel: lane,
      revision: m.revision,
      head: { generation: m.content.digest, proof: digest(canonical(this.selected!.head)) },
    };
  }
  async release(
    lane: Channel,
    pointer: Pointer,
    options: { signal?: AbortSignal; cached?: (artifact: Artifact) => Promise<Uint8Array | undefined> } = {},
  ): Promise<Release> {
    const m = this.selected?.metadata;
    if (
      !m ||
      lane !== m.channel ||
      pointer.generation !== m.content.digest ||
      pointer.proof !== digest(canonical(this.selected!.head))
    )
      throw new Error("catalog selection mismatch");
    negotiate(m, this.options.shellVersion, this.options.platform, this.options.arch);
    const g = m.content.generation,
      artifacts = [g.capsule, g.web, g.daemon, ...g.blobs];
    if (artifacts.length > 128 || artifacts.reduce((n, a) => n + a.bytes, 0) > 64 * 1024 * 1024)
      throw new Error("content exceeds download limit");
    const assets = [];
    for (const artifact of artifacts) {
      const bytes =
        (await options.cached?.(artifact)) ??
        (await read(`${this.base}/objects/sha256/${artifact.digest.slice(7)}`, artifact.bytes, options.signal));
      if (!verify(artifact, bytes)) throw new Error("distribution object integrity mismatch");
      assets.push({ artifact, bytes });
    }
    const capsule = decode(
      Buffer.from(bundleFile(assets.find((a) => a.artifact.kind === "capsule")!.bytes, "release.json")).toString(
        "utf8",
      ),
    );
    const appid = m.channel === "stable" ? m.product : `${m.product}.${m.channel}`;
    if (
      capsule.channel !== m.channel ||
      capsule.identity.appid !== appid ||
      capsule.identity.version !== m.units.capsule
    )
      throw new Error("distributed Capsule identity mismatch");
    for (const kind of ["web", "daemon"] as const) {
      const contract = unit(
        JSON.parse(
          Buffer.from(bundleFile(assets.find((a) => a.artifact.kind === kind)!.bytes, "unit.json")).toString("utf8"),
        ),
        kind,
        m.channel,
      );
      if (contract.version !== m.units[kind]) throw new Error("distributed unit version mismatch");
    }
    return { envelope: m.content, assets };
  }
  async shell(shell: Shell, signal?: AbortSignal) {
    if (!this.selected?.metadata.shells.some((s) => canonical(s) === canonical(shell)))
      throw new Error("unselected shell");
    const bytes = await read(`${this.base}/${shellPath(shell)}`, shell.bytes, signal);
    if (digest(bytes) !== shell.digest || bytes.byteLength !== shell.bytes) throw new Error("shell integrity mismatch");
    return bytes;
  }
}
