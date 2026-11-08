// @vitest-environment happy-dom
import React, { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, expect, it, vi } from "vitest";
import { I18nProvider, type Locale } from "../i18n/I18n";
import { AskAgentModal } from "./AskAgentModal";

globalThis.IS_REACT_ACT_ENVIRONMENT = true;
let root: Root;
afterEach(() => { act(() => root?.unmount()); document.body.innerHTML = ""; });

it.each([
  ["en", "Ask agent to change only this element", "paste them into Codex"],
  ["zh-CN", "让 Agent 只改这个元素", "粘贴回 Codex"],
] as const)("explains the element scope and manual copy flow in %s", (locale: Locale, title, nextStep) => {
  const onSubmit = vi.fn();
  const host = document.body.appendChild(document.createElement("div"));
  root = createRoot(host);
  act(() => root.render(
    <I18nProvider initialLocale={locale}>
      <AskAgentModal selectionLabel="Headline" contextPreview="Source: hero.html" onSubmit={onSubmit} onClose={vi.fn()} />
    </I18nProvider>,
  ));
  expect(host.querySelector('[role="dialog"]')?.getAttribute("aria-label")).toBe(title);
  expect(host.textContent).toContain(nextStep);
  expect(host.textContent).toContain("Headline");
  expect(host.querySelector("pre")?.textContent).toContain("hero.html");
  const copyButton = host.querySelector<HTMLButtonElement>("button:disabled")!;
  expect(copyButton).not.toBeNull();
  const input = host.querySelector("textarea")!;
  act(() => {
    Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, "value")!.set!.call(input, "  Make the title red  ");
    input.dispatchEvent(new Event("input", { bubbles: true }));
  });
  expect(copyButton.disabled).toBe(false);
  act(() => copyButton.click());
  expect(onSubmit).toHaveBeenCalledExactlyOnceWith("Make the title red");
});
