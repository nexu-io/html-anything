import { basename } from "node:path";
import { rule } from "../config/match.js";
import { json } from "../scan/modules.js";
import type { Context, Finding } from "../types.js";

const tools: Record<string, RegExp> = {
  lint: /^biome check \.$/,
  test: /^vitest run(?: -c vitest\.config\.ts)?(?: --passWithNoTests)?$/,
  build:
    /^node esbuild\.config\.mjs(?: && tsc -p tsconfig\.json --emitDeclarationOnly)?(?: && tsc -p tsconfig\.tests\.json)?$/,
};

export async function scripts(context: Context): Promise<Finding[]> {
  const findings: Finding[] = [];
  for (const entry of context.entries) {
    if (
      entry.kind === "link" &&
      basename(entry.path) === "package.json" &&
      rule(context.policy, entry.path, "package.scripts").enabled
    ) {
      findings.push({
        path: entry.path,
        rule: "package.scripts",
        message: "package manifests must be regular files so scripts can be inspected",
      });
    }
    if (
      basename(entry.path) === "scripts" &&
      entry.kind !== "file" &&
      rule(context.policy, entry.path, "directory.scripts").enabled
    ) {
      findings.push({
        path: entry.path,
        rule: "directory.scripts",
        message: "scripts directories are not allowed; use module tools, package APIs or module tests",
      });
    }
    if (
      entry.kind !== "file" ||
      basename(entry.path) !== "package.json" ||
      !rule(context.policy, entry.path, "package.scripts").enabled
    )
      continue;
    const manifest = await json(context.root, entry.path);
    const values = manifest.scripts;
    if (values === undefined) continue;
    if (!values || typeof values !== "object" || Array.isArray(values)) {
      findings.push({ path: entry.path, rule: "package.scripts", message: "scripts must be an object" });
      continue;
    }
    const aggregate =
      entry.path === "package.json" && context.modules.some((module) => module.path === "." && module.aggregate);
    for (const [name, command] of Object.entries(values)) {
      const allowed = Object.hasOwn(tools, name);
      const valid =
        allowed &&
        typeof command === "string" &&
        (aggregate ? command === `pnpm -r --if-present run ${name}` : tools[name]?.test(command));
      if (!valid)
        findings.push({
          path: entry.path,
          rule: "package.scripts",
          message: aggregate
            ? `scripts.${name}: only lint/test/build with pnpm -r --if-present run <same-name> are allowed`
            : `scripts.${name}: only direct Biome/Vitest/esbuild/TypeScript lint/test/build commands are allowed`,
        });
    }
  }
  return findings;
}
