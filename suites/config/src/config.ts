import type { Channel } from "@odsuite/protocol";

export interface Context {
  channel: Channel;
  version: string;
}

export type Provider = (context: Readonly<Context>) => string;

export interface Config {
  name?: Provider;
  scheme?: Provider;
  version?: Provider;
}

export function define(config: Config = {}): Readonly<Config> {
  for (const [name, value] of Object.entries(config)) {
    if (typeof value !== "function") throw new TypeError(`${name} must be a function`);
  }
  return Object.freeze({ ...config });
}
