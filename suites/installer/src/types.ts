import type { FactoryScope } from "@odsuite/protocol";
import type { Context, Factory, Manager, Witness } from "@odsuite/sidecar";

export interface Options {
  home: string;
  product: string;
  scope: FactoryScope;
  /** In-process diagnostic only; no policy, serialization or control transport. */
  onCheckpoint?: (event: {
    phase: "intent" | "materialized" | "installed" | "selected";
    requestId: string;
  }) => Promise<void>;
}
export interface Source {
  bytes: Uint8Array;
  sha256: string;
}
export interface Input {
  data: string;
  requestId: string;
  source: Source;
}
export interface Receipt {
  requestId: string;
  product: string;
  carrier: string;
  channel: string;
  namespace: string;
  version: string;
  digest: `sha256:${string}`;
  path: string;
  data: string;
}
/** Immutable consumption fact; only sidecar observations determine process liveness. */
export interface Use {
  id: string;
  receipt: Receipt;
  controller: Witness;
}
export interface Consumption {
  requestId: string;
  application: string;
  data: string;
  carrier: string;
  manager?: Manager;
}
export interface UseObservation extends Use {
  state: "alive" | "retired";
}
export interface Transition {
  requestId: string;
  intent: unknown;
  data: unknown;
  revision: number;
  complete: boolean;
}
export interface Select {
  expected: Record<string, string | null>;
  receipts: Record<string, string>;
  transition?: string;
}
export interface Session {
  readonly factory: Factory;
  readonly context: Context;
  install(input: Input): Promise<Receipt>;
  stage(input: Input): Promise<Receipt>;
  select(input: Select): Promise<Receipt[]>;
  transitions: {
    read(requestId?: string): Promise<Transition | undefined>;
    begin(input: { requestId: string; intent: unknown; data: unknown }): Promise<Transition>;
    advance(input: {
      requestId: string;
      expectedRevision: number;
      data: unknown;
      complete?: boolean;
    }): Promise<Transition>;
  };
  read(carrier: string): Promise<Receipt | undefined>;
  use(input: Consumption): Promise<Use>;
  uses(): Promise<UseObservation[]>;
  close(): Promise<void>;
}
export class InstallerFault extends Error {
  constructor(
    readonly code: "invalid" | "conflict" | "integrity" | "idempotency",
    message: string,
  ) {
    super(message);
  }
}
