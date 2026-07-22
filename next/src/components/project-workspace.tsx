"use client";

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
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

type WorkspaceLifetime = {
  active: boolean;
  projectId: string;
};

type UnregisterAttempt = {
  id: number;
  projectId: string;
  lifetime: WorkspaceLifetime;
};

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
  const [unregistering, setUnregistering] = useState(false);
  const [unregisterFailed, setUnregisterFailed] = useState(false);
  const unregisteringRef = useRef(false);
  const unregisterAttemptIdRef = useRef(0);
  const unregisterAttemptRef = useRef<UnregisterAttempt | null>(null);
  const unregisterRequestStartedRef = useRef<number | null>(null);
  const workspaceLifetimeRef = useRef<WorkspaceLifetime | null>(null);
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

  useLayoutEffect(() => {
    const lifetime: WorkspaceLifetime = { active: true, projectId };
    workspaceLifetimeRef.current = lifetime;
    unregisteringRef.current = false;
    unregisterAttemptRef.current = null;
    unregisterRequestStartedRef.current = null;
    setUnregistering(false);
    setUnregisterFailed(false);

    return () => {
      lifetime.active = false;
      if (workspaceLifetimeRef.current !== lifetime) return;
      workspaceLifetimeRef.current = null;
      unregisteringRef.current = false;
      unregisterAttemptRef.current = null;
      unregisterRequestStartedRef.current = null;
    };
  }, [projectId]);

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
    if (!ready || !autosave.canUnregister || unregisteringRef.current) return;
    if (!window.confirm(t("project.unregisterConfirm", { name: projectName ?? projectId }))) {
      return;
    }

    const lifetime = workspaceLifetimeRef.current;
    if (
      lifetime === null ||
      !lifetime.active ||
      lifetime.projectId !== projectId
    ) {
      return;
    }

    const attempt: UnregisterAttempt = {
      id: unregisterAttemptIdRef.current + 1,
      projectId,
      lifetime,
    };
    unregisterAttemptIdRef.current = attempt.id;
    unregisterAttemptRef.current = attempt;
    unregisteringRef.current = true;
    setUnregisterFailed(false);
    setUnregistering(true);
  }, [autosave.canUnregister, projectId, projectName, ready, t]);

  useEffect(() => {
    const attempt = unregisterAttemptRef.current;
    if (
      !unregistering ||
      attempt === null ||
      unregisterRequestStartedRef.current === attempt.id
    ) {
      return;
    }

    const isCurrentAttempt = () =>
      attempt.lifetime.active &&
      attempt.lifetime.projectId === attempt.projectId &&
      workspaceLifetimeRef.current === attempt.lifetime &&
      unregisterAttemptRef.current === attempt;
    if (!isCurrentAttempt()) return;

    unregisterRequestStartedRef.current = attempt.id;
    void unregisterServerProject(attempt.projectId)
      .then(() => {
        if (!isCurrentAttempt()) return;
        unregisterAttemptRef.current = null;
        unregisteringRef.current = false;
        removeServerProject(attempt.projectId);
        router.replace("/");
      })
      .catch(() => {
        if (!isCurrentAttempt()) return;
        unregisterAttemptRef.current = null;
        unregisteringRef.current = false;
        unregisterRequestStartedRef.current = null;
        setUnregistering(false);
        setUnregisterFailed(true);
      });
  }, [projectId, removeServerProject, router, unregistering]);

  if (!hydrated || !ready) {
    const status = hydrated ? loadState.status : "loading";
    return (
      <ProjectLoadState
        status={status === "ready" ? "loading" : status}
        onRetry={retryLoad}
      />
    );
  }

  if (unregistering) {
    return <ProjectUnregisteringState />;
  }

  return (
    <>
      <EditorWorkspace
        projectMode={{
          projectId,
          saveState: autosave.state,
          canUnregister: autosave.canUnregister,
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

function ProjectUnregisteringState() {
  const t = useT();

  return (
    <main className="grid h-screen place-items-center bg-[var(--paper)] px-6">
      <p role="status" className="text-sm text-[var(--ink-mute)]">
        {t("project.unregistering")}
      </p>
    </main>
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
