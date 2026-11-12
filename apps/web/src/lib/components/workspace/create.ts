import { button, dialog, field, note, setButton, slot } from "@open-motion/components";
import type { Descriptor } from "@open-motion/templates/contract";
import type { Artifact } from "@open-motion/workspace/contract";
import type { Client } from "../../../api.js";
import type { Editor } from "../../editor.js";
import { Templates } from "../templates.js";

type Template = Pick<Descriptor, "id" | "contentHash">;
/** Presentation-local staged intent; each committed effect belongs to the existing workspace receipt. */
export class Creation {
  readonly view;
  private title: HTMLInputElement;
  private blank: HTMLButtonElement;
  private cancel: HTMLButtonElement;
  private message: HTMLElement;
  private templates: Templates;
  private intent?: { title: string; template?: Template; session?: string; artifact?: Artifact; opening?: boolean };
  get pending() {
    return !!this.intent;
  }
  constructor(
    document: Document,
    private editor: Editor,
    client: Client,
    private run: (action: () => Promise<void>) => void,
  ) {
    this.view = dialog(document, "新建项目");
    this.title = document.createElement("input");
    this.title.maxLength = 120;
    this.title.autofocus = true;
    this.title.setAttribute("aria-label", "项目标题");
    this.message = note(document, "创建独立项目，不会删除已有内容");
    this.blank = button(document, {
      label: "创建空白项目",
      primary: true,
      onClick: () => this.begin(this.title.value.trim() || "未命名项目"),
    });
    this.cancel = button(document, {
      label: "结束本次创建",
      onClick: () => {
        this.intent = undefined;
        this.view.close();
        this.run(async () => {});
      },
    });
    this.templates = new Templates(document, client, (template, title) => this.begin(title, template));
    const actions = slot(document, "toolbar");
    actions.append(this.blank, this.cancel);
    this.view.body.append(field(document, "项目标题", this.title), this.message, actions, this.templates.element);
  }
  open(trigger?: HTMLElement) {
    this.view.open(trigger);
  }
  private begin(title: string, template?: Template) {
    this.intent ??= { title, template };
    this.run(async () => {
      const intent = this.intent;
      if (!intent) return;
      intent.session ??= await this.editor.createSession(intent.title);
      intent.artifact ??= intent.template
        ? await this.editor.createTemplate(
            intent.title,
            intent.template.id,
            intent.template.contentHash,
            intent.session,
          )
        : await this.editor.createArtifact(intent.title, intent.session);
      if (intent.opening && this.editor.needsRefresh) await this.editor.retryRefresh();
      else {
        intent.opening = true;
        await this.editor.openArtifact(intent.artifact);
      }
      this.intent = undefined;
      this.title.value = "";
      this.templates.created();
      this.view.close();
    });
  }
  update(busy: boolean, blocked: boolean, message: string) {
    this.title.disabled = busy || blocked || this.pending;
    setButton(this.blank, {
      label: this.pending ? "继续创建" : "创建空白项目",
      primary: true,
      disabled: busy || (blocked && !this.pending),
      onClick: () => this.begin(this.title.value.trim() || "未命名项目"),
    });
    this.cancel.hidden = !this.pending;
    this.cancel.disabled = busy || this.editor.unconfirmed;
    this.templates.update(this.editor.session?.id, busy || blocked || this.pending);
    this.message.textContent = this.pending
      ? `${message} · 重试会确认原始创建，不会重复新建。结束本次创建会保留已提交的内容。`
      : "创建独立项目，不会删除已有内容";
  }
  async dispose() {
    await this.templates.dispose();
    this.view.dispose();
  }
}
