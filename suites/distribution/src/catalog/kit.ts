import { canonical, digest, verify } from "@odsuite/protocol";
import { releaseChannel } from "@odsuite/release";
import { endpoint, read } from "../http.js";
import { compare, product } from "../metadata.js";
import { type Head, trustHead } from "../signature.js";
import { type KitMetadata, kitMetadata, kitPaths } from "./contract.js";
import { CatalogState } from "./state.js";

export interface KitCatalogOptions {
  endpoint: string;
  publickey: string;
  product: string;
  channel: string;
  /** Real sidecar-owner data grant. No installation or process authority is stored here. */
  root: string;
}
export class KitCatalog {
  private state: CatalogState<{ head: Head; metadata: KitMetadata }>;
  private pending?: Promise<KitMetadata>;
  readonly base: string;
  constructor(readonly options: KitCatalogOptions) {
    product(options.product);
    releaseChannel(options.channel);
    this.base = endpoint(options.endpoint);
    this.state = new CatalogState(options.root, "kit-distribution.json", (head, body) => this.checked(head, body));
  }
  private checked(input: unknown, body: unknown) {
    return verifyKit({ head: input, metadata: body }, this.options.publickey, this.options);
  }
  async snapshot() {
    await this.state.load();
    if (!this.state.value) throw Error("no verified kit selection");
    return structuredClone(this.state.value);
  }
  refresh(signal?: AbortSignal): Promise<KitMetadata> {
    signal?.throwIfAborted();
    this.pending ??= this.refreshWithin(signal).finally(() => {
      this.pending = undefined;
    });
    return this.pending.then((value) => structuredClone(value));
  }
  private async refreshWithin(signal?: AbortSignal) {
    signal?.throwIfAborted();
    await this.state.load();
    const prefix = `products/${this.options.product}/kits`,
      bytes = await read(`${this.base}/${prefix}/channels/${this.options.channel}/head.json`, 32768, signal),
      head = trustHead(JSON.parse(Buffer.from(bytes).toString("utf8")), this.options.publickey, this.options);
    this.state.assert(head);
    const old = this.state.value;
    if (old && compare(head.version, old.metadata.version, this.options.channel) < 0)
      throw Error("kit version regressed");
    if (old && canonical(head) === canonical(old.head)) return old.metadata;
    if (old && head.version === old.metadata.version) throw Error("kit version content changed");
    const body = JSON.parse(
        Buffer.from(
          await read(`${this.base}/${prefix}/releases/v${head.version}/metadata.json`, 32768, signal),
        ).toString("utf8"),
      ),
      next = this.checked(head, body);
    signal?.throwIfAborted();
    await this.state.commit(next);
    return next.metadata;
  }
  async download(candidate: KitMetadata, signal?: AbortSignal) {
    if (!this.state.value || canonical(candidate) !== canonical(this.state.value.metadata))
      throw Error("kit candidate was not selected");
    const bytes = await read(`${this.base}/${kitPaths(candidate).object}`, candidate.package.artifact.bytes, signal);
    if (!verify(candidate.package.artifact, bytes)) throw Error("kit package integrity mismatch");
    return bytes;
  }
}

export function verifyKit(
  input: { head: unknown; metadata: unknown },
  publickey: string,
  expected: { product: string; channel: string },
) {
  const head = trustHead(input.head, publickey, expected),
    metadata = kitMetadata(input.metadata);
  if (
    digest(canonical(metadata)) !== head.metadata ||
    metadata.version !== head.version ||
    metadata.revision !== head.revision ||
    metadata.product !== head.product ||
    metadata.channel !== head.channel
  )
    throw Error("kit metadata head mismatch");
  return { head, metadata };
}
