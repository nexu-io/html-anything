import { type Appearance, appearanceInput } from "../contract.js";
export function textLayer(element: {
  tag: string;
  children: readonly { tag: string }[];
  attributes: Readonly<Record<string, string>>;
}) {
  return (
    !["img", "audio", "br"].includes(element.tag) &&
    element.attributes["data-composition-id"] === undefined &&
    element.children.every((child) => child.tag === "br")
  );
}
/** Only losslessly understood authored values are exposed. Unset/expressions remain inherited. */
export function appearance(values: Readonly<Record<string, string>>): Appearance {
  const pixel = (value: string | undefined) =>
    value && /^-?\d+(?:\.\d+)?px$/.test(value) ? Number.parseFloat(value) : undefined;
  const translation = values.translate?.split(/\s+/) ?? [];
  return {
    ...(["start", "end", "left", "center", "right"].includes(values.textAlign ?? "")
      ? { align: values.textAlign as NonNullable<Appearance["align"]> }
      : {}),
    ...(["none", "underline"].includes(values.textDecorationLine ?? "")
      ? { decoration: values.textDecorationLine as NonNullable<Appearance["decoration"]> }
      : {}),
    ...(pixel(translation[0]) === undefined ? {} : { x: pixel(translation[0]) }),
    ...(pixel(translation[1]) === undefined ? {} : { y: pixel(translation[1]) }),
    ...(values.rotate && /^-?\d+(?:\.\d+)?deg$/.test(values.rotate)
      ? { rotation: Number.parseFloat(values.rotate) }
      : {}),
    ...(values.opacity && Number.isFinite(Number(values.opacity)) ? { opacity: Number(values.opacity) } : {}),
    ...(values.color && /^#[0-9a-fA-F]{6}$/.test(values.color) ? { color: values.color } : {}),
  };
}
export function appearanceStyles(input: Appearance, current: Readonly<Record<string, string>>) {
  const value = appearanceInput.parse(input),
    previous = appearance(current),
    result: Record<string, string | null> = {};
  if (value.x !== undefined || value.y !== undefined) {
    if (
      current.translate &&
      (previous.x === undefined || previous.y === undefined) &&
      (value.x === undefined || value.y === undefined)
    )
      throw new Error("未知位移表达式需要同时指定 X 与 Y");
    result.translate = `${value.x ?? previous.x ?? 0}px ${value.y ?? previous.y ?? 0}px`;
  }
  if (value.rotation !== undefined) result.rotate = `${value.rotation}deg`;
  if (value.opacity !== undefined) result.opacity = String(value.opacity);
  if (value.color !== undefined) result.color = value.color;
  if (value.align !== undefined) result.textAlign = value.align;
  if (value.decoration !== undefined) result.textDecorationLine = value.decoration;
  return result;
}
