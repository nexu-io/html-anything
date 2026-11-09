import { describe, expect, it } from "vitest";

import { channel, digest, namespace, publish, startup } from "@";

describe("channel", () => {
  it("advances its only mutable pointer through compare and swap", () => {
    const state = { channel: channel("stable"), revision: 0 };
    const pointer = { generation: digest("one"), proof: digest("proof") };
    const result = publish(state, { expected: 0, pointer });

    expect(result).toEqual({
      changed: true,
      ok: true,
      state: { channel: state.channel, head: pointer, revision: 1 },
    });
  });

  it("makes identical publication idempotent", () => {
    const pointer = { generation: digest("one"), proof: digest("proof") };
    const state = { channel: channel("stable"), head: pointer, revision: 3 };

    expect(publish(state, { expected: 0, pointer })).toEqual({
      changed: false,
      ok: true,
      state,
    });
  });

  it("rejects a late publisher without changing head", () => {
    const state = {
      channel: channel("stable"),
      head: { generation: digest("new"), proof: digest("accepted") },
      revision: 4,
    };
    const pointer = { generation: digest("old"), proof: digest("late") };

    expect(publish(state, { expected: 3, pointer })).toMatchObject({
      actual: 4,
      fault: "conflict",
      ok: false,
      state,
    });
  });

  it("does not turn a published head into a local current", () => {
    const pointer = { generation: digest("new"), proof: digest("accepted") };
    const distribution = publish(
      { channel: channel("stable"), revision: 0 },
      {
        expected: 0,
        pointer,
      },
    );
    const binding = {
      channel: channel("stable"),
      namespace: namespace("main"),
    };

    expect(distribution.ok).toBe(true);
    expect(startup(binding)).toEqual({ mode: "initial" });
  });
});
