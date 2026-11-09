import { resolve } from "node:path";
import { channel, namespace } from "@odsuite/protocol";
import { configuration, Sources } from "@odsuite/serve";
import type { Output } from "./index.js";
import { options } from "./inspect.js";

export const serveHelp = `odsuite serve --channel <channel> --namespace <namespace> [--root <repo>]
Foreground managed static sources declared in odsuite.yaml/serve. SIGINT/SIGTERM drains all sources.`;
export async function serve(args: string[], cwd: string, output: Output) {
  if (args.length === 2 && args[1] === "--help") {
    output.stdout(`${serveHelp}\n`);
    return 0;
  }
  const flags = options(args.slice(1), ["channel", "namespace", "root"]);
  const root = resolve(cwd, flags.get("root") ?? ".");
  const active = await Sources.open({
    ...(await configuration(root)),
    scope: { channel: channel(flags.required("channel")), namespace: namespace(flags.required("namespace")) },
  });
  let stopping: Promise<void> | undefined;
  let done: () => void = () => {};
  let failed: (error: unknown) => void = () => {};
  const closed = new Promise<void>((yes, no) => {
    done = yes;
    failed = no;
  });
  const stop = () => {
    if (!stopping) stopping = active.close().then(done, failed);
  };
  process.on("SIGINT", stop);
  process.on("SIGTERM", stop);
  try {
    output.stdout(`${JSON.stringify({ schema: 1, ok: true, operation: "serve", sources: active.endpoints })}\n`);
    await closed;
    return 0;
  } finally {
    process.off("SIGINT", stop);
    process.off("SIGTERM", stop);
  }
}
