import { createHash, randomUUID } from "node:crypto";
import { createReadStream } from "node:fs";
import { link, lstat, mkdir, open, readFile, realpath, rm } from "node:fs/promises";
import { join, resolve } from "node:path";
import { type Artifact, type Digest, digest, type Kind, kinds, valid } from "@odsuite/protocol";
import type { ByteSource } from "./types.js";

export interface Options {
  root: string;
}

function slot(value: string): string {
  if (!/^[a-z][a-z0-9]*$/.test(value)) throw new TypeError("artifact slot must be a single word");
  return value;
}

function bytes(value: string | Uint8Array): Uint8Array {
  return typeof value === "string" ? Buffer.from(value) : value;
}

export class Store {
  readonly #objects: string;

  private constructor(root: string) {
    this.#objects = resolve(root, "objects");
  }

  static async open(options: Options): Promise<Store> {
    await mkdir(options.root, { mode: 0o700, recursive: true });
    const store = new Store(await realpath(options.root));
    await mkdir(store.#objects, { mode: 0o700, recursive: true });
    await store.#guard();
    return store;
  }

  async put(kind: Kind, name: string, content: string | Uint8Array, temporaryRoot?: string): Promise<Artifact> {
    await this.#guard();
    if (!kinds.includes(kind)) throw new TypeError("invalid artifact kind");
    const value = bytes(content);
    const identity = digest(value);
    const artifact: Artifact = {
      bytes: value.byteLength,
      digest: identity,
      kind,
      slot: slot(name),
    };
    const target = this.#path(identity);
    const temporary = join(temporaryRoot ?? this.#objects, `${randomUUID()}.tmp`);
    try {
      const handle = await open(temporary, "wx", 0o600);
      try {
        await handle.writeFile(value);
        await handle.sync();
      } finally {
        await handle.close();
      }
      try {
        await link(temporary, target);
      } catch (fault) {
        if ((fault as NodeJS.ErrnoException).code !== "EEXIST") throw fault;
      }
    } finally {
      await rm(temporary, { force: true });
    }
    await this.path(artifact);
    return artifact;
  }

  async import(artifact: Artifact, source: ByteSource, temporaryRoot: string, signal?: AbortSignal): Promise<void> {
    if (
      !kinds.includes(artifact.kind) ||
      !valid(artifact.digest) ||
      !Number.isSafeInteger(artifact.bytes) ||
      artifact.bytes < 0 ||
      artifact.bytes > 512 * 1024 ** 2
    )
      throw Error("invalid streamed artifact");
    slot(artifact.slot);
    await this.#guard();
    const temporary = join(temporaryRoot, `${randomUUID()}.tmp`),
      hash = createHash("sha256");
    let size = 0;
    const handle = await open(temporary, "wx", 0o600);
    try {
      try {
        const chunks =
          source instanceof Uint8Array
            ? (async function* () {
                yield source;
              })()
            : source;
        for await (const chunk of chunks) {
          signal?.throwIfAborted();
          if (!(chunk instanceof Uint8Array)) throw Error("blob loader emitted non-byte data");
          size += chunk.byteLength;
          if (size > artifact.bytes) throw Error("blob response exceeds declared size");
          hash.update(chunk);
          await handle.writeFile(chunk);
        }
        signal?.throwIfAborted();
        if (size !== artifact.bytes || `sha256:${hash.digest("hex")}` !== artifact.digest)
          throw Error("blob integrity mismatch");
        await handle.sync();
      } finally {
        await handle.close();
      }
      try {
        await link(temporary, this.#path(artifact.digest));
      } catch (e) {
        if ((e as NodeJS.ErrnoException).code !== "EEXIST") throw e;
      }
      await this.path(artifact);
    } finally {
      await rm(temporary, { force: true });
    }
  }
  async path(artifact: Artifact): Promise<string> {
    if (!kinds.includes(artifact.kind) || !valid(artifact.digest)) throw new TypeError("invalid artifact");
    slot(artifact.slot);
    await this.#guard();
    const path = this.#path(artifact.digest),
      info = await lstat(path);
    if (!info.isFile() || info.isSymbolicLink() || info.size !== artifact.bytes)
      throw Error("artifact integrity mismatch: expected regular immutable object");
    const hash = createHash("sha256");
    for await (const chunk of createReadStream(path)) hash.update(chunk);
    if (`sha256:${hash.digest("hex")}` !== artifact.digest) throw Error("artifact integrity mismatch");
    return path;
  }
  async read(artifact: Artifact): Promise<Uint8Array> {
    if (artifact.bytes > 64 * 1024 ** 2) throw Error("buffered artifact exceeds 64 MiB; use a verified path");
    return readFile(await this.path(artifact));
  }

  async has(artifact: Artifact): Promise<boolean> {
    try {
      await this.path(artifact);
      return true;
    } catch (fault) {
      if ((fault as NodeJS.ErrnoException).code === "ENOENT") return false;
      throw fault;
    }
  }

  async remove(identity: Digest): Promise<void> {
    if (!valid(identity)) throw new TypeError("invalid artifact digest");
    await this.#guard();
    await rm(this.#path(identity), { force: true });
  }

  async #guard() {
    if ((await realpath(this.#objects)) !== this.#objects || (await lstat(this.#objects)).isSymbolicLink())
      throw Error("CAS objects escaped owned root");
  }
  #path(identity: Digest): string {
    return join(this.#objects, identity.slice(7));
  }
}
