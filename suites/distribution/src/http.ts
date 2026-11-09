export class Unavailable extends Error {}
export function endpoint(value: string) {
  const url = new URL(value);
  if (
    url.username ||
    url.password ||
    url.search ||
    url.hash ||
    (url.protocol !== "https:" &&
      !(url.protocol === "http:" && ["localhost", "127.0.0.1", "[::1]"].includes(url.hostname)))
  )
    throw new Error("distribution endpoint requires HTTPS or loopback HTTP");
  return url.href.replace(/\/$/, "");
}
export async function read(url: string, max: number, signal?: AbortSignal): Promise<Uint8Array> {
  const abort = AbortSignal.any([AbortSignal.timeout(10000), ...(signal ? [signal] : [])]);
  let response: Response;
  try {
    response = await fetch(url, { signal: abort, redirect: "error", cache: "no-store" });
  } catch (error) {
    throw new Unavailable(String(error));
  }
  if (!response.ok) throw new Unavailable(`distribution request failed:${response.status}`);
  if (!response.body || Number(response.headers.get("content-length")) > max)
    throw new Error("distribution response exceeds limit or has no body");
  const reader = response.body.getReader(),
    chunks: Uint8Array[] = [];
  let size = 0;
  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > max) throw new Error("distribution response exceeds limit");
      chunks.push(value);
    }
    return Buffer.concat(chunks, size);
  } finally {
    await reader.cancel().catch(() => {});
  }
}
