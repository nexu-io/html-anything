/** Adapter for the pinned native player's renderSeek protocol, not another timeline implementation. */
export function captureBridge() {
  const surface = window as typeof window & {
    __renderReady?: boolean;
    __player?: { renderSeek(time: number, options?: unknown): void; getDuration(): number };
    __hf?: { seek?: (time: number, options?: unknown) => void; duration?: number };
  };
  const install = () => {
    const player = surface.__player;
    if (!player || !surface.__renderReady) return false;
    const bridge = surface.__hf ?? {};
    Object.defineProperty(bridge, "duration", {
      configurable: true,
      enumerable: true,
      get: () => (surface.__renderReady ? player.getDuration() : 0),
    });
    bridge.seek = (time, options) => player.renderSeek(time, options);
    surface.__hf = bridge;
    return true;
  };
  if (!install()) {
    const timer = setInterval(() => {
      if (install()) clearInterval(timer);
    }, 25);
  }
}
