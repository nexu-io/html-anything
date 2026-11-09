export function layout(document: Document, mode: "page" | "row" | "stack" | "columns" | "column"): HTMLDivElement {
  const element = document.createElement("div");
  element.className = `om-layout om-layout--${mode}`;
  return element;
}
export function panel(document: Document, title: string): HTMLElement {
  const element = document.createElement("section"),
    heading = document.createElement("h2");
  element.className = "om-panel";
  element.setAttribute("aria-label", title);
  heading.className = "om-panel__heading";
  heading.textContent = title;
  element.append(heading);
  return element;
}
export function note(document: Document, value: string): HTMLParagraphElement {
  const element = document.createElement("p");
  element.className = "om-copy";
  element.textContent = value;
  return element;
}
export function readout(document: Document, label: string, value: string): HTMLOutputElement {
  const element = document.createElement("output");
  element.className = "om-readout";
  element.setAttribute("aria-label", label);
  element.textContent = value;
  return element;
}
export function previewFrame(document: Document, title: string): HTMLIFrameElement {
  const element = document.createElement("iframe");
  element.className = "om-preview__frame";
  element.title = title;
  return element;
}

export function heading(document: Document, value: string, compact = false): HTMLHeadingElement {
  const element = document.createElement("h1");
  element.className = compact ? "om-heading om-heading--compact" : "om-heading";
  element.textContent = value;
  return element;
}
export function list(document: Document, label: string): HTMLOListElement {
  const element = document.createElement("ol");
  element.className = "om-list";
  element.setAttribute("aria-label", label);
  return element;
}
