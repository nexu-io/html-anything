// @vitest-environment happy-dom

import React, { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { FontFamilyField } from "./propertyPanelFont";
import { sortFontOptions } from "./propertyPanelHelpers";

let previewDocument: Document | null = null;
vi.mock("../../contexts/StudioContext", () => ({ useStudioShellContextOptional: () => ({ previewIframeRef: { current: { contentDocument: previewDocument } } }) }));

vi.mock("./propertyPanelHelpers", async (importOriginal) => {
  const actual = await importOriginal<typeof import("./propertyPanelHelpers")>();
  return {
    ...actual,
    sortFontOptions: vi.fn(actual.sortFontOptions),
    uniqueFontFamilies: vi.fn(actual.uniqueFontFamilies),
  };
});

(globalThis as unknown as { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

// Font APIs and browser decoding are stubbed; no test reaches the network.
beforeEach(() => {
  previewDocument = null;
  vi.stubGlobal("FontFace", class {
    load = vi.fn(async () => this);
  });
  Object.defineProperty(document, "fonts", { configurable: true, value: { add: vi.fn(), [Symbol.iterator]: function* () { yield { family: "Outer UI Font" }; } } });
  vi.stubGlobal(
    "fetch",
    vi.fn(async (url: string) => ({
      ok: true,
      json: async () => ({ fonts: url.includes("google") ? ["Google Only"] : ["Arial", "Menlo"] }),
    })),
  );
});

afterEach(() => {
  document.body.innerHTML = "";
  document.head.innerHTML = "";
  vi.unstubAllGlobals();
});

describe("FontFamilyField flat trigger", () => {
  it("renders as a label/value row with a trailing dropdown caret, no boxed border", () => {
    const host = document.createElement("div");
    document.body.append(host);
    const root = createRoot(host);
    act(() => {
      root.render(<FontFamilyField flat value="Georgia" importedFonts={[]} onCommit={vi.fn()} />);
    });
    const trigger = host.querySelector<HTMLButtonElement>('[data-flat-font-trigger="true"]');
    expect(trigger).not.toBeNull();
    expect(trigger?.className).not.toContain("border-neutral-800");
    expect(host.textContent).toContain("Georgia");
    act(() => root.unmount());
  });
});

describe("FontFamilyField font list", () => {
  it("builds the list only while the dropdown is open", async () => {
    vi.mocked(sortFontOptions).mockClear();
    const host = document.createElement("div");
    document.body.append(host);
    const root = createRoot(host);
    const render = (value: string) =>
      root.render(<FontFamilyField flat value={value} importedFonts={[]} onCommit={vi.fn()} />);
    try {
      await act(async () => render("Arial"));
      // The value changes while the dropdown is closed, as during a drag.
      await act(async () => render("Georgia"));
      expect(sortFontOptions).not.toHaveBeenCalled();

      const trigger = host.querySelector<HTMLButtonElement>('[data-flat-font-trigger="true"]');
      await act(async () => trigger?.click());
      await act(async () => new Promise((resolve) => setTimeout(resolve, 10)));
      expect(sortFontOptions).toHaveBeenCalled();
      expect(document.body.textContent).toContain("Menlo");
      expect(host.querySelector('[role="combobox"]')).toBeNull();
      expect(document.body.querySelector('[role="combobox"]')).not.toBeNull();
      expect(document.head.querySelector('link[href*="fonts.googleapis.com"]')).toBeNull();
    } finally {
      act(() => root.unmount());
      host.remove();
    }
  });
});

describe("FontFamilyField session font lists", () => {
  const fresh = async () => {
    vi.resetModules();
    const { FontFamilyField, preloadFontLists } = await import("./propertyPanelFont");
    const { uniqueFontFamilies } = await import("./propertyPanelHelpers");
    const loop = await import("./overlayFrameLoop");
    vi.mocked(uniqueFontFamilies).mockClear();
    const host = document.createElement("div");
    document.body.append(host);
    const root = createRoot(host);
    const render = (value: string) =>
      root.render(<FontFamilyField flat value={value} importedFonts={[]} onCommit={vi.fn()} />);
    const toggle = () =>
      host.querySelector<HTMLButtonElement>('[data-flat-font-trigger="true"]')?.click();
    const done = () => {
      act(() => root.unmount());
      host.remove();
      loop.resetOverlayFrameLoopForTests();
    };
    return { uniqueFontFamilies, loop, host, render, toggle, done, preloadFontLists };
  };

  it("preloads once before the field mounts and shows an explicit pending state until the shared list arrives", async () => {
    let complete!: (response: Response) => void;
    vi.mocked(fetch).mockReturnValue(new Promise<Response>(resolve => { complete = resolve; }));
    const t = await fresh();
    try {
      t.preloadFontLists();
      t.preloadFontLists();
      expect(fetch).toHaveBeenCalledTimes(1);
      await act(async () => t.render("Georgia"));
      await act(async () => t.toggle());
      expect(document.querySelector('[aria-busy="true"]')).not.toBeNull();
      expect(document.querySelector('[role="status"]')?.textContent).toContain("Loading fonts…");
      expect(document.body.textContent).not.toContain("No fonts found.");
      expect(document.querySelector('[role="status"] [aria-hidden="true"]')?.children).toHaveLength(5);
      expect(document.querySelector('[role="combobox"]')).toBe(document.activeElement);

      await act(async () => {
        complete(new Response(JSON.stringify({ fonts: ["Arial", "Menlo"] })));
        await new Promise(resolve => setTimeout(resolve, 10));
      });
      expect(document.querySelector('[aria-busy="true"]')).toBeNull();
      expect(document.querySelector('[role="status"]')).toBeNull();
      expect(document.body.textContent).toContain("Menlo");
      await act(async () => t.toggle());
      await act(async () => t.toggle());
      expect(document.body.textContent).toContain("Menlo");
      expect(document.querySelector('[role="status"]')).toBeNull();
      expect(fetch).toHaveBeenCalledTimes(1);
    } finally { t.done(); }
  });

  it("reports HTTP failures and retries in place without hiding the current font", async () => {
    vi.mocked(fetch).mockResolvedValue(new Response(JSON.stringify({ fonts: ["Wrong response"] }), { status: 503 }));
    const t = await fresh();
    try {
      await act(async () => t.render("Georgia"));
      await act(async () => t.toggle());
      expect(document.querySelector('[role="alert"]')?.textContent).toContain("Couldn't load local fonts.");
      expect(document.body.textContent).not.toContain("No fonts found.");
      expect(document.body.textContent).not.toContain("Wrong response");
      expect(document.querySelector('[data-font-option-index="0"]')?.textContent).toContain("Georgia");
      let complete!: (response: Response) => void;
      vi.mocked(fetch).mockReturnValue(new Promise<Response>(resolve => { complete = resolve; }));
      await act(async () => document.querySelector<HTMLButtonElement>('[role="alert"] button')?.click());
      expect(document.querySelector('[role="alert"]')).toBeNull();
      expect(document.querySelector('[role="status"]')?.textContent).toContain("Loading fonts…");
      await act(async () => {
        complete(new Response(JSON.stringify({ fonts: ["Menlo"] })));
        await new Promise(resolve => setTimeout(resolve, 10));
      });
      expect(document.querySelector('[role="status"]')).toBeNull();
      expect(document.body.textContent).toContain("Menlo");
    } finally { t.done(); }
  });

  it("does no list work in a drag's frames when the lists land mid-drag", async () => {
    vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout", "performance", "Date"] });
    const raf = window.requestAnimationFrame;
    window.requestAnimationFrame = (() => 0) as typeof window.requestAnimationFrame;
    const lists = vi.mocked(fetch).getMockImplementation()!;
    vi.mocked(fetch).mockImplementation(async (url) => {
      await new Promise((resolve) => setTimeout(resolve, 200));
      return lists(url);
    });
    const t = await fresh();
    const stopLoop = t.loop.subscribeOverlayFrame(() => undefined);
    try {
      await act(async () => t.render("Georgia"));
      for (let elapsed = 0; elapsed < 600; elapsed += 16) {
        window.dispatchEvent(new Event("pointermove"));
        await act(async () => vi.advanceTimersByTimeAsync(16));
      }
      expect(fetch).toHaveBeenCalledTimes(1);
      expect(t.uniqueFontFamilies).not.toHaveBeenCalled();

      await act(async () => vi.advanceTimersByTimeAsync(500));
      expect(t.uniqueFontFamilies).toHaveBeenCalledTimes(1);
      await act(async () => t.toggle());
      expect(document.body.textContent).toContain("Menlo");
    } finally {
      stopLoop();
      t.done();
      window.requestAnimationFrame = raf;
      vi.useRealTimers();
    }
  });

  it("retries a failed list fetch when the picker opens", async () => {
    vi.mocked(fetch).mockRejectedValueOnce(new Error("offline"));
    const t = await fresh();
    try {
      await act(async () => t.render("Georgia"));
      await act(async () => new Promise((resolve) => setTimeout(resolve, 10)));
      expect(t.uniqueFontFamilies).not.toHaveBeenCalled();

      await act(async () => t.toggle());
      await act(async () => new Promise((resolve) => setTimeout(resolve, 10)));
      expect(fetch).toHaveBeenCalledTimes(2);
      expect(document.body.textContent).toContain("Menlo");
    } finally {
      t.done();
    }
  });
});

describe("FontFamilyField installed fonts", () => {
  it.each([true, false])("uses the server font file without browser font access (available: %s)", async (available) => {
    vi.resetModules();
    const { FontFamilyField } = await import("./propertyPanelFont");
    const { StudioHostContext } = await import("../../motion/StudioHost");
    const loop = await import("./overlayFrameLoop");
    const family = "Hiragino Sans GB";
    vi.mocked(fetch).mockResolvedValue(new Response(JSON.stringify({ fonts: [family] })));
    const onImportFonts = vi.fn(async () => available ? [{
      family, path: `assets/fonts/${family}.ttf`, url: "/font.ttf",
    }] : []);
    const onCommit = vi.fn();
    const host = document.createElement("div");
    document.body.append(host);
    const root = createRoot(host);
    try {
      await act(async () => root.render(
        <StudioHostContext.Provider value={{ mvpEditor: true }}>
          <FontFamilyField flat value="Arial" importedFonts={[]} onImportFonts={onImportFonts} onCommit={onCommit} />
        </StudioHostContext.Provider>,
      ));
      await act(async () => new Promise((resolve) => setTimeout(resolve, 10)));
      await act(async () => host.querySelector<HTMLButtonElement>("[data-flat-font-trigger]")?.click());
      const option = Array.from(document.querySelectorAll<HTMLButtonElement>("[data-font-option-index]"))
        .find((button) => button.textContent?.includes(family));
      expect(option?.textContent).toContain("Local");
      await act(async () => option?.click());
      expect(onImportFonts).toHaveBeenCalledWith(family);
      if (available) {
        expect(onImportFonts).toHaveBeenCalledOnce();
        expect(onCommit).toHaveBeenCalledWith(`"${family}", ui-sans-serif, system-ui, sans-serif`);
      } else {
        expect(onCommit).not.toHaveBeenCalled();
        expect(document.body.textContent).toContain(`Couldn't import "${family}"`);
      }
    } finally {
      act(() => root.unmount());
      loop.resetOverlayFrameLoopForTests();
    }
  });
});

it("lists actual project declarations, imports and installed fonts without remote suggestions or Studio fonts", async () => {
  vi.resetModules();
  const { FontFamilyField } = await import("./propertyPanelFont");
  previewDocument = document.implementation.createHTMLDocument();
  Object.defineProperty(previewDocument, "fonts", { value: {
    [Symbol.iterator]: function* () { yield { family: '"Project Brand"' }; },
    load: vi.fn(async () => [{ family: "Project Brand" }]),
  } });
  const host = document.createElement("div");
  document.body.append(host);
  const root = createRoot(host), commit = vi.fn();
  try {
    await act(async () => root.render(<FontFamilyField flat value="Authored Remote" importedFonts={[{ family: "Imported Brand", path: "brand.ttf", url: "/brand.ttf" }]} onCommit={commit} />));
    await act(async () => new Promise(resolve => setTimeout(resolve, 10)));
    await act(async () => host.querySelector<HTMLButtonElement>("[data-flat-font-trigger]")?.click());
    const text = document.body.textContent;
    for (const family of ["Authored Remote", "Project Brand", "Imported Brand", "Menlo"]) expect(text).toContain(family);
    for (const family of ["Google Only", "Roboto", "system-ui", "Outer UI Font"]) expect(text).not.toContain(family);
    expect(fetch).toHaveBeenCalledTimes(1);
    const option = Array.from(document.querySelectorAll<HTMLButtonElement>("[data-font-option-index]")).find(button => button.textContent?.includes("Project Brand"));
    await act(async () => option?.click());
    expect(commit).toHaveBeenCalledWith('"Project Brand", ui-sans-serif, system-ui, sans-serif');
    expect(document.head.querySelector('link[href*="googleapis"]')).toBeNull();
  } finally { act(() => root.unmount()); }
});

it("keeps the current family when an existing imported font fails to decode", async () => {
  vi.resetModules();
  const { FontFamilyField } = await import("./propertyPanelFont");
  vi.stubGlobal("FontFace", class { load = vi.fn(async () => { throw new Error("Invalid font"); }); });
  const host = document.createElement("div");
  document.body.append(host);
  const root = createRoot(host), commit = vi.fn();
  try {
    await act(async () => root.render(<FontFamilyField flat value="Arial" importedFonts={[{ family: "Broken", path: "broken.ttf", url: "/broken.ttf" }]} onCommit={commit} />));
    await act(async () => host.querySelector<HTMLButtonElement>("[data-flat-font-trigger]")?.click());
    const option = Array.from(document.querySelectorAll<HTMLButtonElement>("[data-font-option-index]")).find(button => button.textContent?.includes("Broken"));
    await act(async () => option?.click());
    expect(commit).not.toHaveBeenCalled();
    expect(document.body.textContent).toContain('Couldn\'t load "Broken"');
  } finally { act(() => root.unmount()); }
});
