import { z } from "zod";
import type { Project } from "@open-motion/workspace/contract";

const uuid = z.uuid(), hash = z.string().regex(/^sha256:[a-f0-9]{64}$/);
const identity = z.string().min(1).max(120).regex(/^[a-zA-Z0-9][a-zA-Z0-9._:/-]*$/);
const owner = { sessionId: uuid, artifactId: uuid }, selected = { ...owner, id: uuid };
export const model = z.strictObject({ id: identity, label: z.string().trim().min(1).max(120) });
export const providerDescriptor = z.strictObject({ id: identity, version: identity, models: z.array(model).min(1).max(16) });
export type ProviderDescriptor = z.infer<typeof providerDescriptor>;
export const generationSchemas = {
  generation_status: z.strictObject({}),
  generation_create: z.strictObject({ ...owner, revision: hash, providerId: identity, providerVersion: identity, modelId: identity, prompt: z.string().trim().min(1).max(8000), requestId: uuid }),
  generation_read: z.strictObject(selected),
  generation_list: z.strictObject({ ...owner, limit: z.number().int().min(1).max(16).default(12), before: uuid.optional() }),
  generation_cancel: z.strictObject({ ...selected, requestId: uuid, expectedVersion: z.number().int().nonnegative() }),
  generation_result: z.strictObject(selected),
  generation_adopt: z.strictObject({ ...selected, requestId: uuid, expectedRevision: hash, path: z.string().max(240).regex(/^assets\/[a-zA-Z0-9][a-zA-Z0-9._-]*\.png$/i), name: z.string().trim().min(1).max(120), contentHash: hash }),
} as const;
export const candidate = z.strictObject({ jobId: uuid, contentHash: hash, bytes: z.number().int().positive().max(6 * 1024 * 1024), type: z.literal("image/png"), width: z.number().int().min(1).max(4096), height: z.number().int().min(1).max(4096), providerId: identity, providerVersion: identity, modelId: identity });
export type Candidate = z.infer<typeof candidate>;
export const job = generationSchemas.generation_create.extend({ id: uuid, version: z.number().int().nonnegative(), state: z.enum(["queued", "submitting", "running", "cancelling", "succeeded", "failed", "cancelled", "interrupted"]), submission: z.enum(["not-started", "unknown", "accepted"]), remoteId: z.string().min(1).max(256).optional(), createdAt: z.number().int().nonnegative(), updatedAt: z.number().int().nonnegative(), candidate: candidate.optional(), error: z.string().max(256).optional() });
export type Job = z.infer<typeof job>;
export type GenerationOperation = keyof typeof generationSchemas;
export type GenerationInput<K extends GenerationOperation> = z.input<(typeof generationSchemas)[K]>;
export interface Status { configured: boolean; providers: ProviderDescriptor[]; limits: { active: 32; page: 16; pngBytes: 6291456; pngDimension: 4096 } }
export type GenerationOutput<K extends GenerationOperation> = K extends "generation_status" ? Status : K extends "generation_list" ? { jobs: Job[]; next: string | null } : K extends "generation_result" ? { candidate: Candidate; data: string } : K extends "generation_adopt" ? Project : Job;
export type Reply<T> = { ok: true; value: T } | { ok: false; error: { code: "invalid" | "missing" | "ownership" | "conflict" | "idempotency" | "integrity"; message: string } };
/** Private control transport. Bulk bytes never cross sidecar frames; adoption belongs to workspace. */
export type GatewayMethods = { [K in Exclude<GenerationOperation, "generation_adopt">]: { input: GenerationInput<K>; output: Reply<K extends "generation_result" ? { candidate: Candidate; path: string } : GenerationOutput<K>> } };
