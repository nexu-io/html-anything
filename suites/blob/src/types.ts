import type { Artifact, Digest } from "@odsuite/protocol";
import type { Context, Factory, Identity } from "@odsuite/sidecar";

export interface Resource {
  artifact: Artifact;
  type: "file" | "directory";
  platform?: "darwin" | "linux" | "win32";
  arch?: "arm64" | "x64";
}
export interface Consumer extends Pick<Identity, "service" | "generation"> {
  incarnation: string;
  /** A logical use epoch under the actual subject; never a new sidecar identity. */
  epoch?: string;
}
export interface Owner extends Consumer {
  manager: string;
}
export interface Use {
  id: string;
  key: Digest;
  owner: Owner;
  path: string;
}
export type Loader = (signal: AbortSignal) => Promise<Uint8Array>;
export interface Reference {
  kind: "current" | "prepared" | "recovery";
  name: string;
  keys: Digest[];
}
export interface Entry {
  resource: Resource;
  phase: "empty" | "loading" | "ready" | "failed" | "deleting";
  uses: Use[];
  idleSince?: number;
  error?: string;
  operation?: { id: string; lease: string; path: string; owner: Owner };
}
export interface State {
  schema: 1;
  owner?: Owner;
  entries: Record<Digest, Entry>;
  references: Reference[];
}
export interface LibraryOptions {
  /** Independent content domain within the same factory. */
  name?: string;
  factory: Factory;
  /** Call open during this real subject's initialize callback. */
  context: Context;
  retentionMs?: number;
  intervalMs?: number;
  onError?: (error: unknown) => void;
  /** Diagnostic fault injection only. Do not reenter the library from it. */
  onCheckpoint?: (event: {
    phase: "loading" | "materialized" | "deleting" | "pruned";
    key: Digest;
    removed?: string;
  }) => Promise<void>;
}

export interface LibrarySession {
  /** Path remains valid only while the caller keeps its durable reference. */
  referencedPath(value: Resource): Promise<string>;
  read(value: Resource): Promise<Uint8Array>;
  status(): Promise<State>;
  acquire(value: Resource, load: Loader, who?: Consumer): Promise<Use>;
  prefetch(value: Resource, load: Loader): Promise<{ key: Digest; type: Resource["type"]; bytes: number }>;
  release(use: Use): Promise<boolean>;
  retain(kind: Reference["kind"], name: string, values: Resource[]): Promise<void>;
  unretain(kind: Reference["kind"], name: string): Promise<void>;
}
