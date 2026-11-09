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
