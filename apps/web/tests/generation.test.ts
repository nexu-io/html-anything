import { createHash, randomUUID } from "node:crypto";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import type { GenerationInput, Job, Status } from "@open-motion/gateway/contract";
import { Fault, type Input, initialFiles, type Operation, Workspace } from "@open-motion/workspace";
import { expect, it, vi } from "vitest";
import { Client, Editor, type Transport } from "@";
import { GenerationPanel } from "@/lib/components/studio/library/generation.js";

const png =
  "iVBORw0KGgoAAAANSUhEUgAAACAAAAAYCAYAAACbU/80AAAAPklEQVR4AcXBMQEAIAzAsK5CuPEvChtMRpN5535CEpOYxCQmMYlJTGISk5jEJCYxiUlMYhKTmMQkJjGJSWwBYl8CWwMRvGQAAAAASUVORK5CYII=";
const pngHash = `sha256:${createHash("sha256").update(Buffer.from(png, "base64")).digest("hex")}`;
const reply = (value: unknown) => new Response(JSON.stringify(value));
const integrity = () =>
  new Response(JSON.stringify({ error: { code: "integrity", message: "receipt uncertain" } }), { status: 500 });
async function fixture(
  run: (context: {
    db: Workspace;
    editor: Editor;
    client: Client;
    calls: { operation: string; input: Record<string, unknown> }[];
    intercept(handler: (operation: string, input: Record<string, unknown>) => Promise<Response | undefined>): void;
  }) => Promise<void>,
) {
  const root = mkdtempSync(join(tmpdir(), "png-ui-")),
    db = new Workspace(root);
  const calls: { operation: string; input: Record<string, unknown> }[] = [];
  let handler: (operation: string, input: Record<string, unknown>) => Promise<Response | undefined> = async () =>
    undefined;
  const transport: Transport = async (url, init) => {
    const operation = String(url).split("/api/")[1] ?? "",
      input = JSON.parse(String(init?.body));
    calls.push({ operation, input });
    const intercepted = await handler(operation, input);
    if (intercepted) return intercepted;
    try {
      return reply(db.execute(operation as Operation, input as Input<Operation>));
    } catch (error) {
      return new Response(
        JSON.stringify({
          error: { code: error instanceof Fault ? error.code : "integrity", message: (error as Error).message },
        }),
        { status: 409 },
      );
    }
  };
  const client = new Client("http://127.0.0.1:4100", "fixture", transport),
    editor = new Editor(client);
  try {
    const session = db.execute("session_create", { requestId: randomUUID(), title: "Images", mode: "motion" });
    const artifact = db.execute("artifact_create", {
      requestId: randomUUID(),
      sessionId: session.id,
      title: "A",
      files: initialFiles(),
    });
    await editor.load();
    await editor.openArtifact(artifact);
    await run({
      db,
      editor,
      client,
      calls,
      intercept: (next) => {
        handler = next;
      },
    });
  } finally {
    db.close();
    rmSync(root, { recursive: true, force: true });
    document.body.replaceChildren();
  }
}
function choose(panel: GenerationPanel, prompt = "A new PNG") {
  const model = panel.element.querySelector("select");
  const description = panel.element.querySelector("textarea");
  if (!model || !description) throw Error("missing generation form");
  model.value = JSON.stringify(["fixture", "v1", "png"]);
  model.dispatchEvent(new Event("change"));
  description.value = prompt;
  description.dispatchEvent(new Event("input"));
}
function control(panel: GenerationPanel, label: string) {
  const found = [...panel.element.querySelectorAll("button")].find((button) => button.textContent === label);
  if (!found) throw Error(`missing ${label}`);
  return found;
}
const status: Status = {
  configured: true,
  providers: [{ id: "fixture", version: "v1", models: [{ id: "png", label: "Fixture PNG" }] }],
  limits: { active: 32, page: 16, pngBytes: 6291456, pngDimension: 4096 },
};
it("retains unknown creation input across model removal, A/B drafts and saved revision changes", () =>
  fixture(async ({ db, editor, client, calls, intercept }) => {
    const jobs: Job[] = [];
    let configured = true,
      lose = true;
    intercept(async (operation, raw) => {
      if (operation === "generation_status")
        return reply(configured ? status : { ...status, configured: false, providers: [] });
      if (operation === "generation_list")
        return reply({ jobs: jobs.filter((job) => job.artifactId === raw.artifactId), next: null });
      if (operation === "generation_create") {
        const input = raw as GenerationInput<"generation_create">;
        if (!jobs.length)
          jobs.push({
            ...input,
            id: randomUUID(),
            state: "queued",
            submission: "not-started",
            version: 0,
            createdAt: 1,
            updatedAt: 1,
          });
        if (lose) {
          lose = false;
          return integrity();
        }
        return reply(jobs[0]);
      }
    });
    const failures: unknown[] = [];
    let flight = Promise.resolve();
    let panel: GenerationPanel;
    const run = (action: () => Promise<void>) => {
      panel.update(editor.project, true);
      flight = action()
        .catch((error) => {
          failures.push(error);
        })
        .then(() => panel.update(editor.project, false));
    };
    panel = new GenerationPanel(document, { editor, client, run });
    document.body.append(panel.element);
    panel.update(editor.project, false);
    try {
      await vi.waitFor(() => expect(panel.element.querySelectorAll("option")).toHaveLength(2));
      choose(panel, "Keep the exact original intent");
      control(panel, "生成新的 PNG 候选").click();
      await flight;
      expect(failures).toHaveLength(1);
      expect(control(panel, "重试同一素材提交").disabled).toBe(false);
      expect(panel.element.querySelector("textarea")?.disabled).toBe(true);
      configured = false;
      control(panel, "刷新图片模型").click();
      await vi.waitFor(() => expect(panel.element.textContent).toContain("未配置 PNG"));
      expect(control(panel, "重试同一素材提交").disabled).toBe(false);
      const original = editor.project!;
      const originalArtifact = editor.session!.artifacts.find((entry) => entry.id === original.artifactId)!;
      editor.edit(`${editor.draft}\n<!-- newer committed revision -->`);
      await editor.save();
      const artifact = db.execute("artifact_create", {
        requestId: randomUUID(),
        sessionId: original.sessionId,
        title: "B",
        files: initialFiles(),
      });
      await editor.openArtifact(artifact);
      panel.update(editor.project, false);
      const text = panel.element.querySelector("textarea")!;
      text.value = "B draft";
      text.dispatchEvent(new Event("input"));
      await editor.openArtifact(originalArtifact);
      panel.update(editor.project, false);
      expect(panel.element.querySelector("textarea")?.value).toBe("Keep the exact original intent");
      control(panel, "重试同一素材提交").click();
      await flight;
      const submissions = calls.filter((call) => call.operation === "generation_create");
      expect(submissions).toHaveLength(2);
      expect(submissions[1]?.input).toEqual(submissions[0]?.input);
      expect(editor.project?.revision).not.toBe(original.revision);
      expect(jobs).toHaveLength(1);
      expect(editor.project?.files.find((file) => file.path === "index.html")?.content).toContain(
        "newer committed revision",
      );
      await editor.openArtifact(artifact);
      panel.update(editor.project, false);
      expect(panel.element.querySelector("textarea")?.value).toBe("B draft");
      expect(panel.element.textContent).not.toContain("Keep the exact original intent · 发起版本");
    } finally {
      await panel.dispose();
    }
  }));

