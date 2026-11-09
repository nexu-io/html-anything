import { type Digest, envelope, valid } from "@odsuite/protocol";
import { parseReleaseVersion, releaseChannel } from "@odsuite/release";

export interface Shell {
  platform: "mac" | "linux" | "win";
  arch: "arm64" | "x64";
  version: string;
  digest: Digest;
  bytes: number;
  format: "zip" | "tar";
}
export interface Metadata {
  schema: 1;
  product: string;
  channel: string;
  version: string;
  revision: number;
  minShellVersion: string;
  content: ReturnType<typeof envelope>;
  units: { capsule: string; web: string; daemon: string };
  shells: Shell[];
}
export function fields(value: unknown, names: string[]): Record<string, unknown> {
  if (
    !value ||
    typeof value !== "object" ||
    Array.isArray(value) ||
    Object.keys(value).sort().join(":") !== [...names].sort().join(":")
  )
    throw new Error("invalid distribution fields");
  return value as Record<string, unknown>;
}
export function product(value: unknown): string {
  if (typeof value !== "string" || !/^[a-z0-9]+(?:\.[a-z0-9]+)+$/.test(value))
    throw new Error("invalid distribution product");
  return value;
}
export function compare(left: string, right: string, channel: string): number {
  const a = parseReleaseVersion(left, channel),
    b = parseReleaseVersion(right, channel);
  const av = [...a.baseVersion.split(".").map(Number), a.number ?? 0];
  const bv = [...b.baseVersion.split(".").map(Number), b.number ?? 0];
  const index = av.findIndex((v, i) => v !== bv[i]);
  return index === -1 ? 0 : Math.sign(av[index]! - bv[index]!);
}
export function metadata(input: unknown): Metadata {
  const v = fields(input, [
    "schema",
    "product",
    "channel",
    "version",
    "revision",
    "minShellVersion",
    "content",
    "units",
    "shells",
  ]);
  if (v.schema !== 1 || !Number.isSafeInteger(v.revision) || Number(v.revision) < 1)
    throw new Error("invalid distribution header");
  const lane = releaseChannel(String(v.channel));
  parseReleaseVersion(v.version as string, lane);
  parseReleaseVersion(v.minShellVersion as string, lane);
  const units = fields(v.units, ["capsule", "web", "daemon"]);
  for (const version of Object.values(units)) parseReleaseVersion(version as string, lane);
  if (!Array.isArray(v.shells) || v.shells.length < 1 || v.shells.length > 16) throw new Error("invalid shell targets");
  const shells = v.shells.map((input) => {
    const s = fields(input, ["platform", "arch", "version", "digest", "bytes", "format"]);
    if (
      !["mac", "linux", "win"].includes(String(s.platform)) ||
      !["arm64", "x64"].includes(String(s.arch)) ||
      !["zip", "tar"].includes(String(s.format)) ||
      !valid(s.digest) ||
      !Number.isSafeInteger(s.bytes) ||
      Number(s.bytes) < 1
    )
      throw new Error("invalid shell artifact");
    if (compare(s.version as string, v.minShellVersion as string, lane) < 0)
      throw new Error("shell artifact below minimum");
    return { ...s } as unknown as Shell;
  });
  if (new Set(shells.map((s) => `${s.platform}/${s.arch}`)).size !== shells.length)
    throw new Error("duplicate shell target");
  return {
    schema: 1,
    product: product(v.product),
    channel: lane,
    version: v.version as string,
    revision: Number(v.revision),
    minShellVersion: v.minShellVersion as string,
    content: envelope(v.content),
    units: units as unknown as Metadata["units"],
    shells,
  };
}
export function shellPath(shell: Shell): string {
  return `shells/v${shell.version}/${shell.platform}-${shell.arch}/update.${shell.format}`;
}
export class ShellRequired extends Error {
  constructor(
    readonly metadata: Metadata,
    readonly installed: string,
    readonly shell?: Shell,
  ) {
    super(`shell ${installed} is below required ${metadata.minShellVersion}`);
    this.name = "ShellRequired";
  }
}
export function negotiate(value: Metadata, installed: string, platform: string, arch: string): void {
  if (compare(installed, value.minShellVersion, value.channel) < 0)
    throw new ShellRequired(
      value,
      installed,
      value.shells.find((s) => s.platform === platform && s.arch === arch),
    );
}
