import { button, disclosure, field, note, readout, setButton, slot } from "@open-motion/components";
import type { Candidate, GenerationInput, Job, Status } from "@open-motion/gateway/contract";
import { Fault, type Project } from "@open-motion/workspace/contract";
import type { Client } from "../../../../api.js";
import type { Editor } from "../../../editor.js";
import { GenerationTasks } from "./tasks.js";

type Draft = {
  key: string;
  sessionId: string;
  artifactId: string;
  prompt: string;
  model: string;
  input?: GenerationInput<"generation_create">;
};
const definite = (error: unknown) => error instanceof Fault && error.code !== "integrity";
const keyOf = (project: { sessionId: string; artifactId: string }) => `${project.sessionId}:${project.artifactId}`;
/** Service-owned durable tasks; this panel owns only drafts, exact retry inputs and ephemeral preview URLs. */
export class GenerationPanel {
  readonly element: HTMLDetailsElement;
  private prompt: HTMLTextAreaElement;
  private model: HTMLSelectElement;
  private create: HTMLButtonElement;
  private status: HTMLOutputElement;
  private configuration: HTMLOutputElement;
  private tasks: GenerationTasks;
  private drafts = new Map<string, Draft>();
  private cancellations = new Map<string, GenerationInput<"generation_cancel">>();
  private adoptions = new Map<string, Omit<GenerationInput<"generation_adopt">, "requestId">>();
  private key = "";
  private owner?: Draft;
  private catalog?: Status;
  private jobs: Job[] = [];
  private blocked = true;
  private disposed = false;
  private epoch = 0;
  private statusEpoch = 0;
  private before?: string;
  private next?: string;
  private cursors: (string | undefined)[] = [];
  private previous: HTMLButtonElement;
  private more: HTMLButtonElement;
  private timer?: ReturnType<typeof setTimeout>;
  private flight = Promise.resolve();
  private statusFlight = Promise.resolve();
  constructor(
    private document: Document,
    private editing: {
      editor: Editor;
      client: Client;
      run(action: () => Promise<void>): void;
    },
  ) {
    const view = disclosure(document, "生成 PNG 素材", false);
    this.element = view.element;
    this.element.setAttribute("aria-label", "PNG 素材生成");
    this.prompt = document.createElement("textarea");
    this.prompt.rows = 3;
    this.prompt.maxLength = 8000;
    this.prompt.setAttribute("aria-label", "图片描述");
    this.model = document.createElement("select");
    this.model.setAttribute("aria-label", "图片生成模型");
    this.prompt.addEventListener("input", () => {
      if (this.owner) this.owner.prompt = this.prompt.value;
      this.controls();
    });
    this.model.addEventListener("change", () => {
      if (this.owner) this.owner.model = this.model.value;
      this.controls();
    });
    this.create = button(document, {
      label: "生成新的 PNG 候选",
      onClick: () => {
        const owner = this.owner;
        if (owner) this.editing.run(() => this.submit(owner));
      },
    });
    this.status = readout(document, "素材任务状态", "");
    this.status.setAttribute("aria-live", "polite");
    this.configuration = readout(document, "素材生成配置", "读取配置中");
    const refresh = button(document, { label: "刷新图片模型", compact: true, onClick: () => this.loadStatus() });
    this.tasks = new GenerationTasks(document, editing.client, {
      cancel: (job) => this.editing.run(() => this.cancel(job)),
      adopt: (job, candidate) => this.editing.run(() => this.adopt(job, candidate)),
      cancelPending: (id) => this.cancellations.has(id),
    });
    this.previous = button(document, {
      label: "上一页素材任务",
      compact: true,
      onClick: () => {
        this.before = this.cursors.pop();
        this.refresh();
      },
    });
    this.more = button(document, {
      label: "下一页素材任务",
      compact: true,
      onClick: () => {
        if (!this.next) return;
        this.cursors.push(this.before);
        this.before = this.next;
        this.refresh();
      },
    });
    const paging = slot(document, "toolbar");
    paging.append(this.previous, this.more);
    view.body.append(
      this.configuration,
      refresh,
      field(document, "图片生成模型", this.model),
      field(document, "图片描述", this.prompt),
      this.create,
      note(document, "生成结果先保存为候选；明确采用后进入工程媒体，再通过“插入”参与作品。关闭面板不会取消任务。"),
      this.status,
      this.tasks.element,
      paging,
    );
    this.loadStatus();
    this.controls();
  }
  update(project: Project | null, blocked: boolean) {
    this.blocked = blocked;
    if (!this.editing.editor.unconfirmed) this.adoptions.clear();
    const key = project ? keyOf(project) : "";
    if (key !== this.key) {
      this.key = key;
      ++this.epoch;
      this.before = undefined;
      this.next = undefined;
      this.cursors = [];
      this.jobs = [];
      this.owner = project
        ? (this.drafts.get(key) ?? {
            key,
            sessionId: project.sessionId,
            artifactId: project.artifactId,
            prompt: "",
            model: "",
          })
        : undefined;
      if (this.owner) this.drafts.set(key, this.owner);
      this.prompt.value = this.owner?.prompt ?? "";
      this.status.value = "";
      this.modelOptions();
      this.refresh();
    }
    this.controls();
    this.tasks.update(key, this.jobs, project, blocked);
  }
  private modelOptions() {
    const selected = this.owner?.model ?? "";
    const choices = [new Option("请选择图片模型", "")];
    for (const provider of this.catalog?.providers ?? [])
      for (const model of provider.models)
        choices.push(
          new Option(
            `${model.label} · ${provider.id}@${provider.version}`,
            JSON.stringify([provider.id, provider.version, model.id]),
          ),
        );
    if (selected && !choices.some((option) => option.value === selected)) {
      const stale = new Option("已选择的模型版本当前不可用，请明确重新选择", selected);
      stale.disabled = true;
      choices.push(stale);
    }
    this.model.replaceChildren(...choices);
    this.model.value = selected;
  }
  private modelExists(value: string) {
    return (
      this.catalog?.configured &&
      this.catalog.providers.some((provider) =>
        provider.models.some((model) => JSON.stringify([provider.id, provider.version, model.id]) === value),
      )
    );
  }
  private controls() {
    const pending = this.owner?.input;
    this.prompt.disabled = this.blocked || !!pending || !this.owner;
    this.model.disabled = this.blocked || !!pending || !this.owner;
    setButton(this.create, {
      label: pending ? "重试同一素材提交" : "生成新的 PNG 候选",
      disabled:
        this.blocked || !this.owner || (!pending && (!this.owner.prompt.trim() || !this.modelExists(this.owner.model))),
      onClick: () => {
        const owner = this.owner;
        if (owner) this.editing.run(() => this.submit(owner));
      },
    });
    this.previous.disabled = this.cursors.length === 0;
    this.more.disabled = !this.next;
    if (pending) this.status.value = "提交结果待确认：将重试原请求，不会创建新的生成意图";
  }
  private loadStatus() {
    const epoch = ++this.statusEpoch;
    this.statusFlight = this.statusFlight.then(async () => {
      try {
        const status = await this.editing.client.execute("generation_status", {});
        if (this.disposed || epoch !== this.statusEpoch) return;
        this.catalog = status;
        this.configuration.value = status.configured
          ? "已显式配置供应商；实际生成结果以任务为准"
          : "未配置 PNG 生成供应商；已有任务、候选预览与采用仍可使用";
        this.modelOptions();
        this.controls();
      } catch (error) {
        if (!this.disposed && epoch === this.statusEpoch)
          this.configuration.value = `配置读取失败：${(error as Error).message}`;
      }
    });
  }
  private async submit(owner: Draft) {
    if (!owner.input) {
      if (keyOf(this.editing.editor.project ?? { sessionId: "", artifactId: "" }) !== owner.key)
        throw Error("素材发起工程已切换");
      if (!this.modelExists(owner.model)) throw Error("请选择当前可用的准确模型版本");
      await this.editing.editor.save();
      const project = this.editing.editor.project;
      if (!project || keyOf(project) !== owner.key) throw Error("保存期间素材发起工程已改变");
      const [providerId, providerVersion, modelId] = JSON.parse(owner.model) as [string, string, string];
      owner.input = {
        sessionId: owner.sessionId,
        artifactId: owner.artifactId,
        revision: project.revision,
        providerId,
        providerVersion,
        modelId,
        prompt: owner.prompt,
        requestId: crypto.randomUUID(),
      };
    }
    try {
      await this.editing.client.execute("generation_create", owner.input);
      owner.input = undefined;
      if (this.key === owner.key) {
        this.element.open = true;
        this.before = undefined;
        this.cursors = [];
        this.refresh();
      }
    } catch (error) {
      if (definite(error)) owner.input = undefined;
      throw error;
    } finally {
      this.controls();
    }
  }
  private async cancel(job: Job) {
    let command = this.cancellations.get(job.id);
    if (!command) {
      command = {
        sessionId: job.sessionId,
        artifactId: job.artifactId,
        id: job.id,
        expectedVersion: job.version,
        requestId: crypto.randomUUID(),
      };
      this.cancellations.set(job.id, command);
    }
    try {
      await this.editing.client.execute("generation_cancel", command);
      this.cancellations.delete(job.id);
      this.refresh();
    } catch (error) {
      if (definite(error)) this.cancellations.delete(job.id);
      throw error;
    }
  }
  private async adopt(job: Job, candidate: Candidate) {
    let command = this.adoptions.get(job.id);
    if (!command) {
      const before = this.editing.editor.project;
      if (!before || keyOf(before) !== keyOf(job)) throw Error("请回到候选所属工程后采用");
      await this.editing.editor.save();
      const project = this.editing.editor.project;
      if (!project || keyOf(project) !== keyOf(job)) throw Error("保存期间候选工程已切换");
      command = {
        sessionId: job.sessionId,
        artifactId: job.artifactId,
        id: job.id,
        expectedRevision: project.revision,
        path: `assets/generated-${job.id}.png`,
        name: `PNG ${job.id.slice(0, 8)}`,
        contentHash: candidate.contentHash,
      };
      this.adoptions.set(job.id, command);
    }
    try {
      await this.editing.editor.adoptGeneration(command);
      this.adoptions.delete(job.id);
    } catch (error) {
      if (definite(error)) this.adoptions.delete(job.id);
      throw error;
    }
  }
  private refresh() {
    clearTimeout(this.timer);
    const owner = this.owner,
      epoch = ++this.epoch,
      before = this.before;
    if (!owner || this.disposed) return;
    this.flight = this.flight.then(async () => {
      if (this.disposed || epoch !== this.epoch) return;
      try {
        const page = await this.editing.client.execute("generation_list", {
          sessionId: owner.sessionId,
          artifactId: owner.artifactId,
          before,
          limit: 8,
        });
        if (this.disposed || epoch !== this.epoch || owner.key !== this.key) return;
        this.jobs = page.jobs;
        this.next = page.next ?? undefined;
        if (!owner.input)
          this.status.value = page.jobs.length
            ? `${page.jobs.length} 条素材任务；采用与插入均需明确操作`
            : "尚无素材任务";
        this.tasks.update(this.key, this.jobs, this.editing.editor.project, this.blocked);
        this.controls();
      } catch (error) {
        if (!this.disposed && epoch === this.epoch) this.status.value = (error as Error).message;
      }
      if (!this.disposed && epoch === this.epoch) this.timer = setTimeout(() => this.refresh(), 1000);
    });
  }
  async dispose() {
    this.disposed = true;
    ++this.epoch;
    ++this.statusEpoch;
    clearTimeout(this.timer);
    await Promise.allSettled([this.flight, this.statusFlight, this.tasks.dispose()]);
  }
}
