import type { KitMetadata } from "@odsuite/distribution/kit";
import { verifySource } from "@odsuite/installer";
import { inspectNpm } from "@odsuite/pack/npm";
import { canonical, verify } from "@odsuite/protocol";
import { carriers, hash, type PackageManifest, parseManifest } from "./contract.js";

/** Validate inert bytes only. Never import or run a downloaded candidate. */
export function candidate(bytes: Uint8Array, metadata: KitMetadata, current: PackageManifest) {
  if (!verify(metadata.package.artifact, bytes)) throw Error("candidate archive integrity mismatch");
  const archive = inspectNpm(bytes),
    files = [
      "dist/LICENSE",
      "dist/NOTICE",
      "dist/codex-worker.mjs",
      "dist/main.mjs",
      "payload/manifest.json",
      ...carriers.map((c) => `payload/${c}.bundle`),
    ].sort(),
    expected = {
      name: metadata.package.name,
      version: metadata.version,
      private: true,
      type: "module",
      license: "Apache-2.0",
      engines: { node: ">=24" },
      bin: { odsuite: "dist/main.mjs" },
      files,
    };
  if (canonical(archive.metadata) !== canonical(expected)) throw Error("candidate npm identity mismatch");
  if ([...archive.files.keys()].sort().join("\0") !== [...files, "package.json"].sort().join("\0"))
    throw Error("candidate npm inventory mismatch");
  if (!Buffer.from(archive.files.get("dist/main.mjs")!).toString("utf8").startsWith("#!/usr/bin/env node\n"))
    throw Error("candidate entry requires Node shebang");
  const description = parseManifest(
    JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(archive.files.get("payload/manifest.json")!)),
  );
  if (
    canonical(description.product) !== canonical(current.product) ||
    description.release.identity.version !== metadata.version ||
    description.release.channel !== metadata.channel ||
    metadata.product !== current.product.appid
  )
    throw Error("candidate product release mismatch");
  for (const carrier of carriers) {
    const item = description.carriers[carrier],
      payload = archive.files.get(`payload/${carrier}.bundle`)!;
    if (payload.length !== item.bytes || hash(payload) !== item.sha256)
      throw Error("candidate carrier integrity mismatch");
    const identity = verifySource({ bytes: payload, sha256: item.sha256 }).runtime;
    const required = [
      "main.mjs",
      "LICENSE",
      "NOTICE",
      "web/index.html",
      "daemon/main.mjs",
      "render/worker.mjs",
      ...(carrier === "codexplugin" ? [".codex-plugin/plugin.json", "mcp.json"] : []),
    ];
    if (required.some((file) => !identity.files.includes(file))) throw Error("candidate carrier is incomplete");
    if (identity.carrier !== carrier || identity.version !== metadata.version || identity.channel !== metadata.channel)
      throw Error("candidate carrier release mismatch");
  }
  return description;
}
