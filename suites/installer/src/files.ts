import { createHash, randomUUID } from "node:crypto";
import * as regular from "node:fs";
import { createRequire } from "node:module";
import { dirname, join, resolve, sep } from "node:path";
import { canonical } from "@odsuite/protocol";
import type { Context } from "@odsuite/sidecar";
import { parse } from "plist";
import type { Job } from "./types.js";

// Electron's ASAR facade must not interpret installation archives as directories.
export const raw: typeof regular = process.versions.electron ? createRequire(import.meta.url)("original-fs") : regular;
export const io = raw.promises;
const { lstat, mkdir, open, readdir, readFile, readlink, rename, rm, writeFile } = io;

export function inside(root: string, path: string) {
  return path === root || path.startsWith(root + sep);
}
export async function save(path: string, value: unknown) {
  await mkdir(dirname(path), { recursive: true, mode: 0o700 });
  const tmp = `${path}.${randomUUID()}.tmp`;
  try {
    await writeFile(tmp, JSON.stringify(value), { flag: "wx", mode: 0o600, flush: true });
    await rename(tmp, path);
    await sync(dirname(path));
  } finally {
    await rm(tmp, { force: true });
  }
}
export async function sync(path: string) {
  const file = await open(path, "r");
  try {
    await file.sync();
  } finally {
    await file.close();
  }
}
export async function json<T>(path: string): Promise<T | undefined> {
  try {
    return JSON.parse(await readFile(path, "utf8"));
  } catch (e) {
    if ((e as NodeJS.ErrnoException).code === "ENOENT") return undefined;
    throw e;
  }
}
export async function hash(root: string): Promise<string> {
  const h = createHash("sha256");
  const walk = async (path: string): Promise<void> => {
    for (const entry of (await readdir(path, { withFileTypes: true })).sort((a, b) =>
      a.name < b.name ? -1 : a.name > b.name ? 1 : 0,
    )) {
      const file = join(path, entry.name),
        info = await lstat(file);
      const relative = file.slice(root.length);
      if (info.isSymbolicLink()) h.update(JSON.stringify(["link", relative, await readlink(file)]) + "\n");
      else if (info.isDirectory()) {
        h.update(JSON.stringify(["directory", relative, info.mode]) + "\n");
        await walk(file);
      } else if (info.isFile()) {
        const content = createHash("sha256"),
          handle = await open(file, "r");
        try {
          for await (const chunk of handle.createReadStream({ autoClose: false })) content.update(chunk);
        } finally {
          await handle.close();
        }
        h.update(JSON.stringify(["file", relative, info.mode, info.size, content.digest("hex")]) + "\n");
      } else throw Error("unsupported installation file type");
    }
  };
  await walk(root);
  return h.digest("hex");
}
export async function bundle(path: string, expected: { appid: string; version?: string }) {
  const bytes = await readFile(join(path, "Contents/Info.plist"));
  const info = parse(bytes.subarray(0, 8).toString() === "bplist00" ? bytes : bytes.toString("utf8")) as {
    CFBundleIdentifier?: string;
    CFBundleShortVersionString?: string;
    CFBundleExecutable?: string;
  };
  if (
    info.CFBundleIdentifier !== expected.appid ||
    !info.CFBundleExecutable ||
    !/^[a-z][a-z0-9-]*$/.test(info.CFBundleExecutable) ||
    (expected.version !== undefined && info.CFBundleShortVersionString !== expected.version)
  )
    throw Error("installed bundle identity/version mismatch");
  const executable = resolve(path, "Contents/MacOS", info.CFBundleExecutable);
  if (!inside(path, executable) || (await lstat(executable)).isSymbolicLink()) throw Error("invalid bundle executable");
  return { version: info.CFBundleShortVersionString!, executable };
}

export function jobPaths(job: Job, context: Context) {
  if (
    job.schema !== 1 ||
    !/^[a-f0-9-]{36}$/.test(job.id) ||
    !/^[a-f0-9-]{36}$/.test(job.nonce) ||
    !/^[a-z][a-z0-9-]*\.app$/.test(job.appName) ||
    job.home !== join(context.roots.data, "transactions", job.id) ||
    job.executor !== join(context.roots.resource, "executors", job.id, job.appName) ||
    job.worker !== join(context.roots.resource, "executors", job.id, "worker.mjs") ||
    job.catalog.product !== job.metadata.product ||
    job.catalog.channel !== job.metadata.channel ||
    !job.metadata.shells.some((s) => canonical(s) === canonical(job.shell))
  )
    throw Error("installation job escaped owner roots or identity");
}
