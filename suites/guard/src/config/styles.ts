import type { StyleGrant } from "../types.js";
import { object } from "./schema.js";

export function grants(value: unknown): StyleGrant[] {
  if (!Array.isArray(value)) throw new Error("guard.styles must be an array");
  const result = value.map((input): StyleGrant => {
    const data = object(input, ["module", "kind", "entry", "prefix", "theme", "fonts"], "style grant");
    if (typeof data.module !== "string" || !/^(apps|packages|carriers|suites)\/[a-z][a-z0-9-]*$/.test(data.module))
      throw new Error("style grant requires an exact module path");
    if (data.kind !== "theme" && data.kind !== "components") throw new Error("unknown style role");
    if (typeof data.entry !== "string" || !/^src\/(?:[a-z][a-z0-9-]*\/)*[a-z][a-z0-9-]*\.less$/.test(data.entry))
      throw new Error("style entry must be a canonical src Less path");
    if (typeof data.prefix !== "string" || !/^[a-z][a-z0-9]*$/.test(data.prefix))
      throw new Error("invalid style prefix");
    if (data.kind === "components" && typeof data.theme !== "string")
      throw new Error("components require a theme module");
    if (data.kind === "theme" && data.theme !== undefined) throw new Error("theme cannot depend on another theme");
    if (data.fonts !== undefined && (data.kind !== "theme" || data.fonts !== "src/fonts/manifest.json"))
      throw new Error("font catalog requires the exact theme src/fonts/manifest.json path");
    return data as unknown as StyleGrant;
  });
  if (new Set(result.map((item) => item.module)).size !== result.length) throw new Error("duplicate style module");
  for (const item of result) {
    if (
      item.kind === "components" &&
      !result.some((theme) => theme.module === item.theme && theme.kind === "theme" && theme.prefix === item.prefix)
    )
      throw new Error("components require an authorized theme with matching prefix");
  }
  return result;
}
