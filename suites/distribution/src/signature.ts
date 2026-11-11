import { createPrivateKey, createPublicKey, sign, verify } from "node:crypto";
import { canonical, type Digest, digest, valid } from "@odsuite/protocol";
import { parseReleaseVersion, releaseChannel } from "@odsuite/release";
import { fields, product } from "./metadata.js";

export interface Head {
  schema: 1;
  product: string;
  channel: string;
  version: string;
  revision: number;
  metadata: Digest;
  key: Digest;
  signature: string;
}
function message(head: Head) {
  const { signature: _, ...body } = head;
  return Buffer.from(canonical(body));
}
export function signHead(
  metadata: { product: string; channel: string; version: string; revision: number },
  privatekey: string,
): Head {
  const key = createPrivateKey(privatekey),
    publickey = createPublicKey(key);
  const head: Head = {
    schema: 1,
    product: metadata.product,
    channel: metadata.channel,
    version: metadata.version,
    revision: metadata.revision,
    metadata: digest(canonical(metadata)),
    key: digest(publickey.export({ format: "der", type: "spki" })),
    signature: "",
  };
  head.signature = sign(null, message(head), key).toString("base64url");
  return head;
}
export function trustHead(input: unknown, publickey: string, expected: { product: string; channel: string }): Head {
  const v = fields(input, ["schema", "product", "channel", "version", "revision", "metadata", "key", "signature"]);
  if (
    v.schema !== 1 ||
    product(v.product) !== expected.product ||
    releaseChannel(String(v.channel)) !== expected.channel ||
    !Number.isSafeInteger(v.revision) ||
    Number(v.revision) < 1 ||
    !valid(v.metadata) ||
    !valid(v.key) ||
    typeof v.signature !== "string" ||
    !/^[A-Za-z0-9_-]{86}$/.test(v.signature)
  )
    throw new Error("invalid signed head");
  parseReleaseVersion(v.version as string, expected.channel);
  const key = createPublicKey(publickey),
    head = v as unknown as Head;
  if (
    head.key !== digest(key.export({ format: "der", type: "spki" })) ||
    !verify(null, message(head), key, Buffer.from(head.signature, "base64url"))
  )
    throw new Error("distribution signature mismatch");
  return head;
}
