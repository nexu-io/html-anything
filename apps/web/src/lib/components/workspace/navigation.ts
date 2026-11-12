import { badge, button, dialog, field, note, setButton, slot } from "@open-motion/components";
import type { Artifact, Input, Output } from "@open-motion/workspace/contract";
import type { Client } from "../../../api.js";
import type { Editor } from "../../editor.js";
/** One bounded metadata page; workspace remains the project catalogue and selection authority. */
export class Navigation {
  readonly view;
  private search: HTMLInputElement;
  private list: HTMLElement;
  private status: HTMLElement;
  private previous: HTMLButtonElement;
  private next: HTMLButtonElement;
  private refresh: HTMLButtonElement;
  private create: HTMLButtonElement;
  private theme: HTMLButtonElement;
  private page?: Output<"project_list">;
  private cursor?: Input<"project_list">["cursor"];
  private history: Input<"project_list">["cursor"][] = [];
  private epoch = 0;
  private flight?: Promise<void>;
  private controller?: AbortController;
  private flights = new Set<Promise<void>>();
  private disposed = false;
  private blocked = true;
  private selected = "";
  private opening?: Artifact;
  private busy = false;
  private items = new Map<string, HTMLButtonElement>();
  constructor(
    document: Document,
    private client: Client,
    private actions: { open(artifact: Artifact): Promise<void>; create(): void; theme(): void },
  ) {
    this.view = dialog(document, "项目列表", true);
    this.search = document.createElement("input");
    this.search.type = "search";
    this.search.maxLength = 120;
    this.search.setAttribute("aria-label", "搜索项目");
    this.search.autofocus = true;
    this.status = note(document, "打开项目列表以读取项目");
    this.status.setAttribute("role", "status");
    this.list = document.createElement("nav");
    this.list.setAttribute("aria-label", "项目");
    this.create = button(document, {
      label: "新建空白或模板项目",
      icon: "plus",
      primary: true,
      onClick: () => {
        this.view.close();
        actions.create();
      },
    });
    this.previous = button(document, {
      label: "上一页项目",
      onClick: () => {
        this.cursor = this.history.pop();
        this.load();
      },
    });
    this.next = button(document, {
      label: "下一页项目",
      onClick: () => {
        if (this.page?.nextCursor) {
          this.history.push(this.cursor);
          this.cursor = this.page.nextCursor;
          this.load();
        }
      },
    });
    this.refresh = button(document, { label: "刷新项目", onClick: () => this.reset() });
    this.theme = button(document, { label: "切换主题", icon: "moon", onClick: actions.theme });
    const pages = slot(document, "toolbar"),
      footer = slot(document, "footer");
    pages.append(this.previous, this.next, this.refresh);
    footer.append(badge(document, "存储位置", "数据保存在本机"), this.theme);
    this.view.body.append(this.create, field(document, "搜索项目", this.search), this.status, this.list, pages, footer);
    this.search.oninput = () => this.reset();
    this.list.onkeydown = (event) => {
      if (!["ArrowDown", "ArrowUp", "Home", "End"].includes(event.key)) return;
      const items = [...this.list.querySelectorAll<HTMLButtonElement>("button:not(:disabled)")],
        at = items.indexOf(document.activeElement as HTMLButtonElement);
      if (!items.length) return;
      event.preventDefault();
      const next =
        event.key === "Home"
          ? 0
          : event.key === "End"
            ? items.length - 1
            : (at + (event.key === "ArrowUp" ? -1 : 1) + items.length) % items.length;
      items[next]?.focus();
    };
  }
  open(trigger: HTMLElement) {
    this.view.open(trigger);
    this.reset();
  }
  private reset() {
    this.cursor = undefined;
    this.history = [];
    this.load();
  }
  private load() {
    this.controller?.abort();
    this.controller = new AbortController();
    const epoch = ++this.epoch,
      input = { query: this.search.value.trim(), cursor: this.cursor };
    this.status.textContent = "读取项目中";
    this.page = undefined;
    this.list.replaceChildren();
    this.flight = this.client
      .execute("project_list", input, this.controller.signal)
      .then(
        (page) => {
          if (this.disposed || epoch !== this.epoch) return;
          this.page = page;
          this.status.textContent = page.projects.length
            ? `本页 ${page.projects.length} 个项目`
            : input.query
              ? "没有匹配的项目"
              : "尚无项目，请创建项目或通过 Agent 开始创作";
          this.render();
        },
        (error) => {
          if (!this.disposed && epoch === this.epoch)
            this.status.textContent = `项目读取失败：${(error as Error).message}`;
        },
      )
      .finally(() => {
        if (epoch === this.epoch) {
          this.flight = undefined;
          if (!this.disposed) this.controls();
        }
      });
    const current = this.flight;
    this.flights.add(current);
    void current.then(() => this.flights.delete(current));
    this.controls();
  }
  update(editor: Editor, blocked: boolean, dark: boolean, busy: boolean) {
    this.busy = busy;
    this.blocked = blocked;
    this.selected = editor.project?.artifactId ?? "";
    setButton(this.theme, { label: "切换主题", icon: dark ? "sun" : "moon", onClick: this.actions.theme });
    this.controls();
    this.render();
  }
  private controls() {
    this.previous.disabled = !!this.flight || !this.history.length;
    this.next.disabled = !!this.flight || !this.page?.nextCursor;
    this.refresh.disabled = !!this.flight;
    this.create.disabled = this.blocked;
    this.list.querySelectorAll<HTMLButtonElement>("button").forEach((control) => {
      control.disabled = this.busy || (this.blocked && control.dataset.projectId !== this.opening?.id);
    });
  }
  private render() {
    if (!this.page) return;
    const document = this.list.ownerDocument;
    const projects = this.page.projects;
    for (const [id, control] of this.items)
      if (!projects.some((project) => project.id === id)) {
        control.remove();
        this.items.delete(id);
      }
    for (const [index, artifact] of projects.entries()) {
      let control = this.items.get(artifact.id);
      if (!control) {
        control = button(document, { label: artifact.title });
        this.items.set(artifact.id, control);
      }
      setButton(control, {
        label: artifact.title,
        icon: "film",
        variant: "item",
        selected: artifact.id === this.selected,
        disabled: this.busy || (this.blocked && this.opening?.id !== artifact.id),
        onClick: () => {
          this.opening = artifact;
          void this.actions.open(artifact).then(
            () => {
              this.opening = undefined;
              this.view.close();
            },
            (error) => {
              this.status.textContent = `${(error as Error).message} · 点击同一项目重试，或关闭列表处理当前内容。`;
            },
          );
        },
      });
      control.setAttribute("data-project-id", artifact.id);
      if (artifact.id === this.selected) control.setAttribute("aria-current", "page");
      else control.removeAttribute("aria-current");
      if (this.list.children[index] !== control) this.list.insertBefore(control, this.list.children[index] ?? null);
    }
  }

  async dispose() {
    this.disposed = true;
    this.epoch++;
    this.controller?.abort();
    this.view.dispose();
    await Promise.all(this.flights);
  }
}
