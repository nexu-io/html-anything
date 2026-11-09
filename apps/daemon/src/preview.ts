import type { ServerResponse } from "node:http";
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
  private views = new Map<string, Project>();
  constructor(private workspace: Workspace) {}
  open(input: unknown) {
    const parsed = schema.safeParse(input);
    if (!parsed.success) throw new Fault("invalid", "invalid preview request");
    const existing = this.views.get(parsed.data.id);
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
    this.views.set(parsed.data.id, project);
    return { id: parsed.data.id, revision: project.revision };
  }
  release(input: unknown) {
    const parsed = id.safeParse((input as { id?: unknown })?.id);
    if (!parsed.success) throw new Fault("invalid", "invalid preview identity");
    this.views.delete(parsed.data);
    return { closed: true };
  }
  serve(url: string, response: ServerResponse, host: string | undefined) {
    const match = /^\/preview\/([a-f0-9-]+)\/(.+)$/.exec(url);
    const viewId = match?.[1],
      encoded = match?.[2];
    const project = viewId && this.views.get(viewId);
    if (!project || !viewId || !encoded) {
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
    const file = project.files.find((f) => f.path === path);
    let content = path === "__gsap.js" ? gsap : path === "__runtime.js" ? runtime : file?.content;
    if (content === undefined) {
      response.writeHead(404);
      response.end();
      return;
    }
    const type = types[path.split(".").at(-1)?.toLowerCase() ?? ""] ?? "text/plain";
    if (type === "text/html") content = preview(content);
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
    response.writeHead(200, {
      "content-type": `${type}; charset=utf-8`,
      "content-length": Buffer.byteLength(content),
      "cache-control": "no-store",
      "referrer-policy": "no-referrer",
      "x-content-type-options": "nosniff",
      "access-control-allow-origin": "*",
      "content-security-policy": `default-src 'none'; script-src 'unsafe-inline' 'unsafe-eval' ${resource}; style-src 'unsafe-inline' ${resource}; img-src data: ${resource}; font-src data: ${resource}; media-src ${resource}; connect-src 'none'; frame-src 'none'; base-uri 'none'; form-action 'none'; sandbox allow-scripts`,
    });
    response.end(content);
  }
  close() {
    this.views.clear();
  }
}
