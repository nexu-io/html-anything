#!/usr/bin/env node
import { fileURLToPath } from "node:url";
import { channel, namespace } from "@odsuite/protocol";
import { managerArguments, managerReady } from "@odsuite/sidecar";
import { open, openPreparation } from "./index.js";

const args = managerArguments();
const values = new Map<string, string>();
for (let i = 0; i < args.length; i += 2) {
  const flag = args[i],
    value = args[i + 1];
  if (
    !flag ||
    !["--root", "--channel", "--namespace", "--mode"].includes(flag) ||
    !value ||
    value.startsWith("--") ||
    values.has(flag)
  )
    throw new Error("expected root/channel/namespace and optional mode argument");
  values.set(flag, value);
}
const root = values.get("--root");
if (!root || !values.has("--channel") || !values.has("--namespace"))
  throw new Error("root/channel/namespace are required");
const mode = values.get("--mode") ?? "runtime";
if (mode !== "runtime" && mode !== "prepare") throw Error("mode must be runtime or prepare");
const options = {
  root,
  web: fileURLToPath(new URL("./web/", import.meta.url)),
  daemon: fileURLToPath(new URL("./daemon/main.mjs", import.meta.url)),
  worker: fileURLToPath(new URL("./render/worker.mjs", import.meta.url)),
  scope: { channel: channel(values.get("--channel") ?? ""), namespace: namespace(values.get("--namespace") ?? "") },
};
const runtime = await (mode === "prepare" ? openPreparation(options) : open(options));
await managerReady(runtime.manager, root, {
  channel: channel(values.get("--channel") ?? ""),
  namespace: namespace(values.get("--namespace") ?? ""),
});
let stopping: Promise<void> | undefined;
const stop = () => {
  if (stopping) return;
  stopping = runtime.close().catch((error) => {
    process.stderr.write(`${error}\n`);
    process.exitCode = 1;
  });
};
process.once("SIGINT", stop);
process.once("SIGTERM", stop);
process.stdout.write(`${JSON.stringify(await runtime.status())}\n`);
