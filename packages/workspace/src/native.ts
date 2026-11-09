import { createHash } from "node:crypto";
import { extname } from "node:path";
import { Fault, type SourceFile } from "./contract.js";

const extensions = new Set([
  ".html",
  ".css",
  ".js",
  ".mjs",
  ".json",
  ".svg",
  ".txt",
  ".md",
  ".vtt",
  ".srt",
  ".glsl",
  ".vert",
  ".frag",
]);
const ignored = new Set(["node_modules", "dist", "renders", "output", "cache"]);
const manifests = new Set([".hyperframes/studio-manual-edits.json", ".hyperframes/studio-motion.json"]);
export function sources(input: SourceFile[]): SourceFile[] {
  let bytes = 0;
  const paths = new Set<string>();
  const output = input
    .map((entry) => {
      const parts = entry.path.split("/");
      if (
        entry.path.includes("\\") ||
        entry.path.includes(":") ||
        Array.from(entry.path).some((char) => char.charCodeAt(0) < 32 || char.charCodeAt(0) === 127) ||
        (!manifests.has(entry.path) && parts.some((part) => !part || part.startsWith(".") || ignored.has(part))) ||
        paths.has(entry.path) ||
        !extensions.has(extname(entry.path).toLowerCase())
      )
        throw new Fault("invalid", "invalid, cached or duplicate native source path");
      if (Buffer.from(entry.content).toString("utf8") !== entry.content)
        throw new Fault("invalid", "native source must be valid UTF-8 text");
      paths.add(entry.path);
      bytes += Buffer.byteLength(entry.content);
      if (bytes > 4 * 1024 * 1024) throw new Fault("invalid", "native source snapshot exceeds 4 MiB");
      return { path: entry.path, content: entry.content };
    })
    .sort((a, b) => (a.path < b.path ? -1 : a.path > b.path ? 1 : 0));
  if (!paths.has("index.html")) throw new Fault("invalid", "native project requires index.html");
  return output;
}
export function digest(files: SourceFile[]): string {
  return `sha256:${createHash("sha256")
    .update(JSON.stringify(sources(files)))
    .digest("hex")}`;
}
