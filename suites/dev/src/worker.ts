import { spawn } from "node:child_process";
import { open, rename, writeFile } from "node:fs/promises";

const repo = process.env.ODSUITE_DEV_BUILD_REPO,
  log = process.env.ODSUITE_DEV_BUILD_LOG,
  result = process.env.ODSUITE_DEV_BUILD_RESULT,
  id = process.env.ODSUITE_DEV_BUILD_ID;
if (!repo || !log || !result || !id) throw new Error("managed build inputs are required");
const output = await open(log, "a", 0o600);
// This wrapper and pnpm/compiler descendants are one sidecar-owned process tree.
const child = spawn("pnpm", ["build"], { cwd: repo, env: process.env, stdio: ["ignore", output.fd, output.fd] });
const commit = async (code: number, error?: string) => {
  await writeFile(`${result}.tmp`, JSON.stringify({ schema: 1, id, code, error }), { mode: 0o600 });
  await rename(`${result}.tmp`, result);
  await output.close();
};
child.once("error", (error) => void commit(1, error.message));
child.once("exit", (code) => void commit(code ?? 1));
child.once("spawn", () => process.stdout.write("ready\n"));
// Keep the registered target alive until its owner consumes the receipt and releases it.
const keep = setInterval(() => {}, 1000);
process.once("SIGTERM", () => {
  clearInterval(keep);
});
process.once("SIGINT", () => {
  clearInterval(keep);
});
