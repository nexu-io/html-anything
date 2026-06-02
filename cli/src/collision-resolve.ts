import path from "node:path";

export function findCommonPath(dirs: string[]): string {
  if (dirs.length === 0) return "";
  const resolved = dirs.map((d) => path.resolve(d));
  const segments = resolved.map((d) => d.split(path.sep).filter(Boolean));
  const minLen = Math.min(...segments.map((s) => s.length));
  let common = 0;
  for (let i = 0; i < minLen; i++) {
    const seg = segments[0][i];
    if (segments.every((s) => s[i] === seg)) common++;
    else break;
  }
  return segments[0].slice(0, common).join(path.sep) || path.sep;
}

export function resolveCollisionOutput(inputPath: string, outputDir: string, commonRoot: string): string {
  const basename = path.basename(inputPath, path.extname(inputPath));
  const inputDir = path.resolve(path.dirname(inputPath));
  let relativeDir = path.relative(commonRoot, inputDir);
  relativeDir = relativeDir
    .split(path.sep)
    .filter((s) => s !== ".." && s !== ".")
    .join(path.sep);
  if (relativeDir) {
    return path.resolve(outputDir, relativeDir, `${basename}.html`);
  }
  return path.resolve(outputDir, `${basename}.html`);
}
