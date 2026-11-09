import {
  injectTagsAtHeadStart,
  insertRuntimeTag,
  stripEmbeddedRuntimeScripts,
} from "@hyperframes/core/compiler/html-document";
import { getHyperframeRuntimeScript } from "@hyperframes/core/runtime-script";
import { captureBridge } from "./capture.js";
import { editorBridge } from "./project/bridge.js";

declare const OPEN_MOTION_GSAP: string;
export const gsap = OPEN_MOTION_GSAP;
export const runtime = getHyperframeRuntimeScript();
/** Derived read-only HTML. Never write injected engines back into native source. */
export function preview(html: string, base: string): string {
  const clean = stripEmbeddedRuntimeScripts(html);
  const head = injectTagsAtHeadStart(clean, `<script src="${base}__gsap.js"></script>`);
  const selection = `<script>(${editorBridge.toString()})()</script>`;
  return insertRuntimeTag(
    head + selection,
    `<script data-hyperframes-preview-runtime src="${base}__runtime.js"></script>`,
  );
}

/** Offline capture uses the same native runtime with its explicit export seek mode. */
export function capture(html: string, base: string, fps: { num: number; den: number }): string {
  const clean = stripEmbeddedRuntimeScripts(html),
    config = {
      mode: "preview-phase",
      diagnostics: false,
      step: 1 / 120,
      offsetFraction: 0.5,
      fps: fps.num / fps.den,
      fpsSource: "render-config",
      owner: "runtime",
    },
    head = injectTagsAtHeadStart(
      clean,
      `<script>globalThis.__HF_RENDER_CAPTURE_MODE=true;globalThis.__HF_EXPORT_RENDER_SEEK_CONFIG=${JSON.stringify(config)};</script><script src="${base}__gsap.js"></script>`,
    );
  const runtime = insertRuntimeTag(head, `<script src="${base}__runtime.js"></script>`);
  return `${runtime}<script>(${captureBridge.toString()})()</script>`;
}
