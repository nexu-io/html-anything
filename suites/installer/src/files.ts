import { randomUUID } from "node:crypto";
import { constants } from "node:fs";
import { link, lstat, mkdir, open, realpath, unlink, writeFile } from "node:fs/promises";
import { dirname, isAbsolute, join, relative, resolve, sep } from "node:path";
import { InstallerFault } from "./types.js";

export const inside = (parent: string, child: string) => {
  const path = relative(parent, child);
  return !path || (!isAbsolute(path) && path !== ".." && !path.startsWith(`..${sep}`));
};
export async function canonical(path: string): Promise<string> {
  if (typeof path !== "string" || !isAbsolute(path) || path.includes("\0"))
    throw new InstallerFault("invalid", "installation paths must be absolute");
  path = resolve(path);
  try {
    return await realpath(path);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
    const parent = dirname(path);
    if (parent === path) throw error;
    return join(await canonical(parent), relative(parent, path));
  }
}
export async function directory(root: string, parts: string[] = []) {
  await mkdir(root, { recursive: true, mode: 0o700 });
  let path = root;
  for (const part of ["", ...parts]) {
    if (part) path = join(path, part);
    try {
      await mkdir(path, { mode: 0o700 });
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== "EEXIST") throw error;
    }
    const info = await lstat(path);
    if (!info.isDirectory() || info.isSymbolicLink())
      throw new InstallerFault("integrity", "installation directory is not regular");
  }
  return path;
}
export async function sync(path: string) {
  const file = await open(path, constants.O_RDONLY | constants.O_NOFOLLOW);
  try {
    await file.sync();
  } finally {
    await file.close();
  }
}
export async function json(path: string): Promise<unknown | undefined> {
  let file: Awaited<ReturnType<typeof open>>;
  try {
    file = await open(path, constants.O_RDONLY | constants.O_NOFOLLOW);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return undefined;
    throw error;
  }
  try {
    const stat = await file.stat();
    if (!stat.isFile() || stat.size > 16384)
      throw new InstallerFault("integrity", "invalid installation metadata file");
    return JSON.parse((await file.readFile()).toString("utf8"));
  } finally {
    await file.close();
  }
}
export async function exclusive(path: string, value: object) {
  const temporary = join(dirname(path), `.product-${randomUUID()}`);
  await writeFile(temporary, JSON.stringify(value), { flag: "wx", mode: 0o600, flush: true });
  try {
    await link(temporary, path);
    await sync(dirname(path));
  } finally {
    await unlink(temporary);
  }
}
