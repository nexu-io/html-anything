import { canonical, type Digest, valid } from "@odsuite/protocol";

import { type Gate, gates, type Id, ids, matrix, type Status } from "./matrix.js";

export interface Evidence {
  actual: string;
  artifacts: Digest[];
  built: string[];
  diagnostics: string[];
  downloaded: string[];
  expected: string;
  gate: Gate;
  id: Id;
  milliseconds: number;
  pids: number[];
  restored: string[];
  status: Status;
  survivors: number[];
  transitions: string[];
}

export interface Report {
  architecture: string;
  platform: string;
  result: "failed" | "partial" | "passed";
  revision: string;
  scenarios: Evidence[];
  schema: 1;
  tools: {
    electron: string;
    node: string;
    pnpm: string;
  };
}

function strings(value: unknown, name: string): string[] {
  if (!Array.isArray(value) || value.some((item) => typeof item !== "string")) {
    throw new TypeError(`${name} must be strings`);
  }
  return value;
}

function keys(value: Record<string, unknown>, expected: string[], name: string): void {
  if (Object.keys(value).sort().join(":") !== [...expected].sort().join(":")) {
    throw new TypeError(`${name} fields are invalid`);
  }
}

function evidence(value: unknown): Evidence {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new TypeError("evidence is invalid");
  const data = value as Record<string, unknown>;
  keys(
    data,
    [
      "actual",
      "artifacts",
      "built",
      "diagnostics",
      "downloaded",
      "expected",
      "gate",
      "id",
      "milliseconds",
      "pids",
      "restored",
      "status",
      "survivors",
      "transitions",
    ],
    "evidence",
  );
  const status = data.status as Status;
  if (!ids.includes(data.id as Id) || !gates.includes(data.gate as Gate))
    throw new TypeError("evidence identity is invalid");
  if (!["passed", "failed", "unqualified"].includes(status)) throw new TypeError("evidence status is invalid");
  if (!Number.isFinite(data.milliseconds) || Number(data.milliseconds) < 0)
    throw new TypeError("evidence time is invalid");
  const artifacts = strings(data.artifacts, "evidence.artifacts");
  if (artifacts.some((item) => !valid(item))) throw new TypeError("evidence artifacts are invalid");
  const pids = data.pids;
  const survivors = data.survivors;
  const processes = (items: unknown): items is number[] =>
    Array.isArray(items) && items.every((item) => Number.isSafeInteger(item) && Number(item) >= 0);
  if (!processes(pids) || !processes(survivors)) throw new TypeError("evidence processes are invalid");
  const item = matrix.find((current) => current.id === data.id);
  if (!item || item.gate !== data.gate || item.expected !== data.expected)
    throw new TypeError("evidence definition drift");
  if (typeof data.actual !== "string" || !data.actual) throw new TypeError("evidence actual is invalid");
  return {
    actual: String(data.actual),
    artifacts: artifacts as Digest[],
    built: strings(data.built, "evidence.built"),
    diagnostics: strings(data.diagnostics, "evidence.diagnostics"),
    downloaded: strings(data.downloaded, "evidence.downloaded"),
    expected: String(data.expected),
    gate: data.gate as Gate,
    id: data.id as Id,
    milliseconds: data.milliseconds as number,
    pids: pids.map(Number),
    restored: strings(data.restored, "evidence.restored"),
    status,
    survivors: survivors.map(Number),
    transitions: strings(data.transitions, "evidence.transitions"),
  };
}

export function parse(value: unknown): Report {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new TypeError("report is invalid");
  const data = value as Record<string, unknown>;
  keys(data, ["architecture", "platform", "result", "revision", "scenarios", "schema", "tools"], "report");
  if (data.schema !== 1 || !Array.isArray(data.scenarios)) throw new TypeError("report header is invalid");
  const tools = data.tools as Record<string, unknown>;
  if (!tools || typeof tools !== "object") throw new TypeError("report tools are invalid");
  keys(tools, ["electron", "node", "pnpm"], "report.tools");
  const scenarios = data.scenarios.map(evidence);
  if (scenarios.map((item) => item.id).join(":") !== matrix.map((item) => item.id).join(":")) {
    throw new TypeError("report scenarios are incomplete");
  }
  const result = data.result;
  if (result !== "passed" && result !== "partial" && result !== "failed")
    throw new TypeError("report result is invalid");
  const expected = scenarios.some((item) => item.status === "failed")
    ? "failed"
    : scenarios.some((item) => item.status === "unqualified")
      ? "partial"
      : "passed";
  if (result !== expected) throw new TypeError("report result is inconsistent");
  const identity = [data.architecture, data.platform, data.revision];
  const tooling = [tools.electron, tools.node, tools.pnpm];
  if ([...identity, ...tooling].some((item) => typeof item !== "string" || !item)) {
    throw new TypeError("report identity is invalid");
  }
  return {
    architecture: String(data.architecture),
    platform: String(data.platform),
    result,
    revision: String(data.revision),
    scenarios,
    schema: 1,
    tools: {
      electron: String(tools.electron),
      node: String(tools.node),
      pnpm: String(tools.pnpm),
    },
  };
}

export function encode(value: Report): string {
  return `${canonical(parse(value))}\n`;
}
