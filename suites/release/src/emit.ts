import { mkdir, rename, writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";

import { encode, type Manifest } from "./manifest.js";
import { parseReleaseVersion } from "./version.js";

export interface Unit {
  schema: 1;
  kind: "web" | "daemon";
  version: string;
  api: string;
}
export function unit(input: unknown, kind: Unit["kind"], channel?: string): Unit {
  if (!input || typeof input !== "object" || Array.isArray(input)) throw new Error("invalid unit manifest");
  const v = input as Unit;
  if (
    Object.keys(v).sort().join(":") !== "api:kind:schema:version" ||
    v.schema !== 1 ||
    v.kind !== kind ||
    typeof v.api !== "string" ||
    !/^[a-z][a-z0-9./-]{0,63}$/.test(v.api)
  )
    throw new Error("invalid unit manifest");
  parseReleaseVersion(v.version, channel);
  return { schema: 1, kind, version: v.version, api: v.api };
}
export async function emitUnit(root: string, input: Unit): Promise<void> {
  const value = unit(input, input.kind);
  await mkdir(root, { recursive: true });
  await writeFile(join(root, "unit.json"), JSON.stringify(value));
}

export async function emit(root: string, manifest: Manifest): Promise<string> {
  const directory = resolve(root);
  const target = join(directory, "release.json");
  const temporary = join(directory, "release.tmp");
  await mkdir(directory, { recursive: true });
  await writeFile(temporary, encode(manifest), { mode: 0o600 });
  await rename(temporary, target);
  return target;
}
export async function emitBuildUnit(
  root: string,
  defaults: { kind: Unit["kind"]; baseVersion: string; api: string },
  env: Record<string, string | undefined> = process.env,
): Promise<void> {
  let version = env.ODSUITE_UNIT_VERSION;
  if (!version) {
    version = defaults.baseVersion;
    if (env.ODSUITE_BUILD) {
      try {
        version = parseReleaseVersion(env.ODSUITE_BUILD).releaseVersion;
      } catch {
        /* Build markers are not release identities. */
      }
    }
  }
  await emitUnit(root, { schema: 1, kind: defaults.kind, version, api: env.ODSUITE_UNIT_API ?? defaults.api });
}
