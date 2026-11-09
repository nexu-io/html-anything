import { join } from "node:path";
import { canonical, digest, kinds, valid, verify } from "@odsuite/protocol";
import { bundleDestination, bundleEntries } from "@odsuite/release";
import { fs } from "../files.js";
import type { Resource } from "../types.js";
import { tree } from "./tree.js";
import { extractZip } from "./zip.js";

export function resource(input: Resource): Resource {
  if (
    !input ||
    !["file", "directory", "archive"].includes(input.type) ||
    Object.keys(input).some(
      (k) =>
        ![
          "artifact",
          "type",
          "platform",
          "arch",
          ...(input.type === "archive" ? ["tree", "expandedBytes"] : []),
        ].includes(k),
    )
  )
    throw Error("invalid blob resource type/fields");
  const a = input.artifact;
  if (
    !a ||
    !kinds.includes(a.kind) ||
    !valid(a.digest) ||
    !Number.isSafeInteger(a.bytes) ||
    a.bytes < 0 ||
    a.bytes > (input.type === "archive" ? 512 : 64) * 1024 ** 2 ||
    !/^[a-z][a-z0-9]*$/.test(a.slot) ||
    Object.keys(a).sort().join() !== "bytes,digest,kind,slot"
  )
    throw Error("invalid blob artifact");
  if (input.platform !== undefined && !["darwin", "linux", "win32"].includes(input.platform))
    throw Error("invalid blob platform");
  if (input.arch !== undefined && !["arm64", "x64"].includes(input.arch)) throw Error("invalid blob architecture");
  if (a.kind !== "blob" && input.type !== "directory") throw Error("executable content requires directory type");
  if (
    input.type === "archive" &&
    (!valid(input.tree) ||
      !Number.isSafeInteger(input.expandedBytes) ||
      input.expandedBytes < 0 ||
      input.expandedBytes > 2 * 1024 ** 3)
  )
    throw Error("invalid native archive bounds/tree");
  return structuredClone(input);
}
export const key = (value: Resource) => digest(canonical(resource(value)));
export function compatible(value: Resource) {
  if ((value.platform && value.platform !== process.platform) || (value.arch && value.arch !== process.arch))
    throw Error("blob platform/architecture mismatch");
}
export async function materialize(value: Resource, bytes: Uint8Array | string, root: string, signal?: AbortSignal) {
  if (value.type === "archive") {
    if (typeof bytes !== "string") throw Error("archive requires a verified CAS path");
    await fs.mkdir(root, { mode: 0o700 });
    await extractZip(bytes, join(root, "value"), value, signal);
    return;
  }
  if (typeof bytes === "string") throw Error("content requires buffered bytes");
  if (!verify(value.artifact, bytes)) throw Error("blob integrity mismatch");
  await fs.mkdir(root, { mode: 0o700 });
  if (value.type === "file") await fs.writeFile(join(root, "value"), bytes, { flag: "wx", mode: 0o600, flush: true });
  else {
    const base = join(root, "value");
    await fs.mkdir(base, { mode: 0o700 });
    for (const entry of bundleEntries(bytes)) {
      const path = bundleDestination(base, entry.path);
      await fs.mkdir(join(path, ".."), { recursive: true, mode: 0o700 });
      await fs.writeFile(path, Buffer.from(entry.bytes, "base64"), { flag: "wx", mode: entry.mode, flush: true });
    }
  }
  await exact(value, root);
}
export async function exact(value: Resource, root: string) {
  const path = join(root, "value");
  if ((await fs.lstat(root)).isSymbolicLink() || (await fs.lstat(path)).isSymbolicLink())
    throw Error("blob materialization symlink");
  if (value.type === "archive") {
    const actual = await tree(path, value.expandedBytes);
    if (actual.digest !== value.tree || actual.bytes !== value.expandedBytes)
      throw Error("archive materialization integrity mismatch");
    return path;
  }
  let bytes: Uint8Array;
  if (value.type === "file") {
    const info = await fs.lstat(path);
    if (!info.isFile()) throw Error("blob materialization type mismatch");
    if (info.size !== value.artifact.bytes) throw Error("blob materialization integrity mismatch");
    bytes = await fs.readFile(path);
  } else {
    const files: { path: string; bytes: string; mode: number }[] = [];
    let count = 0,
      total = 0;
    const walk = async (base: string) => {
      for (const entry of await fs.readdir(join(path, base), { withFileTypes: true })) {
        const name = base ? `${base}/${entry.name}` : entry.name,
          target = join(path, name),
          info = await fs.lstat(target);
        count++;
        total += info.isFile() ? info.size : 0;
        if (count > 8192 || total > 64 * 1024 ** 2) throw Error("blob materialization exceeds limits");
        if (info.isSymbolicLink()) throw Error("blob materialization symlink");
        if (info.isDirectory()) await walk(name);
        else if (info.isFile())
          files.push({
            path: name,
            bytes: (await fs.readFile(target)).toString("base64"),
            mode: info.mode & 0o111 ? 0o755 : 0o644,
          });
        else throw Error("unsupported blob file type");
      }
    };
    await walk("");
    files.sort((a, b) => (a.path < b.path ? -1 : a.path > b.path ? 1 : 0));
    bytes = Buffer.from(canonical({ files, schema: 1 }));
  }
  if (!verify(value.artifact, bytes)) throw Error("blob materialization integrity mismatch");
  return path;
}
