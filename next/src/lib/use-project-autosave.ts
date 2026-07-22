"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  PROJECT_AUTOSAVE_DELAY_MS,
  type PatchProjectInput,
} from "./projects/contracts";
import { patchServerProject } from "./projects/client";
import { useStore } from "./store";

export type SaveState = "idle" | "saving" | "saved" | "failed";

type ProjectValues = {
  content: string;
  html: string;
  templateId: string;
};

export function useProjectAutosave({
  projectId,
  taskId,
  enabled,
}: {
  projectId: string;
  taskId: string;
  enabled: boolean;
}): { state: SaveState; retry: () => void; canUnregister: boolean } {
  const task = useStore((store) =>
    store.tasks.find((candidate) => candidate.id === taskId),
  );
  const content = task?.content ?? "";
  const html = task?.html ?? "";
  const templateId = task?.templateId ?? "";
  const status = task?.status ?? "idle";
  const isProjectTask = task?.serverProjectId === projectId;
  const [state, setState] = useState<SaveState>("idle");
  const stateRef = useRef(state);
  stateRef.current = state;
  const identity = `${projectId}:${taskId}`;
  const latestRef = useRef<ProjectValues>({ content, html, templateId });
  const savedRef = useRef<ProjectValues | null>(null);
  const identityRef = useRef<string | null>(null);
  const eligibleRef = useRef(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const deadlinesRef = useRef(new Map<string, number>());
  const requestsRef = useRef(new Set<string>());
  const queuedRef = useRef(new Set<string>());
  const projectedRef = useRef(new Map<string, ProjectValues>());
  latestRef.current = { content, html, templateId };
  eligibleRef.current = enabled && isProjectTask && status !== "running";
  const currentIdentity = identityRef.current === identity;
  const durableValues = currentIdentity ? savedRef.current : latestRef.current;
  const dirty =
    durableValues !== null && !sameValues(durableValues, latestRef.current);
  const requestPending = requestsRef.current.has(identity);
  const saveFailed = currentIdentity && state === "failed" && dirty;
  const visibleState: SaveState = saveFailed
    ? "failed"
    : dirty || requestPending || queuedRef.current.has(identity)
      ? "saving"
      : currentIdentity && state !== "idle"
        ? "saved"
        : state;
  const canUnregister =
    enabled &&
    isProjectTask &&
    status !== "running" &&
    !dirty &&
    !requestPending &&
    !queuedRef.current.has(identity) &&
    !saveFailed;

  const clearTimer = useCallback(() => {
    if (timerRef.current !== null) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const saveLatest = useCallback(async () => {
    if (!eligibleRef.current) return;
    if (requestsRef.current.has(identity)) {
      queuedRef.current.add(identity);
      return;
    }
    const latest = latestRef.current;
    const patch = changedFields(savedRef.current, latest);
    if (Object.keys(patch).length === 0) return;

    requestsRef.current.add(identity);
    projectedRef.current.set(identity, latest);
    let saved = false;
    setState("saving");
    try {
      await patchServerProject(projectId, patch);
      if (identityRef.current !== identity) return;
      savedRef.current = latest;
      saved = true;
      if (sameValues(latestRef.current, latest)) setState("saved");
    } catch {
      if (identityRef.current === identity) {
        clearTimer();
        setState(
          savedRef.current !== null &&
            sameValues(latestRef.current, savedRef.current)
            ? "saved"
            : "failed",
        );
      }
    } finally {
      requestsRef.current.delete(identity);
      projectedRef.current.delete(identity);
      if (
        saved &&
        queuedRef.current.has(identity) &&
        identityRef.current === identity
      ) {
        queuedRef.current.delete(identity);
        clearTimer();
        const remaining = Math.max(
          0,
          (deadlinesRef.current.get(identity) ?? Date.now()) - Date.now(),
        );
        if (remaining === 0) {
          void saveLatest();
        } else {
          timerRef.current = setTimeout(() => {
            timerRef.current = null;
            void saveLatest();
          }, remaining);
        }
      } else {
        queuedRef.current.delete(identity);
        deadlinesRef.current.delete(identity);
      }
    }
  }, [clearTimer, identity, projectId]);

  useEffect(() => {
    clearTimer();
    const latest = latestRef.current;
    if (identityRef.current !== identity) {
      identityRef.current = identity;
      savedRef.current = latest;
      setState("idle");
      return;
    }
    const differsFromDurable =
      Object.keys(changedFields(savedRef.current, latest)).length > 0;
    if (differsFromDurable && stateRef.current !== "failed") {
      setState("saving");
    }
    if (!enabled || !isProjectTask || status === "running") return;
    const projected = projectedRef.current.get(identity) ?? savedRef.current;
    if (Object.keys(changedFields(projected, latest)).length === 0) {
      deadlinesRef.current.delete(identity);
      if (!requestsRef.current.has(identity) && !differsFromDurable) {
        setState((current) => (current === "idle" ? current : "saved"));
      }
      return;
    }
    if (stateRef.current === "failed") return;

    deadlinesRef.current.set(
      identity,
      Date.now() + PROJECT_AUTOSAVE_DELAY_MS,
    );
    timerRef.current = setTimeout(() => {
      timerRef.current = null;
      void saveLatest();
    }, PROJECT_AUTOSAVE_DELAY_MS);
    return clearTimer;
  }, [
    clearTimer,
    content,
    enabled,
    html,
    identity,
    isProjectTask,
    saveLatest,
    status,
    templateId,
  ]);

  useEffect(() => clearTimer, [clearTimer]);

  const retry = useCallback(() => {
    clearTimer();
    void saveLatest();
  }, [clearTimer, saveLatest]);

  return { state: visibleState, retry, canUnregister };
}

function changedFields(
  saved: ProjectValues | null,
  latest: ProjectValues,
): PatchProjectInput {
  if (saved === null) return {};
  const patch: PatchProjectInput = {};
  if (latest.content !== saved.content) patch.content = latest.content;
  if (latest.html !== saved.html) patch.html = latest.html;
  if (latest.templateId !== saved.templateId) {
    patch.templateId = latest.templateId;
  }
  return patch;
}

function sameValues(left: ProjectValues, right: ProjectValues): boolean {
  return (
    left.content === right.content &&
    left.html === right.html &&
    left.templateId === right.templateId
  );
}
