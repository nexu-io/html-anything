export const gates = ["G0", "G1", "G2", "G3", "G4", "G5", "G6"] as const;
export const ids = [
  "BUILD-01",
  "BUILD-03",
  "PUB-01",
  "PUB-02",
  "PUB-10",
  "REC-04",
  "REC-07",
  "PKG-01",
  "PKG-06",
  "PKG-07",
  "PKG-09",
  "PKG-10",
  "UPD-ALL",
  "G5-NATIVE",
  "G6-REMOTE",
] as const;

export type Gate = (typeof gates)[number];
export type Id = (typeof ids)[number];
export type Status = "passed" | "failed" | "unqualified";

export interface Definition {
  expected: string;
  gate: Gate;
  id: Id;
}

export const matrix: readonly Definition[] = Object.freeze([
  { expected: "repository boundary valid", gate: "G0", id: "BUILD-01" },
  { expected: "equal inputs produce equal generation identity", gate: "G1", id: "BUILD-03" },
  { expected: "first publish restores complete verified objects", gate: "G2", id: "PUB-01" },
  { expected: "identical publication is idempotent", gate: "G2", id: "PUB-02" },
  { expected: "untrusted proof is rejected", gate: "G2", id: "PUB-10" },
  { expected: "interrupted attempt blocks ordinary startup", gate: "G4", id: "REC-04" },
  { expected: "explicit verified target recovers and commits", gate: "G4", id: "REC-07" },
  { expected: "packaged Electron installs and launches", gate: "G3", id: "PKG-01" },
  { expected: "private protocol rejects escape and mounted tamper", gate: "G3", id: "PKG-06" },
  { expected: "commit waits for mounted runtime readiness", gate: "G3", id: "PKG-07" },
  { expected: "installed runtime retires with zero survivors", gate: "G3", id: "PKG-09" },
  { expected: "real Chromium reaches renderer readiness", gate: "G3", id: "PKG-10" },
  { expected: "four-piece update activates without rebuilding Carrier", gate: "G4", id: "UPD-ALL" },
  { expected: "native signing and installer are qualified", gate: "G5", id: "G5-NATIVE" },
  { expected: "remote storage and CDN are qualified", gate: "G6", id: "G6-REMOTE" },
]);
