// next/src/lib/agents/__tests__/antigravity.test.ts
import { describe, it, expect } from "vitest";
import { makeParser } from "../argv";
import { AGENTS, DEFAULT_MODEL } from "../detect";

// ── Parser tests ─────────────────────────────────────────────────────────────

describe("antigravity parser — stream_event text_delta", () => {
  it("emits a delta for a text_delta stream event", () => {
    const parse = makeParser("antigravity");
    const line = JSON.stringify({
      type: "stream_event",
      event: {
        type: "content_block_delta",
        delta: { type: "text_delta", text: "hello" },
      },
    });
    expect(parse(line)).toEqual([{ kind: "delta", text: "hello" }]);
  });
});

describe("antigravity parser — assistant body fallback", () => {
  it("emits delta from assistant body when no stream_event preceded it", () => {
    const parse = makeParser("antigravity");
    const line = JSON.stringify({
      type: "assistant",
      message: {
        content: [{ type: "text", text: "hello" }],
      },
    });
    expect(parse(line)).toEqual([{ kind: "delta", text: "hello" }]);
  });

  it("suppresses assistant body when stream_event already emitted text", () => {
    const parse = makeParser("antigravity");
    parse(
      JSON.stringify({
        type: "stream_event",
        event: {
          type: "content_block_delta",
          delta: { type: "text_delta", text: "hello" },
        },
      }),
    );
    const result = parse(
      JSON.stringify({
        type: "assistant",
        message: {
          content: [{ type: "text", text: "hello" }],
        },
      }),
    );
    expect(result.filter((p) => p.kind === "delta")).toHaveLength(0);
  });
});

describe("antigravity parser — non-JSON input", () => {
  it("returns noise and does not throw for a plain-text line", () => {
    const parse = makeParser("antigravity");
    let result: ReturnType<typeof parse> | undefined;
    expect(() => { result = parse("some plain text"); }).not.toThrow();
    expect(result).toEqual([{ kind: "noise" }]);
  });
});

// ── AgentDef integrity ────────────────────────────────────────────────────────

describe("antigravity AgentDef", () => {
  const def = AGENTS.find((a) => a.id === "antigravity");

  it("exists in AGENTS", () => {
    expect(def).toBeDefined();
  });

  it("has bin === 'agy'", () => {
    expect(def?.bin).toBe("agy");
  });

  it("has DEFAULT_MODEL as first fallbackModel", () => {
    expect(def?.fallbackModels[0]).toEqual(DEFAULT_MODEL);
  });
});
