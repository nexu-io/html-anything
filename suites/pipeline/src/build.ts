import { cp, lstat, mkdir, mkdtemp, readFile, realpath, rename, rm, stat, writeFile } from "node:fs/promises";
import { basename, join, relative } from "node:path";
import { pack as nativePack, target } from "@odsuite/pack";
import { compose, resolve as manifest, materialize, parseReleaseVersion, releaseChannel } from "@odsuite/release";
import { channelRoot, configuration, configuredBase, version } from "./config.js";
import { execute, hash, inside, inventory, json, located, owned, read, revision, run } from "./files.js";
import { readProduct, writeProduct } from "./product.js";
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
    {
      channel: releaseChannel(config.channel),
      version: version(selection, selection.base ?? config.baseVersion),
    },
    config.product,
  );
  const base = channelRoot(config.root, config.channel);
  await owned(config.root, base);
  await mkdir(base, { recursive: true });
  const lock = join(config.root, ".state", "pipeline-build.lock");
  await owned(config.root, lock);
  await mkdir(join(config.root, ".state"), { recursive: true });
  const { open } = await import("node:fs/promises");
  const ownership = await open(lock, "wx");
  const sourceRevision = await revision(config.root);
  let temporary: string | undefined;
  try {
    await rm(join(base, "build.json"), { force: true });
    await run(config.root, ["-r", "--if-present", "run", "build"], {
      ...process.env,
      ODSUITE_BUILD: identity.identity.version,
    });
    temporary = await mkdtemp(join(base, "build-"));
    const carrier = join(temporary, "carrier"),
      content = join(temporary, "content");
    const source = async (key: keyof typeof config.units) =>
      located(config.root, relative(config.root, join(config.units[key], config.outputs[key])));
    const blobs = await Promise.all(
      Object.entries(config.blobs).map(async ([slot, path]) => ({ slot, path: await located(config.root, path) })),
    );
    await cp(await source("carrier"), carrier, { recursive: true });
    await writeFile(
      join(carrier, "host.json"),
      JSON.stringify({ carrier: config.carrier, namespace: config.namespace, manifest: identity }),
    );
    const product = await compose(identity, {
      carrier: config.carrier,
      capsule: await source("capsule"),
      daemon: await source("daemon"),
      web: await source("web"),
      blobs,
    });
    await writeProduct(content, product);
    const fingerprint = await inventory(temporary);
    const destination = join(base, "versions", identity.identity.version, fingerprint);
    await mkdir(join(destination, ".."), { recursive: true });
    try {
      await lstat(destination);
      if ((await inventory(destination)) !== fingerprint) throw new Error("existing build content changed");
    } catch (fault) {
      if ((fault as NodeJS.ErrnoException).code !== "ENOENT") throw fault;
      await rename(temporary, destination);
      temporary = undefined;
    }
    if ((await revision(config.root)) !== sourceRevision) throw new Error("source commit changed during build");
    const receipt: BuildReceipt = {
      schema: 1,
      channel: config.channel,
      version: identity.identity.version,
      manifest: identity,
      source: sourceRevision,
      fingerprint,
      generation: product.envelope.digest,
      content: relative(config.root, join(destination, "content")),
      carrier: relative(config.root, join(destination, "carrier")),
      carrierABI: config.carrier,
      namespace: config.namespace,
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
  if (receipt.schema !== 1 || receipt.channel !== lane) throw new Error("build identity mismatch");
  parseReleaseVersion(receipt.version, lane);
  if (receipt.manifest.channel !== lane || receipt.manifest.identity.version !== receipt.version)
    throw new Error("build manifest mismatch");
  const content = await located(root, receipt.content),
    carrier = await located(root, receipt.carrier);
  if (join(content, "..") !== join(carrier, "..") || (await inventory(join(content, ".."))) !== receipt.fingerprint)
    throw new Error("build content fingerprint mismatch");
  const product = await readProduct(content);
  if (
    product.envelope.digest !== receipt.generation ||
    JSON.stringify(product.manifest) !== JSON.stringify(receipt.manifest)
  )
    throw new Error("build generation mismatch");
  return receipt;
}
export async function pack(root: string, lane: string, platform?: string, arch?: string): Promise<PackReceipt> {
  root = await realpath(root);
  const selected = target(platform, arch),
    build = await loadBuild(root, lane);
  const base = join(channelRoot(root, lane), "packages", `${selected.platform}-${selected.arch}`);
  await owned(root, base);
  await owned(root, join(base, "application"));
  await mkdir(base, { recursive: true });
  const temporary = await mkdtemp(join(base, "pack-"));
  try {
    const product = await readProduct(await located(root, build.content));
    for (const kind of ["daemon", "web"] as const) {
      const asset = product.assets.find((item) => item.artifact.kind === kind);
      if (!asset) throw new Error(`missing ${kind}`);
      await materialize(asset.bytes, join(temporary, kind));
    }
    const result = await nativePack({
      ...selected,
      carrier: await located(root, build.carrier),
      seed: await located(root, build.content),
      manifest: build.manifest,
      daemon: join(temporary, "daemon"),
      web: join(temporary, "web"),
      output: join(base, "application"),
    });
    const name = `${build.manifest.identity.scheme}-${build.version}-${selected.platform}-${selected.arch}.${selected.platform === "linux" ? "tar.gz" : "zip"}`;
    const archive = await owned(root, join(base, name));
    if (selected.platform === "mac") await execute("ditto", ["-c", "-k", "--keepParent", result.app, archive]);
    else {
      const archiver =
        selected.platform === "win"
          ? join(process.env.SystemRoot ?? process.env.SYSTEMROOT ?? "C:\\Windows", "System32", "tar.exe")
          : "tar";
      await execute(archiver, [
        selected.platform === "win" ? "-a" : "-z",
        "-cf",
        archive,
        "-C",
        join(result.app, ".."),
        basename(result.app),
      ]);
    }
    const bytes = await readFile(archive);
    const digest = hash(bytes);
    const receipt: PackReceipt = {
      schema: 1,
      ...selected,
      channel: lane,
      version: build.version,
      fingerprint: build.fingerprint,
      source: build.source,
      package: Object.fromEntries(
        Object.entries(result).map(([key, path]) => {
          if (!inside(root, path)) throw new Error("package escaped repository");
          return [key, relative(root, path)];
        }),
      ) as unknown as PackReceipt["package"],
      inventory: await inventory(result.app),
      artifact: { path: relative(root, archive), sha256: digest, bytes: (await stat(archive)).size },
    };
    await writeFile(`${archive}.sha256`, `${digest}  ${name}\n`);
    await json(join(base, "package.json"), receipt);
    return receipt;
  } finally {
    await rm(temporary, { recursive: true, force: true });
  }
}
export async function loadPackage(root: string, lane: string, platform?: string, arch?: string): Promise<PackReceipt> {
  root = await realpath(root);
  const selected = target(platform, arch),
    build = await loadBuild(root, lane);
  const receipt = await read<PackReceipt>(
    join(channelRoot(root, lane), "packages", `${selected.platform}-${selected.arch}`, "package.json"),
  );
  if (
    receipt.schema !== 1 ||
    receipt.channel !== lane ||
    receipt.version !== build.version ||
    receipt.fingerprint !== build.fingerprint ||
    receipt.platform !== selected.platform ||
    receipt.arch !== selected.arch
  )
    throw new Error("package identity mismatch");
  const bytes = await readFile(await located(root, receipt.artifact.path));
  if (
    bytes.length !== receipt.artifact.bytes ||
    hash(bytes) !== receipt.artifact.sha256 ||
    (await inventory(await located(root, receipt.package.app))) !== receipt.inventory
  )
    throw new Error("package artifact integrity mismatch");
  return receipt;
}
