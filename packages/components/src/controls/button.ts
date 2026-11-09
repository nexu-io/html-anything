import { type Icon, icon } from "../studio/icons.js";
export interface ButtonOptions {
  label: string;
  icon?: Icon;
  iconOnly?: boolean;
  detail?: string;
  variant?: "ghost" | "soft" | "tab" | "item" | "card";
  primary?: boolean;
  fullWidth?: boolean;
  selected?: boolean;
  compact?: boolean;
  disabled?: boolean;
  onClick?: () => void;
}
/** Product atom: callers own behavior, this module owns BEM classes and presentation. */
export function button(document: Document, options: ButtonOptions): HTMLButtonElement {
  const element = document.createElement("button");
  element.type = "button";
  setButton(element, options);
  return element;
}
/** Controlled props update the same focusable element; leaf content has no independent lifecycle. */
export function setButton(element: HTMLButtonElement, options: ButtonOptions): void {
  const document = element.ownerDocument;
  const external = [...element.classList].filter((name) => !name.startsWith("om-button"));
  element.className = ["om-button", ...external].join(" ");
  if (options.primary) element.classList.add("om-button--primary");
  if (options.selected) element.classList.add("om-button--selected");
  if (options.fullWidth) element.classList.add("om-button--wide");
  if (options.variant) element.classList.add(`om-button--${options.variant}`);
  if (options.compact) element.classList.add("om-button--compact");
  if (options.iconOnly) element.classList.add("om-button--icon");
  element.setAttribute("aria-label", options.label);
  if (options.selected !== undefined) element.setAttribute("aria-pressed", String(options.selected));
  else element.removeAttribute("aria-pressed");
  if (options.detail) element.setAttribute("aria-description", options.detail);
  else element.removeAttribute("aria-description");
  element.title = options.iconOnly ? options.label : "";
  element.disabled = options.disabled ?? false;
  element.onclick = options.onClick ?? null;
  const label = document.createElement("span");
  label.className = options.iconOnly ? "om-button__label om-button__label--hidden" : "om-button__label";
  label.textContent = options.label;
  if (options.detail) {
    const detail = document.createElement("span");
    detail.className = "om-button__detail";
    detail.textContent = options.detail;
    label.append(detail);
  }
  element.replaceChildren(...(options.icon ? [icon(document, options.icon), label] : [label]));
}
