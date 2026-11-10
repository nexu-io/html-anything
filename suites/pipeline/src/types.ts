import type { Identity, Package } from "@odsuite/pack";
import type { Manifest } from "@odsuite/release";
export type Carrier = Identity["carrier"];
export const carriers: Carrier[] = ["standalone", "codexplugin"];
export interface Selection {
  root: string;
  channel: string;
  version?: string;
  base?: string;
  number?: number;
}
export interface Configuration {
  root: string;
  channel: string;
  baseVersion: string;
  product: { appid: string; name: string; scheme: string };
  units: Record<Carrier, string>;
}
export interface BuildReceipt {
  channel: string;
  version: string;
  manifest: Manifest;
  source: string | null;
  fingerprint: string;
  directory: string;
  carriers: Record<Carrier, string>;
}
export interface PackReceipt {
  channel: string;
  version: string;
  source: string | null;
  fingerprint: string;
  packages: Record<Carrier, Package>;
}
export type Gate = "policy" | "tests" | "artifacts";
export interface CheckReceipt {
  gate: Gate;
  channel: string;
  result: "passed" | "failed";
  source: string | null;
  fingerprint: string;
  details: unknown;
}
