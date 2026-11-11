export function field(
  document: Document,
  label: string,
  control: HTMLElement,
  inline = false,
  hiddenLabel = false,
): HTMLLabelElement {
  const element = document.createElement("label"),
    caption = document.createElement("span"),
    check = control.matches('input[type="checkbox"]');
  element.className = inline ? "om-field om-field--inline" : "om-field";
  if (hiddenLabel) element.classList.add("om-field--hidden-label");
  if (check) {
    element.classList.add("om-field--check");
    control.classList.add("om-field__control--check");
  }
  caption.className = hiddenLabel ? "om-field__label om-field__label--hidden" : "om-field__label";
  caption.textContent = label;
  if (control.matches("input,select,textarea")) control.classList.add("om-field__control");
  element.append(...(check ? [control, caption] : [caption, control]));
  return element;
}
export function codeEditor(document: Document): HTMLTextAreaElement {
  const element = document.createElement("textarea");
  element.className = "om-field__control om-field__control--code";
  element.spellcheck = false;
  element.wrap = "off";
  return element;
}

export function composerInput(document: Document): HTMLTextAreaElement {
  const element = document.createElement("textarea");
  element.className = "om-field__control om-field__control--composer";
  return element;
}
