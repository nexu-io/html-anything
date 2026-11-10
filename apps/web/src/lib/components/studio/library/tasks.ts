import { button, imagePreview, note, readout, setButton, slot } from "@open-motion/components";
import type { Candidate, Job } from "@open-motion/gateway/contract";
import type { Project } from "@open-motion/workspace/contract";
import type { Client } from "../../../../api.js";

const labels: Record<Job["state"], string> = {
  queued: "等待中",
  submitting: "提交供应商",
  running: "生成中",
  cancelling: "取消确认中",
  succeeded: "候选已保存",
  failed: "生成失败",
  cancelled: "已取消",
  interrupted: "已中断",
};
/** Task projection and owned candidate preview only; never writes source or imports resources. */
export class GenerationTasks {
  readonly element: HTMLElement;
  private rows: HTMLElement;
  private image: HTMLImageElement;
  private status: HTMLOutputElement;
  private cards = new Map<
    string,
    {
      element: HTMLElement;
      text: HTMLElement;
      cancel: HTMLButtonElement;
      preview: HTMLButtonElement;
      adopt: HTMLButtonElement;
    }
  >();
  private owner = "";
  private epoch = 0;
  private url?: string;
  private selected = "";
  private disposed = false;
  private flights = new Set<Promise<void>>();
  constructor(
    private document: Document,
    private client: Client,
    private actions: {
      cancel(job: Job): void;
      adopt(job: Job, candidate: Candidate): void;
      cancelPending(id: string): boolean;
    },
  ) {
    this.element = slot(document, "content");
    this.rows = slot(document, "content");
    this.image = imagePreview(document, "生成的 PNG 候选");
    this.image.hidden = true;
    this.status = readout(document, "候选预览状态", "");
    this.status.setAttribute("aria-live", "polite");
    this.element.append(this.rows, this.status, this.image);
  }
  update(owner: string, jobs: Job[], project: Project | null, blocked: boolean) {
    if (owner !== this.owner) {
      this.owner = owner;
      ++this.epoch;
      this.selected = "";
      this.release();
      this.image.hidden = true;
      this.status.value = "";
      this.rows.replaceChildren();
      this.cards.clear();
    }
    const ids = new Set(jobs.map((job) => job.id));
    for (const [id, card] of this.cards)
      if (!ids.has(id)) {
        card.element.remove();
        this.cards.delete(id);
      }
    for (const job of jobs) {
      let card = this.cards.get(job.id);
      if (!card) {
        const element = slot(this.document, "content"),
          text = note(this.document, "");
        element.setAttribute("data-generation-id", job.id);
        const cancel = button(this.document, { label: "取消素材任务", compact: true });
        const preview = button(this.document, { label: "预览 PNG 候选", compact: true });
        const adopt = button(this.document, { label: "采用为工程资源", compact: true });
        element.append(text, cancel, preview, adopt);
        this.rows.append(element);
        card = { element, text, cancel, preview, adopt };
        this.cards.set(job.id, card);
      }
      card.element.setAttribute("data-generation-state", job.state);
      if (job.id === this.selected) card.element.setAttribute("aria-current", "true");
      else card.element.removeAttribute("aria-current");
      card.text.textContent = `${labels[job.state]} · ${job.providerId}@${job.providerVersion} / ${job.modelId} · ${job.prompt} · 发起版本 ${job.revision.slice(7, 19)}${job.submission === "unknown" ? " · 供应商提交结果未知，不会自动重发" : ""}${job.error ? ` · ${job.error}` : ""}`;
      const pending = this.actions.cancelPending(job.id);
      card.cancel.hidden = !pending && !["queued", "submitting", "running", "cancelling"].includes(job.state);
      setButton(card.cancel, {
        label: pending ? "重试同一取消请求" : "取消素材任务",
        compact: true,
        disabled: blocked || (!pending && job.state === "cancelling"),
        onClick: () => this.actions.cancel(job),
      });
      const candidate = job.candidate;
      card.preview.hidden = !candidate || job.state !== "succeeded";
      card.adopt.hidden = !candidate || job.state !== "succeeded";
      const adopted =
        candidate &&
        project?.resources.some(
          (asset) => asset.path === `assets/generated-${job.id}.png` && asset.digest === candidate.contentHash,
        );
      setButton(card.preview, {
        label: "预览 PNG 候选",
        compact: true,
        onClick: () => {
          const flight = this.preview(job);
          this.flights.add(flight);
          void flight.finally(() => this.flights.delete(flight));
        },
      });
      setButton(card.adopt, {
        label: adopted ? "已采用为工程资源" : "采用为工程资源",
        compact: true,
        disabled: blocked || !!adopted,
        onClick: () => {
          if (candidate) this.actions.adopt(job, candidate);
        },
      });
    }
  }
  private async preview(job: Job) {
    const epoch = ++this.epoch,
      owner = this.owner;
    this.selected = job.id;
    this.status.value = "读取候选中";
    let url: string | undefined;
    try {
      const result = await this.client.execute("generation_result", {
        sessionId: job.sessionId,
        artifactId: job.artifactId,
        id: job.id,
      });
      if (
        result.candidate.jobId !== job.id ||
        result.candidate.contentHash !== job.candidate?.contentHash ||
        result.candidate.type !== "image/png"
      )
        throw Error("候选校验信息已改变");
      if (result.data.length > Math.ceil((6 * 1024 * 1024) / 3) * 4) throw Error("候选数据超过约定上限");
      const bytes = Uint8Array.from(atob(result.data), (character) => character.charCodeAt(0));
      if (bytes.length !== result.candidate.bytes || !bytes.length || bytes.length > 6 * 1024 * 1024)
        throw Error("候选字节数不符合约定");
      url = URL.createObjectURL(new Blob([bytes], { type: "image/png" }));
      const probe = this.document.createElement("img");
      probe.src = url;
      await probe.decode();
      if (probe.naturalWidth !== result.candidate.width || probe.naturalHeight !== result.candidate.height)
        throw Error("候选解码尺寸不符合约定");
      if (this.disposed || epoch !== this.epoch || owner !== this.owner) return;
      this.release();
      this.url = url;
      url = undefined;
      this.image.src = this.url;
      this.image.alt = `PNG 候选：${job.prompt}`;
      this.image.hidden = false;
      this.status.value = `${result.candidate.width} × ${result.candidate.height} · ${(bytes.length / 1024).toFixed(1)} KiB · 尚未自动采用或插入`;
    } catch (error) {
      if (!this.disposed && epoch === this.epoch && owner === this.owner) this.status.value = (error as Error).message;
    } finally {
      if (url) URL.revokeObjectURL(url);
    }
  }
  private release() {
    if (this.url) URL.revokeObjectURL(this.url);
    this.url = undefined;
  }
  async dispose() {
    this.disposed = true;
    ++this.epoch;
    await Promise.allSettled([...this.flights]);
    this.release();
    this.image.removeAttribute("src");
  }
}
