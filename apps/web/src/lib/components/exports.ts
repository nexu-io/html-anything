import { button, disclosure, note, readout, setButton, slot } from "@open-motion/components";
import type { Job } from "@open-motion/render/contract";
import type { Project } from "@open-motion/workspace/contract";
import type { Client } from "../../api.js";
import type { Editor } from "../editor.js";

const labels: Record<Job["state"], string> = {
  queued: "等待中",
  preparing: "准备资源",
  capturing: "渲染中",
  encoding: "编码中",
  verifying: "校验中",
  cancelling: "停止中",
  succeeded: "已完成",
  failed: "失败",
  cancelled: "已取消",
  interrupted: "已中断",
  recovering: "等待恢复",
};
/** Business projection only. Closing this panel never cancels an accepted service-owned job. */
export class Exports {
  readonly element: HTMLDetailsElement;
  private create: HTMLButtonElement;
  private rows: HTMLElement;
  private next?: string;
  private before?: string;
  private cursors: (string | undefined)[] = [];
  private previousButton: HTMLButtonElement;
  private nextButton: HTMLButtonElement;
  private status: HTMLOutputElement;
  private owner?: { sessionId: string; artifactId: string };
  private key = "";
  private signature = "";
  private blocked = true;
  private disposed = false;
  private timer?: ReturnType<typeof setTimeout>;
  private flight = Promise.resolve();
  private submissions = new Map<
    string,
    { requestId: string; sessionId: string; artifactId: string; revision: string; fps: { num: number; den: number } }
  >();
  constructor(
    private document: Document,
    private editor: Editor,
    private client: Client,
    private run: (action: () => Promise<void>) => void,
  ) {
    const view = disclosure(document, "影片导出", false);
    this.element = view.element;
    this.element.setAttribute("aria-label", "影片导出");
    this.rows = slot(document, "content");
    this.status = readout(document, "导出状态", "");
    this.status.setAttribute("aria-live", "polite");
    this.create = button(document, {
      label: "导出 MP4（30fps）",
      icon: "film",
      compact: true,
      onClick: () => this.run(() => this.submit()),
    });
    const navigation = slot(document, "toolbar");
    this.previousButton = button(document, {
      label: "上一页导出",
      compact: true,
      disabled: true,
      onClick: () => {
        this.before = this.cursors.pop();
        this.signature = "";
        this.refresh();
      },
    });
    this.nextButton = button(document, {
      label: "下一页导出",
      compact: true,
      disabled: true,
      onClick: () => {
        if (!this.next) return;
        this.cursors.push(this.before);
        this.before = this.next;
        this.signature = "";
        this.refresh();
      },
    });
    navigation.append(this.previousButton, this.nextButton);
    view.body.append(this.create, this.status, this.rows, navigation);
  }
  update(project: Project | null | undefined, blocked: boolean) {
    this.blocked = blocked;
    const key = project ? `${project.sessionId}:${project.artifactId}` : "";
    setButton(this.create, {
      label: this.submissions.has(key) ? "重试导出提交" : "导出 MP4（30fps）",
      icon: "film",
      compact: true,
      disabled: blocked || !project,
      onClick: () => this.run(() => this.submit()),
    });
    if (key === this.key) return;
    this.key = key;
    this.before = undefined;
    this.next = undefined;
    this.cursors = [];
    this.signature = "";
    this.owner = project ? { sessionId: project.sessionId, artifactId: project.artifactId } : undefined;
    this.rows.replaceChildren();
    this.status.value = "";
    clearTimeout(this.timer);
    this.refresh();
  }
  private async submit() {
    await this.editor.save();
    const project = this.editor.project;
    if (!project) throw Error("请先打开工程");
    const key = `${project.sessionId}:${project.artifactId}`;
    let input = this.submissions.get(key);
    if (!input) {
      input = {
        requestId: crypto.randomUUID(),
        sessionId: project.sessionId,
        artifactId: project.artifactId,
        revision: project.revision,
        fps: { num: 30, den: 1 },
      };
      this.submissions.set(key, input);
    }
    await this.client.execute("export_create", input);
    this.submissions.delete(key);
    this.element.open = true;
    this.signature = "";
    this.refresh();
  }
  private refresh() {
    clearTimeout(this.timer);
    const owner = this.owner,
      key = this.key;
    if (!owner || this.disposed) return;
    this.flight = this.flight.then(async () => {
      if (this.disposed || key !== this.key) return;
      try {
        const { jobs, next } = await this.client.execute("export_list", { ...owner, before: this.before });
        this.next = next ?? undefined;
        this.previousButton.disabled = this.cursors.length === 0;
        this.nextButton.disabled = !next;
        if (this.disposed || key !== this.key) return;
        this.status.value = jobs.length ? `${jobs.length} 条导出记录` : "尚无导出记录";
        const signature = JSON.stringify(jobs);
        if (signature !== this.signature) {
          this.signature = signature;
          this.rows.replaceChildren(...jobs.map((j) => this.row(j)));
        }
      } catch (e) {
        if (!this.disposed && key === this.key) this.status.value = (e as Error).message;
      }
      if (!this.disposed && key === this.key) this.timer = setTimeout(() => this.refresh(), 750);
    });
  }
  private row(job: Job) {
    const row = slot(this.document, "toolbar");
    row.setAttribute("data-export-id", job.id);
    row.setAttribute("data-export-state", job.state);
    row.append(note(this.document, `${labels[job.state]} · ${job.revision.slice(7, 19)}`));
    if (job.error) row.append(note(this.document, job.error));
    const owner = { id: job.id, sessionId: job.sessionId, artifactId: job.artifactId },
      command = { ...owner, requestId: crypto.randomUUID(), expectedVersion: job.version };
    if (["queued", "preparing", "capturing", "encoding", "verifying"].includes(job.state)) {
      row.append(
        button(this.document, {
          label: "取消导出",
          compact: true,
          onClick: () =>
            this.run(async () => {
              await this.client.execute("export_cancel", command);
              this.signature = "";
              this.refresh();
            }),
        }),
      );
    }
    if (["failed", "cancelled", "interrupted"].includes(job.state)) {
      row.append(
        button(this.document, {
          label: "重试此导出",
          compact: true,
          onClick: () =>
            this.run(async () => {
              await this.client.execute("export_retry", command);
              this.signature = "";
              this.refresh();
            }),
        }),
      );
    }
    if (job.state === "succeeded")
      row.append(
        button(this.document, {
          label: "下载 MP4",
          compact: true,
          onClick: () =>
            this.run(async () => {
              const download = await this.client.execute("export_download", owner),
                anchor = this.document.createElement("a");
              anchor.href = download.url;
              anchor.download = download.filename;
              anchor.referrerPolicy = "no-referrer";
              this.element.append(anchor);
              anchor.click();
              anchor.remove();
            }),
        }),
      );
    return row;
  }
  async dispose() {
    this.disposed = true;
    clearTimeout(this.timer);
    await this.flight;
    this.element.remove();
  }
}
