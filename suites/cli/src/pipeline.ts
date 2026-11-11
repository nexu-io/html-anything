import { resolve } from "node:path";
import { build, candidate, check, type Gate, gates, pack, selectedVersion } from "@odsuite/pipeline";
import type { Output } from "./index.js";

export const pipelineHelp = `odsuite version|build --channel <name> [--version <X.Y.Z[-channel.N]> | --number <N>] [--base <X.Y.Z>] [--root <repo>]
odsuite pack --channel <name> [--root <repo>]
odsuite candidate --channel <name> --revision <N> [--root <repo>]
odsuite check --channel <name> --gate policy|tests|artifacts [--root <repo>]

Both Node carriers share one version. Pack verifies local closures and emits the finite npm kit; publication is a separate lifecycle.`;
export async function pipeline(args: string[], cwd: string, output: Output): Promise<number> {
  if (args.length === 2 && ["--help", "-h"].includes(args[1] ?? "")) {
    output.stdout(`${pipelineHelp}\n`);
    return 0;
  }
  const command = args[0];
  const extra =
    command === "version" || command === "build"
      ? ["version", "number", "base"]
      : command === "check"
        ? ["gate"]
        : command === "candidate"
          ? ["revision"]
          : [];
  const options = new Map<string, string>();
  for (let index = 1; index < args.length; index += 2) {
    const arg = args[index],
      value = args[index + 1],
      name = arg?.slice(2);
    if (
      !arg?.startsWith("--") ||
      !name ||
      !["root", "channel", ...extra].includes(name) ||
      !value ||
      value.startsWith("--") ||
      options.has(name)
    )
      throw new Error("unknown, duplicate or incomplete pipeline option");
    options.set(name, value);
  }
  const root = resolve(cwd, options.get("root") ?? "."),
    channel = options.get("channel");
  if (!channel) throw new Error("--channel is required");
  let result: unknown;
  if (command === "build" || command === "version") {
    const raw = options.get("number");
    const number = raw === undefined ? undefined : Number(raw);
    if (raw !== undefined && (!/^[1-9]\d*$/.test(raw) || !Number.isSafeInteger(number)))
      throw new Error("--number must be a positive safe integer");
    const selection = { root, channel, version: options.get("version"), base: options.get("base"), number };
    result = command === "build" ? await build(selection) : await selectedVersion(selection);
  } else if (command === "pack") result = await pack(root, channel);
  else if (command === "candidate") {
    const raw = options.get("revision"),
      revision = Number(raw);
    if (!raw || !/^[1-9]\d*$/.test(raw) || !Number.isSafeInteger(revision))
      throw Error("--revision must be a positive safe integer");
    result = await candidate(root, channel, revision);
  } else if (command === "check") {
    const gate = options.get("gate") as Gate;
    if (!gates.includes(gate)) throw new Error("--gate is required");
    result = await check(root, channel, gate);
  } else throw Error("unsupported pipeline command");
  output.stdout(`${JSON.stringify(result)}\n`);
  return 0;
}
