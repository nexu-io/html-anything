// next/src/lib/agents/__tests__/antigravity.test.ts
import { describe, it, expect } from "vitest";
import { makeParser, buildArgv } from "../argv";
import { AGENTS, DEFAULT_MODEL } from "../detect";

// ── Parser tests ─────────────────────────────────────────────────────────────

describe("antigravity parser — plain text output", () => {
  it("emits a delta for each plain-text line", () => {
    const parse = makeParser("antigravity");
    expect(parse("hello world")).toEqual([{ kind: "delta", text: "hello world\n" }]);
  });

  it("does not throw or return noise for plain text", () => {
    const parse = makeParser("antigravity");
    const result = parse("some plain text output from agy");
    expect(result).toEqual([{ kind: "delta", text: "some plain text output from agy\n" }]);
  });

  it("handles HTML output lines as deltas", () => {
    const parse = makeParser("antigravity");
    const result = parse("<html><body>test</body></html>");
    expect(result).toEqual([{ kind: "delta", text: "<html><body>test</body></html>\n" }]);
  });

  it("returns empty array for blank lines", () => {
    const parse = makeParser("antigravity");
    expect(parse("   ")).toEqual([]);
    expect(parse("")).toEqual([]);
  });
});

// ── buildArgv tests ───────────────────────────────────────────────────────────

describe("antigravity buildArgv", () => {
  it("returns --dangerously-skip-permissions --print (no stream-json flags)", () => {
    const argv = buildArgv("antigravity");
    expect(argv).toEqual(["--dangerously-skip-permissions", "--print"]);
  });

  it("does not include --output-format or --verbose", () => {
    const argv = buildArgv("antigravity");
    expect(argv).not.toContain("--output-format");
    expect(argv).not.toContain("--verbose");
    expect(argv).not.toContain("--include-partial-messages");
  });

  it("does not append --model when no model provided", () => {
    const argv = buildArgv("antigravity");
    expect(argv).not.toContain("--model");
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

  it("has protocol === 'argv'", () => {
    expect(def?.protocol).toBe("argv");
  });

  it("has DEFAULT_MODEL as first fallbackModel", () => {
    expect(def?.fallbackModels[0]).toEqual(DEFAULT_MODEL);
  });
});
