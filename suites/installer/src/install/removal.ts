import { constants } from "node:fs";
import { chmod, lstat, open, readdir, rmdir, unlink } from "node:fs/promises";
import { dirname, join } from "node:path";
import { type File, hash } from "../archive.js";
import { canonical, sync } from "../files.js";
import { InstallerFault } from "../types.js";

/** Delete only retained manifest entries. Missing entries are legal only after durable retirement intent. */
export async function remove(root: string, files: File[], checkpoint: (path: string) => Promise<void>) {
  if ((await canonical(root)) !== root) throw new InstallerFault("integrity", "retiring closure path changed");
  const expected = new Map(files.map((file) => [file.path, file]));
  const directories = new Set([""]);
  for (const file of files) {
    const parts = file.path.split("/");
    for (let i = 1; i < parts.length; i++) directories.add(parts.slice(0, i).join("/"));
  }
  const existingFiles: string[] = [],
    existingDirectories: string[] = [];
  const walk = async (prefix: string) => {
    const path = join(root, prefix);
    let info: Awaited<ReturnType<typeof lstat>>;
    try {
      info = await lstat(path);
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === "ENOENT") return;
      throw error;
    }
    if (!info.isDirectory() || info.isSymbolicLink())
      throw new InstallerFault("integrity", "retiring directory changed");
    existingDirectories.push(path);
    for (const item of await readdir(path, { withFileTypes: true })) {
      const name = prefix ? `${prefix}/${item.name}` : item.name;
      if (item.isDirectory() && directories.has(name)) {
        await walk(name);
        continue;
      }
      const file = expected.get(name);
      if (!file || !item.isFile() || item.isSymbolicLink())
        throw new InstallerFault("integrity", "unexpected retiring closure entry");
      const handle = await open(join(root, name), constants.O_RDONLY | constants.O_NOFOLLOW);
      try {
        const stat = await handle.stat();
        if (
          !stat.isFile() ||
          stat.size !== file.bytes ||
          (stat.mode & 0o777) !== (file.mode & 0o555) ||
          stat.mode & 0o7000 ||
          hash(await handle.readFile()) !== file.sha256
        )
          throw new InstallerFault("integrity", "retiring closure bytes changed");
      } finally {
        await handle.close();
      }
      existingFiles.push(join(root, name));
    }
  };
  await walk("");
  // Validate the entire remaining tree before the first mutation; do not follow links or recurse over unknown files.
  for (const path of existingDirectories) await chmod(path, 0o700);
  for (const path of existingFiles) {
    await unlink(path);
    await sync(dirname(path));
    await checkpoint(path);
  }
  for (const path of existingDirectories.reverse()) {
    await rmdir(path);
    await sync(dirname(path));
  }
}
