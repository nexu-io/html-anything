import { archiveLimits, type Input, type Operation, type Output } from "@open-motion/daemon/contract";
import {
  type Artifact,
  changeSources,
  Fault,
  initialFiles,
  mergeSources,
  type Project,
  type Selection,
  type SessionDetail,
  type SourceChange,
  type SourceChoice,
  type State,
  type WorkspaceView,
} from "@open-motion/workspace/contract";
import type { Client } from "../api.js";
import { EntryLoader } from "./entry.js";
import { observedView } from "./observe.js";
export class Editor {
  state: State = { sessions: [], selection: { revision: 0, sessionId: null, artifactId: null } };
  session: SessionDetail | null = null;
  project: Project | null = null;
  draft = "";
  dirty = false;
  private fileDrafts = new Map<string, string | null>();
  initialized = false;
  incoming?: WorkspaceView & { token: string };
  private observedToken?: string;
  private observation = 0;
  private returnIntent?: { input: Omit<Input<"artifact_open">, "requestId">; state: State };
  drafts?: { flush(): Promise<void>; dirty(): boolean; discard(): void };
  private archive?: { file: File; input: Input<"archive_import">; upload: Input<"archive_upload"> };
  private pending?: { signature: string; requestId: string };
  private entry?: EntryLoader;
  private refresh?: () => Promise<void>;
  get unconfirmed() {
    return !!this.pending || !!this.refresh || !!this.archive || !!this.entry?.pending;
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
      if (error instanceof Fault && error.code !== "integrity") this.pending = undefined;
      throw error;
    }
  }
  private async hydrate(state: State, target?: EntryLoader["target"]) {
    const selected = state.selection;
    const session = selected.sessionId
      ? await this.client.execute("session_get", { sessionId: selected.sessionId })
      : null;
    const project =
      selected.sessionId && selected.artifactId
        ? await this.client.execute("project_read", { sessionId: selected.sessionId, artifactId: selected.artifactId })
        : null;
    if (
      target &&
      (!project ||
        project.sessionId !== target.sessionId ||
        project.artifactId !== target.artifactId ||
        project.revision !== target.revision ||
        project.history.version !== target.historyVersion)
    )
      throw new Error("entry target changed before display; request a fresh explicit entry");
    this.state = state;
    this.session = session;
    this.project = project;
    this.draft = project?.files.find((file) => file.path === "index.html")?.content ?? "";
    this.fileDrafts.clear();
    this.dirty = false;
    this.incoming = undefined;
    this.observedToken = undefined;
    this.initialized = true;
  }
  async load(fragment?: string) {
    if (this.pending || this.refresh || this.archive) throw new Error("先确认尚未完成的操作，再进入工程");
    if (this.dirty || this.drafts?.dirty()) throw new Error("请先保存当前源文件，或明确放弃本地修改");
    if (fragment) {
      if (this.entry?.pending && this.entry.fragment !== fragment) throw new Error("confirm the pending entry first");
      if (this.entry?.fragment !== fragment) this.entry = new EntryLoader(fragment, this.client);
      await this.hydrate(await this.entry.load(), this.entry.target);
    } else {
      if (this.entry?.pending) throw new Error("confirm the pending entry first");
      await this.hydrate(await this.client.execute("workspace_state", {}));
    }
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
      : this.fileDrafts.has(path)
        ? (this.fileDrafts.get(path) ?? "")
        : (this.project?.files.find((f) => f.path === path)?.content ?? "");
  }
  editFile(path: string, content: string) {
    if (path === "index.html") return this.edit(content);
    const original = this.project?.files.find((f) => f.path === path);
    if (!original && !this.fileDrafts.has(path)) throw new Error("source file is missing");
    if (original?.content === content) this.fileDrafts.delete(path);
    else this.fileDrafts.set(path, content);
    this.edit(this.draft);
  }
  get sources() {
    const files = new Map(this.project?.files.map((file) => [file.path, this.source(file.path)]));
    for (const [path, content] of this.fileDrafts) {
      if (content === null) files.delete(path);
      else files.set(path, content);
    }
    return [...files]
      .map(([path, content]) => ({ path, content }))
      .sort((a, b) => (a.path < b.path ? -1 : a.path > b.path ? 1 : 0));
  }
  private writable() {
    if (this.incoming) throw Error("请先处理外部修改，再继续写入");
  }
  private install(view: WorkspaceView) {
    this.initialized = true;
    this.state = view.state;
    this.session = view.session;
    this.project = view.project;
    this.draft = view.project?.files.find((file) => file.path === "index.html")?.content ?? "";
    this.fileDrafts.clear();
    this.dirty = false;
    this.incoming = undefined;
  }
  async observe(signal?: AbortSignal, accept = () => true) {
    if (this.unconfirmed || !this.initialized) return false;
    const observation = ++this.observation;
    const before = { project: this.project, state: this.state, session: this.session };
    const head = await this.client.execute("workspace_observe", {}, signal);
    if (head.token === this.observedToken) return false;
    const view = await observedView(this.client, head, signal);
    if (
      !view ||
      observation !== this.observation ||
      !accept() ||
      this.unconfirmed ||
      this.project !== before.project ||
      this.state !== before.state ||
      this.session !== before.session
    )
      return false;
    this.observedToken = head.token;
    const same = this.project?.artifactId === view.project?.artifactId && this.session?.id === view.session?.id;
    const changed =
      this.project?.revision !== view.project?.revision ||
      this.project?.history.version !== view.project?.history.version;
    if (same && !changed) {
      this.state = view.state;
      this.session = view.session;
      this.incoming = undefined;
    } else if (same && !this.dirty && !this.drafts?.dirty()) this.install(view);
    else this.incoming = { ...view, token: head.token };
    return true;
  }
  async prepareExternal() {
    if (this.unconfirmed || !this.incoming) throw Error("先确认当前操作和外部修改");
    const before = this.project,
      incoming = this.incoming;
    await this.drafts?.flush();
    if (this.project !== before || this.incoming !== incoming) throw Error("合并上下文已变化，请重试");
  }
  reconcile(token: string, choices: Record<string, SourceChoice>) {
    const incoming = this.incoming,
      remote = incoming?.project;
    if (
      this.unconfirmed ||
      incoming?.token !== token ||
      !remote ||
      !this.project ||
      remote.artifactId !== this.project.artifactId ||
      remote.sessionId !== this.project.sessionId
    )
      throw Error("外部修改上下文已变化");
    if (this.drafts?.dirty()) throw Error("先准备本地属性草稿，再合并");
    const local = mergeSources(this.project.files, this.sources, remote.files, choices);
    if (local.conflicts.length) throw Error("请逐个选择冲突文件的内容");
    this.install(incoming);
    this.draft = local.files.find((file) => file.path === "index.html")?.content ?? "";
    const values = new Map(local.files.map((file) => [file.path, file.content]));
    for (const path of new Set([...remote.files, ...local.files].map((file) => file.path))) {
      if (path === "index.html") continue;
      if (remote.files.find((file) => file.path === path)?.content !== values.get(path))
        this.fileDrafts.set(path, values.get(path) ?? null);
    }
    this.edit(this.draft);
  }
  async useExternal() {
    if (this.unconfirmed) throw Error("先重试尚未确认的操作");
    const head = await this.client.execute("workspace_observe", {}),
      view = await observedView(this.client, head);
    if (!view || this.unconfirmed) throw Error("工作区在读取期间变化，请重试");
    this.drafts?.discard();
    this.install(view);
    this.observedToken = head.token;
  }
  async retainContext() {
    const local = this.project;
    if (!local || (!this.returnIntent && (this.unconfirmed || !this.incoming))) throw Error("先确认当前工程和操作");
    if (!this.returnIntent) {
      const head = await this.client.execute("workspace_observe", {}),
        view = await observedView(this.client, head);
      if (!view || this.project !== local) throw Error("工作区在读取期间变化，请重试");
      this.returnIntent = {
        state: view.state,
        input: {
          sessionId: local.sessionId,
          artifactId: local.artifactId,
          expectedSelection: view.state.selection.revision,
          expectedCurrent: view.project
            ? { artifactId: view.project.artifactId, revision: view.project.revision }
            : null,
        },
      };
    }
    try {
      const selected = await this.mutate("artifact_open", this.returnIntent.input);
      this.state = { ...this.returnIntent.state, selection: selected };
      this.incoming = undefined;
      this.observedToken = undefined;
      this.returnIntent = undefined;
    } catch (error) {
      if (!this.unconfirmed) this.returnIntent = undefined;
      throw error;
    }
  }
  async rename(title: string) {
    this.writable();
    if (!this.session) throw new Error("先选择会话");
    const renamed = await this.mutate("session_rename", { sessionId: this.session.id, title });
    this.session = renamed;
    this.state.sessions = this.state.sessions.map((s) => (s.id === renamed.id ? renamed : s));
  }
  async save() {
    this.writable();
    await this.drafts?.flush();
    if (!this.project || !this.dirty) return;
    this.project = await this.mutate("project_save", {
      sessionId: this.project.sessionId,
      artifactId: this.project.artifactId,
      expectedRevision: this.project.revision,
      files: this.sources,
    });
    this.fileDrafts.clear();
    this.dirty = false;
  }
  async changeSource(change: SourceChange) {
    const owner = this.project;
    if (!owner) throw Error("先选择工程");
    changeSources(this.sources, change);
    await this.save();
    const project = this.project;
    if (!project || project.artifactId !== owner.artifactId || project.sessionId !== owner.sessionId)
      throw Error("源文件操作的工程上下文已改变");
    const files = changeSources(project.files, change);
    const next = await this.mutate("project_save", {
      sessionId: project.sessionId,
      artifactId: project.artifactId,
      expectedRevision: project.revision,
      files,
    });
    if (this.project !== project) throw Error("源文件保存期间工程上下文已改变，请刷新确认");
    this.project = next;
    this.draft = next.files.find((file) => file.path === "index.html")?.content ?? "";
    this.fileDrafts.clear();
    this.dirty = false;
  }
  /** Confirm an exact adoption receipt, then refresh authority without projecting its historical snapshot. */
  async adoptGeneration(input: Omit<Input<"generation_adopt">, "requestId">) {
    this.writable();
    const before = this.project,
      signature = JSON.stringify(["generation_adopt", input]);
    const replay = this.pending?.signature === signature;
    if (
      !replay &&
      (!before ||
        this.dirty ||
        this.drafts?.dirty() ||
        before.sessionId !== input.sessionId ||
        before.artifactId !== input.artifactId ||
        before.revision !== input.expectedRevision)
    )
      throw Error("采用候选的工程版本已改变或尚未保存");
    await this.mutate("generation_adopt", input);
    this.refresh = async () => {
      const current = this.project;
      const next = await this.client.execute("project_read", {
        sessionId: input.sessionId,
        artifactId: input.artifactId,
      });
      if (this.project !== current) return;
      if (!current || current.sessionId !== input.sessionId || current.artifactId !== input.artifactId) return;
      if (this.dirty || this.drafts?.dirty()) throw Error("采用已确认，请先处理本地源码草稿后刷新");
      if (next.history.version < current.history.version) throw Error("采用已确认，读取的工程版本已过期");
      this.project = next;
      this.draft = next.files.find((file) => file.path === "index.html")?.content ?? "";
      this.fileDrafts.clear();
    };
    await this.retryRefresh();
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
    this.writable();
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
    this.writable();
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
    if (this.unconfirmed) throw Error("先重试尚未确认的操作");
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
  async createArtifact(title: string, sessionId = this.session?.id) {
    if (!sessionId) throw new Error("先选择会话");
    await this.save();
    const artifact = await this.mutate("artifact_create", { sessionId, title, files: initialFiles() });
    if (this.session?.id === sessionId)
      this.session = {
        ...this.session,
        artifacts: [...this.session.artifacts.filter((item) => item.id !== artifact.id), artifact],
      };
    return artifact;
  }
  async createTemplate(title: string, id: string, contentHash: string, sessionId = this.session?.id) {
    if (!sessionId) throw new Error("先选择会话");
    await this.save();
    const artifact = await this.mutate("template_create", { sessionId, title, id, contentHash });
    if (this.session?.id === sessionId)
      this.session = {
        ...this.session,
        artifacts: [...this.session.artifacts.filter((item) => item.id !== artifact.id), artifact],
      };
    return artifact;
  }
  async createArchive(file: File, title: string) {
    if (!this.session) throw new Error("先选择会话");
    if (!this.archive) {
      await this.save();
      if (file.size < 22 || file.size > archiveLimits.bytes) throw Error("ZIP 大小超出支持范围");
      const hash = new Uint8Array(await crypto.subtle.digest("SHA-256", await file.arrayBuffer())),
        digest = `sha256:${Array.from(hash, (byte) => byte.toString(16).padStart(2, "0")).join("")}`;
      this.archive = {
        file,
        input: { requestId: crypto.randomUUID(), sessionId: this.session.id, title, digest },
        upload: { requestId: crypto.randomUUID(), digest, bytes: file.size },
      };
    }
    const intent = this.archive;
    if (intent.file !== file || intent.input.title !== title) throw Error("先重试尚未确认的 ZIP 导入");
    try {
      let result = await this.client.execute("archive_import", intent.input);
      if (!result.artifact) {
        const upload = await this.client.execute("archive_upload", intent.upload);
        await this.client.uploadArchive(upload, intent.file);
        result = await this.client.execute("archive_import", { ...intent.input, uploadId: upload.id });
      }
      if (!result.artifact) throw Error("ZIP 导入结果尚未确认");
      const artifact = result.artifact;
      this.session = {
        ...this.session,
        artifacts: [...this.session.artifacts.filter((item) => item.id !== artifact.id), artifact],
      };
      this.archive = undefined;
      return artifact;
    } catch (error) {
      if (error instanceof Fault && error.code !== "integrity") {
        this.archive = undefined;
        await this.client.execute("archive_release", { id: intent.upload.requestId }).catch(() => {});
      }
      throw error;
    }
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
    this.writable();
    if (!this.session) throw new Error("先选择会话");
    const message = await this.mutate("message_append", { sessionId: this.session.id, role: "user", content });
    this.session = {
      ...this.session,
      messages: [...this.session.messages.filter((item) => item.id !== message.id), message],
    };
  }
}
