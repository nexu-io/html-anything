import { button, field, note, slot } from "@open-motion/components";
import type { SourceChange } from "@open-motion/workspace/contract";
import type { Editor } from "../../../editor.js";

/** Source operations do not depend on a successfully parsed native graph. */
export class SourceFiles {
  readonly element: HTMLElement;
  private list: HTMLElement;
  private selected: HTMLSelectElement;
  private target: HTMLInputElement;
  private confirm: HTMLInputElement;
  private actions: HTMLButtonElement[];
  private owner = "";
  private selection = "";
  private blocked = true;
  private controls = new Map<string, HTMLButtonElement>();
  constructor(
    document: Document,
    private editing: { editor: Editor; run(action: () => Promise<void>): void },
    private open: (path: string) => void,
  ) {
    this.element = slot(document, "content");
    this.element.setAttribute("aria-label", "工程源文件");
    this.list = slot(document, "content");
    this.selected = document.createElement("select");
    this.selected.setAttribute("aria-label", "管理源文件");
    this.target = document.createElement("input");
    this.target.setAttribute("aria-label", "源文件路径");
    this.target.placeholder = "compositions/scene.html";
    this.target.maxLength = 240;
    this.confirm = document.createElement("input");
    this.confirm.type = "checkbox";
    this.confirm.setAttribute("aria-label", "确认删除源文件");
    this.actions = (
      [
        ["create", "新建源文件"],
        ["duplicate", "复制源文件"],
        ["rename", "重命名源文件"],
        ["remove", "删除源文件"],
      ] as const
    ).map(([kind, label]) => button(document, { label, compact: true, onClick: () => this.change(kind) }));
    const actions = slot(document, "toolbar");
    actions.append(...this.actions);
    this.element.append(
      this.list,
      field(document, "管理源文件", this.selected),
      field(document, "源文件路径", this.target),
      field(document, "确认删除源文件", this.confirm),
      actions,
      note(document, "路径相对工程；主入口与 Studio 元数据受保护。重命名不改写源码引用，可在源码中修复后预览。"),
    );
    this.selected.onchange = () => {
      this.selection = this.selected.value;
      this.confirm.checked = false;
      this.state();
    };
    this.confirm.onchange = () => this.state();
    this.target.oninput = () => this.state();
  }
  private state() {
    const selected = this.selected.value,
      protectedFile = selected === "index.html" || selected.startsWith(".");
    this.selected.disabled = this.blocked;
    this.target.disabled = this.blocked;
    this.confirm.disabled = this.blocked || !selected || protectedFile;
    for (const [index, control] of this.actions.entries())
      control.disabled =
        this.blocked ||
        (index < 3 ? !this.target.value : !this.confirm.checked) ||
        (index > 0 && !selected) ||
        (index > 1 && protectedFile) ||
        (index > 0 && selected.startsWith("."));
    for (const control of this.controls.values()) control.disabled = this.blocked;
  }
  update(blocked: boolean) {
    const project = this.editing.editor.project;
    this.blocked = blocked || !project;
    const owner = project?.artifactId ?? "";
    if (owner !== this.owner) {
      this.owner = owner;
      this.selection = "";
      this.target.value = "";
      this.confirm.checked = false;
      this.selected.value = "";
    }
    const files = this.editing.editor.sources,
      selected = this.selection || this.selected.value;
    if (
      JSON.stringify([...this.selected.options].map((option) => option.value)) !==
      JSON.stringify(files.map((file) => file.path))
    ) {
      this.selected.replaceChildren(
        ...files.map((file) => {
          const option = this.selected.ownerDocument.createElement("option");
          option.value = file.path;
          option.textContent = file.path;
          return option;
        }),
      );
      this.selected.value = files.some((file) => file.path === selected) ? selected : "index.html";
      this.selection = this.selected.value;
      this.confirm.checked = false;
    }
    for (const [path, control] of this.controls)
      if (!files.some((file) => file.path === path)) {
        control.remove();
        this.controls.delete(path);
      }
    files.forEach((file, index) => {
      let control = this.controls.get(file.path);
      if (!control) {
        control = button(this.list.ownerDocument, {
          label: file.path,
          icon: file.path.endsWith(".html") ? "code" : "file",
          compact: true,
          variant: "item",
          onClick: () =>
            this.editing.run(async () => {
              await this.editing.editor.save();
              this.selection = file.path;
              this.selected.value = file.path;
              this.confirm.checked = false;
              this.open(file.path);
            }),
        });
        this.controls.set(file.path, control);
      }
      if (this.list.children[index] !== control) this.list.insertBefore(control, this.list.children[index] ?? null);
    });
    this.state();
  }
  private change(kind: SourceChange["kind"]) {
    if (this.blocked || !this.editing.editor.project) return;
    const owner = this.owner,
      target = this.target.value;
    const change: SourceChange =
      kind === "create"
        ? { kind, path: target }
        : kind === "remove"
          ? { kind, path: this.selected.value }
          : { kind, path: this.selected.value, target };
    this.editing.run(async () => {
      if (this.editing.editor.project?.artifactId !== owner) throw Error("源文件操作的工程已切换");
      await this.editing.editor.changeSource(change);
      const next = kind === "remove" ? "index.html" : target;
      this.selection = next;
      this.selected.value = next;
      this.target.value = "";
      this.confirm.checked = false;
      this.open(next);
    });
  }
}
