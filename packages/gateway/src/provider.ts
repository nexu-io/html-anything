import type { GenerationInput, ProviderDescriptor } from "./contract.js";

/** Injected adapter identity must change if its account/protocol/model meaning changes.
 * No credentials, environment discovery, output paths or URLs enter this contract.
 * submit is invoked at most once, after a durable unknown-submission marker.
 */
export interface Provider extends ProviderDescriptor {
  submit(input: GenerationInput<"generation_create">, signal: AbortSignal): Promise<{ remoteId: string }>;
  read(
    remoteId: string,
    signal: AbortSignal,
  ): Promise<{ state: "pending" } | { state: "failed" } | { state: "succeeded"; bytes: Uint8Array }>;
  cancel(remoteId: string, signal: AbortSignal): Promise<{ confirmed: boolean }>;
}
