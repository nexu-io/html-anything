#!/usr/bin/env node
import { homedir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { factoryScope } from "@odsuite/protocol";
import { inspectRecovery, recover, scopedManagerRoot } from "@odsuite/sidecar";
import { RuntimeReleaseMismatch } from "@open-motion/standalone/admission";
import { carriers, manifest, path, type Selection } from "./contract.js";
import { setup } from "./install.js";
import { native, start, status, stop } from "./runtime.js";

const help = `odsuite setup --carrier standalone|codexplugin [--home DIR] [--data DIR] [--profile DIR] [--skills DIR] [--codex FILE]
odsuite start|stop|status|prepare [--home DIR] [--data DIR] [--channel NAME] [--namespace NAME]
odsuite recover inspect --root DIR
odsuite recover apply --root DIR --expected FINGERPRINT

setup verifies and installs the shared kit; codexplugin also registers the selected host and Skills.
Runtime control uses its shared standalone composition. prepare verifies native resources; execution/export is separately verified.
Use through npx or npm exec; no global installation. Explicit workspace Skills require that Codex workspace to discover them.`;
async function main(args: string[]) {
  if (args.length === 1 && ["--help", "-h"].includes(args[0]!)) {
    process.stdout.write(help + "\n");
    return;
  }
  const directory = fileURLToPath(new URL("../payload/", import.meta.url));
  if (args.length === 1 && args[0] === "--version") {
    process.stdout.write((await manifest(directory)).release.identity.version + "\n");
    return;
  }
  const command = args.shift();
  if (!command || !["setup", "start", "stop", "status", "prepare", "recover"].includes(command))
    throw Error("expected setup|start|stop|status|prepare|recover");
  const operation = command === "recover" ? args.shift() : undefined;
  const allowed =
    command === "recover"
      ? ["root", ...(operation === "apply" ? ["expected"] : [])]
      : [
          "home",
          "data",
          "channel",
          "namespace",
          ...(command === "setup" ? ["carrier", "profile", "skills", "codex"] : []),
        ];
  const options = new Map<string, string>();
  for (let i = 0; i < args.length; i++) {
    const arg = args[i]!;
    if (!arg.startsWith("--")) throw Error("expected named application option");
    const eq = arg.indexOf("="),
      key = arg.slice(2, eq < 0 ? undefined : eq),
      value = eq < 0 ? args[++i] : arg.slice(eq + 1);
    if (!allowed.includes(key) || options.has(key) || !value || value.startsWith("--"))
      throw Error("unknown, duplicate or incomplete application option");
    options.set(key, value);
  }
  let result: unknown;
  if (command === "recover") {
    const root = options.get("root");
    if (!root || !["inspect", "apply"].includes(operation ?? ""))
      throw Error("recover requires inspect|apply and --root");
    result =
      operation === "inspect"
        ? await inspectRecovery(await path(root))
        : await recover(await path(root), { expected: options.get("expected") ?? "" });
  } else {
    const description = await manifest(directory),
      channel = options.get("channel") ?? description.release.channel;
    if (channel !== description.release.channel) throw Error("package release channel differs from requested identity");
    const scope = factoryScope({ channel, namespace: options.get("namespace") ?? description.namespace });
    const home = await path(options.get("home") ?? join(homedir(), ".local/share/open-motion"));
    const data = await path(scopedManagerRoot(await path(options.get("data") ?? join(home, "data")), scope));
    const carrier = options.get("carrier");
    if (command === "setup" && !carriers.includes(carrier as (typeof carriers)[number]))
      throw Error("setup requires --carrier standalone|codexplugin");
    const selection: Selection = {
      home,
      data,
      scope,
      carrier: (carrier ?? "standalone") as Selection["carrier"],
      profile: await path(options.get("profile") ?? process.env.CODEX_HOME ?? join(homedir(), ".codex")),
      skills: await path(options.get("skills") ?? join(homedir(), ".agents/skills")),
      codex: options.get("codex"),
    };
    if (command === "setup")
      result = await setup(
        directory,
        description,
        selection,
        fileURLToPath(new URL("./codex-worker.mjs", import.meta.url)),
      );
    else if (command === "start") result = await start(description, selection);
    else if (command === "stop") result = await stop(description, selection);
    else if (command === "status") result = await status(description, selection);
    else {
      const cancellation = new AbortController();
      const interrupt = () => {
        process.exitCode = 130;
        cancellation.abort(Error("Preparation interrupted by SIGINT"));
      };
      const terminate = () => {
        process.exitCode = 143;
        cancellation.abort(Error("Preparation interrupted by SIGTERM"));
      };
      process.on("SIGINT", interrupt);
      process.on("SIGTERM", terminate);
      try {
        result = await native(description, selection, cancellation.signal);
      } finally {
        process.off("SIGINT", interrupt);
        process.off("SIGTERM", terminate);
      }
    }
  }
  process.stdout.write(JSON.stringify({ ok: true, command, ...(operation ? { operation } : {}), result }) + "\n");
  if (command === "prepare" && !["ready"].includes((result as { state: string }).state)) process.exitCode = 1;
}
void main(process.argv.slice(2)).catch((error) => {
  process.stdout.write(
    JSON.stringify({
      ok: false,
      error:
        error instanceof RuntimeReleaseMismatch
          ? error.diagnostic()
          : { message: error instanceof Error ? error.message : String(error) },
    }) + "\n",
  );
  process.exitCode ??= 2;
});
