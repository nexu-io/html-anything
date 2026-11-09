import { AsyncLocalStorage } from "node:async_hooks";
import { createConnection } from "node:net";
import { type SessionHint, type SessionScope, sessionHint, sessionKey, sessionScope } from "../control/session.js";
import { selfWitness, type Witness } from "../process/observe.js";
import type { Request } from "./wire.js";

export interface Ambient {
  actor?: Witness;
  endpoint: string;
  scope?: SessionScope;
  hint?: SessionHint;
  valid?: () => boolean;
  business?: boolean;
  internal?: boolean;
}
export const ambient = new AsyncLocalStorage<Ambient>();
export function lifecycleScope(request: Request): SessionScope | undefined {
  if (["grant", "revoke", "forward", "binding", "resources"].includes(request.type)) return request as SessionScope;
  if (request.type === "start") return request.spec;
  if (request.type === "attach" || request.type === "release") return request.lease;
  if (request.type === "invoke" && request.operation === "stop") return request.descriptor;
  if (request.type === "transit") return request;
  if (request.type === "issue") return request.permit;
  if (request.type === "retire") return request.capability;
  return undefined;
}
export function decorate(endpoint: string, request: Request): Request {
  const current = ambient.getStore();
  if (!current) return request;
  const scope = lifecycleScope(request);
  if (current.business && scope && !current.hint)
    throw new Error("business lifecycle writes require a controller session");
  if (!current.hint) return request;
  const target = scope ?? (request.type === "invoke" ? request.descriptor : undefined);
  if (!target) return request;
  if (current.endpoint !== endpoint || sessionKey(target) !== sessionKey(current.hint)) {
    if (scope) throw new Error("cross-scope lifecycle nesting is not supported");
    return request;
  }
  if (!current.valid?.()) throw new Error("lifecycle context is expired");
  return { ...request, session: current.hint };
}

export async function remoteSession<T>(
  endpoint: string,
  authority: string,
  scope: SessionScope,
  timeout: number,
  operation: () => Promise<T>,
): Promise<T> {
  scope = sessionScope(scope);
  const current = ambient.getStore();
  if (current?.hint) {
    if (current.endpoint !== endpoint || sessionKey(current.hint) !== sessionKey(scope))
      throw new Error("cross-scope lifecycle nesting is not supported");
    if (!current.valid?.()) throw new Error("lifecycle context is expired");
    return operation();
  }
  if (current?.business) throw new Error("business lifecycle writes require a controller session");
  const actor = await selfWitness();
  const socket = createConnection(endpoint);
  let active = true,
    contextLive = true,
    input = "",
    handshake = false,
    finished = false;
  let accept: (value: SessionHint) => void = () => {};
  let rejectBegin: (fault: Error) => void = () => {};
  let resolveFinish: () => void = () => {};
  let rejectFinish: (fault: Error) => void = () => {};
  let lost: (fault: Error) => void = () => {};
  const begun = new Promise<SessionHint>((done, reject) => {
    accept = done;
    rejectBegin = reject;
  });
  const end = new Promise<void>((done, reject) => {
    resolveFinish = done;
    rejectFinish = reject;
  });
  const disconnected = new Promise<never>((_done, reject) => {
    lost = reject;
  });
  void end.catch(() => {});
  void disconnected.catch(() => {});
  const fail = (fault: Error) => {
    active = false;
    rejectBegin(fault);
    rejectFinish(fault);
    lost(fault);
    socket.destroy();
  };
  const timer = setTimeout(() => fail(new Error("lifecycle acquisition timeout")), timeout);
  socket.once("connect", () => socket.write(`${JSON.stringify({ type: "session", authority, ...scope, actor })}\n`));
  socket.once("error", fail);
  socket.once("close", () => {
    clearTimeout(timer);
    if (!finished) fail(new Error("lifecycle owner connection ended"));
  });
  socket.on("data", (chunk: Buffer) => {
    input += chunk.toString("utf8");
    if (Buffer.byteLength(input) > 65536) {
      fail(new Error("lifecycle response exceeds limit"));
      return;
    }
    let index = input.indexOf("\n");
    while (index >= 0) {
      const frame = input.slice(0, index);
      input = input.slice(index + 1);
      try {
        const reply = JSON.parse(frame) as { ok: boolean; error?: string; value: unknown };
        if (!reply.ok) throw new Error(reply.error ?? "lifecycle request failed");
        if (!handshake) {
          handshake = true;
          clearTimeout(timer);
          accept(sessionHint(reply.value));
        } else {
          finished = true;
          resolveFinish();
        }
      } catch (fault) {
        fail(fault instanceof Error ? fault : new Error(String(fault)));
        return;
      }
      index = input.indexOf("\n");
    }
  });
  try {
    const hint = await begun;
    let result: T | undefined;
    let failure: unknown;
    let succeeded = false;
    try {
      result = await Promise.race([
        ambient.run({ endpoint, scope, hint, valid: () => active && contextLive }, operation),
        disconnected,
      ]);
      succeeded = true;
    } catch (fault) {
      failure = fault;
    }
    contextLive = false;
    if (active) {
      socket.write(`${JSON.stringify({ type: "finish", succeeded })}\n`);
      await end;
    } else if (succeeded) throw new Error("lifecycle completion is unconfirmed");
    if (!succeeded) throw failure;
    return result as T;
  } finally {
    active = false;
    clearTimeout(timer);
    socket.destroy();
  }
}
