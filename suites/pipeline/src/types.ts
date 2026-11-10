import type { Package } from "@odsuite/pack";
import type { NpmArtifact } from "@odsuite/pack/npm";
import type { Manifest } from "@odsuite/release";
import type { Application } from "./application.js";
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
  units: Record<string, string>;
  namespace: string;
  application: Application;
}
export interface BuildReceipt {
  channel: string;
  version: string;
  manifest: Manifest;
  source: string | null;
  fingerprint: string;
  directory: string;
  carriers: Record<string, string>;
  application: string;
}
export interface PackReceipt {
  channel: string;
  version: string;
  source: string | null;
  fingerprint: string;
  packages: Record<string, Package>;
  npm: NpmArtifact;
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
