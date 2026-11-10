import type { FactoryScope } from "@odsuite/protocol";
import type { Factory, Service } from "@odsuite/sidecar";
export interface Plan {
  repo: string;
  root: string;
  scope: FactoryScope;
  carrier: string;
  entry: string;
  version: string;
  watch: boolean;
}
export interface CarrierContext {
  repo: string;
  scope: FactoryScope;
  version: string;
  manager: Service;
  factory: Factory;
}
export interface CarrierRuntime {
  status(): Promise<{ healthy: boolean; [key: string]: unknown }>;
}
export interface Adapter {
  open(context: CarrierContext): Promise<CarrierRuntime>;
  connect?(context: { factory: Factory; repo: string }): Promise<void>;
}
export interface BuildState {
  phase: "idle" | "building" | "succeeded" | "failed";
  source?: string;
  log?: string;
  error?: string;
  restartRequired: boolean;
}
export interface View {
  plan: Plan;
  build: BuildState;
  runtime: { healthy: boolean; [key: string]: unknown };
}
export interface Methods {
  status: { input: unknown; output: View };
}
