import { readFile, realpath } from "node:fs/promises";
import { join } from "node:path";
import { namespace } from "@odsuite/protocol";
import { formatReleaseVersion, parseReleaseVersion, releaseChannel } from "@odsuite/release";
import { parseDocument } from "yaml";
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
  const runtime = record(data.runtime, ["appid", "name", "scheme", "version", "channel", "namespace"]);
  return parseReleaseVersion(String(runtime.version), "stable").baseVersion;
}
export async function configuration(root: string, lane: string): Promise<Configuration> {
  root = await realpath(root);
  releaseChannel(lane);
  const data = await document(root);
  const runtime = record(data.runtime, ["appid", "name", "scheme", "version", "channel", "namespace"]);
  if (runtime.channel !== "stable")
    throw new Error("pipeline runtime configuration must declare the stable base identity");
  const baseVersion = parseReleaseVersion(String(runtime.version), "stable").baseVersion;
  for (const key of ["appid", "name", "scheme", "namespace"])
    if (typeof runtime[key] !== "string") throw new Error(`runtime.${key} is required`);
  const pipeline = record(data.pipeline, ["carriers", "application"]);
  if (!pipeline.carriers || typeof pipeline.carriers !== "object" || Array.isArray(pipeline.carriers))
    throw Error("pipeline.carriers must declare finite carrier outputs");
  const entries = Object.entries(pipeline.carriers);
  if (!entries.length || entries.length > 8) throw Error("pipeline requires one to eight carriers");
  const units: Record<string, string> = {};
  for (const [key, value] of entries) {
    if (
      !/^[a-z][a-z0-9-]{0,31}$/.test(key) ||
      typeof value !== "string" ||
      !/^carriers\/[a-z][a-z0-9-]*\/dist(?:\/[a-z][a-z0-9-]*)*$/.test(value)
    )
      throw Error("carrier output must be a bounded carriers/<module>/dist path");
    units[key] = value;
  }
  if (new Set(Object.values(units)).size !== entries.length) throw Error("carriers require distinct outputs");
  const app = record(pipeline.application, ["directory", "name", "bin", "entry", "files", "license"]);
  if (
    typeof app.directory !== "string" ||
    !/^packages\/[a-z][a-z0-9-]*\/dist(?:\/[a-z][a-z0-9-]*)*$/.test(app.directory)
  )
    throw Error("application output must be a bounded packages/<module>/dist path");
  if (
    typeof app.name !== "string" ||
    !/^(?:@[a-z0-9][a-z0-9-]*\/)?[a-z0-9][a-z0-9-]*$/.test(app.name) ||
    typeof app.bin !== "string" ||
    !/^[a-z][a-z0-9-]*$/.test(app.bin) ||
    typeof app.license !== "string" ||
    !app.license
  )
    throw Error("invalid application package identity");
  if (
    !Array.isArray(app.files) ||
    !app.files.length ||
    app.files.length > 32 ||
    new Set(app.files).size !== app.files.length ||
    app.files.some(
      (file) =>
        typeof file !== "string" ||
        !/^[a-zA-Z0-9][a-zA-Z0-9./-]*$/.test(file) ||
        file === "recipe.json" ||
        file.split("/").some((p: string) => !p || p === "." || p === ".."),
    ) ||
    typeof app.entry !== "string" ||
    !app.files.includes(app.entry)
  )
    throw Error("invalid application file composition");
  return {
    root,
    channel: lane,
    namespace: namespace(String(runtime.namespace)),
    application: {
      directory: app.directory,
      name: app.name,
      bin: app.bin,
      entry: app.entry,
      files: app.files as string[],
      license: app.license,
    },
    baseVersion,
    units,
    product: { appid: String(runtime.appid), name: String(runtime.name), scheme: String(runtime.scheme) },
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
