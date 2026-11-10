import { lstat, mkdir, readFile, realpath, writeFile } from "node:fs/promises";
import { dirname, join, relative } from "node:path";
import { type NpmArtifact, npm } from "@odsuite/pack/npm";
import type { Manifest } from "@odsuite/release";
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
export async function packageApplication(
  root: string,
  built: BuildReceipt,
  staged: string,
  packaged: PackReceipt,
): Promise<NpmArtifact> {
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
  return npm({
    name: recipe.name,
    version: built.version,
    bin: { [recipe.bin]: `dist/${recipe.entry}` },
    license: recipe.license,
    files,
    output: join(staged, "application.tgz"),
  });
}
