import type { Config, Context, Provider } from "@odsuite/config";
import { channelDescriptor, type ProductIdentity, releaseChannel } from "./channel.js";
import { type Manifest, parse } from "./manifest.js";
import { parseReleaseVersion } from "./version.js";

function evaluate(provider: Provider | undefined, fallback: string, context: Readonly<Context>, name: string): string {
  if (!provider) return fallback;
  const first = provider(context);
  const second = provider(context);
  if (first !== second) throw new Error(`${name} must be deterministic`);
  return first;
}

export function resolve(
  config: Readonly<Config>,
  input: Context,
  product: ProductIdentity = { appid: "io.openmotion.app", name: "open-motion", scheme: "open-motion" },
): Manifest {
  const context = Object.freeze({ channel: releaseChannel(input.channel), version: input.version });
  parseReleaseVersion(context.version, context.channel);
  const base = channelDescriptor(context.channel, product);
  const name = evaluate(config.name, base.name, context, "name");
  const scheme = evaluate(config.scheme, base.scheme, context, "scheme");
  const version = evaluate(config.version, context.version, context, "version");
  return parse({
    channel: context.channel,
    identity: {
      appid: base.appid,
      name,
      origin: `${scheme}://carrier`,
      scheme,
      version,
    },
    schema: 1,
  });
}

export function distinct(manifests: Manifest[]): void {
  const fields = ["appid", "name", "scheme"] as const;
  for (const field of fields) {
    const values = manifests.map((item) => item.identity[field].toLowerCase());
    if (new Set(values).size !== values.length) throw new Error(`release ${field} collision`);
  }
  const channels = manifests.map((item) => item.channel);
  if (new Set(channels).size !== channels.length) throw new Error("release channel collision");
}
