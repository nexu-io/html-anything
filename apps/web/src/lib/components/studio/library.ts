import { button, tabs, tree } from "@open-motion/components";
import type { Clip } from "@open-motion/motion/contract";
import type { SourceFile } from "@open-motion/workspace/contract";

/** Stable layer/file controls; composition navigation and source transactions belong to Studio's context. */
export class StudioLibrary {
  private layers: ReturnType<typeof tree>;
  private tabs: ReturnType<typeof tabs>;
  private files: HTMLElement;
  private controls = new Map<string, HTMLButtonElement>();
  private expanded = new Set<string>();
  private ready = false;
  private mode = "layers";
  private current?: { clips: Clip[]; selected: string; blocked: boolean; files: SourceFile[] };
  constructor(host: HTMLElement, actions: HTMLElement, choose: (id: string) => void, file: (path: string) => void) {
    const document = host.ownerDocument;
    const render = () => {
      if (this.current)
        this.update(this.current.clips, this.current.selected, this.current.blocked, this.current.files);
    };
    this.layers = tree(document, {
      label: "工程图层",
      select: choose,
      expand: (id, open) => {
        if (open) this.expanded.add(id);
        else this.expanded.delete(id);
        render();
      },
    });
    this.tabs = tabs(document, {
      label: "资源视图",
      select: (id) => {
        this.mode = id;
        render();
      },
    });
    this.files = document.createElement("div");
    this.open = file;
    actions.append(this.tabs.element);
    host.append(this.layers.element, this.files);
  }
  private open: (path: string) => void;
  reset() {
    this.expanded.clear();
    this.ready = false;
  }
  disable(value: boolean) {
    this.layers.disable(value);
  }
  update(clips: Clip[], selected: string, blocked: boolean, files: SourceFile[]) {
    this.current = { clips, selected, blocked, files };
    if (!this.ready) {
      for (const clip of clips.filter((clip) => clip.parent === null)) this.expanded.add(clip.id);
      this.ready = clips.length > 0;
    }
    this.tabs.update(
      [
        { id: "layers", label: "图层" },
        { id: "files", label: "文件" },
      ],
      this.mode,
      blocked,
    );
    this.layers.update(
      clips.map((clip) => ({
        id: clip.id,
        label: clip.host
          ? `${clip.id} · ${clip.host.source}`
          : clip.text?.slice(0, 60) || (clip.composition ? "main" : clip.tag),
        parent: clip.parent,
        icon: clip.composition ? ("film" as const) : ("text" as const),
      })),
      selected,
      this.expanded,
      blocked,
    );
    this.layers.element.hidden = this.mode !== "layers";
    this.files.hidden = this.mode !== "files";
    for (const [path, control] of this.controls)
      if (!files.some((file) => file.path === path)) {
        control.remove();
        this.controls.delete(path);
      }
    for (const file of files) {
      let control = this.controls.get(file.path);
      if (!control) {
        control = button(this.files.ownerDocument, {
          label: file.path,
          icon: file.path.endsWith(".html") ? "code" : "file",
          compact: true,
          variant: "item",
          onClick: () => this.open(file.path),
        });
        this.controls.set(file.path, control);
        this.files.append(control);
      }
      control.disabled = blocked;
    }
  }
}
