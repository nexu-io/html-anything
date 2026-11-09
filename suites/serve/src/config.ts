import { readFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import { parse } from "yaml";
import type { Source } from "./index.js";

export async function configuration(root: string) {
  const document = parse(await readFile(join(root, "odsuite.yaml"), "utf8"));
  if (document?.schemaVersion !== 1) throw new Error("odsuite.schemaVersion must be 1");
  const value = document.serve;
  if (
    !value ||
    typeof value !== "object" ||
    Array.isArray(value) ||
    Object.keys(value).some((k) => !["data", "sources"].includes(k))
  )
    throw new Error("invalid serve configuration");
  if (
    typeof value.data !== "string" ||
    !value.data ||
    !value.sources ||
    typeof value.sources !== "object" ||
    Array.isArray(value.sources)
  )
    throw new Error("serve.data and sources are required");
  const sources: Record<string, Source> = {};
  for (const [name, input] of Object.entries(value.sources)) {
    const source = input as Source;
    if (
      !source ||
      typeof source !== "object" ||
      Object.keys(source).some((k) => k !== "directory") ||
      typeof source.directory !== "string" ||
      !source.directory
    )
      throw new Error("invalid static source declaration");
    sources[name] = { directory: resolve(root, source.directory) };
  }
  return { data: resolve(root, value.data), sources };
}
