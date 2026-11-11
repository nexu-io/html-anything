import { type Artifact, type Digest, valid } from "@odsuite/protocol";
import { parseReleaseVersion, releaseChannel } from "@odsuite/release";
import { fields, product } from "../metadata.js";

export interface KitMetadata {
  schema: 1;
  product: string;
  channel: string;
  version: string;
  revision: number;
  source: string | null;
  fingerprint: string;
  package: { name: string; artifact: Artifact };
}
export function kitMetadata(input: unknown): KitMetadata {
  const v = fields(input, ["schema", "product", "channel", "version", "revision", "source", "fingerprint", "package"]),
    lane = releaseChannel(String(v.channel));
  parseReleaseVersion(v.version as string, lane);
  if (
    v.schema !== 1 ||
    !Number.isSafeInteger(v.revision) ||
    Number(v.revision) < 1 ||
    !(v.source === null || (typeof v.source === "string" && /^[a-f0-9]{40}$/.test(v.source))) ||
    typeof v.fingerprint !== "string" ||
    !/^[a-f0-9]{64}$/.test(v.fingerprint)
  )
    throw Error("invalid kit metadata");
  const pack = fields(v.package, ["name", "artifact"]),
    artifact = fields(pack.artifact, ["kind", "slot", "bytes", "digest"]);
  if (
    typeof pack.name !== "string" ||
    pack.name.length > 214 ||
    !/^(?:@[a-z0-9][a-z0-9-]*\/)?[a-z0-9][a-z0-9-]*$/.test(pack.name) ||
    artifact.kind !== "blob" ||
    artifact.slot !== "kit" ||
    !valid(artifact.digest) ||
    !Number.isSafeInteger(artifact.bytes) ||
    Number(artifact.bytes) < 1 ||
    Number(artifact.bytes) > 64 * 1024 ** 2
  )
    throw Error("invalid kit package");
  return {
    schema: 1,
    product: product(v.product),
    channel: lane,
    version: v.version as string,
    revision: Number(v.revision),
    source: v.source as string | null,
    fingerprint: v.fingerprint,
    package: {
      name: pack.name,
      artifact: { kind: "blob", slot: "kit", bytes: Number(artifact.bytes), digest: artifact.digest as Digest },
    },
  };
}
export function kitPaths(value: Pick<KitMetadata, "product" | "channel" | "version" | "package">) {
  const prefix = `products/${value.product}`;
  return {
    head: `${prefix}/kits/channels/${value.channel}/head.json`,
    metadata: `${prefix}/kits/releases/v${value.version}/metadata.json`,
    object: `${prefix}/objects/sha256/${value.package.artifact.digest.slice(7)}`,
  };
}
