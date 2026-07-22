"use client";

import { useCallback, useState } from "react";
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
  const addAsset = useStore((s) => s.addAsset);
  const pushLog = useStore((s) => s.pushLog);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const t = useT();

  const ingest = useCallback(
    async (files: FileList | File[] | null) => {
      if (!files || files.length === 0) return;
      const list = Array.from(files);
      setUploading(true);
      setError(null);
      try {
        for (const file of list) {
          const projectId = options?.projectId;
          const projectImage =
            projectId !== undefined && isImageCandidate(file);
          try {
            let bodyText: string;
            let filename: string;
            let format: string;
            if (projectImage && projectId !== undefined) {
              const uploaded = await uploadProjectAsset(projectId, file);
              bodyText = `![${escapeMarkdownAlt(uploaded.originalName)}](${uploaded.path})`;
              filename = uploaded.originalName;
              format = "image";
            } else {
              const parsed = await parseFile(file);
              bodyText = parsed.text;
              filename = parsed.filename ?? "";
              format = parsed.format;
              if (parsed.format === "image" && parsed.dataUrl) {
                const id = addAsset(parsed.dataUrl);
                bodyText = `![${parsed.filename}](asset:${id})`;
              }
            }
            // Read latest content fresh inside the loop so successive uploads
            // append to one another rather than racing on a stale closure.
            const store = useStore.getState();
            const prev =
              store.tasks.find((x) => x.id === store.activeTaskId)?.content ?? "";
            const sep =
              prev.length === 0
                ? ""
                : prev.endsWith("\n\n")
                  ? ""
                  : prev.endsWith("\n")
                    ? "\n"
                    : "\n\n";
            store.setContent(prev + sep + bodyText);
            // Project images retain the document's existing portable format.
            // Local images and text keep the original sticky-first behavior.
            if (!prev && !projectImage) store.setFormat(format);
            pushLog({
              kind: "info",
              text: t("upload.loadedLog", { name: filename, fmt: format }),
            });
          } catch (caught) {
            if (projectImage) {
              const message = t("upload.projectFailed");
              setError(message);
              pushLog({ kind: "error", text: message });
            } else {
              pushLog({
                kind: "error",
                text: t("upload.failedLog", {
                  err:
                    caught instanceof Error ? caught.message : String(caught),
                }),
              });
            }
          }
        }
      } finally {
        setUploading(false);
      }
    },
    [addAsset, options?.projectId, pushLog, t],
  );

  return { ingest, uploading, error };
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
