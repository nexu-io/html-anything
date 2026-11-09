import { join } from "node:path";
import type { Digest } from "@odsuite/protocol";
import { anchor, exists, fs, view } from "../files.js";
import type { LibraryOptions } from "../types.js";

/** The deleting intent is durable before entry. A partial view remains resumable. */
export async function eraseView(
  cache: string,
  key: Digest,
  directory: boolean,
  checkpoint: LibraryOptions["onCheckpoint"],
) {
  const root = view(cache, key),
    value = join(root, "value");
  if (directory && (await exists(root)) && (await exists(value))) {
    await anchor(root);
    await anchor(value);
    if (!(await fs.lstat(value)).isDirectory()) throw Error("directory deletion view type mismatch");
    for (const name of (await fs.readdir(value)).sort()) {
      await anchor(root);
      await anchor(value);
      await fs.rm(join(value, name), { recursive: true, force: true });
      await checkpoint?.({ phase: "pruned", key, removed: name });
    }
  }
  await fs.rm(root, { recursive: true, force: true });
}
