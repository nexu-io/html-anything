export const MAX_ASSET_BYTES = 500_000_000;

export function isAssetFileWithinLimit(file: { isFile(): boolean; size: number }) {
  return file.isFile() && file.size <= MAX_ASSET_BYTES;
}
