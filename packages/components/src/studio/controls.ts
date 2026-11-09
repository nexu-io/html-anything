import { type Icon, icon } from "./icons.js";

function part(document: Document, name: string, text?: string) {
  const element = document.createElement("div");
  element.className = name;
  if (text !== undefined) element.textContent = text;
  return element;
}
export function pane(document: Document, label: string, symbol: Icon) {
  const element = part(document, "om-pane"),
    header = part(document, "om-pane__header"),
    body = part(document, "om-pane__body"),
    actions = part(document, "om-pane__actions"),
    title = part(document, "om-pane__title", label);
  header.append(icon(document, symbol), title, actions);
  element.append(header, body);
  return { element, header, body, actions };
}
export function brand(document: Document, name: string) {
  const element = part(document, "om-brand"),
    mark = part(document, "om-brand__mark"),
    title = part(document, "om-brand__name", name);
  mark.append(icon(document, "film"));
  element.append(mark, title);
  return element;
}
export function badge(document: Document, label: string, value: string, active = false) {
  const element = document.createElement("output");
  element.className = active ? "om-badge om-badge--active" : "om-badge";
  element.setAttribute("aria-label", label);
  element.textContent = value;
  return element;
}
export function disclosure(document: Document, label: string, opened = false) {
  const element = document.createElement("details"),
    summary = document.createElement("summary"),
    body = part(document, "om-disclosure__body");
  element.className = "om-disclosure";
  element.open = opened;
  summary.className = "om-disclosure__summary";
  summary.append(label, icon(document, "chevron"));
  element.append(summary, body);
  return { element, body };
}
export function bubble(document: Document, options: { author: string; text: string; incoming: boolean }) {
  const element = document.createElement("li"),
    meta = part(document, "om-bubble__meta", options.author),
    text = part(document, "om-bubble__text", options.text);
  element.className = options.incoming ? "om-bubble om-bubble--incoming" : "om-bubble";
  element.append(meta, text);
  return element;
}
export function composer(document: Document) {
  const element = part(document, "om-composer"),
    body = part(document, "om-composer__body"),
    footer = part(document, "om-composer__footer");
  element.append(body, footer);
  return { element, body, footer };
}
export function emptyState(document: Document, options: { title: string; detail: string; icon: Icon }) {
  const element = part(document, "om-empty"),
    mark = part(document, "om-empty__mark"),
    title = part(document, "om-empty__title", options.title),
    detail = part(document, "om-empty__detail", options.detail),
    actions = part(document, "om-empty__actions");
  mark.append(icon(document, options.icon));
  element.append(mark, title, detail, actions);
  return { element, actions };
}
