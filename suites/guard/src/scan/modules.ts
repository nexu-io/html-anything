import { readFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { matches } from "../config/match.js";
import type { Entry, Module, Policy } from "../types.js";

export async function json(root: string, path: string): Promise<Record<string, unknown>> {
  const value: unknown = JSON.parse(await readFile(join(root, path), "utf8"));
  if (!value || typeof value !== "object" || Array.isArray(value))
    throw new Error(`${path} must contain a JSON object`);
  return value as Record<string, unknown>;
}

export async function modules(root: string, entries: Entry[], policy: Policy): Promise<Module[]> {
  const workspace = entries.find((entry) => entry.path === "pnpm-workspace.yaml");
  let patterns = policy.modules;
  if (workspace?.kind === "file" && policy.workspace) {
    const { parseDocument } = await import("yaml");
    const document = parseDocument(await readFile(join(root, workspace.path), "utf8"));
    if (document.errors.length) throw new Error("invalid pnpm-workspace.yaml");
    const value = document.toJS() as { packages?: unknown };
    if (!Array.isArray(value?.packages) || value.packages.some((item) => typeof item !== "string"))
      throw new Error("workspace packages must be string patterns");
    patterns = value.packages as string[];
    const { glob } = await import("../config/match.js");
    patterns.forEach(glob);
  }
  const found: Module[] = [];
  for (const entry of entries) {
    if (entry.kind !== "file" || !entry.path.endsWith("package.json")) continue;
    const path = dirname(entry.path).replaceAll("\\", "/");
    if (entry.path !== "package.json" && !matches(path, patterns)) continue;
    const manifest = await json(root, entry.path);
    if (typeof manifest.name !== "string" || !manifest.name) throw new Error(`${entry.path} requires a package name`);
    found.push({ path, name: manifest.name, manifest, aggregate: path === "." && workspace?.kind === "file" });
  }
  const names = found.map((module) => module.name);
  if (new Set(names).size !== names.length) throw new Error("duplicate workspace package name");
  for (const entry of entries) {
    if (
      entry.kind === "directory" &&
      matches(entry.path, patterns) &&
      !found.some((module) => module.path === entry.path)
    ) {
      found.push({ path: entry.path, name: `<missing:${entry.path}>`, manifest: {} });
    }
  }
  return found;
}

export function owner(path: string, modules: Module[]): Module | undefined {
  return (
    modules
      .filter((module) => module.path !== "." && (path === module.path || path.startsWith(`${module.path}/`)))
      .sort((left, right) => right.path.length - left.path.length)[0] ??
    modules.find((module) => module.path === "." && !module.aggregate && !modules.some((other) => other.path !== "."))
  );
}
