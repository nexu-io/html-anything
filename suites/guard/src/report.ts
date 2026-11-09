import type { Report } from "./types.js";

export function format(report: Report, json = false): string {
  if (json) return JSON.stringify(report, null, 2);
  const findings = report.findings.map(
    (finding) =>
      `${finding.path}${finding.line ? `:${finding.line}:${finding.column ?? 1}` : ""}: ${finding.rule}: ${finding.message}`,
  );
  return [
    ...findings,
    `odsuite guard: ${report.ok ? "clean" : "failed"} (${report.files} files, ${report.paths} entries, full filesystem scan)`,
  ].join("\n");
}
