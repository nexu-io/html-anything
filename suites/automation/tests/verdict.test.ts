import { expect, it } from "vitest";
import { assertAutomation, type CaseReceipt, nativeEvent, snapshot, verdict } from "@";

function fixture(): CaseReceipt {
  const baseline = { activeDisplay: "main", spaces: [{ display: "main", id: "35", type: 4 }] };
  return {
    schema: 1,
    name: "kill",
    result: "unqualified",
    reasons: [],
    requireFullscreen: true,
    baseline,
    started: 0,
    ended: 2400,
    settleMs: 1500,
    marks: [
      { event: "spawn", pid: 123, time: 100 },
      { event: "ready-observed", pid: 123, time: 500 },
      { event: "stop-request", pid: 123, time: 550, signal: "SIGKILL" },
      { event: "exit", pid: 123, time: 700, signal: "SIGKILL", code: null },
    ],
    events: Array.from({ length: 25 }, (_, i) => ({
      event: "sample",
      time: i * 100,
      sequence: i + 1,
      snapshot: baseline,
    })),
  };
}
it("qualifies continuous native fullscreen observations through the post-exit tail", () => {
  expect(verdict(fixture()).result).toBe("passed");
});
it("rejects the 212 ms delayed desktop transition even after the tracked host exited", () => {
  const r = fixture();
  r.events.push({
    event: "space",
    time: 912,
    sequence: 26,
    snapshot: { activeDisplay: "main", spaces: [{ display: "main", id: "1", type: 0 }] },
  });
  expect(verdict(r)).toMatchObject({ result: "failed", reasons: ["native Space identity changed"] });
});
it("rejects native host activation even without a Space change and ignores unrelated application activation", () => {
  const r = fixture();
  r.events.push({ event: "activate", time: 540, pid: 456, sequence: 26 });
  expect(verdict(r).result).toBe("passed");
  r.events.push({ event: "activate", time: 550, pid: 123, sequence: 27 });
  expect(verdict(r)).toMatchObject({ result: "failed", reasons: ["tracked host activated natively"] });
});
it("never turns non-fullscreen, missing heartbeats or an observer failure into acceptance", () => {
  const r = fixture();
  r.baseline = { activeDisplay: "main", spaces: [{ display: "main", id: "1", type: 0 }] };
  expect(verdict(r).result).toBe("unqualified");
  const gap = fixture();
  gap.events = gap.events.filter((e) => e.time < 500 || e.time > 1500);
  expect(verdict(gap).result).toBe("unqualified");
  expect(verdict(fixture(), "native observer exited unexpectedly").result).toBe("unqualified");
});
it("requires host exit and a complete observation tail instead of stopping at readiness", () => {
  const r = fixture();
  r.marks = r.marks.filter((m) => m.event !== "exit");
  expect(verdict(r).result).toBe("failed");
  const short = fixture();
  short.ended = 1800;
  short.events = short.events.filter((e) => e.time <= 1800);
  expect(verdict(short)).toMatchObject({ result: "failed", reasons: ["post-exit observation tail is incomplete"] });
});
it("rejects malformed native data and requires actual automation evidence", () => {
  expect(() => snapshot({ activeDisplay: "main", spaces: [] })).toThrow();
  expect(() => nativeEvent({ event: "activate", pid: -1, sequence: 1, time: 100 })).toThrow();
  const receipt = {
    enabled: true,
    policy: "accessory",
    shown: false,
    focused: false,
    visible: false,
    focusable: false,
  };
  expect(() => assertAutomation(receipt, "darwin")).not.toThrow();
  expect(() => assertAutomation({ ...receipt, focused: true }, "darwin")).toThrow();
  expect(() => assertAutomation(undefined, "darwin")).toThrow();
});
