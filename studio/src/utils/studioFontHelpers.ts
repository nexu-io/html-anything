import { importedFontFaceCss, type ImportedFontAsset } from "../components/editor/fontAssets";
import { toRelativeProjectAssetPath } from "./studioHelpers";

export function primaryFontFamilyValue(value: string): string {
  return (
    value
      .split(",")[0]
      ?.trim()
      .replace(/^["']|["']$/g, "")
      .trim() ?? ""
  );
}

export function injectPreviewImportedFont(doc: Document, asset: ImportedFontAsset): void {
  const id = `studio-imported-font-${asset.path.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;
  if (doc.getElementById(id)) return;
  const style = doc.createElement("style");
  style.id = id;
  style.textContent = importedFontFaceCss(asset);
  doc.head.appendChild(style);
}

export function importedFontFaceCssFor(asset: ImportedFontAsset, sourceFile: string): string {
  return importedFontFaceCss(asset, toRelativeProjectAssetPath(sourceFile, asset.path));
}
