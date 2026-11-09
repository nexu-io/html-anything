import { describe, expect, it } from "vitest";

import { type Binding, channel, type Digest, digest, type Event, gates, namespace, reduce, startup } from "@";

const first = digest("first");
const second = digest("second");
const base = {
  channel: channel("stable"),
  namespace: namespace("main"),
};

function apply(state: Binding, event: Event): Binding {
  const result = reduce(state, event);

  expect(result.ok).toBe(true);
  return result.state;
}

function prepare(current: Digest | undefined, target: Digest, nonce = "attempt"): Binding {
  let state: Binding = current ? { ...base, current } : { ...base };
  state = apply(state, { mode: "update", target, type: "arm" });
  state = apply(state, { nonce, target, type: "begin" });

  for (const gate of gates) {
    state = apply(state, { gate, nonce, target, type: "ready" });
  }

  return state;
}

describe("binding", () => {
  it("requires an explicit first binding", () => {
    expect(startup(base)).toEqual({ mode: "initial" });
    expect(reduce(base, { nonce: "one", target: first, type: "begin" })).toMatchObject({
      fault: "handoff",
      ok: false,
    });
  });

  it("commits only after every readiness gate", () => {
    let state = apply(base, { mode: "update", target: first, type: "arm" });
    state = apply(state, { nonce: "one", target: first, type: "begin" });

    expect(reduce(state, { nonce: "one", target: first, type: "commit" })).toMatchObject({
      fault: "readiness",
      ok: false,
    });

    state = prepare(undefined, first, "one");
    const result = reduce(state, { nonce: "one", target: first, type: "commit" });

    expect(result).toEqual({
      changed: true,
      ok: true,
      state: { ...base, current: first },
    });
  });

  it("rejects readiness from another attempt", () => {
    let state = apply(base, { mode: "update", target: first, type: "arm" });
    state = apply(state, { nonce: "current", target: first, type: "begin" });

    expect(
      reduce(state, {
        gate: "web",
        nonce: "stale",
        target: first,
        type: "ready",
      }),
    ).toMatchObject({ fault: "nonce", ok: false });
  });

  it("preserves current and blocks startup after failure", () => {
    let state = apply(
      { ...base, current: first },
      {
        mode: "update",
        target: second,
        type: "arm",
      },
    );
    state = apply(state, { nonce: "two", target: second, type: "begin" });
    state = apply(state, {
      error: "daemon timeout",
      nonce: "two",
      target: second,
      type: "fail",
    });

    expect(state.current).toBe(first);
    expect(startup(state)).toEqual({ mode: "blocked", target: second });
    expect(reduce(state, { nonce: "two", target: second, type: "commit" })).toMatchObject({
      fault: "attempt",
      ok: false,
    });
  });

  it("recovers only to an explicit target", () => {
    let state = apply(
      { ...base, current: first },
      {
        mode: "update",
        target: second,
        type: "arm",
      },
    );
    state = apply(state, { nonce: "two", target: second, type: "begin" });
    state = apply(state, { error: "crash", nonce: "two", target: second, type: "fail" });
    state = apply(state, { target: first, type: "recover" });

    expect(startup(state)).toEqual({ mode: "attempt", target: first });
    expect(state).toEqual({
      ...base,
      current: first,
      handoff: { mode: "recovery", target: first },
    });
  });

  it("is idempotent for repeated readiness and commit", () => {
    let state = prepare(undefined, first, "one");
    const repeated = reduce(state, {
      gate: "web",
      nonce: "one",
      target: first,
      type: "ready",
    });

    expect(repeated).toMatchObject({ changed: false, ok: true });
    state = apply(state, { nonce: "one", target: first, type: "commit" });
    expect(reduce(state, { nonce: "one", target: first, type: "commit" })).toMatchObject({
      changed: false,
      ok: true,
    });
  });
});
