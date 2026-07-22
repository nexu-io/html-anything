"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useT } from "@/lib/i18n";
import {
  getServerProject,
  ProjectClientError,
  unregisterServerProject,
} from "@/lib/projects/client";
import { usePersistHydrated, useStore } from "@/lib/store";
import { useProjectAutosave } from "@/lib/use-project-autosave";
import { EditorWorkspace } from "./editor-workspace";

type LoadState =
  | { status: "loading" }
  | { status: "ready"; projectId: string; taskId: string }
  | { status: "not-found" }
  | { status: "error" };

export function ProjectWorkspace({ projectId }: { projectId: string }) {
  const hydrated = usePersistHydrated();
  const loadServerProject = useStore((state) => state.loadServerProject);
  const removeServerProject = useStore((state) => state.removeServerProject);
  const projectName = useStore(
    (state) =>
      state.tasks.find((task) => task.serverProjectId === projectId)?.name,
  );
  const [loadState, setLoadState] = useState<LoadState>({ status: "loading" });
  const [loadAttempt, setLoadAttempt] = useState(0);
  const [unregisterFailed, setUnregisterFailed] = useState(false);
  const unregisteringRef = useRef(false);
  const router = useRouter();
  const t = useT();
  const ready =
    loadState.status === "ready" && loadState.projectId === projectId;
  const taskId = ready ? loadState.taskId : "";
  const autosave = useProjectAutosave({
    projectId,
    taskId,
    enabled: ready,
  });

  useEffect(() => {
    if (!hydrated) return;

    let cancelled = false;
    setLoadState({ status: "loading" });
    setUnregisterFailed(false);

    void getServerProject(projectId)
      .then((snapshot) => {
        if (cancelled) return;
        const loadedTaskId = loadServerProject(snapshot);
        setLoadState({ status: "ready", projectId, taskId: loadedTaskId });
      })
      .catch((error: unknown) => {
        if (cancelled) return;
        setLoadState({
          status:
            error instanceof ProjectClientError &&
            error.code === "project_not_found"
              ? "not-found"
              : "error",
        });
      });

    return () => {
      cancelled = true;
      removeServerProject(projectId);
    };
  }, [hydrated, loadAttempt, loadServerProject, projectId, removeServerProject]);

  const retryLoad = useCallback(() => {
    setLoadAttempt((attempt) => attempt + 1);
  }, []);

  const unregister = useCallback(() => {
    if (!ready || unregisteringRef.current) return;
    if (!window.confirm(t("project.unregisterConfirm", { name: projectName ?? projectId }))) {
      return;
    }

    unregisteringRef.current = true;
    setUnregisterFailed(false);
    void unregisterServerProject(projectId)
      .then(() => {
        removeServerProject(projectId);
        router.replace("/");
      })
      .catch(() => {
        unregisteringRef.current = false;
        setUnregisterFailed(true);
      });
  }, [projectId, projectName, ready, removeServerProject, router, t]);

  if (!hydrated || !ready) {
    const status = hydrated ? loadState.status : "loading";
    return (
      <ProjectLoadState
        status={status === "ready" ? "loading" : status}
        onRetry={retryLoad}
      />
    );
  }

  return (
    <>
      <EditorWorkspace
        projectMode={{
          projectId,
          saveState: autosave.state,
          onRetry: autosave.retry,
          onUnregister: unregister,
        }}
      />
      {unregisterFailed && (
        <div
          role="alert"
          className="fixed bottom-5 left-1/2 z-50 -translate-x-1/2 rounded-full border px-4 py-2 text-xs text-[var(--red)] shadow-lg"
          style={{ background: "var(--surface)", borderColor: "var(--line)" }}
        >
          {t("project.unregisterFailed")}
        </div>
      )}
    </>
  );
}

function ProjectLoadState({
  status,
  onRetry,
}: {
  status: "loading" | "not-found" | "error";
  onRetry: () => void;
}) {
  const t = useT();
  const message =
    status === "loading"
      ? t("project.loading")
      : status === "not-found"
        ? t("project.notFound")
        : t("project.loadFailed");

  return (
    <main className="grid h-screen place-items-center bg-[var(--paper)] px-6">
      <div className="flex max-w-md flex-col items-center gap-4 text-center">
        <p role="alert" className="text-sm text-[var(--ink-mute)]">
          {message}
        </p>
        {status !== "loading" && (
          <button type="button" className="btn-ghost" onClick={onRetry}>
            {t("project.retry")}
          </button>
        )}
      </div>
    </main>
  );
}
