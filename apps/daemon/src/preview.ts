import type { ServerResponse } from "node:http";
import { assembleProject } from "@open-motion/motion/project";
import { gsap, preview, runtime } from "@open-motion/motion/runtime";
import { Fault, id, type Project, revision, schemas, type Workspace } from "@open-motion/workspace";

const schema = schemas.project_read.extend({ id, expectedRevision: revision });
const types: Record<string, string> = {
  html: "text/html",
  css: "text/css",
  js: "text/javascript",
  mjs: "text/javascript",
  json: "application/json",
  svg: "image/svg+xml",
  txt: "text/plain",
  vtt: "text/vtt",
};
/** Ephemeral read-only views of confirmed snapshots, never a project store or OS inventory. */
export class Previews {
  private views = new Map<string, { project: Project; html: string }>();
  constructor(private workspace: Workspace) {}
  open(input: unknown) {
    const parsed = schema.safeParse(input);
    if (!parsed.success) throw new Fault("invalid", "invalid preview request");
    const existing = this.views.get(parsed.data.id)?.project;
    if (existing) {
      if (
        existing.artifactId !== parsed.data.artifactId ||
        existing.sessionId !== parsed.data.sessionId ||
        existing.revision !== parsed.data.expectedRevision
      )
        throw new Fault("idempotency", "preview identity reused with different source");
      return { id: parsed.data.id, revision: existing.revision };
    }
    const project = this.workspace.execute("project_read", {
      sessionId: parsed.data.sessionId,
      artifactId: parsed.data.artifactId,
    });
    if (project.revision !== parsed.data.expectedRevision) throw new Fault("conflict", "preview revision changed");
    if (project.files.some((f) => f.path === "__gsap.js" || f.path === "__runtime.js"))
      throw new Fault("invalid", "reserved preview engine path");
    if (this.views.size >= 16) throw new Fault("invalid", "close an existing preview before opening another");
    let html: string;
    try {
      html = assembleProject(project.files, project.resources).html;
    } catch (error) {
      throw new Fault("invalid", error instanceof Error ? error.message : "invalid composition graph");
    }
    this.views.set(parsed.data.id, { project, html });
    return { id: parsed.data.id, revision: project.revision };
  }
  release(input: unknown) {
    const parsed = id.safeParse((input as { id?: unknown })?.id);
    if (!parsed.success) throw new Fault("invalid", "invalid preview identity");
    this.views.delete(parsed.data);
    return { closed: true };
  }
  serve(url: string, response: ServerResponse, host: string | undefined, range?: string, head = false) {
    const match = /^\/preview\/([a-f0-9-]+)\/(.+)$/.exec(url.split("?")[0] ?? "");
    const viewId = match?.[1],
      encoded = match?.[2];
    const view = viewId && this.views.get(viewId);
    if (!view || !viewId || !encoded) {
      response.writeHead(404);
      response.end();
      return;
    }
    let path: string;
    try {
      path = decodeURIComponent(encoded);
    } catch {
      response.writeHead(400);
      response.end();
      return;
    }
    const file = view.project.files.find((f) => f.path === path);
    const asset = view.project.resources.find((entry) => entry.path === path);
    let content: string | Buffer | undefined =
      path === "__gsap.js" ? gsap : path === "__runtime.js" ? runtime : file?.content;
    if (asset) {
      const result = this.workspace.execute("resource_read", {
        sessionId: view.project.sessionId,
        artifactId: view.project.artifactId,
        revision: view.project.revision,
        path,
      });
      content = Buffer.from(result.data, "base64");
    }
    if (content === undefined) {
      response.writeHead(404);
      response.end();
      return;
    }
    const type = asset?.type ?? types[path.split(".").at(-1)?.toLowerCase() ?? ""] ?? "text/plain";
    if (path === "index.html") content = preview(view.html, `/preview/${viewId}/`);
    let origin: URL;
    try {
      origin = new URL(`http://${host}`);
      if (
        !["127.0.0.1", "localhost", "[::1]"].includes(origin.hostname) ||
        !origin.port ||
        origin.username ||
        origin.password ||
        origin.pathname !== "/" ||
        origin.search ||
        origin.hash
      )
        throw new Error("invalid preview host");
    } catch {
      response.writeHead(400);
      response.end();
      return;
    }
    const base = `/preview/${viewId}/`;
    // URLs remain within this view. The document has an opaque sandbox origin and no write capability.
    const resource = `${origin.origin}${base}`;
    const fullLength = Buffer.byteLength(content);
    let status = 200,
      contentRange: string | undefined;
    if (asset && range && !head) {
      const match = /^bytes=(\d*)-(\d*)$/.exec(range),
        first = match?.[1],
        last = match?.[2];
      const start = first ? Number(first) : last ? Math.max(0, fullLength - Number(last)) : Number.NaN,
        end = first ? (last ? Math.min(Number(last), fullLength - 1) : fullLength - 1) : fullLength - 1;
      if (
        !match ||
        (first !== "" && !Number.isSafeInteger(Number(first))) ||
        (last !== "" && !Number.isSafeInteger(Number(last))) ||
        !Number.isSafeInteger(start) ||
        !Number.isSafeInteger(end) ||
        start < 0 ||
        start >= fullLength ||
        end < start ||
        (!first && Number(last) <= 0)
      ) {
        response.writeHead(416, {
          "content-range": `bytes */${fullLength}`,
          "content-length": 0,
          "cache-control": "no-store",
          "access-control-allow-origin": "*",
        });
        response.end();
        return;
      }
      content = (content as Buffer).subarray(start, end + 1);
      status = 206;
      contentRange = `bytes ${start}-${end}/${fullLength}`;
    }
    response.writeHead(status, {
      "content-type": asset ? type : `${type}; charset=utf-8`,
      ...(asset ? { "accept-ranges": "bytes" } : {}),
      ...(contentRange ? { "content-range": contentRange } : {}),
      "content-length": Buffer.byteLength(content),
      "cache-control": "no-store",
      "referrer-policy": "no-referrer",
      "x-content-type-options": "nosniff",
      "access-control-allow-origin": "*",
      "content-security-policy": `default-src 'none'; script-src 'unsafe-inline' 'unsafe-eval' ${resource}; style-src 'unsafe-inline' ${resource}; img-src data: ${resource}; font-src data: ${resource}; media-src ${resource}; connect-src 'none'; frame-src 'none'; base-uri 'none'; form-action 'none'; sandbox allow-scripts`,
    });
    response.end(head ? undefined : content);
  }
  close() {
    this.views.clear();
  }
}
