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

it.each(["zh-CN", "en"] as const)("keeps blade in the secondary menu with shortcuts in %s", async (locale) => {
  usePlayerStore.setState({ activeTool: "select" });
  const host = mountHost(
    <I18nProvider initialLocale={locale}>
      <StudioHostContext.Provider value={{ mvpEditor: true }}>
        <TimelineToolPicker />
      </StudioHostContext.Provider>
    </I18nProvider>,
  );
  expect(host.querySelectorAll("button")).toHaveLength(1);
  const trigger = host.querySelector<HTMLButtonElement>('[aria-haspopup="menu"]')!;
  expect(trigger).not.toBeNull();
  await act(async () => { trigger.click(); });
  const items = [...document.querySelectorAll<HTMLElement>('[role="menuitem"]')];
  expect(items).toHaveLength(2);
  expect(items[0].textContent).toContain("V");
  expect(items[1].textContent).toContain("B");
  expect(items[1].textContent).toContain(locale === "zh-CN" ? "刀片工具" : "Blade tool");
  await act(async () => { items[1].click(); });
  expect(usePlayerStore.getState().activeTool).toBe("razor");
  expect(trigger.getAttribute("aria-label")).toContain(locale === "zh-CN" ? "刀片工具" : "Blade tool");
  act(() => usePlayerStore.getState().setActiveTool("select"));
  expect(trigger.getAttribute("aria-label")).toContain(locale === "zh-CN" ? "选择" : "Select");
});
