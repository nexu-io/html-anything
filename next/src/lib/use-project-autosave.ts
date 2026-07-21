"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { PROJECT_AUTOSAVE_DELAY_MS, type PatchProjectInput } from "./projects/contracts";
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
}): { state: SaveState; retry: () => void } {
  const task = useStore((store) =>
    store.tasks.find((candidate) => candidate.id === taskId),
  );
  const content = task?.content ?? "";
  const html = task?.html ?? "";
  const templateId = task?.templateId ?? "";
  const status = task?.status ?? "idle";
  const isProjectTask = task?.serverProjectId === projectId;
  const [state, setState] = useState<SaveState>("idle");
  const identity = `${projectId}:${taskId}`;
  const latestRef = useRef<ProjectValues>({ content, html, templateId });
  const savedRef = useRef<ProjectValues | null>(null);
  const identityRef = useRef<string | null>(null);
  const eligibleRef = useRef(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const requestRef = useRef(false);
  const queuedRef = useRef(false);
  latestRef.current = { content, html, templateId };
  eligibleRef.current = enabled && isProjectTask && status !== "running";

  const clearTimer = useCallback(() => {
    if (timerRef.current !== null) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const saveLatest = useCallback(async () => {
    if (!eligibleRef.current) return;
    if (requestRef.current) {
      queuedRef.current = true;
      return;
    }
    const latest = latestRef.current;
    const patch = changedFields(savedRef.current, latest);
    if (Object.keys(patch).length === 0) return;

    requestRef.current = true;
    let saved = false;
    setState("saving");
    try {
      await patchServerProject(projectId, patch);
      if (identityRef.current !== identity) return;
      savedRef.current = latest;
      saved = true;
      setState("saved");
    } catch {
      if (identityRef.current === identity) setState("failed");
    } finally {
      requestRef.current = false;
      if (saved && queuedRef.current && identityRef.current === identity) {
        queuedRef.current = false;
        void saveLatest();
      } else if (!saved) {
        queuedRef.current = false;
      }
    }
  }, [identity, projectId]);

  useEffect(() => {
    clearTimer();
    const latest = latestRef.current;
    if (identityRef.current !== identity) {
      identityRef.current = identity;
      savedRef.current = latest;
      setState("idle");
      return;
    }
    if (!enabled || !isProjectTask || status === "running") return;
    if (Object.keys(changedFields(savedRef.current, latest)).length === 0) return;

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

  return { state, retry };
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
