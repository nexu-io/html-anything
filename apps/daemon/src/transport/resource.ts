import { id, type Project, type Resource, resourceLimit, schemas } from "@open-motion/workspace/contract";
import { z } from "zod";

export const resourceTransferLimits = Object.freeze({ tickets: 2, lifetime: 600000, transfer: 60000 });
export const resourceSchemas = {
  resource_import: schemas.resource_import.extend({ uploadId: id.optional() }),
  resource_read: schemas.resource_read,
  resource_upload: z.strictObject({
    requestId: id,
    digest: z.string().regex(/^sha256:[a-f0-9]{64}$/),
    bytes: z.number().int().positive().max(resourceLimit),
  }),
  resource_release: z.strictObject({ id }),
};
export interface ResourceUpload {
  id: string;
  url: string;
  digest: string;
  bytes: number;
  expiresAt: number;
}
export interface ResourceDownload extends ResourceUpload {
  resource: Resource;
  filename: string;
}
export type ResourceOperation = keyof typeof resourceSchemas;
export type ResourceInput<K extends ResourceOperation> = z.input<(typeof resourceSchemas)[K]>;
type Outputs = {
  resource_import: { project: Project | null };
  resource_upload: ResourceUpload;
  resource_read: ResourceDownload;
  resource_release: { released: true };
};
export type ResourceOutput<K extends ResourceOperation> = Outputs[K];
