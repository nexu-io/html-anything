import { createHash } from "node:crypto";
import { lstat, readFile, realpath } from "node:fs/promises";
import { basename, dirname, isAbsolute, join, resolve } from "node:path";
import { inspect } from "@odsuite/pack";
import { canonical, type FactoryScope, factoryScope } from "@odsuite/protocol";
import { type Manifest, parse, resolve as release } from "@odsuite/release";
export const carriers = ["standalone", "codexplugin"] as const;
export type Carrier = (typeof carriers)[number];
export interface PackageManifest {
  schemaVersion: 1;
  product: { appid: string; name: string; scheme: string };
  release: Manifest;
  namespace: string;
  carriers: Record<Carrier, { file: string; sha256: string; bytes: number }>;
}
export interface Selection {
  home: string;
  data: string;
  scope: FactoryScope;
  carrier: Carrier;
  profile: string;
  skills: string;
  codex?: string;
}
export const hash = (value: string | Uint8Array) => createHash("sha256").update(value).digest("hex");
function keys(value: unknown, expected: string[]): asserts value is Record<string, unknown> {
  if (
    !value ||
    typeof value !== "object" ||
    Array.isArray(value) ||
    Object.keys(value).sort().join(":") !== expected.sort().join(":")
  )
    throw Error("invalid application manifest fields");
}
export async function manifest(directory: string): Promise<PackageManifest> {
  const file = join(directory, "manifest.json"),
    info = await lstat(file);
  if (!info.isFile() || info.size > 32768) throw Error("application manifest must be a bounded regular file");
  const value: unknown = JSON.parse(await readFile(file, "utf8"));
  keys(value, ["schemaVersion", "product", "release", "namespace", "carriers"]);
  if (value.schemaVersion !== 1) throw Error("unsupported application manifest");
  keys(value.product, ["appid", "name", "scheme"]);
  if (Object.values(value.product).some((v) => typeof v !== "string")) throw Error("invalid product identity");
  const product = value.product as PackageManifest["product"],
    version = parse(value.release);
  if (
    canonical(release({}, { channel: version.channel, version: version.identity.version }, product)) !==
    canonical(version)
  )
    throw Error("application release identity mismatch");
  factoryScope({ channel: version.channel, namespace: value.namespace });
  keys(value.carriers, [...carriers]);
  for (const name of carriers) {
    const item = value.carriers[name];
    keys(item, ["file", "sha256", "bytes"]);
    if (
      item.file !== `${name}.bundle` ||
      typeof item.sha256 !== "string" ||
      !/^[a-f0-9]{64}$/.test(item.sha256) ||
      !Number.isSafeInteger(item.bytes) ||
      Number(item.bytes) < 1 ||
      Number(item.bytes) > 64 * 1024 ** 2
    )
      throw Error("invalid carrier payload descriptor");
  }
  return { ...value, product, release: version } as unknown as PackageManifest;
}
export async function payload(directory: string, description: PackageManifest) {
  const result = {} as Record<Carrier, { bytes: Uint8Array; sha256: string }>;
  for (const name of carriers) {
    const item = description.carriers[name],
      file = join(directory, item.file),
      info = await lstat(file);
    if (!info.isFile() || info.size !== item.bytes) throw Error("carrier payload size mismatch");
    const bytes = await readFile(file),
      actual = inspect(bytes);
    if (
      hash(bytes) !== item.sha256 ||
      actual.carrier !== name ||
      actual.version !== description.release.identity.version ||
      actual.channel !== description.release.channel
    )
      throw Error("carrier payload identity mismatch");
    result[name] = { bytes, sha256: item.sha256 };
  }
  return result;
}
export async function path(value: string): Promise<string> {
  const absolute = resolve(value);
  try {
    return await realpath(absolute);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
  }
  const parent = dirname(absolute);
  if (parent === absolute || !isAbsolute(absolute)) throw Error("invalid application path");
  return join(await path(parent), basename(absolute));
}
