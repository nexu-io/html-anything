import { z } from "zod";
export const fps = z
  .strictObject({ num: z.number().int().min(1).max(240000), den: z.number().int().min(1).max(1001) })
  .refine((v) => v.num / v.den >= 1 && v.num / v.den <= 240, "invalid frame rate");
export const specification = z.strictObject({
  width: z.number().int().min(2).max(4096).multipleOf(2),
  height: z.number().int().min(2).max(4096).multipleOf(2),
  fps,
  duration: z.number().positive().max(600),
  frames: z.number().int().positive().max(36000),
  audio: z.enum(["required", "silent"]),
});
export type Specification = z.infer<typeof specification>;
export interface Verification {
  digest: `sha256:${string}`;
  bytes: number;
  frames: number;
  duration: number;
  audio: boolean;
  seek: number[];
}
export type Progress = "capturing" | "encoding" | "verifying";
const uuid = z.uuid(),
  hash = z.string().regex(/^sha256:[a-f0-9]{64}$/),
  owner = { sessionId: uuid, artifactId: uuid },
  selected = { ...owner, id: uuid };
export const exportSchemas = {
  export_create: z.strictObject({ ...owner, requestId: uuid, revision: hash, fps }),
  export_list: z.strictObject({
    ...owner,
    limit: z.number().int().min(1).max(16).default(12),
    before: uuid.optional(),
  }),
  export_read: z.strictObject(selected),
  export_cancel: z.strictObject({ ...selected, requestId: uuid, expectedVersion: z.number().int().nonnegative() }),
  export_retry: z.strictObject({ ...selected, requestId: uuid, expectedVersion: z.number().int().nonnegative() }),
  export_download: z.strictObject(selected),
};
export type ExportOperation = keyof typeof exportSchemas;
export type ExportInput<K extends ExportOperation> = z.input<(typeof exportSchemas)[K]>;
export interface Receipt {
  id: string;
  path: string;
  revision: string;
  sessionId: string;
  artifactId: string;
  spec: Specification;
  verification: Verification;
  toolchain: Record<string, string>;
}
export type Film = Omit<Receipt, "path">;
export interface Job {
  id: string;
  sessionId: string;
  artifactId: string;
  revision: string;
  fps: z.infer<typeof fps>;
  version: number;
  attempt: string;
  state:
    | "queued"
    | "preparing"
    | Progress
    | "cancelling"
    | "succeeded"
    | "failed"
    | "cancelled"
    | "interrupted"
    | "recovering";
  createdAt: number;
  updatedAt: number;
  result?: Film;
  error?: string;
}
export interface Download {
  url: string;
  digest: string;
  bytes: number;
  filename: string;
  expiresAt: number;
}
export type ExportOutput<K extends ExportOperation> = K extends "export_list"
  ? { jobs: Job[]; next: string | null }
  : K extends "export_download"
    ? Download
    : Job;
export type Projection = { digest: string; bytes: number };
export type Reply<T> =
  | { ok: true; value: T }
  | {
      ok: false;
      error: { code: "invalid" | "missing" | "ownership" | "conflict" | "idempotency" | "integrity"; message: string };
    };
export type RenderMethods = {
  [K in Exclude<ExportOperation, "export_download">]: {
    input: ExportInput<K> & (K extends "export_create" ? { projection: Projection } : object);
    output: Reply<ExportOutput<K>>;
  };
};
