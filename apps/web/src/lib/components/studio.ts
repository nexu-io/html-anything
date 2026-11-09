import { badge, button, emptyState, note, readout, slot, tabs, type timeTracks, tree } from "@open-motion/components";
import type { Clip, NativeValues } from "@open-motion/motion/contract";
import type { Project } from "@open-motion/workspace/contract";
import type { Client } from "../../api.js";
import type { Editor } from "../editor.js";
import { studioLayout } from "./layout.js";
import { NativePreview } from "./preview.js";
import { AnimationEditor } from "./studio/animation.js";
import { Properties } from "./studio/properties.js";
import { studioTimeline } from "./studio/timeline.js";
import { playerControls, studioTools } from "./studio/toolbar.js";
import { retimeKey } from "./studio/transactions.js";

const editorLabel = (session: boolean) => (session ? "新建影片工程" : "开始创作");
/** Product editor projection. The SDK owns native transforms; workspace owns committed content. */
export class Studio {
  private disposed = false;
  private teardown?: () => void;
  private model?: { html: string; clips: Clip[] };
  private key = "";
  private pending?: {
    artifactId: string;
    source: string;
    id: string;
    values: NativeValues;
  };
  private flight?: Promise<void>;
  private inspectTimer?: ReturnType<typeof setTimeout>;
  private epoch = 0;
  private blocked = false;
  private selected = "";
  private viewer: NativePreview;
  private enabled = true;
  private artifact = "";
  private mode: "preview" | "source" = "preview";
  private currentTime = 0;
  private transport?: ReturnType<typeof playerControls>;
  private axis?: ReturnType<typeof timeTracks>;
  private library: HTMLElement;
  private libraryActions: HTMLElement;
  private layerTree: ReturnType<typeof tree>;
  private resourceTabs: ReturnType<typeof tabs>;
  private filesHost: HTMLElement;
  private files = new Map<string, HTMLButtonElement>();
  private expanded = new Set<string>();
  private expandedReady = false;
  private libraryMode: "layers" | "files" = "layers";
  private timelineActions: HTMLElement;
  private player: HTMLElement;
  private timelineRoot: HTMLElement;
  private toolbar: HTMLElement;
  private previewWrapper: HTMLElement;
  private inspector: HTMLElement;
  private properties: Properties;
  private animations: AnimationEditor;
  private preview: HTMLElement;
  private status: HTMLOutputElement;
  private time: HTMLOutputElement;
  constructor(
    private root: HTMLElement,
    private editor: Editor,
    private client: Client,
    private run: (action: () => Promise<void>) => void,
    private options: {
      source: HTMLElement;
      sourceInput(): HTMLTextAreaElement | null;
      changed(): void;
      file(path: string): void;
      start(): void;
    },
  ) {
    editor.drafts = {
      flush: () => this.flush(),
      dirty: () => !!this.pending || this.animations.dirty,
      discard: () => {
        this.pending = undefined;
        this.animations.discardDraft();
        this.key = "";
      },
    };
    const document = root.ownerDocument;
    const areas = studioLayout(document),
      { library, canvas, inspector, timeline } = areas;
    this.inspector = inspector.body;
    this.properties = new Properties(document);
    this.animations = new AnimationEditor(document, {
      change: () => {
        this.properties.block(this.blocked || this.animations.dirty);
        this.axis?.disable(this.blocked || this.animations.dirty || !!this.pending);
        this.options.changed();
      },
      apply: () => this.run(() => this.editor.save()),
      seek: (time) => this.control("seek", time),
    });
    this.inspector.append(this.properties.element, this.animations.element);
    this.library = library.body;
    this.libraryActions = library.actions;
    this.layerTree = tree(document, {
      label: "工程图层",
      select: (id) => this.choose(id),
      expand: (id, open) => {
        if (open) this.expanded.add(id);
        else this.expanded.delete(id);
        if (this.model) this.render(this.model.clips);
      },
    });
    this.resourceTabs = tabs(document, {
      label: "资源视图",
      select: (id) => {
        this.libraryMode = id === "files" ? "files" : "layers";
        if (this.model) this.render(this.model.clips);
      },
    });
    this.filesHost = document.createElement("div");
    this.filesHost.append(slot(document, "content"));
    this.libraryActions.append(this.resourceTabs.element);
    this.library.append(this.layerTree.element, this.filesHost);
    this.timelineRoot = timeline.body;
    this.timelineActions = timeline.actions;
    this.preview = slot(document, "stage");
    this.preview.setAttribute("aria-label", "影片预览区域");
    this.previewWrapper = slot(document, "fill");
    this.previewWrapper.append(this.preview);
    this.toolbar = slot(document, "editorbar");
    this.player = slot(document, "player");
    this.status = badge(document, "预览状态", "");
    this.time = readout(document, "播放时间", "0.00");
    canvas.body.append(this.previewWrapper, options.source, this.player);
    canvas.actions.append(this.status);
    options.source.hidden = true;
    root.replaceChildren(this.toolbar, areas.element);
    const Resize = document.defaultView?.ResizeObserver;
    const observer = Resize
      ? new Resize((entries) => this.axis?.resize(entries[0]?.contentRect.width ?? 0))
      : undefined;
    observer?.observe(this.timelineRoot);
    const hide = () => {
      this.enabled = false;
      clearTimeout(this.inspectTimer);
      this.retire();
    };
    root.ownerDocument.defaultView?.addEventListener("pagehide", hide);
    this.teardown = () => {
      observer?.disconnect();
      root.ownerDocument.defaultView?.removeEventListener("pagehide", hide);
    };
    this.viewer = new NativePreview(this.preview, client, () => editor.project, {
      message: (value) => {
        this.status.value = value;
      },
      ready: () => {
        this.transport?.update(this.artifact, this.blocked, this.viewer.ready);
        this.viewer.control("seek", this.currentTime);
      },
      time: (value) => {
        this.currentTime = value;
        this.time.value = value.toFixed(2);
        this.axis?.time(value);
      },
      begin: () => this.control("pause"),
      move: (id, x, y) => {
        if (
          this.blocked ||
          this.pending ||
          this.animations.dirty ||
          editor.dirty ||
          !this.model?.clips.some((c) => c.id === id && !c.composition)
        )
          return;
        this.control("pause");
        this.run(async () => {
          await this.editor.save();
          const result = await this.client.patchMotion(this.editor.draft, id, { appearance: { x, y } });
          this.selected = id;
          this.editor.edit(result.html);
          await this.editor.save();
        });
      },
      select: (id) => {
        if (
          !this.blocked &&
          !this.pending &&
          !this.animations.dirty &&
          !editor.dirty &&
          this.model?.clips.some((c) => c.id === id)
        ) {
          this.selected = id;
          this.render(this.model.clips);
        }
      },
    });
  }

