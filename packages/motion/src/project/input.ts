import { z } from "zod";
export const contextInput = z.strictObject({
  files: z
    .array(z.strictObject({ path: z.string().min(1).max(240), content: z.string().max(1048576) }))
    .min(1)
    .max(128),
  instance: z.string().min(1).max(512).nullable(),
});
