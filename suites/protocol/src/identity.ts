declare const channelmark: unique symbol;
declare const namespacemark: unique symbol;

export type Channel = string & { readonly [channelmark]: true };
export type Namespace = string & { readonly [namespacemark]: true };

export function channel(value: string): Channel {
  if (typeof value !== "string" || value.trim() !== value || !/^[a-z0-9]{1,12}$/.test(value))
    throw new TypeError("channel must be 1-12 lowercase letters or digits");
  return value as Channel;
}

export function namespace(value: string): Namespace {
  if (typeof value !== "string" || value.trim() !== value || !/^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$/.test(value))
    throw new TypeError("namespace must contain lowercase words separated by single hyphens");
  return value as Namespace;
}

export interface FactoryScope {
  channel: Channel;
  namespace: Namespace;
}
export function factoryScope(input: unknown): Readonly<FactoryScope> {
  if (!input || typeof input !== "object" || Array.isArray(input))
    throw new TypeError("factory scope requires channel and namespace");
  const value = input as FactoryScope;
  return Object.freeze({ channel: channel(value.channel), namespace: namespace(value.namespace) });
}
export const factoryKey = (scope: FactoryScope): string => {
  const value = factoryScope(scope);
  return JSON.stringify([value.channel, value.namespace]);
};
