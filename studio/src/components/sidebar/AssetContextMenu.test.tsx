// @vitest-environment happy-dom
import React, { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, expect, it, vi } from "vitest";
import { I18nProvider } from "../../i18n/I18n";
import { StudioHostContext } from "../../motion/StudioHost";
import { ContextMenu } from "./AssetContextMenu";

(globalThis as unknown as { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
let root: Root;
afterEach(() => {
  act(() => root?.unmount());
  document.body.innerHTML = "";
  vi.restoreAllMocks();
});

function mount(x = 100, y = 200, mvpEditor = true) {
  const host = document.createElement("div");
  host.style.overflow = "hidden";
  host.style.containerType = "inline-size";
  document.body.append(host);
  root = createRoot(host);
  const callbacks = { onClose: vi.fn(), onCopy: vi.fn(), onRename: vi.fn(), onDelete: vi.fn() };
  act(() => root.render(
    <I18nProvider initialLocale="zh-CN">
      <StudioHostContext.Provider value={{ mvpEditor }}>
        <ContextMenu x={x} y={y} asset="assets/clip.mp4" {...callbacks} />
      </StudioHostContext.Provider>
    </I18nProvider>,
  ));
  return { host, ...callbacks };
}

function click(label: string) {
  const button = Array.from(document.querySelectorAll("button")).find(el => el.textContent === label);
  expect(button).toBeTruthy();
  act(() => button!.click());
}

it("escapes the clipping panel while retaining locale and MVP menu actions", () => {
  const { host, onClose, onDelete, onRename } = mount();
  const menu = document.querySelector('[role="menu"]')!;
  expect(host.contains(menu)).toBe(false);
  expect(menu.parentElement?.parentElement).toBe(document.body);
  expect(Array.from(menu.querySelectorAll('[role="menuitem"]')).map(el => el.textContent)).toEqual(["重命名", "删除"]);
  click("重命名");
  expect(document.querySelector("input")?.value).toBe("clip.mp4");
  click("取消");
  expect(onDelete).not.toHaveBeenCalled();
  expect(onRename).not.toHaveBeenCalled();
  act(() => document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true })));
  expect(onClose).toHaveBeenCalledOnce();
});

it("deletes an MVP asset once directly from the menu and closes without a confirmation", () => {
  const { onDelete, onClose } = mount();
  click("删除");
  click("删除");
  expect(onDelete).toHaveBeenCalledExactlyOnceWith("assets/clip.mp4");
  expect(onClose).toHaveBeenCalledOnce();
  expect(document.querySelector('[role="menu"]')?.textContent).not.toContain("clip.mp4?");
  expect(document.querySelector('[role="menu"]')?.textContent).not.toContain("取消");
});

it("retains the full editor confirmation and permits cancelling it", () => {
  const { onDelete, onClose } = mount(100, 200, false);
  click("删除");
  expect(document.querySelector('[role="menu"]')?.textContent).toContain("clip.mp4?");
  expect(onDelete).not.toHaveBeenCalled();
  click("取消");
  expect(onDelete).not.toHaveBeenCalled();
  expect(onClose).not.toHaveBeenCalled();
});

it("keeps menus opened at the bottom right inside the viewport", () => {
  vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockReturnValue({ width: 160, height: 60 } as DOMRect);
  mount(window.innerWidth, window.innerHeight);
  const menu = document.querySelector<HTMLElement>('[role="menu"]')!;
  expect(menu.style.left).toBe(`${window.innerWidth - 168}px`);
  expect(menu.style.top).toBe(`${window.innerHeight - 68}px`);
});

it("does not place oversized or offscreen menus above or left of the viewport", () => {
  vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockReturnValue({ width: 2000, height: 2000 } as DOMRect);
  mount(-10, -10);
  const menu = document.querySelector<HTMLElement>('[role="menu"]')!;
  expect(menu.style.left).toBe("8px");
  expect(menu.style.top).toBe("8px");
});
