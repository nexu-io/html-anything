import { mkdir, readFile, writeFile } from "node:fs/promises";

import { join } from "node:path";
import {
  type Artifact,
  canonical,
  digest,
  type Envelope,
  envelope,
  type Generation,
  identify,
  type Kind,
  verify,
} from "@odsuite/protocol";

import { bundle } from "./bundle.js";
import { decode, encode, type Manifest } from "./manifest.js";

export interface Blob {
  path: string;
  slot: string;
}

export interface Source {
  blobs?: Blob[];
  capsule: string;
  carrier: number;
  daemon: string;
  web: string;
}

export interface Asset {
  artifact: Artifact;
  bytes: Uint8Array;
}

export interface Product {
  assets: Asset[];
  envelope: Envelope;
  manifest: Manifest;
}

function artifact(kind: Kind, slot: string, bytes: Uint8Array): Artifact {
  return { bytes: bytes.byteLength, digest: digest(bytes), kind, slot };
}

export async function compose(manifest: Manifest, source: Source): Promise<Product> {
  const contents = {
    capsule: await bundle(source.capsule, { "release.json": encode(manifest) }),
    daemon: await bundle(source.daemon),
    web: await bundle(source.web),
  };
  const capsule = artifact("capsule", "main", contents.capsule);
  const daemon = artifact("daemon", "main", contents.daemon);
  const web = artifact("web", "main", contents.web);
  const blobassets = await Promise.all(
    (source.blobs ?? []).map(async (blob) => {
      const bytes = await readFile(blob.path);
      return { artifact: artifact("blob", blob.slot, bytes), bytes };
    }),
  );
  blobassets.sort((left, right) => left.artifact.slot.localeCompare(right.artifact.slot));
  const generation: Generation = {
    blobs: blobassets.map((asset) => asset.artifact),
    capsule,
    carrier: source.carrier,
    daemon,
    schema: 1,
    web,
  };
  return {
    assets: [
      { artifact: capsule, bytes: contents.capsule },
      { artifact: daemon, bytes: contents.daemon },
      { artifact: web, bytes: contents.web },
      ...blobassets,
    ],
    envelope: { digest: identify(generation), generation, schema: 1 },
    manifest,
  };
}

export async function writeProduct(root: string, product: Product): Promise<void> {
  await mkdir(root, { recursive: true });
  for (const asset of product.assets) {
    if (!verify(asset.artifact, asset.bytes)) throw new Error("product asset mismatch");
    await writeFile(join(root, asset.artifact.digest.slice(7)), asset.bytes);
  }
  await writeFile(join(root, "release.json"), encode(product.manifest));
  await writeFile(join(root, "generation.json"), canonical(product.envelope));
}

export async function readProduct(root: string): Promise<Product> {
  const manifest = decode(await readFile(join(root, "release.json"), "utf8"));
  const value = envelope(JSON.parse(await readFile(join(root, "generation.json"), "utf8")));
  const g = value.generation;
  const assets = await Promise.all(
    [g.capsule, g.daemon, g.web, ...g.blobs].map(async (artifact) => {
      const bytes = await readFile(join(root, artifact.digest.slice(7)));
      if (!verify(artifact, bytes)) throw new Error("product asset verification failed");
      return { artifact, bytes };
    }),
  );
  return { assets, envelope: value, manifest };
}
