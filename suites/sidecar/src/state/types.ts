import type { FactoryScope } from "@odsuite/protocol";
import type { Directory } from "../control/directory.js";
import type { EndpointWitness, OwnerRecord } from "../runtime/ownership.js";

export interface FactoryState {
  scope: FactoryScope;
  owner?: OwnerRecord;
  registry?: string;
  binding?: string;
}
export interface Cleanup extends EndpointWitness {
  kind: "socket" | "file" | "directory";
  control?: boolean;
}
export interface Baseline {
  root: string;
  owner: OwnerRecord;
  directory: Directory;
  factories: FactoryState[];
  cleanup: Cleanup[];
}
export interface RecoveryRecord {
  schema: 1;
  id: string;
  phase: "prepared" | "files" | "complete";
  baseline: Baseline;
}
export interface RecoveryPlan {
  schema: 1;
  root: string;
  manager: string;
  fingerprint: string;
  phase: "ready" | "recovering" | "complete";
  factories: Array<{
    channel: string;
    namespace: string;
    retireTransient: number;
    bindingAction: "fail-attempt" | "retain" | "absent";
  }>;
}
export interface RecoveryOptions {
  expected: string;
  /** Observation runs under root-wide exclusion; it cannot approve missing evidence. */
  onCheckpoint?: (
    value: Readonly<{ id: string; stage: "prepared" | "resources" | "files" | "complete" }>,
  ) => Promise<void>;
}
