/** A separate opacity multiplier leaves an authored GSAP fade untouched. */
export const LAYER_OPACITY_PROPERTY = "--hf-layer-opacity";
const LAYER_OPACITY_FILTER = `opacity(var(${LAYER_OPACITY_PROPERTY}))`;

export function layerOpacityValue(inlineStyles: Record<string, string>): number {
  const value = Number.parseFloat(inlineStyles[LAYER_OPACITY_PROPERTY] ?? "1");
  return Number.isFinite(value) ? Math.max(0, Math.min(1, value)) : 1;
}

export function layerOpacityStyles(
  value: number,
  inlineStyles: Record<string, string>,
  computedStyles: Record<string, string>,
): Record<string, string> {
  // Prefer the authored filter so repeated changes never bake the previous
  // multiplier into a computed filter or discard unrelated blur/color effects.
  const filter = inlineStyles.filter || computedStyles.filter || "none";
  const base = filter.replaceAll(LAYER_OPACITY_FILTER, "").trim();
  return {
    [LAYER_OPACITY_PROPERTY]: String(Math.max(0, Math.min(1, value))),
    filter: `${base === "none" ? "" : base + " "}${LAYER_OPACITY_FILTER}`.trim(),
  };
}
