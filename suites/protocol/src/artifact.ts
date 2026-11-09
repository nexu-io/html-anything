import { canonical, type Digest, digest, valid } from "./json.js";

export const kinds = ["capsule", "web", "daemon", "blob"] as const;

export type Kind = (typeof kinds)[number];

export interface Artifact {
  bytes: number;
  digest: Digest;
  kind: Kind;
  slot: string;
}

export interface Generation {
  blobs: Artifact[];
  capsule: Artifact;
  carrier: number;
  daemon: Artifact;
  schema: 1;
  web: Artifact;
}

export interface Envelope {
  digest: Digest;
  generation: Generation;
  schema: 1;
}

const slot = /^[a-z][a-z0-9]*$/;

function record(value: unknown, path: string): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new TypeError(`${path} must be an object`);
  }

  return value as Record<string, unknown>;
}

function keys(value: Record<string, unknown>, expected: string[], path: string) {
  const actual = Object.keys(value).sort();
  const wanted = [...expected].sort();

  if (actual.join("\0") !== wanted.join("\0")) {
    throw new TypeError(`${path} has invalid fields`);
  }
}

function artifact(value: unknown, kind: Kind, path: string): Artifact {
  const data = record(value, path);
  keys(data, ["bytes", "digest", "kind", "slot"], path);

  if (data.kind !== kind) {
    throw new TypeError(`${path}.kind must be ${kind}`);
  }

  if (!Number.isSafeInteger(data.bytes) || Number(data.bytes) < 0) {
    throw new TypeError(`${path}.bytes must be a nonnegative integer`);
  }

  if (!valid(data.digest)) {
    throw new TypeError(`${path}.digest must be a sha256 digest`);
  }

  if (typeof data.slot !== "string" || !slot.test(data.slot)) {
    throw new TypeError(`${path}.slot must be a single word`);
  }

  return {
    bytes: data.bytes as number,
    digest: data.digest,
    kind,
    slot: data.slot,
  };
}

export function parse(value: unknown): Generation {
  const data = record(value, "generation");
  keys(data, ["blobs", "capsule", "carrier", "daemon", "schema", "web"], "generation");

  if (data.schema !== 1) {
    throw new TypeError("generation.schema must be 1");
  }

  if (!Number.isSafeInteger(data.carrier) || Number(data.carrier) < 1) {
    throw new TypeError("generation.carrier must be a positive integer");
  }

  if (!Array.isArray(data.blobs)) {
    throw new TypeError("generation.blobs must be an array");
  }

  const blobs = data.blobs.map((item, index) => artifact(item, "blob", `generation.blobs.${index}`));
  const slots = blobs.map((item) => item.slot);
  const sorted = [...slots].sort();

  if (new Set(slots).size !== slots.length || slots.join("\0") !== sorted.join("\0")) {
    throw new TypeError("generation.blobs must have unique sorted slots");
  }

  return {
    blobs,
    capsule: artifact(data.capsule, "capsule", "generation.capsule"),
    carrier: data.carrier as number,
    daemon: artifact(data.daemon, "daemon", "generation.daemon"),
    schema: 1,
    web: artifact(data.web, "web", "generation.web"),
  };
}

export function identify(generation: Generation): Digest {
  return digest(canonical(parse(generation)));
}

export function envelope(value: unknown): Envelope {
  const data = record(value, "envelope");
  keys(data, ["digest", "generation", "schema"], "envelope");

  if (data.schema !== 1 || !valid(data.digest)) {
    throw new TypeError("envelope header is invalid");
  }

  const generation = parse(data.generation);

  if (identify(generation) !== data.digest) {
    throw new TypeError("envelope digest mismatch");
  }

  return { digest: data.digest, generation, schema: 1 };
}

export function verify(item: Artifact, content: string | Uint8Array): boolean {
  const bytes = typeof content === "string" ? Buffer.byteLength(content) : content.byteLength;
  return item.bytes === bytes && item.digest === digest(content);
}
