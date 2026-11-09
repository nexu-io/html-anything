import { resolve } from "node:path";
import { build, check, type Gate, gates, pack, publish, selectedVersion } from "@odsuite/pipeline";
import type { Output } from "./index.js";

export const pipelineHelp = `odsuite version|build --channel <name> [--version <X.Y.Z[-channel.N]> | --number <N>] [--base <X.Y.Z>] [--root <repo>]
odsuite check --channel <name> --gate policy|tests|artifacts|installed|desktop [--platform mac|linux|win] [--arch arm64|x64]
odsuite pack --channel <name> [--platform mac|linux|win] [--arch arm64|x64]
odsuite publish --channel <name> --repository <owner/repo> [--mode draft|release|prerelease] [--require <gate,...>]

Channel selects identity only. Checks are independent; publication requires only the gates explicitly selected by the caller.
Build compiles declared units and stages immutable fingerprinted content. Pack is unsigned and requires a matching native runner.`;
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
        ? ["gate", "platform", "arch"]
        : command === "pack"
          ? ["platform", "arch"]
          : ["repository", "mode", "require", "platform", "arch"];
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
  } else if (command === "pack") result = await pack(root, channel, options.get("platform"), options.get("arch"));
  else if (command === "check") {
    const gate = options.get("gate") as Gate;
    if (!gates.includes(gate)) throw new Error("--gate is required");
    result = await check(root, channel, gate, options.get("platform"), options.get("arch"));
  } else {
    const repository = options.get("repository"),
      mode = options.get("mode") ?? "draft";
    if (!repository || !["draft", "release", "prerelease"].includes(mode))
      throw new Error("invalid publication repository or mode");
    result = await publish({
      root,
      channel,
      repository,
      mode: mode as "draft" | "release" | "prerelease",
      require: (options.get("require")?.split(",") ?? []) as Gate[],
      platform: options.get("platform"),
      arch: options.get("arch"),
    });
  }
  output.stdout(`${JSON.stringify(result)}\n`);
  return 0;
}
