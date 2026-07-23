export function hasRequiredMode(
  mode: number | bigint,
  requiredMode: number,
  platform = process.platform,
): boolean {
  if (platform === "win32") return true;
  return typeof mode === "bigint"
    ? Number(mode & BigInt(0o777)) === requiredMode
    : (mode & 0o777) === requiredMode;
}
