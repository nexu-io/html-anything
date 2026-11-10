import { fileURLToPath } from "node:url";
import { type Options, open } from "@open-motion/standalone";
import { collect } from "./environment.js";
import { listen } from "./stdio.js";

export { metadata } from "./manifest.js";
export async function connect(options: Omit<Options, "environment">) {
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
