import { z } from "zod";
import type { Descriptor } from "../contract.js";

export const prismConfig = z.strictObject({
  origin: z.string().url(),
  environment: z.enum(["dev", "prod"]),
  resourceId: z.uuid(),
  channel: z.string().regex(/^[a-z][a-z0-9-]{0,63}$/),
  locale: z.string().regex(/^[a-z]{2}(?:-[A-Za-z0-9]{2,8}){0,2}$/),
});
export type PrismConfig = z.infer<typeof prismConfig>;
const text = z.string().max(8000);
export const claim = z.strictObject({
  path: z.string().min(1).max(240),
  url: z.string().url(),
  bytes: z
    .number()
    .int()
    .nonnegative()
    .max(4 * 1024 ** 2),
  sha256: z.string().regex(/^[a-f0-9]{64}$/),
});
export const publishedTemplate = z.strictObject({
  templateId: z.string().regex(/^[A-Za-z0-9][A-Za-z0-9._-]{0,119}$/),
  sortOrder: z.number().finite(),
  original: z.record(z.string().min(1).max(120), text),
  files: z.array(claim).max(128),
  indexUrl: z.string().max(2000).optional(),
  coverUrl: z.string().max(2000).optional(),
  previewUrl: z.string().max(2000).optional(),
  conversionStatus: z.string().max(120).optional(),
  conversionNotes: text.optional(),
});
export const publication = z.strictObject({
  resourceId: z.uuid(),
  environment: z.enum(["dev", "prod"]),
  channel: z.string().min(1).max(64),
  publicationId: z.string().min(1).max(120),
  defaultLocale: z.string().min(1).max(32),
  content: z.record(z.string().min(1).max(32), z.strictObject({ templates: z.array(publishedTemplate).max(1024) })),
});
export type Publication = z.infer<typeof publication>;
export type PublishedTemplate = z.infer<typeof publishedTemplate>;
export interface Discovery {
  id: string;
  upstreamId: string;
  contentHash: string;
  title: string;
  description: string;
  source: string;
  license: string;
  files: Descriptor["files"];
  availability: "source-required" | "unsupported";
  reason?: string;
}
export interface DiscoveryCatalog {
  publicationId: string;
  environment: PrismConfig["environment"];
  resourceId: string;
  channel: string;
  locale: string;
  contentHash: string;
  stale: boolean;
  warning?: string;
  entries: Discovery[];
}
export const adapterVersion = "open-motion-prism-text-1";
