import { describe, expect, it } from "vitest";
import { parseLine, makeParser } from "../argv";

function deltas(result: ReturnType<typeof parseLine>) {
  return result.filter((r) => r.kind === "delta").map((r) => r.text);
}

describe("parseLine (opencode)", () => {
  it("extracts text from singular part.text envelope", () => {
    const line = JSON.stringify({
      type: "text",
      part: { type: "text", text: "hello world" },
    });
    expect(deltas(parseLine("opencode", line))).toEqual(["hello world"]);
  });

  it("extracts text from parts[].text array envelope", () => {
    const line = JSON.stringify({
      type: "text",
      parts: [
        { type: "text", text: "hello " },
        { type: "text", text: "world" },
      ],
    });
    expect(deltas(parseLine("opencode", line))).toEqual(["hello ", "world"]);
  });

  it("extracts text from top-level text field", () => {
    const line = JSON.stringify({ text: "top-level content" });
    expect(deltas(parseLine("opencode", line))).toContain("top-level content");
  });

  it("extracts text from top-level content field", () => {
    const line = JSON.stringify({ content: "content field" });
    expect(deltas(parseLine("opencode", line))).toContain("content field");
  });

  it("extracts text from top-level message field", () => {
    const line = JSON.stringify({ message: "message field" });
    expect(deltas(parseLine("opencode", line))).toContain("message field");
  });

  it("produces no non-empty delta when all text fields are empty", () => {
    const line = JSON.stringify({
      type: "text",
      text: "",
      content: "",
      message: "",
      part: { type: "text", text: "" },
    });
    expect(deltas(parseLine("opencode", line)).filter(Boolean)).toEqual([]);
  });

  it("handles empty top-level fields with content in part.text (regression #67)", () => {
    const line = JSON.stringify({
      type: "text",
      text: "",
      content: "",
      message: "",
      part: {
        type: "text",
        text: "# 春之声\n\n三月的风是软的。",
      },
    });
    expect(deltas(parseLine("opencode", line))).toContain(
      "# 春之声\n\n三月的风是软的。",
    );
  });
});

describe("parseLine (qwen)", () => {
  it("extracts text from singular part.text envelope", () => {
    const line = JSON.stringify({
      type: "text",
      part: { type: "text", text: "qwen output" },
    });
    expect(deltas(parseLine("qwen", line))).toEqual(["qwen output"]);
  });

  it("extracts text from parts[].text array envelope", () => {
    const line = JSON.stringify({
      parts: [{ text: "a" }, { text: "b" }],
    });
    expect(deltas(parseLine("qwen", line))).toEqual(["a", "b"]);
  });
});

describe("makeParser (opencode) multi-line streaming", () => {
  it("accumulates deltas across multiple lines", () => {
    const parse = makeParser("opencode");
    parse(
      JSON.stringify({ type: "step_start", part: { type: "step-start" } }),
    );
    const r2 = parse(
      JSON.stringify({ type: "text", part: { type: "text", text: "hello" } }),
    );
    const r3 = parse(
      JSON.stringify({
        type: "text",
        part: { type: "text", text: " world" },
      }),
    );
    expect(deltas(r2)).toEqual(["hello"]);
    expect(deltas(r3)).toEqual([" world"]);
  });
});
