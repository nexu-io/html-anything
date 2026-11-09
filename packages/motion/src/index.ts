import { type Composition, type EditOp, openComposition } from "@hyperframes/sdk";
import type { z } from "zod";
import { animate, animations, describeAnimation } from "./animation.js";
import { appearance, appearanceStyles } from "./appearance.js";
import { type AnimationInput, type Clip, editInput, type NativeValues, patchInput } from "./contract.js";

function audioMaximum(attributes: Readonly<Record<string, string | undefined>>): number | null {
  const duration = Number(attributes["data-source-duration"]);
  return Number.isFinite(duration) &&
    duration > 0 &&
    attributes["data-media-start"] === "0" &&
    attributes["data-playback-rate"] === "1" &&
    attributes["data-link"] === undefined
    ? duration
    : null;
}

export * from "./contract.js";
/** Native SDK edits source only. Product persistence/revision stays with workspace. */
export class Motion {
  private constructor(private composition: Composition) {}
  static async open(html: string) {
    return new Motion(await openComposition(html, { history: false }));
  }
  get clips(): Clip[] {
    const number = (value: string | undefined) => {
      if (value === undefined || !value.trim()) return null;
      const n = Number(value);
      return Number.isFinite(n) ? n : null;
    };
    const elements = this.composition.getElements(),
      parsed = animations(this.composition);
    return elements.map((e) => ({
      id: e.scopedId,
      parent:
        elements.find((parent) => parent.children.some((child) => child.scopedId === e.scopedId))?.scopedId ?? null,
      appearance: appearance(e.inlineStyles),
      animations: parsed
        .filter((a) => e.animationIds.includes(a.id))
        .map((animation) => ({
          ...describeAnimation(animation),
          ...(animation.targetSelector !== `[data-hf-id="${e.id}"]`
            ? { reason: "该动画使用复杂选择器，当前只读" }
            : {}),
        })),
      animationReason:
        e.tag === "audio"
          ? "音频动画需由独立媒体契约管理"
          : e.scopedId.includes("/") || e.attributes["data-composition-id"] !== undefined
            ? "请选择当前合成中的内容图层"
            : parsed.some((a) => a.hasUnresolvedSelector || a.hasPartialSelector)
              ? "动态选择器无法建立动画归属"
              : (() => {
                  const can = this.composition.can({
                    type: "addGsapTween",
                    target: e.scopedId,
                    tween: { method: "to", duration: 1, properties: { opacity: 1 } },
                  });
                  return can.ok ? null : can.message;
                })(),
      tag: e.tag,
      ...(["img", "audio"].includes(e.tag)
        ? {
            media: {
              kind: e.tag === "audio" ? ("audio" as const) : ("image" as const),
              src: e.attributes.src ?? "",
              maximum: e.tag === "audio" ? audioMaximum(e.attributes) : null,
            },
          }
        : {}),
      text: e.children.length || ["img", "audio"].includes(e.tag) ? null : e.text,
      start: number(e.attributes["data-start"]),
      duration: number(e.attributes["data-duration"]),
      composition: e.attributes["data-composition-id"] !== undefined,
      fontSize: /^-?\d+(?:\.\d+)?px$/.test(e.inlineStyles.fontSize ?? "")
        ? Number.parseFloat(e.inlineStyles.fontSize ?? "")
        : null,
    }));
  }
  animate(input: AnimationInput): string {
    if (this.composition.getElement(input.id)?.tag === "audio") throw Error("音频动画需由独立媒体契约管理");
    return animate(this.composition, input);
  }
  patch(id: string, request: NativeValues): string {
    const input = patchInput.parse({ html: "validation", id, ...request });
    const target = this.composition.getElement(id);
    if (!target) throw new Error("native element is missing");
    if (["img", "audio"].includes(target.tag) && (input.text !== undefined || input.fontSize !== undefined))
      throw new Error("媒体不是文本图层");
    if (target.tag === "audio" && input.appearance !== undefined) throw new Error("音频不具备视觉外观");
    if (input.start !== undefined || input.duration !== undefined) {
      if (target.attributes["data-composition-id"] !== undefined) throw new Error("合成时长需由独立元数据契约管理");
      const start = input.start ?? Number(target.attributes["data-start"] ?? 0),
        duration = input.duration ?? Number(target.attributes["data-duration"]);
      const end = Number(
        this.composition.getElements().find((e) => e.attributes["data-composition-id"] !== undefined)?.attributes[
          "data-duration"
        ],
      );
      if (
        !Number.isFinite(start) ||
        !Number.isFinite(duration) ||
        duration <= 0 ||
        !Number.isFinite(end) ||
        start + duration > end + 1e-8
      )
        throw new Error("片段超出合成时长");
      if (target.tag === "audio") {
        const maximum = audioMaximum(target.attributes);
        if (maximum === null || duration > maximum + 1e-8)
          throw new Error("音频窗口只支持已知源长度、原速与零入点的独立片段");
      }
      const related = animations(this.composition).filter((a) => target.animationIds.includes(a.id));
      if (
        related.some(
          (a) =>
            typeof a.position !== "number" ||
            a.implicitPosition ||
            !Number.isFinite(a.duration) ||
            a.global ||
            !!a.arcPath ||
            !!a.provenance ||
            a.hasPartialSelector ||
            a.hasUnresolvedSelector ||
            a.hasUnresolvedKeyframes ||
            Object.keys(a.extras ?? {}).length,
        )
      )
        throw new Error("相对或动态动画的片段时序不可安全重排");
    }
    const authored = input.appearance ? appearanceStyles(input.appearance, target.inlineStyles) : {};
    const operations: EditOp[] = [
      ...(Object.keys(authored).length ? [{ type: "setStyle" as const, target: id, styles: authored }] : []),
      ...(input.fontSize === undefined
        ? []
        : [{ type: "setStyle" as const, target: id, styles: { fontSize: `${input.fontSize}px` } }]),
      ...(input.text === undefined ? [] : [{ type: "setText" as const, target: id, value: input.text }]),
      ...(input.start === undefined && input.duration === undefined
        ? []
        : [{ type: "setTiming" as const, target: id, start: input.start, duration: input.duration }]),
    ];
    // Validate before applying the batch; a rejected operation never partially edits the source.
    for (const op of operations) {
      const result = this.composition.can(op);
      if (!result.ok) throw new Error(result.message);
    }
    this.composition.batch(() => {
      for (const op of operations) this.composition.dispatch(op);
    });
    return this.composition.serialize({ stripRuntime: true });
  }
  edit(input: z.infer<typeof editInput>): string {
    if (
      input.action === "addText" &&
      (!Number.isFinite(input.fontSize) || input.fontSize <= 0 || input.fontSize > 4096)
    )
      throw new Error("invalid native font size");
    editInput.parse(input);
    const before = new Set(this.composition.getElements().map((e) => e.scopedId));
    let operation: EditOp;
    if (input.action === "remove") {
      const target = this.composition.getElement(input.id);
      if (!target || target.attributes["data-composition-id"] !== undefined)
        throw new Error("only a content element can be removed");
      operation = { type: "removeElement", target: input.id };
    } else {
      const root = this.composition.getElements().find((e) => e.attributes["data-composition-id"] !== undefined);
      if (!root) throw new Error("native composition is missing");
      let html: string;
      if (input.action === "addText") {
        const text = input.text.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
        html = `<p data-start="0" data-duration="3">${text}</p>`;
      } else {
        const end = Number(root.attributes["data-duration"]);
        if (!Number.isFinite(end) || end <= 0) throw new Error("媒体插入需要数值合成时长");
        html =
          input.action === "addImage"
            ? `<img crossorigin="anonymous" src="${input.src}" width="${input.width}" height="${input.height}" data-start="0" data-duration="${Math.min(3, end)}">`
            : `<audio src="${input.src}" preload="auto" crossorigin="anonymous" data-start="0" data-duration="${Math.min(input.duration, end)}" data-source-duration="${input.duration}" data-media-start="0" data-playback-rate="1"></audio>`;
      }
      operation = { type: "addElement", parent: root.scopedId, index: root.children.length, html };
    }
    const allowed = this.composition.can(operation);
    if (!allowed.ok) throw new Error(allowed.message);
    this.composition.dispatch(operation);
    if (input.action === "addText") {
      const added = this.composition.getElements().find((e) => !before.has(e.scopedId));
      if (!added) throw new Error("inserted native element is missing");
      this.composition.dispatch({
        type: "setStyle",
        target: added.scopedId,
        styles: { fontSize: `${input.fontSize}px` },
      });
    }
    return this.composition.serialize({ stripRuntime: true });
  }
  dispose() {
    this.composition.dispose();
  }
}
