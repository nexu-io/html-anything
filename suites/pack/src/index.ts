import { createHash } from "node:crypto";
import { mkdir, realpath, writeFile } from "node:fs/promises";
import { dirname, isAbsolute, relative, resolve, sep } from "node:path";
import { bundle, bundleEntries, bundleFile, parseReleaseVersion } from "@odsuite/release";

export interface Identity {
  carrier: "standalone" | "codexplugin";
  version: string;
  channel: string;
}
export interface Input extends Identity {
  source: string;
  output: string;
}
export interface Package extends Identity {
  path: string;
  sha256: string;
  bytes: number;
}
export const hash = (bytes: Uint8Array) => createHash("sha256").update(bytes).digest("hex");
export function inspect(bytes: Uint8Array): Identity {
  const value = JSON.parse(Buffer.from(bundleFile(bytes, "runtime.json")).toString("utf8")) as Identity;
  if (Object.keys(value).sort().join(":") !== "carrier:channel:version") throw Error("invalid runtime identity");
  if (!["standalone", "codexplugin"].includes(value.carrier)) throw Error("unsupported carrier");
  parseReleaseVersion(value.version, value.channel);
  const entries = bundleEntries(bytes);
  for (const name of ["main.mjs", "LICENSE", "NOTICE", "web/index.html", "daemon/main.mjs", "render/worker.mjs"])
    if (!entries.some((file) => file.path === name)) throw Error(`incomplete carrier closure: ${name}`);
  if (value.carrier === "codexplugin") {
    const plugin = JSON.parse(Buffer.from(bundleFile(bytes, ".codex-plugin/plugin.json")).toString("utf8"));
    if (plugin.version !== value.version) throw Error("plugin version mismatch");
  }
  return value;
}
async function canonical(path: string): Promise<string> {
  try {
    return await realpath(path);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
    const parent = dirname(path);
    if (parent === path) throw error;
    return resolve(await canonical(parent), relative(parent, path));
  }
}
export async function pack(input: Input): Promise<Package> {
  parseReleaseVersion(input.version, input.channel);
  const source = await realpath(input.source),
    output = await canonical(resolve(input.output));
  const rel = relative(source, output);
  if (!isAbsolute(rel) && rel !== ".." && !rel.startsWith(`..${sep}`)) throw Error("output overlaps source");
  const identity: Identity = { carrier: input.carrier, version: input.version, channel: input.channel };
  const bytes = await bundle(source);
  const actual = inspect(bytes);
  if (actual.carrier !== identity.carrier || actual.channel !== identity.channel || actual.version !== identity.version)
    throw Error("runtime identity mismatch");
  await mkdir(dirname(output), { recursive: true });
  await writeFile(output, bytes, { flag: "wx", mode: 0o600 });
  return { ...identity, path: output, sha256: hash(bytes), bytes: bytes.length };
}
