import { randomUUID } from "node:crypto";
import { lstat, open, readFile, rename, writeFile } from "node:fs/promises";
import { join } from "node:path";
import type { Library } from "@odsuite/blob";
import { type KitCatalog, verifyKit } from "@odsuite/distribution/kit";
import { canonical } from "@odsuite/protocol";

export async function remember(root: string, snapshot: Awaited<ReturnType<KitCatalog["snapshot"]>>) {
  const path = join(root, `prepared-${snapshot.metadata.package.artifact.digest.slice(7)}.json`),
    text = canonical(snapshot);
  try {
    const old = await readFile(path, "utf8");
    if (old !== text) throw Error("prepared receipt identity conflict");
    return;
  } catch (e) {
    if ((e as NodeJS.ErrnoException).code !== "ENOENT") throw e;
  }
  const temporary = `${path}.${randomUUID()}.tmp`;
  await writeFile(temporary, text, { flag: "wx", mode: 0o600, flush: true });
  await rename(temporary, path);
  if (process.platform !== "win32") {
    const handle = await open(root, "r");
    try {
      await handle.sync();
    } finally {
      await handle.close();
    }
  }
}
export async function prepared(
  library: Library,
  root: string,
  publickey: string,
  expected: { product: string; channel: string },
) {
  const state = await library.status(),
    ref = state.references.find((r) => r.kind === "prepared" && r.name === "application");
  if (ref?.keys.length !== 1) throw Error("one verified prepared candidate is required");
  const resource = state.entries[ref.keys[0]!]!.resource,
    path = join(root, `prepared-${resource.artifact.digest.slice(7)}.json`),
    info = await lstat(path);
  if (!info.isFile() || info.size > 131072) throw Error("invalid prepared receipt file");
  const receipt = verifyKit(JSON.parse(await readFile(path, "utf8")), publickey, expected);
  if (canonical(resource) !== canonical({ type: "file", artifact: receipt.metadata.package.artifact }))
    throw Error("prepared reference differs from signed receipt");
  return receipt;
}
