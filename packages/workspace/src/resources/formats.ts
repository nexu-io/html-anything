import { createHash } from "node:crypto";
import { PNG } from "pngjs";
import { Fault } from "../contract.js";
import { type Resource, resource, resourceLimit } from "./contract.js";
import { identifyFont } from "./fonts.js";
export function checksum(bytes: Uint8Array) {
  return `sha256:${createHash("sha256").update(bytes).digest("hex")}`;
}
function wave(bytes: Buffer) {
  if (
    bytes.length < 44 ||
    bytes.toString("ascii", 0, 4) !== "RIFF" ||
    bytes.toString("ascii", 8, 12) !== "WAVE" ||
    bytes.readUInt32LE(4) !== bytes.length - 8
  )
    throw Error("invalid WAV container");
  let format: { sampleRate: number; channels: number; align: number } | undefined, samples: number | undefined;
  for (let offset = 12; offset < bytes.length; ) {
    if (offset + 8 > bytes.length) throw Error("truncated WAV chunk");
    const id = bytes.toString("ascii", offset, offset + 4),
      size = bytes.readUInt32LE(offset + 4),
      start = offset + 8;
    if (start + size > bytes.length) throw Error("truncated WAV payload");
    if (id === "fmt ") {
      if (format || size !== 16 || bytes.readUInt16LE(start) !== 1 || bytes.readUInt16LE(start + 14) !== 16)
        throw Error("only PCM16 WAV is supported");
      const channels = bytes.readUInt16LE(start + 2),
        sampleRate = bytes.readUInt32LE(start + 4),
        align = bytes.readUInt16LE(start + 12);
      if (
        ![1, 2].includes(channels) ||
        sampleRate < 8000 ||
        sampleRate > 96000 ||
        align !== channels * 2 ||
        bytes.readUInt32LE(start + 8) !== sampleRate * align
      )
        throw Error("invalid WAV sample format");
      format = { channels, sampleRate, align };
    }
    if (id === "data") {
      if (samples !== undefined || !size) throw Error("invalid WAV sample chunk");
      samples = size;
    }
    offset = start + size + (size % 2);
    if (offset > bytes.length) throw Error("missing WAV chunk padding");
  }
  if (!format || !samples || samples % format.align) throw Error("missing or unaligned WAV samples");
  return {
    type: "audio/wav" as const,
    duration: samples / format.align / format.sampleRate,
    sampleRate: format.sampleRate,
    channels: format.channels,
  };
}
export function identify(path: string, name: string, bytes: Buffer): Resource {
  try {
    if (!bytes.length || bytes.length > resourceLimit) throw Error("resource bytes outside supported bounds");
    let metadata:
      | ReturnType<typeof wave>
      | ReturnType<typeof identifyFont>
      | { type: "image/png"; width: number; height: number };
    if (path.toLowerCase().endsWith(".png")) {
      if (
        bytes.length < 33 ||
        !bytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])) ||
        bytes.toString("ascii", 12, 16) !== "IHDR"
      )
        throw Error("invalid PNG signature");
      const width = bytes.readUInt32BE(16),
        height = bytes.readUInt32BE(20);
      if (!width || !height || width > 4096 || height > 4096 || bytes[28] !== 0)
        throw Error("PNG dimensions or interlace outside supported bounds");
      const parsed = PNG.sync.read(bytes, { checkCRC: true });
      if (parsed.width !== width || parsed.height !== height) throw Error("PNG header mismatch");
      metadata = { type: "image/png" as const, width, height };
    } else if (path.toLowerCase().endsWith(".wav")) metadata = wave(bytes);
    else metadata = identifyFont(path, bytes);
    return resource.parse({ path, name, digest: checksum(bytes), bytes: bytes.length, ...metadata });
  } catch (error) {
    throw new Fault("invalid", error instanceof Error ? error.message : "invalid resource format");
  }
}
