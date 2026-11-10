export { inspectNpm, type NpmContents } from "./tar.js";

import { execFile } from "node:child_process";
import { createHash } from "node:crypto";
import { chmod, lstat, mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { promisify } from "node:util";
import { parseReleaseVersion } from "@odsuite/release";

export interface NpmInput {
  name: string;
  license?: string;
  version: string;
  bin: Record<string, string>;
  files: Record<string, string | Uint8Array>;
  output: string;
}
export interface NpmArtifact {
  path: string;
  sha256: string;
  bytes: number;
  integrity: string;
}
const execute = promisify(execFile);
function filename(value: string): string {
  if (
    Buffer.byteLength(`package/${value}`) > 100 ||
    !/^[A-Za-z0-9.][A-Za-z0-9./-]*$/.test(value) ||
    value.split("/").some((p) => !p || p === "." || p === "..")
  )
    throw Error("invalid npm payload path");
  if (["package.json", ".npmrc", ".npmignore"].includes(value)) throw Error("reserved npm payload path");
  return value;
}
export async function npm(input: NpmInput): Promise<NpmArtifact> {
  parseReleaseVersion(input.version);
  if (!/^(?:@[a-z0-9][a-z0-9-]*\/)?[a-z0-9][a-z0-9-]*$/.test(input.name)) throw Error("invalid npm name");
  const files = Object.keys(input.files).sort();
  if (!files.length || files.length > 4096) throw Error("invalid npm payload count");
  for (const name of files) {
    filename(name);
    if (files.some((other) => other.startsWith(`${name}/`))) throw Error("npm payload path collision");
  }
  const bins = Object.entries(input.bin);
  if (!bins.length || bins.some(([name, path]) => !/^[a-z][a-z0-9-]*$/.test(name) || !files.includes(path)))
    throw Error("npm bin must reference a declared payload file");
  const output = resolve(input.output);
  await mkdir(dirname(output), { recursive: true });
  const temporary = await mkdtemp(join(tmpdir(), "odsuite-npm-"));
  try {
    const source = join(temporary, "package"),
      destination = join(temporary, "out");
    await mkdir(source);
    await mkdir(destination);
    for (const [name, value] of Object.entries(input.files)) {
      const target = join(source, filename(name));
      await mkdir(dirname(target), { recursive: true });
      if (typeof value === "string") {
        if (!(await lstat(value)).isFile()) throw Error("npm sources must be regular files");
        await writeFile(target, await readFile(value), { flag: "wx", mode: 0o644 });
      } else await writeFile(target, value, { flag: "wx", mode: 0o644 });
    }
    for (const [, path] of bins) {
      if (!(await readFile(join(source, path), "utf8")).startsWith("#!/usr/bin/env node\n"))
        throw Error("npm Node bin requires an explicit Node shebang");
      await chmod(join(source, path), 0o755);
    }
    await writeFile(
      join(source, "package.json"),
      JSON.stringify({
        name: input.name,
        version: input.version,
        private: true,
        type: "module",
        license: input.license ?? "UNLICENSED",
        engines: { node: ">=24" },
        bin: input.bin,
        files,
      }),
    );
    const cli = join(
      dirname(process.execPath),
      process.platform === "win32" ? "node_modules/npm/bin/npm-cli.js" : "../lib/node_modules/npm/bin/npm-cli.js",
    );
    const packed = JSON.parse(
      (
        await execute(
          process.execPath,
          [cli, "pack", "--ignore-scripts", "--json", "--pack-destination", destination],
          {
            cwd: source,
            timeout: 120000,
            maxBuffer: 1024 ** 2,
            env: { ...process.env, npm_config_cache: join(temporary, "cache"), npm_config_update_notifier: "false" },
          },
        )
      ).stdout,
    ) as { filename: string; integrity: string; files: { path: string }[] }[];
    if (
      packed.length !== 1 ||
      !packed[0]?.filename ||
      packed[0].filename.includes("/") ||
      packed[0].filename.includes("\\")
    )
      throw Error("invalid npm pack receipt");
    if (
      packed[0].files
        .map((file) => file.path)
        .sort()
        .join("\0") !== [...files, "package.json"].sort().join("\0")
    )
      throw Error("npm packed file inventory differs from the declared payload");
    const bytes = await readFile(join(destination, packed[0].filename));
    const sha256 = createHash("sha256").update(bytes).digest("hex");
    const integrity = `sha512-${createHash("sha512").update(bytes).digest("base64")}`;
    if (packed[0].integrity !== integrity) throw Error("npm packed integrity mismatch");
    // Exclusive publication into the caller's output: no overwriting accepted bytes.
    await writeFile(output, bytes, { flag: "wx", mode: 0o600 });
    return { path: output, sha256, bytes: bytes.length, integrity };
  } finally {
    await rm(temporary, { recursive: true, force: true });
  }
}
