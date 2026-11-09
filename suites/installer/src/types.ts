import type { CatalogOptions, Metadata, Shell } from "@odsuite/distribution";
import type { Manager } from "@odsuite/sidecar";

export interface Runtime {
  root: string;
  namespace: string;
  version: string;
  owner: Manager;
}
export interface Options {
  root: string;
  target: string;
  runtime: Omit<Runtime, "owner">;
  catalog: Omit<CatalogOptions, "root">;
  env: Record<string, string>;
  /** Diagnostic fault point; never a policy/readiness input. */
  checkpoint?: "ready" | "vacated" | "displaced" | "installed" | "launched" | "confirming" | "confirmed";
}
export interface Job extends Options {
  schema: 1;
  id: string;
  nonce: string;
  metadata: Metadata;
  shell: Shell;
  home: string;
  executor: string;
  worker: string;
  appName: string;
}
export interface Journal {
  schema: 1;
  id: string;
  phase: "ready" | "waiting" | "vacated" | "displaced" | "installed" | "launched" | "confirmed" | "failed";
  oldHash: string;
  newHash: string;
  old: Runtime[];
  manager?: Manager;
  next?: Manager;
  error?: string;
  history: { phase: string; at: number; pid: number }[];
}
export interface Registration extends Runtime {
  target: string;
}
export interface Confirmation {
  id: string;
  nonce: string;
  version: string;
  root: string;
  generation: string;
}
export interface Methods {
  status: { input: null; output: Journal | undefined };
  register: { input: Registration; output: boolean };
  arm: { input: { id: string; nonce: string }; output: boolean };
  confirm: { input: Confirmation; output: boolean };
}
export interface Handle {
  root: string;
  channel: string;
  id: string;
  nonce: string;
  manager: Manager;
}
