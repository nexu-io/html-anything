import { resolve } from "node:path";
import { Inspector } from "@odsuite/inspect";
import { channel, type Digest, namespace, valid } from "@odsuite/protocol";
import type { Output } from "./index.js";

export const inspectHelp = `odsuite inspect list|probe|call|stop --data <manager-root> --channel <channel> --namespace <namespace> [--service <name> --generation <sha256:digest> --incarnation <uuid>] [--method <name> --input <json>] [--timeout <ms>]
All results are JSON. call/stop require an exact incarnation. Manager credentials never appear in output.`;
export function options(args: string[], allowed: string[]) {
  const values = new Map<string, string>();
  for (let i = 0; i < args.length; i += 2) {
    const key = args[i]?.slice(2),
      value = args[i + 1];
    if (
      !args[i]?.startsWith("--") ||
      !key ||
      !allowed.includes(key) ||
      !value ||
      value.startsWith("--") ||
      values.has(key)
    )
      throw new Error("unknown, duplicate or incomplete option");
    values.set(key, value);
  }
  return {
    get: (name: string) => values.get(name),
    required: (name: string) => {
      const v = values.get(name);
      if (!v) throw new Error(`--${name} is required`);
      return v;
    },
  };
}
export async function inspect(args: string[], cwd: string, output: Output) {
  if (args.length === 2 && args[1] === "--help") {
    output.stdout(`${inspectHelp}\n`);
    return 0;
  }
  const operation = args[1];
  if (!["list", "probe", "call", "stop"].includes(operation ?? "")) throw new Error("unknown inspect operation");
  const keys = ["data", "channel", "namespace", "timeout"];
  if (operation !== "list") keys.push("service", "generation", "incarnation");
  if (operation === "call") keys.push("method", "input");
  const flags = options(args.slice(2), keys);
  const controller = await Inspector.open(
    resolve(cwd, flags.required("data")),
    { channel: channel(flags.required("channel")), namespace: namespace(flags.required("namespace")) },
    Number(flags.get("timeout") ?? 5000),
  );
  let result: unknown;
  if (operation === "list") result = await controller.directory();
  else {
    const generation = flags.required("generation");
    if (!valid(generation)) throw new Error("invalid generation");
    const incarnation = operation === "probe" ? flags.get("incarnation") : flags.required("incarnation");
    const peer = await controller.target<Record<string, { input: unknown; output: unknown }>>(
      flags.required("service"),
      generation as Digest,
      incarnation,
    );
    const target = await peer.probe();
    result = {
      target,
      value:
        operation === "probe"
          ? null
          : operation === "call"
            ? await peer.call(flags.required("method"), JSON.parse(flags.get("input") ?? "null"))
            : ((await peer.stop()) ?? null),
    };
  }
  output.stdout(`${JSON.stringify({ schema: 1, ok: true, operation, result })}\n`);
  return 0;
}
