import { start } from "./lib/start.js";
import type { WebView } from "./view.js";

const root = document.querySelector<HTMLElement>("#app");
if (!root) throw new Error("web root is required");
export let view: WebView | undefined;
export const startup = start(root, {
  url: new URL("./bootstrap.json", import.meta.url),
  injected: globalThis.openMotion,
  entry: globalThis.location.hash,
  mounted: (mounted) => {
    view = mounted;
  },
});

export { mount } from "./view.js";
