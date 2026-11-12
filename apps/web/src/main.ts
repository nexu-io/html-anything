import { bootstrap } from "./lib/bootstrap.js";
import { mount } from "./view.js";

const root = document.querySelector<HTMLElement>("#app");
if (!root) throw new Error("web root is required");
export const view = mount(root, {
  ...(await bootstrap(globalThis.openMotion, new URL("./bootstrap.json", import.meta.url))),
  entry: globalThis.location.hash,
});

export { mount };
