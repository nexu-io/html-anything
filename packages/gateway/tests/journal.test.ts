import { randomUUID } from "node:crypto";
import { mkdirSync, mkdtempSync } from "node:fs";
import { join } from "node:path";
import { DatabaseSync } from "node:sqlite";
import { fileURLToPath } from "node:url";
import { digest } from "@odsuite/protocol";
import { expect, it } from "vitest";
import { generationSchemas } from "@";
import { Store } from "../src/store.js";

function fixture() {
  const directory = fileURLToPath(new URL("../../../.artifacts/gateway/", import.meta.url));
  mkdirSync(directory, { recursive: true });
  const root = mkdtempSync(`${directory}journal-`),
    store = new Store(root);
  const input = generationSchemas.generation_create.parse({
    sessionId: randomUUID(),
    artifactId: randomUUID(),
    revision: digest("revision"),
    providerId: "fixture",
    providerVersion: "account-v1",
    modelId: "png-v1",
    prompt: "PNG",
    requestId: randomUUID(),
  });
  return { store, input, root };
}
it("checks original canonical intent before provider availability and rejects changed intent/operation", () => {
  const { store, input } = fixture();
  try {
    const original = store.create(input, () => {});
    expect(
      store.create(input, () => {
        throw Error("offline adapter must never be resolved");
      }),
    ).toEqual(original);
    for (const update of [
      { revision: digest("other") },
      { modelId: "other" },
      { providerVersion: "other" },
      { prompt: "Other" },
      { artifactId: randomUUID() },
      { sessionId: randomUUID() },
    ])
      expect(() => store.create({ ...input, ...update }, () => {})).toThrowError(
        expect.objectContaining({ code: "idempotency" }),
      );
    expect(() =>
      store.cancel({
        sessionId: input.sessionId,
        artifactId: input.artifactId,
        id: original.id,
        requestId: input.requestId,
        expectedVersion: 0,
      }),
    ).toThrowError(expect.objectContaining({ code: "idempotency" }));
  } finally {
    store.close();
  }
});
it("rejects inconsistent committed submission state instead of ever submitting it again", () => {
  const { store, input, root } = fixture();
  const value = store.create(input, () => {});
  store.close();
  const database = new DatabaseSync(join(root, "generations.sqlite"));
  const corrupt = JSON.stringify({ ...value, submission: "accepted", remoteId: "already-accepted" });
  try {
    database.prepare("UPDATE jobs SET record=? WHERE id=?").run(corrupt, value.id);
    expect(() => new Store(root)).toThrowError(expect.objectContaining({ code: "integrity" }));
    expect(() => new Store(root)).toThrowError(expect.objectContaining({ code: "integrity" }));
    expect(database.prepare("SELECT record FROM jobs WHERE id=?").get(value.id)?.record).toBe(corrupt);
  } finally {
    database.close();
  }
});
it("bounds active intent at 32 and uses explicit optimistic cancellation receipts", () => {
  const { store, input } = fixture();
  try {
    const jobs = Array.from({ length: 32 }, () => store.create({ ...input, requestId: randomUUID() }, () => {}));
    expect(() => store.create({ ...input, requestId: randomUUID() }, () => {})).toThrowError(
      expect.objectContaining({ code: "invalid" }),
    );
    const job = jobs[0];
    if (!job) throw Error("missing job");
    const command = {
      sessionId: input.sessionId,
      artifactId: input.artifactId,
      id: job.id,
      requestId: randomUUID(),
      expectedVersion: 0,
    };
    const cancelled = store.cancel(command);
    expect(cancelled).toMatchObject({ state: "cancelled", submission: "not-started" });
    expect(store.cancel(command)).toEqual(cancelled);
    expect(() => store.cancel({ ...command, requestId: randomUUID() })).toThrowError(
      expect.objectContaining({ code: "conflict" }),
    );
    const unresolved = store.create({ ...input, requestId: randomUUID() }, () => {});
    unresolved.state = "interrupted";
    unresolved.submission = "unknown";
    store.write(unresolved);
    expect(() => store.create({ ...input, requestId: randomUUID() }, () => {})).toThrow(
      "unresolved tasks require reconciliation",
    );
    expect(store.list({ sessionId: input.sessionId, artifactId: input.artifactId, limit: 16 }).jobs).toHaveLength(16);
  } finally {
    store.close();
  }
});
