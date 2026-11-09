import {
  type Artifact,
  type Channel,
  channel,
  type Distribution,
  type Envelope,
  envelope,
  type Pointer,
  valid,
  verify,
} from "@odsuite/protocol";

import type { Asset } from "./authority.js";
import { trust } from "./proof.js";

export interface Release {
  assets: Asset[];
  envelope: Envelope;
}

function endpoint(value: string): string {
  const url = new URL(value);
  const local = url.hostname === "127.0.0.1" || url.hostname === "::1" || url.hostname === "localhost";
  if (url.protocol !== "http:" || !local || !url.port || url.pathname !== "/") {
    throw new TypeError("feed endpoint must be loopback HTTP origin");
  }
  return url.origin;
}

function list(value: Envelope): Artifact[] {
  const generation = value.generation;
  return [generation.capsule, generation.daemon, generation.web, ...generation.blobs];
}

export class Feed {
  readonly #endpoint: string;
  readonly #publickey: string;
  readonly #limits: { timeoutMs: number; maxBytes: number };

  constructor(endpointvalue: string, publickey: string, limits: { timeoutMs?: number; maxBytes?: number } = {}) {
    this.#endpoint = endpoint(endpointvalue);
    this.#publickey = publickey;
    this.#limits = { timeoutMs: limits.timeoutMs ?? 10000, maxBytes: limits.maxBytes ?? 64 * 1024 * 1024 };
    if (
      !Number.isSafeInteger(this.#limits.timeoutMs) ||
      this.#limits.timeoutMs < 1 ||
      this.#limits.timeoutMs > 60000 ||
      !Number.isSafeInteger(this.#limits.maxBytes) ||
      this.#limits.maxBytes < 1
    )
      throw new Error("invalid feed limits");
  }

  async head(lane: Channel, signal?: AbortSignal): Promise<Distribution> {
    const value: unknown = await this.#json(`/channels/${lane}`, signal);
    if (!value || typeof value !== "object" || Array.isArray(value)) throw new TypeError("invalid distribution");
    const data = value as Record<string, unknown>;
    if (channel(String(data.channel)) !== lane || !Number.isSafeInteger(data.revision) || Number(data.revision) < 0) {
      throw new TypeError("invalid distribution");
    }
    const state: Distribution = { channel: lane, revision: data.revision as number };
    if (data.head !== undefined) {
      const head = data.head as Record<string, unknown>;
      if (!valid(head?.generation) || !valid(head?.proof)) throw new TypeError("invalid distribution head");
      state.head = { generation: head.generation, proof: head.proof };
    }
    return state;
  }

  async release(
    lane: Channel,
    pointer: Pointer,
    options: { signal?: AbortSignal; cached?: (artifact: Artifact) => Promise<Uint8Array | undefined> } = {},
  ): Promise<Release> {
    const proof = await this.#json(`/proofs/${pointer.proof.slice(7)}`, options.signal);
    trust(this.#publickey, lane, pointer, proof);
    const manifest = envelope(await this.#json(`/generations/${pointer.generation.slice(7)}`, options.signal));
    if (manifest.digest !== pointer.generation) throw new Error("generation pointer mismatch");
    const assets: Asset[] = [];
    const artifacts = list(manifest);
    if (artifacts.length > 128 || artifacts.reduce((n, a) => n + a.bytes, 0) > this.#limits.maxBytes)
      throw new Error("release exceeds download limit");
    for (const artifact of artifacts) {
      options.signal?.throwIfAborted();
      const cached = await options.cached?.(artifact);
      const bytes =
        cached ?? (await this.#read(`/objects/${artifact.digest.slice(7)}`, artifact.bytes, options.signal));
      if (!verify(artifact, bytes)) throw new Error("object integrity mismatch");
      assets.push({ artifact, bytes });
    }
    return { assets, envelope: manifest };
  }

  async #read(path: string, max: number, signal?: AbortSignal): Promise<Uint8Array> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(new Error("feed request timeout")), this.#limits.timeoutMs);
    const abort = () => controller.abort(signal?.reason);
    signal?.addEventListener("abort", abort, { once: true });
    let reader: ReadableStreamDefaultReader<Uint8Array> | undefined;
    try {
      signal?.throwIfAborted();
      const response = await fetch(`${this.#endpoint}${path}`, { signal: controller.signal, redirect: "error" });
      if (!response.ok) throw new Error(`feed request failed:${response.status}`);
      if (Number(response.headers.get("content-length")) > max) throw new Error("feed response exceeds limit");
      if (!response.body) throw new Error("feed response body missing");
      reader = response.body.getReader();
      const chunks: Uint8Array[] = [];
      let size = 0;
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        size += value.byteLength;
        if (size > max) throw new Error("feed response exceeds limit");
        chunks.push(value);
      }
      return Buffer.concat(chunks, size);
    } finally {
      clearTimeout(timeout);
      signal?.removeEventListener("abort", abort);
      await reader?.cancel().catch(() => {});
      controller.abort();
    }
  }
  async #json(path: string, signal?: AbortSignal): Promise<unknown> {
    return JSON.parse(Buffer.from(await this.#read(path, 1024 * 1024, signal)).toString("utf8"));
  }
}
