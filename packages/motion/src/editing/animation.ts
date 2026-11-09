import { type GsapAnimation, parseGsapScript } from "@hyperframes/core/gsap-parser";
import { buildDocument, type Composition, type EditOp, escapeHfId } from "@hyperframes/sdk";
import { type Animation, type AnimationInput, animationInput, type Ease, eases, properties } from "../contract.js";
import { retimeWindow } from "./easing.js";
export function animations(composition: Composition) {
  const document = buildDocument(composition.serialize({ stripRuntime: true }));
  return document.gsapScript ? parseGsapScript(document.gsapScript).animations : [];
}
const allowedEase = (value: unknown) => value === undefined || eases.includes(value as Ease);
const numeric = (key: string, value: unknown) =>
  properties.includes(key as (typeof properties)[number]) &&
  typeof value === "number" &&
  Number.isFinite(value) &&
  Math.abs(value) <= 65536 &&
  (key === "opacity" ? value >= 0 && value <= 1 : key === "scale" ? value > 0 && value <= 100 : true);
function literal(value: GsapAnimation) {
  return (
    !value.global &&
    !value.arcPath &&
    !value.provenance &&
    !value.hasPartialSelector &&
    !value.hasUnresolvedSelector &&
    !value.hasUnresolvedKeyframes &&
    !Object.keys(value.extras ?? {}).length &&
    typeof value.position === "number" &&
    !value.implicitPosition &&
    Number.isFinite(value.position) &&
    Number.isFinite(value.duration) &&
    Number(value.duration) > 0
  );
}
function lanes(value: GsapAnimation) {
  const frames = value.keyframes?.keyframes ?? [],
    names = [...new Set(frames.flatMap((f) => Object.keys(f.properties)))];
  return names.map((name) => ({
    name,
    frames: frames
      .filter((f) => Object.hasOwn(f.properties, name))
      .map((f) => ({
        percentage: f.percentage,
        value: Number(f.properties[name]),
        ...((f.ease ?? value.keyframes?.easeEach) ? { ease: (f.ease ?? value.keyframes?.easeEach) as Ease } : {}),
      })),
  }));
}
export function describeAnimation(value: GsapAnimation): Animation {
  const parts = lanes(value),
    frames = value.keyframes?.keyframes ?? [],
    runEase = value.keyframes?.ease ?? value.ease;
  const safe =
    literal(value) &&
    value.method === "to" &&
    value.keyframes?.format === "percentage" &&
    !Object.keys(value.properties).length &&
    !Object.keys(value.fromProperties ?? {}).length &&
    allowedEase(runEase) &&
    allowedEase(value.keyframes.easeEach) &&
    frames.length >= 2 &&
    frames.every((f) => allowedEase(f.ease) && Object.entries(f.properties).every(([k, v]) => numeric(k, v))) &&
    parts.every(
      (p) =>
        p.frames[0]?.percentage === 0 &&
        p.frames.at(-1)?.percentage === 100 &&
        p.frames.every(
          (f, i) => Number.isFinite(f.percentage) && (i === 0 || f.percentage > (p.frames[i - 1]?.percentage ?? 0)),
        ),
    );
  const convertible =
    literal(value) &&
    value.method === "fromTo" &&
    !value.keyframes &&
    typeof value.ease === "string" &&
    allowedEase(value.ease) &&
    Object.keys(value.properties).length > 0 &&
    Object.keys(value.properties).sort().join() ===
      Object.keys(value.fromProperties ?? {})
        .sort()
        .join() &&
    [...Object.entries(value.properties), ...Object.entries(value.fromProperties ?? {})].every(([k, v]) =>
      numeric(k, v),
    );
  const property = parts.length === 1 ? (parts[0]?.name as Animation["property"]) : null;
  return {
    id: value.id,
    property,
    ease: allowedEase(runEase) ? (runEase as Ease | undefined) : undefined,
    convertible,
    separable: safe && parts.length > 1,
    start: Number.isFinite(value.resolvedStart ?? value.position)
      ? Number(value.resolvedStart ?? value.position)
      : null,
    duration: Number.isFinite(value.duration) ? Number(value.duration) : null,
    frames: safe && property ? (parts[0]?.frames ?? []) : [],
    reason:
      safe && property
        ? null
        : convertible
          ? "可转换：显式数值 fromTo 动画"
          : safe
            ? "可拆分：混合属性数值关键帧"
            : "只读：动态、隐式或未支持的原生动画",
  };
}
function windowOf(composition: Composition, id: string, start: number, duration: number) {
  const target = composition.getElement(id),
    a = target?.attributes;
  const clipStart = a?.["data-start"] === undefined ? Number.NaN : Number(a["data-start"]),
    clipDuration = a?.["data-duration"] === undefined ? Number.NaN : Number(a["data-duration"]);
  const rootDuration = Number(
    composition.getElements().find((e) => e.attributes["data-composition-id"] !== undefined)?.attributes[
      "data-duration"
    ],
  );
  if (
    !Number.isFinite(clipStart) ||
    !Number.isFinite(clipDuration) ||
    start < clipStart ||
    start + duration > clipStart + clipDuration + 1e-8
  )
    throw new Error("动画必须位于图层时间范围内");
  if (!Number.isFinite(rootDuration) || start + duration > rootDuration + 1e-8)
    throw new Error("动画必须位于合成时长内");
  return { clipStart, clipEnd: clipStart + clipDuration };
}
function execute(composition: Composition, operations: EditOp[]) {
  for (const operation of operations) {
    const can = composition.can(operation);
    if (!can.ok) throw new Error(can.message);
  }
  const before = composition.serialize({ stripRuntime: true });
  composition.batch(() => {
    for (const op of operations) {
      const previous = composition.serialize({ stripRuntime: true });
      composition.dispatch(op);
      if (previous === composition.serialize({ stripRuntime: true }))
        throw new Error("原生动画没有写入；工程需要显式 GSAP timeline 声明");
    }
  });
  const html = composition.serialize({ stripRuntime: true });
  if (html === before) throw new Error("原生动画没有写入");
  return html;
}
export function animate(composition: Composition, request: AnimationInput): string {
  const input = animationInput.parse(request),
    target = composition.getElement(input.id);
  if (!target || target.attributes["data-composition-id"] !== undefined || input.id.includes("/"))
    throw new Error("请选择当前合成中的内容图层");
  const parsed = animations(composition),
    existing = "animationId" in input ? parsed.find((a) => a.id === input.animationId) : undefined;
  if (parsed.some((a) => a.hasUnresolvedSelector || a.hasPartialSelector))
    throw new Error("动态选择器无法建立动画归属");
  const selector = `[data-hf-id="${escapeHfId(input.id)}"]`;
  if (
    "animationId" in input &&
    input.animationId &&
    (!existing || existing.targetSelector !== selector || !target.animationIds.includes(existing.id))
  )
    throw new Error("动画身份已过期或不支持编辑");
  const description = existing ? describeAnimation(existing) : undefined;
  if (input.action === "convert") {
    if (!existing || !description?.convertible) throw new Error("当前原生动画不能安全转换");
    return execute(composition, [{ type: "convertToKeyframes", animationId: existing.id }]);
  }
  if (input.action === "separate") {
    if (!existing || !description?.separable || description.start === null || description.duration === null)
      throw new Error("当前动画不能安全拆分");
    const parts = lanes(existing);
    if (
      parsed.some(
        (a) =>
          a.id !== existing.id &&
          target.animationIds.includes(a.id) &&
          parts.some(
            (p) =>
              Object.hasOwn(a.properties, p.name) ||
              Object.hasOwn(a.fromProperties ?? {}, p.name) ||
              a.keyframes?.keyframes.some((f) => Object.hasOwn(f.properties, p.name)),
          ),
      )
    )
      throw new Error("同属性存在其他动画，不能安全改变写入顺序");
    const ops: EditOp[] = [
      { type: "removeGsapTween", animationId: existing.id },
      ...parts.map((p) => ({
        type: "addWithKeyframes" as const,
        targetSelector: selector,
        position: description.start as number,
        duration: description.duration as number,
        ease: description.ease ?? "none",
        keyframes: p.frames.map((f) => ({
          percentage: f.percentage,
          properties: { [p.name]: f.value },
          ...(f.ease ? { ease: f.ease } : {}),
        })),
      })),
    ];
    return execute(composition, ops);
  }
  if (description?.reason) throw new Error("动画身份已过期或不支持编辑");
  if (input.action === "remove")
    return execute(composition, [{ type: "removeGsapTween", animationId: input.animationId }]);
  if (input.action === "retime") {
    if (
      !existing ||
      !description ||
      description.start === null ||
      description.duration === null ||
      !description.property
    )
      throw new Error("当前关键帧不可重排");
    if (
      parsed.some(
        (a) =>
          a.id !== existing.id &&
          target.animationIds.includes(a.id) &&
          (a.hasUnresolvedKeyframes ||
            Object.hasOwn(a.properties, description.property as string) ||
            Object.hasOwn(a.fromProperties ?? {}, description.property as string) ||
            a.keyframes?.keyframes.some((f) => Object.hasOwn(f.properties, description.property as string))),
      )
    )
      throw new Error("同属性存在其他动画，不能安全改变写入顺序");
    const index = description.frames.findIndex((f) => f.percentage === input.percentage);
    if (index < 0) throw new Error("关键帧身份已过期");
    const bounds = windowOf(composition, input.id, description.start, description.duration);
    const mapped = retimeWindow({
      ...bounds,
      start: description.start,
      duration: description.duration,
      ease: description.ease,
      percentages: description.frames.map((f) => f.percentage),
      index,
      time: input.time,
    });
    const op: EditOp = {
      type: "replaceWithKeyframes",
      animationId: existing.id,
      targetSelector: selector,
      position: mapped.start,
      duration: mapped.duration,
      ease: description.ease ?? "none",
      keyframes: description.frames.map((f, i) => ({
        percentage: mapped.percentages[i] ?? f.percentage,
        properties: { [description.property as string]: f.value },
        ...(f.ease ? { ease: f.ease } : {}),
      })),
    };
    return execute(composition, [op]);
  }
  windowOf(composition, input.id, input.start, input.duration);
  if (
    input.frames[0]?.percentage !== 0 ||
    input.frames.at(-1)?.percentage !== 100 ||
    input.frames.some((f, i) => i > 0 && f.percentage <= (input.frames[i - 1]?.percentage ?? 0))
  )
    throw new Error("关键帧必须严格递增，且包含 0% 与 100% 端点");
  if (input.frames.some((f) => !numeric(input.property, f.value))) throw new Error("关键帧值超出属性范围");
  if (existing && description?.property !== input.property) throw new Error("属性身份已改变，请重新选择动画");
  if (
    parsed.some(
      (a) =>
        a.id !== existing?.id &&
        target.animationIds.includes(a.id) &&
        (a.hasUnresolvedKeyframes ||
          Object.hasOwn(a.properties, input.property) ||
          Object.hasOwn(a.fromProperties ?? {}, input.property) ||
          a.keyframes?.keyframes.some((f) => Object.hasOwn(f.properties, input.property))),
    )
  )
    throw new Error("该属性已由其他动画控制，请编辑原动画");
  const data = {
    targetSelector: selector,
    position: input.start,
    duration: input.duration,
    ease: input.ease ?? description?.ease ?? "none",
    keyframes: input.frames.map((f) => ({
      percentage: f.percentage,
      properties: { [input.property]: f.value },
      ...(f.ease ? { ease: f.ease } : {}),
    })),
  };
  return execute(composition, [
    existing
      ? { type: "replaceWithKeyframes", animationId: existing.id, ...data }
      : { type: "addWithKeyframes", ...data },
  ]);
}
