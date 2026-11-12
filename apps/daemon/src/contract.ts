import { type ArchiveInput, type ArchiveOperation, type ArchiveOutput, archiveSchemas } from "./content/archive.js";

export {
  archiveLimits,
  type Download as ArchiveDownload,
  type Upload as ArchiveUpload,
} from "./content/archive.js";

import {
  type GenerationInput,
  type GenerationOperation,
  type GenerationOutput,
  generationSchemas,
} from "@open-motion/gateway/contract";
import { type ExportInput, type ExportOperation, type ExportOutput, exportSchemas } from "@open-motion/render/contract";
import {
  type TemplateInput,
  type TemplateOperation,
  type TemplateOutput,
  templateSchemas,
} from "@open-motion/templates/contract";
import {
  type Operation as W,
  type Input as WI,
  type Output as WO,
  schemas as workspace,
  descriptions as workspaceDescriptions,
} from "@open-motion/workspace/contract";

export { Fault } from "@open-motion/workspace/contract";
export const schemas = { ...workspace, ...exportSchemas, ...templateSchemas, ...generationSchemas, ...archiveSchemas };
export type Operation = W | ExportOperation | TemplateOperation | GenerationOperation | ArchiveOperation;
type Inputs = { [K in W]: WI<K> } & { [K in ExportOperation]: ExportInput<K> } & {
  [K in TemplateOperation]: TemplateInput<K>;
} & { [K in GenerationOperation]: GenerationInput<K> } & { [K in ArchiveOperation]: ArchiveInput<K> };
export type Input<K extends Operation> = Inputs[K];
type Outputs = { [K in W]: WO<K> } & { [K in ExportOperation]: ExportOutput<K> } & {
  [K in TemplateOperation]: TemplateOutput<K>;
} & { [K in GenerationOperation]: GenerationOutput<K> } & { [K in ArchiveOperation]: ArchiveOutput<K> };
export type Output<K extends Operation> = Outputs[K];
export const descriptions: Record<Operation, string> = {
  ...workspaceDescriptions,
  archive_export:
    "Freeze an explicitly owned revision as a bounded source/media ZIP and issue a temporary read-only resource link. Release its ticket after download.",
  archive_upload:
    "Reserve bounded temporary upload capacity for exact ZIP bytes/digest; POST application/zip to the returned business URL outside the control wire. Release unused tickets.",
  archive_import:
    "Confirm the original independent creation receipt first; absent uploadId returns artifact:null if no receipt exists. A verified upload creates one independent artifact without changing selection. Retry the same request after unknown outcomes, including after restart.",
  archive_release:
    "Revoke future access to a temporary archive ticket; accepted transfers retain capacity until actual drain.",
  generation_status: "Read explicitly configured PNG model identities; configuration is not model execution evidence.",
  generation_create:
    "Persist a fixed-revision PNG material task; replay the same request after an unknown response, never automatically resubmit uncertain provider calls.",
  generation_read: "Read an owned durable generation task and its explicit submission certainty.",
  generation_list: "List bounded pages of project-owned generation tasks and persistent candidates.",
  generation_cancel:
    "Request cancellation without claiming remote work stopped before confirmation and actual local drain.",
  generation_result: "Read the verified immutable PNG candidate; completion never edits the project.",
  generation_adopt:
    "Explicitly adopt an exact owned candidate into the expected project revision through an atomic workspace receipt; source insertion remains separate.",
  template_list:
    "Discover verified native templates and the explicitly configured Prism publication. Remote source-required entries carry claimed-source identities; dimensions become available only after native verification.",
  template_read:
    "Read the complete native source of the explicitly selected template version before creating or adapting it.",
  template_create:
    "Idempotently create an independent editable artifact from an exact template version; never changes current selection.",
  export_create:
    "Queue a film from an explicitly owned immutable source revision; requestId makes acceptance idempotent.",
  export_list: "List the artifact's durable export jobs, including revision, progress and verified output facts.",
  export_read: "Read one owned export job without affecting its execution lifetime.",
  export_cancel: "Request cancellation; only actual process drain completes a running cancellation.",
  export_retry: "Retry a failed, cancelled or interrupted job with its original immutable input.",
  export_download: "Issue a temporary read-only link to the verified film of a successful owned export.",
};
