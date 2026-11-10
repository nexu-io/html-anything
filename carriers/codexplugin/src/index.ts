import { fileURLToPath } from "node:url";
import { type Options, open } from "@open-motion/standalone";
import { existing } from "./attachment.js";
import { collect } from "./environment.js";
import { listen } from "./stdio.js";

declare const OPEN_MOTION_VERSION: string;

export { metadata } from "./manifest.js";
export async function connect(options: Omit<Options, "environment">) {
  const attached = await existing(options.root, options.scope, options.version ?? OPEN_MOTION_VERSION);
  if (attached) {
    const transport = await listen(attached, async () => {});
    void transport.closed.catch(() => {});
    return { close: transport.close };
  }
  const runtime = await open({
    ...options,
    environment: collect(),
    web: options.web ?? fileURLToPath(new URL("./web/", import.meta.url)),
    worker: options.worker ?? fileURLToPath(new URL("./render/worker.mjs", import.meta.url)),
    daemon: options.daemon ?? fileURLToPath(new URL("./daemon/main.mjs", import.meta.url)),
  });
  try {
    const transport = await listen(runtime, () => runtime.close());
    void transport.closed.catch(() => {});
    return { close: transport.close };
  } catch (error) {
    await runtime.close();
    throw error;
  }
}
