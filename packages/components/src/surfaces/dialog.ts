import { button } from "../controls/button.js";
/** Native modal semantics, inert background and focus containment; callers own content and effects. */
export function dialog(document: Document, label: string, drawer = false) {
  const element = document.createElement("dialog"),
    header = document.createElement("header"),
    title = document.createElement("h2"),
    body = document.createElement("div");
  element.className = drawer ? "om-dialog om-dialog--drawer" : "om-dialog";
  element.id = `dialog-${crypto.randomUUID()}`;
  title.id = `${element.id}-title`;
  title.textContent = label;
  title.className = "om-dialog__title";
  element.setAttribute("aria-labelledby", title.id);
  header.className = "om-dialog__header";
  body.className = "om-dialog__body";
  let trigger: HTMLElement | undefined;
  const close = () => {
    if (element.open) element.close();
  };
  const key = (event: KeyboardEvent) => {
    if (event.key === "Tab" && !event.defaultPrevented) {
      const controls = [
        ...element.querySelectorAll<HTMLElement>("button,input,select,textarea,a[href],summary,[tabindex]"),
      ].filter(
        (control) => control.tabIndex >= 0 && !control.matches(":disabled") && control.getClientRects().length > 0,
      );
      const target = event.shiftKey ? controls.at(-1) : controls[0];
      if (
        !controls.length ||
        document.activeElement === (event.shiftKey ? controls[0] : controls.at(-1)) ||
        !element.contains(document.activeElement)
      ) {
        event.preventDefault();
        target?.focus();
      }
    }
    if (event.key === "Escape" && !event.defaultPrevented) {
      event.preventDefault();
      event.stopPropagation();
      close();
    }
  };
  const closed = () => {
    trigger?.setAttribute("aria-expanded", "false");
    if (trigger?.isConnected) trigger.focus();
  };
  const dismiss = button(document, {
    label: `关闭${label}`,
    icon: "close",
    iconOnly: true,
    variant: "ghost",
    onClick: close,
  });
  header.append(title, dismiss);
  element.append(header, body);
  element.addEventListener("close", closed);
  element.addEventListener("keydown", key);
  return {
    element,
    body,
    close,
    open(from?: HTMLElement) {
      if (element.open) return;
      trigger = from;
      from?.setAttribute("aria-controls", element.id);
      from?.setAttribute("aria-expanded", "true");
      element.showModal();
    },
    dispose() {
      close();
      element.removeEventListener("close", closed);
      element.removeEventListener("keydown", key);
      element.remove();
    },
  };
}
