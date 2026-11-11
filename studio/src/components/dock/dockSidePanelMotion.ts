const DURATION_MS = 180;

/** One interruptible transition per side; no panel or player is recreated. */
export function createSidePanelMotion() {
  const running = new Map<HTMLElement, { frame: number; finish: () => void }>();
  const reducedMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)");
  const cancel = (element: HTMLElement) => {
    const current = running.get(element);
    if (current) cancelAnimationFrame(current.frame);
    running.delete(element);
    element.removeAttribute("data-side-motion");
  };
  const finishAll = () => {
    for (const current of [...running.values()]) current.finish();
  };
  const onPreferenceChange = () => {
    if (reducedMotion?.matches) finishAll();
  };
  reducedMotion?.addEventListener("change", onPreferenceChange);
  return {
    finishAll,
    has: (element: HTMLElement) => running.has(element),
    run(element: HTMLElement, from: number, to: number, animate: boolean,
      resize: (width: number, finished: boolean) => void) {
      cancel(element);
      if (!animate || reducedMotion?.matches || Math.abs(from - to) < 1) {
        resize(to, true);
        return;
      }
      element.setAttribute("data-side-motion", "");
      const start = performance.now();
      const finish = () => { cancel(element); resize(to, true); };
      const state = { frame: 0, finish };
      const step = (now: number) => {
        const progress = Math.min(1, Math.max(0, (now - start) / DURATION_MS));
        if (progress === 1) { finish(); return; }
        // Cubic ease-out: immediate response with a gentle, non-bouncy landing.
        resize(from + (to - from) * (1 - (1 - progress) ** 3), false);
        state.frame = requestAnimationFrame(step);
      };
      running.set(element, state);
      state.frame = requestAnimationFrame(step);
    },
    dispose() {
      for (const element of running.keys()) cancel(element);
      reducedMotion?.removeEventListener("change", onPreferenceChange);
    },
  };
}
