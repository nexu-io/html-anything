import { previewFrame, previewViewport } from "@open-motion/components";
import { inspectRuntimeProtocol, runtimeProtocolMetadata } from "@open-motion/motion/protocol";
import { isFontResource, type Project } from "@open-motion/workspace/contract";
import type { Client } from "../../api.js";
/** The only Web owner for candidate frames, runtime messages and ephemeral view retirement. */
export class NativePreview {
  private view?: {
    id: string;
    revision: string;
    artifactId: string;
    frame: HTMLIFrameElement;
    container: HTMLElement;
    fps: number;
    acceptTime: boolean;
    overlay: ReturnType<typeof previewViewport>;
  };
  private candidate?: { cancel(): void };
  private epoch = 0;
  private flight?: { key: string; work: Promise<void> };
  private draining = Promise.resolve();
  private pending = new Set<Promise<void>>();
  constructor(
    private host: HTMLElement,
    private client: Client,
    private current: () => Project | null,
    private events: {
      message(value: string): void;
      ready(): void;
      time(value: number): void;
      select(id: string): void;
      begin?(): void;
      move?(id: string, x: number, y: number): void;
    },
  ) {
    this.window = host.ownerDocument.defaultView;
    this.window?.addEventListener("message", this.message);
  }
  private window: Window | null;
  private disposed = false;
  private message = (event: MessageEvent) => {
    if (!this.view || event.source !== this.view.frame.contentWindow || event.origin !== "null") return;
    const data = event.data;
    if (
      data?.source === "open-motion-editor" &&
      typeof data.id === "string" &&
      data.id.length <= 512 &&
      this.view.revision === this.current()?.revision
    ) {
      if (data.type === "begin" && this.editable) this.events.begin?.();
      if (data.type === "select") this.events.select(data.id);
      if (data.type === "move" && this.editable && Number.isFinite(data.x) && Number.isFinite(data.y))
        this.events.move?.(data.id, data.x, data.y);
      if (
        data.type === "geometry" &&
        data.id === this.selection &&
        [data.x, data.y, data.width, data.height].every(
          (n: unknown) => typeof n === "number" && Number.isFinite(n) && Math.abs(n) < 1e7,
        )
      )
        this.view.overlay.selection(data);
    }
    if (
      this.view.acceptTime &&
      event.data?.source === "hf-preview" &&
      event.data.type === "state" &&
      Number.isFinite(event.data.currentTime)
    )
      this.events.time(event.data.currentTime);
  };

