import { type KitMetadata, kitMetadata } from "@odsuite/distribution/kit";
import { loadPackage } from "./build.js";
import { configuration } from "./config.js";

/** Project the exact verified package; signing/publication are separate operations. */
export async function candidate(root: string, channel: string, revision: number): Promise<KitMetadata> {
  const config = await configuration(root, channel),
    packaged = await loadPackage(config.root, channel);
  return kitMetadata({
    schema: 1,
    product: config.product.appid,
    channel,
    version: packaged.version,
    revision,
    source: packaged.source,
    fingerprint: packaged.fingerprint,
    package: {
      name: config.application.name,
      artifact: { kind: "blob", slot: "kit", bytes: packaged.npm.bytes, digest: `sha256:${packaged.npm.sha256}` },
    },
  });
}