it("confirms an integrity-unknown adoption with the original request before loading a newer authoritative revision", () =>
  fixture(async ({ db, editor, calls, intercept }) => {
    const before = editor.project!,
      adopted = new Map<string, unknown>();
    let lose = true;
    intercept(async (operation, raw) => {
      if (operation !== "generation_adopt") return;
      const input = raw as GenerationInput<"generation_adopt">;
      if (!adopted.has(input.requestId)) {
        const project = db.execute("resource_import", {
          requestId: input.requestId,
          sessionId: input.sessionId,
          artifactId: input.artifactId,
          expectedRevision: input.expectedRevision,
          path: input.path,
          name: input.name,
          data: png,
        });
        adopted.set(input.requestId, project);
        db.execute("project_save", {
          requestId: randomUUID(),
          sessionId: input.sessionId,
          artifactId: input.artifactId,
          expectedRevision: project.revision,
          files: project.files.map((file) => ({
            ...file,
            content: file.path === "index.html" ? `${file.content}\n<!-- external newer edit -->` : file.content,
          })),
        });
      }
      if (lose) {
        lose = false;
        return integrity();
      }
      return reply(adopted.get(input.requestId));
    });
    const input = {
      sessionId: before.sessionId,
      artifactId: before.artifactId,
      id: randomUUID(),
      expectedRevision: before.revision,
      path: "assets/generated.png",
      name: "Candidate",
      contentHash: pngHash,
    };
    await expect(editor.adoptGeneration(input)).rejects.toThrow("receipt uncertain");
    expect(editor.unconfirmed).toBe(true);
    await expect(editor.rename("conflicting intent")).rejects.toThrow("先重试");
    const newer = db.execute("project_read", { sessionId: before.sessionId, artifactId: before.artifactId });
    editor.project = newer;
    editor.draft = newer.files.find((file) => file.path === "index.html")!.content;
    await editor.adoptGeneration(input);
    expect(calls.filter((call) => call.operation === "generation_adopt").map((call) => call.input.requestId)).toEqual([
      ...adopted.keys(),
      ...adopted.keys(),
    ]);
    expect(editor.project?.revision).toBe(newer.revision);
    expect(editor.draft).toContain("external newer edit");
    expect(editor.project?.resources).toHaveLength(1);
    expect(editor.unconfirmed).toBe(false);
  }));

