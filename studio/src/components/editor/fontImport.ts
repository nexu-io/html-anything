import { studioApiFetch } from "../../utils/studioApiFetch";
import type { ImportedFontAsset } from "./fontAssets";

export async function prepareFontImport(file: File) {
  const response = await studioApiFetch("/api/fonts/prepare", { method: "POST", body: file });
  if (!response.ok) throw new Error("Unsupported or invalid font file");
  const metadata = JSON.parse(decodeURIComponent(response.headers.get("X-Font-Metadata") ?? "")) as Pick<ImportedFontAsset, "family" | "weight" | "style">;
  if (!metadata.family || typeof metadata.family !== "string") throw new Error("Font has no family");
  const bytes = await response.arrayBuffer();
  await new FontFace("Motion font validation", bytes).load();
  const type = response.headers.get("Content-Type") ?? "font/ttf";
  const extension = type.split("/")[1];
  const name = file.name.replace(/\.[^.]+$/, "") + "." + extension;
  return { file: new File([bytes], name, { type }), metadata };
}
