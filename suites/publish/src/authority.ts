import { randomUUID } from "node:crypto";
import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";

import { Store } from "@odsuite/blob";
import {
  type Artifact,
  type Channel,
  canonical,
  channel,
  type Digest,
  type Distribution,
  digest,
  type Envelope,
  envelope,
  publish,
  valid,
  verify,
} from "@odsuite/protocol";

import { type Proof, parse as parseproof, sign } from "./proof.js";

export interface Asset {
  artifact: Artifact;
  bytes: string | Uint8Array;
}

export interface Options {
  privatekey: string;
  root: string;
}

function list(value: Envelope): Artifact[] {
  const generation = value.generation;
  return [generation.capsule, generation.daemon, generation.web, ...generation.blobs];
}

function key(artifact: Artifact): string {
  return [artifact.kind, artifact.slot, artifact.digest, artifact.bytes].join(":");
}

function distribution(value: unknown, lane: Channel): Distribution {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new TypeError("distribution is invalid");
  const data = value as Record<string, unknown>;
  if (channel(String(data.channel)) !== lane || !Number.isSafeInteger(data.revision) || Number(data.revision) < 0) {
    throw new TypeError("distribution header is invalid");
  }
  const state: Distribution = { channel: lane, revision: data.revision as number };
  if (data.head !== undefined) {
    if (!data.head || typeof data.head !== "object" || Array.isArray(data.head)) {
      throw new TypeError("distribution head is invalid");
    }
    const head = data.head as Record<string, unknown>;
    if (!valid(head.generation) || !valid(head.proof)) throw new TypeError("distribution head is invalid");
    state.head = { generation: head.generation, proof: head.proof };
  }
  return state;
}

export class Authority {
  readonly #privatekey: string;
  readonly #root: string;
  readonly #store: Store;
  readonly #pending = new Map<Channel, Promise<void>>();

  private constructor(options: Options, store: Store) {
    this.#privatekey = options.privatekey;
    this.#root = resolve(options.root);
    this.#store = store;
  }

  static async open(options: Options): Promise<Authority> {
    await mkdir(options.root, { mode: 0o700, recursive: true });
    return new Authority(options, await Store.open({ root: options.root }));
  }

  read(lane: Channel): Promise<Distribution> {
    return this.#run(lane, () => this.#read(lane));
  }

  publish(lane: Channel, expected: number, input: unknown, assets: Asset[]): Promise<Distribution> {
    return this.#run(lane, async () => {
      const manifest = envelope(input);
      const wanted = new Map(list(manifest).map((artifact) => [key(artifact), artifact]));
      if (wanted.size !== assets.length) throw new Error("publication content mismatch");
      for (const asset of assets) {
        const artifact = wanted.get(key(asset.artifact));
        if (!artifact || !verify(artifact, asset.bytes)) throw new Error("publication verification failed");
        wanted.delete(key(artifact));
        const stored = await this.#store.put(artifact.kind, artifact.slot, asset.bytes);
        if (key(stored) !== key(artifact)) throw new Error("publication identity mismatch");
      }
      if (wanted.size > 0) throw new Error("publication content missing");
      const proof = sign(this.#privatekey, lane, manifest.digest);
      const pointer = { generation: manifest.digest, proof: digest(canonical(proof)) };
      const current = await this.#read(lane);
      const result = publish(current, { expected, pointer });
      if (!result.ok) throw new Error(`publication conflict:${result.actual}`);
      if (!result.changed) return result.state;
      await this.#write("generations", manifest.digest, canonical(manifest));
      await this.#write("proofs", pointer.proof, canonical(proof));
      await this.#state(lane, result.state);
      return result.state;
    });
  }

  async generation(identity: Digest): Promise<Envelope> {
    const manifest = envelope(JSON.parse(await readFile(this.#path("generations", identity), "utf8")));
    if (manifest.digest !== identity) throw new Error("generation identity mismatch");
    return manifest;
  }

  async proof(identity: Digest): Promise<Proof> {
    const content = await readFile(this.#path("proofs", identity), "utf8");
    if (digest(content.trim()) !== identity) throw new Error("proof identity mismatch");
    return parseproof(JSON.parse(content));
  }

  async object(identity: Digest): Promise<Uint8Array> {
    if (!valid(identity)) throw new TypeError("object identity is invalid");
    return readFile(join(this.#root, "objects", identity.slice(7)));
  }

  async #read(lane: Channel): Promise<Distribution> {
    try {
      return distribution(JSON.parse(await readFile(join(this.#root, "channels", `${lane}.json`), "utf8")), lane);
    } catch (fault) {
      if ((fault as NodeJS.ErrnoException).code !== "ENOENT") throw fault;
      return { channel: lane, revision: 0 };
    }
  }

  #run<T>(lane: Channel, action: () => Promise<T>): Promise<T> {
    const prior = this.#pending.get(lane) ?? Promise.resolve();
    const result = prior.then(action, action);
    const pending = result.then(
      () => undefined,
      () => undefined,
    );
    this.#pending.set(lane, pending);
    pending.finally(() => {
      if (this.#pending.get(lane) === pending) this.#pending.delete(lane);
    });
    return result;
  }

  #path(group: string, identity: Digest): string {
    if (!valid(identity)) throw new TypeError("identity is invalid");
    return join(this.#root, group, `${identity.slice(7)}.json`);
  }

  async #state(lane: Channel, state: Distribution): Promise<void> {
    const root = join(this.#root, "channels");
    await mkdir(root, { mode: 0o700, recursive: true });
    const path = join(root, `${lane}.json`);
    const temporary = `${path}.${randomUUID()}.tmp`;
    await writeFile(temporary, `${canonical(state)}\n`, { mode: 0o600 });
    await rename(temporary, path);
  }

  async #write(group: string, identity: Digest, content: string): Promise<void> {
    const root = join(this.#root, group);
    await mkdir(root, { mode: 0o700, recursive: true });
    const path = this.#path(group, identity);
    const temporary = `${path}.${randomUUID()}.tmp`;
    await writeFile(temporary, `${content}\n`, { flag: "wx", mode: 0o600 });
    try {
      await rename(temporary, path);
    } catch (fault) {
      if ((fault as NodeJS.ErrnoException).code !== "EEXIST") throw fault;
    }
  }
}
