import { execFile } from "node:child_process";
import { createHash } from "node:crypto";
import { lstat, mkdir, readdir, readFile, readlink, realpath, rename, writeFile } from "node:fs/promises";
import { createRequire } from "node:module";
import { basename, dirname, isAbsolute, join, relative, resolve, sep } from "node:path";
import { promisify } from "node:util";

export const execute = promisify(execFile);
export function inside(root: string, path: string): boolean {
  const value = relative(root, path);
  return !isAbsolute(value) && value !== ".." && !value.startsWith(`..${sep}`);
}
export async function located(root: string, value: unknown): Promise<string> {
  if (typeof value !== "string" || !value || isAbsolute(value))
    throw new Error("pipeline paths must be repository-relative");
  const path = await realpath(resolve(root, value));
  if (!inside(root, path) || path === root) throw new Error("pipeline path escaped repository");
  return path;
}
export const hash = (bytes: string | Uint8Array) => createHash("sha256").update(bytes).digest("hex");
export async function inventory(root: string): Promise<string> {
  const base = await realpath(root),
    records: unknown[] = [];
  async function walk(path: string): Promise<void> {
    for (const entry of (await readdir(path)).sort()) {
      const file = join(path, entry),
        info = await lstat(file);
      const name = relative(base, file).split(sep).join("/");
      if (info.isSymbolicLink()) {
        if (!inside(base, await realpath(file))) throw new Error("artifact link escaped its root");
        records.push({ name, link: await readlink(file) });
      } else if (info.isDirectory()) {
        records.push({ name, directory: true, mode: info.mode & 0o777 });
        await walk(file);
      } else if (info.isFile()) records.push({ name, mode: info.mode & 0o777, digest: hash(await readFile(file)) });
      else throw new Error("unsupported artifact entry");
    }
  }
  await walk(base);
  return hash(JSON.stringify(records));
}
export async function json(path: string, value: unknown): Promise<void> {
  await mkdir(dirname(path), { recursive: true });
  const temporary = `${path}.${process.pid}.tmp`;
  await writeFile(temporary, `${JSON.stringify(value)}\n`, { mode: 0o600 });
  await rename(temporary, path);
}
export async function read<T>(path: string): Promise<T> {
  return JSON.parse(await readFile(path, "utf8")) as T;
}
export async function revision(root: string): Promise<string | null> {
  try {
    const top = (await execute("git", ["rev-parse", "--show-toplevel"], { cwd: root })).stdout.trim();
    if ((await realpath(top)) !== (await realpath(root))) return null;
    const value = (await execute("git", ["rev-parse", "HEAD"], { cwd: root })).stdout.trim();
    return /^[0-9a-f]{40}$/.test(value) ? value : null;
  } catch {
    return null;
  }
}
export async function pnpmCommand(env = process.env, platform: string = process.platform) {
  const cli = env.npm_execpath;
  if (cli && /^pnpm.*\.[cm]?js$/.test(basename(cli))) return { file: process.execPath, prefix: [cli] };
  if (platform !== "win32") return { file: "pnpm", prefix: [] as string[] };
  const path = Object.entries(env).find(([key]) => key.toLowerCase() === "path")?.[1] ?? "";
  for (const directory of path.split(";").filter(Boolean)) {
    const native = join(directory, "pnpm.exe");
    try {
      if ((await lstat(native)).isFile()) return { file: native, prefix: [] as string[] };
    } catch {}
    try {
      const require = createRequire(join(resolve(directory), "odsuite-resolve.cjs"));
      let manifest: string;
      try {
        manifest = require.resolve("pnpm/package.json");
      } catch {
        manifest = require.resolve("pnpm");
      }
      if (basename(manifest) !== "package.json") continue;
      const pkg = await read<{ bin?: string | { pnpm?: string } }>(manifest);
      const bin = typeof pkg.bin === "string" ? pkg.bin : pkg.bin?.pnpm;
      if (bin && /\.[cm]?js$/.test(bin)) {
        const script = resolve(dirname(manifest), bin);
        if ((await lstat(script)).isFile()) return { file: process.execPath, prefix: [script] };
      }
    } catch {}
  }
  throw new Error("cannot locate native pnpm or its JavaScript entry on Windows PATH");
}
export async function run(root: string, args: string[], env = process.env): Promise<void> {
  const command = await pnpmCommand(env);
  const result = await execute(command.file, [...command.prefix, ...args], {
    cwd: root,
    env,
    timeout: 900000,
    maxBuffer: 32 * 1024 * 1024,
  });
  process.stdout.write(result.stdout);
  process.stderr.write(result.stderr);
}

export async function owned(root: string, path: string): Promise<string> {
  root = await realpath(root);
  path = resolve(path);
  if (!inside(root, path) || path === root) throw new Error("generated output escaped repository");
  let current = root;
  for (const segment of relative(root, path).split(sep)) {
    current = join(current, segment);
    try {
      if ((await lstat(current)).isSymbolicLink()) throw new Error("generated output cannot use symbolic links");
    } catch (fault) {
      if ((fault as NodeJS.ErrnoException).code === "ENOENT") break;
      throw fault;
    }
  }
  return path;
}
