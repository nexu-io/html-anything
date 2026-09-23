import { describe, expect, it } from "vitest";
import { buildArgv, parseLine, makeParser, UnsupportedAgentProtocolError } from "../argv";
import { AGENTS } from "../detect";

describe("parseLine opencode", () => {
  it("extracts text from nested part payload", () => {
    const line = JSON.stringify({
      type: "text",
      sessionID: "ses_test",
      part: {
        type: "text",
        text: "<html><body>ok</body></html>",
      },
    });

    expect(parseLine("opencode", line)).toContainEqual({
      kind: "delta",
      text: "<html><body>ok</body></html>",
    });
  });

  it("emits one delta when top-level and nested text are both present", () => {
    const line = JSON.stringify({
      type: "text",
      text: "<html><body>ok</body></html>",
      part: {
        type: "text",
        text: "<html><body>ok</body></html>",
      },
    });

    expect(parseLine("opencode", line)).toEqual([
      {
        kind: "delta",
        text: "<html><body>ok</body></html>",
      },
    ]);
  });

  it("falls back to top-level text when nested text is empty", () => {
    const line = JSON.stringify({
      type: "text",
      content: "<html>ok</html>",
      part: {
        type: "text",
        text: "",
      },
    });

    expect(parseLine("opencode", line)).toEqual([
      {
        kind: "delta",
        text: "<html>ok</html>",
      },
    ]);
  });

  it("extracts session only from step start payload", () => {
    expect(
      parseLine(
        "opencode",
        JSON.stringify({
          type: "step_start",
          sessionID: "ses_test",
          part: {
            type: "step-start",
          },
        }),
      ),
    ).toContainEqual({
      kind: "meta",
      key: "session",
      value: "ses_test",
    });

    expect(
      parseLine(
        "opencode",
        JSON.stringify({
          type: "text",
          sessionID: "ses_test",
          part: {
            type: "text",
            text: "ok",
          },
        }),
      ),
    ).not.toContainEqual({
      kind: "meta",
      key: "session",
      value: "ses_test",
    });
  });

  it("extracts usage from step finish payload and accumulates successive steps", () => {
    const line1 = JSON.stringify({
      type: "step_finish",
      part: {
        type: "step-finish",
        tokens: {
          input: 10,
          output: 2,
          cache: {
            read: 3,
            write: 4,
          },
        },
        cost: 0.01,
      },
    });

    const line2 = JSON.stringify({
      type: "step_finish",
      part: {
        type: "step-finish",
        tokens: {
          input: 5,
          output: 1,
          cache: {
            read: 1,
            write: 1,
          },
        },
        cost: 0.005,
      },
    });

    const parser = makeParser("opencode");
    expect(parser(line1)).toEqual([
      {
        kind: "meta",
        key: "usage",
        value: {
          input_tokens: 10,
          output_tokens: 2,
          cache_read_input_tokens: 3,
          cache_creation_input_tokens: 4,
        },
      },
      {
        kind: "meta",
        key: "cost_usd",
        value: 0.01,
      },
    ]);

    expect(parser(line2)).toEqual([
      {
        kind: "meta",
        key: "usage",
        value: {
          input_tokens: 15,
          output_tokens: 3,
          cache_read_input_tokens: 4,
          cache_creation_input_tokens: 5,
        },
      },
      {
        kind: "meta",
        key: "cost_usd",
        value: 0.015,
      },
    ]);
  });
});

describe("parseLine bob", () => {
  it("extracts text from stream-json output", () => {
    const line = JSON.stringify({
      text: "<html><body>Hello</body></html>",
    });

    expect(parseLine("bob", line)).toEqual([
      {
        kind: "delta",
        text: "<html><body>Hello</body></html>",
      },
    ]);
  });

  it("extracts content field when present", () => {
    const line = JSON.stringify({
      content: "<html><body>World</body></html>",
    });

    expect(parseLine("bob", line)).toEqual([
      {
        kind: "delta",
        text: "<html><body>World</body></html>",
      },
    ]);
  });

  it("extracts message field when present", () => {
    const line = JSON.stringify({
      message: "<html><body>Test</body></html>",
    });

    expect(parseLine("bob", line)).toEqual([
      {
        kind: "delta",
        text: "<html><body>Test</body></html>",
      },
    ]);
  });

  it("handles final answer after thinking when --hide-intermediary-output is used", () => {
    // When --hide-intermediary-output is enabled, Bob only emits the final answer.
    // This test verifies that the parser correctly handles the final completion.
    const finalAnswer = JSON.stringify({
      text: "<html><body>Final result</body></html>",
    });

    expect(parseLine("bob", finalAnswer)).toEqual([
      {
        kind: "delta",
        text: "<html><body>Final result</body></html>",
      },
    ]);
  });
});

describe("parseLine grok", () => {
  it("extracts streaming-json text chunks from data", () => {
    expect(
      parseLine("grok", JSON.stringify({ type: "text", data: "<html>ok</html>" })),
    ).toEqual([{ kind: "delta", text: "<html>ok</html>" }]);
  });

  it("extracts session and usage from the end event", () => {
    const usage = { input_tokens: 10, output_tokens: 4 };
    expect(
      parseLine(
        "grok",
        JSON.stringify({
          type: "end",
          stopReason: "end_turn",
          sessionId: "abc123",
          usage,
          total_cost_usd: 0.01,
        }),
      ),
    ).toEqual([
      { kind: "meta", key: "session", value: "abc123" },
      { kind: "meta", key: "usage", value: usage },
      { kind: "meta", key: "result", value: "end_turn" },
      { kind: "meta", key: "cost_usd", value: 0.01 },
    ]);
  });

  it("parses the final json object when there is no type field", () => {
    expect(
      parseLine(
        "grok",
        JSON.stringify({
          text: "<html><body>done</body></html>",
          sessionId: "s1",
          usage: { input_tokens: 2, output_tokens: 1 },
        }),
      ),
    ).toEqual([
      { kind: "delta", text: "<html><body>done</body></html>" },
      { kind: "meta", key: "session", value: "s1" },
      { kind: "meta", key: "usage", value: { input_tokens: 2, output_tokens: 1 } },
    ]);
  });

  it("records thought events as thinking meta", () => {
    expect(
      parseLine("grok", JSON.stringify({ type: "thought", data: "planning" })),
    ).toEqual([{ kind: "meta", key: "thinking", value: "planning" }]);
  });
});

describe("buildArgv model ids", () => {
  it("accepts every model the picker offers", () => {
    for (const agent of AGENTS) {
      for (const { id } of agent.fallbackModels) {
        try {
          buildArgv(agent.id, { model: id });
        } catch (err) {
          if (!(err instanceof UnsupportedAgentProtocolError)) throw err;
        }
      }
    }
  });
});
