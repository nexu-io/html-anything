import type { Icon } from "../studio/icons.js";
import { button } from "./button.js";
export function popover(document: Document, trigger: HTMLButtonElement, label: string, manual = false) {
  const element = document.createElement("span"),
    surface = document.createElement("div");
  element.className = "om-popup";
  surface.className = manual ? "om-popup__surface om-popup__surface--tip" : "om-popup__surface";
  surface.id = `popup-${document.defaultView?.crypto.randomUUID()}`;
  surface.setAttribute("aria-label", label);
  surface.popover = manual ? "manual" : "auto";
  trigger.classList.add("om-popup__trigger");
  element.append(trigger, surface);
  if (!manual) {
    trigger.popoverTargetElement = surface;
    trigger.popoverTargetAction = "toggle";
    trigger.setAttribute("aria-haspopup", "menu");
  }
  let opened = false;
  const before = (event: Event) => {
    opened = (event as ToggleEvent).newState === "open";
  };
  surface.addEventListener("beforetoggle", before);
  const close = () => {
    if (opened) surface.hidePopover();
  };
  const toggle = () => trigger.setAttribute("aria-expanded", String(opened));
  surface.addEventListener("toggle", toggle);
  return {
    element,
    surface,
    close,
    isOpen: () => opened,
    dispose() {
      close();
      surface.removeEventListener("toggle", toggle);
      surface.removeEventListener("beforetoggle", before);
      element.remove();
    },
  };
}
export function tooltip(document: Document, trigger: HTMLButtonElement, label: string) {
  const view = popover(document, trigger, label, true);
  view.surface.setAttribute("role", "tooltip");
  view.surface.textContent = label;
  trigger.removeAttribute("title");
  trigger.setAttribute("aria-describedby", view.surface.id);
  const show = () => {
    if (trigger.isConnected && !trigger.disabled && !view.isOpen()) view.surface.showPopover();
  };
  const hide = () => view.close();
  const key = (event: KeyboardEvent) => {
    if (event.key === "Escape") hide();
  };
  trigger.addEventListener("pointerenter", show);
  trigger.addEventListener("pointerleave", hide);
  trigger.addEventListener("focus", show);
  trigger.addEventListener("blur", hide);
  trigger.addEventListener("keydown", key);
  return {
    element: view.element,
    dispose() {
      trigger.removeEventListener("pointerenter", show);
      trigger.removeEventListener("pointerleave", hide);
      trigger.removeEventListener("focus", show);
      trigger.removeEventListener("blur", hide);
      trigger.removeEventListener("keydown", key);
      trigger.removeAttribute("aria-describedby");
      view.dispose();
    },
  };
}
export function menu(
  document: Document,
  options: { label: string; icon?: Icon; actions: { id: string; label: string; icon?: Icon; run(): void }[] },
) {
  const trigger = button(document, {
      label: options.label,
      icon: options.icon ?? "more",
      iconOnly: true,
      variant: "ghost",
    }),
    view = popover(document, trigger, options.label);
  view.surface.setAttribute("role", "menu");
  const controls: HTMLButtonElement[] = [];
  for (const action of options.actions) {
    const control = button(document, {
      label: action.label,
      icon: action.icon,
      variant: "item",
      compact: true,
      onClick: () => {
        view.close();
        action.run();
      },
    });
    control.setAttribute("role", "menuitem");
    controls.push(control);
    view.surface.append(control);
  }
  const toggle = () => {
    if (view.isOpen()) controls.find((c) => !c.disabled)?.focus();
  };
  const key = (event: KeyboardEvent) => {
    const enabled = controls.filter((control) => !control.disabled),
      current = enabled.indexOf(document.activeElement as HTMLButtonElement);
    if (event.key === "Escape") {
      event.preventDefault();
      event.stopPropagation();
      view.close();
      trigger.focus();
    }
    const index =
      event.key === "Home"
        ? 0
        : event.key === "End"
          ? enabled.length - 1
          : event.key === "ArrowDown"
            ? (current + 1) % enabled.length
            : event.key === "ArrowUp"
              ? (current + enabled.length - 1) % enabled.length
              : -1;
    if (index >= 0) {
      event.preventDefault();
      enabled[index]?.focus();
    }
  };
  view.surface.addEventListener("toggle", toggle);
  view.surface.addEventListener("keydown", key);
  return {
    element: view.element,
    trigger,
    update(disabled: boolean) {
      trigger.disabled = disabled;
      for (const control of controls) control.disabled = disabled;
      if (disabled) view.close();
    },
    dispose() {
      view.surface.removeEventListener("toggle", toggle);
      view.surface.removeEventListener("keydown", key);
      view.dispose();
    },
  };
}
