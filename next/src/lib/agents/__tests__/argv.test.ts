import { describe, expect, it } from "vitest";
import { buildArgv, parseLine, makeParser } from "../argv";

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

describe("parseLine antigravity", () => {
  it("extracts session and cwd from init event", () => {
    const line = JSON.stringify({
      event: "init",
      conversation_id: "conv-123",
      init: {
        cwd: "/Users/test/project",
        tools: ["write_to_file"],
      },
    });

    expect(parseLine("antigravity", line)).toEqual([
      { kind: "meta", key: "session", value: "conv-123" },
      { kind: "meta", key: "cwd", value: "/Users/test/project" },
    ]);
  });

  it("extracts streamed text delta from step_update event", () => {
    const line = JSON.stringify({
      event: "step_update",
      step_update: {
        conversation_id: "conv-123",
        step_index: 1,
        state: "ACTIVE",
        step_type: "agent_response",
        text_delta: "<div>Hello world</div>",
      },
    });

    expect(parseLine("antigravity", line)).toEqual([
      { kind: "delta", text: "<div>Hello world</div>" },
    ]);
  });

  it("extracts usage and text delta from step_update done event", () => {
    const line = JSON.stringify({
      event: "step_update",
      step_update: {
        conversation_id: "conv-123",
        step_index: 1,
        state: "DONE",
        step_type: "agent_response",
        text_delta: "\n</html>",
        duration_seconds: 2.5,
        usage: {
          input_tokens: 1000,
          output_tokens: 200,
          thinking_tokens: 50,
          cache_read_tokens: 100,
          total_tokens: 1200,
        },
      },
    });

    expect(parseLine("antigravity", line)).toEqual([
      { kind: "delta", text: "\n</html>" },
      {
        kind: "meta",
        key: "usage",
        value: {
          input_tokens: 1000,
          output_tokens: 200,
          cache_read_input_tokens: 100,
          cache_creation_input_tokens: 0,
        },
      },
    ]);
  });

  it("rescues HTML from write_to_file tool step_update", () => {
    const line = JSON.stringify({
      event: "step_update",
      step_update: {
        conversation_id: "conv-123",
        step_index: 2,
        state: "ACTIVE",
        step_type: "tool",
        tool_name: "write_to_file",
        tool_info: {
          name: "write_to_file",
          parameters: {
            TargetFile: "index.html",
            CodeContent: "<!DOCTYPE html><html><body>resuced</body></html>",
          },
        },
      },
    });

    expect(parseLine("antigravity", line)).toEqual([
      {
        kind: "html",
        text: "<!DOCTYPE html><html><body>resuced</body></html>",
      },
    ]);
  });

  it("handles result event with response fallback when no prior delta was seen", () => {
    const line = JSON.stringify({
      event: "result",
      result: {
        conversation_id: "conv-123",
        status: "SUCCESS",
        response: "<!DOCTYPE html><html><body>Complete</body></html>",
        duration_seconds: 3.2,
        usage: {
          input_tokens: 500,
          output_tokens: 100,
          cache_read_tokens: 0,
        },
      },
    });

    const parser = makeParser("antigravity");
    expect(parser(line)).toEqual([
      { kind: "delta", text: "<!DOCTYPE html><html><body>Complete</body></html>" },
      {
        kind: "meta",
        key: "usage",
        value: {
          input_tokens: 500,
          output_tokens: 100,
          cache_read_input_tokens: 0,
          cache_creation_input_tokens: 0,
        },
      },
      { kind: "meta", key: "duration_ms", value: 3200 },
      { kind: "meta", key: "result", value: "SUCCESS" },
    ]);
  });

  it("does not duplicate response from result event if text deltas were already streamed", () => {
    const parser = makeParser("antigravity");
    const deltaLine = JSON.stringify({
      event: "step_update",
      step_update: {
        step_type: "agent_response",
        text_delta: "Hello",
      },
    });
    const resultLine = JSON.stringify({
      event: "result",
      result: {
        status: "SUCCESS",
        response: "Hello",
        duration_seconds: 1.0,
      },
    });

    expect(parser(deltaLine)).toEqual([{ kind: "delta", text: "Hello" }]);
    expect(parser(resultLine)).toEqual([
      { kind: "meta", key: "duration_ms", value: 1000 },
      { kind: "meta", key: "result", value: "SUCCESS" },
    ]);
  });
});

describe("buildArgv antigravity", () => {
  it("keeps -p last and always pins effort", () => {
    expect(buildArgv("antigravity")).toEqual([
      "--output-format",
      "stream-json",
      "--dangerously-skip-permissions",
      "--disable-slash-commands",
      "--effort",
      "medium",
      "-p",
    ]);
  });

  it("adds --model before -p when a model is picked", () => {
    const argv = buildArgv("antigravity", { model: "some-model" });
    expect(argv.slice(-3)).toEqual(["--model", "some-model", "-p"]);
  });
});

describe("parseLine antigravity edge cases", () => {
  it("emits thinking_delta as thinking meta", () => {
    const line = JSON.stringify({
      event: "step_update",
      step_update: { step_type: "agent_response", thinking_delta: "planning" },
    });
    expect(parseLine("antigravity", line)).toEqual([
      { kind: "meta", key: "thinking", value: "planning" },
    ]);
  });

  it("does not rescue write_to_file content for non-HTML targets", () => {
    const line = JSON.stringify({
      event: "step_update",
      step_update: {
        step_type: "tool",
        tool_info: {
          name: "write_to_file",
          parameters: { TargetFile: "notes.md", CodeContent: "# notes" },
        },
      },
    });
    expect(parseLine("antigravity", line)).toEqual([]);
  });

  it("ignores Claude-shaped lines it does not understand", () => {
    const line = JSON.stringify({ type: "assistant", text: "<p>not agy</p>", content: "x" });
    expect(parseLine("antigravity", line)).toEqual([]);
  });
});
