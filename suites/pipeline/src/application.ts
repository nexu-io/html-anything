import { lstat, mkdir, readFile, realpath, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { inspectNpm, type NpmArtifact, npm } from "@odsuite/pack/npm";
import { canonical } from "@odsuite/protocol";
import { inside, json, located, read } from "./files.js";
import type { BuildReceipt, Configuration, PackReceipt } from "./types.js";
export interface Application {
  directory: string;
  name: string;
  bin: string;
  entry: string;
  files: string[];
  license: string;
}
interface Recipe extends Omit<Application, "directory"> {
  product: Configuration["product"];
  namespace: string;
}
export async function stageApplication(config: Configuration, target: string): Promise<void> {
  const source = await located(config.root, config.application.directory);
  await mkdir(target, { recursive: true });
  for (const name of config.application.files) {
    const file = await realpath(join(source, name));
    if (!inside(source, file) || !(await lstat(file)).isFile()) throw Error("application source escaped its closure");
    await mkdir(dirname(join(target, name)), { recursive: true });
    await writeFile(join(target, name), await readFile(file), { flag: "wx" });
  }
  const { directory: _, ...application } = config.application;
  await json(join(target, "recipe.json"), { ...application, product: config.product, namespace: config.namespace });
}
async function composition(root: string, built: BuildReceipt, staged: string, packaged: PackReceipt) {
  const application = await located(root, built.application),
    recipe = await read<Recipe>(join(application, "recipe.json"));
  const files: Record<string, string | Uint8Array> = {};
  for (const name of recipe.files) files[`dist/${name}`] = join(application, name);
  const carriers: Record<string, unknown> = {};
  for (const [name, value] of Object.entries(packaged.packages)) {
    const filename = `${name}.bundle`;
    files[`payload/${filename}`] = join(staged, filename);
    carriers[name] = { file: filename, sha256: value.sha256, bytes: value.bytes };
  }
  files["payload/manifest.json"] = Buffer.from(
    JSON.stringify({
      schemaVersion: 1,
      product: recipe.product,
      release: built.manifest,
      namespace: recipe.namespace,
      carriers,
    }),
  );
  return { recipe, files };
}
export async function packageApplication(
  root: string,
  built: BuildReceipt,
  staged: string,
  packaged: PackReceipt,
): Promise<NpmArtifact> {
  const { recipe, files } = await composition(root, built, staged, packaged);
  return npm({
    name: recipe.name,
    version: built.version,
    bin: { [recipe.bin]: `dist/${recipe.entry}` },
    license: recipe.license,
    files,
    output: join(staged, "application.tgz"),
  });
}
export async function verifyApplication(root: string, built: BuildReceipt, packaged: PackReceipt, bytes: Uint8Array) {
  const archive = inspectNpm(bytes),
    { recipe, files } = await composition(root, built, dirname(await located(root, packaged.npm.path)), packaged);
  const expected = {
    name: recipe.name,
    version: built.version,
    private: true,
    type: "module",
    license: recipe.license,
    engines: { node: ">=24" },
    bin: { [recipe.bin]: `dist/${recipe.entry}` },
    files: Object.keys(files).sort(),
  };
  if (canonical(archive.metadata) !== canonical(expected)) throw Error("npm application identity mismatch");
  if ([...archive.files.keys()].sort().join("\0") !== [...Object.keys(files), "package.json"].sort().join("\0"))
    throw Error("npm application inventory mismatch");
  for (const [name, source] of Object.entries(files)) {
    const expected = typeof source === "string" ? await readFile(source) : Buffer.from(source);
    if (!expected.equals(Buffer.from(archive.files.get(name)!))) throw Error("npm application payload mismatch");
  }
}
