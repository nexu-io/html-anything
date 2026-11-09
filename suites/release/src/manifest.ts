import { type Channel, canonical } from "@odsuite/protocol";

import { releaseChannel } from "./channel.js";
import { parseReleaseVersion } from "./version.js";

const appid = /^[a-z0-9]+(?:\.[a-z0-9]+)+$/;
const scheme = /^[a-z][a-z0-9+.-]*$/;

export interface Identity {
  appid: string;
  name: string;
  origin: string;
  scheme: string;
  version: string;
}

export interface Manifest {
  channel: Channel;
  identity: Identity;
  schema: 1;
}

function record(value: unknown, name: string): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new TypeError(`${name} must be an object`);
  }
  return value as Record<string, unknown>;
}

function keys(value: Record<string, unknown>, expected: string[], name: string): void {
  if (Object.keys(value).sort().join("\0") !== [...expected].sort().join("\0")) {
    throw new TypeError(`${name} has invalid fields`);
  }
}

function text(value: unknown, name: string): string {
  if (typeof value !== "string" || !value) throw new TypeError(`${name} must be a nonempty string`);
  return value;
}

export function parse(value: unknown): Manifest {
  const data = record(value, "manifest");
  keys(data, ["channel", "identity", "schema"], "manifest");
  if (data.schema !== 1) throw new TypeError("manifest.schema must be 1");
  const identity = record(data.identity, "manifest.identity");
  keys(identity, ["appid", "name", "origin", "scheme", "version"], "manifest.identity");
  const result: Manifest = {
    channel: releaseChannel(text(data.channel, "manifest.channel")),
    identity: {
      appid: text(identity.appid, "manifest.identity.appid"),
      name: text(identity.name, "manifest.identity.name"),
      origin: text(identity.origin, "manifest.identity.origin"),
      scheme: text(identity.scheme, "manifest.identity.scheme"),
      version: text(identity.version, "manifest.identity.version"),
    },
    schema: 1,
  };
  if (result.identity.origin !== `${result.identity.scheme}://carrier`) {
    throw new TypeError("manifest.identity.origin is inconsistent");
  }
  if (!appid.test(result.identity.appid)) throw new TypeError("manifest.identity.appid is invalid");
  if (!result.identity.name.trim()) throw new TypeError("manifest.identity.name is invalid");
  if (!scheme.test(result.identity.scheme)) throw new TypeError("manifest.identity.scheme is invalid");
  parseReleaseVersion(result.identity.version, result.channel);
  return result;
}

export function decode(value: string): Manifest {
  return parse(JSON.parse(value));
}

export function encode(value: Manifest): string {
  return `${canonical(parse(value))}\n`;
}
