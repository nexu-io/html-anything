import { z } from "zod";
import { type Resource, resourceData, resourcePath } from "./resources/contract.js";

export { type Resource, resourceLimit } from "./resources/contract.js";
export const id = z.uuid();
export const revision = z.string().regex(/^sha256:[a-f0-9]{64}$/);
const title = z.string().trim().min(1).max(120);
const text = z.string().trim().min(1).max(8000);
const request = { requestId: id };
export const file = z.strictObject({ path: z.string().min(1).max(240), content: z.string().max(1048576) });
/** Immutable source intent; resolved files remain outside its retry identity. */
export const sourceIntent = z.strictObject({
  ...request,
  sessionId: id,
  title,
  source: z.strictObject({ id: z.string().regex(/^[a-z][a-z0-9-]{0,119}$/), contentHash: revision }),
});
export type SourceIntent = z.infer<typeof sourceIntent>;
const owner = { sessionId: id, artifactId: id };
/** Canonical immutable resource adoption identity; independent of gateway implementation. */
export const resourceSourceIntent = z.strictObject({
  ...request,
  ...owner,
  expectedRevision: revision,
  path: resourcePath,
  name: title,
  source: z.strictObject({ id, contentHash: revision }),
});
export type ResourceSourceIntent = z.infer<typeof resourceSourceIntent>;
const selection = {
  expectedSelection: z.number().int().nonnegative(),
  expectedCurrent: z.strictObject({ artifactId: id, revision }).nullable(),
};
export const schemas = {
  workspace_state: z.strictObject({}),
  workspace_observe: z.strictObject({}),
  session_create: z.strictObject({ ...request, title, mode: z.literal("motion"), instruction: text.optional() }),
  session_rename: z.strictObject({ ...request, sessionId: id, title }),
  session_get: z.strictObject({ sessionId: id }),
  message_append: z.strictObject({ ...request, sessionId: id, role: z.enum(["user", "assistant"]), content: text }),
  artifact_create: z.strictObject({ ...request, sessionId: id, title, files: z.array(file).min(1).max(128) }),
  artifact_open: z.strictObject({ ...request, ...owner, ...selection }),
  session_open: z.strictObject({ ...request, sessionId: id, ...selection }),
  project_read: z.strictObject(owner),
  project_snapshot: z.strictObject({ ...owner, revision }),
  resource_import: z.strictObject({
    ...request,
    ...owner,
    expectedRevision: revision,
    path: resourcePath,
    name: title,
    data: resourceData,
  }),
  resource_remove: z.strictObject({ ...request, ...owner, expectedRevision: revision, path: resourcePath }),
  resource_read: z.strictObject({ ...owner, revision, path: resourcePath }),
  project_undo: z.strictObject({
    ...request,
    ...owner,
    expectedRevision: revision,
    expectedHistory: z.number().int().nonnegative(),
  }),
  project_redo: z.strictObject({
    ...request,
    ...owner,
    expectedRevision: revision,
    expectedHistory: z.number().int().nonnegative(),
  }),
  project_save: z.strictObject({
    ...request,
    ...owner,
    expectedRevision: revision,
    files: z.array(file).min(1).max(128),
  }),
} as const;
export type Operation = keyof typeof schemas;
export type Input<K extends Operation> = z.infer<(typeof schemas)[K]>;
export type SourceFile = z.infer<typeof file>;
export interface Session {
  id: string;
  title: string;
  mode: "motion";
  createdAt: number;
  activeArtifactId: string | null;
}
export interface Message {
  id: string;
  sessionId: string;
  role: "user" | "assistant";
  content: string;
  createdAt: number;
}
export interface Artifact {
  id: string;
  sessionId: string;
  projectId: string;
  kind: "motion-project";
  title: string;
  createdAt: number;
}
export interface SessionDetail extends Session {
  messages: Message[];
  artifacts: Artifact[];
}
export interface Project {
  id: string;
  artifactId: string;
  sessionId: string;
  revision: string;
  files: SourceFile[];
  resources: Resource[];
  history: { version: number; canUndo: boolean; canRedo: boolean };
}
export type ProjectSnapshot = Omit<Project, "history">;
export interface Selection {
  revision: number;
  sessionId: string | null;
  artifactId: string | null;
}
export interface State {
  sessions: Session[];
  selection: Selection;
}
export interface ProjectHead {
  sessionId: string;
  artifactId: string;
  revision: string;
  historyVersion: number;
}
/** Content equality token, not a process identity or durable event cursor. */
export interface Observation {
  token: string;
  state: State;
  project: ProjectHead | null;
}
export interface WorkspaceView {
  state: State;
  session: SessionDetail | null;
  project: Project | null;
}
export interface Outputs {
  workspace_state: State;
  workspace_observe: Observation;
  session_create: SessionDetail;
  session_get: SessionDetail;
  session_rename: SessionDetail;
  message_append: Message;
  artifact_create: Artifact;
  artifact_open: Selection;
  session_open: Selection;
  project_read: Project;
  project_snapshot: ProjectSnapshot;
  resource_import: Project;
  resource_remove: Project;
  resource_read: { resource: Resource; data: string };
  project_undo: Project;
  project_redo: Project;
  project_save: Project;
}
export type Output<K extends Operation> = Outputs[K];
export type FaultCode = "invalid" | "missing" | "ownership" | "conflict" | "idempotency" | "integrity";
export class Fault extends Error {
  constructor(
    readonly code: FaultCode,
    message: string,
  ) {
    super(message);
    this.name = "WorkspaceFault";
  }
}
export const descriptions: Record<Operation, string> = {
  workspace_state: "List creative sessions and the current selection.",
  workspace_observe:
    "Read an atomic lightweight workspace token and selected project/history head; fetch owned bodies and fence with another observation before applying.",
  session_create: "Create an empty Motion session and optionally preserve the user's instruction.",
  session_rename: "Rename a session without renaming its artifacts or changing project content.",
  session_get: "Read a session, its messages and owned artifacts.",
  message_append: "Append an actual caller-supplied user or assistant message idempotently.",
  artifact_create:
    "Create an owned native project from explicitly supplied source files without switching the active context.",
  artifact_open: "Switch to an owned artifact only after checking the current context and revision.",
  session_open:
    "Select a session and restore its last artifact after checking current context; an empty session has none.",
  project_read: "Read native source, resource manifest, content revision and authoritative history state.",
  project_snapshot: "Reopen an explicitly owned immutable source revision without changing current content or history.",
  resource_import: "Import a bounded, verified PNG or PCM16 WAV into the owned project revision idempotently.",
  resource_remove:
    "Remove one resource from the current revision while preserving historical bytes for undo and existing views.",
  resource_read: "Read bytes only through the resource manifest of an explicitly owned immutable project revision.",
  project_undo: "Undo one persisted edit after checking the content revision and history version.",
  project_redo: "Redo one persisted edit after checking the content revision and history version.",
  project_save: "Atomically replace native source files if the expected content revision still matches.",
};

