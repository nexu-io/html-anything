import type { Input, Operation, Output } from "@open-motion/daemon/contract";
import {
  type Artifact,
  Fault,
  initialFiles,
  type Project,
  type Selection,
  type SessionDetail,
  type State,
} from "@open-motion/workspace/contract";
import type { Client } from "../api.js";
export class Editor {
  state: State = { sessions: [], selection: { revision: 0, sessionId: null, artifactId: null } };
  session: SessionDetail | null = null;
  project: Project | null = null;
  draft = "";
  dirty = false;
  private fileDrafts = new Map<string, string>();
  drafts?: { flush(): Promise<void>; dirty(): boolean; discard(): void };
  private pending?: { signature: string; requestId: string };
  private refresh?: () => Promise<void>;
  get unconfirmed() {
    return !!this.pending || !!this.refresh;
  }
  get needsRefresh() {
    return !!this.refresh;
  }
  constructor(private client: Client) {}
  private current() {
    return this.project ? { artifactId: this.project.artifactId, revision: this.project.revision } : null;
  }
  private async mutate<K extends Operation>(operation: K, input: Omit<Input<K>, "requestId">): Promise<Output<K>> {
    const signature = JSON.stringify([operation, input]);
    if (this.pending && this.pending.signature !== signature) throw new Error("先重试尚未确认的操作");
    this.pending ??= { signature, requestId: crypto.randomUUID() };
    try {
      const result = await this.client.execute(operation, { ...input, requestId: this.pending.requestId } as Input<K>);
      this.pending = undefined;
      return result;
    } catch (error) {
      if (error instanceof Fault) this.pending = undefined;
      throw error;
    }
  }
  private async hydrate(state: State) {
    const selected = state.selection;
    const session = selected.sessionId
      ? await this.client.execute("session_get", { sessionId: selected.sessionId })
      : null;
    const project =
      selected.sessionId && selected.artifactId
        ? await this.client.execute("project_read", { sessionId: selected.sessionId, artifactId: selected.artifactId })
        : null;
    this.state = state;
    this.session = session;
    this.project = project;
    this.draft = project?.files.find((file) => file.path === "index.html")?.content ?? "";
    this.fileDrafts.clear();
    this.dirty = false;
  }
  async load() {
    if (this.dirty || this.drafts?.dirty()) throw new Error("请先保存当前源文件，或明确放弃本地修改");
    await this.hydrate(await this.client.execute("workspace_state", {}));
  }
  private async selected(selection: Selection) {
    const state = { ...this.state, selection };
    this.refresh = () => this.hydrate(state);
    await this.retryRefresh();
  }
  async retryRefresh() {
    if (this.refresh) {
      await this.refresh();
      this.refresh = undefined;
    }
  }
  edit(content: string) {
    this.draft = content;
    this.dirty =
      this.fileDrafts.size > 0 ||
      (!!this.project && this.project.files.find((file) => file.path === "index.html")?.content !== content);
  }
  source(path: string): string {
    return path === "index.html"
      ? this.draft
      : (this.fileDrafts.get(path) ?? this.project?.files.find((f) => f.path === path)?.content ?? "");
  }
  editFile(path: string, content: string) {
    if (path === "index.html") return this.edit(content);
    const original = this.project?.files.find((f) => f.path === path);
    if (!original) throw new Error("source file is missing");
    if (original.content === content) this.fileDrafts.delete(path);
    else this.fileDrafts.set(path, content);
    this.edit(this.draft);
  }
  get sources() {
    return this.project?.files.map((file) => ({ ...file, content: this.source(file.path) })) ?? [];
  }
  async rename(title: string) {
    if (!this.session) throw new Error("先选择会话");
    const renamed = await this.mutate("session_rename", { sessionId: this.session.id, title });
    this.session = renamed;
    this.state.sessions = this.state.sessions.map((s) => (s.id === renamed.id ? renamed : s));
  }
  async save() {
    await this.drafts?.flush();
    if (!this.project || !this.dirty) return;
    this.project = await this.mutate("project_save", {
      sessionId: this.project.sessionId,
      artifactId: this.project.artifactId,
      expectedRevision: this.project.revision,
      files: this.project.files.map((file) => ({ ...file, content: this.source(file.path) })),
    });
    this.fileDrafts.clear();
    this.dirty = false;
  }
  async importResource(input: Omit<Input<"resource_import">, "requestId">) {
    this.project = await this.resourceChange("resource_import", input);
  }
  async removeResource(input: Omit<Input<"resource_remove">, "requestId">) {
    this.project = await this.resourceChange("resource_remove", input);
  }
  private async resourceChange<K extends "resource_import" | "resource_remove">(
    operation: K,
    input: Omit<Input<K>, "requestId">,
  ): Promise<Project> {
    const before = this.project;
    if (
      !before ||
      this.dirty ||
      this.drafts?.dirty() ||
      before.artifactId !== input.artifactId ||
      before.sessionId !== input.sessionId ||
      before.revision !== input.expectedRevision
    )
      throw new Error("资源操作的工程版本已过期或尚未保存");
    const result = await this.mutate(operation, input);
    if (this.project !== before) throw new Error("资源写入已确认，但本地工程上下文已改变");
    return result;
  }
  async history(direction: "project_undo" | "project_redo") {
    if (direction === "project_redo" && (this.dirty || this.drafts?.dirty())) throw new Error("先保存或放弃当前修改");
    if (direction === "project_undo") await this.save();
    if (!this.project) throw new Error("先打开工程");
    const next = await this.mutate(direction, {
      sessionId: this.project.sessionId,
      artifactId: this.project.artifactId,
      expectedRevision: this.project.revision,
      expectedHistory: this.project.history.version,
    });
    this.project = next;
    this.draft = next.files.find((f) => f.path === "index.html")?.content ?? "";
    this.fileDrafts.clear();
    this.dirty = false;
  }
  async discard() {
    this.drafts?.discard();
    this.fileDrafts.clear();
    this.dirty = false;
    await this.load();
  }
  async createSession(title: string) {
    await this.save();
    const session = await this.mutate("session_create", { title, mode: "motion" });
    this.state = {
      ...this.state,
      sessions: [...this.state.sessions.filter((item) => item.id !== session.id), session],
    };
    return session.id;
  }
  async createArtifact(title: string) {
    if (!this.session) throw new Error("先选择会话");
    await this.save();
    const artifact = await this.mutate("artifact_create", { sessionId: this.session.id, title, files: initialFiles() });
    this.session = {
      ...this.session,
      artifacts: [...this.session.artifacts.filter((item) => item.id !== artifact.id), artifact],
    };
    return artifact;
  }
  async createTemplate(title: string, id: string, contentHash: string) {
    if (!this.session) throw new Error("先选择会话");
    await this.save();
    const artifact = await this.mutate("template_create", { sessionId: this.session.id, title, id, contentHash });
    this.session = {
      ...this.session,
      artifacts: [...this.session.artifacts.filter((item) => item.id !== artifact.id), artifact],
    };
    return artifact;
  }
  async openSession(sessionId: string) {
    await this.save();
    await this.selected(
      await this.mutate("session_open", {
        sessionId,
        expectedSelection: this.state.selection.revision,
        expectedCurrent: this.current(),
      }),
    );
  }
  async openArtifact(artifact: Artifact) {
    await this.save();
    await this.selected(
      await this.mutate("artifact_open", {
        sessionId: artifact.sessionId,
        artifactId: artifact.id,
        expectedSelection: this.state.selection.revision,
        expectedCurrent: this.current(),
      }),
    );
  }
  async append(content: string) {
    if (!this.session) throw new Error("先选择会话");
    const message = await this.mutate("message_append", { sessionId: this.session.id, role: "user", content });
    this.session = {
      ...this.session,
      messages: [...this.session.messages.filter((item) => item.id !== message.id), message],
    };
  }
}
