import { Fault, resource, resourceBytesLimit, resourceCountLimit, sourceLimits } from "@open-motion/workspace/contract";
import { z } from "zod";

export const manifestPath = ".openmotion/manifest.json";
export const limits = Object.freeze({
  archiveBytes: 72 * 1024 ** 2,
  manifestBytes: 256 * 1024,
  expandedBytes: sourceLimits.bytes + resourceBytesLimit + 256 * 1024,
  entries: sourceLimits.files + resourceCountLimit + 1,
  chunkBytes: 64 * 1024,
});
export const digest = z.string().regex(/^sha256:[a-f0-9]{64}$/);
export const inventory = z.strictObject({
  schema: z.literal(1),
  files: z
    .array(
      z.strictObject({
        path: z.string().min(1).max(240),
        bytes: z.number().int().nonnegative().max(sourceLimits.bytes),
        digest,
      }),
    )
    .min(1)
    .max(sourceLimits.files),
  resources: z.array(resource).max(resourceCountLimit),
});
export type Inventory = z.infer<typeof inventory>;
export interface Archive {
  readonly digest: string;
  readonly bytes: number;
  readonly entries: number;
  /** Fresh bounded copies; stopping iteration owns no OS resource. */
  chunks(): Iterable<Uint8Array>;
}
export function invalid(message: string): never {
  throw new Fault("invalid", message);
}
/** Portable names are stricter than an editable logical snapshot; never rewrite them. */
export function path(name: string) {
  if (
    typeof name !== "string" ||
    !name ||
    name.length > 240 ||
    name.normalize("NFC") !== name ||
    /[\\<>:"|?*]/.test(name) ||
    Array.from(name).some((char) => char.charCodeAt(0) < 32 || char.charCodeAt(0) === 127)
  )
    invalid("unsupported portable path");
  for (const part of name.split("/"))
    if (
      !part ||
      part === "." ||
      part === ".." ||
      /[. ]$/.test(part) ||
      /^(con|prn|aux|nul|com[1-9]|lpt[1-9])(?:\.|$)/i.test(part) ||
      /^(agents|claude)\.md$/i.test(part)
    )
      invalid("reserved portable path");
  return name;
}
export function names(input: string[]) {
  const tree = new Map<string, { name: string; file: boolean }>();
  for (const name of input) {
    path(name);
    const parts = name.split("/");
    for (let at = 1; at <= parts.length; at++) {
      const prefix = parts.slice(0, at).join("/"),
        key = prefix.toLowerCase(),
        old = tree.get(key),
        file = at === parts.length;
      if (old && (old.name !== prefix || old.file || file)) invalid("portable path collision");
      tree.set(key, { name: prefix, file });
    }
  }
}
