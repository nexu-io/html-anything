"use client";

import * as XLSX from "xlsx";

export type FileParseResult = {
  filename: string;
  format: string;
  text: string;
  /** if image, we keep the data URL */
  dataUrl?: string;
};

const TEXT_EXTS = new Set([
  "txt", "md", "markdown", "csv", "tsv", "json", "yaml", "yml",
  "sql", "js", "ts", "tsx", "jsx", "py", "rb", "go", "rs", "java",
  "html", "htm", "xml", "log", "ini", "toml",
]);
const IMAGE_EXTS = new Set(["png", "jpg", "jpeg", "gif", "webp", "svg", "bmp"]);
const SHEET_EXTS = new Set(["xlsx", "xls", "ods", "xlsm"]);

function ext(name: string): string {
  const i = name.lastIndexOf(".");
  return i > -1 ? name.slice(i + 1).toLowerCase() : "";
}

export async function parseFile(file: File): Promise<FileParseResult> {
  const e = ext(file.name);

  if (SHEET_EXTS.has(e)) {
    const buf = await file.arrayBuffer();
    const wb = XLSX.read(buf, { type: "array" });
    const out: string[] = [];
    for (const sheetName of wb.SheetNames) {
      const sheet = wb.Sheets[sheetName];
      const csv = XLSX.utils.sheet_to_csv(sheet);
      out.push(`# Sheet: ${sheetName}\n${csv}`);
    }
    return {
      filename: file.name,
      format: "csv",
      text: out.join("\n\n"),
    };
  }

  if (IMAGE_EXTS.has(e)) {
    const dataUrl = await new Promise<string>((resolve, reject) => {
      const r = new FileReader();
      r.onload = () => resolve(r.result as string);
      r.onerror = reject;
      r.readAsDataURL(file);
    });
    // Caller (useUploadFile) is expected to register the dataUrl as an
    // asset and substitute an `asset:<id>` token into `text` before writing
    // it to the editor — keeping the textarea readable. We still return the
    // raw inline form here as a fallback for legacy callers.
    return {
      filename: file.name,
      format: "image",
      text: `![${file.name}](${dataUrl})`,
      dataUrl,
    };
  }

  if (TEXT_EXTS.has(e) || file.type.startsWith("text/")) {
    const text = await file.text();
    return { filename: file.name, format: e || "text", text };
  }

  // unknown — try as text
  const text = await file.text();
  return { filename: file.name, format: "text", text };
}
