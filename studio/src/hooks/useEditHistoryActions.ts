// fallow-ignore-file complexity
import { useCallback, useMemo, useRef } from "react";
import { STUDIO_MOTION_PATH } from "../components/editor/studioMotion";
import { serializeStudioFileMutations } from "../utils/studioFileMutationCoordinator";
import type { RestoreFiles } from "../utils/gsapUndoRestore";
import { whileScriptWrites } from "../player/previewReloading";
import {
  beginStudioShownRestore,
  cancelNewestStudioWaitingPress,
  hasStudioPendingEdits,
  paintBackNewestStudioPendingEdit,
} from "../utils/studioPendingEdits";
import { reportHistoryStep, takeHistoryTrigger } from "../motion/editorTracking";

interface HistoryResult {
  ok: boolean;
  reason?: string;
  message?: string;
  label?: string;
  paths?: string[];
  undoes?: string;
  /** Per-file restored/previous content, used to soft-apply the preview. */
  files?: RestoreFiles;
}
interface HistoryFileCallbacks {
  readFile: (path: string) => Promise<string>;
  serialize?: <T>(paths: readonly string[], task: () => Promise<T>) => Promise<T>;
  claimedAfter?: number;
}
export interface EditHistoryHandle {
  canUndo: boolean;
  canRedo: boolean;
  undo: (cb: HistoryFileCallbacks) => Promise<HistoryResult>;
  redo: (cb: HistoryFileCallbacks) => Promise<HistoryResult>;
  predict?: (direction: "undo" | "redo") => { id: string; files: RestoreFiles } | null;
  claims?: () => number;
  state: {
    undo: ReadonlyArray<{ createdAt: number }>;
    redo: ReadonlyArray<{ createdAt: number }>;
  };
}

export interface UseEditHistoryActionsOptions {
  editHistory: Pick<EditHistoryHandle, "undo" | "redo" | "predict" | "claims" | "canUndo" | "canRedo">;
  readOptionalProjectFile: (path: string) => Promise<string>;
  readProjectFile: (path: string) => Promise<string>;
  writeProjectFile: (path: string, content: string) => Promise<void>;
  showToast: (message: string, tone?: "error" | "info") => void;
  syncHistoryPreviewAfterApply: (restore: Pick<HistoryResult, "paths" | "files">) => Promise<void>;
  showHistoryRestoreNow?: (files: RestoreFiles) => (() => void) | null;
  waitForPendingDomEditSaves: () => Promise<void>;
  onAfterUndoRedo?: (restore: Pick<HistoryResult, "paths" | "files">) => void;
  /** Active composition path — decides whether undo/redo must resync the SDK session. */
  activeCompPath?: string | null;
  /** Reloads the SDK session after a revert of the active comp, past the self-write suppress window. */
  forceReloadSdkSession?: () => void;
  projectId?: string | null;
}

