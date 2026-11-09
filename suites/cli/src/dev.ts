import { configure, connect, repository, restart, start, status, stop } from "@odsuite/dev";
import { channel, namespace } from "@odsuite/protocol";
import type { Output } from "./index.js";
export const devHelp = `odsuite dev start|restart --carrier=<name> [--channel=dev] [--namespace=default] [--watch=true|false] [--headless] [--root=<repo>]
odsuite dev status|stop [--channel=dev] [--namespace=default] [--carrier=<name>] [--root=<repo>]
odsuite dev connect --carrier=codexplugin [--channel=dev] [--namespace=default] [--root=<repo>]
Use through pnpm exec. Control/liveness come only from sidecar. connect attaches carrier stdio without owning its manager.`;
export async function development(args: string[], cwd: string, output: Output) {
  if (args.length === 2 && ["--help", "-h"].includes(args[1] ?? "")) {
    output.stdout(`${devHelp}\n`);
    return 0;
  }
  const operation = args[1];
  if (!["start", "stop", "status", "restart", "connect"].includes(operation ?? ""))
    throw new Error("unknown dev operation");
  const values = new Map<string, string>();
  for (let i = 2; i < args.length; i++) {
    const arg = args[i] ?? "";
    if (!arg.startsWith("--")) throw new Error("expected named dev option");
    const at = arg.indexOf("="),
      key = arg.slice(2, at < 0 ? undefined : at);
    if (!["carrier", "channel", "namespace", "root", "watch", "headless"].includes(key) || values.has(key))
      throw new Error("unknown or duplicate dev option");
    let value = at < 0 ? undefined : arg.slice(at + 1);
    if (value === undefined) {
      if (key === "headless") value = "true";
      else {
        value = args[++i];
        if (!value || value.startsWith("--")) throw new Error("incomplete dev option");
      }
    }
    if (!value) throw new Error("empty dev option");
    values.set(key, value);
  }
  if (!["start", "restart"].includes(operation ?? "") && (values.has("watch") || values.has("headless")))
    throw new Error("watch/headless apply only to start/restart");
  for (const key of ["watch", "headless"])
    if (values.has(key) && !["true", "false"].includes(values.get(key) ?? ""))
      throw new Error(`--${key} must be true or false`);
  const repo = await repository(cwd, values.get("root")),
    scope = {
      channel: channel(values.get("channel") ?? "dev"),
      namespace: namespace(values.get("namespace") ?? "default"),
    };
  const target = { repo, scope, carrier: values.get("carrier") };
  if (operation === "connect") {
    if (!target.carrier) throw new Error("--carrier is required for connect");
    await connect(target);
    return 0;
  }
  const result =
    operation === "status"
      ? await status(target)
      : operation === "stop"
        ? await stop(target)
        : await (async () => {
            const plan = await configure({
              ...target,
              ...(values.has("watch") ? { watch: values.get("watch") === "true" } : {}),
              ...(values.has("headless") ? { headless: values.get("headless") === "true" } : {}),
            });
            return operation === "start" ? start(plan) : restart(plan);
          })();
  output.stdout(`${JSON.stringify({ schemaVersion: 1, ok: true, operation: `dev ${operation}`, result })}\n`);
  return 0;
}
