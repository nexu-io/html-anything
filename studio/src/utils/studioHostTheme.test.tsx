// @vitest-environment happy-dom
import { readFileSync } from "node:fs";
import path from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
import { bindEmbeddedStudioTheme, shownStudioTheme } from "./studioTheme";
import { ThemeToggle } from "../components/ThemeToggle";
import { cleanupMounted, mountHost } from "../components/ui/mountHost.testHelpers";

const KEY = "hf-studio-ui-preferences";
const boot = readFileSync(path.join(__dirname, "../../index.html"), "utf8")
  .match(/<script>([\s\S]*?)<\/script>/)![1]!;
let unbind = () => {};

afterEach(() => {
  unbind();
  cleanupMounted();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  history.replaceState(null, "", "/");
  localStorage.clear();
  delete document.documentElement.dataset.theme;
});

function hostScheme(initial: boolean) {
  const preference = new EventTarget() as MediaQueryList;
  let dark = initial;
  Object.defineProperty(preference, "matches", { get: () => dark });
  vi.spyOn(window, "matchMedia").mockReturnValue(preference);
  return (next: boolean) => {
    dark = next;
    preference.dispatchEvent(new Event("change"));
  };
}

describe("embedded Studio theme before first paint", () => {
  it.each([
    { dark: true, saved: "light", expected: "dark" },
    { dark: false, saved: "dark", expected: "light" },
  ])("follows host $expected despite saved $saved", ({ dark, saved, expected }) => {
    history.replaceState(null, "", "/?embed=1");
    const preferences = JSON.stringify({ theme: saved, audioVolume: 0.4 });
    localStorage.setItem(KEY, preferences);
    vi.spyOn(window, "matchMedia").mockReturnValue({ matches: dark } as MediaQueryList);
    new Function(boot)();
    expect(shownStudioTheme()).toBe(expected);
    expect(localStorage.getItem(KEY)).toBe(preferences);
  });

  it("defaults light without a media-query API, even when storage is unavailable", () => {
    history.replaceState(null, "", "/?embed=1");
    vi.stubGlobal("matchMedia", undefined);
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => { throw new Error("blocked"); });
    new Function(boot)();
    expect(shownStudioTheme()).toBe("light");
  });
});

describe("live embedded host theme", () => {
  it("switches both ways without changing saved preferences and stops when disposed", () => {
    history.replaceState(null, "", "/?embed=1");
    const preferences = JSON.stringify({ theme: "light", audioVolume: 0.4 });
    localStorage.setItem(KEY, preferences);
    const change = hostScheme(true);
    unbind = bindEmbeddedStudioTheme();
    expect(shownStudioTheme()).toBe("dark");
    change(false);
    expect(shownStudioTheme()).toBe("light");
    change(true);
    expect(shownStudioTheme()).toBe("dark");
    expect(localStorage.getItem(KEY)).toBe(preferences);
    unbind();
    change(false);
    expect(shownStudioTheme()).toBe("dark");
  });

  it("leaves standalone Studio's theme and manual toggle alone", () => {
    history.replaceState(null, "", "/?embed=0");
    document.documentElement.dataset.theme = "paper";
    const change = hostScheme(true);
    unbind = bindEmbeddedStudioTheme();
    expect(shownStudioTheme()).toBe("light");
    change(true);
    expect(shownStudioTheme()).toBe("light");
    expect(mountHost(<ThemeToggle />).querySelector("button")).not.toBeNull();
  });

  it("hides the manual override in embedded Studio", () => {
    history.replaceState(null, "", "/?embed=1");
    expect(mountHost(<ThemeToggle />).querySelector("button")).toBeNull();
  });
});
