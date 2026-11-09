import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { canonical, envelope, verify } from "@odsuite/protocol";
import type { Release } from "@odsuite/publish";
import { bundleFile, decode, type Manifest, parseReleaseVersion, type Unit, unit } from "@odsuite/release";

export async function unitFile(path: string, kind: Unit["kind"]): Promise<Unit | undefined> {
  try {
    return unit(JSON.parse(await readFile(join(path, "unit.json"), "utf8")), kind);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return undefined;
    throw error;
  }
}
export function leaf(current: Release, incoming: Release, channel: string) {
  const before = envelope(current.envelope).generation,
    after = envelope(incoming.envelope).generation;
  if (
    before.carrier !== after.carrier ||
    canonical(before.capsule) !== canonical(after.capsule) ||
    canonical(before.blobs) !== canonical(after.blobs)
  )
    throw new Error("leaf update requires identical carrier/capsule/blobs");
  const pair = (release: Release) =>
    Object.fromEntries(
      (["web", "daemon"] as const).map((kind) => {
        const artifact = release.envelope.generation[kind],
          asset = release.assets.find((a) => a.artifact.kind === kind);
        if (!asset || !verify(artifact, asset.bytes)) throw new Error("leaf content integrity mismatch");
        return [
          kind,
          unit(JSON.parse(Buffer.from(bundleFile(asset.bytes, "unit.json")).toString("utf8")), kind, channel),
        ];
      }),
    ) as Record<Unit["kind"], Unit>;
  const previous = pair(current),
    next = pair(incoming);
  if (next.web.api !== next.daemon.api) throw new Error("incompatible web/daemon API");
  const changed = (["web", "daemon"] as const).filter((k) => before[k].digest !== after[k].digest);
  if (!changed.length) throw new Error("no changed leaf units");
  for (const kind of changed) {
    const a = parseReleaseVersion(previous[kind].version, channel),
      b = parseReleaseVersion(next[kind].version, channel);
    const av = [...a.baseVersion.split(".").map(Number), a.number ?? 0],
      bv = [...b.baseVersion.split(".").map(Number), b.number ?? 0];
    const first = av.findIndex((v, i) => v !== bv[i]);
    if (first < 0 || (bv[first] ?? 0) <= (av[first] ?? 0)) throw new Error("changed unit version must increase");
  }
  return { changed, next };
}

function newer(previous: string, next: string, channel: string) {
  const a = parseReleaseVersion(previous, channel),
    b = parseReleaseVersion(next, channel);
  const av = [...a.baseVersion.split(".").map(Number), a.number ?? 0],
    bv = [...b.baseVersion.split(".").map(Number), b.number ?? 0];
  const first = av.findIndex((v, i) => v !== bv[i]);
  if (first < 0 || (bv[first] ?? 0) <= (av[first] ?? 0)) throw new Error("changed unit version must increase");
}
function capsuleManifest(release: Release): Manifest {
  const artifact = release.envelope.generation.capsule,
    asset = release.assets.find((a) => a.artifact.kind === "capsule");
  if (!asset || !verify(artifact, asset.bytes)) throw new Error("capsule content integrity mismatch");
  return decode(Buffer.from(bundleFile(asset.bytes, "release.json")).toString("utf8"));
}
export function capsulePlan(current: Release, incoming: Release, channel: string, carrier: number) {
  const before = envelope(current.envelope).generation,
    after = envelope(incoming.envelope).generation;
  if (before.capsule.digest === after.capsule.digest) throw new Error("capsule candidate has no changed entry");
  if (after.carrier > carrier) throw new Error("incompatible carrier ABI");
  const previous = capsuleManifest(current),
    next = capsuleManifest(incoming);
  if (
    previous.channel !== channel ||
    next.channel !== channel ||
    previous.identity.appid !== next.identity.appid ||
    previous.identity.origin !== next.identity.origin ||
    previous.identity.scheme !== next.identity.scheme
  )
    throw new Error("capsule identity mismatch");
  newer(previous.identity.version, next.identity.version, channel);
  const changed = (["web", "daemon"] as const).filter((kind) => before[kind].digest !== after[kind].digest);
  const contracts = Object.fromEntries(
    (["web", "daemon"] as const).map((kind) => {
      const artifact = after[kind],
        asset = incoming.assets.find((a) => a.artifact.kind === kind);
      if (!asset || !verify(artifact, asset.bytes)) throw new Error("unit integrity mismatch");
      const metadata = unit(
        JSON.parse(Buffer.from(bundleFile(asset.bytes, "unit.json")).toString("utf8")),
        kind,
        channel,
      );
      if (changed.includes(kind)) {
        const oldAsset = current.assets.find((a) => a.artifact.kind === kind);
        if (!oldAsset || !verify(before[kind], oldAsset.bytes)) throw new Error("old unit integrity mismatch");
        const old = unit(
          JSON.parse(Buffer.from(bundleFile(oldAsset.bytes, "unit.json")).toString("utf8")),
          kind,
          channel,
        );
        newer(old.version, metadata.version, channel);
      }
      return [kind, metadata];
    }),
  ) as Record<Unit["kind"], Unit>;
  if (contracts.web.api !== contracts.daemon.api) throw new Error("incompatible web/daemon API");
  return { changed, previous, next, contracts };
}
