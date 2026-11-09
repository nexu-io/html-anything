import { badge, button, emptyState, note, readout, slot, type timeTracks } from "@open-motion/components";
import type { Clip, NativeValues } from "@open-motion/motion/contract";
import type { ContextModel } from "@open-motion/motion/project";
import type { Project } from "@open-motion/workspace/contract";
import type { Client } from "../../api.js";
import type { Editor } from "../editor.js";
import { studioLayout } from "./layout.js";
import { NativePreview } from "./preview.js";
import { AnimationEditor } from "./studio/animation.js";
import { type Binding, CompositionContext } from "./studio/context.js";
import { StudioLibrary } from "./studio/library.js";
import { Properties } from "./studio/properties.js";
import { studioTimeline } from "./studio/timeline.js";
import { playerControls, studioTools } from "./studio/toolbar.js";
import { retimeKey } from "./studio/transactions.js";

const editorLabel = (session: boolean) => (session ? "新建影片工程" : "开始创作");
/** Product editor projection. The SDK owns native transforms; workspace owns committed content. */
export class Studio {
  private disposed = false;
  private teardown?: () => void;
  private model?: ContextModel;
  private context: CompositionContext;
  private layers: StudioLibrary;
  private globalTime = 0;
  private key = "";
  private pending?: {
    binding: Binding;
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
      context(path: string): void;
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
    this.context = new CompositionContext(document, editor, (id) => this.navigate(id));
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
    this.layers = new StudioLibrary(
      library.body,
      library.actions,
      (id) => this.choose(id),
      (path) => this.options.file(path),
    );
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
    root.replaceChildren(this.toolbar, this.context.element, areas.element);
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
        this.transport?.update(this.context.owner, this.blocked || this.context.readonly, this.viewer.ready);
        this.viewer.control("seek", this.globalTime);
      },
      time: (value) => {
        this.globalTime = value;
        this.currentTime = this.context.localTime(value);
        this.time.value = this.currentTime.toFixed(2);
        this.axis?.time(this.currentTime);
      },
      begin: () => this.control("pause"),
      move: (scoped, x, y) => {
        const id = this.context.local(scoped);
        if (id === null) return;
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
          await this.context.transform((html) => this.client.patchMotion(html, id, { appearance: { x, y } }));
          this.selected = id;
        });
      },
      select: (scoped) => {
        const id = this.context.local(scoped);
        if (id === null) return;
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

  sync(project: Project | null, blocked: boolean) {
    if (this.disposed) return;
    this.blocked = blocked;
    if (project && this.artifact !== project.artifactId) {
      this.enabled = true;
      this.artifact = project.artifactId;
      this.selected = "";
      this.layers.reset();
      this.context.reset();
      this.globalTime = 0;

      this.currentTime = 0;
    }
    this.properties.block(blocked || !this.model || this.animations.dirty);
    this.animations.block(blocked || !this.model || !!this.pending);
    this.viewer.select(
      this.context.scoped(this.selected),
      !blocked &&
        !!this.model &&
        !this.context.readonly &&
        !this.pending &&
        !this.animations.dirty &&
        !this.editor.dirty,
      this.context.scope,
    );
    const sources = this.editor.sources;
    const signature = JSON.stringify(sources);
    const key = JSON.stringify([project?.artifactId, project?.revision, this.context.instance, signature]);
    if (this.key === key) {
      if (this.model) this.render(this.model.clips);
      return;
    }
    this.key = key;
    clearTimeout(this.inspectTimer);
    const epoch = ++this.epoch;
    this.model = undefined;
    this.viewer.select("", false, this.context.scope);
    this.layers.disable(true);
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

      this.layers.update([], "", true, []);
      this.context.element.replaceChildren();
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
        void this.client.contextMotion(sources, this.context.instance).then(
          (model) => {
            if (
              epoch !== this.epoch ||
              project.revision !== this.editor.project?.revision ||
              signature !== JSON.stringify(this.editor.sources)
            )
              return;
            this.model = model;
            this.context.update(model);
            const seek = this.context.takeSeek();
            if (seek !== null) {
              this.globalTime = seek;
              this.currentTime = this.context.localTime(seek);
              this.time.value = this.currentTime.toFixed(2);
              this.selected = "";
              this.layers.reset();
              this.options.context(this.context.file);
              this.viewer.control("seek", seek);
            }
            this.layers.disable(false);
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
        this.context.capture(candidate.binding.source);
        const result = await this.client.patchMotion(candidate.binding.source, candidate.id, candidate.values);
        this.context.apply(candidate.binding, result.html);
        if (this.pending === candidate) this.pending = undefined;
      }
      const request = this.animations.request(this.context.source, this.context.owner);
      if (request) {
        const binding = this.context.capture();
        const result = await this.client.animateMotion(request);
        this.context.apply(binding, result.html);
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
    try {
      this.viewer.control(action, timeSeconds === undefined ? undefined : this.context.globalTime(timeSeconds));
      if (this.model && this.viewer.revision === this.editor.project?.revision) this.status.value = "预览就绪";
    } catch (error) {
      this.status.value = (error as Error).message;
    }
  }
  private render(clips: Clip[]) {
    const document = this.root.ownerDocument;
    if (!clips.some((c) => c.id === this.selected)) this.selected = "";
    const selected = clips.find((c) => c.id === this.selected);
    const blocked = this.blocked || this.context.readonly;
    this.context.render(this.blocked);
    this.layers.update(clips, this.selected, this.blocked, this.editor.project?.files ?? []);
    const clip = selected;
    this.properties.update({
      owner: this.context.owner,
      clips,
      selected: this.selected,
      values: this.pending?.id === clip?.id ? this.pending?.values : undefined,
      blocked: blocked || this.animations.dirty,
      choose: (id) => this.choose(id),
      change: (values) => {
        if (!clip || !this.model || !this.editor.project) return;
        this.pending = { binding: this.context.capture(this.model.html), id: clip.id, values };
        const source = this.options.sourceInput();
        if (source) source.disabled = true;
        this.animations.block(true);
        this.axis?.disable(true);
        this.options.changed();
      },
      save: () => this.run(() => this.editor.save()),
      remove: () =>
        this.run(async () => {
          if (!clip) return;
          await this.context.transform((html) => this.client.editMotion({ html, action: "remove", id: clip.id }));
        }),
    });
    this.animations.update(this.context.owner, selected, blocked || !!this.pending);
    this.viewer.select(
      this.context.scoped(this.selected),
      !blocked && !this.pending && !this.animations.dirty && !this.editor.dirty,
      this.context.scope,
    );
    this.axis = studioTimeline(document, {
      clips,
      selected: this.selected,
      blocked: blocked || !!this.pending || this.animations.dirty || this.editor.dirty,
      time: this.currentTime,
      duration: this.model?.context.duration ?? null,
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
          this.selected = await retimeKey(this.context, this.client, id, time, source);
        });
      },
      commit: (id, start, duration) =>
        this.run(async () => {
          await this.context.transform((html) => this.client.patchMotion(html, id, { start, duration }));
          this.selected = id;
        }),
    });
    if (!this.transport) {
      this.transport = playerControls(document, {
        time: this.time,
        control: (action, time) => this.control(action, time),
      });
      this.player.replaceChildren(this.transport.element);
    }
    this.transport.update(this.context.owner, blocked, this.viewer.ready);
    this.toolbar.replaceChildren(
      ...studioTools(document, {
        title:
          this.editor.session?.artifacts.find((a) => a.id === this.editor.project?.artifactId)?.title ?? "影片工程",
        mode: this.mode,
        file: this.context.file,
        blocked: blocked,
        setMode: (mode) => {
          if (mode === "source") this.options.context(this.context.file);
          this.setMode(mode);
        },
        add: () =>
          this.run(async () => {
            const result = await this.context.transform((html) =>
              this.client.editMotion({
                html,
                action: "addText",
                fontSize: 96,
                text: "新文本",
              }),
            );
            const previous = new Set(this.model?.clips.map((c) => c.id));
            this.selected = result.clips.find((c) => !previous.has(c.id))?.id ?? this.selected;
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
  private navigate(id: string | null) {
    this.run(async () => {
      await this.editor.save();
      this.viewer.control("pause");
      this.context.change(id, this.globalTime);
      this.selected = "";
      this.animations.discardDraft();
      this.layers.reset();
      this.key = "";
      this.setMode("preview");
    });
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
    this.globalTime = this.context.readonly ? 0 : this.context.globalTime(0);
    this.currentTime = this.context.localTime(this.globalTime);
    this.time.value = this.currentTime.toFixed(2);
  }
  async dispose() {
    this.disposed = true;
    ++this.epoch;
    clearTimeout(this.inspectTimer);
    this.teardown?.();
    await this.viewer.dispose();
  }
}