export function initialFiles(): SourceFile[] {
  return [
    {
      path: "index.html",
      content:
        '<!doctype html><html><head><meta charset="utf-8"><title>Motion</title></head><body><main data-composition-id="main" data-width="1920" data-height="1080" data-duration="5"></main><script>const tl=gsap.timeline({paused:true});tl.to({},{duration:5});window.__timelines={main:tl};</script></body></html>',
    },
    {
      path: "hyperframes.json",
      content: JSON.stringify({
        $schema: "https://hyperframes.heygen.com/schema/hyperframes.json",
        paths: { blocks: "compositions", components: "compositions/components", assets: "assets" },
      }),
    },
  ];
}

/** Native source names are logical snapshot paths, never host paths. */
const sourceExtensions = new Set([
  "html",
  "css",
  "js",
  "mjs",
  "json",
  "svg",
  "txt",
  "md",
  "vtt",
  "srt",
  "glsl",
  "vert",
  "frag",
]);
const sourceIgnored = new Set(["node_modules", "dist", "renders", "output", "cache"]);
const sourceManifests = new Set([".hyperframes/studio-manual-edits.json", ".hyperframes/studio-motion.json"]);
export function validateSourcePath(path: string, managed = false) {
  if (
    !path ||
    path.length > 240 ||
    path.includes("\\") ||
    path.includes(":") ||
    Array.from(path).some((char) => char.charCodeAt(0) < 32 || char.charCodeAt(0) === 127) ||
    (!(managed && sourceManifests.has(path)) &&
      path.split("/").some((part) => !part || part.startsWith(".") || sourceIgnored.has(part))) ||
    !sourceExtensions.has(path.match(/\.([a-z0-9]+)$/i)?.[1]?.toLowerCase() ?? "")
  )
    throw new Fault("invalid", "invalid or reserved native source path");
}
export type SourceChange =
  | { kind: "create"; path: string }
  | { kind: "duplicate" | "rename"; path: string; target: string }
  | { kind: "remove"; path: string };
