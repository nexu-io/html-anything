import { describe, expect, it } from "vitest";
import type { RunRecord } from "./db";
import { isCurrentRun } from "./is-current";

function record(version: number, html: string): RunRecord {
  return {
    id: `task-a__${String(version).padStart(6, "0")}`,
    taskId: "task-a",
    version,
    html,
    content: `content ${version}`,
    ts: 1_700_000_000_000 + version,
    stats: { outputBytes: html.length, deltaCount: 0 },
    templateId: "article-magazine",
  };
}

describe("isCurrentRun", () => {
  it("flags the newest run when its html matches the editor", () => {
    const v2 = record(2, "<main>v2</main>");
    const v1 = record(1, "<main>v1</main>");
    const runs = [v2, v1];

    expect(isCurrentRun(v2, runs, v2.html)).toBe(true);
    expect(isCurrentRun(v1, runs, v2.html)).toBe(false);
  });

  it("does not flag an older byte-identical run as current after restore", () => {
    // After restoring v1, commitBase appends a fresh v3 whose html equals v1's html.
    // The old isCurrent (pure content equality) wrongly flagged BOTH v3 and v1
    // as current and disabled Restore on the genuinely-historical v1.
    const sharedHtml = "<main>v1</main>";
    const v3 = record(3, sharedHtml);
    const v2 = record(2, "<main>v2</main>");
    const v1 = record(1, sharedHtml);
    const runs = [v3, v2, v1];

    expect(isCurrentRun(v3, runs, sharedHtml)).toBe(true);
    expect(isCurrentRun(v1, runs, sharedHtml)).toBe(false);
    expect(isCurrentRun(v2, runs, sharedHtml)).toBe(false);
  });

  it("drops the current flag when the editor html drifts from the newest run", () => {
    const v2 = record(2, "<main>v2</main>");
    const v1 = record(1, "<main>v1</main>");
    const runs = [v2, v1];

    // User edited the editor after the last commit — no row is live anymore.
    expect(isCurrentRun(v2, runs, "<main>v2 edited</main>")).toBe(false);
    expect(isCurrentRun(v1, runs, "<main>v2 edited</main>")).toBe(false);
  });

  it("returns false against an empty runs list", () => {
    const orphan = record(1, "<main>v1</main>");
    expect(isCurrentRun(orphan, [], orphan.html)).toBe(false);
  });
});
