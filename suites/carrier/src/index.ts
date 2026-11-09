export interface Environment {
  schema: 1;
  carrier: string;
  system: Readonly<{ platform: string; release: string; arch: string }>;
  runtime: Readonly<{ name: string; version: string }>;
}
const object = (value: unknown, keys: string[]): Record<string, unknown> => {
  if (!value || typeof value !== "object" || Array.isArray(value))
    throw new TypeError("environment requires an object");
  const record = value as Record<string, unknown>;
  if (Object.keys(record).sort().join() !== [...keys].sort().join())
    throw new TypeError("unexpected environment fields");
  return record;
};
const text = (value: unknown): string => {
  if (typeof value !== "string" || !value.trim() || value.length > 256) throw new TypeError("invalid environment fact");
  return value;
};
/** Environment facts only: no release identity, resource paths, ports or process authority. */
export function environment(input: unknown): Readonly<Environment> {
  const value = object(input, ["schema", "carrier", "system", "runtime"]);
  if (value.schema !== 1 || typeof value.carrier !== "string" || !/^[a-z][a-z0-9-]*$/.test(value.carrier))
    throw new TypeError("invalid carrier environment");
  const system = object(value.system, ["platform", "release", "arch"]);
  const runtime = object(value.runtime, ["name", "version"]);
  return Object.freeze({
    schema: 1,
    carrier: value.carrier,
    system: Object.freeze({ platform: text(system.platform), release: text(system.release), arch: text(system.arch) }),
    runtime: Object.freeze({ name: text(runtime.name), version: text(runtime.version) }),
  });
}
export function encode(input: Environment): string {
  return JSON.stringify(environment(input));
}
export function decode(input: string): Readonly<Environment> {
  return environment(JSON.parse(input));
}
/** Explicit per-composition registry; nothing is registered in process-global state. */
export class Environments {
  private readonly entries = new Map<string, Readonly<Environment>>();
  register(input: Environment): Readonly<Environment> {
    const value = environment(input);
    if (this.entries.has(value.carrier)) throw new Error("carrier environment already registered");
    this.entries.set(value.carrier, value);
    return value;
  }
  get(carrier: string): Readonly<Environment> {
    const value = this.entries.get(carrier);
    if (!value) throw new Error("carrier environment not registered");
    return value;
  }
}
