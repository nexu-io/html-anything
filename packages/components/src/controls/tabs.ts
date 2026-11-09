import type { Icon } from "../studio/icons.js";
import { button, setButton } from "./button.js";
export function tabs(
  document: Document,
  options: { label: string; appearance?: "line" | "pill"; select(id: string): void },
) {
  const element = document.createElement("div"),
    buttons = new Map<string, HTMLButtonElement>();
  element.className = options.appearance === "pill" ? "om-tabs om-tabs--pill" : "om-tabs";
  element.setAttribute("role", "tablist");
  element.setAttribute("aria-label", options.label);
  let items: { id: string; label: string; icon?: Icon; disabled?: boolean }[] = [],
    blocked = false;
  return {
    element,
    update(next: typeof items, selected: string, disabled = false) {
      items = next;
      blocked = disabled;
      for (const [id, control] of buttons)
        if (!items.some((item) => item.id === id)) {
          control.remove();
          buttons.delete(id);
        }
      for (const item of items) {
        let control = buttons.get(item.id);
        if (!control) {
          control = button(document, { label: item.label });
          control.setAttribute("role", "tab");
          control.onkeydown = (event) => {
            const enabled = items.filter((item) => !item.disabled);
            const current = enabled.findIndex((item) => item.id === control?.dataset.tab);
            const index =
              event.key === "Home"
                ? 0
                : event.key === "End"
                  ? enabled.length - 1
                  : event.key === "ArrowRight"
                    ? (current + 1) % enabled.length
                    : event.key === "ArrowLeft"
                      ? (current + enabled.length - 1) % enabled.length
                      : -1;
            if (index >= 0 && !blocked) {
              event.preventDefault();
              const id = enabled[index]?.id;
              if (id) {
                buttons.get(id)?.focus();
                options.select(id);
              }
            }
          };
          buttons.set(item.id, control);
        }
        control.dataset.tab = item.id;
        setButton(control, {
          label: item.label,
          icon: item.icon,
          compact: true,
          variant: "tab",
          selected: item.id === selected,
          disabled: disabled || item.disabled,
          onClick: () => options.select(item.id),
        });
        control.classList.add("om-tabs__item");
        control.classList.toggle("om-tabs__item--active", item.id === selected);
        control.removeAttribute("aria-pressed");
        control.setAttribute("aria-selected", String(item.id === selected));
        control.tabIndex = item.id === selected ? 0 : -1;
        if (element.children[items.indexOf(item)] !== control)
          element.insertBefore(control, element.children[items.indexOf(item)] ?? null);
      }
    },
  };
}
