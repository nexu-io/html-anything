"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { parseFile } from "@/lib/parsers/file";
import { uploadProjectAsset } from "@/lib/projects/client";
import { useStore } from "@/lib/store";
import { useT } from "@/lib/i18n";

const PROJECT_IMAGE_EXTENSIONS = new Set([
  "png",
  "jpg",
  "jpeg",
  "gif",
  "webp",
  "svg",
  "bmp",
]);

/**
 * Shared upload pipeline used by the editor's textarea drop target and
 * paperclip button. Local files and all text files retain the `parseFile`
 * path. Project image candidates upload to project storage and append the
 * returned portable relative path. Empty content gets the upload verbatim;
 * non-empty content gets a blank-line separator before the appended payload.
 *
 * Call `ingest` with a `FileList` or array of `File`. The returned state is
 * shared by the editor drop target and paperclip control.
 */
export function useUploadFile(options?: { projectId?: string }): {
  ingest(files: FileList | File[] | null): Promise<void>;
  uploading: boolean;
  error: string | null;
} {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const t = useT();
  const projectId = options?.projectId;
  const lifecycleRef = useRef<UploadLifecycle>({
    mounted: false,
    generation: 0,
    projectId,
  });
  const queueRef = useRef<Promise<void>>(Promise.resolve());
  const pendingRef = useRef(new Map<number, number>());

  if (lifecycleRef.current.projectId !== projectId) {
    lifecycleRef.current.projectId = projectId;
    lifecycleRef.current.generation += 1;
  }

  useEffect(() => {
    lifecycleRef.current.mounted = true;
    setUploading(false);
    setError(null);
    return () => {
      lifecycleRef.current.mounted = false;
      lifecycleRef.current.generation += 1;
    };
  }, [projectId]);

  const ingest = useCallback(
    (files: FileList | File[] | null): Promise<void> => {
      if (!files || files.length === 0) return Promise.resolve();
      const list = Array.from(files);
      const state = useStore.getState();
      const task = state.tasks.find(
        (candidate) => candidate.id === state.activeTaskId,
      );
      const lifecycle = lifecycleRef.current;
      if (
        !lifecycle.mounted ||
        lifecycle.projectId !== projectId ||
        task === undefined ||
        task.serverProjectId !== projectId
      ) {
        return Promise.resolve();
      }
      const origin: UploadOrigin = {
        generation: lifecycle.generation,
        taskId: task.id,
        taskCreatedAt: task.createdAt,
        projectId,
        taskProjectId: task.serverProjectId,
      };
      const pending = (pendingRef.current.get(origin.generation) ?? 0) + 1;
      pendingRef.current.set(origin.generation, pending);
      setUploading(true);
      setError(null);

      const run = async () => {
        if (!isOriginCurrent(origin, lifecycleRef)) {
          return;
        }
        for (const file of list) {
          if (!isOriginCurrent(origin, lifecycleRef)) {
            return;
          }
          const projectImage =
            projectId !== undefined && isImageCandidate(file);
          try {
            let bodyText: string;
            let filename: string;
            let format: string;
            if (projectImage && projectId !== undefined) {
              const uploaded = await uploadProjectAsset(projectId, file);
              if (!isOriginCurrent(origin, lifecycleRef)) {
                return;
              }
              bodyText = `![${escapeMarkdownAlt(uploaded.originalName)}](${uploaded.path})`;
              filename = uploaded.originalName;
              format = "image";
            } else {
              const parsed = await parseFile(file);
              if (!isOriginCurrent(origin, lifecycleRef)) {
                return;
              }
              bodyText = parsed.text;
              filename = parsed.filename ?? "";
              format = parsed.format;
              if (parsed.format === "image" && parsed.dataUrl) {
                const id = useStore.getState().addAsset(parsed.dataUrl);
                bodyText = `![${parsed.filename}](asset:${id})`;
                if (!isOriginCurrent(origin, lifecycleRef)) {
                  return;
                }
              }
            }
            appendUploadResult(origin, bodyText, format, projectImage, {
              kind: "info",
              text: t("upload.loadedLog", { name: filename, fmt: format }),
            });
          } catch (caught) {
            if (!isOriginCurrent(origin, lifecycleRef)) {
              return;
            }
            if (projectImage) {
              const message = t("upload.projectFailed");
              setError(message);
              useStore
                .getState()
                .pushLogFor(origin.taskId, { kind: "error", text: message });
            } else {
              useStore.getState().pushLogFor(origin.taskId, {
                kind: "error",
                text: t("upload.failedLog", {
                  err:
                    caught instanceof Error ? caught.message : String(caught),
                }),
              });
            }
          }
        }
      };

      const work = queueRef.current.then(run, run);
      queueRef.current = work.then(
        () => undefined,
        () => undefined,
      );
      return work.finally(() => {
        const remaining = (pendingRef.current.get(origin.generation) ?? 1) - 1;
        if (remaining === 0) {
          pendingRef.current.delete(origin.generation);
        } else {
          pendingRef.current.set(origin.generation, remaining);
        }
        if (
          remaining === 0 &&
          lifecycleRef.current.mounted &&
          lifecycleRef.current.generation === origin.generation &&
          lifecycleRef.current.projectId === origin.projectId
        ) {
          setUploading(false);
        }
      });
    },
    [projectId, t],
  );

  return { ingest, uploading, error };
}

