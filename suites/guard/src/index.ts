import { readFile, realpath, stat } from "node:fs/promises";
import { extname, join } from "node:path";
import { sources } from "./config/defaults.js";
import { load } from "./config/index.js";
import { rule } from "./config/match.js";
import { file } from "./rules/files.js";
import { moduleRules } from "./rules/module.js";
import { scripts } from "./rules/scripts.js";
import { style } from "./rules/style.js";
import { directories, tree } from "./rules/tree.js";
import { files } from "./scan/files.js";
import { modules } from "./scan/modules.js";
import { stylesheets } from "./stylesheet.js";
import type { Context, Entry, Finding, Policy, Report } from "./types.js";

export { defaults } from "./config/defaults.js";
export { configuration, load } from "./config/index.js";
export { format } from "./report.js";
export type { Context, Entry, Exception, Finding, Module, Policy, Report } from "./types.js";

export interface GuardOptions {
  root: string;
  policy?: Policy;
}

export async function guard(options: GuardOptions): Promise<Report> {
  const root = await realpath(options.root);
  if (!(await stat(root)).isDirectory()) throw new Error("guard root must be a directory");
  const policy = options.policy ?? (await load(root));
  const pruned: Entry[] = [];
  const entries = await files(root, policy, pruned);
  const context: Context = { root, entries, policy, modules: await modules(root, entries, policy) };
  const findings: Finding[] = [
    ...directories(context, pruned),
    ...tree(context),
    ...(await moduleRules(context)),
    ...(await scripts(context)),
    ...(await stylesheets(context)),
  ];
  for (const entry of entries) {
    if (entry.kind === "directory") continue;
    const source = sources.has(extname(entry.path).slice(1).toLowerCase());
    if (entry.kind === "link" || !source) {
      findings.push(...file(context, entry.path));
      if (entry.kind === "link" && source) {
        if (["css", "less", "scss", "sass", "styl"].includes(extname(entry.path).slice(1).toLowerCase()))
          findings.push(...style(context, entry.path, ""));
        if (rule(policy, entry.path, "file.coverage").enabled)
          findings.push({ path: entry.path, rule: "file.coverage", message: "source symlink target is not inspected" });
      }
      continue;
    }
    const bytes = await readFile(join(root, entry.path));
    const content = new TextDecoder("utf-8", { fatal: true }).decode(bytes);
    findings.push(...file(context, entry.path, content), ...style(context, entry.path, content));
  }
  findings.sort(
    (left, right) =>
      left.path.localeCompare(right.path, "en") ||
      left.rule.localeCompare(right.rule, "en") ||
      (left.line ?? 0) - (right.line ?? 0) ||
      (left.column ?? 0) - (right.column ?? 0) ||
      left.message.localeCompare(right.message, "en"),
  );
  return {
    schemaVersion: 1,
    root,
    mode: "full",
    ok: findings.length === 0,
    paths: entries.length,
    files: entries.filter((entry) => entry.kind === "file").length,
    links: entries.filter((entry) => entry.kind === "link").map((entry) => entry.path),
    excluded: [...policy.exclude],
    pruned: pruned.map((entry) => entry.path).sort(),
    directories: structuredClone(policy.directories),
    exceptions: structuredClone(policy.exceptions),
    findings,
  };
}
