import { createHash } from "node:crypto";
import { identifyResource, type SourcePayload } from "@open-motion/workspace";
import {
  resourceBytesLimit,
  resourceCountLimit,
  resourceLimit,
  schemas,
  sourceLimits,
  validateSourcePath,
} from "@open-motion/workspace/contract";
import { type Inventory, invalid, limits, manifestPath, names } from "./contract.js";

export interface Entry {
  path: string;
  bytes: Buffer;
}
export const hash = (bytes: Uint8Array) => `sha256:${createHash("sha256").update(bytes).digest("hex")}`;
const order = <T extends { path: string }>(a: T, b: T) => (a.path < b.path ? -1 : a.path > b.path ? 1 : 0);
/** Pure verified content; neither this inventory nor a ZIP is another editable store. */
export function content(input: SourcePayload) {
  const parsed = schemas.artifact_create.shape.files.safeParse(input?.files);
  if (!parsed.success) invalid("invalid portable source files");
  const files = parsed.data.sort(order);
  if (!files.some((file) => file.path === "index.html")) invalid("portable source requires index.html");
  if (!Array.isArray(input.resources) || input.resources.length > resourceCountLimit)
    invalid("portable resource count exceeds limit");
  let bytes = 0;
  for (const file of files) {
    validateSourcePath(file.path, true);
    bytes += Buffer.byteLength(file.content);
    if (bytes > sourceLimits.bytes) invalid("portable source exceeds 4 MiB");
  }
  bytes = 0;
  for (const entry of input.resources) {
    if (
      !entry ||
      !(entry.bytes instanceof Uint8Array) ||
      !entry.bytes.byteLength ||
      entry.bytes.byteLength > resourceLimit
    )
      invalid("portable media bytes outside supported bounds");
    bytes += entry.bytes.byteLength;
    if (bytes > resourceBytesLimit) invalid("portable media exceeds 64 MiB");
  }
  names([manifestPath, ...files.map((file) => file.path), ...input.resources.map((entry) => entry.path)]);
  const entries: Entry[] = files.map((file) => {
    const bytes = Buffer.from(file.content);
    if (bytes.toString("utf8") !== file.content) invalid("portable source is not valid UTF-8");
    return { path: file.path, bytes };
  });
  const resources = input.resources
    .map((entry) => {
      const bytes = Buffer.from(entry.bytes),
        resource = identifyResource(entry.path, entry.name, bytes);
      return { resource, bytes };
    })
    .sort((a, b) => order(a.resource, b.resource));
  const inventory: Inventory = {
    schema: 1,
    files: entries.map((entry) => ({ path: entry.path, bytes: entry.bytes.length, digest: hash(entry.bytes) })),
    resources: resources.map((entry) => entry.resource),
  };
  const metadata = Buffer.from(JSON.stringify(inventory));
  if (metadata.length > limits.manifestBytes) invalid("portable inventory exceeds limit");
  entries.push(...resources.map((entry) => ({ path: entry.resource.path, bytes: entry.bytes })), {
    path: manifestPath,
    bytes: metadata,
  });
  entries.sort(order);
  const payload: SourcePayload = {
    files,
    resources: resources.map((entry) => ({ path: entry.resource.path, name: entry.resource.name, bytes: entry.bytes })),
  };
  return { inventory, entries, payload };
}
