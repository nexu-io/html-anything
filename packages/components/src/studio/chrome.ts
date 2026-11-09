function box(document: Document, className: string) {
  const element = document.createElement("div");
  element.className = className;
  return element;
}
export function railLayout(document: Document) {
  document.body.classList.add("om-document");
  const element = box(document, "om-shell"),
    rail = box(document, "om-shell__rail"),
    body = box(document, "om-shell__body");
  element.append(rail, body);
  return { element, rail, body };
}
export function splitLayout(document: Document) {
  const element = box(document, "om-split"),
    start = box(document, "om-split__start"),
    end = box(document, "om-split__end");
  element.append(start, end);
  return { element, start, end };
}
export function panelGrid(document: Document) {
  const element = box(document, "om-grid"),
    leading = box(document, "om-grid__leading"),
    body = box(document, "om-grid__body"),
    trailing = box(document, "om-grid__trailing"),
    footer = box(document, "om-grid__footer");
  element.append(leading, body, trailing, footer);
  return { element, leading, body, trailing, footer };
}
export function slot(
  document: Document,
  mode:
    | "stack"
    | "toolbar"
    | "fill"
    | "stage"
    | "scroll"
    | "title"
    | "spread"
    | "header"
    | "content"
    | "footer"
    | "editorbar"
    | "player"
    | "properties"
    | "pair",
) {
  return box(document, `om-slot om-slot--${mode}`);
}
