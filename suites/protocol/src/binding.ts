import type { Channel, Namespace } from "./identity.js";
import type { Digest } from "./json.js";

export const gates = ["capsule", "renderer", "daemon", "web", "product"] as const;

export type Gate = (typeof gates)[number];
export type Mode = "update" | "recovery";

export interface Handoff {
  mode: Mode;
  target: Digest;
}

export interface Attempt {
  error?: string;
  nonce: string;
  ready: Gate[];
  status: "running" | "failed";
  target: Digest;
}

export interface Binding {
  attempt?: Attempt;
  channel: Channel;
  current?: Digest;
  handoff?: Handoff;
  namespace: Namespace;
}

export type Event =
  | { mode: Mode; target: Digest; type: "arm" }
  | { nonce: string; target: Digest; type: "begin" }
  | { gate: Gate; nonce: string; target: Digest; type: "ready" }
  | { error: string; nonce: string; target: Digest; type: "fail" }
  | { nonce: string; target: Digest; type: "commit" }
  | { target: Digest; type: "recover" };

export type Fault = "attempt" | "handoff" | "nonce" | "readiness" | "target";

export type Transition = { changed: boolean; ok: true; state: Binding } | { fault: Fault; ok: false; state: Binding };

export type Startup =
  | { mode: "initial" }
  | { mode: "normal"; target: Digest }
  | { mode: "attempt"; target: Digest }
  | { mode: "blocked"; target: Digest };

function same(left: Binding, right: Binding): boolean {
  return JSON.stringify(left) === JSON.stringify(right);
}

function pass(state: Binding, next: Binding): Transition {
  return { changed: !same(state, next), ok: true, state: next };
}

function refuse(state: Binding, fault: Fault): Transition {
  return { fault, ok: false, state };
}

function arm(state: Binding, event: Extract<Event, { type: "arm" }>): Transition {
  if (state.attempt) return refuse(state, "attempt");
  if (state.current === event.target && !state.handoff) return pass(state, state);
  if (state.handoff && state.handoff.target !== event.target) return refuse(state, "handoff");

  return pass(state, {
    ...state,
    handoff: { mode: event.mode, target: event.target },
  });
}

function begin(state: Binding, event: Extract<Event, { type: "begin" }>): Transition {
  if (!state.handoff || state.handoff.target !== event.target) return refuse(state, "handoff");
  if (state.attempt?.nonce === event.nonce) return pass(state, state);
  if (state.attempt) return refuse(state, "attempt");

  return pass(state, {
    ...state,
    attempt: {
      nonce: event.nonce,
      ready: [],
      status: "running",
      target: event.target,
    },
  });
}

function match(state: Binding, event: { nonce: string; target: Digest }): Fault | undefined {
  if (state.attempt?.status !== "running") return "attempt";
  if (state.attempt.target !== event.target) return "target";
  if (state.attempt.nonce !== event.nonce) return "nonce";
  return undefined;
}

function ready(state: Binding, event: Extract<Event, { type: "ready" }>): Transition {
  const fault = match(state, event);
  if (fault || !state.attempt) return refuse(state, fault ?? "attempt");
  const values = new Set(state.attempt.ready);
  values.add(event.gate);

  return pass(state, {
    ...state,
    attempt: {
      ...state.attempt,
      ready: gates.filter((gate) => values.has(gate)),
    },
  });
}

function fail(state: Binding, event: Extract<Event, { type: "fail" }>): Transition {
  const fault = match(state, event);
  if (fault || !state.attempt) return refuse(state, fault ?? "attempt");

  return pass(state, {
    ...state,
    attempt: { ...state.attempt, error: event.error, status: "failed" },
  });
}

function commit(state: Binding, event: Extract<Event, { type: "commit" }>): Transition {
  if (state.current === event.target && !state.attempt && !state.handoff) {
    return pass(state, state);
  }

  if (!state.handoff || state.handoff.target !== event.target) return refuse(state, "handoff");
  const fault = match(state, event);
  if (fault || !state.attempt) return refuse(state, fault ?? "attempt");
  if (state.attempt.ready.length !== gates.length) return refuse(state, "readiness");

  return pass(state, {
    channel: state.channel,
    current: event.target,
    namespace: state.namespace,
  });
}

function recover(state: Binding, event: Extract<Event, { type: "recover" }>): Transition {
  if (state.attempt?.status === "running") return refuse(state, "attempt");

  return pass(state, {
    channel: state.channel,
    current: state.current,
    handoff: { mode: "recovery", target: event.target },
    namespace: state.namespace,
  });
}

export function reduce(state: Binding, event: Event): Transition {
  if (event.type === "arm") return arm(state, event);
  if (event.type === "begin") return begin(state, event);
  if (event.type === "ready") return ready(state, event);
  if (event.type === "fail") return fail(state, event);
  if (event.type === "commit") return commit(state, event);
  return recover(state, event);
}

export function startup(state: Binding): Startup {
  if (state.attempt) return { mode: "blocked", target: state.attempt.target };
  if (state.handoff) return { mode: "attempt", target: state.handoff.target };
  if (state.current) return { mode: "normal", target: state.current };
  return { mode: "initial" };
}
