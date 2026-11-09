import { app, type BrowserWindow } from "electron";

export interface AutomationReceipt {
  enabled: boolean;
  policy: "accessory" | "default";
  shown: boolean;
  focused: boolean;
  visible: boolean;
  focusable: boolean;
}

/** Call synchronously before app readiness; hidden windows alone do not suppress app activation. */
export function prepareAutomation(enabled: boolean): void {
  if (!enabled) return;
  if (process.platform === "darwin") app.setActivationPolicy("accessory");
  app.disableHardwareAcceleration();
}

export function observeAutomation(window: BrowserWindow, enabled: boolean): () => AutomationReceipt {
  let shown = window.isVisible();
  let focused = window.isFocused();
  window.on("show", () => {
    shown = true;
  });
  window.on("focus", () => {
    focused = true;
  });
  return () => {
    const receipt: AutomationReceipt = {
      enabled,
      policy: enabled && process.platform === "darwin" ? "accessory" : "default",
      shown,
      focused,
      visible: window.isVisible(),
      focusable: window.isFocusable(),
    };
    if (enabled && (receipt.shown || receipt.focused || receipt.visible || receipt.focusable))
      throw new Error("automated Electron window became visible or focusable");
    return receipt;
  };
}
