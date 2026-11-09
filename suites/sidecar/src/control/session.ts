import { type FactoryScope, factoryKey, factoryScope } from "@odsuite/protocol";
import type { Witness } from "../process/observe.js";

export type SessionScope = FactoryScope;
export interface SessionRecord extends SessionScope {
  controller: Witness;
  incarnation: string;
  manager: string;
  kind: "automatic" | "local" | "remote";
  phase: "active" | "closing" | "completed" | "failed" | "interrupted";
  reason?: "callback" | "operation" | "disconnect";
}
/** Private control metadata; never part of caller-owned business protocols. */
export interface SessionHint extends SessionScope {
  incarnation: string;
  token: string;
  parent?: string;
}
export const sessionKey = factoryKey;
export const sessionScope = factoryScope;
export function sessionHint(input: unknown): SessionHint {
  const scope = sessionScope(input);
  const value = input as SessionHint;
  if (
    typeof value.incarnation !== "string" ||
    !value.incarnation ||
    typeof value.token !== "string" ||
    !value.token ||
    (value.parent !== undefined && (typeof value.parent !== "string" || !value.parent))
  )
    throw new Error("invalid lifecycle context");
  return {
    ...scope,
    incarnation: value.incarnation,
    token: value.token,
    ...(value.parent ? { parent: value.parent } : {}),
  };
}
