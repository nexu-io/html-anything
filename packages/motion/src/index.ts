import { type Composition, type EditOp, openComposition } from "@hyperframes/sdk";
import type { z } from "zod";
import { type AnimationInput, type Clip, editInput, type NativeValues, patchInput } from "./contract.js";
import { animate, animations, describeAnimation } from "./editing/animation.js";
import { appearance, appearanceStyles } from "./editing/appearance.js";
import { audioState, numeric } from "./editing/audio.js";
import { describeLinks, editLinks, linkedPatches } from "./editing/links.js";

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
    const clips: Clip[] = elements.map((e) => ({
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
              maximum:
                e.tag === "audio"
                  ? (() => {
                      const state = audioState(
                        e.attributes,
                        e.animationIds.length > 0 ||
                          parsed.some((a) => a.hasUnresolvedSelector || a.hasPartialSelector),
                      );
                      return state.reason
                        ? null
                        : ((state.sourceDuration ?? 0) - (state.inPoint ?? 0)) / (state.rate ?? 1);
                    })()
                  : null,
              ...(e.tag === "audio"
                ? {
                    audio: audioState(
                      e.attributes,
                      e.animationIds.length > 0 || parsed.some((a) => a.hasUnresolvedSelector || a.hasPartialSelector),
                    ),
                  }
                : {}),
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
      fontFamily: (() => {
        const value = e.inlineStyles.fontFamily;
        if (!value) return null;
        try {
          return value.startsWith('"')
            ? (JSON.parse(value) as string)
            : /^[\p{L}\p{N} _-]+$/u.test(value)
              ? value
              : null;
        } catch {
          return null;
        }
      })(),
    }));
    return describeLinks(
      clips,
      (id) => this.composition.getElement(id)?.attributes["data-link"],
      parsed.some((a) => a.hasUnresolvedSelector || a.hasPartialSelector),
    );
  }
  animate(input: AnimationInput): string {
    if (this.clips.find((c) => c.id === input.id)?.link) throw Error("链接媒体的动画需先解除链接");
    if (this.composition.getElement(input.id)?.tag === "audio") throw Error("音频动画需由独立媒体契约管理");
    return animate(this.composition, input);
  }
  patch(id: string, request: NativeValues): string {
    patchInput.parse({ html: "validation", id, ...request });
    const operations = linkedPatches(this.clips, id, request).flatMap((patch) =>
      this.patchOperations(patch.id, patch.values),
    );
    return this.applyOperations(operations);
  }
  private patchOperations(id: string, request: NativeValues): EditOp[] {
    const input = patchInput.parse({ html: "validation", id, ...request });
    const target = this.composition.getElement(id);
    if (!target) throw new Error("native element is missing");
    if (
      ["img", "audio"].includes(target.tag) &&
      (input.text !== undefined || input.fontSize !== undefined || input.fontFamily !== undefined)
    )
      throw new Error("媒体不是文本图层");
    if (target.tag === "audio" && input.appearance !== undefined) throw new Error("音频不具备视觉外观");
    const related = animations(this.composition),
      audio =
        target.tag === "audio"
          ? audioState(
              target.attributes,
              target.animationIds.length > 0 || related.some((a) => a.hasUnresolvedSelector || a.hasPartialSelector),
            )
          : null;
    if (input.audio && !audio) throw Error("请选择独立音频片段");
    if (audio && (input.audio || input.start !== undefined || input.duration !== undefined)) {
      if (audio.reason) throw Error(audio.reason);
      const inPoint = input.audio?.inPoint ?? audio.inPoint,
        duration = input.duration ?? numeric(target.attributes["data-duration"]),
        rate = input.audio?.rate ?? audio.rate;
      if (
        inPoint === null ||
        duration === null ||
        audio.sourceDuration === null ||
        rate === null ||
        inPoint + duration * rate > audio.sourceDuration + 1e-8
      )
        throw Error("音频窗口超出源素材时长");
    }
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
      ...(input.fontFamily === undefined
        ? []
        : [
            {
              type: "setStyle" as const,
              target: id,
              styles: {
                fontFamily:
                  input.fontFamily === null ? null : JSON.stringify(input.fontFamily).replaceAll("<", "\\3c "),
              },
            },
          ]),
      ...(input.text === undefined ? [] : [{ type: "setText" as const, target: id, value: input.text }]),
      ...(input.audio?.inPoint === undefined
        ? []
        : [
            { type: "setAttribute" as const, target: id, name: "data-media-start", value: String(input.audio.inPoint) },
          ]),
      ...(input.audio?.rate === undefined
        ? []
        : [{ type: "setAttribute" as const, target: id, name: "data-playback-rate", value: String(input.audio.rate) }]),
      ...(input.audio?.volume === undefined
        ? []
        : [{ type: "setAttribute" as const, target: id, name: "data-volume", value: String(input.audio.volume) }]),
      ...(input.audio?.muted === undefined
        ? []
        : [{ type: "setAttribute" as const, target: id, name: "muted", value: input.audio.muted ? "" : null }]),
      ...(input.start === undefined && input.duration === undefined
        ? []
        : [{ type: "setTiming" as const, target: id, start: input.start, duration: input.duration }]),
    ];
    return operations;
  }
  private applyOperations(operations: EditOp[]): string {
    // Validate the complete group before any source mutation.
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
    if (input.action === "link" || input.action === "unlink" || input.action === "remove")
      return this.applyOperations(
        editLinks(
          this.clips,
          input,
          this.composition
            .getElements()
            .flatMap((e) => [
              e.attributes.id ?? "",
              e.attributes["data-link"] ?? "",
              e.attributes["data-sync-origin"] ?? "",
            ]),
        ),
      );
    const before = new Set(this.composition.getElements().map((e) => e.scopedId));
    let operation: EditOp;
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
