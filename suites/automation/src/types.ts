export interface Space {
  display: string;
  id: string;
  type: number;
}
export interface Snapshot {
  activeDisplay: string;
  spaces: Space[];
}
export interface NativeEvent {
  event: "sample" | "space" | "activate" | "policy" | "stopped";
  time: number;
  sequence: number;
  snapshot?: Snapshot;
  pid?: number;
  policy?: number;
  active?: boolean;
}
export interface Mark {
  event: "spawn" | "ready-observed" | "stop-request" | "exit";
  time: number;
  pid: number;
  signal?: string;
  code?: number | null;
}
export interface Trace {
  track(pid: number | undefined): void;
  mark(event: Exclude<Mark["event"], "spawn">, pid: number, value?: Pick<Mark, "signal" | "code">): void;
}
export interface CaseReceipt {
  schema: 1;
  name: string;
  result: "passed" | "failed" | "unqualified";
  reasons: string[];
  requireFullscreen: boolean;
  baseline: Snapshot;
  marks: Mark[];
  events: NativeEvent[];
  settleMs: number;
  started: number;
  ended: number;
}
export interface Options {
  directory: string;
  bundle: string;
  requireFullscreen?: boolean;
  settleMs?: number;
}
