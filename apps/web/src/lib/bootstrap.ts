import { type Environment, environment } from "@odsuite/carrier";
import type { Config } from "../view.js";
export interface Bootstrap extends Config {
  environment?: Readonly<Environment>;
}
export async function bootstrap(
  injected: Bootstrap | undefined,
  url: URL,
  transport: typeof fetch = fetch,
): Promise<Bootstrap> {
  if (injected) return injected;
  const response = await transport(url, { credentials: "omit", cache: "no-store" });
  if (!response.ok) throw new Error(`bootstrap failed: ${response.status}`);
  const value = (await response.json()) as Bootstrap;
  if (typeof value.daemon !== "string" || typeof value.token !== "string" || !value.token)
    throw new Error("invalid web bootstrap");
  return { daemon: value.daemon, token: value.token, environment: environment(value.environment) };
}
