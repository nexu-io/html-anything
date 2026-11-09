import {
  badge,
  bubble,
  button,
  composer,
  composerInput,
  disclosure,
  field,
  list,
  menu,
  note,
  setButton,
  slot,
} from "@open-motion/components";
import type { Artifact } from "@open-motion/workspace/contract";
import type { Editor } from "../../editor.js";
export class Conversation {
  private current = "";
  private drafts = new Map<string, { note: string; project: string; rename: string; original: string }>();
  private instruction: HTMLTextAreaElement;
  private project: HTMLInputElement;
  private rename: HTMLInputElement;
  private heading: HTMLElement;
  private messages: HTMLOListElement;
  private artifacts: HTMLElement;
  private create: HTMLButtonElement;
  private send: HTMLButtonElement;
  private renameButton: HTMLButtonElement;
  private settings: ReturnType<typeof disclosure>;
  private creation: ReturnType<typeof disclosure>;
  private actionsMenu: ReturnType<typeof menu>;
  private messageNodes = new Map<string, HTMLElement>();
  private cards = new Map<string, HTMLButtonElement>();
  private sessionSettings = new Map<string, { creation: boolean; settings: boolean; scroll: number }>();
  private scroll: HTMLElement;
  constructor(
    private root: HTMLElement,
    private actions: {
      append(text: string): void;
      create(title: string): void;
      rename(title: string): void;
      open(artifact: Artifact): void;
    },
  ) {
    const document = root.ownerDocument,
      header = slot(document, "header"),
      content = slot(document, "content"),
      compose = composer(document);
    this.heading = slot(document, "title");
    this.scroll = slot(document, "fill");
    this.messages = list(document, "消息列表");
    this.artifacts = slot(document, "stack");
    this.project = document.createElement("input");
    this.project.setAttribute("aria-label", "工程标题");
    this.project.placeholder = "为新工程命名";
    this.rename = document.createElement("input");
    this.rename.setAttribute("aria-label", "会话名称");
    this.instruction = composerInput(document);
    this.instruction.setAttribute("aria-label", "消息");
    this.instruction.placeholder = "描述你想创作的内容…";
    this.settings = disclosure(document, "会话设置");
    this.creation = disclosure(document, "新建工程");
    this.create = button(document, {
      label: "创建工程",
      icon: "plus",
      compact: true,
      onClick: () => actions.create(this.project.value),
    });
    this.renameButton = button(document, {
      label: "重命名会话",
      compact: true,
      onClick: () => actions.rename(this.rename.value),
    });
    this.send = button(document, {
      label: "追加消息",
      icon: "send",
      iconOnly: true,
      primary: true,
      onClick: () => actions.append(this.instruction.value),
    });
    this.actionsMenu = menu(document, {
      label: "会话操作",
      actions: [
        { id: "rename", label: "编辑会话名称", icon: "pencil", run: () => this.editName() },
        { id: "project", label: "新建影片工程", icon: "plus", run: () => this.newProject() },
      ],
    });
    header.append(this.heading, this.actionsMenu.element);
    this.settings.body.append(field(document, "会话名称", this.rename), this.renameButton);
    this.creation.body.append(field(document, "工程标题", this.project), this.create);
    content.append(this.messages, this.artifacts, this.creation.element, this.settings.element);
    this.scroll.append(content);
    compose.body.append(field(document, "消息", this.instruction, false, true));
    compose.footer.append(badge(document, "输入用途", "创作笔记"), this.send);
    root.append(header, this.scroll, compose.element);
    const save = () => {
      const draft = this.drafts.get(this.current);
      if (draft) {
        draft.note = this.instruction.value;
        draft.project = this.project.value;
        draft.rename = this.rename.value;
      }
    };
    this.instruction.oninput = this.project.oninput = this.rename.oninput = save;
    this.creation.element.ontoggle = () => {
      const state = this.sessionSettings.get(this.current);
      if (state) state.creation = this.creation.element.open;
      this.creation.element.hidden = !this.creation.element.open;
    };
    this.settings.element.ontoggle = () => {
      const state = this.sessionSettings.get(this.current);
      if (state) state.settings = this.settings.element.open;
      this.settings.element.hidden = !this.settings.element.open;
    };
  }
  editName() {
    this.settings.element.hidden = false;
    this.settings.element.open = true;
    this.rename.focus();
  }
  newProject() {
    this.creation.element.hidden = false;
    this.creation.element.open = true;
    this.project.focus();
  }
  appended(text: string) {
    const d = this.drafts.get(this.current);
    if (d?.note === text) {
      d.note = "";
      this.instruction.value = "";
    }
  }
  created(text: string) {
    const d = this.drafts.get(this.current);
    if (d?.project === text) {
      d.project = "";
      this.project.value = "";
    }
    this.creation.element.open = false;
  }
  renamed() {
    this.settings.element.open = false;
  }
  update(editor: Editor, blocked: boolean) {
    const session = editor.session,
      id = session?.id ?? "";
    const switched = this.current !== id;
    if (switched) {
      const previous = this.sessionSettings.get(this.current);
      if (previous) previous.scroll = this.scroll.scrollTop;
      this.current = id;
      if (!this.drafts.has(id))
        this.drafts.set(id, { note: "", project: "", rename: session?.title ?? "", original: session?.title ?? "" });
      if (!this.sessionSettings.has(id))
        this.sessionSettings.set(id, { creation: !!session && !session.artifacts.length, settings: false, scroll: 0 });
      const draft = this.drafts.get(id),
        state = this.sessionSettings.get(id);
      this.instruction.value = draft?.note ?? "";
      this.project.value = draft?.project ?? "";
      this.rename.value = draft?.rename ?? session?.title ?? "";
      this.creation.element.open = state?.creation ?? false;
      this.settings.element.open = state?.settings ?? false;
    }
    const draft = this.drafts.get(id);
    if (draft && draft.original !== session?.title) {
      if (draft.rename === draft.original) {
        draft.rename = session?.title ?? "";
        this.rename.value = draft.rename;
      }
      draft.original = session?.title ?? "";
    }
    this.heading.textContent = session?.title ?? "开始创作";
    for (const control of [this.instruction, this.project, this.rename]) {
      control.disabled = !session;
      control.readOnly = blocked;
    }
    this.create.disabled = this.renameButton.disabled = this.send.disabled = blocked || !session;
    this.actionsMenu.update(blocked || !session);
    this.creation.element.hidden = !this.creation.element.open;
    this.settings.element.hidden = !this.settings.element.open;
    const messages = session?.messages ?? [];
    for (const [key, node] of this.messageNodes)
      if (!messages.some((m) => m.id === key)) {
        node.remove();
        this.messageNodes.delete(key);
      }
    for (const message of messages)
      if (!this.messageNodes.has(message.id)) {
        const node = bubble(this.root.ownerDocument, {
          author: message.role === "user" ? "我" : "Agent",
          text: message.content,
          incoming: message.role !== "user",
        });
        this.messageNodes.set(message.id, node);
        this.messages.append(node);
      }
    for (const [key, node] of this.cards)
      if (!session?.artifacts.some((a) => a.id === key)) {
        node.remove();
        this.cards.delete(key);
      }
    for (const artifact of session?.artifacts ?? []) {
      let card = this.cards.get(artifact.id);
      if (!card) {
        card = button(this.root.ownerDocument, { label: artifact.title });
        this.cards.set(artifact.id, card);
        this.artifacts.append(card);
      }
      setButton(card, {
        label: artifact.title,
        detail: "Motion 工程",
        icon: "film",
        variant: "card",
        disabled: blocked,
        onClick: () => this.actions.open(artifact),
      });
    }
    this.artifacts.querySelector("p")?.remove();
    if (!session?.artifacts.length && !messages.length)
      this.artifacts.append(note(this.root.ownerDocument, "写下创作需求，建立你的第一个影片工程。"));
    if (switched) this.scroll.scrollTop = this.sessionSettings.get(id)?.scroll ?? 0;
  }
  dispose() {
    this.actionsMenu.dispose();
  }
}
