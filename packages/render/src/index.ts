import { randomUUID } from "node:crypto";
import { lstat, mkdir, open, readFile, realpath, rename, writeFile } from "node:fs/promises";
import { join, resolve, sep } from "node:path";
import { setTimeout } from "node:timers/promises";
import { fileURLToPath } from "node:url";
import { type Library, type Loader, type Resource, resourceKey, type Use } from "@odsuite/blob";
import { canonical, digest } from "@odsuite/protocol";
import { source } from "@odsuite/serve";
import type { Context, Factory, Lease } from "@odsuite/sidecar";
import type { Verification } from "./contract.js";
import { materialize, type Snapshot } from "./snapshot.js";

export { fps, type Progress, type Specification, specification, type Verification } from "./contract.js";
export { freeze, type Snapshot } from "./snapshot.js";
export interface Tool {
  resource: Resource;
  executable: string;
  load: Loader;
}
export type Tools = { browser: Tool; ffmpeg: Tool; ffprobe: Tool };
export interface Options {
  factory: Factory;
  context: Context;
  library: Library;
  tools: Tools;
  input: Snapshot;
  signal?: AbortSignal;
  worker?: string;
}
/** Service-owned execution. Cancellation requests drain; they never declare a process dead. */
export async function render(options: Options) {
  const { factory, library, context, signal } = options,
    input = structuredClone(options.input),
    id = randomUUID(),
    grant = await factory.grant({ kind: "staging", name: "render", scope: "attempt", owner: id }),
    root = grant.value,
    view = join(root, "view"),
    output = join(root, "output.mp4"),
    uses: Use[] = [];
  let served: Awaited<ReturnType<typeof source>> | undefined,
    lease: Lease | undefined,
    retired = true;
  try {
    signal?.throwIfAborted();
    const html = await materialize(input, view);
    served = await source(factory, { name: `preview${id.replaceAll("-", "")}`, directory: view });
    const payload = Buffer.from(
      canonical({ html, spec: input.spec, origin: served.endpoint.url, view, scratch: root, output }),
    );
    await writeFile(join(root, "input.json"), payload, { flag: "wx", mode: 0o600, flush: true });
    const temporary = join(root, "tmp");
    await mkdir(temporary, { mode: 0o700 });
    retired = false;
    lease = await factory.start({
      service: "render",
      generation: digest(id),
      command: process.execPath,
      args: [options.worker ?? fileURLToPath(import.meta.resolve("@open-motion/render/worker")), root, digest(payload)],
      ready: "render-ready",
      timeout: 10000,
      grace: 3000,
      env: {
        HYPERFRAMES_NO_TELEMETRY: "1",
        TMPDIR: temporary,
        TMP: temporary,
        TEMP: temporary,
        PUPPETEER_TMP_DIR: temporary,
        PUPPETEER_CACHE_DIR: join(temporary, "cache"),
      },
    });
    const paths: Record<string, string> = {};
    for (const [name, tool] of Object.entries(options.tools)) {
      signal?.throwIfAborted();
      const use = await library.acquire(
        tool.resource,
        (librarySignal) => tool.load(signal ? AbortSignal.any([signal, librarySignal]) : librarySignal),
        {
          service: lease.service,
          generation: lease.generation,
          incarnation: lease.incarnation,
        },
      );
      uses.push(use);
      const path = resolve(use.path, tool.executable);
      if (!path.startsWith(use.path + sep) || (await realpath(path)) !== path || !(await lstat(path)).isFile())
        throw Error("native executable escaped its verified resource");
      paths[name] = path;
    }
    await writeFile(join(root, "launch.next"), JSON.stringify(paths), { flag: "wx", mode: 0o600, flush: true });
    await rename(join(root, "launch.next"), join(root, "launch.json"));
    const deadline = Date.now() + 25 * 60 * 1000;
    let verification: Verification | undefined;
    while (!verification) {
      signal?.throwIfAborted();
      if (Date.now() > deadline) throw Error("render execution deadline exceeded");
      try {
        const result = JSON.parse(await readFile(join(root, "result.json"), "utf8"));
        if (result.phase === "failed") throw Error(result.error);
        if (result.phase === "succeeded") verification = result.verification;
      } catch (error) {
        if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
      }
      if (!verification) {
        const instance = (await factory.directory()).instances.find((i) => i.incarnation === lease?.incarnation);
        if (!instance || instance.phase !== "ready") throw Error("render process ownership requires reconciliation");
        await setTimeout(100, undefined, { signal });
      }
    }
    const stopped = await factory.release(lease);
    if (stopped.status !== "stopped" || stopped.survivors.length) throw Error("render retirement unresolved");
    retired = true;
    lease = undefined;
    signal?.throwIfAborted();
    const directory = join(context.roots.data, "exports");
    await mkdir(directory, { recursive: true, mode: 0o700 });
    const path = join(directory, `${id}.mp4`);
    const film = await open(output, "r");
    try {
      await film.sync();
    } finally {
      await film.close();
    }
    await rename(output, path);
    const result = {
      id,
      path,
      revision: input.project.revision,
      sessionId: input.project.sessionId,
      artifactId: input.project.artifactId,
      spec: input.spec,
      verification,
      toolchain: Object.fromEntries(
        Object.entries(options.tools).map(([name, tool]) => [name, resourceKey(tool.resource)]),
      ),
    };
    const receipt = join(directory, `${id}.json`);
    await writeFile(`${receipt}.next`, canonical(result), { flag: "wx", mode: 0o600, flush: true });
    await rename(`${receipt}.next`, receipt);
    if (process.platform !== "win32") {
      const parent = await open(directory, "r");
      try {
        await parent.sync();
      } finally {
        await parent.close();
      }
    }
    return result;
  } finally {
    if (lease) {
      const stopped = await factory.release(lease);
      retired = stopped.status === "stopped" && !stopped.survivors.length;
    }
    if (retired) {
      for (const use of uses) await library.release(use);
      await served?.attachment.close();
      await factory.revoke(grant.lease);
    }
  }
}
