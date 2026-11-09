import { lstat, open, readFile, realpath, rename, rm } from "node:fs/promises";
import { createConnection } from "node:net";
import { tmpdir } from "node:os";
import { basename, dirname, join, relative, sep } from "node:path";
import type { Cleanup } from "./types.js";

export async function bytes(path: string): Promise<string | undefined> {
  try {
    if (!(await lstat(path)).isFile()) throw new Error("metadata must be a regular file");
    return await readFile(path, "utf8");
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return undefined;
    throw error;
  }
}
export async function witness(path: string, kind: Cleanup["kind"], control = false): Promise<Cleanup | undefined> {
  try {
    const file = await lstat(path);
    if (!(kind === "socket" ? file.isSocket() : kind === "directory" ? file.isDirectory() : file.isFile()))
      throw new Error("resource kind mismatch");
    path = join(await realpath(dirname(path)), basename(path));
    return { path, kind, dev: file.dev, ino: file.ino, ctime: file.ctimeMs, ...(control ? { control: true } : {}) };
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return undefined;
    throw error;
  }
}
export async function checkCleanup(value: Cleanup) {
  const current = await witness(value.path, value.kind, value.control);
  if (
    current &&
    (current.path !== value.path ||
      current.dev !== value.dev ||
      current.ino !== value.ino ||
      (value.kind !== "directory" && current.ctime !== value.ctime))
  )
    throw new Error("resource file identity changed");
  if (current?.kind === "socket") await inactiveSocket(value.path);
}
export async function inactiveSocket(path: string) {
  // Probe through the OS temp spelling: macOS realpath can exceed sockaddr_un
  // even though the granted TMPDIR spelling successfully bound the same socket.
  // Canonical inode witnesses still govern validation and deletion.
  const temporary = tmpdir();
  const canonical = await realpath(temporary);
  if (canonical !== temporary && path.startsWith(canonical + sep)) {
    const candidate = join(temporary, relative(canonical, path));
    if (join(await realpath(dirname(candidate)), basename(candidate)) !== path)
      throw new Error("socket probe path changed");
    path = candidate;
  }
  await new Promise<void>((done, reject) => {
    const socket = createConnection(path);
    const timer = setTimeout(() => {
      socket.destroy();
      reject(new Error("socket ownership unavailable"));
    }, 1000);
    socket.once("connect", () => {
      clearTimeout(timer);
      socket.destroy();
      reject(new Error("socket remains alive"));
    });
    socket.once("error", (error) => {
      clearTimeout(timer);
      socket.destroy();
      if (["ECONNREFUSED", "ENOENT"].includes((error as NodeJS.ErrnoException).code ?? "")) done();
      else reject(error);
    });
  });
}
export async function remove(value: Cleanup) {
  await checkCleanup(value);
  await rm(value.path, { force: true, recursive: value.kind === "directory" });
  const directory = await open(dirname(value.path), "r");
  try {
    await directory.sync();
  } finally {
    await directory.close();
  }
}
/** Deterministic intent-owned pending file is retryable after SIGKILL. */
export async function atomic(path: string, value: string, id: string) {
  if ((await realpath(dirname(path))) !== dirname(path)) throw new Error("linked metadata parent");
  const pending = `${path}.recovery-${id.slice(7)}.tmp`;
  const prior = await bytes(pending);
  if (prior !== undefined) {
    const partial = await readFile(pending),
      target = Buffer.from(value);
    if (!target.subarray(0, partial.length).equals(partial)) throw new Error("recovery pending file conflict");
    await rm(pending);
  }
  const file = await open(pending, "wx", 0o600);
  try {
    await file.writeFile(value);
    await file.sync();
  } finally {
    await file.close();
  }
  await rename(pending, path);
  const directory = await open(dirname(path), "r");
  try {
    await directory.sync();
  } finally {
    await directory.close();
  }
}
