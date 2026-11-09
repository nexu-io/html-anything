import type { CaseReceipt, NativeEvent, Snapshot } from "./types.js";

export function snapshot(value: unknown): Snapshot {
  const v = value as Snapshot;
  if (!v || typeof v.activeDisplay !== "string" || !v.activeDisplay || !Array.isArray(v.spaces) || !v.spaces.length)
    throw new Error("native Space snapshot unavailable");
  for (const space of v.spaces) {
    if (
      typeof space.display !== "string" ||
      !space.display ||
      typeof space.id !== "string" ||
      !/^\d+$/.test(space.id) ||
      !Number.isSafeInteger(space.type)
    )
      throw new Error("invalid native Space entry");
  }
  if (new Set(v.spaces.map((s) => s.display)).size !== v.spaces.length) throw new Error("duplicate display snapshot");
  return v;
}
export function fullscreen(value: Snapshot): boolean {
  const active =
    value.spaces.find((s) => s.display === value.activeDisplay) ??
    (value.spaces.length === 1 ? value.spaces[0] : undefined);
  return active?.type === 4;
}
export function nativeEvent(value: unknown): NativeEvent {
  const v = value as NativeEvent;
  if (
    !v ||
    !["sample", "space", "activate", "policy", "stopped"].includes(v.event) ||
    !Number.isFinite(v.time) ||
    !Number.isSafeInteger(v.sequence) ||
    v.sequence < 1
  )
    throw new Error("invalid native observer event");
  if (["sample", "space"].includes(v.event)) snapshot(v.snapshot);
  if (["activate", "policy"].includes(v.event) && (!Number.isSafeInteger(v.pid) || Number(v.pid) < 1))
    throw new Error("invalid native observer PID");
  return v;
}
function identity(value: Snapshot): string {
  return JSON.stringify([...value.spaces].sort((a, b) => a.display.localeCompare(b.display)));
}
export function verdict(receipt: CaseReceipt, observerFault?: string): CaseReceipt {
  const reasons: string[] = [];
  if (observerFault) reasons.push(observerFault);
  if (receipt.requireFullscreen && !fullscreen(receipt.baseline))
    reasons.push("initial Space is not native fullscreen");
  const samples = receipt.events.filter((e) => e.event === "sample");
  if (
    samples.length < 2 ||
    (samples[0]?.time ?? Infinity) - receipt.started > 500 ||
    receipt.ended - (samples.at(-1)?.time ?? -Infinity) > 500 ||
    samples.some((s, i) => i > 0 && s.time - (samples[i - 1]?.time ?? s.time) > 500)
  )
    reasons.push("native observation coverage is incomplete");
  if (reasons.length) return { ...receipt, result: "unqualified", reasons };
  const pids = new Set(receipt.marks.filter((m) => m.event === "spawn").map((m) => m.pid));
  if (!pids.size || [...pids].some((pid) => !receipt.marks.some((m) => m.event === "exit" && m.pid === pid)))
    reasons.push("tracked host exit evidence is missing");
  if (
    receipt.events.some((e) => (e.event === "activate" || (e.event === "policy" && e.active)) && pids.has(e.pid ?? -1))
  )
    reasons.push("tracked host activated natively");
  if (receipt.events.some((e) => e.snapshot && identity(e.snapshot) !== identity(receipt.baseline)))
    reasons.push("native Space identity changed");
  const lastExit = Math.max(...receipt.marks.filter((m) => m.event === "exit").map((m) => m.time));
  if (!Number.isFinite(lastExit) || receipt.ended - lastExit < receipt.settleMs)
    reasons.push("post-exit observation tail is incomplete");
  return { ...receipt, result: reasons.length ? "failed" : "passed", reasons };
}
export function assertAutomation(value: unknown, platform: string = process.platform): void {
  const v = value as Record<string, unknown>;
  if (
    v?.enabled !== true ||
    v.policy !== (platform === "darwin" ? "accessory" : "default") ||
    ["shown", "focused", "visible", "focusable"].some((k) => v[k] !== false)
  )
    throw new Error("background window evidence missing or invalid");
}
