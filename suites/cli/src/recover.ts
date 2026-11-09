import { resolve } from "node:path";
import { inspectRecovery, recover } from "@odsuite/sidecar";
import type { Output } from "./index.js";
import { options } from "./inspect.js";

export const recoverHelp =
  "odsuite recover inspect|apply --data <manager-root> [--expected <sha256:fingerprint>]\nRoot-wide explicit recovery; live or uncertain owners are refused. No process adoption or format migration.";
export async function recovery(args: string[], cwd: string, output: Output) {
  if (args.length === 2 && args[1] === "--help") {
    output.stdout(`${recoverHelp}\n`);
    return 0;
  }
  const operation = args[1];
  if (operation !== "inspect" && operation !== "apply") throw new Error("unknown recover operation");
  const flags = options(args.slice(2), operation === "apply" ? ["data", "expected"] : ["data"]);
  const root = resolve(cwd, flags.required("data"));
  const result =
    operation === "inspect"
      ? await inspectRecovery(root)
      : await recover(root, { expected: flags.required("expected") });
  output.stdout(`${JSON.stringify({ schema: 1, ok: true, operation, result })}\n`);
  return 0;
}
