import { z } from "zod";
export const resourceLimit = 6 * 1024 * 1024;
export const resourceCountLimit = 64;
export const resourceBytesLimit = 64 * 1024 * 1024;
export const resourcePath = z
  .string()
  .max(240)
  .regex(/^assets\/[a-zA-Z0-9][a-zA-Z0-9._-]*\.(png|wav)$/i);
const common = {
  path: resourcePath,
  name: z.string().trim().min(1).max(120),
  digest: z.string().regex(/^sha256:[a-f0-9]{64}$/),
  bytes: z.number().int().positive().max(resourceLimit),
};
export const resource = z.discriminatedUnion("type", [
  z.strictObject({
    ...common,
    type: z.literal("image/png"),
    width: z.number().int().positive().max(4096),
    height: z.number().int().positive().max(4096),
  }),
  z.strictObject({
    ...common,
    type: z.literal("audio/wav"),
    duration: z.number().positive().finite(),
    sampleRate: z.number().int().min(8000).max(96000),
    channels: z.number().int().min(1).max(2),
  }),
]);
export type Resource = z.infer<typeof resource>;
export const resourceData = z
  .string()
  .min(4)
  .max(Math.ceil(resourceLimit / 3) * 4);
