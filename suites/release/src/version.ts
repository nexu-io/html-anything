import type { Channel } from "@odsuite/protocol";
import { releaseChannel } from "./channel.js";

export type ReleaseVersion = Readonly<
  | { channel: Channel; baseVersion: string; releaseVersion: string; number: number }
  | { channel: Channel; baseVersion: string; releaseVersion: string; number?: never }
>;
const integer = "(?:0|[1-9]\\d*)";
const base = `${integer}\\.${integer}\\.${integer}`;
const pattern = new RegExp(`^(${base})(?:-([a-z0-9]{1,12})\\.([1-9]\\d*))?$`);
function core(value: string): void {
  if (
    typeof value !== "string" ||
    value.trim() !== value ||
    !new RegExp(`^${base}$`).test(value) ||
    !value.split(".").every((part) => Number.isSafeInteger(Number(part)))
  )
    throw new TypeError("base version must be canonical X.Y.Z with safe integer components");
}
export function parseReleaseVersion(value: string, expected?: string): ReleaseVersion {
  if (typeof value !== "string") throw new TypeError("release version must be a string");
  const match = pattern.exec(value);
  if (!match?.[1] || match[0] !== value) throw new TypeError("release version must be X.Y.Z or X.Y.Z-<channel>.N");
  core(match[1]);
  const lane = releaseChannel(match[2] ?? "stable");
  if (match[2] === "stable") throw new TypeError("stable release version cannot have a prerelease suffix");
  if (expected !== undefined && releaseChannel(expected) !== lane)
    throw new TypeError("release version/channel mismatch");
  const number = match[3] === undefined ? undefined : Number(match[3]);
  if (number !== undefined && !Number.isSafeInteger(number))
    throw new TypeError("release number must be a safe integer");
  return Object.freeze({
    channel: lane,
    baseVersion: match[1],
    releaseVersion: value,
    ...(number === undefined ? {} : { number }),
  });
}
export function formatReleaseVersion(value: string, baseVersion: string, number?: number): string {
  const lane = releaseChannel(value);
  core(baseVersion);
  if (lane === "stable") {
    if (number !== undefined) throw new TypeError("stable release version has no release number");
    return baseVersion;
  }
  if (!Number.isSafeInteger(number) || (number ?? 0) < 1)
    throw new TypeError("release number must be a positive safe integer");
  return `${baseVersion}-${lane}.${number}`;
}
export function releaseMetadataVersionFields(
  value: string,
  version: string,
): Readonly<Record<string, string | number>> {
  const parsed = parseReleaseVersion(version, value);
  return Object.freeze({
    baseVersion: parsed.baseVersion,
    releaseVersion: parsed.releaseVersion,
    ...(parsed.number === undefined ? { stableVersion: parsed.baseVersion } : { releaseNumber: parsed.number }),
  });
}
