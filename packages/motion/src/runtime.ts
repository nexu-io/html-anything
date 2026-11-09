import {
  injectTagsAtHeadStart,
  insertRuntimeTag,
  stripEmbeddedRuntimeScripts,
} from "@hyperframes/core/compiler/html-document";
import { getHyperframeRuntimeScript } from "@hyperframes/core/runtime-script";

import { editorBridge } from "./bridge.js";

declare const OPEN_MOTION_GSAP: string;
export const gsap = OPEN_MOTION_GSAP;
export const runtime = getHyperframeRuntimeScript();
/** Derived read-only HTML. Never write injected engines back into native source. */
export function preview(html: string): string {
  const clean = stripEmbeddedRuntimeScripts(html);
  const head = injectTagsAtHeadStart(clean, '<script src="__gsap.js"></script>');
  const selection = `<script>(${editorBridge.toString()})()</script>`;
  return insertRuntimeTag(head + selection, '<script data-hyperframes-preview-runtime src="__runtime.js"></script>');
}
