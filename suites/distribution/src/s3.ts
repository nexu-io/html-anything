import { createPublicKey } from "node:crypto";
import { GetObjectCommand, PutObjectCommand, S3Client, type S3ClientConfig } from "@aws-sdk/client-s3";
import { canonical, digest, verify } from "@odsuite/protocol";
import type { Asset } from "@odsuite/publish";
import { bundleFile, decode, unit } from "@odsuite/release";
import { type Metadata, metadata, shellPath } from "./metadata.js";
import { signHead, trustHead } from "./signature.js";

export class Storage {
  private client: S3Client;
  constructor(
    options: S3ClientConfig,
    readonly bucket: string,
  ) {
    this.client = new S3Client(options);
  }
  async get(key: string): Promise<{ bytes: Uint8Array; etag: string } | undefined> {
    try {
      const r = await this.client.send(new GetObjectCommand({ Bucket: this.bucket, Key: key }));
      if (!r.Body || !r.ETag) throw new Error("S3 response missing body/etag");
      return { bytes: await r.Body.transformToByteArray(), etag: r.ETag };
    } catch (error) {
      if ((error as { $metadata?: { httpStatusCode?: number } }).$metadata?.httpStatusCode === 404) return undefined;
      throw error;
    }
  }
  async put(key: string, bytes: Uint8Array, options: { etag?: string; immutable?: boolean } = {}) {
    await this.client.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: bytes,
        ContentType: key.endsWith(".json") ? "application/json" : "application/octet-stream",
        CacheControl: key.endsWith("/head.json") ? "no-store" : "public,max-age=31536000,immutable",
        ...(options.etag ? { IfMatch: options.etag } : { IfNoneMatch: "*" }),
      }),
    );
  }
  async immutable(key: string, bytes: Uint8Array) {
    try {
      await this.put(key, bytes, { immutable: true });
    } catch (error) {
      if ((error as { $metadata?: { httpStatusCode?: number } }).$metadata?.httpStatusCode !== 412) throw error;
      const current = await this.get(key);
      if (!current || digest(current.bytes) !== digest(bytes)) throw new Error("immutable S3 identity conflict");
    }
    const checked = await this.get(key);
    if (!checked || digest(checked.bytes) !== digest(bytes)) throw new Error("S3 upload verification failed");
  }
  close() {
    this.client.destroy();
  }
}
export async function publish(options: {
  storage: Storage;
  metadata: Metadata;
  assets: Asset[];
  shells: { artifact: Metadata["shells"][number]; bytes: Uint8Array }[];
  privatekey: string;
  expected: number;
}) {
  const m = metadata(options.metadata),
    storage = options.storage;
  const prefix = `products/${m.product}`,
    path = `${prefix}/channels/${m.channel}/head.json`;
  const head = signHead(m, options.privatekey),
    encoded = Buffer.from(canonical(head));
  const prior = await storage.get(path);
  const old = prior
    ? trustHead(
        JSON.parse(Buffer.from(prior.bytes).toString("utf8")),
        createPublicKey(options.privatekey).export({ format: "pem", type: "spki" }).toString(),
        m,
      )
    : undefined;
  const same = prior && Buffer.from(prior.bytes).equals(encoded);
  if (!same && ((old?.revision ?? 0) !== options.expected || m.revision !== options.expected + 1))
    throw new Error("S3 publication revision conflict");
  const g = m.content.generation,
    wanted = [g.capsule, g.web, g.daemon, ...g.blobs];
  if (
    options.assets.length !== wanted.length ||
    new Set(options.assets.map((a) => `${a.artifact.kind}:${a.artifact.slot}`)).size !== wanted.length
  )
    throw new Error("publication content mismatch");
  for (const a of wanted) {
    const asset = options.assets.find((v) => canonical(v.artifact) === canonical(a));
    if (!asset || !verify(a, asset.bytes)) throw new Error("publication content integrity mismatch");
  }
  const capsule = decode(
    Buffer.from(
      bundleFile(options.assets.find((a) => a.artifact.kind === "capsule")!.bytes as Uint8Array, "release.json"),
    ).toString("utf8"),
  );
  if (
    capsule.channel !== m.channel ||
    capsule.identity.appid !== (m.channel === "stable" ? m.product : `${m.product}.${m.channel}`) ||
    capsule.identity.version !== m.units.capsule
  )
    throw new Error("publication Capsule identity mismatch");
  for (const kind of ["web", "daemon"] as const) {
    const asset = options.assets.find((a) => a.artifact.kind === kind)!;
    const contract = unit(
      JSON.parse(Buffer.from(bundleFile(asset.bytes as Uint8Array, "unit.json")).toString("utf8")),
      kind,
      m.channel,
    );
    if (contract.version !== m.units[kind]) throw new Error("publication unit version mismatch");
  }
  if (options.shells.length !== m.shells.length) throw new Error("publication shell set mismatch");
  for (const shell of m.shells) {
    const asset = options.shells.find((s) => canonical(s.artifact) === canonical(shell));
    if (!asset || digest(asset.bytes) !== shell.digest || asset.bytes.byteLength !== shell.bytes)
      throw new Error("publication shell integrity mismatch");
  }
  for (const a of options.assets)
    await storage.immutable(`${prefix}/objects/sha256/${a.artifact.digest.slice(7)}`, Buffer.from(a.bytes));
  for (const s of options.shells) await storage.immutable(`${prefix}/${shellPath(s.artifact)}`, s.bytes);
  await storage.immutable(`${prefix}/releases/v${m.version}/metadata.json`, Buffer.from(canonical(m)));
  if (!same) await storage.put(path, encoded, { etag: prior?.etag });
  const confirmed = await storage.get(path);
  if (!confirmed || !Buffer.from(confirmed.bytes).equals(encoded)) throw new Error("S3 head changed after publish");
  return head;
}
