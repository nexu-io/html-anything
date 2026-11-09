import { readFile, realpath } from "node:fs/promises";
import { join } from "node:path";
import { namespace } from "@odsuite/protocol";
import { formatReleaseVersion, parseReleaseVersion, releaseChannel } from "@odsuite/release";
import { parseDocument } from "yaml";
import { located } from "./files.js";
import type { Configuration, Selection } from "./types.js";

function record(value: unknown, keys: string[]): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error("invalid pipeline configuration");
  if (Object.keys(value).some((key) => !keys.includes(key))) throw new Error("unknown pipeline configuration field");
  return value as Record<string, unknown>;
}
async function document(root: string): Promise<Record<string, unknown>> {
  const doc = parseDocument(await readFile(join(root, "odsuite.yaml"), "utf8"), { uniqueKeys: true });
  if (doc.errors.length) throw new Error("invalid odsuite YAML");
  const data = doc.toJS({ maxAliasCount: 0 }) as Record<string, unknown>;
  if (data?.schemaVersion !== 1) throw new Error("odsuite.schemaVersion must be 1");
  return data;
}
export async function configuredBase(root: string): Promise<string> {
  const data = await document(root);
  const runtime = record(data.runtime, ["appid", "name", "scheme", "version", "channel", "namespace", "carrier"]);
  return parseReleaseVersion(String(runtime.version), "stable").baseVersion;
}
export async function configuration(root: string, lane: string): Promise<Configuration> {
  root = await realpath(root);
  releaseChannel(lane);
  const data = await document(root);
  const runtime = record(data.runtime, ["appid", "name", "scheme", "version", "channel", "namespace", "carrier"]);
  if (runtime.channel !== "stable")
    throw new Error("pipeline runtime configuration must declare the stable base identity");
  const baseVersion = parseReleaseVersion(String(runtime.version), "stable").baseVersion;
  for (const key of ["appid", "name", "scheme", "namespace"])
    if (typeof runtime[key] !== "string") throw new Error(`runtime.${key} is required`);
  if (!Number.isSafeInteger(runtime.carrier) || Number(runtime.carrier) < 1) throw new Error("invalid carrier ABI");
  const pipeline = record(data.pipeline, ["carrier", "capsule", "daemon", "web", "outputs", "blobs"]);
  const units = {} as Configuration["units"];
  for (const key of ["carrier", "capsule", "daemon", "web"] as const) units[key] = await located(root, pipeline[key]);
  const declared =
    pipeline.outputs === undefined ? {} : record(pipeline.outputs, ["carrier", "capsule", "daemon", "web"]);
  const outputs = {} as Configuration["outputs"];
  for (const key of ["carrier", "capsule", "daemon", "web"] as const) {
    const value = declared[key] ?? "dist";
    if (typeof value !== "string" || !/^dist(?:\/[a-z][a-z0-9-]*)*$/.test(value))
      throw Error("pipeline output must be a bounded dist path");
    outputs[key] = value;
  }
  if (
    new Set(Object.keys(units).map((k) => join(units[k as keyof typeof units], outputs[k as keyof typeof outputs])))
      .size !== 4
  )
    throw Error("pipeline units must have distinct outputs");
  const blobs: Record<string, string> = {};
  if (pipeline.blobs !== undefined) {
    if (!pipeline.blobs || typeof pipeline.blobs !== "object" || Array.isArray(pipeline.blobs))
      throw new Error("pipeline.blobs must map slots to paths");
    for (const [key, value] of Object.entries(pipeline.blobs)) {
      if (!/^[a-z][a-z0-9]*$/.test(key) || typeof value !== "string") throw new Error("invalid blob declaration");
      // Build outputs may not exist yet; validate and canonicalize after compiling.
      if (!value || value.startsWith("/") || value.split(/[\\/]/).includes("..")) throw new Error("invalid blob path");
      blobs[key] = value;
    }
  }
  return {
    root,
    channel: lane,
    baseVersion,
    carrier: Number(runtime.carrier),
    namespace: namespace(String(runtime.namespace)),
    product: { appid: String(runtime.appid), name: String(runtime.name), scheme: String(runtime.scheme) },
    units,
    outputs,
    blobs,
  };
}
export function version(selection: Selection, baseVersion: string): string {
  if (selection.version !== undefined) {
    if (selection.number !== undefined || selection.base !== undefined)
      throw new Error("use either --version or --base/--number");
    return parseReleaseVersion(selection.version, selection.channel).releaseVersion;
  }
  return formatReleaseVersion(selection.channel, baseVersion, selection.number);
}
export const channelRoot = (root: string, lane: string) =>
  join(root, ".artifacts", "distribution", releaseChannel(lane));
