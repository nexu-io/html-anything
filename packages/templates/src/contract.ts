import { z } from "zod";
export const templateId = z.string().regex(/^[a-z][a-z0-9-]{0,119}$/);
export const contentHash = z.string().regex(/^sha256:[a-f0-9]{64}$/);
const selected = { id: templateId, contentHash };
export const templateSchemas = {
  template_list: z.strictObject({}),
  template_read: z.strictObject(selected),
  template_create: z.strictObject({
    ...selected,
    requestId: z.uuid(),
    sessionId: z.uuid(),
    title: z.string().trim().min(1).max(120),
  }),
};
export type TemplateOperation = keyof typeof templateSchemas;
export type TemplateInput<K extends TemplateOperation> = z.infer<(typeof templateSchemas)[K]>;
export interface Descriptor {
  id: string;
  title: string;
  description: string;
  contentHash: string;
  duration: number;
  width: number;
  height: number;
  source: string;
  license: string;
  adaptations: string[];
  files: { path: string; bytes: number; digest: string }[];
}
export type TemplateOutput<K extends TemplateOperation> = K extends "template_list"
  ? { templates: Descriptor[] }
  : K extends "template_create"
    ? import("@open-motion/workspace/contract").Artifact
    : { template: Descriptor; files: import("@open-motion/workspace/contract").SourceFile[] };
