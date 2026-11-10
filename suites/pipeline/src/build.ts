import { cp, lstat, mkdir, mkdtemp, readFile, realpath, rename, rm } from "node:fs/promises";
import { join, relative } from "node:path";
import { inspect, pack as packageClosure } from "@odsuite/pack";
import { bundle, resolve as manifest, parse, parseReleaseVersion, releaseChannel } from "@odsuite/release";
import { channelRoot, configuration, configuredBase, version } from "./config.js";
import { hash, inventory, json, located, owned, read, revision, run } from "./files.js";
import type { BuildReceipt, PackReceipt, Selection } from "./types.js";

export async function selectedVersion(selection: Selection) {
  const channel = releaseChannel(selection.channel);
  const base = selection.base ?? (selection.version === undefined ? await configuredBase(selection.root) : "0.0.0");
  return { channel, version: version(selection, base) };
}
export async function build(selection: Selection): Promise<BuildReceipt> {
  const config = await configuration(selection.root, selection.channel);
  const identity = manifest(
    {},
    { channel: releaseChannel(config.channel), version: version(selection, selection.base ?? config.baseVersion) },
    config.product,
  );
  const base = channelRoot(config.root, config.channel);
  await owned(config.root, base);
  await mkdir(base, { recursive: true });
  const lock = await owned(config.root, join(config.root, ".state", "pipeline-build.lock"));
  await mkdir(join(config.root, ".state"), { recursive: true });
  const { open } = await import("node:fs/promises");
  const ownership = await open(lock, "wx");
  let temporary: string | undefined;
  try {
    await rm(join(base, "build.json"), { force: true });
    const source = await revision(config.root);
    await run(config.root, ["-r", "--if-present", "run", "build"], {
      ...process.env,
      ODSUITE_BUILD: identity.identity.version,
    });
    temporary = await mkdtemp(join(base, "build-"));
    for (const carrier of Object.keys(config.units)) {
      const output = await located(config.root, config.units[carrier]);
      // Validate the actual finite runtime closure before accepting build evidence.
      const actual = inspect(await bundle(output));
      if (
        actual.carrier !== carrier ||
        actual.channel !== config.channel ||
        actual.version !== identity.identity.version
      )
        throw Error("built runtime identity mismatch");
      await cp(output, join(temporary, carrier), { recursive: true });
    }
    await json(join(temporary, "release.json"), identity);
    const fingerprint = await inventory(temporary);
    const directory = join(base, "versions", identity.identity.version, fingerprint);
    await mkdir(join(directory, ".."), { recursive: true });
    try {
      await lstat(directory);
      if ((await inventory(directory)) !== fingerprint) throw Error("existing build content changed");
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
      await rename(temporary, directory);
      temporary = undefined;
    }
    if ((await revision(config.root)) !== source) throw Error("source commit changed during build");
    const receipt: BuildReceipt = {
      channel: config.channel,
      version: identity.identity.version,
      manifest: identity,
      source,
      fingerprint,
      directory: relative(config.root, directory),
      carriers: Object.fromEntries(
        Object.keys(config.units).map((carrier) => [carrier, relative(config.root, join(directory, carrier))]),
      ),
    };
    await json(join(base, "build.json"), receipt);
    return receipt;
  } finally {
    if (temporary) await rm(temporary, { recursive: true, force: true });
    await ownership.close();
    await rm(lock);
  }
}
export async function loadBuild(root: string, lane: string): Promise<BuildReceipt> {
  root = await realpath(root);
  const receipt = await read<BuildReceipt>(join(channelRoot(root, lane), "build.json"));
  parseReleaseVersion(receipt.version, lane);
  if (
    receipt.channel !== lane ||
    receipt.manifest.channel !== lane ||
    receipt.manifest.identity.version !== receipt.version
  )
    throw Error("build identity mismatch");
  const directory = await located(root, receipt.directory);
  if (JSON.stringify(parse(receipt.manifest)) !== JSON.stringify(parse(await read(join(directory, "release.json")))))
    throw Error("build manifest mismatch");
  if ((await inventory(directory)) !== receipt.fingerprint) throw Error("build fingerprint mismatch");
  const config = await configuration(root, lane);
  if (Object.keys(receipt.carriers).sort().join(":") !== Object.keys(config.units).sort().join(":"))
    throw Error("build carrier set mismatch");
  for (const carrier of Object.keys(config.units)) {
    if ((await located(root, receipt.carriers[carrier])) !== join(directory, carrier))
      throw Error("carrier path mismatch");
    const actual = inspect(await bundle(join(directory, carrier)));
    if (actual.carrier !== carrier || actual.channel !== lane || actual.version !== receipt.version)
      throw Error("build runtime identity mismatch");
  }
  return receipt;
}
export async function pack(root: string, lane: string): Promise<PackReceipt> {
  root = await realpath(root);
  const built = await loadBuild(root, lane),
    parent = join(channelRoot(root, lane), "packages", built.version);
  const base = join(parent, built.fingerprint);
  await owned(root, base);
  await mkdir(parent, { recursive: true });
  const temporary = await mkdtemp(join(parent, "pack-"));
  const receipt: PackReceipt = {
    channel: lane,
    version: built.version,
    source: built.source,
    fingerprint: built.fingerprint,
    packages: {} as PackReceipt["packages"],
  };
  try {
    for (const carrier of Object.keys(built.carriers)) {
      const result = await packageClosure({
        carrier,
        channel: lane,
        version: built.version,
        source: await located(root, built.carriers[carrier]),
        output: join(temporary, `${carrier}.bundle`),
      });
      receipt.packages[carrier] = { ...result, path: relative(root, join(base, `${carrier}.bundle`)) };
    }
    try {
      await lstat(base);
      if ((await inventory(base)) !== (await inventory(temporary))) throw Error("existing package content changed");
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
      await rename(temporary, base);
    }
    await json(join(channelRoot(root, lane), "package.json"), receipt);
    return receipt;
  } finally {
    await rm(temporary, { recursive: true, force: true });
  }
}
export async function loadPackage(root: string, lane: string): Promise<PackReceipt> {
  root = await realpath(root);
  const build = await loadBuild(root, lane),
    receipt = await read<PackReceipt>(join(channelRoot(root, lane), "package.json"));
  if (
    receipt.channel !== lane ||
    receipt.version !== build.version ||
    receipt.source !== build.source ||
    receipt.fingerprint !== build.fingerprint
  )
    throw Error("package identity mismatch");
  if (Object.keys(receipt.packages).sort().join(":") !== Object.keys(build.carriers).sort().join(":"))
    throw Error("package carrier set mismatch");
  for (const carrier of Object.keys(build.carriers)) {
    const item = receipt.packages[carrier]!,
      bytes = await readFile(await located(root, item.path));
    const value = inspect(bytes);
    if (
      item.carrier !== carrier ||
      item.channel !== lane ||
      item.version !== build.version ||
      bytes.length !== item.bytes ||
      hash(bytes) !== item.sha256 ||
      value.carrier !== carrier ||
      value.version !== build.version ||
      value.channel !== lane
    )
      throw Error("package integrity mismatch");
  }
  return receipt;
}
