import { type ExportInput, type ExportOperation, type ExportOutput, exportSchemas } from "@open-motion/render/contract";
import {
  type Operation as W,
  type Input as WI,
  type Output as WO,
  schemas as workspace,
  descriptions as workspaceDescriptions,
} from "@open-motion/workspace/contract";

export { Fault } from "@open-motion/workspace/contract";
export const schemas = { ...workspace, ...exportSchemas };
export type Operation = W | ExportOperation;
type Inputs = { [K in W]: WI<K> } & { [K in ExportOperation]: ExportInput<K> };
export type Input<K extends Operation> = Inputs[K];
type Outputs = { [K in W]: WO<K> } & { [K in ExportOperation]: ExportOutput<K> };
export type Output<K extends Operation> = Outputs[K];
export const descriptions: Record<Operation, string> = {
  ...workspaceDescriptions,
  export_create:
    "Queue a film from an explicitly owned immutable source revision; requestId makes acceptance idempotent.",
  export_list: "List the artifact's durable export jobs, including revision, progress and verified output facts.",
  export_read: "Read one owned export job without affecting its execution lifetime.",
  export_cancel: "Request cancellation; only actual process drain completes a running cancellation.",
  export_retry: "Retry a failed, cancelled or interrupted job with its original immutable input.",
  export_download: "Issue a temporary read-only link to the verified film of a successful owned export.",
};