  private selection = "";
  private editable = false;
  private scope = "";
  select(id: string, editable: boolean, scope: string) {
    this.selection = id;
    this.scope = scope;
    this.editable = editable;
    this.view?.overlay.selection(null);
    this.view?.frame.contentWindow?.postMessage(
      { source: "open-motion-editor", type: "selection", id, enabled: editable, scope },
      "*",
    );
  }
  get ready() {
    return !!this.view;
  }
  get revision() {
    return this.view?.revision;
  }
  get artifactId() {
    return this.view?.artifactId;
  }
  control(action: "play" | "pause" | "seek", timeSeconds?: number) {
    this.view?.frame.contentWindow?.postMessage(
      { source: "hf-parent", type: "control", ...runtimeProtocolMetadata(this.view.fps), action, timeSeconds },
      "*",
    );
  }
  open(project: Project): Promise<void> {
    if (this.disposed) return Promise.reject(new Error("preview owner is disposed"));
    const key = `${project.artifactId}:${project.revision}`;
    if (this.flight?.key === key) return this.flight.work;
    const work = this.perform(project).finally(() => {
      this.pending.delete(work);
      if (this.flight?.work === work) this.flight = undefined;
    });
    this.pending.add(work);
    this.flight = { key, work };
    return work;
  }
  private async perform(project: Project) {
    const epoch = ++this.epoch;
    this.candidate?.cancel();
    const current = () =>
      epoch === this.epoch &&
      this.current()?.artifactId === project.artifactId &&
      this.current()?.revision === project.revision;
    await this.draining;
    if (!current()) return;
    if (this.view?.artifactId === project.artifactId && this.view.revision === project.revision) {
      this.events.message("预览就绪");
      return;
    }
    this.events.message("正在加载预览");
    const opened = await this.client.preview(project);
    if (!current()) {
      await this.client.closePreview(opened.id);
      return;
    }
    const document = this.host.ownerDocument,
      frame = previewFrame(document, "影片预览"),
      viewport = previewViewport(document),
      window = document.defaultView;
    frame.setAttribute("sandbox", "allow-scripts");
    frame.setAttribute("allow", "autoplay");
    frame.referrerPolicy = "no-referrer";
    frame.width = "640";
    frame.height = "360";
    if (!window) {
      await this.client.closePreview(opened.id);
      throw new Error("preview window is missing");
    }
    viewport.content.append(frame);
    try {
      const fps = await new Promise<number>((done, reject) => {
        let nativeFps: number | undefined,
          fontsReady = !project.resources.some(isFontResource);
        const cleanup = () => {
          clearTimeout(timer);
          window.removeEventListener("message", message);
          this.candidate = undefined;
        };
        const message = (event: MessageEvent) => {
          if (event.source !== frame.contentWindow || event.origin !== "null") return;
          if (event.data?.source === "open-motion-fonts" && event.data.protocolVersion === 1) {
            if (event.data.ready === false) {
              cleanup();
              reject(new Error("工程字体加载失败"));
              return;
            }
            if (event.data.ready === true) fontsReady = true;
            if (nativeFps && fontsReady) {
              cleanup();
              done(nativeFps);
            }
            return;
          }
          if (
            event.source !== frame.contentWindow ||
            event.origin !== "null" ||
            event.data?.source !== "hf-preview" ||
            event.data.protocolVersion !== 1
          )
            return;
          if (event.data.type === "stage-size") {
            try {
              viewport.resize(event.data.width, event.data.height);
            } catch (error) {
              cleanup();
              reject(error);
            }
            return;
          }
          const protocol = inspectRuntimeProtocol(event.data);
          if (
            protocol.status === "supported" &&
            event.data.type === "timeline" &&
            Number.isFinite(event.data.durationSeconds) &&
            event.data.durationSeconds > 0
          ) {
            nativeFps = protocol.fps;
            if (fontsReady) {
              cleanup();
              done(nativeFps);
            }
          }
        };
        const timer = setTimeout(() => {
          cleanup();
          reject(new Error("预览加载超时"));
        }, 8000);
        this.candidate = {
          cancel: () => {
            cleanup();
            reject(new Error("预览候选已退场"));
          },
        };
        window.addEventListener("message", message);
        frame.hidden = true;
        for (const child of [...this.host.children]) if (child !== this.view?.container) child.remove();
        viewport.element.hidden = true;
        this.host.append(viewport.element);
        frame.src = opened.url;
      });
      if (!current()) throw new Error("预览上下文已过期");
      const previous = this.view;
      const present = {
        ...opened,
        artifactId: project.artifactId,
        frame,
        container: viewport.element,
        fps,
        overlay: viewport,
        acceptTime: false,
      };
      this.view = present;
      frame.hidden = false;
      viewport.element.hidden = false;
      previous?.container.remove();
      if (previous) {
        try {
          await this.client.closePreview(previous.id);
        } catch (error) {
          if (this.view !== present) return;
          present.acceptTime = true;
          this.events.message(`新预览已就绪，旧视图撤销未确认：${(error as Error).message}`);
          this.events.ready();
          return;
        }
      }
      if (this.view !== present) return;
      present.acceptTime = true;
      this.host.dataset.revision = project.revision;
      this.select(this.selection, this.editable, this.scope);
      this.events.message("预览就绪");
      this.events.ready();
    } catch (error) {
      viewport.element.remove();
      await this.client.closePreview(opened.id);
      throw error;
    }
  }
  close() {
    ++this.epoch;
    this.candidate?.cancel();
    this.flight = undefined;
    this.view?.container.remove();
    this.view = undefined;
    this.host.removeAttribute("data-revision");
    this.events.message("");
    this.draining = this.draining.catch(() => {}).then(() => this.client.closePreviews());
    void this.draining.catch((error) => this.events.message(`视图撤销未确认：${error.message}`));
    return this.draining;
  }
  async dispose() {
    this.disposed = true;
    this.window?.removeEventListener("message", this.message);
    const pending = [...this.pending];
    const closing = this.close();
    await Promise.allSettled(pending);
    await closing;
    await this.client.closePreviews();
  }
}
