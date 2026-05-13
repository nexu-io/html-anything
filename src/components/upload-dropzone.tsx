"use client";

import { useCallback, useRef, useState } from "react";
import { parseFile } from "@/lib/parsers/file";
import { useStore } from "@/lib/store";
import { useT } from "@/lib/i18n";

export function UploadDropzone() {
  const [active, setActive] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const setContent = useStore((s) => s.setContent);
  const setFormat = useStore((s) => s.setFormat);
  const setFilename = useStore((s) => s.setFilename);
  const addAsset = useStore((s) => s.addAsset);
  const pushLog = useStore((s) => s.pushLog);
  const t = useT();

  const onFiles = useCallback(
    async (files: FileList | null) => {
      if (!files || files.length === 0) return;
      const file = files[0];
      try {
        const parsed = await parseFile(file);
        // For images, replace the inline base64 data URL in `text` with a
        // short `asset:<id>` placeholder so the textarea stays readable.
        // The real bytes live in task.assets and are inlined back at
        // Convert time.
        let bodyText = parsed.text;
        if (parsed.format === "image" && parsed.dataUrl) {
          const id = addAsset(parsed.dataUrl);
          bodyText = `![${parsed.filename}](asset:${id})`;
        }
        setContent(bodyText);
        setFormat(parsed.format);
        setFilename(parsed.filename);
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
    },
    [setContent, setFormat, setFilename, addAsset, pushLog, t],
  );

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        setActive(true);
      }}
      onDragLeave={() => setActive(false)}
      onDrop={(e) => {
        e.preventDefault();
        setActive(false);
        onFiles(e.dataTransfer?.files ?? null);
      }}
      className={`flex h-full flex-col items-center justify-center gap-3 rounded-2xl p-8 text-center text-sm transition-colors ${
        active ? "dropzone-active" : ""
      }`}
      style={{
        background: "var(--paper)",
        border: "2px dashed var(--line)",
        color: "var(--ink-mute)",
      }}
    >
      <div className="text-4xl">📂</div>
      <div className="font-semibold text-[var(--ink)] text-[15px]">{t("upload.title")}</div>
      <div className="text-xs text-[var(--ink-faint)]">{t("upload.types")}</div>
      <button onClick={() => inputRef.current?.click()} className="btn-ink mt-2">
        {t("upload.button")}
      </button>
      <input
        ref={inputRef}
        type="file"
        className="hidden"
        accept=".md,.txt,.csv,.tsv,.xlsx,.xls,.json,.sql,.yaml,.yml,.png,.jpg,.jpeg,.gif,.webp,.svg,.html,.htm,.xml,.log"
        onChange={(e) => onFiles(e.target.files)}
      />
    </div>
  );
}
