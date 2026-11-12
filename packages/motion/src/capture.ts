/** Adapter for the pinned native player's renderSeek protocol, not another timeline implementation. */
export function captureBridge() {
  const surface = window as typeof window & {
    __renderReady?: boolean;
    __openMotionFonts?: Promise<void>;
    __player?: { renderSeek(time: number, options?: unknown): void; getDuration(): number };
    __hf?: { seek?: (time: number, options?: unknown) => void; duration?: number };
  };
  let fontsReady = !surface.__openMotionFonts;
  let timer: ReturnType<typeof setInterval> | undefined;
  const bridge = surface.__hf ?? {};
  Object.defineProperty(bridge, "duration", {
    configurable: true,
    enumerable: true,
    get: () => (surface.__renderReady && fontsReady ? (surface.__player?.getDuration() ?? 0) : 0),
  });
  surface.__hf = bridge;
  const install = () => {
    const player = surface.__player;
    if (!player || !surface.__renderReady || !fontsReady) return false;
    bridge.seek = (time, options) => player.renderSeek(time, options);
    surface.__hf = bridge;
    return true;
  };
  void surface.__openMotionFonts?.then(
    () => {
      fontsReady = true;
      if (install()) clearInterval(timer);
    },
    () => clearInterval(timer),
  );
  if (!install()) {
    timer = setInterval(() => {
      if (install()) clearInterval(timer);
    }, 25);
  }
}
