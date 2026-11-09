import { randomUUID } from "node:crypto";
import * as regular from "node:fs";
import { createRequire } from "node:module";
import { dirname, join, resolve, sep } from "node:path";
import { canonical, valid } from "@odsuite/protocol";
import type { Owner, State } from "./types.js";

export const raw: typeof regular = process.versions.electron ? createRequire(import.meta.url)("original-fs") : regular;
export const fs = raw.promises;
export async function save(path: string, state: State) {
  const temporary = `${path}.${randomUUID()}.tmp`;
  try {
    await fs.writeFile(temporary, canonical(state), { flag: "wx", mode: 0o600, flush: true });
    await fs.rename(temporary, path);
    if (process.platform !== "win32") {
      const directory = await fs.open(dirname(path), "r");
      try {
        await directory.sync();
      } finally {
        await directory.close();
      }
    }
  } finally {
    await fs.rm(temporary, { force: true });
  }
}
function fields(value: object, required: string[], optional: string[] = []) {
  if (
    !value ||
    typeof value !== "object" ||
    Array.isArray(value) ||
    required.some((k) => !Object.hasOwn(value, k)) ||
    Object.keys(value).some((k) => !required.includes(k) && !optional.includes(k))
  )
    throw Error("invalid blob state fields");
}
const uuid = (value: unknown) =>
  typeof value === "string" && /^[a-f0-9]{8}-(?:[a-f0-9]{4}-){3}[a-f0-9]{12}$/.test(value);
function owner(value: Owner) {
  fields(value, ["manager", "service", "generation", "incarnation"], ["epoch"]);
  if (
    !uuid(value.manager) ||
    !uuid(value.incarnation) ||
    !valid(value.generation) ||
    !/^[a-z][a-z0-9]*$/.test(value.service) ||
    (value.epoch !== undefined && !/^[A-Za-z0-9:_-]{1,128}$/.test(value.epoch))
  )
    throw Error("invalid blob owner witness");
}
export async function read(path: string, fresh = false): Promise<State> {
  try {
    const info = await fs.lstat(path);
    if (!info.isFile() || info.isSymbolicLink()) throw Error("blob state must be a regular file");
    const state = JSON.parse(await fs.readFile(path, "utf8")) as State;
    fields(state, ["schema", "entries", "references"], ["owner"]);
    if (state.owner) owner(state.owner);
    if (
      state.schema !== 1 ||
      !state.entries ||
      typeof state.entries !== "object" ||
      Array.isArray(state.entries) ||
      !Array.isArray(state.references)
    )
      throw Error("invalid blob library state");
    for (const [key, e] of Object.entries(state.entries)) {
      if (
        !valid(key) ||
        !e.resource ||
        !Array.isArray(e.uses) ||
        !["empty", "loading", "ready", "failed", "deleting"].includes(e.phase)
      )
        throw Error("invalid blob library entry");
      fields(e, ["resource", "phase", "uses"], ["idleSince", "error", "operation"]);
      if (
        (e.idleSince !== undefined && (!Number.isSafeInteger(e.idleSince) || e.idleSince < 0)) ||
        (e.error !== undefined && typeof e.error !== "string")
      )
        throw Error("invalid blob entry state");
      for (const use of e.uses) {
        fields(use, ["id", "key", "owner", "path"]);
        owner(use.owner);
        if (!uuid(use.id) || use.key !== key || typeof use.path !== "string") throw Error("invalid blob use witness");
      }
      if (new Set(e.uses.map((u) => u.id)).size !== e.uses.length) throw Error("duplicate blob use");
      if (e.operation) {
        fields(e.operation, ["id", "lease", "path", "owner"]);
        owner(e.operation.owner);
        if (
          !uuid(e.operation.id) ||
          !uuid(e.operation.lease) ||
          typeof e.operation.path !== "string" ||
          resolve(e.operation.path) !== e.operation.path ||
          !["loading", "failed"].includes(e.phase)
        )
          throw Error("invalid blob operation");
      }
      if (e.phase === "loading" && !e.operation) throw Error("blob loading witness missing");
    }
    for (const reference of state.references) {
      fields(reference, ["kind", "name", "keys"]);
      if (
        !["current", "prepared", "recovery"].includes(reference.kind) ||
        !/^[-A-Za-z0-9:_.]{1,128}$/.test(reference.name) ||
        !Array.isArray(reference.keys) ||
        reference.keys.some((k) => !valid(k) || !state.entries[k]) ||
        new Set(reference.keys).size !== reference.keys.length
      )
        throw Error("invalid blob reference");
    }
    if (new Set(state.references.map((r) => canonical([r.kind, r.name]))).size !== state.references.length)
      throw Error("duplicate blob reference");
    return state;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
    if (!fresh) throw Error("blob library metadata missing; reconciliation required");
    return { schema: 1, entries: {}, references: [] };
  }
}
export async function anchor(path: string) {
  if ((await fs.realpath(path)) !== resolve(path) || (await fs.lstat(path)).isSymbolicLink())
    throw Error("blob root must be canonical");
}
export function within(root: string, path: string) {
  if (path === root || !path.startsWith(root + sep)) throw Error("blob path escaped granted root");
  return path;
}
export function view(root: string, key: string) {
  if (!valid(key)) throw Error("invalid blob resource key");
  return within(root, join(root, "views", key.slice(7)));
}
export async function exists(path: string) {
  try {
    await fs.lstat(path);
    return true;
  } catch (e) {
    if ((e as NodeJS.ErrnoException).code === "ENOENT") return false;
    throw e;
  }
}
