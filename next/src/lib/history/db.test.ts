import * as FDB from "fake-indexeddb";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { PutRunInput } from "./db";

function installIndexedDB() {
  vi.stubGlobal("indexedDB", new FDB.IDBFactory());
  vi.stubGlobal("IDBKeyRange", FDB.IDBKeyRange);
  vi.stubGlobal("IDBCursor", FDB.IDBCursor);
  vi.stubGlobal("IDBCursorWithValue", FDB.IDBCursorWithValue);
  vi.stubGlobal("IDBDatabase", FDB.IDBDatabase);
  vi.stubGlobal("IDBIndex", FDB.IDBIndex);
  vi.stubGlobal("IDBObjectStore", FDB.IDBObjectStore);
  vi.stubGlobal("IDBOpenDBRequest", FDB.IDBOpenDBRequest);
  vi.stubGlobal("IDBRequest", FDB.IDBRequest);
  vi.stubGlobal("IDBTransaction", FDB.IDBTransaction);
  vi.stubGlobal("IDBVersionChangeEvent", FDB.IDBVersionChangeEvent);
}

async function loadHistoryDb() {
  vi.resetModules();
  return import("./db");
}

function runInput(taskId: string, versionHint: number): PutRunInput {
  return {
    taskId,
    html: `<main>version ${versionHint}</main>`,
    content: `content ${versionHint}`,
    ts: 1_700_000_000_000 + versionHint,
    stats: {
      outputBytes: versionHint,
      deltaCount: versionHint,
    },
    templateId: "article-magazine",
  };
}

describe("history IndexedDB store", () => {
  beforeEach(() => {
    installIndexedDB();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("increments versions per task and lists newest first", async () => {
    const { getRun, listRuns, putRun } = await loadHistoryDb();

    const first = await putRun(runInput("task-a", 1));
    const second = await putRun(runInput("task-a", 2));

    expect(first?.version).toBe(1);
    expect(first?.id).toBe("task-a__000001");
    expect(second?.version).toBe(2);
    expect(second?.id).toBe("task-a__000002");

    const rows = await listRuns("task-a");
    expect(rows.map((row) => row.version)).toEqual([2, 1]);
    expect(rows.map((row) => row.html)).toEqual([
      "<main>version 2</main>",
      "<main>version 1</main>",
    ]);

    await expect(getRun("task-a", 1)).resolves.toMatchObject({
      version: 1,
      content: "content 1",
      templateId: "article-magazine",
    });
  });

  it("keeps only the newest versions for a noisy task", async () => {
    const { MAX_VERSIONS_PER_TASK, listRuns, putRun } = await loadHistoryDb();

    for (let versionHint = 1; versionHint <= MAX_VERSIONS_PER_TASK + 1; versionHint++) {
      await putRun(runInput("task-noisy", versionHint));
    }

    const rows = await listRuns("task-noisy");
    expect(rows).toHaveLength(MAX_VERSIONS_PER_TASK);
    expect(rows.map((row) => row.version)).toEqual(
      Array.from({ length: MAX_VERSIONS_PER_TASK }, (_, index) => MAX_VERSIONS_PER_TASK + 1 - index),
    );
    expect(rows.at(-1)?.version).toBe(2);
  });

  it("isolates task histories and deletes only the selected task", async () => {
    const { deleteTaskRuns, listRuns, putRun } = await loadHistoryDb();

    await putRun(runInput("task-a", 1));
    await putRun(runInput("task-a", 2));
    await putRun(runInput("task-a", 3));
    await putRun(runInput("task-b", 1));

    await expect(listRuns("task-a")).resolves.toHaveLength(3);
    await expect(listRuns("task-b")).resolves.toHaveLength(1);

    await deleteTaskRuns("task-a");

    await expect(listRuns("task-a")).resolves.toEqual([]);
    await expect(listRuns("task-b")).resolves.toMatchObject([
      {
        taskId: "task-b",
        version: 1,
      },
    ]);
  });

  it("deletes individual runs without disturbing newer versions", async () => {
    const { deleteRun, getRun, listRuns, putRun } = await loadHistoryDb();

    await putRun(runInput("task-a", 1));
    await putRun(runInput("task-a", 2));
    await putRun(runInput("task-a", 3));

    await deleteRun("task-a", 2);

    await expect(getRun("task-a", 2)).resolves.toBeUndefined();
    await expect(listRuns("task-a")).resolves.toMatchObject([
      { version: 3 },
      { version: 1 },
    ]);
  });

  it("treats unavailable IndexedDB as a soft failure", async () => {
    vi.stubGlobal("indexedDB", undefined);
    vi.stubGlobal("IDBKeyRange", undefined);

    const { clearAll, deleteRun, deleteTaskRuns, getRun, listRuns, putRun } = await loadHistoryDb();

    await expect(putRun(runInput("task-a", 1))).resolves.toBeNull();
    await expect(listRuns("task-a")).resolves.toEqual([]);
    await expect(getRun("task-a", 1)).resolves.toBeUndefined();
    await expect(deleteRun("task-a", 1)).resolves.toBeUndefined();
    await expect(deleteTaskRuns("task-a")).resolves.toBeUndefined();
    await expect(clearAll()).resolves.toBeUndefined();
  });
});
