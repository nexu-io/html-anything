import { buildProjectApiPath } from "../../utils/projectRouting";
import { studioApiFetch } from "../../utils/studioApiFetch";
import type { DomEditSelection } from "./domEditingTypes";

export type ProbeTarget = { id?: string; hfId?: string; selector?: string; selectorIndex?: number };
export type SourceProbeFailure = "element-not-found" | "source-mismatch" | "unsupported-element" | "source-missing" | "source-denied" | "source-unreadable" | "connection-failed" | "check-failed";
export type SourceProbeResult = { exists: boolean; failure?: SourceProbeFailure };

export const sourceProbeMessages: Record<SourceProbeFailure, string> = {
  "element-not-found": "This element was not found in the current source. Refresh the preview, then ask an agent to edit the source if it is still unavailable.",
  "source-mismatch": "The preview element does not match the current source. Refresh the preview and select it again.",
  "unsupported-element": "This element type cannot be edited visually yet. Select its outer container or ask an agent to edit the source.",
  "source-missing": "The source file could not be found. Refresh the preview or ask an agent to restore the source file.",
  "source-denied": "Access to the source file was denied. Check file permissions and select the element again.",
  "source-unreadable": "The source file could not be read. Try again or ask an agent to check the source file.",
  "connection-failed": "Cannot connect to the editor to check this element. Check the connection and select it again.",
  "check-failed": "Could not check whether this element can be edited. Select it again or refresh the preview.",
};

export function knownSourceAnswer(
  previous: DomEditSelection | null | undefined,
  element: HTMLElement,
  sourceFile: string,
  target: ProbeTarget,
): SourceProbeResult | undefined {
  if (!previous || previous.element !== element || previous.sourceFile !== sourceFile) return;
  const same =
    previous.id === target.id &&
    previous.hfId === target.hfId &&
    previous.selector === target.selector &&
    previous.selectorIndex === target.selectorIndex;
  // Failed reads must be retried; a DOM/target change invalidates definitive answers.
  if (!same || previous.existsInSource === undefined) return;
  if (previous.sourceProbeFailure && !["element-not-found", "source-mismatch", "unsupported-element"].includes(previous.sourceProbeFailure)) return;
  return { exists: previous.existsInSource, failure: previous.sourceProbeFailure };
}

interface PendingProbe {
  target: ProbeTarget;
  resolve: (result: SourceProbeResult) => void;
}

const pending = new Map<string, PendingProbe[]>();

function responseFailure(status: number): SourceProbeFailure {
  if (status === 404) return "source-missing";
  if (status === 401 || status === 403) return "source-denied";
  return "source-unreadable";
}

function requestFailure(error: unknown): SourceProbeFailure {
  return error instanceof TypeError || (error as { name?: string })?.name === "TimeoutError" ? "connection-failed" : "check-failed";
}

function findSourceElement(doc: Document, target: ProbeTarget): Element | null {
  const attrValue = (value: string) => value.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
  const byHfId = target.hfId && doc.querySelector(`[data-hf-id="${attrValue(target.hfId)}"]`);
  const byId = target.id && doc.getElementById(target.id);
  if (byHfId || byId) return byHfId || byId || null;
  return target.selector ? doc.querySelectorAll(target.selector)[target.selectorIndex ?? 0] ?? null : null;
}

async function diagnoseMissingTargets(projectId: string, sourceFile: string, targets: ProbeTarget[]): Promise<SourceProbeFailure[]> {
  try {
    const response = await studioApiFetch(buildProjectApiPath(projectId, `/files/${encodeURIComponent(sourceFile)}`), { signal: AbortSignal.timeout(10_000) });
    if (!response.ok) return targets.map(() => responseFailure(response.status));
    const data = await response.json();
    if (typeof data?.content !== "string") return targets.map(() => "check-failed");
    const doc = new DOMParser().parseFromString(data.content, "text/html");
    return targets.map(target => {
      try {
        const element = findSourceElement(doc, target);
        if (!element) return "element-not-found";
        return element.namespaceURI !== "http://www.w3.org/1999/xhtml" ? "unsupported-element" : "source-mismatch";
      } catch { return "check-failed"; }
    });
  } catch (error) {
    return targets.map(() => requestFailure(error));
  }
}

async function sendBatch(projectId: string, sourceFile: string, probes: PendingProbe[]) {
  let results: SourceProbeResult[];
  try {
    const response = await studioApiFetch(
      buildProjectApiPath(
        projectId,
        `/file-mutations/probe-elements/${encodeURIComponent(sourceFile)}`,
      ),
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targets: probes.map((probe) => probe.target) }),
        signal: AbortSignal.timeout(10_000),
      },
    );
    if (!response.ok) {
      results = probes.map(() => ({ exists: false, failure: response.status === 401 || response.status === 403 ? "source-denied" : "check-failed" }));
    } else {
      const data = await response.json();
      if (!Array.isArray(data?.exists) || data.exists.length !== probes.length || data.exists.some((value: unknown) => typeof value !== "boolean")) {
        results = probes.map(() => ({ exists: false, failure: "check-failed" }));
      } else {
        const missing = probes.filter((_, index) => !data.exists[index]);
        const failures = missing.length ? await diagnoseMissingTargets(projectId, sourceFile, missing.map(probe => probe.target)) : [];
        let missingIndex = 0;
        results = data.exists.map((exists: boolean) => exists ? { exists } : { exists, failure: failures[missingIndex++] });
      }
    }
  } catch (error) {
    results = probes.map(() => ({ exists: false, failure: requestFailure(error) }));
  }
  probes.forEach((probe, index) => probe.resolve(results[index]!));
}

export function probeSourceElement(
  projectId: string,
  sourceFile: string,
  target: ProbeTarget,
): Promise<SourceProbeResult> {
  return new Promise((resolve) => {
    const key = `${projectId}\0${sourceFile}`;
    let probes = pending.get(key);
    if (!probes) {
      const batch: PendingProbe[] = [];
      probes = batch;
      pending.set(key, batch);
      setTimeout(() => {
        pending.delete(key);
        void sendBatch(projectId, sourceFile, batch);
      }, 0);
    }
    probes.push({ target, resolve });
  });
}
