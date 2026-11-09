export type Theme = "light" | "dark";
/** Attribute-only selection; CSS definitions are owned by theme Less. */
export function setTheme(element: HTMLElement, theme: Theme): void {
  element.setAttribute("data-om-theme", theme);
}
