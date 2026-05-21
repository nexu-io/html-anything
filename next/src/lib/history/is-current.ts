import type { RunRecord } from "./db";

/**
 * A run is "current" only when it is the newest row *and* its html still
 * matches the editor. Anchoring on the newest id (not just html equality)
 * is what makes restore correct: `commitBase` appends a new row whose html
 * equals the restored row's html, so a pure content check would flag both
 * as current and disable Restore on the older identical version.
 *
 * `runs` must be the listRuns ordering (newest first); `runs[0]` is the
 * live version.
 */
export function isCurrentRun(
  run: RunRecord,
  runs: RunRecord[],
  activeHtml: string,
): boolean {
  return run.id === runs[0]?.id && run.html === activeHtml;
}
