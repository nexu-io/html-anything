import { button, field, note, slot, tabs, tree } from "@open-motion/components";
import type { Clip } from "@open-motion/motion/contract";
import { type Input, isFontResource, type Resource, resourceLimit } from "@open-motion/workspace/contract";

import type { Client } from "../../../../api.js";
import type { Editor } from "../../../editor.js";
import type { CompositionContext } from "../context.js";
import { insertResource } from "../transactions.js";
import { SourceFiles } from "./files.js";
import { GenerationPanel } from "./generation.js";
/** Stable layer/file controls; composition navigation and source transactions belong to Studio's context. */
export class StudioLibrary {
  private layers: ReturnType<typeof tree>;
  private tabs: ReturnType<typeof tabs>;
  private files: SourceFiles;
  private blocked = true;
  private expanded = new Set<string>();
  private ready = false;
  private media: HTMLElement;
  private mediaList: HTMLElement;
  private upload: HTMLInputElement;
  private mediaKey = "";
  private generation: GenerationPanel;
  private mode = "layers";
  private current?: { clips: Clip[]; selected: string; blocked: boolean };
  constructor(
    host: HTMLElement,
    actions: HTMLElement,
    choose: (id: string) => void,
    file: (path: string) => void,
    private editing: {
      editor: Editor;
      client: Client;
      context: CompositionContext;
      run(action: () => Promise<void>): void;
    },
  ) {
    const document = host.ownerDocument;
    const render = () => {
      if (this.current) this.update(this.current.clips, this.current.selected, this.current.blocked);
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
        this.sync(this.blocked);
        render();
      },
    });
    this.files = new SourceFiles(document, editing, file);
    this.media = slot(document, "content");
    this.media.setAttribute("aria-label", "工程媒体");
    this.mediaList = slot(document, "content");
    this.upload = document.createElement("input");
    this.upload.type = "file";
    this.upload.accept = ".png,.wav,.ttf,.otf,.woff,.woff2";
    this.upload.setAttribute("aria-label", "导入媒体");
    this.upload.addEventListener("change", () => {
      const file = this.upload.files?.item(0),
        owner = this.editing.editor.project;
      this.upload.value = "";
      if (!file || !owner) return;
      let input: Omit<Input<"resource_import">, "requestId"> | undefined;
      this.editing.run(async () => {
        if (!input) {
          if (!file.size || file.size > resourceLimit || !/\.(png|wav|ttf|otf|woff|woff2)$/i.test(file.name))
            throw Error("请选择不超过 6 MiB 的 PNG、PCM16 WAV 或单字体 TTF/OTF/WOFF/WOFF2");
          await this.editing.editor.save();
          const project = this.editing.editor.project;
          if (!project || project.artifactId !== owner.artifactId) throw Error("媒体导入的工程上下文已改变");
          const data = await new Promise<string>((done, reject) => {
            const reader = new FileReader();
            reader.onload = () => done(String(reader.result).split(",")[1] ?? "");
            reader.onerror = () => reject(Error("媒体文件读取失败"));
            reader.onabort = () => reject(Error("媒体文件读取已取消"));
            reader.readAsDataURL(file);
          });
          if (this.editing.editor.project !== project) throw Error("媒体读取期间工程版本已改变");
          input = {
            sessionId: project.sessionId,
            artifactId: project.artifactId,
            expectedRevision: project.revision,
            path: `assets/${crypto.randomUUID()}.${file.name.split(".").at(-1)?.toLowerCase()}`,
            name: file.name.slice(0, 120),
            data,
          };
        }
        await this.editing.editor.importResource(input);
      });
    });
    this.generation = new GenerationPanel(document, editing);
    this.media.append(
      this.generation.element,
      field(document, "导入媒体", this.upload),
      note(
        document,
        "PNG / PCM16 WAV / TTF / OTF / WOFF / WOFF2 · 单资源最多 6 MiB；素材随工程历史持久保存。导入字体后可在文本图层的字体选项中选择。",
      ),
      this.mediaList,
    );
    actions.append(this.tabs.element);
    host.append(this.layers.element, this.files.element, this.media);
  }
  sync(blocked: boolean) {
    this.blocked = blocked;
    this.files.update(blocked || !!this.editing.editor.drafts?.dirty());
    this.tabs.update(
      [
        { id: "media", label: "媒体" },
        { id: "layers", label: "图层" },
        { id: "files", label: "文件" },
      ],
      this.mode,
      blocked,
    );
    this.generation.update(this.editing.editor.project, blocked);
  }
  dispose() {
    return this.generation.dispose();
  }
  reset() {
    this.expanded.clear();
    this.ready = false;
  }
  disable(value: boolean) {
    if (this.current) this.current.blocked = value;
    this.layers.disable(value);
    this.upload.disabled = value;
    for (const button of this.mediaList.querySelectorAll("button")) button.disabled = value;
  }
  private resources(resources: Resource[], blocked: boolean) {
    const key = JSON.stringify(resources);
    if (key !== this.mediaKey) {
      this.mediaKey = key;
      this.mediaList.replaceChildren(
        ...resources.map((asset) => {
          const document = this.mediaList.ownerDocument,
            row = slot(document, "content");
          row.append(
            note(document, `${asset.name} · ${asset.type} · ${(asset.bytes / 1024).toFixed(1)} KiB`),
            button(document, {
              label: `插入 ${asset.name}`,
              compact: true,
              onClick: () => {
                const project = this.editing.editor.project;
                let applied = false;
                this.editing.run(async () => {
                  if (this.editing.editor.project?.artifactId !== project?.artifactId) throw Error("媒体工程已切换");
                  if (!applied) {
                    if (
                      this.editing.editor.project !== project ||
                      !project?.resources.some((entry) => entry.digest === asset.digest && entry.path === asset.path)
                    )
                      throw Error("媒体版本已过期");
                    await insertResource(this.editing.context, this.editing.client, asset);
                    applied = true;
                  }
                  await this.editing.editor.save();
                });
              },
            }),
            button(document, {
              label: `移除资源 ${asset.name}`,
              compact: true,
              onClick: () => {
                const owner = this.editing.editor.project;
                let input: Omit<Input<"resource_remove">, "requestId"> | undefined;
                this.editing.run(async () => {
                  if (!input) {
                    await this.editing.editor.save();
                    const project = this.editing.editor.project;
                    if (!project || project.artifactId !== owner?.artifactId) throw Error("资源移除的工程上下文已改变");
                    input = {
                      sessionId: project.sessionId,
                      artifactId: project.artifactId,
                      expectedRevision: project.revision,
                      path: asset.path,
                    };
                  }
                  await this.editing.editor.removeResource(input);
                });
              },
            }),
          );
          if (isFontResource(asset)) {
            row.querySelector("button")!.hidden = true;
            row.append(note(document, `${asset.family} · ${asset.weight.join("–")} · ${asset.slant}`));
          }
          return row;
        }),
      );
    }
    this.upload.disabled = blocked;
    for (const button of this.mediaList.querySelectorAll("button")) button.disabled = blocked;
  }
  update(clips: Clip[], selected: string, blocked: boolean) {
    this.current = { clips, selected, blocked };
    if (!this.ready) {
      for (const clip of clips.filter((clip) => clip.parent === null)) this.expanded.add(clip.id);
      this.ready = clips.length > 0;
    }
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
    this.files.element.hidden = this.mode !== "files";
    this.media.hidden = this.mode !== "media";
    this.resources(this.editing.editor.project?.resources ?? [], blocked);
  }
}
