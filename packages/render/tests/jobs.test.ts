import { randomUUID } from "node:crypto";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { digest } from "@odsuite/protocol";
import { expect, it } from "vitest";
import { Store } from "@/jobs/store.js";

it("bounds retried intent as well as new submissions and preserves unknown receipts across journal reopen", async () => {
  const root = await mkdtemp(join(tmpdir(), "export-journal-")),
    owner = { sessionId: randomUUID(), artifactId: randomUUID() },
    input = {
      ...owner,
      requestId: randomUUID(),
      revision: digest("fixed source"),
      fps: { num: 30, den: 1 },
      projection: { digest: digest("frozen source"), bytes: 100 },
    };
  let store = new Store(root);
  try {
    const original = store.create(input),
      cancel = { ...owner, id: original.id, requestId: randomUUID(), expectedVersion: original.version },
      cancelled = store.control("export_cancel", cancel),
      retry = { ...owner, id: original.id, requestId: randomUUID(), expectedVersion: cancelled.version };
    for (let n = 0; n < 32; n++) store.create({ ...input, requestId: randomUUID() });
    expect(() => store.control("export_retry", retry)).toThrow("queue is full");
    expect(store.owned({ ...owner, id: original.id }).job).toEqual(cancelled);
    // A rejected transaction must not consume the request identity.
    const queued = store.list({ ...owner, limit: 1 }).jobs[0]!;
    store.control("export_cancel", {
      ...owner,
      id: queued.id,
      requestId: randomUUID(),
      expectedVersion: queued.version,
    });
    const accepted = store.control("export_retry", retry);
    expect(accepted.state).toBe("queued");
    expect(accepted.attempt).not.toBe(original.attempt);
    expect(() => store.create({ ...input, requestId: randomUUID() })).toThrow("queue is full");
    store.close();
    store = new Store(root);
    expect(store.control("export_retry", retry)).toEqual(accepted);
    expect(store.create(input)).toEqual(original);
    const record = store.owned({ ...owner, id: original.id });
    record.diagnostic = join(root, "private failure path");
    record.job.error = "Export execution failed; inspect renderer journal diagnostics";
    store.write(record);
    expect(JSON.stringify(store.list(owner))).not.toContain(root);
    expect(store.read(original.id).diagnostic).toContain(root);
  } finally {
    store.close();
    await rm(root, { recursive: true, force: true });
  }
});
