/** Runs only in the derived sandboxed native document. Reads geometry; never paints editor CSS into source. */
export function editorBridge() {
  const identity = (node: HTMLElement) => {
    const instance = node.getAttribute("data-open-motion-instance");
    if (instance) return instance;
    const scope = node.parentElement?.closest("[data-open-motion-instance]")?.getAttribute("data-open-motion-instance");
    return [scope, node.getAttribute("data-hf-id")].filter(Boolean).join("/");
  };
  let selected: HTMLElement | null = null,
    key = "",
    enabled = false;
  const send = (type: string, data: Record<string, unknown>) =>
    parent.postMessage({ source: "open-motion-editor", type, ...data }, "*");
  const movable = (node: HTMLElement) => {
    if (node.hasAttribute("data-composition-id") || node.closest("[data-open-motion-instance]")) return null;
    const own = getComputedStyle(node),
      translate = own.translate === "none" ? ["0px", "0px"] : own.translate.split(/\s+/);
    if (translate.length > 2 || !translate.every((v) => /^-?\d+(?:\.\d+)?px$/.test(v))) return null;
    let matrix = new DOMMatrix();
    for (let p = node.parentElement; p; p = p.parentElement) {
      const computed = getComputedStyle(p),
        local = new DOMMatrix(computed.transform === "none" ? undefined : computed.transform);
      if (!local.is2D || computed.perspective !== "none" || !["1", "normal"].includes(computed.zoom)) return null;
      const rotation =
        computed.rotate === "none"
          ? 0
          : /^-?\d+(?:\.\d+)?deg$/.test(computed.rotate)
            ? Number.parseFloat(computed.rotate)
            : Number.NaN;
      const scale = computed.scale === "none" ? [1, 1] : computed.scale.split(/\s+/).map(Number);
      if (!Number.isFinite(rotation) || scale.length > 2 || scale.some((v) => !Number.isFinite(v) || v === 0))
        return null;
      matrix = new DOMMatrix()
        .rotate(rotation)
        .scale(scale[0], scale[1] ?? scale[0])
        .multiply(local)
        .multiply(matrix);
    }
    const inverse = matrix.inverse();
    if (![inverse.a, inverse.b, inverse.c, inverse.d].every(Number.isFinite)) return null;
    return { inverse, x: Number.parseFloat(translate[0] ?? "0"), y: Number.parseFloat(translate[1] ?? "0") };
  };
  const geometry = () => {
    if (!selected?.isConnected) return;
    const rect = selected.getBoundingClientRect(),
      data = {
        id: identity(selected),
        x: rect.x,
        y: rect.y,
        width: rect.width,
        height: rect.height,
        movable: enabled && !!movable(selected),
      };
    const next = JSON.stringify(data);
    if (next !== key) {
      key = next;
      send("geometry", data);
    }
  };
  addEventListener("message", (event) => {
    if (event.source !== parent || event.data?.source !== "open-motion-editor" || event.data.type !== "selection")
      return;
    enabled = event.data.enabled === true;
    selected =
      [...document.querySelectorAll<HTMLElement>("[data-hf-id]")].find((e) => identity(e) === event.data.id) ?? null;
    key = "";
    geometry();
  });
  let drag: {
    node: HTMLElement;
    id: string;
    pointer: number;
    x: number;
    y: number;
    basis: NonNullable<ReturnType<typeof movable>>;
  } | null = null;
  document.addEventListener("pointerdown", (event) => {
    if (event.button !== 0 || !enabled) return;
    const node = event.target instanceof Element ? event.target.closest<HTMLElement>("[data-hf-id]") : null;
    if (!node) return;
    const id = identity(node),
      basis = movable(node);
    if (!id) return;
    send("select", { id });
    if (!basis) return;
    event.preventDefault();
    send("begin", { id });
    node.setPointerCapture(event.pointerId);
    drag = { node, id, pointer: event.pointerId, x: event.clientX, y: event.clientY, basis };
  });
  document.addEventListener("pointerup", (event) => {
    const value = drag;
    drag = null;
    if (!value || event.pointerId !== value.pointer) return;
    if (value.node.hasPointerCapture(event.pointerId)) value.node.releasePointerCapture(event.pointerId);
    const dx = event.clientX - value.x,
      dy = event.clientY - value.y;
    if (!enabled || Math.hypot(dx, dy) < 3) return;
    const { a, b, c, d } = value.basis.inverse;
    send("move", { id: value.id, x: value.basis.x + a * dx + c * dy, y: value.basis.y + b * dx + d * dy });
  });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") drag = null;
  });
  document.addEventListener("pointercancel", () => {
    drag = null;
  });
  document.addEventListener("click", (event) => {
    const node = event.target instanceof Element ? event.target.closest("[data-hf-id]") : null;
    const id = node?.getAttribute("data-hf-id");
    if (id) send("select", { id });
  });
  const tick = () => {
    geometry();
    requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
}
