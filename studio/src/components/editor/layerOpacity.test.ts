// @vitest-environment happy-dom
import { describe, expect, it } from "vitest";
import { layerOpacityStyles, layerOpacityValue, LAYER_OPACITY_PROPERTY } from "./layerOpacity";
import { getInlineStyles } from "./domEditingDom";
import { applyPatch } from "../../utils/sourcePatcher";

describe("independent layer opacity", () => {
  it("persists and reads back the multiplier without changing the authored fade", () => {
    const script = '<script>tl.fromTo("#title", {opacity: 0}, {opacity: 1, duration: .7});</script>';
    let source = '<h1 id="title" style="filter: blur(2px)">Title</h1>' + script;
    const styles = layerOpacityStyles(.47, {filter: "blur(2px)"}, {opacity: ".99"});
    for (const [property, value] of Object.entries(styles)) {
      source = applyPatch(source, "title", {type: "inline-style", property, value});
    }
    expect(source).toContain(script);
    const doc = new DOMParser().parseFromString(source, "text/html");
    const el = doc.getElementById("title")!;
    expect(layerOpacityValue(getInlineStyles(el))).toBe(.47);
    // Seeking the authored fade can continue to write opacity independently.
    el.style.opacity = ".2";
    expect(el.style.filter).toBe("blur(2px) opacity(var(--hf-layer-opacity))");
    expect(el.style.getPropertyValue(LAYER_OPACITY_PROPERTY)).toBe("0.47");
  });

  it("does not accumulate filters and can recover from zero", () => {
    const zero = layerOpacityStyles(0, {}, {filter: "blur(2px)"});
    const restored = layerOpacityStyles(1, zero, {filter: "blur(2px) opacity(0)"});
    expect(restored.filter).toBe("blur(2px) opacity(var(--hf-layer-opacity))");
    expect(layerOpacityValue(restored)).toBe(1);
    expect(restored).not.toHaveProperty("opacity");
  });
});
