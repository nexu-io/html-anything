import type { Architecture, Package, Platform } from "@odsuite/pack";
import type { Manifest } from "@odsuite/release";

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
  carrier: number;
  namespace: string;
  product: { appid: string; name: string; scheme: string };
  units: Record<"carrier" | "capsule" | "daemon" | "web", string>;
  outputs: Record<"carrier" | "capsule" | "daemon" | "web", string>;
  blobs: Record<string, string>;
}
export interface BuildReceipt {
  schema: 1;
  channel: string;
  version: string;
  manifest: Manifest;
  source: string | null;
  fingerprint: string;
  generation: string;
  content: string;
  carrier: string;
  carrierABI: number;
  namespace: string;
}
export interface PackReceipt {
  schema: 1;
  channel: string;
  version: string;
  fingerprint: string;
  source: string | null;
  platform: Platform;
  arch: Architecture;
  package: Package;
  inventory: string;
  artifact: { path: string; sha256: string; bytes: number };
}
export type Gate = "policy" | "tests" | "artifacts" | "installed" | "desktop";
export interface CheckReceipt {
  schema: 1;
  gate: Gate;
  channel: string;
  result: "passed" | "failed";
  source: string | null;
  fingerprint: string;
  artifact?: string;
  details: unknown;
}
