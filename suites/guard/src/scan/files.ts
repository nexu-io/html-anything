import { readdir } from "node:fs/promises";
import { join } from "node:path";
import { matches } from "../config/match.js";
import type { Entry, Policy } from "../types.js";

export async function files(root: string, policy: Policy, pruned: Entry[] = []): Promise<Entry[]> {
  const entries: Entry[] = [];
  async function walk(parent: string): Promise<void> {
    for (const child of await readdir(join(root, parent), { withFileTypes: true })) {
      const path = parent ? `${parent}/${child.name}` : child.name;
      if (!parent && child.name === ".git") continue;
      const kind = child.isSymbolicLink()
        ? "link"
        : child.isDirectory()
          ? "directory"
          : child.isFile()
            ? "file"
            : undefined;
      if (!kind) throw new Error(`unsupported filesystem entry: ${path}`);
      if (matches(path, policy.exclude) || matches(`${path}/`, policy.exclude)) {
        if (kind !== "file") pruned.push({ path, kind });
        continue;
      }
      entries.push({ path, kind });
      if (kind === "directory") await walk(path);
    }
  }
  await walk("");
  return entries.sort((left, right) => left.path.localeCompare(right.path, "en"));
}
