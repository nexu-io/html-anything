import { type Environment, environment } from "@odsuite/carrier";
import type { Config } from "../view.js";
export interface Bootstrap extends Config {
  environment?: Readonly<Environment>;
}
export async function bootstrap(
  injected: Bootstrap | undefined,
  url: URL,
  transport: typeof fetch = fetch,
  signal?: AbortSignal,
): Promise<Bootstrap> {
  signal?.throwIfAborted();
  if (injected) return injected;
  const response = await transport(url, {
    credentials: "omit",
    cache: "no-store",
    signal: AbortSignal.any([AbortSignal.timeout(10000), ...(signal ? [signal] : [])]),
  });
  if (!response.ok) throw new Error(`bootstrap failed: ${response.status}`);
  const value = (await response.json()) as Bootstrap;
  signal?.throwIfAborted();
  if (typeof value.daemon !== "string" || typeof value.token !== "string" || !value.token)
    throw new Error("invalid web bootstrap");
  return { daemon: value.daemon, token: value.token, environment: environment(value.environment) };
}
