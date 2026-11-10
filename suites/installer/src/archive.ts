import { createHash } from "node:crypto";
import { constants } from "node:fs";
import { chmod, lstat, open, readdir } from "node:fs/promises";
import { join } from "node:path";
import { inspect } from "@odsuite/pack";
import { canonical } from "@odsuite/protocol";
import { bundleEntries } from "@odsuite/release";
import { sync } from "./files.js";
import { InstallerFault, type Source } from "./types.js";

export interface File {
  path: string;
  bytes: number;
  sha256: string;
  mode: 420 | 493;
}
export const hash = (bytes: Uint8Array) => createHash("sha256").update(bytes).digest("hex");
export function source(value: Source) {
  if (
    !(value?.bytes instanceof Uint8Array) ||
    !value.bytes.length ||
    value.bytes.length > 64 * 1024 ** 2 ||
    !/^[a-f0-9]{64}$/.test(value.sha256) ||
    hash(value.bytes) !== value.sha256
  )
    throw new InstallerFault("invalid", "invalid pinned Node closure bytes");
  try {
    const runtime = inspect(value.bytes),
      entries = bundleEntries(value.bytes);
    if (hash(Buffer.from(canonical({ schema: 1, files: entries }))) !== value.sha256)
      throw Error("Node archive must be canonical");
    const seen = new Set<string>();
    for (const entry of entries) {
      if (entry.path.length > 240 || entry.path.split("/").length > 16 || seen.has(entry.path.toLowerCase()))
        throw Error("invalid or case-colliding closure path");
      seen.add(entry.path.toLowerCase());
    }
    for (const entry of entries)
      for (let i = entry.path.indexOf("/"); i !== -1; i = entry.path.indexOf("/", i + 1))
        if (seen.has(entry.path.slice(0, i).toLowerCase())) throw Error("closure path collision");
    const files: File[] = entries.map((entry) => {
      const bytes = Buffer.from(entry.bytes, "base64");
      return { path: entry.path, bytes: bytes.length, mode: entry.mode, sha256: hash(bytes) };
    });
    return { runtime, files };
  } catch (error) {
    throw new InstallerFault("invalid", error instanceof Error ? error.message : "invalid Node closure");
  }
}
export async function verify(root: string, files: File[], freeze = false) {
  const expected = new Map(files.map((file) => [file.path, file])),
    found = new Set<string>();
  const walk = async (path: string, prefix: string) => {
    const info = await lstat(path);
    if (!info.isDirectory() || info.isSymbolicLink())
      throw new InstallerFault("integrity", "installed closure directory changed");
    for (const entry of await readdir(path, { withFileTypes: true })) {
      const name = prefix ? `${prefix}/${entry.name}` : entry.name,
        full = join(path, entry.name);
      if (entry.isDirectory()) {
        if (![...expected.keys()].some((key) => key.startsWith(`${name}/`)))
          throw new InstallerFault("integrity", "unexpected closure directory");
        await walk(full, name);
        continue;
      }
      const file = expected.get(name);
      if (!file || !entry.isFile() || entry.isSymbolicLink())
        throw new InstallerFault("integrity", "unexpected closure entry");
      const handle = await open(full, constants.O_RDONLY | constants.O_NOFOLLOW);
      try {
        const stat = await handle.stat();
        if (
          !stat.isFile() ||
          stat.size !== file.bytes ||
          (stat.mode & 0o111 ? 493 : 420) !== file.mode ||
          (stat.mode & 0o7000) !== 0 ||
          (!freeze && (stat.mode & 0o777) !== (file.mode & 0o555)) ||
          hash(await handle.readFile()) !== file.sha256
        )
          throw new InstallerFault("integrity", "installed closure bytes or mode changed");
        if (freeze) await handle.sync();
      } finally {
        await handle.close();
      }
      if (freeze) {
        await chmod(full, file.mode & 0o555);
        await sync(full);
      }
      found.add(name);
    }
    if (freeze) {
      await chmod(path, 0o555);
      await sync(path);
    }
  };
  await walk(root, "");
  if (found.size !== expected.size) throw new InstallerFault("integrity", "installed closure is incomplete");
}