it("retries only authoritative reads after a confirmed adoption and protects drafts arriving during the read", () =>
  fixture(async ({ db, editor, calls, intercept }) => {
    const before = editor.project!;
    let readsFail = true,
      holdRead = false,
      entered = false,
      release = () => {};
    const gate = new Promise<void>((done) => {
      release = done;
    });
    intercept(async (operation, raw) => {
      if (operation === "generation_adopt")
        return reply(
          db.execute("resource_import", {
            sessionId: String(raw.sessionId),
            artifactId: String(raw.artifactId),
            requestId: String(raw.requestId),
            expectedRevision: String(raw.expectedRevision),
            path: String(raw.path),
            name: String(raw.name),
            data: png,
          }),
        );
      if (operation === "project_read" && readsFail) return integrity();
      if (operation === "project_read" && holdRead) {
        entered = true;
        await gate;
      }
    });
    const input = {
      sessionId: before.sessionId,
      artifactId: before.artifactId,
      id: randomUUID(),
      expectedRevision: before.revision,
      path: "assets/candidate.png",
      name: "Candidate",
      contentHash: pngHash,
    };
    await expect(editor.adoptGeneration(input)).rejects.toThrow("receipt uncertain");
    expect(editor.needsRefresh).toBe(true);
    readsFail = false;
    holdRead = true;
    const refresh = editor.retryRefresh();
    void refresh.catch(() => {});
    await vi.waitFor(() => expect(entered).toBe(true));
    editor.edit(`${editor.draft}\n<!-- unsaved local -->`);
    release();
    await expect(refresh).rejects.toThrow("本地源码草稿");
    holdRead = false;
    expect(editor.draft).toContain("unsaved local");
    editor.edit(before.files.find((file) => file.path === "index.html")!.content);
    await editor.retryRefresh();
    expect(calls.filter((call) => call.operation === "generation_adopt")).toHaveLength(1);
    expect(editor.project?.resources).toHaveLength(1);
    expect(editor.needsRefresh).toBe(false);
  }));

