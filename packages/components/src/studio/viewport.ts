/** Intrinsic media coordinates scale as SVG content; no runtime CSS writes. */
export function previewViewport(document: Document) {
  const element = document.createElement("div"),
    svg = document.createElementNS("http://www.w3.org/2000/svg", "svg"),
    outline = document.createElementNS("http://www.w3.org/2000/svg", "rect"),
    content = document.createElementNS("http://www.w3.org/2000/svg", "foreignObject");
  element.className = "om-preview__canvas";
  svg.classList.add("om-preview__viewport");
  svg.setAttribute("role", "group");
  svg.setAttribute("aria-label", "原生画布");
  content.setAttribute("x", "0");
  content.setAttribute("y", "0");
  outline.classList.add("om-preview__selection");
  outline.setAttribute("visibility", "hidden");
  svg.append(content, outline);
  element.append(svg);
  const resize = (width: number, height: number) => {
    if (
      !Number.isFinite(width) ||
      !Number.isFinite(height) ||
      width < 1 ||
      height < 1 ||
      width > 16384 ||
      height > 16384
    )
      throw new Error("native preview dimensions are outside supported bounds");
    svg.setAttribute("viewBox", `0 0 ${width} ${height}`);
    content.setAttribute("width", String(width));
    content.setAttribute("height", String(height));
  };
  resize(640, 360);
  return {
    element,
    content,
    resize,
    selection(bounds: { x: number; y: number; width: number; height: number } | null) {
      outline.setAttribute("visibility", bounds ? "visible" : "hidden");
      if (!bounds) return;
      for (const value of [bounds.x, bounds.y, bounds.width, bounds.height])
        if (!Number.isFinite(value) || Math.abs(value) > 1e7) throw new Error("invalid selection geometry");
      outline.setAttribute("x", String(bounds.x));
      outline.setAttribute("y", String(bounds.y));
      outline.setAttribute("width", String(Math.max(0, bounds.width)));
      outline.setAttribute("height", String(Math.max(0, bounds.height)));
    },
  };
}
