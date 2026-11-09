import { button, field, note, readout, slot } from "@open-motion/components";
import type { ContextModel } from "@open-motion/motion/project";
import type { Editor } from "../../editor.js";

export interface Binding {
  artifact: string;
  revision: string;
  instance: string | null;
  file: string;
  source: string;
  snapshot: string;
}
/** Product editing context. Workspace remains the only revision/history/persistence owner. */
export class CompositionContext {
  readonly element: HTMLElement;
  instance: string | null = null;
  private model?: ContextModel;
  private revision = "";
  private artifact = "";
  private times = new Map<string, number>();
  private seeking = false;
  private global: HTMLOutputElement;
  private trail: HTMLElement;
  private actions: HTMLElement;
  private select: HTMLSelectElement;
  private enter: HTMLButtonElement;
  private description: HTMLElement;
  private trailKey = "";
  private childrenKey = "";
  constructor(
    document: Document,
    private editor: Editor,
    private navigate: (id: string | null) => void,
  ) {
    this.element = slot(document, "toolbar");
    this.element.setAttribute("aria-label", "合成上下文");
    this.global = readout(document, "全局播放时间", "0.00");
    this.trail = slot(document, "toolbar");
    this.actions = slot(document, "toolbar");
    this.select = document.createElement("select");
    this.select.setAttribute("aria-label", "合成实例");
    this.enter = button(document, { label: "进入合成", onClick: () => this.navigate(this.select.value) });
    this.description = note(document, "");
    this.actions.append(field(document, "合成实例", this.select, true, true), this.enter, this.global);
  }
  get file() {
    return this.model?.context.file ?? "index.html";
  }
  get source() {
    return this.editor.source(this.file);
  }
  get owner() {
    return JSON.stringify([this.editor.project?.artifactId, this.instance, this.file]);
  }
  get readonly() {
    return !!this.model?.context.clockReason;
  }
  get scope() {
    return this.instance ?? "";
  }
  reset() {
    this.instance = null;
    this.model = undefined;
    this.times.clear();
    this.seeking = false;
  }
  change(id: string | null, global: number) {
    if (id !== null && !this.model?.context.graph.instances.some((node) => node.id === id))
      throw Error("合成实例已过期");
    this.times.set(this.scope, global);
    this.instance = id;
    this.seeking = true;
  }
  update(model: ContextModel) {
    this.model = model;
    this.instance = model.context.instance;
    this.revision = this.editor.project?.revision ?? "";
    this.artifact = this.editor.project?.artifactId ?? "";
    if (model.context.invalidated) {
      this.times.clear();
      this.seeking = true;
    }
  }
  takeSeek(): number | null {
    if (!this.seeking) return null;
    this.seeking = false;
    const start = this.model?.context.offset ?? 0;
    const requested = this.times.get(this.scope) ?? start;
    return Math.max(start, Math.min(start + (this.model?.context.duration ?? Number.POSITIVE_INFINITY), requested));
  }
  localTime(global: number) {
    this.global.value = global.toFixed(2);
    return Math.max(
      0,
      Math.min(this.model?.context.duration ?? Number.POSITIVE_INFINITY, global - (this.model?.context.offset ?? 0)),
    );
  }
  globalTime(local: number) {
    if (
      this.readonly ||
      !Number.isFinite(local) ||
      local < 0 ||
      local > (this.model?.context.duration ?? Number.POSITIVE_INFINITY)
    )
      throw Error("局部播放时间超出合成时间窗");
    return local + (this.model?.context.offset ?? 0);
  }
  scoped(id: string) {
    return id && this.instance ? `${this.instance}/${id}` : id;
  }
  local(id: string): string | null {
    const prefix = this.instance ? `${this.instance}/` : "";
    if (!id.startsWith(prefix)) return null;
    const local = id.slice(prefix.length);
    return local.includes("/") ? null : local;
  }
  capture(source = this.source): Binding {
    const project = this.editor.project;
    if (
      !project ||
      this.readonly ||
      project.artifactId !== this.artifact ||
      project.revision !== this.revision ||
      source !== this.source ||
      this.model?.context.instance !== this.instance
    )
      throw Error("合成编辑上下文已过期或只读");
    return {
      artifact: project.artifactId,
      revision: project.revision,
      instance: this.instance,
      file: this.file,
      source,
      snapshot: JSON.stringify(this.editor.sources),
    };
  }
  apply(binding: Binding, html: string) {
    const current = this.capture(binding.source);
    if (JSON.stringify(current) !== JSON.stringify(binding)) throw Error("合成源码事务已过期");
    this.editor.editFile(binding.file, html);
  }
  async transform<T extends { html: string }>(action: (source: string) => Promise<T>, source?: string): Promise<T> {
    const before = this.capture(source);
    await this.editor.save();
    if (
      before.snapshot !== JSON.stringify(this.editor.sources) ||
      before.instance !== this.instance ||
      before.artifact !== this.editor.project?.artifactId
    )
      throw Error("保存后合成投影已改变，请重试当前操作");
    this.revision = this.editor.project.revision;
    const binding = this.capture(before.source);
    const result = await action(binding.source);
    this.apply(binding, result.html);
    await this.editor.save();
    return result;
  }
  render(blocked: boolean) {
    const document = this.element.ownerDocument,
      context = this.model?.context;
    const trailKey = JSON.stringify(context?.trail.map((node) => [node.id, node.file]) ?? []);
    if (this.trailKey !== trailKey) {
      this.trailKey = trailKey;
      this.trail.replaceChildren(button(document, { label: "主合成", onClick: () => this.navigate(null) }));
      for (const node of context?.trail ?? [])
        this.trail.append(
          button(document, { label: `${node.hostId} · ${node.file}`, onClick: () => this.navigate(node.id) }),
        );
    }
    for (const control of this.trail.querySelectorAll("button")) control.disabled = blocked;
    const children = context?.graph.instances.filter((node) => node.parent === this.instance) ?? [];
    const key = JSON.stringify(children.map((node) => [node.id, node.file]));
    if (key !== this.childrenKey) {
      this.childrenKey = key;
      const value = this.select.value;
      this.select.replaceChildren(
        ...children.map((node) => {
          const option = document.createElement("option");
          option.value = node.id;
          option.textContent = `${node.hostId} · ${node.file}`;
          return option;
        }),
      );
      if (children.some((node) => node.id === value)) this.select.value = value;
    }
    this.select.disabled = blocked || !children.length;
    this.enter.disabled = this.select.disabled;
    this.element.dataset.file = this.file;
    this.element.dataset.instance = this.scope;
    this.description.textContent =
      context?.clockReason ??
      (context?.invalidated
        ? "实例已移除，已返回主合成"
        : this.instance
          ? `局部编辑 ${this.file} · 全局预览；保存将更新全部共享实例`
          : "主合成编辑与全局预览");
    if (!this.element.contains(this.trail)) this.element.replaceChildren(this.trail, this.actions, this.description);
  }
}
