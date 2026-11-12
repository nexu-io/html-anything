import { limits } from "@open-motion/portable/contract";
import { type Artifact, id, revision } from "@open-motion/workspace/contract";
import { z } from "zod";

export const archiveLimits = Object.freeze({
  bytes: limits.archiveBytes,
  tickets: 2,
  lifetime: 600000,
  transfer: 60000,
});
const content = { digest: revision, bytes: z.number().int().min(22).max(archiveLimits.bytes) };
export const archiveSchemas = {
  archive_export: z.strictObject({ requestId: id, sessionId: id, artifactId: id, revision }),
  archive_upload: z.strictObject({ requestId: id, ...content }),
  archive_import: z.strictObject({
    requestId: id,
    sessionId: id,
    title: z.string().trim().min(1).max(120),
    digest: revision,
    uploadId: id.optional(),
  }),
  archive_release: z.strictObject({ id }),
};
export type ArchiveOperation = keyof typeof archiveSchemas;
export type ArchiveInput<K extends ArchiveOperation> = z.infer<(typeof archiveSchemas)[K]>;
export interface Upload {
  id: string;
  url: string;
  digest: string;
  bytes: number;
  expiresAt: number;
}
export interface Download extends Upload {
  filename: string;
  revision: string;
}
interface Outputs {
  archive_export: Download;
  archive_upload: Upload;
  archive_import: { artifact: Artifact | null };
  archive_release: { released: true };
}
export type ArchiveOutput<K extends ArchiveOperation> = Outputs[K];
