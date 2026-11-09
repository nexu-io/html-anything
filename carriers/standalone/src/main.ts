#!/usr/bin/env node
import { channel, namespace } from "@odsuite/protocol";
import { managerReady } from "@odsuite/sidecar";
import { open } from "./index.js";

const args = process.argv.slice(2);
const values = new Map<string, string>();
for (let i = 0; i < args.length; i += 2) {
  const flag = args[i],
    value = args[i + 1];
  if (
    !flag ||
    !["--root", "--channel", "--namespace", "--version"].includes(flag) ||
    !value ||
    value.startsWith("--") ||
    values.has(flag)
  )
    throw new Error("expected --root, --channel, --namespace and optional --version");
  values.set(flag, value);
}
const root = values.get("--root");
if (!root || !values.has("--channel") || !values.has("--namespace"))
  throw new Error("root/channel/namespace are required");
const runtime = await open({
  root,
  scope: { channel: channel(values.get("--channel") ?? ""), namespace: namespace(values.get("--namespace") ?? "") },
  version: values.get("--version"),
});
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
