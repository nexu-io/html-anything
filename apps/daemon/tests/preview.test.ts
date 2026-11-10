import { randomUUID } from "node:crypto";
import { mkdtempSync, rmSync } from "node:fs";
import type { ServerResponse } from "node:http";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { initialFiles, Workspace } from "@open-motion/workspace";
import { expect, it } from "vitest";
import { Previews } from "@/content/preview.js";

function fixture(run: (workspace: Workspace, views: Previews) => void) {
  const root = mkdtempSync(join(tmpdir(), "native-view-")),
    workspace = new Workspace(root),
    views = new Previews(workspace);
  try {
    run(workspace, views);
  } finally {
    views.close();
    workspace.close();
    rmSync(root, { force: true, recursive: true });
  }
}
function response(views: Previews, url: string, host = "127.0.0.1:48000") {
  let status = 0,
    headers: Record<string, unknown> = {},
    body = "";
  views.serve(
    url,
    {
      writeHead(code: number, value: Record<string, unknown>) {
        status = code;
        headers = value ?? {};
      },
      end(value?: string) {
        body = value ?? "";
      },
    } as unknown as ServerResponse,
    host,
  );
  return { status, headers, body };
}
it("serves immutable derived snapshots, canonical relative files and revokes retired views", () =>
  fixture((workspace, views) => {
    const session = workspace.execute("session_create", { requestId: randomUUID(), title: "native", mode: "motion" });
    const artifact = workspace.execute("artifact_create", {
      requestId: randomUUID(),
      sessionId: session.id,
      title: "source",
      files: initialFiles(),
    });
    const owner = { sessionId: session.id, artifactId: artifact.id };
    const project = workspace.execute("project_read", owner);
    const view = views.open({ id: randomUUID(), ...owner, expectedRevision: project.revision }),
      url = `/preview/${view.id}/index.html`;
    const shown = response(views, url);
    expect(shown.status).toBe(200);
    expect(shown.headers["content-security-policy"]).toContain(`http://127.0.0.1:48000/preview/${view.id}/`);
    expect(response(views, url, "localhost:48000").headers["content-security-policy"]).toContain(
      `http://localhost:48000/preview/${view.id}/`,
    );
    expect(response(views, url, "[::1]:48000").headers["content-security-policy"]).toContain(
      `http://[::1]:48000/preview/${view.id}/`,
    );
    expect(response(views, url, "external.example:48000").status).toBe(400);
    expect(shown.body).toContain("__runtime.js");
    expect(response(views, `${url}?revision=1`)).toEqual(shown);
    expect(shown.headers["content-security-policy"]).toContain("sandbox allow-scripts");
    expect(shown.headers["content-security-policy"]).toContain("connect-src 'none'");
    expect(response(views, `/preview/${view.id}/hyperframes.json`).body).toBe(
      project.files.find((f) => f.path === "hyperframes.json")?.content,
    );
    workspace.execute("project_save", {
      requestId: randomUUID(),
      ...owner,
      expectedRevision: project.revision,
      files: [{ path: "index.html", content: "new confirmed source" }],
    });
    expect(response(views, url).body).toBe(shown.body);
    expect(views.open({ id: view.id, ...owner, expectedRevision: project.revision })).toEqual(view);
    expect(workspace.execute("project_read", owner).files[0]?.content).toBe("new confirmed source");
    expect(response(views, `/preview/${randomUUID()}/index.html`).status).toBe(404);
    expect(response(views, `/preview/${view.id}/%2e%2e/ownership.sqlite`).status).toBe(404);
    views.release({ id: view.id });
    expect(response(views, url).status).toBe(404);
  }));
it("refuses foreign ownership, stale revisions and bounded preview exhaustion", () =>
  fixture((workspace, views) => {
    const session = workspace.execute("session_create", { requestId: randomUUID(), title: "native", mode: "motion" }),
      other = workspace.execute("session_create", { requestId: randomUUID(), title: "other", mode: "motion" });
    const artifact = workspace.execute("artifact_create", {
      requestId: randomUUID(),
      sessionId: session.id,
      title: "source",
      files: initialFiles(),
    });
    const project = workspace.execute("project_read", { sessionId: session.id, artifactId: artifact.id });
    const input = {
      id: randomUUID(),
      sessionId: session.id,
      artifactId: artifact.id,
      expectedRevision: project.revision,
    };
    expect(() => views.open({ ...input, sessionId: other.id })).toThrow("belong");
    expect(() => views.open({ ...input, expectedRevision: `sha256:${"0".repeat(64)}` })).toThrow("revision");
    const list = Array.from({ length: 16 }, () => views.open({ ...input, id: randomUUID() }));
    expect(() => views.open(input)).toThrow("close an existing");
    const [first, second] = list;
    if (!first || !second) throw new Error("missing bounded views");
    views.release({ id: first.id });
    expect(views.open(input).revision).toBe(project.revision);
    views.close();
    expect(response(views, `/preview/${second.id}/index.html`).status).toBe(404);
  }));
it("rejects broken composition candidates atomically, retains confirmed views and never persists assembly", () =>
  fixture((workspace, views) => {
    const session = workspace.execute("session_create", { requestId: randomUUID(), title: "nested", mode: "motion" });
    const files = [
      {
        path: "index.html",
        content:
          '<main data-composition-id="main"><div data-hf-id="hf-card" data-composition-id="card" data-composition-src="scenes/card.html"></div></main>',
      },
      { path: "scenes/card.html", content: '<div data-composition-id="card"><p>Confirmed child</p></div>' },
    ];
    const artifact = workspace.execute("artifact_create", {
      requestId: randomUUID(),
      sessionId: session.id,
      title: "nested",
      files,
    });
    const owner = { sessionId: session.id, artifactId: artifact.id },
      project = workspace.execute("project_read", owner);
    const confirmed = views.open({ id: randomUUID(), ...owner, expectedRevision: project.revision }),
      url = `/preview/${confirmed.id}/index.html`;
    const shown = response(views, url);
    expect(shown.body).toContain("Confirmed child");
    expect(shown.body).toContain(`src="/preview/${confirmed.id}/__gsap.js"`);
    expect(shown.body).not.toContain("data-composition-src=");
    expect(workspace.execute("project_read", owner).files).toEqual(files);
    workspace.execute("project_save", {
      requestId: randomUUID(),
      ...owner,
      expectedRevision: project.revision,
      files: files.slice(0, 1),
    });
    const broken = workspace.execute("project_read", owner),
      candidate = randomUUID();
    for (let index = 0; index < 20; index++)
      expect(() => views.open({ id: candidate, ...owner, expectedRevision: broken.revision })).toThrow(
        "missing composition",
      );
    expect(response(views, `/preview/${candidate}/index.html`).status).toBe(404);
    expect(response(views, url)).toEqual(shown);
    workspace.execute("project_save", { requestId: randomUUID(), ...owner, expectedRevision: broken.revision, files });
    const restored = workspace.execute("project_read", owner);
    expect(views.open({ id: candidate, ...owner, expectedRevision: restored.revision }).revision).toBe(
      restored.revision,
    );
    expect(workspace.execute("project_read", owner).files).toEqual(files);
    views.release({ id: confirmed.id });
    expect(response(views, url).status).toBe(404);
  }));
