import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { compile, components, fontCatalog, theme } from "@odsuite/style";
import type { Context, Finding } from "./types.js";

export async function stylesheets(context: Context): Promise<Finding[]> {
  const findings: Finding[] = [];
  const catalogs = new Map<string, Set<string>>();
  const ordered = [...context.policy.styles].sort(
    (a, b) => (a.kind === "theme" ? -1 : 1) - (b.kind === "theme" ? -1 : 1),
  );
  for (const grant of ordered) {
    try {
      if (!context.modules.some((module) => module.path === grant.module))
        throw new Error("style grant targets an unknown workspace module");
      if (grant.fonts) await fontCatalog(join(context.root, grant.module, grant.fonts));
      const sources = new Map<string, string>();
      for (const entry of context.entries) {
        if (entry.kind === "file" && entry.path.startsWith(`${grant.module}/src/`) && entry.path.endsWith(".less"))
          sources.set(entry.path, await readFile(join(context.root, entry.path), "utf8"));
      }
      const entry = `${grant.module}/${grant.entry}`;
      const result = await compile(entry, sources);
      const reached = new Set([entry, ...result.imports]);
      for (const path of sources.keys()) if (!reached.has(path)) throw new Error(`orphan Less file: ${path}`);
      if (grant.kind === "theme") catalogs.set(grant.module, theme(result.css, grant.prefix));
      else {
        const tokens = catalogs.get(grant.theme ?? "");
        if (!tokens) throw new Error("authorized theme failed validation");
        components(result.css, grant.prefix, tokens);
      }
    } catch (error) {
      findings.push({ path: `${grant.module}/${grant.entry}`, rule: "file.style", message: (error as Error).message });
    }
  }
  return findings;
}
