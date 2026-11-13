// @vitest-environment happy-dom
import { afterEach, describe, expect, it, vi } from "vitest";
import { brandPlayerLoading, mountOpenDesignLoading } from "./openDesignLoading";

const disposers: (() => void)[] = [];
afterEach(() => {
  disposers.splice(0).forEach(stop => stop());
  document.body.replaceChildren();
  vi.restoreAllMocks();
});

function mark() {
  const host = document.createElement("span");
  document.body.append(host);
  return host;
}

const flush = () => new Promise(resolve => setTimeout(resolve, 0));

describe("OpenDesign loading", () => {
  it("keeps an independent static wordmark per instance when reduced motion is requested", () => {
    vi.spyOn(window, "matchMedia").mockReturnValue({ matches: true, addEventListener() {}, removeEventListener() {} } as unknown as MediaQueryList);
    const getContext = vi.spyOn(HTMLCanvasElement.prototype, "getContext");
    const first = mark();
    const second = mark();
    disposers.push(mountOpenDesignLoading(first), mountOpenDesignLoading(second));
    for (const host of [first, second]) {
      expect(host.querySelector("img")?.hidden).toBe(false);
      expect(host.querySelector("canvas")?.hidden).toBe(true);
      expect(host.querySelector("img")?.src).toContain("opendesign-wordmark.svg");
    }
    expect(getContext).not.toHaveBeenCalled();
  });

  it("keeps the fallback visible when WebGL is unavailable and cleans up on disposal", () => {
    const host = mark();
    const getContext = vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue(null);
    const stop = mountOpenDesignLoading(host);
    disposers.push(stop);
    const image = host.querySelector("img")!;
    Object.defineProperties(image, { complete: { value: true }, naturalWidth: { value: 1705 } });
    image.dispatchEvent(new Event("load"));
    expect(getContext).toHaveBeenCalledWith("webgl", expect.any(Object));
    expect(image.hidden).toBe(false);
    expect(host.querySelector("canvas")?.hidden).toBe(true);
    stop();
    expect(host.childElementCount).toBe(0);
    getContext.mockClear();
    image.dispatchEvent(new Event("load"));
    expect(getContext).not.toHaveBeenCalled();
  });

  it("rebrands the player's shared asset/buffering/transition mark and stops it while hidden", async () => {
    const player = document.createElement("div");
    const shadow = player.attachShadow({ mode: "open" });
    shadow.innerHTML = '<div class="hfp-shader-loader"><div class="hfp-shader-loader-mark"><svg><path /></svg></div><div role="status">Preparing scene transitions</div><div class="hfp-shader-loader-fill" style="transform:scaleX(.4)"></div></div>';
    const overlay = shadow.querySelector<HTMLElement>(".hfp-shader-loader")!;
    const host = shadow.querySelector<HTMLElement>(".hfp-shader-loader-mark")!;
    const stop = brandPlayerLoading(player);
    disposers.push(stop);
    expect(shadow.querySelector("svg")).toBeNull();
    expect(host.childElementCount).toBe(0);
    overlay.classList.add("hfp-visible");
    await flush();
    expect(host.querySelector("img")).not.toBeNull();
    expect(shadow.querySelector('[role="status"]')?.textContent).toBe("Preparing scene transitions");
    expect(shadow.querySelector<HTMLElement>(".hfp-shader-loader-fill")?.style.transform).toBe("scaleX(.4)");
    overlay.classList.replace("hfp-visible", "hfp-hiding");
    await flush();
    expect(host.querySelector("canvas")).not.toBeNull();
    overlay.classList.remove("hfp-hiding");
    await flush();
    expect(host.childElementCount).toBe(0);
    stop();
    overlay.classList.add("hfp-visible");
    await flush();
    expect(host.childElementCount).toBe(0);
  });
});
