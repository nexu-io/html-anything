import { defaults } from "./defaults.js";
import { glob } from "./match.js";

export function object(value: unknown, keys: string[], label: string): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error(`${label} must be an object`);
  const record = value as Record<string, unknown>;
  for (const key of Object.keys(record)) {
    if (!keys.includes(key)) throw new Error(`unknown ${label} field: ${key}`);
  }
  return record;
}

export function strings(value: unknown, label: string, patterns = true): string[] {
  if (!Array.isArray(value) || value.some((item) => typeof item !== "string" || !item))
    throw new Error(`${label} must be a string array`);
  const values = value as string[];
  if (patterns) values.forEach(glob);
  return values;
}

export function rules(value: unknown): Record<string, { enabled?: boolean; max?: number }> {
  const data = object(value, Object.keys(defaults.rules), "guard.rules");
  const result: Record<string, { enabled?: boolean; max?: number }> = {};
  for (const [name, input] of Object.entries(data)) {
    const base = defaults.rules[name];
    if (!base) throw new Error(`unknown rule: ${name}`);
    const allowed = base.max === undefined ? ["enabled"] : ["enabled", "max"];
    const fields = object(input, allowed, name);
    if ("enabled" in fields && typeof fields.enabled !== "boolean") throw new Error(`${name}.enabled must be boolean`);
    if ("max" in fields && (!Number.isSafeInteger(fields.max) || Number(fields.max) < 0))
      throw new Error(`${name}.max must be a nonnegative integer`);
    if (name === "file.style" && fields.enabled === false)
      throw new Error("file.style cannot be disabled; use exact style grants");
    result[name] = fields;
  }
  return result;
}
