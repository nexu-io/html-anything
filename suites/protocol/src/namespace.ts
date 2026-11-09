import { isAbsolute, resolve } from "node:path";
import type { FactoryScope } from "./identity.js";

export const resources = ["port", "socket", "data", "cache", "logs", "cas", "staging", "lock", "installation"] as const;

export type Resource = (typeof resources)[number];
export type Scope = "factory" | "attempt";

export interface Request {
  kind: Resource;
  name: string;
  owner?: string;
  scheme?: "http" | "tcp";
  scope: Scope;
  target?: string;
}

export interface Grant extends Request {
  lease: string;
  value: string;
}

export interface Registry extends FactoryScope {
  schema: 2;
  grants: Grant[];
  revision: number;
}

export type Allocation =
  | { changed: boolean; grant: Grant; ok: true; state: Registry }
  | { fault: "request" | "resource"; ok: false; state: Registry };

export type Revocation =
  | { changed: boolean; ok: true; state: Registry }
  | { fault: "persistent" | "survivors" | "unknown"; ok: false; state: Registry };

function valid(request: Request): boolean {
  if (!resources.includes(request.kind)) return false;
  if (request.scope !== "factory" && request.scope !== "attempt") return false;
  if (!/^[a-z][a-z0-9]*$/.test(request.name)) return false;
  if (request.kind === "installation") {
    if (
      request.scope !== "factory" ||
      typeof request.target !== "string" ||
      !isAbsolute(request.target) ||
      resolve(request.target) !== request.target ||
      request.target === resolve(request.target, "..")
    )
      return false;
  } else if (request.target !== undefined) return false;
  if (request.kind === "port" && request.scheme !== undefined) {
    if (request.scheme !== "http" && request.scheme !== "tcp") return false;
  } else if (request.scheme !== undefined) return false;
  if (request.scope === "attempt") return Boolean(request.owner);
  return request.owner === undefined;
}

function key(request: Request): string {
  return [request.kind, request.name, request.owner ?? "", request.scheme ?? "", request.target ?? ""].join(":");
}

export function allocate(state: Registry, grant: Grant): Allocation {
  if (!valid(grant) || !grant.lease || !grant.value) {
    return { fault: "request", ok: false, state };
  }

  const existing = state.grants.find((item) => key(item) === key(grant));
  if (existing) {
    const changed = existing.lease !== grant.lease || existing.value !== grant.value;
    if (changed) return { fault: "resource", ok: false, state };
    return { changed: false, grant: existing, ok: true, state };
  }

  const collision = state.grants.some((item) => item.kind === grant.kind && item.value === grant.value);
  if (collision) return { fault: "resource", ok: false, state };
  const grants = [...state.grants, grant].sort((left, right) => key(left).localeCompare(key(right)));

  return {
    changed: true,
    grant,
    ok: true,
    state: { ...state, grants, revision: state.revision + 1 },
  };
}

export function revoke(state: Registry, lease: string, survivors: number[]): Revocation {
  const grant = state.grants.find((item) => item.lease === lease);
  if (!grant) return { fault: "unknown", ok: false, state };
  if (grant.scope === "factory") return { fault: "persistent", ok: false, state };
  if (survivors.length > 0) return { fault: "survivors", ok: false, state };

  return {
    changed: true,
    ok: true,
    state: {
      ...state,
      grants: state.grants.filter((item) => item.lease !== lease),
      revision: state.revision + 1,
    },
  };
}
