import { z } from "zod";
export const resourceLimit = 6 * 1024 * 1024;
export const resourceCountLimit = 64;
export const resourceBytesLimit = 64 * 1024 * 1024;
export const resourcePath = z
  .string()
  .max(240)
  .regex(/^assets\/[a-zA-Z0-9][a-zA-Z0-9._-]*\.(png|wav|ttf|otf|woff|woff2)$/i);
export const fontMetadata = z.strictObject({
  family: z
    .string()
    .trim()
    .min(1)
    .max(120)
    .regex(/^[^\p{Cc}]+$/u),
  postscriptName: z
    .string()
    .min(1)
    .max(120)
    .regex(/^[^\p{Cc}]+$/u),
  weight: z
    .tuple([z.number().finite().min(1).max(1000), z.number().finite().min(1).max(1000)])
    .refine(([min, max]) => min <= max, "invalid font weight range"),
  slant: z.enum(["normal", "italic"]),
});
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
  ...(["font/ttf", "font/otf", "font/woff", "font/woff2"] as const).map((type) =>
    z.strictObject({ ...common, type: z.literal(type), ...fontMetadata.shape }),
  ),
]);
export type Resource = z.infer<typeof resource>;
export type FontResource = Extract<Resource, { type: `font/${string}` }>;
export function isFontResource(value: Resource): value is FontResource {
  return value.type.startsWith("font/");
}
/** A face binds exact bytes, so two imported fonts with the same family never shadow each other. */
export function resourceFontFamily(digest: string): string {
  if (!/^sha256:[a-f0-9]{64}$/.test(digest)) throw Error("invalid font identity");
  return `OpenMotionFont_${digest.slice(7)}`;
}
export const resourceData = z
  .string()
  .min(4)
  .max(Math.ceil(resourceLimit / 3) * 4);
