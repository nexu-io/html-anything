import { z } from "zod";
import { type Resource, resourceData, resourcePath } from "./resources/contract.js";

export { type Resource, resourceLimit } from "./resources/contract.js";
export const id = z.uuid();
export const revision = z.string().regex(/^sha256:[a-f0-9]{64}$/);
const title = z.string().trim().min(1).max(120);
const text = z.string().trim().min(1).max(8000);
const request = { requestId: id };
export const file = z.strictObject({ path: z.string().min(1).max(240), content: z.string().max(1048576) });
const owner = { sessionId: id, artifactId: id };
const selection = {
  expectedSelection: z.number().int().nonnegative(),
  expectedCurrent: z.strictObject({ artifactId: id, revision }).nullable(),
};
export const schemas = {
  workspace_state: z.strictObject({}),
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
export interface Outputs {
  workspace_state: State;
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
