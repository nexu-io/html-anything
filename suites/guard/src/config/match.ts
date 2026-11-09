import picomatch from "picomatch";
import type { Policy, Rule } from "../types.js";

export function matches(path: string, patterns: string[]): boolean {
  return patterns.some((pattern) => picomatch(pattern, { dot: true })(path));
}

export function rule(policy: Policy, path: string, name: string): Rule {
  const base = policy.rules[name];
  if (!base) throw new Error(`unknown rule: ${name}`);
  let value = { ...base };
  for (const override of policy.overrides) {
    if (matches(path, override.paths)) value = { ...value, ...override.rules[name] };
  }
  if (policy.exceptions.some((exception) => exception.rules.includes(name) && matches(path, exception.paths))) {
    value.enabled = false;
  }
  return value;
}

export function glob(value: string): void {
  if (
    !value ||
    value.startsWith("/") ||
    value.includes("\\") ||
    value.startsWith("!") ||
    value.split("/").some((part) => !part || part === "." || part === ".." || (part.includes("**") && part !== "**"))
  ) {
    throw new Error(`invalid repo-relative glob: ${value}`);
  }
  if (/[[\]{}()]/.test(value)) throw new Error(`unsupported glob syntax: ${value}`);
}
