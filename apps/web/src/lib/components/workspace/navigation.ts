import { badge, brand, button, disclosure, field, note, setButton, slot } from "@open-motion/components";
import type { Editor } from "../../editor.js";
export class Navigation {
  private title: HTMLInputElement;
  private search: HTMLInputElement;
  private sessions: HTMLElement;
  private count: HTMLOutputElement;
  private create: HTMLButtonElement;
  private theme: HTMLButtonElement;
  private items = new Map<string, HTMLButtonElement>();
  private editor?: Editor;
  private blocked = false;
  constructor(
    private root: HTMLElement,
    private actions: { create(title: string): void; open(id: string): void; theme(): void },
  ) {
    const document = root.ownerDocument,
      options = disclosure(document, "会话选项"),
      heading = slot(document, "spread"),
      scroll = slot(document, "fill"),
      footer = slot(document, "footer");
    this.title = document.createElement("input");
    this.title.setAttribute("aria-label", "会话标题");
    this.title.placeholder = "新会话名称";
    this.search = document.createElement("input");
    this.search.type = "search";
    this.search.setAttribute("aria-label", "搜索会话");
    this.search.placeholder = "搜索会话…";
    this.create = button(document, {
      label: "创建会话",
      icon: "plus",
      primary: true,
      fullWidth: true,
      onClick: () => actions.create(this.title.value),
    });
    this.theme = button(document, {
      label: "切换主题",
      icon: "moon",
      compact: true,
      variant: "ghost",
      onClick: actions.theme,
    });
    this.sessions = document.createElement("nav");
    this.sessions.setAttribute("aria-label", "会话");
    this.count = badge(document, "会话数量", "0");
    heading.append(note(document, "会话"), this.count);
    options.body.append(field(document, "会话标题", this.title));
    scroll.append(this.sessions);
    footer.append(note(document, "我的工作区"), badge(document, "存储位置", "数据保存在本机"), this.theme);
    root.append(
      brand(document, "Open Motion"),
      this.create,
      options.element,
      heading,
      field(document, "搜索会话", this.search, false, true),
      scroll,
      footer,
    );
    this.search.oninput = () => this.list();
    this.sessions.onkeydown = (event) => {
      const items = [...this.sessions.querySelectorAll<HTMLButtonElement>("button:not(:disabled)")],
        at = items.indexOf(document.activeElement as HTMLButtonElement);
      if (at < 0 || !["ArrowDown", "ArrowUp", "Home", "End"].includes(event.key)) return;
      event.preventDefault();
      const next =
        event.key === "Home"
          ? 0
          : event.key === "End"
            ? items.length - 1
            : (at + (event.key === "ArrowDown" ? 1 : -1) + items.length) % items.length;
      items.forEach((item, index) => {
        item.tabIndex = index === next ? 0 : -1;
      });
      items[next]?.focus();
    };
  }
  created(value: string) {
    if (this.title.value === value) this.title.value = "";
  }
  update(editor: Editor, blocked: boolean, dark: boolean) {
    this.editor = editor;
    this.blocked = blocked;
    this.title.readOnly = blocked;
    this.create.disabled = blocked;
    this.count.value = String(editor.state.sessions.length);
    setButton(this.theme, {
      label: "切换主题",
      icon: dark ? "sun" : "moon",
      compact: true,
      variant: "ghost",
      onClick: this.actions.theme,
    });
    this.list();
  }
  private list() {
    if (!this.editor) return;
    const sessions = this.editor.state.sessions.filter((s) =>
      s.title.toLowerCase().includes(this.search.value.toLowerCase()),
    );
    for (const [id, item] of this.items)
      if (!sessions.some((s) => s.id === id)) {
        item.remove();
        this.items.delete(id);
      }
    const active =
      sessions.find((session) => session.id === this.editor?.state.selection.sessionId)?.id ?? sessions[0]?.id;
    sessions.forEach((session, index) => {
      let item = this.items.get(session.id);
      if (!item) {
        item = button(this.root.ownerDocument, { label: session.title });
        this.items.set(session.id, item);
        item.setAttribute("data-session-id", session.id);
      }
      setButton(item, {
        label: session.title,
        detail: "本地工程",
        icon: "message",
        variant: "item",
        selected: session.id === this.editor?.state.selection.sessionId,
        disabled: this.blocked,
        onClick: () => this.actions.open(session.id),
      });
      item.tabIndex = session.id === active ? 0 : -1;
      if (session.id === this.editor?.state.selection.sessionId) item.setAttribute("aria-current", "true");
      else item.removeAttribute("aria-current");
      if (this.sessions.children[index] !== item)
        this.sessions.insertBefore(item, this.sessions.children[index] ?? null);
    });
    this.sessions.querySelector("p")?.remove();
    if (!sessions.length)
      this.sessions.append(
        note(this.root.ownerDocument, this.search.value ? "没有匹配的会话" : "从一个新会话开始创作"),
      );
  }
}
