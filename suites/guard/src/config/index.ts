import { lstat, readFile } from "node:fs/promises";
import { join } from "node:path";
import { parseDocument } from "yaml";
import type { Exception, Override, Policy } from "../types.js";
import { defaults } from "./defaults.js";
import { object, rules, strings } from "./schema.js";
import { grants } from "./styles.js";

export function configuration(input: unknown): Policy {
  const policy = structuredClone(defaults);
  if (input === null || input === undefined) return policy;
  const top = object(input, ["schemaVersion", "guard", "runtime", "pipeline", "serve", "dev"], "odsuite");
  if (top.schemaVersion !== 1) throw new Error("odsuite.schemaVersion must be 1");
  if (!("guard" in top)) return policy;
  const guard = object(
    top.guard,
    ["directories", "exclude", "modules", "components", "names", "rules", "overrides", "exceptions", "styles"],
    "guard",
  );
  for (const name of ["exclude", "modules", "components", "names"] as const) {
    if (name in guard) policy[name] = strings(guard[name], `guard.${name}`, name !== "names");
  }
  if ("directories" in guard) {
    const data = object(guard.directories, ["repository", "module"], "guard.directories");
    for (const scope of ["repository", "module"] as const) {
      if (!(scope in data)) continue;
      const patterns = strings(data[scope], `guard.directories.${scope}`);
      if (patterns.some((pattern) => pattern.split("/").includes("**")))
        throw new Error("directory patterns require finite depth; ** is not allowed");
      policy.directories[scope] = patterns;
    }
  }
  if ("modules" in guard) policy.workspace = false;
  if (policy.components.some((path) => path.includes("*"))) throw new Error("guard.components requires exact paths");
  if (guard.rules !== undefined) {
    for (const [name, value] of Object.entries(rules(guard.rules))) {
      const base = policy.rules[name];
      if (!base) throw new Error(`unknown rule: ${name}`);
      policy.rules[name] = { ...base, ...value };
    }
  }
  if (guard.overrides !== undefined) policy.overrides = list(guard.overrides, "overrides").map(override);
  if (guard.exceptions !== undefined) policy.exceptions = list(guard.exceptions, "exceptions").map(exception);
  if (guard.styles !== undefined) policy.styles = grants(guard.styles);
  if (policy.exceptions.some((item) => item.rules.includes("file.style")))
    throw new Error("file.style cannot be excepted; use exact style grants");
  return policy;
}

function list(value: unknown, label: string): unknown[] {
  if (!Array.isArray(value)) throw new Error(`guard.${label} must be an array`);
  return value;
}

function override(value: unknown): Override {
  const data = object(value, ["paths", "rules"], "override");
  const paths = strings(data.paths, "override.paths");
  if (!paths.length) throw new Error("override.paths must not be empty");
  return { paths, rules: rules(data.rules) };
}

function exception(value: unknown): Exception {
  const data = object(value, ["paths", "rules", "reason"], "exception");
  const paths = strings(data.paths, "exception.paths");
  const names = strings(data.rules, "exception.rules", false);
  if (!paths.length || !names.length || names.some((name) => !Object.hasOwn(defaults.rules, name)))
    throw new Error("exception requires paths and known rules");
  if (typeof data.reason !== "string" || !data.reason.trim()) throw new Error("exception.reason must not be empty");
  return { paths, rules: names, reason: data.reason };
}

export async function load(root: string): Promise<Policy> {
  let content: string;
  try {
    if (!(await lstat(join(root, "odsuite.yaml"))).isFile()) throw new Error("odsuite.yaml must be a regular file");
    content = await readFile(join(root, "odsuite.yaml"), "utf8");
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return configuration(undefined);
    throw error;
  }
  const document = parseDocument(content, { uniqueKeys: true, schema: "core" });
  if (document.errors.length || document.warnings.length)
    throw new Error(
      `odsuite.yaml: ${[...document.errors, ...document.warnings].map((error) => error.message).join("; ")}`,
    );
  return configuration(document.toJS({ maxAliasCount: 0 }));
}
