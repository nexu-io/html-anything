// Standalone Studio keeps its saved choice; embed=1 follows the host browser's
// color scheme without persisting it. index.html mirrors this before first paint.
import { useSyncExternalStore } from "react";
import {
  readStudioUiPreferences,
  writeStudioUiPreferences,
  type StudioTheme,
} from "./studioUiPreferences";

export function savedStudioTheme(): StudioTheme {
  return readStudioUiPreferences().theme ?? "light";
}

export function shownStudioTheme(): StudioTheme {
  return document.documentElement.dataset.theme === "paper" ? "light" : "dark";
}

function applyStudioTheme(theme: StudioTheme): void {
  const root = document.documentElement;
  if (theme === "light") root.dataset.theme = "paper";
  else delete root.dataset.theme;
}

export function studioUsesHostTheme(): boolean {
  return new URLSearchParams(location.search).get("embed") === "1";
}

/** Codex synchronizes its theme to the embedded browser's media preference. */
export function bindEmbeddedStudioTheme(): () => void {
  if (!studioUsesHostTheme() || !window.matchMedia) return () => {};
  const preference = window.matchMedia("(prefers-color-scheme: dark)");
  const apply = () => applyStudioTheme(preference.matches ? "dark" : "light");
  apply();
  preference.addEventListener("change", apply);
  return () => preference.removeEventListener("change", apply);
}

export function setStudioTheme(theme: StudioTheme): void {
  writeStudioUiPreferences({ theme });
  applyStudioTheme(theme);
}

function subscribe(listener: () => void): () => void {
  const observer = new MutationObserver(listener);
  observer.observe(document.documentElement, { attributeFilter: ["data-theme"] });
  return () => observer.disconnect();
}

export function useShownStudioTheme(): StudioTheme {
  return useSyncExternalStore(subscribe, shownStudioTheme);
}