/** One source membership change; persistence and retries remain project_save's responsibility. */
export function changeSources(files: SourceFile[], change: SourceChange): SourceFile[] {
  validateSourcePath(change.path);
  const original = files.find((file) => file.path === change.path);
  if (change.kind !== "create" && !original) throw new Fault("invalid", "source file is missing");
  if ((change.kind === "rename" || change.kind === "remove") && change.path === "index.html")
    throw new Fault("invalid", "index.html is the protected project entry");
  const next = files.filter((file) => !(["rename", "remove"].includes(change.kind) && file.path === change.path));
  if (change.kind !== "remove") {
    const target = change.kind === "create" ? change.path : change.target;
    validateSourcePath(target);
    if (target === change.path && change.kind !== "create") throw new Fault("invalid", "destination matches source");
    if (
      next.some(
        (file) => file.path === target || file.path.startsWith(target + "/") || target.startsWith(file.path + "/"),
      )
    )
      throw new Fault("conflict", "source destination already exists or overlaps a file");
    if (next.length >= 128) throw new Fault("invalid", "native source count exceeds 128");
    const content = change.kind === "create" ? "" : original?.content;
    if (content === undefined) throw new Fault("invalid", "source file is missing");
    next.push({ path: target, content });
  }
  return next.sort((a, b) => (a.path < b.path ? -1 : a.path > b.path ? 1 : 0));
}

export type SourceChoice = "local" | "remote";
export interface SourceConflict {
  path: string;
  base?: string;
  local?: string;
  remote?: string;
}
/** File-granularity three-way reconciliation; never persists or rewrites source. */
export function mergeSources(
  base: SourceFile[],
  local: SourceFile[],
  remote: SourceFile[],
  choices: Record<string, SourceChoice> = {},
) {
  const maps = [base, local, remote].map((files) => new Map(files.map((file) => [file.path, file.content])));
  const paths = [...new Set([...base, ...local, ...remote].map((file) => file.path))].sort();
  const files: SourceFile[] = [],
    conflicts: SourceConflict[] = [];
  for (const path of paths) {
    const before = maps[0]?.get(path),
      mine = maps[1]?.get(path),
      theirs = maps[2]?.get(path);
    let content: string | undefined;
    if (mine === before) content = theirs;
    else if (theirs === before || mine === theirs) content = mine;
    else if (choices[path] === "local") content = mine;
    else if (choices[path] === "remote") content = theirs;
    else {
      conflicts.push({ path, base: before, local: mine, remote: theirs });
      continue;
    }
    if (content !== undefined) files.push({ path, content });
  }
  if (files.length > 128) throw new Fault("invalid", "merged source count exceeds 128");
  if (!conflicts.length) {
    const names = new Set(files.map((file) => file.path));
    if (!names.has("index.html")) throw new Fault("invalid", "merged sources require index.html");
    let bytes = 0;
    for (const file of files) {
      validateSourcePath(file.path, true);
      if (file.content.length > 1048576) throw new Fault("invalid", "merged file exceeds text bound");
      bytes += new TextEncoder().encode(file.content).length;
      for (let at = file.path.indexOf("/"); at >= 0; at = file.path.indexOf("/", at + 1))
        if (names.has(file.path.slice(0, at))) throw new Fault("invalid", "merged source paths overlap");
    }
    if (bytes > 4 * 1024 * 1024) throw new Fault("invalid", "merged source exceeds 4 MiB");
  }
  return { files, conflicts };
}