it("keeps provider uncertainty distinct from HTTP uncertainty and replays the exact cancellation", () =>
  fixture(async ({ editor, client, calls, intercept }) => {
    const project = editor.project!;
    let job: Job = {
      sessionId: project.sessionId,
      artifactId: project.artifactId,
      revision: project.revision,
      providerId: "fixture",
      providerVersion: "v1",
      modelId: "png",
      prompt: "Uncertain upstream",
      requestId: randomUUID(),
      id: randomUUID(),
      version: 0,
      state: "running",
      submission: "unknown",
      createdAt: 1,
      updatedAt: 1,
    };
    let lose = true;
    intercept(async (operation) => {
      if (operation === "generation_status") return reply(status);
      if (operation === "generation_list") return reply({ jobs: [job], next: null });
      if (operation === "generation_cancel") {
        if (lose) {
          lose = false;
          job = { ...job, state: "cancelling", version: 1 };
          return integrity();
        }
        job = { ...job, state: "cancelled", version: 2 };
        return reply(job);
      }
    });
    let flight = Promise.resolve();
    const failures: unknown[] = [];
    const panel = new GenerationPanel(document, {
      editor,
      client,
      run: (action) => {
        flight = action().catch((error) => {
          failures.push(error);
        });
      },
    });
    document.body.append(panel.element);
    panel.update(project, false);
    try {
      await vi.waitFor(() => expect(panel.element.textContent).toContain("供应商提交结果未知"));
      expect(control(panel, "生成新的 PNG 候选").disabled).toBe(true);
      expect(calls.filter((call) => call.operation === "generation_create")).toHaveLength(0);
      control(panel, "取消素材任务").click();
      await flight;
      expect(failures).toHaveLength(1);
      await vi.waitFor(() => expect(panel.element.textContent).toContain("取消确认中"));
      expect(panel.element.textContent).not.toContain("已取消 ·");
      control(panel, "重试同一取消请求").click();
      await flight;
      const commands = calls.filter((call) => call.operation === "generation_cancel");
      expect(commands).toHaveLength(2);
      expect(commands[1]?.input).toEqual(commands[0]?.input);
      await vi.waitFor(() => expect(panel.element.textContent).toContain("已取消 ·"));
    } finally {
      await panel.dispose();
    }
  }));

it("allows an existing candidate to be explicitly adopted with configuration absent and leaves source unchanged", () =>
  fixture(async ({ db, editor, client, calls, intercept }) => {
    const before = editor.project!,
      jobId = randomUUID();
    const job: Job = {
      sessionId: before.sessionId,
      artifactId: before.artifactId,
      revision: before.revision,
      providerId: "old",
      providerVersion: "v1",
      modelId: "png",
      prompt: "Saved candidate",
      requestId: randomUUID(),
      id: jobId,
      version: 2,
      state: "succeeded",
      submission: "accepted",
      createdAt: 1,
      updatedAt: 1,
      candidate: {
        jobId,
        contentHash: pngHash,
        bytes: Buffer.from(png, "base64").length,
        type: "image/png",
        width: 32,
        height: 24,
        providerId: "old",
        providerVersion: "v1",
        modelId: "png",
      },
    };
    intercept(async (operation, raw) => {
      if (operation === "generation_status") return reply({ ...status, configured: false, providers: [] });
      if (operation === "generation_list") return reply({ jobs: [job], next: null });
      if (operation === "generation_adopt") {
        const input = raw as GenerationInput<"generation_adopt">;
        return reply(
          db.execute("resource_import", {
            sessionId: input.sessionId,
            artifactId: input.artifactId,
            requestId: input.requestId,
            expectedRevision: input.expectedRevision,
            path: input.path,
            name: input.name,
            data: png,
          }),
        );
      }
    });
    let flight = Promise.resolve();
    const panel = new GenerationPanel(document, {
      editor,
      client,
      run: (action) => {
        flight = action().then(() => panel.update(editor.project, false));
      },
    });
    document.body.append(panel.element);
    panel.update(before, false);
    try {
      await vi.waitFor(() => expect(panel.element.textContent).toContain("Saved candidate"));
      expect(control(panel, "生成新的 PNG 候选").disabled).toBe(true);
      expect(control(panel, "预览 PNG 候选").disabled).toBe(false);
      expect(calls.filter((call) => call.operation === "generation_adopt")).toHaveLength(0);
      control(panel, "采用为工程资源").click();
      await flight;
      expect(editor.project?.resources).toHaveLength(1);
      expect(editor.project?.files).toEqual(before.files);
      expect(editor.draft).toBe(before.files.find((file) => file.path === "index.html")?.content);
      expect(calls.filter((call) => call.operation === "generation_create")).toHaveLength(0);
      expect(control(panel, "已采用为工程资源").disabled).toBe(true);
    } finally {
      await panel.dispose();
    }
  }));
