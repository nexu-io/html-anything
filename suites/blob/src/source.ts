import { verify } from "@odsuite/protocol";
import { resource } from "./format.js";
import type { Loader, Resource } from "./types.js";

/** Fetch an already trusted descriptor. Redirects never widen transport policy. */
export function source(address: string, input: Resource, timeoutMs = 10000): Loader {
  const spec = resource(input),
    url = new URL(address),
    local = ["127.0.0.1", "[::1]", "localhost"].includes(url.hostname);
  if (
    url.username ||
    url.password ||
    url.hash ||
    (url.protocol !== "https:" && !(url.protocol === "http:" && local && url.port))
  )
    throw Error("blob source requires HTTPS or explicit loopback HTTP");
  if (!Number.isSafeInteger(timeoutMs) || timeoutMs < 1 || timeoutMs > 60000) throw Error("invalid blob fetch timeout");
  return async (signal) => {
    const response = await fetch(url, {
      signal: AbortSignal.any([signal, AbortSignal.timeout(timeoutMs)]),
      redirect: "error",
    });
    if (!response.ok || !response.body) {
      await response.body?.cancel();
      throw Error(`blob source failed:${response.status}`);
    }
    if (Number(response.headers.get("content-length")) > spec.artifact.bytes) {
      await response.body.cancel();
      throw Error("blob response exceeds declared size");
    }
    const reader = response.body.getReader(),
      chunks: Uint8Array[] = [];
    let count = 0;
    try {
      for (;;) {
        const next = await reader.read();
        if (next.done) break;
        count += next.value.length;
        if (count > spec.artifact.bytes) throw Error("blob response exceeds declared size");
        chunks.push(next.value);
      }
    } finally {
      await reader.cancel().catch(() => {});
      reader.releaseLock();
    }
    const bytes = Buffer.concat(chunks);
    if (!verify(spec.artifact, bytes)) throw Error("blob source integrity mismatch");
    return bytes;
  };
}
