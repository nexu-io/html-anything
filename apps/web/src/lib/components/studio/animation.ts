import { badge, button, disclosure, field, note, numberField, slot } from "@open-motion/components";
import { type Animation, type AnimationInput, type Clip, eases, properties } from "@open-motion/motion/contract";
import { timeAtProgress } from "@open-motion/motion/protocol";

const labels = { x: "动画 X", y: "动画 Y", rotation: "动画旋转", opacity: "动画不透明度", scale: "动画缩放" };
type Frame = Extract<AnimationInput, { action: "put" }>["frames"][number];
export class AnimationEditor {
  readonly element: HTMLElement;
  private owner = "";
  private clip?: Clip;
  private signature = "";
  private identity = "";
  private changed = false;
  private operation: "put" | "remove" | "convert" | "separate" = "put";
  private conversion: HTMLButtonElement;
  private separation: HTMLButtonElement;
  private runEase: HTMLSelectElement;
  private blocked = true;
  private tracks: HTMLSelectElement;
  private property: HTMLSelectElement;
  private start: ReturnType<typeof numberField>;
  private duration: ReturnType<typeof numberField>;
  private rows: {
    percentage: ReturnType<typeof numberField>;
    value: ReturnType<typeof numberField>;
    ease: HTMLSelectElement;
    remove: HTMLButtonElement;
    seek: HTMLButtonElement;
  }[] = [];
  private host: HTMLElement;
  private message: HTMLOutputElement;
  private save: HTMLButtonElement;
  private remove: HTMLButtonElement;
  private add: HTMLButtonElement;
  private discard: HTMLButtonElement;
  constructor(
    document: Document,
    private actions: { change(): void; apply(): void; seek(time: number): void },
  ) {
    const view = disclosure(document, "关键帧动画"),
      timing = slot(document, "pair"),
      controls = slot(document, "toolbar");
    this.element = document.createElement("section");
    const inset = slot(document, "properties");
    inset.append(view.element);
    this.element.append(inset);
    this.tracks = document.createElement("select");
    this.tracks.setAttribute("aria-label", "动画选择");
    this.property = document.createElement("select");
    this.property.setAttribute("aria-label", "动画属性");
    for (const name of properties) {
      const o = document.createElement("option");
      o.value = name;
      o.textContent = labels[name];
      this.property.append(o);
    }
    this.runEase = document.createElement("select");
    this.runEase.setAttribute("aria-label", "动画整体缓动");
    const inherited = document.createElement("option");
    inherited.value = "";
    inherited.textContent = "原生默认";
    this.runEase.append(inherited);
    for (const name of eases) {
      const option = document.createElement("option");
      option.value = name;
      option.textContent = name;
      this.runEase.append(option);
    }
    const change = () => {
      this.operation = "put";
      this.mark();
    };
    this.runEase.onchange = change;
    this.start = numberField(document, { label: "动画开始秒", unit: "s", min: 0, change });
    this.duration = numberField(document, { label: "动画持续秒", unit: "s", min: 0, change });
    timing.append(
      field(document, "动画开始秒", this.start.element),
      field(document, "动画持续秒", this.duration.element),
    );
    this.message = badge(document, "动画状态", "");
    this.host = slot(document, "stack");
    this.save = button(document, {
      label: "保存动画",
      icon: "save",
      primary: true,
      compact: true,
      onClick: () => {
        this.operation = "put";
        this.mark();
        actions.apply();
      },
    });
    this.remove = button(document, {
      label: "删除动画",
      icon: "close",
      compact: true,
      onClick: () => {
        this.operation = "remove";
        this.mark();
        actions.apply();
      },
    });
    this.add = button(document, { label: "添加关键帧", icon: "plus", compact: true, onClick: () => this.insert() });
    this.discard = button(document, {
      label: "放弃动画草稿",
      compact: true,
      onClick: () => {
        this.changed = false;
        this.operation = "put";
        this.load();
        actions.change();
      },
    });
    this.tracks.onchange = () => {
      this.identity = this.tracks.value;
      this.load();
    };
    this.property.onchange = () => {
      const property = this.property.value;
      this.renderFrames([
        { percentage: 0, value: property === "scale" ? 1 : 0, ease: "none" },
        {
          percentage: 100,
          value:
            property === "x"
              ? 240
              : property === "y"
                ? 120
                : property === "rotation"
                  ? 90
                  : property === "scale"
                    ? 1.5
                    : 1,
          ease: "none",
        },
      ]);
      this.mark();
    };
    this.conversion = button(document, {
      label: "转换原生关键帧",
      compact: true,
      onClick: () => {
        this.operation = "convert";
        this.mark();
        actions.apply();
      },
    });
    this.separation = button(document, {
      label: "拆分属性轨道",
      compact: true,
      onClick: () => {
        this.operation = "separate";
        this.mark();
        actions.apply();
      },
    });
    controls.append(this.conversion, this.separation, this.add, this.save, this.remove, this.discard);
    view.body.append(
      note(document, "数值关键帧作用于图层的绝对时间窗；不同属性可独立成轨，复杂或动态脚本保持只读。"),
      field(document, "动画选择", this.tracks),
      this.message,
      field(document, "动画属性", this.property),
      field(document, "动画整体缓动", this.runEase),
      timing,
      this.host,
      controls,
    );
  }
  get dirty() {
    return this.changed;
  }
  discardDraft() {
    this.changed = false;
    this.operation = "put";
    this.signature = "";
  }
  private mark() {
    this.changed = true;
    this.actions.change();
    this.block(this.blocked);
  }
  private values(): Frame[] {
    return this.rows.map((r) => ({
      percentage: r.percentage.input.valueAsNumber,
      value: r.value.input.valueAsNumber,
      ...(r.ease.value ? { ease: r.ease.value as Frame["ease"] } : {}),
    }));
  }
  private insert() {
    const frames = this.values();
    let index = 0;
    for (let i = 0; i < frames.length - 1; i++)
      if (
        (frames[i + 1]?.percentage ?? 0) - (frames[i]?.percentage ?? 0) >
        (frames[index + 1]?.percentage ?? 0) - (frames[index]?.percentage ?? 0)
      )
        index = i;
    const a = frames[index],
      b = frames[index + 1];
    if (!a || !b) return;
    frames.splice(index + 1, 0, {
      percentage: (a.percentage + b.percentage) / 2,
      value: (a.value + b.value) / 2,
      ease: "none",
    });
    this.renderFrames(frames);
    this.mark();
  }
  private renderFrames(frames: Frame[]) {
    this.host.replaceChildren();
    this.rows = [];
    const document = this.host.ownerDocument;
    frames.forEach((frame, index) => {
      const root = slot(document, "stack"),
        pair = slot(document, "pair"),
        tools = slot(document, "toolbar"),
        change = () => this.mark();
      const percentage = numberField(document, {
          label: `关键帧 ${index + 1} 位置`,
          unit: "%",
          min: 0,
          max: 100,
          change,
        }),
        value = numberField(document, { label: `关键帧 ${index + 1} 值`, unit: "", min: -65536, max: 65536, change });
      percentage.value(frame.percentage);
      value.value(frame.value);
      const ease = document.createElement("select");
      ease.setAttribute("aria-label", `关键帧 ${index + 1} 缓动`);
      const fallback = document.createElement("option");
      fallback.value = "";
      fallback.textContent = "原生默认";
      ease.append(fallback);
      for (const name of eases) {
        const o = document.createElement("option");
        o.value = name;
        o.textContent = name;
        ease.append(o);
      }
      ease.value = frame.ease ?? "";
      ease.onchange = change;
      const seek = button(document, {
        label: `跳到关键帧 ${index + 1}`,
        icon: "eye",
        compact: true,
        onClick: () =>
          this.actions.seek(
            this.start.input.valueAsNumber +
              (timeAtProgress(this.runEase.value as Animation["ease"], percentage.input.valueAsNumber) / 100) *
                this.duration.input.valueAsNumber,
          ),
      });
      const remove = button(document, {
        label: `删除关键帧 ${index + 1}`,
        icon: "close",
        compact: true,
        onClick: () => {
          const next = this.values();
          next.splice(index, 1);
          this.renderFrames(next);
          this.mark();
        },
      });
      pair.append(field(document, "位置", percentage.element), field(document, "值", value.element));
      tools.append(seek, remove);
      root.append(pair, field(document, "缓动", ease), tools);
      this.host.append(root);
      this.rows.push({ percentage, value, ease, seek, remove });
    });
    this.block(this.blocked);
  }
  private get animation(): Animation | undefined {
    return this.clip?.animations.find((a) => a.id === this.identity);
  }
  private load() {
    const animation = this.animation,
      clip = this.clip;
    this.changed = false;
    this.operation = "put";
    this.property.value = animation?.property ?? "opacity";
    this.runEase.value = animation?.ease ?? "none";
    this.start.value(animation?.start ?? clip?.start ?? 0, true);
    this.duration.value(animation?.duration ?? clip?.duration ?? 1, true);
    this.renderFrames(
      animation?.frames.length
        ? animation.frames
        : [
            { percentage: 0, value: 0, ease: "none" },
            { percentage: 100, value: 1, ease: "none" },
          ],
    );
    this.message.value = animation?.reason ?? clip?.animationReason ?? "原生数值关键帧";
    this.block(this.blocked);
  }
  update(owner: string, clip: Clip | undefined, blocked: boolean) {
    const previousProperty = this.owner === owner && this.clip?.id === clip?.id ? this.animation?.property : undefined;
    const signature = JSON.stringify([owner, clip?.id, clip?.animations, clip?.start, clip?.duration]);
    if (this.owner !== owner || this.clip?.id !== clip?.id) {
      this.identity = "";
      this.changed = false;
      this.operation = "put";
    }
    this.owner = owner;
    this.clip = clip;
    if (!this.changed && this.signature !== signature) {
      if (
        !clip?.animations.some((a) => a.id === this.identity && (!previousProperty || a.property === previousProperty))
      )
        this.identity =
          clip?.animations.find((a) => a.property === previousProperty)?.id ?? clip?.animations[0]?.id ?? "";
      this.tracks.replaceChildren();
      const document = this.tracks.ownerDocument,
        newOption = document.createElement("option");
      newOption.value = "";
      newOption.textContent = "新动画";
      this.tracks.append(newOption);
      for (const animation of clip?.animations ?? []) {
        const o = document.createElement("option");
        o.value = animation.id;
        o.textContent = animation.property
          ? `${labels[animation.property]} · ${animation.start === null ? "未知" : animation.start.toFixed(2)}s`
          : animation.id;
        this.tracks.append(o);
      }
      this.tracks.value = this.identity;
      this.load();
      this.signature = signature;
    }
    this.element.hidden = !clip;
    this.block(blocked);
  }
  block(value: boolean) {
    this.blocked = value;
    const blocked = value || !this.clip || !!this.clip.animationReason || !!this.animation?.reason;
    this.tracks.disabled = value || this.changed || !this.clip;
    this.property.disabled = blocked || !!this.identity;
    this.runEase.disabled = blocked;
    this.conversion.disabled = value || this.changed || !this.animation?.convertible;
    this.separation.disabled = value || this.changed || !this.animation?.separable;
    this.start.readonly(blocked);
    this.duration.readonly(blocked);
    this.save.disabled = blocked;
    this.add.disabled = blocked || this.rows.length >= 64;
    this.remove.disabled = blocked || !this.identity;
    this.discard.disabled = value || !this.changed;
    this.rows.forEach((r, i) => {
      r.percentage.readonly(blocked || i === 0 || i === this.rows.length - 1);
      r.value.readonly(blocked);
      r.ease.disabled = blocked;
      r.remove.disabled = blocked || i === 0 || i === this.rows.length - 1;
      r.seek.disabled = blocked || this.changed;
    });
  }
  request(html: string, owner: string): AnimationInput | null {
    if (!this.changed) return null;
    if (owner !== this.owner || !this.clip) throw new Error("关键帧编辑上下文已过期");
    if (this.operation !== "put") return { action: this.operation, html, id: this.clip.id, animationId: this.identity };
    this.start.validate();
    this.duration.validate();
    for (const row of this.rows) {
      row.percentage.validate();
      row.value.validate();
    }
    return {
      action: "put",
      html,
      id: this.clip.id,
      ...(this.identity ? { animationId: this.identity } : {}),
      property: this.property.value as (typeof properties)[number],
      ...(this.runEase.value ? { ease: this.runEase.value as Animation["ease"] } : {}),
      start: this.start.input.valueAsNumber,
      duration: this.duration.input.valueAsNumber,
      frames: this.values(),
    };
  }
  acknowledge(clip: Clip | undefined) {
    const property = this.property.value;
    this.changed = false;
    this.operation = "put";
    this.clip = clip;
    this.identity = clip?.animations.find((a) => a.property === property)?.id ?? clip?.animations[0]?.id ?? "";
    this.signature = "";
  }
}
