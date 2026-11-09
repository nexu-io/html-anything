import { mkdir, mkdtemp, realpath, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { basename, dirname, join, resolve, sep } from "node:path";
import type { Output } from "./index.js";

export const lifecycleHelp = `odsuite release --capsule <dir> --daemon <dir> --web <dir> [--blob <slot=path>] --output <dir> [--root <repo>]
odsuite pack --carrier <dir> --seed <dir> --output <dir> [--receipt <file>] [--root <repo>]

release: prepare a local verified content generation using odsuite.yaml/runtime.
pack: build an unsigned macOS host with the selected seed. No build or update is implicit.`;

async function canonical(path: string): Promise<string> {
  try {
    return await realpath(path);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
    return join(await canonical(dirname(path)), basename(path));
  }
}
async function separate(destination: string, root: string, inputs: string[]): Promise<void> {
  const target = await canonical(destination);
  const repository = await canonical(root);
  const contains = (parent: string, child: string) =>
    parent === child || child.startsWith(parent.endsWith(sep) ? parent : parent + sep);
  if (contains(target, repository)) throw new Error("output must not contain the repository");
  for (const input of inputs) {
    const source = await canonical(input);
    if (contains(target, source) || contains(source, target)) throw new Error("output must be separate from inputs");
  }
}

export async function lifecycle(args: string[], cwd: string, output: Output): Promise<number> {
  const command = args[0];
  if (args.length === 2 && ["--help", "-h"].includes(args[1] ?? "")) {
    output.stdout(`${lifecycleHelp}\n`);
    return 0;
  }
  const allowed =
    command === "release"
      ? ["root", "capsule", "daemon", "web", "blob", "output"]
      : ["root", "carrier", "seed", "output", "receipt"];
  const options = new Map<string, string>();
  const blobs: string[] = [];
  for (let i = 1; i < args.length; i += 2) {
    const key = args[i]?.slice(2);
    const value = args[i + 1];
    if (!args[i]?.startsWith("--") || !key || !allowed.includes(key) || !value || value.startsWith("--"))
      throw new Error("unknown or incomplete lifecycle option");
    if (key === "blob") {
      blobs.push(value);
      continue;
    }
    if (options.has(key)) throw new Error(`duplicate option: --${key}`);
    options.set(key, value);
  }
  const root = resolve(cwd, options.get("root") ?? ".");
  const path = (name: string): string => {
    const value = options.get(name);
    if (!value) throw new Error(`--${name} is required`);
    return resolve(root, value);
  };
  if (command === "release") {
    const capsule = path("capsule"),
      daemon = path("daemon"),
      web = path("web"),
      destination = path("output");
    await separate(destination, root, [capsule, daemon, web]);
    const [{ settings }, { compose }, { writeProduct }] = await Promise.all([
      import("@odsuite/runtime/settings"),
      import("@odsuite/release"),
      import("@odsuite/runtime"),
    ]);
    const config = await settings(join(root, "odsuite.yaml"));
    const product = await compose(config.manifest, {
      capsule,
      daemon,
      web,
      carrier: config.carrier,
      blobs: blobs.map((value) => {
        const separator = value.indexOf("=");
        if (separator < 1 || separator === value.length - 1) throw new Error("--blob requires slot=path");
        return { slot: value.slice(0, separator), path: resolve(root, value.slice(separator + 1)) };
      }),
    });
    await writeProduct(destination, product);
    output.stdout(`${JSON.stringify({ output: destination, generation: product.envelope.digest })}\n`);
    return 0;
  }
  const carrier = path("carrier"),
    seed = path("seed"),
    destination = path("output");
  await separate(destination, root, [carrier, seed]);
  const [{ readProduct }, { materialize }, { pack }] = await Promise.all([
    import("@odsuite/runtime"),
    import("@odsuite/release"),
    import("@odsuite/pack"),
  ]);
  const product = await readProduct(seed);
  const temporary = await mkdtemp(join(tmpdir(), "odsuite-pack-"));
  try {
    for (const kind of ["daemon", "web"] as const) {
      const asset = product.assets.find((asset) => asset.artifact.kind === kind);
      if (!asset) throw new Error(`seed ${kind} missing`);
      await materialize(asset.bytes, join(temporary, kind));
    }
    const result = await pack({
      carrier,
      seed,
      manifest: product.manifest,
      daemon: join(temporary, "daemon"),
      web: join(temporary, "web"),
      output: destination,
    });
    if (options.has("receipt")) {
      const receipt = path("receipt");
      await mkdir(dirname(receipt), { recursive: true });
      await writeFile(receipt, `${JSON.stringify(result)}\n`);
    }
    output.stdout(`${JSON.stringify(result)}\n`);
    return 0;
  } finally {
    await rm(temporary, { recursive: true, force: true });
  }
}
