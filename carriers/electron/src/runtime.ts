import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { decode, type Manifest } from "@odsuite/release";

export interface Runtime {
  daemon: string;
  data: string;
  manifest: Manifest;
  probe: boolean;
  token: string;
  web: string;
}

function required(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is required`);
  return value;
}

export function runtime(): Runtime {
  const manifest = decode(readFileSync(required("ODSUITE_RUNTIME_RELEASE"), "utf8"));
  return Object.freeze({
    daemon: required("ODSUITE_RUNTIME_DAEMON"),
    data: resolve(required("ODSUITE_RUNTIME_DATA")),
    manifest,
    probe: process.env.ODSUITE_RUNTIME_PROBE === "1",
    token: required("ODSUITE_RUNTIME_TOKEN"),
    web: resolve(required("ODSUITE_RUNTIME_WEB")),
  });
}
