import { createHash } from "node:crypto";
import { Fault, type Resource, type SourceFile, validateSourcePath } from "./contract.js";
import { resource } from "./resources/contract.js";

export function sources(input: SourceFile[]): SourceFile[] {
  let bytes = 0;
  const paths = new Set<string>();
  const output = input
    .map((entry) => {
      validateSourcePath(entry.path, true);
      if (paths.has(entry.path)) throw new Fault("invalid", "duplicate native source path");
      if (Buffer.from(entry.content).toString("utf8") !== entry.content)
        throw new Fault("invalid", "native source must be valid UTF-8 text");
      paths.add(entry.path);
      bytes += Buffer.byteLength(entry.content);
      if (bytes > 4 * 1024 * 1024) throw new Fault("invalid", "native source snapshot exceeds 4 MiB");
      return { path: entry.path, content: entry.content };
    })
    .sort((a, b) => (a.path < b.path ? -1 : a.path > b.path ? 1 : 0));
  for (const path of paths) {
    for (let at = path.indexOf("/"); at >= 0; at = path.indexOf("/", at + 1))
      if (paths.has(path.slice(0, at))) throw new Fault("invalid", "overlapping native source paths");
  }
  if (!paths.has("index.html")) throw new Fault("invalid", "native project requires index.html");
  return output;
}
export function manifest(input: Resource[]): Resource[] {
  if (input.length > 64) throw new Fault("invalid", "resource count exceeds 64");
  const entries = input
    .map((entry) => resource.parse(entry))
    .sort((a, b) => (a.path < b.path ? -1 : a.path > b.path ? 1 : 0));
  if (
    new Set(entries.map((entry) => entry.path)).size !== entries.length ||
    entries.reduce((n, entry) => n + entry.bytes, 0) > 64 * 1024 * 1024
  )
    throw new Fault("invalid", "duplicate or oversized resource manifest");
  return entries;
}
export function digest(files: SourceFile[], resources: Resource[] = []): string {
  const text = sources(files),
    assets = manifest(resources),
    paths = new Set([...text.map((entry) => entry.path), ...assets.map((entry) => entry.path)]);
  for (const path of paths)
    for (let at = path.indexOf("/"); at >= 0; at = path.indexOf("/", at + 1))
      if (paths.has(path.slice(0, at))) throw new Fault("invalid", "source and resource paths overlap");
  return `sha256:${createHash("sha256")
    .update(JSON.stringify([text, assets]))
    .digest("hex")}`;
}
