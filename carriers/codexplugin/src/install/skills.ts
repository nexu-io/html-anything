import { lstat, mkdir, readdir, readFile, rename, rm, writeFile } from "node:fs/promises";
import { dirname, join, relative, sep } from "node:path";
import { canonical, digest } from "@odsuite/protocol";
import { guidanceSkills, localGuidance } from "@open-motion/daemon/mcp";

const marker = ".open-motion.json";
export interface Projection {
  name: string;
  files: Record<string, string>;
  hash: string;
}
interface Owner {
  owner: "open-motion";
  installation: string;
  projection: Projection;
}
async function optional<T>(path: string): Promise<T | undefined> {
  try {
    return JSON.parse(await readFile(path, "utf8")) as T;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return undefined;
    throw error;
  }
}
async function listing(root: string, expected: string[], prefix = ""): Promise<string[]> {
  const names: string[] = [];
  for (const item of await readdir(join(root, prefix), { withFileTypes: true })) {
    const path = join(prefix, item.name);
    if (item.isDirectory()) {
      if (!expected.some((file) => file.startsWith(`${path}${sep}`)))
        throw Error("Owned Skill directory has changed; refusing replacement");
      names.push(...(await listing(root, expected, path)));
    } else if (item.isFile()) names.push(path);
    else throw Error("Skill projection contains a link or special file");
    if (names.length > 64) throw Error("Skill projection exceeds its finite manifest");
  }
  return names.sort();
}
async function owner(path: string, installation: string, partial = false): Promise<Owner | undefined> {
  try {
    if (!(await lstat(path)).isDirectory()) throw Error("Skill target is not a regular directory");
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return undefined;
    throw error;
  }
  const value = await optional<Owner>(join(path, marker));
  if (value?.owner !== "open-motion" || value.installation !== installation || !value.projection?.files)
    throw Error("Skill target is not owned by this installation");
  const expected = Object.keys(value.projection.files).sort(),
    files = await listing(path, expected);
  if (
    files.some((file) => file !== marker && !expected.includes(file)) ||
    (!partial && files.length !== expected.length + 1)
  )
    throw Error("Owned Skill projection has changed; refusing replacement");
  for (const file of files.filter((file) => file !== marker)) {
    if (digest(await readFile(join(path, file))) !== value.projection.files[file])
      throw Error("Owned Skill content has changed; refusing replacement");
  }
  return value;
}

export async function projections(application: string) {
  const files = localGuidance();
  for (const file of files) {
    if (
      !(await lstat(join(application, file.path))).isFile() ||
      (await readFile(join(application, file.path), "utf8")) !== file.content
    )
      throw Error("Installed canonical guidance does not match this carrier");
  }
  return guidanceSkills.map((skill) => {
    const selected = files.filter((file) => file.path.startsWith(`skills/${skill.name}/`));
    const contents = Object.fromEntries(
      selected.map((file) => [relative(`skills/${skill.name}`, file.path), file.content]),
    );
    const manifest = Object.fromEntries(Object.entries(contents).map(([path, content]) => [path, digest(content)]));
    return {
      name: skill.name,
      contents,
      projection: { name: skill.name, files: manifest, hash: digest(canonical(manifest)) },
    };
  });
}

export async function checkSkills(root: string, installation: string) {
  for (const skill of guidanceSkills) await owner(join(root, skill.name), installation);
}

export async function projectSkills(root: string, application: string, installation: string, intent: string) {
  const selected = await projections(application);
  for (const { name, contents, projection } of selected) {
    const target = join(root, name),
      stage = join(root, `.${name}-${intent.slice(7, 23)}`),
      backup = `${stage}.previous`;
    const current = await owner(target, installation),
      previous = await owner(backup, installation);
    if (current?.projection.hash !== projection.hash) {
      const staged = await owner(stage, installation, true);
      if (staged && staged.projection.hash !== projection.hash) throw Error("Skill staging intent does not match");
      if (!staged) {
        await mkdir(stage, { recursive: true });
        await writeFile(join(stage, marker), canonical({ owner: "open-motion", installation, projection }), {
          flag: "wx",
          mode: 0o600,
          flush: true,
        });
      }
      for (const [file, content] of Object.entries(contents)) {
        const path = join(stage, file);
        if (relative(stage, path).startsWith(`..${sep}`)) throw Error("Skill path escapes its projection");
        await mkdir(dirname(path), { recursive: true });
        await writeFile(path, content, { mode: 0o600, flush: true });
      }
      await owner(stage, installation);
      if (current) {
        if (previous) throw Error("Skill replacement has conflicting previous state");
        await rename(target, backup);
      }
      await rename(stage, target);
    }
    await owner(target, installation);
    if (await owner(backup, installation)) await rm(backup, { recursive: true });
  }
  return selected.map(({ projection }) => projection);
}
