export function numberField(
  document: Document,
  options: {
    label: string;
    min?: number;
    max?: number;
    optional?: boolean;
    unit: string;
    change(value: number | undefined): void;
  },
) {
  const element = document.createElement("div"),
    input = document.createElement("input"),
    unit = document.createElement("span");
  element.className = "om-number";
  input.className = "om-number__input";
  unit.className = "om-number__unit";
  unit.textContent = options.unit;
  input.setAttribute("aria-label", options.label);
  input.type = "number";
  input.step = "any";
  input.required = !options.optional;
  if (options.min !== undefined) input.min = String(options.min);
  if (options.max !== undefined) input.max = String(options.max);
  const valid = () =>
    (!input.value && options.optional) ||
    (!!input.value &&
      Number.isFinite(input.valueAsNumber) &&
      (options.min === undefined || input.valueAsNumber >= options.min) &&
      (options.max === undefined || input.valueAsNumber <= options.max));
  const changed = () => {
    input.setAttribute("aria-invalid", String(!valid()));
    options.change(input.value ? input.valueAsNumber : options.optional ? undefined : Number.NaN);
  };
  input.addEventListener("input", changed);
  input.addEventListener("keydown", (event) => {
    if (!["ArrowUp", "ArrowDown"].includes(event.key) || input.readOnly) return;
    event.preventDefault();
    const direction = event.key === "ArrowUp" ? 1 : -1,
      value = (Number(input.value) || 0) + direction * (event.shiftKey ? 1 : 0.1);
    input.value = String(
      Math.max(options.min ?? -Infinity, Math.min(options.max ?? Infinity, Math.round(value * 1000) / 1000)),
    );
    changed();
  });
  element.append(input, unit);
  return {
    element,
    input,
    value(value: number | undefined, reset = false) {
      const next = value === undefined ? "" : String(value);
      if ((reset || document.activeElement !== input) && input.value !== next) input.value = next;
    },
    validate() {
      if (!valid()) throw new Error(`${options.label}请输入有效数值`);
    },
    readonly(value: boolean) {
      input.readOnly = value;
    },
  };
}
