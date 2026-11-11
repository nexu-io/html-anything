import type { Head, KitMetadata } from "@odsuite/distribution/kit";
import type { Receipt, Transition } from "@odsuite/installer";
import { canonical } from "@odsuite/protocol";
import type { Manager } from "@odsuite/sidecar";
import type { Receipt as Registration } from "@open-motion/codexplugin/install";
import { type PackageManifest, parseManifest, type Selection } from "../contract.js";

export interface Options {
  endpoint: string;
  publickey: string;
  name: string;
  requestId?: string;
  worker?: string;
  codex?: string;
  onCheckpoint?: (phase: string) => Promise<void>;
}
export interface Plan {
  schema: 1;
  caller: PackageManifest;
  name: string;
  data: string;
  scope: Selection["scope"];
  codex: string;
  signed: { head: Head; metadata: KitMetadata };
  from: Record<string, Receipt>;
  registrations: Registration[];
  owner: Manager | null;
}
export interface Progress {
  phase: "staging" | "staged" | "stopped" | "selected" | "registered" | "starting" | "running";
  targets?: Record<string, string>;
  runtime?: unknown;
}
export function unpack(record: Transition, description: PackageManifest, selection: Selection, options: Options) {
  const plan = record.intent as Plan,
    data = record.data as Progress;
  if (
    plan?.schema !== 1 ||
    canonical(parseManifest(plan.caller)) !== canonical(description) ||
    plan.name !== options.name ||
    plan.data !== selection.data ||
    canonical(plan.scope) !== canonical(selection.scope) ||
    plan.codex !== (options.codex ?? selection.codex ?? "codex")
  )
    throw Error("activation intent differs from this caller or scope");
  if (!["staging", "staged", "stopped", "selected", "registered", "starting", "running"].includes(data?.phase))
    throw Error("invalid activation phase");
  if (plan.owner && (plan.owner.root !== selection.data || canonical(plan.owner.scope) !== canonical(selection.scope)))
    throw Error("activation runtime witness escaped its scope");
  return { plan, data };
}
export function summary(record: Transition) {
  const plan = record.intent as Plan,
    data = record.data as Progress;
  return {
    requestId: record.requestId,
    callerVersion: plan.caller.release.identity.version,
    state: record.complete ? "activated" : "pending",
    phase: data.phase,
    version: plan.signed.metadata.version,
    revision: record.revision,
  };
}
