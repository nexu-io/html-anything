import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { configuration, type PrismConfig } from "@open-motion/templates/prism";
import { parse } from "yaml";
/** Only explicit repository configuration selects a remote publication; channel is never inferred. */
export async function prismConfiguration(repo: string): Promise<PrismConfig | undefined> {
  const source = parse(await readFile(join(repo, "odsuite.yaml"), "utf8")) as { templates?: unknown };
  if (source.templates === undefined) return undefined;
  if (
    !source.templates ||
    typeof source.templates !== "object" ||
    Array.isArray(source.templates) ||
    Object.keys(source.templates).some((key) => key !== "prism") ||
    !("prism" in source.templates)
  )
    throw new Error("Invalid template provider configuration");
  return configuration(source.templates.prism);
}
