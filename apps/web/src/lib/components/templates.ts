import { button, disclosure, field, note, slot } from "@open-motion/components";
import type { Descriptor, TemplateOutput } from "@open-motion/templates/contract";
import type { Client } from "../../api.js";

type Catalog = TemplateOutput<"template_list">;
type Entry = Descriptor | NonNullable<Catalog["catalog"]>["entries"][number];
type Selection = Pick<Descriptor, "id" | "contentHash">;

/** Product selection only; the exact source identity survives drafts and catalogue refresh. */
export class Templates {
  readonly element: HTMLDetailsElement;
  private select: HTMLSelectElement;
  private title: HTMLInputElement;
  private description: HTMLElement;
  private status: HTMLElement;
  private create: HTMLButtonElement;
  private refresh: HTMLButtonElement;
  private catalog?: Entry[];
  private selected?: Selection;
  private flight?: Promise<void>;
  private disposed = false;
  private session?: string;
  private blocked = true;
  private drafts = new Map<string, { selected?: Selection; title: string }>();
  constructor(
    private document: Document,
    private client: Client,
    create: (template: Pick<Descriptor, "id" | "contentHash" | "title">, title: string) => void,
  ) {
    const view = disclosure(document, "从模板创建", false);
    this.element = view.element;
    this.element.setAttribute("aria-label", "原生模板");
    this.select = document.createElement("select");
    this.select.setAttribute("aria-label", "模板");
    this.title = document.createElement("input");
    this.title.setAttribute("aria-label", "模板项目标题");
    this.title.maxLength = 120;
    this.description = note(document, "选择模板并创建独立的可编辑项目");
    this.status = note(document, "");
    this.status.setAttribute("aria-label", "模板目录状态");
    this.status.setAttribute("role", "status");
    this.create = button(document, {
      label: "创建模板项目",
      icon: "plus",
      compact: true,
      disabled: true,
      onClick: () => {
        const template = this.selection();
        if (template && !this.blocked && this.supported(template))
          create(template, this.title.value.trim() || template.title);
      },
    });
    this.refresh = button(document, { label: "刷新模板", compact: true, onClick: () => this.load() });
    const actions = slot(document, "toolbar");
    actions.append(this.create, this.refresh);
    view.body.append(
      this.status,
      field(document, "模板", this.select),
      field(document, "模板项目标题", this.title),
      this.description,
      actions,
    );
    this.select.onchange = () => {
      const entry = this.catalog?.find((item) => item.id === this.select.value);
      this.selected = entry && { id: entry.id, contentHash: entry.contentHash };
      this.remember();
      this.render();
    };
    this.title.oninput = () => this.remember();
    this.element.ontoggle = () => {
      if (this.element.open && !this.catalog) this.load();
    };
  }
  private supported(entry: Entry) {
    return !("availability" in entry) || entry.availability !== "unsupported";
  }
  private selection() {
    return this.catalog?.find(
      (entry) => entry.id === this.selected?.id && entry.contentHash === this.selected.contentHash,
    );
  }
  private remember() {
    if (this.session) this.drafts.set(this.session, { selected: this.selected, title: this.title.value });
  }
  update(session: string | undefined, blocked: boolean) {
    if (session !== this.session) {
      this.remember();
      this.session = session;
      const draft = session && this.drafts.get(session);
      this.selected = draft ? draft.selected : this.catalog?.[0];
      this.title.value = draft ? draft.title : "";
    }
    this.blocked = blocked;
    this.render();
  }
  private render() {
    const template = this.selection();
    this.select.value = template?.id ?? "";
    this.select.disabled = this.blocked || !this.catalog || !!this.flight;
    this.title.disabled = this.blocked;
    this.create.disabled = this.blocked || !template || !this.supported(template) || !!this.flight;
    this.refresh.disabled = this.blocked || !!this.flight;
    this.description.textContent = template
      ? "availability" in template
        ? `${template.description} · ${template.availability === "unsupported" ? `暂不支持：${template.reason ?? "资源类型未验证"}` : "创建时读取并验证源码，再确认画布与时长"}`
        : `${template.description} · ${template.duration} 秒 · ${template.width} × ${template.height}`
      : this.selected
        ? "所选模板版本已变化或不可用，请重新选择"
        : "选择模板并创建独立的可编辑项目";
  }
  private load() {
    if (this.flight || this.disposed) return;
    this.flight = (async () => {
      try {
        const result = await this.client.execute("template_list", {});
        if (this.disposed) return;
        const first = !this.catalog,
          entries: Entry[] = [...result.templates];
        for (const entry of result.catalog?.entries ?? [])
          if (!entries.some((ready) => ready.id === entry.id && ready.contentHash === entry.contentHash))
            entries.push(entry);
        this.catalog = entries;
        if (first && !this.selected) this.selected = entries[0];
        this.select.replaceChildren(
          ...entries.map((template) => {
            const option = this.document.createElement("option");
            option.value = template.id;
            option.textContent = `${template.title}${this.supported(template) ? "" : "（暂不支持）"}`;
            return option;
          }),
        );
        this.status.textContent = result.catalog
          ? `Prism ${result.catalog.publicationId}${result.catalog.stale ? " · 使用已验证缓存" : ""}${result.catalog.warning ? ` · ${result.catalog.warning}` : ""}`
          : result.catalogError
            ? `Prism 目录读取失败：${result.catalogError} · 可使用内置模板`
            : "内置模板";
      } catch (error) {
        if (!this.disposed) this.status.textContent = `目录读取失败：${(error as Error).message}`;
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
