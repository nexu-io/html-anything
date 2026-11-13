// @vitest-environment happy-dom
import React, { act } from "react";
import { afterEach, expect, it } from "vitest";
import { StudioHostContext } from "../motion/StudioHost";
import { I18nProvider } from "../i18n/I18n";
import { usePlayerStore } from "../player";
import { cleanupMounted, mountHost } from "./ui/mountHost.testHelpers";
import { TimelineToolPicker } from "./TimelineToolPicker";

afterEach(() => {
  cleanupMounted();
  usePlayerStore.setState({ activeTool: "select" });
});

it.each(["zh-CN", "en"] as const)("exposes both tools and keeps selection in sync in %s", (locale) => {
  usePlayerStore.setState({ activeTool: "select" });
  const host = mountHost(
    <I18nProvider initialLocale={locale}>
      <StudioHostContext.Provider value={{ mvpEditor: true }}>
        <TimelineToolPicker />
      </StudioHostContext.Provider>
    </I18nProvider>,
  );
  const buttons = [...host.querySelectorAll("button")];
  expect(buttons.map((button) => button.getAttribute("aria-label"))).toEqual(
    locale === "zh-CN" ? ["选择", "刀片工具"] : ["Select", "Blade tool"],
  );
  expect(host.querySelector('[aria-haspopup="menu"]')).toBeNull();
  act(() => buttons[1].click());
  expect(usePlayerStore.getState().activeTool).toBe("razor");
  expect(buttons.map((button) => button.getAttribute("aria-pressed"))).toEqual(["false", "true"]);
  act(() => usePlayerStore.getState().setActiveTool("select"));
  expect(buttons.map((button) => button.getAttribute("aria-pressed"))).toEqual(["true", "false"]);
});


it("explains blade clicks and displays both blade and selection shortcuts", async () => {
  const host = mountHost(<StudioHostContext.Provider value={{ mvpEditor: true }}><TimelineToolPicker /></StudioHostContext.Provider>);
  act(() => host.querySelector<HTMLButtonElement>('[aria-label="Blade tool"]')!.focus());
  await act(async () => { await new Promise(resolve => setTimeout(resolve, 0)); });
  const text = document.querySelector('[role="tooltip"]')?.textContent;
  expect(text).toContain("Blade tool (B)");
  expect(text).toContain("Blade (B): click a clip to cut at the pointer.");
  expect(text).toContain("Split (S): cut the selected clip at the playhead immediately.");
  expect(text).toContain("(V)");
});
