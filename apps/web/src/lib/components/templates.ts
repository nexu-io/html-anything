import { button, disclosure, field, note, slot } from "@open-motion/components";
import type { Descriptor } from "@open-motion/templates/contract";
import type { Client } from "../../api.js";

/** Product selection only. Workspace owns creation; entry remains a separate checked operation. */
export class Templates {
  readonly element: HTMLDetailsElement;
  private select: HTMLSelectElement;
  private title: HTMLInputElement;
  private description: HTMLElement;
  private create: HTMLButtonElement;
  private refresh: HTMLButtonElement;
  private catalog?: Descriptor[];
  private flight?: Promise<void>;
  private disposed = false;
  private session?: string;
  private blocked = true;
  private drafts = new Map<string, { id: string; title: string }>();
  constructor(
    private document: Document,
    private client: Client,
    create: (template: Descriptor, title: string) => void,
  ) {
    const view = disclosure(document, "从模板创建", false);
    this.element = view.element;
    this.element.setAttribute("aria-label", "原生模板");
    this.select = document.createElement("select");
    this.select.setAttribute("aria-label", "模板");
    this.title = document.createElement("input");
    this.title.setAttribute("aria-label", "模板工程标题");
    this.title.maxLength = 120;
    this.description = note(document, "选择模板并创建独立的可编辑工程");
    this.create = button(document, {
      label: "创建模板工程",
      icon: "plus",
      compact: true,
      disabled: true,
      onClick: () => {
        const template = this.catalog?.find((entry) => entry.id === this.select.value);
        if (template && this.session && !this.blocked) create(template, this.title.value.trim() || template.title);
      },
    });
    this.refresh = button(document, { label: "刷新模板", compact: true, onClick: () => this.load() });
    const actions = slot(document, "toolbar");
    actions.append(this.create, this.refresh);
    view.body.append(
      field(document, "模板", this.select),
      field(document, "工程标题", this.title),
      this.description,
      actions,
    );
    this.select.onchange = () => {
      this.remember();
      this.render();
    };
    this.title.oninput = () => this.remember();
    this.element.ontoggle = () => {
      if (this.element.open && !this.catalog) this.load();
    };
  }
  private remember() {
    if (this.session) this.drafts.set(this.session, { id: this.select.value, title: this.title.value });
  }
  update(session: string | undefined, blocked: boolean) {
    if (session !== this.session) {
      this.remember();
      this.session = session;
      const draft = session && this.drafts.get(session);
      this.select.value = draft ? draft.id : (this.catalog?.[0]?.id ?? "");
      this.title.value = draft ? draft.title : "";
    }
    this.blocked = blocked;
    this.render();
  }
  private render() {
    const template = this.catalog?.find((entry) => entry.id === this.select.value);
    this.select.disabled = this.blocked || !this.session || !this.catalog || !!this.flight;
    this.title.disabled = this.blocked || !this.session;
    this.create.disabled = this.blocked || !this.session || !template || !!this.flight;
    this.refresh.disabled = this.blocked || !!this.flight;
    if (template)
      this.description.textContent = `${template.description} · ${template.duration} 秒 · ${template.width} × ${template.height}`;
  }
  private load() {
    if (this.flight || this.disposed) return;
    this.flight = (async () => {
      try {
        const result = await this.client.execute("template_list", {});
        if (this.disposed) return;
        const selected = this.select.value;
        this.catalog = result.templates;
        this.select.replaceChildren(
          ...result.templates.map((template) => {
            const option = this.document.createElement("option");
            option.value = template.id;
            option.textContent = template.title;
            return option;
          }),
        );
        this.select.value = result.templates.some((entry) => entry.id === selected)
          ? selected
          : (result.templates[0]?.id ?? "");
      } catch (error) {
        if (!this.disposed) this.description.textContent = (error as Error).message;
      } finally {
        this.flight = undefined;
        if (!this.disposed) this.render();
      }
    })();
    this.render();
  }
  created() {
    this.title.value = "";
    this.remember();
  }
  async dispose() {
    this.disposed = true;
    await this.flight;
    this.element.remove();
  }
}
