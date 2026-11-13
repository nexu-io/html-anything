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

it.each(["zh-CN", "en"] as const)("offers only selection and clears a stale blade mode in %s", async (locale) => {
  usePlayerStore.setState({ activeTool: "razor" });
  const host = mountHost(
    <I18nProvider initialLocale={locale}>
      <StudioHostContext.Provider value={{ mvpEditor: true }}>
        <TimelineToolPicker />
      </StudioHostContext.Provider>
    </I18nProvider>,
  );
  expect(host.querySelectorAll("button")).toHaveLength(1);
  expect(host.querySelector('[aria-haspopup="menu"]')).toBeNull();
  const select = host.querySelector<HTMLButtonElement>("button")!;
  expect(select.getAttribute("aria-label")).toBe(locale === "zh-CN" ? "选择" : "Select");
  expect(usePlayerStore.getState().activeTool).toBe("select");
  await act(async () => { select.click(); });
  expect(document.querySelector('[role="menuitem"]')).toBeNull();
  expect(usePlayerStore.getState().activeTool).toBe("select");
});
