import { randomUUID } from "node:crypto";
import { mkdtempSync, rmSync } from "node:fs";
import type { ServerResponse } from "node:http";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { initialFiles, Workspace } from "@open-motion/workspace";
import { expect, it } from "vitest";
import { Previews } from "@/content/preview.js";

const png =
  "iVBORw0KGgoAAAANSUhEUgAAACAAAAAYCAYAAACbU/80AAAAPklEQVR4AcXBMQEAIAzAsK5CuPEvChtMRpN5535CEpOYxCQmMYlJTGISk5jEJCYxiUlMYhKTmMQkJjGJSWwBYl8CWwMRvGQAAAAASUVORK5CYII=";
function response(views: Previews, url: string, range?: string, head = false) {
  let status = 0,
    headers: Record<string, unknown> = {},
    body = Buffer.alloc(0);
  views.serve(
    url,
    {
      writeHead(code: number, value: Record<string, unknown>) {
        status = code;
        headers = value ?? {};
      },
      end(value?: string | Buffer) {
        body = Buffer.from(value ?? "");
      },
    } as unknown as ServerResponse,
    "127.0.0.1:48000",
    range,
    head,
  );
  return { status, headers, body };
}
it("serves only captured revision bytes with exact binary MIME, bounded ranges and complete view revocation", () => {
  const root = mkdtempSync(join(tmpdir(), "motion-resource-view-")),
    workspace = new Workspace(root),
    views = new Previews(workspace);
  try {
    const session = workspace.execute("session_create", { requestId: randomUUID(), title: "Media", mode: "motion" }),
      artifact = workspace.execute("artifact_create", {
        requestId: randomUUID(),
        sessionId: session.id,
        title: "Project",
        files: initialFiles(),
      }),
      owner = { sessionId: session.id, artifactId: artifact.id },
      before = workspace.execute("project_read", owner),
      project = workspace.execute("resource_import", {
        requestId: randomUUID(),
        ...owner,
        expectedRevision: before.revision,
        path: "assets/red.png",
        name: "Red",
        data: png,
      }),
      view = views.open({ id: randomUUID(), ...owner, expectedRevision: project.revision }),
      url = `/preview/${view.id}/assets/red.png`,
      full = response(views, url),
      bytes = Buffer.from(png, "base64");
    expect(full.status).toBe(200);
    expect(full.body).toEqual(bytes);
    expect(full.headers["content-type"]).toBe("image/png");
    expect(full.headers["accept-ranges"]).toBe("bytes");
    expect(full.headers["content-length"]).toBe(bytes.length);
    expect(full.headers["content-security-policy"]).toContain("connect-src 'none'");
    const part = response(views, url, "bytes=3-7");
    expect(part.status).toBe(206);
    expect(part.body).toEqual(bytes.subarray(3, 8));
    expect(part.headers["content-range"]).toBe(`bytes 3-7/${bytes.length}`);
    expect(response(views, url, "bytes=-4").body).toEqual(bytes.subarray(-4));
    expect(response(views, url, "bytes=6-").body).toEqual(bytes.subarray(6));
    for (const range of [
      "bytes=99999-",
      "bytes=2-1",
      "bytes=-0",
      "bytes=0-2,4-8",
      "bytes=-99999999999999999999999",
      "other=0-2",
    ])
      expect(response(views, url, range).status).toBe(416);
    const head = response(views, url, undefined, true);
    expect(head.status).toBe(200);
    expect(head.body).toHaveLength(0);
    expect(head.headers["content-length"]).toBe(bytes.length);
    const removed = workspace.execute("resource_remove", {
      requestId: randomUUID(),
      ...owner,
      expectedRevision: project.revision,
      path: "assets/red.png",
    });
    expect(response(views, url).body).toEqual(bytes);
    const replacement = views.open({ id: randomUUID(), ...owner, expectedRevision: removed.revision });
    expect(response(views, `/preview/${replacement.id}/assets/red.png`).status).toBe(404);
    expect(response(views, `/preview/${view.id}/%2e%2e/workspace.sqlite`).status).toBe(404);
    views.release({ id: view.id });
    expect(response(views, url).status).toBe(404);
  } finally {
    views.close();
    workspace.close();
    rmSync(root, { recursive: true, force: true });
  }
});
it("refuses a new candidate that references removed media while keeping the confirmed old view usable", () => {
  const root = mkdtempSync(join(tmpdir(), "motion-resource-retain-")),
    workspace = new Workspace(root),
    views = new Previews(workspace);
  try {
    const session = workspace.execute("session_create", { requestId: randomUUID(), title: "Media", mode: "motion" }),
      files = initialFiles();
    const entry = files[0];
    if (!entry) throw Error("missing fixture entry");
    entry.content = entry.content.replace("</main>", '<img src="assets/red.png"></main>');
    const artifact = workspace.execute("artifact_create", {
        requestId: randomUUID(),
        sessionId: session.id,
        title: "Project",
        files,
      }),
      owner = { sessionId: session.id, artifactId: artifact.id },
      before = workspace.execute("project_read", owner),
      project = workspace.execute("resource_import", {
        requestId: randomUUID(),
        ...owner,
        expectedRevision: before.revision,
        path: "assets/red.png",
        name: "Red",
        data: png,
      }),
      view = views.open({ id: randomUUID(), ...owner, expectedRevision: project.revision });
    const removed = workspace.execute("resource_remove", {
      requestId: randomUUID(),
      ...owner,
      expectedRevision: project.revision,
      path: "assets/red.png",
    });
    expect(() => views.open({ id: randomUUID(), ...owner, expectedRevision: removed.revision })).toThrow(
      "missing media resource",
    );
    expect(response(views, `/preview/${view.id}/assets/red.png`).body.toString("base64")).toBe(png);
  } finally {
    views.close();
    workspace.close();
    rmSync(root, { recursive: true, force: true });
  }
});
