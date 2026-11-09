import { z } from "zod";
export const inspectInput = z.strictObject({ html: z.string().min(1).max(1048576) });
export const appearanceInput = z.strictObject({
  x: z.number().finite().min(-65536).max(65536).optional(),
  y: z.number().finite().min(-65536).max(65536).optional(),
  rotation: z.number().finite().min(-36000).max(36000).optional(),
  opacity: z.number().finite().min(0).max(1).optional(),
  color: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/)
    .optional(),
});
export type Appearance = z.infer<typeof appearanceInput>;
export const patchInput = inspectInput.extend({
  id: z.string().min(1).max(512),
  text: z.string().max(8000).optional(),
  start: z.number().finite().nonnegative().optional(),
  duration: z.number().finite().positive().optional(),
  fontSize: z.number().finite().positive().max(4096).optional(),
  appearance: appearanceInput.optional(),
});
export type NativeValues = Omit<z.infer<typeof patchInput>, "html" | "id">;
export const properties = ["x", "y", "rotation", "opacity", "scale"] as const;
export const eases = [
  "none",
  "power1.in",
  "power1.out",
  "power1.inOut",
  "power2.in",
  "power2.out",
  "power2.inOut",
  "power3.in",
  "power3.out",
  "power3.inOut",
  "power4.in",
  "power4.out",
  "power4.inOut",
] as const;
export type Ease = (typeof eases)[number];
export const frameInput = z.strictObject({
  percentage: z.number().finite().min(0).max(100),
  value: z.number().finite().min(-65536).max(65536),
  ease: z.enum(eases).optional(),
});
export const animationInput = z.discriminatedUnion("action", [
  inspectInput.extend({
    action: z.literal("put"),
    id: z.string().min(1).max(512),
    animationId: z.string().min(1).max(2048).optional(),
    property: z.enum(properties),
    ease: z.enum(eases).optional(),
    start: z.number().finite().nonnegative(),
    duration: z.number().finite().positive(),
    frames: z.array(frameInput).min(2).max(64),
  }),
  inspectInput.extend({
    action: z.literal("convert"),
    id: z.string().min(1).max(512),
    animationId: z.string().min(1).max(2048),
  }),
  inspectInput.extend({
    action: z.literal("separate"),
    id: z.string().min(1).max(512),
    animationId: z.string().min(1).max(2048),
  }),
  inspectInput.extend({
    action: z.literal("retime"),
    id: z.string().min(1).max(512),
    animationId: z.string().min(1).max(2048),
    percentage: z.number().finite().min(0).max(100),
    time: z.number().finite().nonnegative(),
  }),
  inspectInput.extend({
    action: z.literal("remove"),
    id: z.string().min(1).max(512),
    animationId: z.string().min(1).max(2048),
  }),
]);
export type AnimationInput = z.infer<typeof animationInput>;
export interface Animation {
  id: string;
  property: (typeof properties)[number] | null;
  ease?: Ease;
  convertible: boolean;
  separable: boolean;
  start: number | null;
  duration: number | null;
  frames: z.infer<typeof frameInput>[];
  reason: string | null;
}
export const editInput = z.discriminatedUnion("action", [
  inspectInput.extend({
    action: z.literal("addText"),
    fontSize: z.number().finite().positive().max(4096),
    text: z.string().min(1).max(8000),
  }),
  inspectInput.extend({ action: z.literal("remove"), id: z.string().min(1).max(512) }),
]);
export interface Clip {
  host?: { instance: string; source: string; maximum: number | null; reason: string | null };
  id: string;
  parent: string | null;
  tag: string;
  text: string | null;
  start: number | null;
  duration: number | null;
  composition: boolean;
  fontSize: number | null;
  appearance: Appearance;
  animations: Animation[];
  animationReason: string | null;
}
export interface NativeModel {
  html: string;
  clips: Clip[];
}
