import { createHash } from "node:crypto";
import { lstat, mkdir, readdir, readFile, rm, writeFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";

interface Face {
  family: string;
  file: string;
  license: string;
  sha256: string;
  licenseSha256: string;
  weight: [number, number];
}
const digest = (data: Uint8Array) => createHash("sha256").update(data).digest("hex");
/** Closed, licensed TrueType resources. No CSS, arbitrary paths or network references in the manifest. */
export async function fontCatalog(manifest: string) {
  const directory = dirname(manifest);
  if (!(await lstat(directory)).isDirectory() || (await lstat(directory)).isSymbolicLink())
    throw new Error("font directory must be regular");
  const regular = async (name: string) => {
    const path = join(directory, name),
      stat = await lstat(path);
    if (!stat.isFile() || stat.isSymbolicLink() || stat.size > 2097152)
      throw new Error("font resource must be bounded and regular");
    return readFile(path);
  };
  if (manifest !== join(directory, "manifest.json")) throw new Error("font catalog must be manifest.json");
  const input = JSON.parse((await regular("manifest.json")).toString("utf8"));
  if (
    !input ||
    Object.keys(input).sort().join() !== "faces,schema" ||
    input.schema !== 1 ||
    !Array.isArray(input.faces) ||
    !input.faces.length ||
    input.faces.length > 4
  )
    throw new Error("invalid font catalog");
  const files = new Map<string, Uint8Array>(),
    families = new Set<string>();
  for (const value of input.faces) {
    if (!value || Object.keys(value).sort().join() !== "family,file,license,licenseSha256,sha256,weight")
      throw new Error("invalid font face fields");
    const face = value as Face;
    if (
      typeof face.family !== "string" ||
      typeof face.file !== "string" ||
      typeof face.license !== "string" ||
      !/^[A-Za-z][A-Za-z0-9 ]{0,39}$/.test(face.family) ||
      !/^[a-z]+\.ttf$/.test(face.file) ||
      !/^[a-z]+\.txt$/.test(face.license) ||
      !/^[a-f0-9]{64}$/.test(face.sha256) ||
      !/^[a-f0-9]{64}$/.test(face.licenseSha256) ||
      !Array.isArray(face.weight) ||
      face.weight.length !== 2 ||
      face.weight.some((w) => !Number.isInteger(w) || w < 100 || w > 900) ||
      face.weight[0] > face.weight[1] ||
      families.has(face.family) ||
      files.has(face.file) ||
      files.has(face.license)
    )
      throw new Error("invalid or duplicate font face");
    const bytes = await regular(face.file),
      license = await regular(face.license);
    if (
      bytes.readUInt32BE(0) !== 65536 ||
      digest(bytes) !== face.sha256 ||
      digest(license) !== face.licenseSha256 ||
      !license.toString("utf8").includes("SIL OPEN FONT LICENSE Version 1.1")
    )
      throw new Error("font integrity or license mismatch");
    files.set(face.file, bytes);
    files.set(face.license, license);
    families.add(face.family);
  }
  const names = ["manifest.json", ...files.keys()].sort();
  if ((await readdir(directory)).sort().join() !== names.join()) throw new Error("unregistered font resource");
  files.set("manifest.json", Buffer.from(`${JSON.stringify(input, null, 2)}\n`));
  const css = (input.faces as Face[])
    .map(
      (face) =>
        `@font-face { font-family: '${face.family}'; src: url('./fonts/${face.file}') format('truetype'); font-weight: ${face.weight.join(" ")}; font-style: normal; font-display: swap; }`,
    )
    .join("\n");
  return { css, files };
}
export async function fontAssets(options: { manifest: string; output: string }) {
  const catalog = await fontCatalog(options.manifest);
  const target = resolve(options.output, "fonts");
  if (target === dirname(resolve(options.manifest))) throw new Error("font output must differ from source");
  const existing = await lstat(target).catch((error) => {
    if (error.code !== "ENOENT") throw error;
  });
  if (existing?.isSymbolicLink()) throw new Error("font output cannot be a symlink");
  await rm(target, { recursive: true, force: true });
  await mkdir(target, { recursive: true });
  for (const [name, data] of catalog.files) await writeFile(join(options.output, "fonts", name), data);
  return catalog.css;
}
