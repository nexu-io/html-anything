import { extname } from "node:path";
import { rule } from "../config/match.js";
import type { Context, Finding } from "../types.js";
import { html } from "./html.js";
import { syntax } from "./syntax.js";

export function style(context: Context, path: string, content: string): Finding[] {
  const extension = extname(path).slice(1).toLowerCase();
  const findings: Finding[] = [];
  if (rule(context.policy, path, "file.style").enabled) {
    if (["css", "less", "scss", "sass", "styl"].includes(extension)) {
      if (extension !== "less" || !context.policy.styles.some((grant) => path.startsWith(`${grant.module}/src/`)))
        findings.push({
          path,
          rule: "file.style",
          message: "styles are denied by default; src Less requires an exact module style grant",
        });
      return findings;
    }
    if (extension === "html") {
      try {
        return html(path, content, (source) => syntax(`${path}.js`, source));
      } catch (error) {
        return [
          { path, rule: "file.coverage", message: `embedded script cannot be parsed: ${(error as Error).message}` },
        ];
      }
    }
  }
  if (["vue", "svelte"].includes(extension) && rule(context.policy, path, "file.coverage").enabled)
    return [
      { path, rule: "file.coverage", message: "unsupported source language; style coverage cannot be established" },
    ];
  if (!["ts", "tsx", "mts", "cts", "js", "jsx", "mjs", "cjs"].includes(extension)) return findings;
  if (!rule(context.policy, path, "file.style").enabled && !rule(context.policy, path, "file.coverage").enabled)
    return findings;
  try {
    const parsed = syntax(path, content);
    if (rule(context.policy, path, "file.style").enabled) findings.push(...parsed);
  } catch (error) {
    if (rule(context.policy, path, "file.coverage").enabled)
      findings.push({ path, rule: "file.coverage", message: `source cannot be parsed: ${(error as Error).message}` });
  }
  return findings;
}
