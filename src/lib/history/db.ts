"use client";

/**
 * IndexedDB-backed history store for per-task HTML versions.
 *
 * Why IDB and not the existing zustand-persist (localStorage)? localStorage
 * caps around 5 MB origin-wide and our HTML payloads are routinely 30-100 KB
 * each. A handful of converted tasks with a dozen versions would push us past
 * the quota; the store would then silently drop writes. IndexedDB has gigabyte
 * budgets in every modern browser and stores binary-friendly Blobs without the
 * UTF-16 doubling tax localStorage pays.
 *
 * Versions live exclusively here — the zustand store keeps only the "current"
 * + "previous baseline" pair it needs for diff-edit mode.
 */

import { openDB, type DBSchema, type IDBPDatabase } from "idb";
import type { RunStats } from "@/lib/store";

const DB_NAME = "html-anything-history";
const DB_VERSION = 1;
const STORE = "runs";

/** Cap per task. Anything older rolls off so a single noisy task can't blow
 *  through the user's IDB quota on its own. */
export const MAX_VERSIONS_PER_TASK = 20;

export type RunRecord = {
  /** `${taskId}__${version}` — monotonic, sortable, single primary key. */
  id: string;
  taskId: string;
  /** 1-based, increments on every commit for the same task. */
  version: number;
  html: string;
  content: string;
  /** Wall-clock time the run finished. */
  ts: number;
  /** Snapshot of the convert pipeline stats at commit time. */
  stats: RunStats;
  /** Template id at commit time — lets the history pane label entries even
   *  if the user has since switched templates on the task. */
  templateId?: string;
};

interface HistoryDB extends DBSchema {
  [STORE]: {
    key: string;
    value: RunRecord;
    indexes: {
      "by-task": string;
      "by-task-version": [string, number];
    };
  };
}

let dbPromise: Promise<IDBPDatabase<HistoryDB>> | null = null;

function getDB(): Promise<IDBPDatabase<HistoryDB>> {
  if (typeof indexedDB === "undefined") {
    return Promise.reject(new Error("IndexedDB is not available in this environment"));
  }
  if (!dbPromise) {
    dbPromise = openDB<HistoryDB>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains(STORE)) {
          const store = db.createObjectStore(STORE, { keyPath: "id" });
          store.createIndex("by-task", "taskId");
          store.createIndex("by-task-version", ["taskId", "version"]);
        }
      },
    });
  }
  return dbPromise;
}

function makeId(taskId: string, version: number): string {
  return `${taskId}__${version.toString(36).padStart(6, "0")}`;
}

export type PutRunInput = Omit<RunRecord, "id" | "version">;

/**
 * Append a new version for the task. Returns the saved record (or null if
 * IDB is unavailable — caller treats that as a soft failure, history is a
 * nice-to-have, not load-bearing for the convert pipeline).
 */
export async function putRun(input: PutRunInput): Promise<RunRecord | null> {
  let db: IDBPDatabase<HistoryDB>;
  try {
    db = await getDB();
  } catch {
    return null;
  }
  const tx = db.transaction(STORE, "readwrite");
  const idx = tx.store.index("by-task-version");
  // Find the highest version for this task by walking the composite index
  // in reverse — single seek, no scan over other tasks.
  const cursor = await idx.openKeyCursor(
    IDBKeyRange.bound([input.taskId, -Infinity], [input.taskId, Infinity]),
    "prev",
  );
  const nextVersion = cursor ? (cursor.key as [string, number])[1] + 1 : 1;
  const record: RunRecord = {
    ...input,
    id: makeId(input.taskId, nextVersion),
    version: nextVersion,
  };
  await tx.store.put(record);
  await tx.done;
  // GC after commit so reads in the same tick don't see a half-pruned list.
  await pruneTask(input.taskId);
  return record;
}

/** Versions for a task, newest first. */
export async function listRuns(taskId: string): Promise<RunRecord[]> {
  let db: IDBPDatabase<HistoryDB>;
  try {
    db = await getDB();
  } catch {
    return [];
  }
  const rows = await db.getAllFromIndex(STORE, "by-task", taskId);
  rows.sort((a, b) => b.version - a.version);
  return rows;
}

export async function getRun(taskId: string, version: number): Promise<RunRecord | undefined> {
  let db: IDBPDatabase<HistoryDB>;
  try {
    db = await getDB();
  } catch {
    return undefined;
  }
  return db.get(STORE, makeId(taskId, version));
}

/** Drop every version belonging to a task (used by deleteTask). */
export async function deleteTaskRuns(taskId: string): Promise<void> {
  let db: IDBPDatabase<HistoryDB>;
  try {
    db = await getDB();
  } catch {
    return;
  }
  const tx = db.transaction(STORE, "readwrite");
  const idx = tx.store.index("by-task");
  for await (const cursor of idx.iterate(taskId)) {
    await cursor.delete();
  }
  await tx.done;
}

export async function deleteRun(taskId: string, version: number): Promise<void> {
  let db: IDBPDatabase<HistoryDB>;
  try {
    db = await getDB();
  } catch {
    return;
  }
  await db.delete(STORE, makeId(taskId, version));
}

/**
 * Keep the latest `MAX_VERSIONS_PER_TASK` versions per task — anything older
 * gets pruned. We iterate the composite index in descending order, skip the
 * first N keepers, and delete the tail.
 */
async function pruneTask(taskId: string): Promise<void> {
  const db = await getDB();
  const tx = db.transaction(STORE, "readwrite");
  const idx = tx.store.index("by-task-version");
  let kept = 0;
  for await (const cursor of idx.iterate(
    IDBKeyRange.bound([taskId, -Infinity], [taskId, Infinity]),
    "prev",
  )) {
    if (kept < MAX_VERSIONS_PER_TASK) {
      kept++;
      continue;
    }
    await cursor.delete();
  }
  await tx.done;
}

/** Test / dev helper — clears every run record. Not wired into the UI. */
export async function clearAll(): Promise<void> {
  let db: IDBPDatabase<HistoryDB>;
  try {
    db = await getDB();
  } catch {
    return;
  }
  await db.clear(STORE);
}
