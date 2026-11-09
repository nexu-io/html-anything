import {
  badge,
  button,
  disclosure,
  emptyState,
  field,
  note,
  numberField,
  readout,
  slot,
} from "@open-motion/components";
import type { Clip } from "@open-motion/motion";
import type { AudioValues, NativeValues } from "@open-motion/motion/contract";
import { AppearanceFields } from "./appearance.js";

interface Options {
  owner: string;
  clips: Clip[];
  selected: string;
  values?: NativeValues;
  blocked: boolean;
  choose(id: string): void;
  change(values: NativeValues): void;
  save(): void;
  remove(): void;
}
export class Properties {
  readonly element: HTMLElement;
  private select: HTMLSelectElement;
  private text: HTMLInputElement;
  private start: ReturnType<typeof numberField>;
  private duration: ReturnType<typeof numberField>;
  private font: ReturnType<typeof numberField>;
  private type: HTMLOutputElement;
  private identity: HTMLOutputElement;
  private content: HTMLElement;
  private empty: HTMLElement;
  private apply: HTMLButtonElement;
  private remove: HTMLButtonElement;
  private current?: Options;
  private key = "";
  private touched = new Set<keyof NativeValues>();
  private appearance: AppearanceFields;
  private audio: HTMLElement;
  private inPoint: ReturnType<typeof numberField>;
  private rate: ReturnType<typeof numberField>;
  private volume: ReturnType<typeof numberField>;
  private muted: HTMLInputElement;
  private audioReason: HTMLElement;
  private audioTouched = new Set<keyof AudioValues>();
  constructor(document: Document) {
    this.element = slot(document, "properties");
    this.select = document.createElement("select");
    this.select.setAttribute("aria-label", "图层选择");
    this.text = document.createElement("input");
    this.text.setAttribute("aria-label", "文本内容");
    const changed = (key: keyof NativeValues) => {
      const o = this.current,
        clip = o?.clips.find((c) => c.id === o.selected);
      if (!o || o.blocked || !clip) return;
      this.touched.add(key);
      const values: NativeValues = {};
      if (this.touched.has("text") && clip.text !== null) values.text = this.text.value;
      if (this.touched.has("start")) values.start = this.start.input.valueAsNumber;
      if (this.touched.has("duration")) values.duration = this.duration.input.valueAsNumber;
      if (this.touched.has("fontSize")) values.fontSize = this.font.input.valueAsNumber;
      if (this.touched.has("appearance")) values.appearance = this.appearance.read();
      if (this.touched.has("audio")) {
        values.audio = {};
        if (this.audioTouched.has("inPoint")) values.audio.inPoint = this.inPoint.input.valueAsNumber;
        if (this.audioTouched.has("rate")) values.audio.rate = this.rate.input.valueAsNumber;
        if (this.audioTouched.has("volume")) values.audio.volume = this.volume.input.valueAsNumber;
        if (this.audioTouched.has("muted")) values.audio.muted = this.muted.checked;
      }
      o.change(values);
    };
    const audioChanged = (key: keyof AudioValues) => {
      this.audioTouched.add(key);
      changed("audio");
    };
    this.inPoint = numberField(document, {
      label: "源入点秒",
      unit: "s",
      min: 0,
      max: 3600,
      optional: true,
      change: () => audioChanged("inPoint"),
    });
    this.rate = numberField(document, {
      label: "素材倍率",
      unit: "×",
      min: 0.1,
      max: 10,
      optional: true,
      change: () => audioChanged("rate"),
    });
    this.volume = numberField(document, {
      label: "音量",
      unit: "×",
      min: 0,
      max: 1,
      optional: true,
      change: () => audioChanged("volume"),
    });
    this.muted = document.createElement("input");
    this.muted.type = "checkbox";
    this.muted.setAttribute("aria-label", "静音");
    this.muted.onchange = () => audioChanged("muted");
    this.audio = slot(document, "stack");
    this.audio.setAttribute("aria-label", "音频设置");
    this.audioReason = note(document, "");
    this.audio.append(
      field(document, "源入点秒", this.inPoint.element),
      field(document, "素材倍率", this.rate.element),
      field(document, "音量", this.volume.element),
      field(document, "静音", this.muted),
      this.audioReason,
    );
    this.appearance = new AppearanceFields(document, () => changed("appearance"));
    this.start = numberField(document, { label: "开始秒", unit: "s", min: 0, change: () => changed("start") });
    this.duration = numberField(document, { label: "持续秒", unit: "s", min: 0, change: () => changed("duration") });
    this.font = numberField(document, {
      label: "字号",
      unit: "px",
      min: 0,
      max: 4096,
      optional: true,
      change: () => changed("fontSize"),
    });
    this.font.input.placeholder = "继承";
    this.text.oninput = () => changed("text");
    this.select.onchange = () => {
      const id = this.select.value;
      this.select.value = this.current?.selected ?? "";
      this.current?.choose(id);
    };
    this.type = badge(document, "元素类型", "");
    this.identity = readout(document, "元素身份", "");
    const info = disclosure(document, "元素信息"),
      values = slot(document, "stack"),
      timing = slot(document, "pair");
    info.body.append(this.identity);
    timing.append(field(document, "开始秒", this.start.element), field(document, "持续秒", this.duration.element));
    this.apply = button(document, {
      label: "应用更改",
      icon: "check",
      compact: true,
      fullWidth: true,
      primary: true,
      onClick: () => this.current?.save(),
    });
    this.remove = button(document, {
      label: "删除元素",
      icon: "close",
      compact: true,
      variant: "ghost",
      onClick: () => this.current?.remove(),
    });
    values.append(
      this.type,
      field(document, "文本内容", this.text),
      field(document, "字号", this.font.element),
      timing,
      this.audio,
      this.appearance.element,
      this.apply,
      this.remove,
      info.element,
    );
    this.content = document.createElement("div");
    this.content.append(values);
    this.empty = document.createElement("div");
    this.empty.append(
      emptyState(document, {
        title: "尚未选择元素",
        detail: "点击画布或左侧图层，查看并编辑元素属性。",
        icon: "layers",
      }).element,
    );
    this.element.append(field(document, "图层选择", this.select, false, true), this.content, this.empty);
    this.clear();
  }
  clear() {
    this.current = undefined;
    this.touched.clear();
    this.audioTouched.clear();
    this.key = "";
    this.select.replaceChildren();
    this.content.hidden = true;
    this.empty.hidden = false;
    this.block(true);
  }
  block(value: boolean) {
    const clip = this.current?.clips.find((c) => c.id === this.current?.selected);
    this.select.disabled = value;
    this.text.readOnly = value;
    this.text.disabled = !clip || clip.text === null || !!clip.host;
    const audioReadonly = clip?.media?.kind === "audio" && clip.media.maximum === null;
    this.inPoint.readonly(value || audioReadonly || !clip?.media?.audio);
    this.rate.readonly(value || audioReadonly || !clip?.media?.audio);
    this.volume.readonly(value || audioReadonly || !clip?.media?.audio);
    this.muted.disabled = value || audioReadonly || !clip?.media?.audio;
    this.start.readonly(audioReadonly || value || (!!clip?.composition && !clip.host) || !!clip?.host?.reason);
    this.duration.readonly(audioReadonly || value || (!!clip?.composition && !clip.host) || !!clip?.host?.reason);
    this.font.readonly(value || !!clip?.host || !!clip?.media);
    this.appearance.block(value || !!clip?.host || clip?.media?.kind === "audio");
    this.apply.disabled = value || !clip;
    this.remove.disabled = value || !clip || !!clip.composition;
  }
  validate() {
    this.appearance.validate();
    if (this.audioTouched.has("inPoint")) {
      this.inPoint.validate();
      if (!this.inPoint.input.value) throw Error("请输入有效源入点");
    }
    if (this.audioTouched.has("rate")) {
      this.rate.validate();
      if (!this.rate.input.value) throw Error("请输入有效素材倍率");
    }
    if (this.audioTouched.has("volume")) {
      this.volume.validate();
      if (!this.volume.input.value) throw Error("请输入有效音量");
    }
    if (this.touched.has("start")) this.start.validate();
    if (this.touched.has("duration")) {
      this.duration.validate();
      if (!(this.duration.input.valueAsNumber > 0)) throw new Error("持续秒必须大于0");
    }
    if (this.touched.has("fontSize")) {
      this.font.validate();
      if (!(this.font.input.valueAsNumber > 0)) throw new Error("字号必须大于0");
    }
  }
  update(options: Options) {
    const changed = this.key !== `${options.owner}:${options.selected}`;
    if (changed || !options.values) this.touched.clear();
    if (changed || !options.values?.audio) this.audioTouched.clear();
    this.key = `${options.owner}:${options.selected}`;
    this.current = options;
    const clip = options.clips.find((c) => c.id === options.selected),
      document = this.element.ownerDocument;
    const names = options.clips.map((c) => [
      c.id,
      c.host ? `${c.id} · ${c.host.source}` : c.text || (c.composition ? "主合成" : c.tag),
    ]);
    if (
      JSON.stringify([...this.select.options].slice(1).map((o) => [o.value, o.textContent])) !== JSON.stringify(names)
    ) {
      const empty = document.createElement("option");
      empty.value = "";
      empty.textContent = "选择图层…";
      empty.disabled = true;
      this.select.replaceChildren(
        empty,
        ...names.map(([id, name]) => {
          const option = document.createElement("option");
          option.value = id ?? "";
          option.textContent = name ?? "";
          return option;
        }),
      );
    }
    this.select.value = options.selected;
    this.content.hidden = !clip;
    this.empty.hidden = !!clip;
    if (clip) {
      const values = options.values,
        audio = clip.media?.audio;
      this.audio.hidden = !audio;
      this.inPoint.value(values?.audio?.inPoint ?? audio?.inPoint ?? undefined, changed);
      this.rate.value(values?.audio?.rate ?? audio?.rate ?? undefined, changed);
      this.volume.value(values?.audio?.volume ?? audio?.volume ?? undefined, changed);
      this.muted.checked = values?.audio?.muted ?? audio?.muted ?? false;
      this.audioReason.textContent =
        audio?.reason ?? "源入点与素材倍率不改变片段起点和时长；素材倍率范围 0.1..10，音量范围 0..1。";
      if (changed || document.activeElement !== this.text) this.text.value = values?.text ?? clip.text ?? "";
      this.start.value(values?.start ?? clip.start ?? 0, changed);
      this.duration.value(values?.duration ?? clip.duration ?? 1, changed);
      this.font.value(values?.fontSize ?? clip.fontSize ?? undefined, changed);
      this.appearance.update(clip.appearance, values?.appearance, changed);
      this.identity.value = clip.host?.reason ? `${clip.id} · ${clip.host.reason}` : clip.id;
      this.type.value = clip.host
        ? "合成实例"
        : clip.composition
          ? "主合成"
          : clip.media?.kind === "audio"
            ? "音频片段"
            : clip.media
              ? "图像图层"
              : "元素图层";
    }
    this.block(options.blocked);
  }
}
