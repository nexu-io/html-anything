import { describe, expect, it } from "vitest";

import { type Evidence, encode, matrix, parse, type Report } from "@";

function scenario(index: number): Evidence {
  const item = matrix[index];
  if (!item) throw new Error("scenario missing");
  return {
    actual: "qualified",
    artifacts: [],
    built: [],
    diagnostics: [],
    downloaded: [],
    expected: item.expected,
    gate: item.gate,
    id: item.id,
    milliseconds: index,
    pids: [],
    restored: [],
    status: "passed",
    survivors: [],
    transitions: [],
  };
}

function report(): Report {
  return {
    architecture: "arm64",
    platform: "darwin",
    result: "passed",
    revision: "abc123",
    scenarios: matrix.map((_, index) => scenario(index)),
    schema: 1,
    tools: { electron: "1", node: "2", pnpm: "3" },
  };
}

describe("qualification report", () => {
  it("roundtrips canonical evidence", () => {
    const value = report();
    expect(parse(JSON.parse(encode(value)))).toEqual(value);
  });

  it("rejects matrix drift", () => {
    const value = report();
    value.scenarios.reverse();
    expect(() => parse(value)).toThrow("report scenarios are incomplete");
  });

  it("rejects unknown fields", () => {
    expect(() => parse({ ...report(), optional: true })).toThrow("report fields are invalid");
  });
});