/** Takes one step of the project's history: the single owner of undo/redo over project files. */
export function useEditHistoryActions({
  editHistory,
  readOptionalProjectFile,
  readProjectFile,
  writeProjectFile,
  showToast,
  syncHistoryPreviewAfterApply,
  showHistoryRestoreNow,
  waitForPendingDomEditSaves,
  onAfterUndoRedo,
  activeCompPath,
  forceReloadSdkSession,
  projectId,
}: UseEditHistoryActionsOptions) {
  const historyRef = useRef(editHistory);
  historyRef.current = editHistory;
  const readHistoryFile = useCallback(
    (path: string): Promise<string> =>
      path === STUDIO_MOTION_PATH ? readOptionalProjectFile(path) : readProjectFile(path),
    [readOptionalProjectFile, readProjectFile],
  );
  const serializeHistoryFiles = useCallback(
    <T>(paths: readonly string[], task: () => Promise<T>) =>
      serializeStudioFileMutations(writeProjectFile, paths, task),
    [writeProjectFile],
  );

  const apply = useCallback(
    async (direction: "undo" | "redo") => {
      const noun = direction === "undo" ? "Undo" : "Redo";
      const method = takeHistoryTrigger();
      // One result per step the person asked for; the step itself never waits on this.
      const report = (outcome: "success" | "unavailable" | "failure") =>
        reportHistoryStep(direction, outcome, projectId, method);
      if (direction === "undo" && cancelNewestStudioWaitingPress()) return report("success");
      const available = direction === "undo" ? historyRef.current.canUndo : historyRef.current.canRedo;
      if (!available && !(direction === "undo" && hasStudioPendingEdits())) return report("unavailable");
      // An edit still saving is newer than any step this tab predicts, so it paints back first.
      const pendingEditShown = direction === "undo" ? paintBackNewestStudioPendingEdit() : null;
      const predicted = pendingEditShown ? null : (editHistory.predict?.(direction) ?? null);
      const predictedShown = predicted ? (showHistoryRestoreNow?.(predicted.files) ?? null) : null;
      const shownLanded = predictedShown ? beginStudioShownRestore() : null;
      const putBack = predictedShown ?? pendingEditShown?.showAgain;
      const claimedAfter =
        pendingEditShown?.claimsAtBegin ??
        (direction === "undo" && hasStudioPendingEdits() ? editHistory.claims?.() : undefined);
      let result: HistoryResult = { ok: false, reason: "failed" };
      let serverSteppedShown = false;
      let revertIsTheUndo = false;
      try {
        await waitForPendingDomEditSaves();
        revertIsTheUndo = Boolean(pendingEditShown && !(await pendingEditShown.landed()));
        if (revertIsTheUndo) return report("success");
        result = await editHistory[direction]({
          readFile: readHistoryFile,
          serialize: serializeHistoryFiles,
          claimedAfter,
        });
        const stepped = Boolean(result.ok && result.label);
        const editClaimed =
          pendingEditShown !== null &&
          (editHistory.claims?.() ?? 0) > pendingEditShown.claimsAtBegin;
        serverSteppedShown = predictedShown
          ? stepped && result.undoes === predicted?.id
          : stepped && editClaimed;
      } catch (error) {
        report("failure");
        throw error;
      } finally {
        if (putBack && !serverSteppedShown && !revertIsTheUndo) putBack();
        shownLanded?.();
      }
      report(result.ok && result.label ? "success" : result.reason === "failed" ? "failure" : "unavailable");
      if (!result.ok && result.reason === "content-mismatch") {
        showToast(
          `Can't ${direction}: ${result.paths?.join(", ")} changed since that edit.`,
          "info",
        );
        return;
      }
      if (!result.ok && result.reason === "failed") {
        console.warn(`${noun} failed`, result.message);
        showToast(`${noun} failed: ${result.message ?? "Unknown save failure"}`, "error");
        return;
      }
      if (result.ok && result.label) {
        const files =
          serverSteppedShown && predictedShown
            ? fromShown(result.files, predicted!.files)
            : result.files;
        const restore = { paths: result.paths, files };
        onAfterUndoRedo?.(restore);
        if (activeCompPath && result.paths?.includes(activeCompPath)) {
          forceReloadSdkSession?.();
        }
        await syncHistoryPreviewAfterApply(restore);
        showToast(result.label, "info");
      }
    },
    [
      editHistory,
      readHistoryFile,
      showToast,
      syncHistoryPreviewAfterApply,
      showHistoryRestoreNow,
      waitForPendingDomEditSaves,
      serializeHistoryFiles,
      onAfterUndoRedo,
      activeCompPath,
      forceReloadSdkSession,
      projectId,
    ],
  );

  const undo = useCallback(() => whileScriptWrites(() => apply("undo")), [apply]);
  const redo = useCallback(() => whileScriptWrites(() => apply("redo")), [apply]);
  return useMemo(() => ({ undo, redo }), [undo, redo]);
}

function fromShown(files: RestoreFiles | undefined, shown: RestoreFiles) {
  if (!files) return files;
  return Object.fromEntries(
    Object.entries(files).map(([path, f]) => [
      path,
      { previous: shown[path]?.restored ?? f.previous, restored: f.restored },
    ]),
  );
}
