"use client";

import { useCallback } from "react";
import { parseFile } from "@/lib/parsers/file";
import { useStore } from "@/lib/store";
import { useT } from "@/lib/i18n";

/**
 * Shared upload pipeline used by the editor's textarea drop target and
 * paperclip button. Parses one or more files via `parseFile`, registers
 * image bytes as task assets (so the textarea keeps a short
 * `![filename](asset:<id>)` placeholder), and **appends** the resulting
 * body text to the active task's content. Empty content gets the upload
 * verbatim; non-empty content gets a blank-line separator before the
 * appended payload.
 *
 * Returns `{ ingest }` — call with a `FileList` or array of `File`. Errors
 * surface in the task log via `pushLog`.
 */
export function useUploadFile() {
  const addAsset = useStore((s) => s.addAsset);
  const pushLog = useStore((s) => s.pushLog);
  const t = useT();

  const ingest = useCallback(
    async (files: FileList | File[] | null) => {
      if (!files || files.length === 0) return;
      const list = Array.from(files);
      for (const file of list) {
        try {
          const parsed = await parseFile(file);
          let bodyText = parsed.text;
          if (parsed.format === "image" && parsed.dataUrl) {
            const id = addAsset(parsed.dataUrl);
            bodyText = `![${parsed.filename}](asset:${id})`;
          }
          // Read latest content fresh inside the loop so successive uploads
          // append to one another rather than racing on a stale closure.
          const store = useStore.getState();
          const prev = store.tasks.find((x) => x.id === store.activeTaskId)?.content ?? "";
          const sep = prev.length === 0 ? "" : prev.endsWith("\n\n") ? "" : prev.endsWith("\n") ? "\n" : "\n\n";
          store.setContent(prev + sep + bodyText);
          // Format flag: sticky to the *first* upload's format so converters
          // that branch on csv / json / etc. still pick something reasonable.
          // For mixed appends we leave whatever was set previously.
          if (!prev) store.setFormat(parsed.format);
          pushLog({
            kind: "info",
            text: t("upload.loadedLog", { name: parsed.filename ?? "", fmt: parsed.format }),
          });
        } catch (e) {
          pushLog({
            kind: "error",
            text: t("upload.failedLog", { err: e instanceof Error ? e.message : String(e) }),
          });
        }
      }
    },
    [addAsset, pushLog, t],
  );

  return { ingest };
}
