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
const PDF_EXTS = new Set(["pdf"]);
const LIMITED_PDF_TEXT_WARNING =
  "> Note: This PDF appears to be scanned or image-heavy. Text extraction is limited.";

function ext(name: string): string {
  const i = name.lastIndexOf(".");
  return i > -1 ? name.slice(i + 1).toLowerCase() : "";
}

function normalizePdfPageText(text: string): string {
  return text
    .replace(/\r\n?/g, "\n")
    .split("\n")
    .map((line) => line.trimEnd())
    .join("\n")
    .trim();
}

function hasLimitedPdfText(pages: string[]): boolean {
  if (pages.length === 0) return true;
  const emptyPages = pages.filter((page) => page.replace(/\s/g, "").length === 0).length;
  return emptyPages === pages.length || emptyPages / pages.length > 0.5;
}

export function formatPdfText(
  filename: string,
  totalPages: number,
  pages: string[],
): string {
  const pageCount = Math.max(totalPages, pages.length);
  const normalizedPages = Array.from({ length: pageCount }, (_, i) =>
    normalizePdfPageText(pages[i] ?? ""),
  );
  const isLimitedExtraction = hasLimitedPdfText(normalizedPages);

  const out = [
    `# PDF: ${filename}`,
    "",
    "Source: PDF",
    `Pages: ${pageCount}`,
    `Extraction: ${isLimitedExtraction ? "limited embedded text" : "embedded text"}`,
  ];

  if (isLimitedExtraction) {
    out.push("", LIMITED_PDF_TEXT_WARNING);
  }

  for (const [i, pageText] of normalizedPages.entries()) {
    out.push("", `## Page ${i + 1}`, pageText || "_No extractable text on this page._");
  }

  return out.join("\n");
}

export async function parseFile(file: File): Promise<FileParseResult> {
  const e = ext(file.name);

  if (PDF_EXTS.has(e) || file.type === "application/pdf") {
    const buf = await file.arrayBuffer();
    const { extractText, getDocumentProxy } = await import("unpdf");
    const pdf = await getDocumentProxy(new Uint8Array(buf));
    try {
      const { totalPages, text } = await extractText(pdf, { mergePages: false });
      return {
        filename: file.name,
        format: "pdf",
        text: formatPdfText(file.name, totalPages, text),
      };
    } finally {
      await pdf.destroy?.();
    }
  }

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
