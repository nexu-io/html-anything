import { gunzipSync } from "node:zlib";
export interface NpmContents {
  files: ReadonlyMap<string, Uint8Array>;
  metadata: Record<string, unknown>;
}
/** Inspect the bounded, regular-file-only ustar contract emitted by our npm pack entry. */
export function inspectNpm(input: Uint8Array): NpmContents {
  if (input.byteLength > 128 * 1024 ** 2) throw Error("npm compressed archive limit");
  const bytes = gunzipSync(input, { maxOutputLength: 256 * 1024 ** 2 });
  const files = new Map<string, Uint8Array>();
  const text = (value: Uint8Array) => new TextDecoder("utf-8", { fatal: true }).decode(value).split("\0")[0]!;
  const number = (value: Uint8Array) => {
    const source = text(value).trim();
    if (!/^[0-7]+$/.test(source)) throw Error("invalid npm tar numeric field");
    const parsed = Number.parseInt(source, 8);
    if (!Number.isSafeInteger(parsed)) throw Error("npm tar number limit");
    return parsed;
  };
  let at = 0,
    ended = false;
  while (at + 512 <= bytes.length) {
    const header = bytes.subarray(at, at + 512);
    if (header.every((byte) => byte === 0)) {
      if (at + 1024 > bytes.length || !bytes.subarray(at).every((byte) => byte === 0))
        throw Error("invalid npm tar end");
      ended = true;
      break;
    }
    const checksum = number(header.subarray(148, 156));
    let actual = 0;
    for (let i = 0; i < 512; i++) actual += i >= 148 && i < 156 ? 32 : header[i]!;
    if (checksum !== actual || text(header.subarray(257, 263)) !== "ustar") throw Error("invalid npm tar header");
    const prefix = text(header.subarray(345, 500)),
      leaf = text(header.subarray(0, 100));
    const path = prefix ? `${prefix}/${leaf}` : leaf,
      size = number(header.subarray(124, 136));
    const type = header[156],
      mode = number(header.subarray(100, 108));
    at += 512;
    if (at + size > bytes.length) throw Error("truncated npm tar entry");
    if (type === 53) {
      if (size !== 0 || !/^package(?:\/[A-Za-z0-9.-]+)*\/?$/.test(path)) throw Error("invalid npm directory");
    } else {
      if (type !== 0 && type !== 48) throw Error("npm archive entries must be regular files");
      if (!path.startsWith("package/")) throw Error("npm entry escaped package");
      const name = path.slice(8);
      if (
        !/^[A-Za-z0-9.][A-Za-z0-9./-]*$/.test(name) ||
        name.split("/").some((p) => !p || p === "." || p === "..") ||
        files.has(name) ||
        (mode !== 0o644 && mode !== 0o755) ||
        files.size >= 4097
      )
        throw Error("invalid npm file inventory");
      files.set(name, bytes.subarray(at, at + size));
    }
    at += Math.ceil(size / 512) * 512;
  }
  if (!ended) throw Error("npm tar end missing");
  const metadata = files.get("package.json");
  if (!metadata || metadata.byteLength > 65536) throw Error("npm package metadata missing or oversized");
  return { files, metadata: JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(metadata)) };
}