  sync(project: Project | null, draft: string, blocked: boolean) {
    if (this.disposed) return;
    this.blocked = blocked;
    if (project && this.artifact !== project.artifactId) {
      this.enabled = true;
      this.artifact = project.artifactId;
      this.selected = "";
      this.expanded.clear();
      this.expandedReady = false;

      this.currentTime = 0;
    }
    this.properties.block(blocked || !this.model || this.animations.dirty);
    this.animations.block(blocked || !this.model || !!this.pending);
    this.viewer.select(this.selected, !blocked && !this.pending && !this.animations.dirty && !this.editor.dirty);
    const key = JSON.stringify([project?.artifactId, project?.revision, draft]);
    if (this.key === key) {
      if (this.model) this.render(this.model.clips);
      return;
    }
    this.key = key;
    clearTimeout(this.inspectTimer);
    const epoch = ++this.epoch;
    this.model = undefined;
    this.layerTree.disable(true);
    this.axis?.disable(true);
    this.library.setAttribute("aria-busy", "true");
    for (const button of this.toolbar.querySelectorAll("button"))
      if (["添加文本", "打开预览"].includes(button.getAttribute("aria-label") ?? button.textContent ?? ""))
        button.disabled = true;
    this.properties.block(true);
    this.animations.block(true);
    if (!project) {
      this.setMode("preview");
      this.retire();
      this.properties.clear();
      this.animations.update("", undefined, true);

      this.layerTree.update([], "", this.expanded, true);
      this.filesHost.replaceChildren();
      this.files.clear();
      this.timelineRoot.replaceChildren(note(this.root.ownerDocument, "创建或打开工程，开始编辑时间轴。"));
      this.toolbar.replaceChildren(note(this.root.ownerDocument, "本地 Studio"));
      const empty = emptyState(this.root.ownerDocument, {
        title: "让想法成为画面",
        detail: "创建影片工程，从画布与时间轴开始。",
        icon: "film",
      });
      empty.actions.append(
        button(this.root.ownerDocument, {
          label: editorLabel(this.editor.session !== null),
          icon: "plus",
          primary: true,
          onClick: () => this.options.start(),
        }),
      );
      this.preview.replaceChildren(empty.element);
      this.player.replaceChildren();
      this.transport = undefined;
      return;
    }
    if (this.viewer.artifactId && this.viewer.artifactId !== project.artifactId) this.retire();
    this.inspectTimer = setTimeout(
      () =>
        void this.client.inspectMotion(draft).then(
          (model) => {
            if (epoch !== this.epoch) return;
            this.model = model;
            this.layerTree.disable(false);
            this.library.removeAttribute("aria-busy");
            this.render(model.clips);
          },
          (error) => {
            if (epoch === this.epoch) this.status.value = `原生源码解析失败：${error.message}`;
          },
        ),
      120,
    );
    if (this.enabled)
      void this.show(project).catch((error) => {
        if (epoch === this.epoch) this.status.value = error.message;
      });
  }
  private async flush(): Promise<void> {
    if (this.flight) return this.flight;
    if (!this.pending && !this.animations.dirty) return;
    this.flight = (async () => {
      const candidate = this.pending;
      if (candidate) {
        this.properties.validate();
        if (candidate.artifactId !== this.editor.project?.artifactId) throw new Error("原生编辑上下文已过期");
        const result = await this.client.patchMotion(candidate.source, candidate.id, candidate.values);
        if (candidate.artifactId !== this.editor.project?.artifactId) throw new Error("原生编辑上下文已过期");
        this.editor.edit(result.html);
        if (this.pending === candidate) this.pending = undefined;
      }
      const request = this.animations.request(this.editor.draft, this.editor.project?.artifactId ?? "");
      if (request) {
        const owner = this.editor.project?.artifactId;
        const result = await this.client.animateMotion(request);
        if (owner !== this.editor.project?.artifactId) throw new Error("动画编辑上下文已过期");
        this.editor.edit(result.html);
        this.animations.acknowledge(result.clips.find((c) => c.id === request.id));
      }
    })();
    try {
      await this.flight;
    } finally {
      this.flight = undefined;
    }
  }
  private control(action: "play" | "pause" | "seek", timeSeconds?: number) {
    this.viewer.control(action, timeSeconds);
  }
  private render(clips: Clip[]) {
    const document = this.root.ownerDocument;
    if (!clips.some((c) => c.id === this.selected)) this.selected = "";
    const selected = clips.find((c) => c.id === this.selected);
    if (!this.expandedReady) {
      for (const clip of clips.filter((c) => c.parent === null)) this.expanded.add(clip.id);
      this.expandedReady = true;
    }
    this.resourceTabs.update(
      [
        { id: "layers", label: "图层" },
        { id: "files", label: "文件" },
      ],
      this.libraryMode,
      this.blocked,
    );
    this.layerTree.update(
      clips.map((c) => ({
        id: c.id,
        label: c.text?.slice(0, 60) || (c.composition ? "main" : c.tag),
        parent: c.parent,
        icon: c.composition ? ("film" as const) : ("text" as const),
      })),
      this.selected,
      this.expanded,
      this.blocked,
    );
    this.layerTree.element.hidden = this.libraryMode !== "layers";
    this.filesHost.hidden = this.libraryMode !== "files";
    const files = this.editor.project?.files ?? [];
    for (const [path, button] of this.files)
      if (!files.some((f) => f.path === path)) {
        button.remove();
        this.files.delete(path);
      }
    for (const file of files) {
      let control = this.files.get(file.path);
      if (!control) {
        control = button(document, {
          label: file.path,
          icon: file.path.endsWith(".html") ? "code" : "file",
          compact: true,
          variant: "item",
          onClick: () => this.options.file(file.path),
        });
        this.files.set(file.path, control);
        this.filesHost.append(control);
      }
      control.disabled = this.blocked;
    }
    const clip = selected;
    this.properties.update({
      owner: this.editor.project?.artifactId ?? "",
      clips,
      selected: this.selected,
      values: this.pending?.id === clip?.id ? this.pending?.values : undefined,
      blocked: this.blocked || this.animations.dirty,
      choose: (id) => this.choose(id),
      change: (values) => {
        if (!clip || !this.model || !this.editor.project) return;
        this.pending = { artifactId: this.editor.project.artifactId, source: this.model.html, id: clip.id, values };
        const source = this.options.sourceInput();
        if (source) source.disabled = true;
        this.animations.block(true);
        this.axis?.disable(true);
        this.options.changed();
      },
      save: () => this.run(() => this.editor.save()),
      remove: () =>
        this.run(async () => {
          await this.editor.save();
          if (!clip) return;
          const result = await this.client.editMotion({ html: this.editor.draft, action: "remove", id: clip.id });
          this.editor.edit(result.html);
          await this.editor.save();
        }),
    });
    this.animations.update(this.editor.project?.artifactId ?? "", selected, this.blocked || !!this.pending);
    this.viewer.select(this.selected, !this.blocked && !this.pending && !this.animations.dirty && !this.editor.dirty);
    this.axis = studioTimeline(document, {
      clips,
      selected: this.selected,
      blocked: this.blocked || !!this.pending || this.animations.dirty || this.editor.dirty,
      time: this.currentTime,
      root: this.timelineRoot,
      actions: this.timelineActions,
      canUndo: !!this.editor.project?.history.canUndo,
      canRedo: !!this.editor.project?.history.canRedo,
      undo: () => this.run(() => this.editor.history("project_undo")),
      redo: () => this.run(() => this.editor.history("project_redo")),
      choose: (id) => this.choose(id),
      seek: (time) => this.control("seek", time),
      retime: (id, time) => {
        const source = this.model?.html;
        this.run(async () => {
          this.selected = await retimeKey(this.editor, this.client, id, time, source);
        });
      },
      commit: (id, start, duration) =>
        this.run(async () => {
          await this.editor.save();
          const result = await this.client.patchMotion(this.editor.draft, id, { start, duration });
          this.selected = id;
          this.editor.edit(result.html);
          await this.editor.save();
        }),
    });
    if (!this.transport) {
      this.transport = playerControls(document, {
        time: this.time,
        control: (action, time) => this.control(action, time),
      });
      this.player.replaceChildren(this.transport.element);
    }
    this.transport.update(this.artifact, this.blocked, this.viewer.ready);
    this.toolbar.replaceChildren(
      ...studioTools(document, {
        title:
          this.editor.session?.artifacts.find((a) => a.id === this.editor.project?.artifactId)?.title ?? "影片工程",
        mode: this.mode,
        blocked: this.blocked,
        setMode: (mode) => this.setMode(mode),
        add: () =>
          this.run(async () => {
            await this.editor.save();
            const result = await this.client.editMotion({
              html: this.editor.draft,
              action: "addText",
              fontSize: 96,
              text: "新文本",
            });
            const previous = new Set(this.model?.clips.map((c) => c.id));
            this.selected = result.clips.find((c) => !previous.has(c.id))?.id ?? this.selected;
            this.editor.edit(result.html);
            await this.editor.save();
          }),
        open: () =>
          this.run(async () => {
            await this.editor.save();
            this.enabled = true;
            if (this.editor.project) await this.show(this.editor.project);
          }),
        close: () => {
          this.enabled = false;
          this.retire();
          this.render(this.model?.clips ?? []);
        },
      }),
    );
  }
  private choose(id: string) {
    this.run(async () => {
      await this.editor.save();
      this.selected = id;
      if (this.model) this.render(this.model.clips);
    });
  }
  setMode(mode: "preview" | "source") {
    this.mode = mode;
    this.previewWrapper.hidden = mode !== "preview";
    this.options.source.hidden = mode !== "source";
    if (mode === "source") this.control("pause");
    if (this.model) this.render(this.model.clips);
  }
  private show(project: Project) {
    return this.viewer.open(project);
  }
  private retire() {
    this.viewer.close();
    this.currentTime = 0;
    this.time.value = "0.00";
  }
  async dispose() {
    this.disposed = true;
    ++this.epoch;
    clearTimeout(this.inspectTimer);
    this.teardown?.();
    await this.viewer.dispose();
  }
}
