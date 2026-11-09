import { createHash } from "node:crypto";
import { join } from "node:path";
import { canonical, digest } from "@odsuite/protocol";
import { fs, raw } from "../files.js";

export type TreeEntry =
  | { path: string; type: "directory" }
  | { path: string; type: "file"; bytes: number; digest: string; mode: number };
export const maxEntries = 8192;
export const maxExpanded = 2 * 1024 ** 3;
export function archivePath(name: string): string {
  const value = name.endsWith("/") ? name.slice(0, -1) : name,
    parts = value.split("/");
  if (
    !value ||
    Buffer.byteLength(value) > 4096 ||
    /[\\:<>"|?*]/.test(value) ||
    [...value].some((c) => c.charCodeAt(0) < 32 || c.charCodeAt(0) === 127) ||
    parts.length > 32 ||
    parts.some(
      (p) =>
        !p ||
        p === "." ||
        p === ".." ||
        /^(?:con|prn|aux|nul|com[1-9]|lpt[1-9])(?:\.|$)/i.test(p) ||
        /[. ]$/.test(p) ||
        Buffer.byteLength(p) > 255,
    )
  )
    throw Error("invalid archive path");
  return value;
}
export function describe(entries: TreeEntry[]) {
  entries.sort((a, b) => (a.path < b.path ? -1 : a.path > b.path ? 1 : 0));
  return {
    tree: digest(canonical({ schema: 1, entries })),
    expandedBytes: entries.reduce((n, e) => n + (e.type === "file" ? e.bytes : 0), 0),
  };
}
export async function tree(root: string, limit = maxExpanded) {
  const entries: TreeEntry[] = [];
  let bytes = 0;
  const walk = async (base: string) => {
    for (const child of await fs.readdir(join(root, base), { withFileTypes: true })) {
      const path = archivePath(base ? `${base}/${child.name}` : child.name),
        target = join(root, path),
        info = await fs.lstat(target);
      if (entries.length >= maxEntries || info.isSymbolicLink()) throw Error("archive tree bounds/type mismatch");
      if (info.isDirectory()) {
        entries.push({ path, type: "directory" });
        await walk(path);
      } else if (info.isFile()) {
        bytes += info.size;
        if (bytes > limit) throw Error("archive expanded size exceeded");
        const hash = createHash("sha256");
        for await (const chunk of raw.createReadStream(target)) hash.update(chunk);
        entries.push({
          path,
          type: "file",
          bytes: info.size,
          digest: `sha256:${hash.digest("hex")}`,
          mode: info.mode & 0o111 ? 0o755 : 0o644,
        });
      } else throw Error("unsupported archive tree entry");
    }
  };
  await walk("");
  const result = describe(entries);
  return { digest: result.tree, bytes: result.expandedBytes };
}
