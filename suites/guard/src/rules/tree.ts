import { basename, dirname } from "node:path";
import { matches, rule } from "../config/match.js";
import { owner } from "../scan/modules.js";
import type { Context, Entry, Finding } from "../types.js";

export function tree(context: Context): Finding[] {
  const findings: Finding[] = [];
  const children = new Map<string, number>();
  for (const entry of context.entries) {
    const module = owner(entry.path, context.modules);
    if (!module) continue;
    const parent = dirname(entry.path).replaceAll("\\", "/");
    if (owner(parent, context.modules)) children.set(parent, (children.get(parent) ?? 0) + 1);
    if (entry.kind !== "directory") continue;
    const depth =
      entry.path === module.path
        ? 0
        : entry.path.split("/").length - (module.path === "." ? 0 : module.path.split("/").length);
    const limit = rule(context.policy, entry.path, "directory.depth");
    if (limit.enabled && limit.max !== undefined && depth > limit.max)
      findings.push({ path: entry.path, rule: "directory.depth", message: `depth ${depth} exceeds ${limit.max}` });
    if (rule(context.policy, entry.path, "directory.name").enabled && !/^[a-z][a-z0-9]*$/.test(basename(entry.path))) {
      findings.push({ path: entry.path, rule: "directory.name", message: "directory name must be one lowercase word" });
    }
  }
  for (const [path, count] of children) {
    const limit = rule(context.policy, path, "directory.children");
    if (limit.enabled && limit.max !== undefined && !context.policy.components.includes(path) && count > limit.max)
      findings.push({ path, rule: "directory.children", message: `${count} direct children exceeds ${limit.max}` });
  }
  return findings;
}

// Every node needs approval; approving a parent never approves its descendants.
export function directories(context: Context, pruned: Entry[] = []): Finding[] {
  const findings: Finding[] = [];
  const hidden = new Set(pruned.map((entry) => entry.path));
  for (const entry of [...context.entries, ...pruned]) {
    if (entry.kind === "file" || !rule(context.policy, entry.path, "directory.allowed").enabled) continue;
    const module = owner(entry.path, context.modules);
    const relative = module ? (module.path === "." ? entry.path : entry.path.slice(module.path.length + 1)) : undefined;
    const approved =
      matches(entry.path, context.policy.directories.repository) ||
      (relative !== undefined && matches(relative, context.policy.directories.module));
    const opaque =
      ["node_modules", ".artifacts", ".state"].includes(entry.path) ||
      (relative !== undefined && ["node_modules", "dist", "coverage"].includes(relative));
    const message =
      entry.kind === "link"
        ? "symbolic links cannot prove directory boundaries; use regular files or directories"
        : !approved
          ? "directory is not allowlisted; declare an authorized bounded pattern in guard.directories"
          : hidden.has(entry.path) && !opaque
            ? "exclude cannot hide this directory; only owned generated/dependency/runtime boundaries may be pruned"
            : undefined;
    if (message) findings.push({ path: entry.path, rule: "directory.allowed", message });
  }
  return findings;
}
