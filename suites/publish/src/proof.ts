import {
  createPrivateKey,
  createPublicKey,
  type KeyObject,
  sign as signbytes,
  verify as verifybytes,
} from "node:crypto";

import { type Channel, canonical, type Digest, digest, type Pointer, valid } from "@odsuite/protocol";

export interface Proof {
  algorithm: "ed25519";
  channel: Channel;
  generation: Digest;
  key: Digest;
  signature: string;
}

function message(channel: Channel, generation: Digest): string {
  return canonical({ channel, generation });
}

function identity(key: KeyObject): Digest {
  return digest(key.export({ format: "der", type: "spki" }));
}

export function sign(privatekey: string, channel: Channel, generation: Digest): Proof {
  const secret = createPrivateKey(privatekey);
  const publickey = createPublicKey(secret);
  return {
    algorithm: "ed25519",
    channel,
    generation,
    key: identity(publickey),
    signature: signbytes(null, Buffer.from(message(channel, generation)), secret).toString("base64url"),
  };
}

export function parse(value: unknown): Proof {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new TypeError("proof must be an object");
  const data = value as Record<string, unknown>;
  if (Object.keys(data).sort().join(":") !== "algorithm:channel:generation:key:signature") {
    throw new TypeError("proof fields are invalid");
  }
  if (data.algorithm !== "ed25519" || typeof data.channel !== "string") throw new TypeError("proof header is invalid");
  if (!valid(data.generation) || !valid(data.key) || typeof data.signature !== "string" || !data.signature) {
    throw new TypeError("proof body is invalid");
  }
  if (!/^[a-z][a-z0-9]*$/.test(data.channel)) throw new TypeError("proof channel is invalid");
  return data as unknown as Proof;
}

export function trust(publickey: string, channel: Channel, pointer: Pointer, input: unknown): Proof {
  const proof = parse(input);
  const key = createPublicKey(publickey);
  if (proof.channel !== channel || proof.generation !== pointer.generation) throw new Error("proof target mismatch");
  if (proof.key !== identity(key) || pointer.proof !== digest(canonical(proof)))
    throw new Error("proof trust mismatch");
  const validproof = verifybytes(
    null,
    Buffer.from(message(channel, pointer.generation)),
    key,
    Buffer.from(proof.signature, "base64url"),
  );
  if (!validproof) throw new Error("proof signature mismatch");
  return proof;
}
