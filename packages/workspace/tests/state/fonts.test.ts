import { createHash, randomUUID } from "node:crypto";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { expect, it } from "vitest";
import { identifyResource, initialFiles, Workspace } from "@";
import { isFontResource, resourceFontFamily } from "@/contract.js";

// Reuse the finite licensed template font fixtures without copying assets or introducing a domain dependency.
const faces = JSON.parse(readFileSync(new URL("../../../templates/src/native/fonts.json", import.meta.url), "utf8"))
  .faces as { family: string; data: string }[];
it("derives single-face font metadata and exact-byte identity from actual licensed WOFF2 fonts", () => {
  for (const [index, face] of faces.entries()) {
    const font = identifyResource("assets/face.woff2", "Display label", Buffer.from(face.data, "base64"));
    expect(isFontResource(font)).toBe(true);
    if (!isFontResource(font)) throw Error("expected font");
    // Template CSS display names may differ from the font's own names; never infer metadata from those labels.
    expect(font.family).toBe(["Inter", "Libre Baskerville", "Libre Franklin Thin"][index]);
    expect(font.postscriptName).toBeTruthy();
    expect(font.weight[0]).toBeLessThanOrEqual(font.weight[1]);
    expect(resourceFontFamily(font.digest)).toMatch(/^OpenMotionFont_[a-f0-9]{64}$/);
    expect(font.bytes).toBe(Buffer.from(face.data, "base64").length);
  }
});
it("rejects extension mismatches, truncation, collections and oversized decompression declarations", () => {
  const bytes = Buffer.from(faces[0]!.data, "base64");
  for (const suffix of ["ttf", "otf", "woff", "png"])
    expect(() => identifyResource(`assets/wrong.${suffix}`, "Invalid", bytes)).toThrow();
  expect(() => identifyResource("assets/truncated.woff2", "Invalid", bytes.subarray(0, 100))).toThrow();
  for (const [offset, value] of [
    [16, 32 * 1024 * 1024 + 1],
    [4, 0x74746366],
    [20, bytes.length],
  ] as const) {
    const bad = Buffer.from(bytes);
    bad.writeUInt32BE(value, offset);
    expect(() => identifyResource("assets/bad.woff2", "Invalid", bad)).toThrow();
  }
  const tableBomb = Buffer.alloc(55);
  tableBomb.write("wOF2");
  tableBomb.writeUInt32BE(0x10000, 4);
  tableBomb.writeUInt32BE(55, 8);
  tableBomb.writeUInt16BE(1, 12);
  tableBomb.writeUInt32BE(100, 16);
  tableBomb.writeUInt32BE(1, 20);
  tableBomb.set([1, 0xa0, 0x80, 0x80, 0x00], 48);
  expect(() => identifyResource("assets/bomb.woff2", "Invalid", tableBomb)).toThrow();
});
it("keeps font bytes in revision history, confirms original receipts before replay and survives cold reopen", () => {
  const root = mkdtempSync(join(tmpdir(), "workspace-font-"));
  let db = new Workspace(root);
  try {
    const session = db.execute("session_create", { requestId: randomUUID(), title: "Fonts", mode: "motion" }),
      artifact = db.execute("artifact_create", {
        requestId: randomUUID(),
        sessionId: session.id,
        title: "Text",
        files: initialFiles(),
      }),
      owner = { sessionId: session.id, artifactId: artifact.id },
      before = db.execute("project_read", owner),
      input = {
        ...owner,
        requestId: randomUUID(),
        expectedRevision: before.revision,
        path: "assets/inter.woff2",
        name: "Inter",
        data: faces[0]!.data,
      },
      imported = ingest(db, input),
      font = imported.resources[0]!;
    expect(imported.history.version).toBe(1);
    expect(ingest(db, input)).toEqual(imported);
    expect(db.execute("resource_read", { ...owner, revision: imported.revision, path: font.path }).data).toBe(
      input.data,
    );
    const removed = db.execute("resource_remove", {
      ...owner,
      requestId: randomUUID(),
      expectedRevision: imported.revision,
      path: font.path,
    });
    expect(removed.resources).toEqual([]);
    expect(ingest(db, input)).toEqual(imported);
    expect(db.execute("project_read", owner)).toEqual(removed);
    db.close();
    db = new Workspace(root);
    expect(db.execute("resource_read", { ...owner, revision: imported.revision, path: font.path }).resource).toEqual(
      font,
    );
    const restored = db.execute("project_undo", {
      ...owner,
      requestId: randomUUID(),
      expectedRevision: removed.revision,
      expectedHistory: removed.history.version,
    });
    expect(restored.resources).toEqual([font]);
    const invalid = {
      ...input,
      requestId: randomUUID(),
      expectedRevision: restored.revision,
      path: "assets/bad.woff2",
      data: Buffer.from("not a font").toString("base64"),
    };
    expect(() => ingest(db, invalid)).toThrow();
    expect(db.execute("project_read", owner)).toEqual(restored);
  } finally {
    db.close();
    rmSync(root, { recursive: true, force: true });
  }
});

/** Test fixture construction; production transports accept raw bytes and digest metadata. */
function ingest(
  db: Workspace,
  input: Omit<Parameters<Workspace["importResource"]>[0], "digest" | "bytes"> & { data: string },
) {
  const { data, ...intent } = input,
    bytes = Buffer.from(data, "base64");
  return db.importResource(
    { ...intent, digest: `sha256:${createHash("sha256").update(bytes).digest("hex")}`, bytes: bytes.length },
    bytes,
  );
}