type UploadOrigin = {
  generation: number;
  taskId: string;
  taskCreatedAt: number;
  projectId?: string;
  taskProjectId?: string;
};

type UploadLifecycle = {
  mounted: boolean;
  generation: number;
  projectId?: string;
};

type RefValue<T> = { current: T };

function isOriginCurrent(
  origin: UploadOrigin,
  lifecycleRef: RefValue<UploadLifecycle>,
): boolean {
  const lifecycle = lifecycleRef.current;
  if (
    !lifecycle.mounted ||
    lifecycle.generation !== origin.generation ||
    lifecycle.projectId !== origin.projectId
  ) {
    return false;
  }
  const state = useStore.getState();
  if (state.activeTaskId !== origin.taskId) return false;
  const task = state.tasks.find((candidate) => candidate.id === origin.taskId);
  return (
    task?.createdAt === origin.taskCreatedAt &&
    task.serverProjectId === origin.taskProjectId
  );
}

function appendUploadResult(
  origin: UploadOrigin,
  bodyText: string,
  format: string,
  projectImage: boolean,
  logEntry: { kind: "info"; text: string },
): void {
  useStore.setState((state) => {
    if (state.activeTaskId !== origin.taskId) return state;
    const index = state.tasks.findIndex(
      (candidate) =>
        candidate.id === origin.taskId &&
        candidate.createdAt === origin.taskCreatedAt &&
        candidate.serverProjectId === origin.taskProjectId,
    );
    if (index === -1) return state;
    const task = state.tasks[index];
    const separator =
      task.content.length === 0
        ? ""
        : task.content.endsWith("\n\n")
          ? ""
          : task.content.endsWith("\n")
            ? "\n"
            : "\n\n";
    const nextTask = {
      ...task,
      content: task.content + separator + bodyText,
      format:
        task.content.length === 0 &&
        !projectImage &&
        task.serverProjectId === undefined
          ? format
          : task.format,
      log: [...task.log.slice(-400), { ...logEntry, ts: Date.now() }],
      updatedAt: Date.now(),
    };
    const tasks = [...state.tasks];
    tasks[index] = nextTask;
    return { tasks };
  });
}

function isImageCandidate(file: File): boolean {
  const dot = file.name.lastIndexOf(".");
  const extension = dot === -1 ? "" : file.name.slice(dot + 1).toLowerCase();
  return (
    file.type.toLowerCase().startsWith("image/") ||
    PROJECT_IMAGE_EXTENSIONS.has(extension)
  );
}

function escapeMarkdownAlt(value: string): string {
  return value
    .replace(/\\/gu, "\\\\")
    .replace(/\[/gu, "\\[")
    .replace(/\]/gu, "\\]");
}
