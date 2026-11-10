import { spawn } from "node:child_process";
import { readFile, rename, writeFile } from "node:fs/promises";
import { isAbsolute } from "node:path";

const [input] = process.argv.slice(2);
if (!input || !isAbsolute(input)) throw Error("Codex worker requires a granted input path");
const bytes = await readFile(input);
if (bytes.length > 32768) throw Error("Codex worker input exceeds its bound");
const request = JSON.parse(bytes.toString()) as {
  id: string;
  command: string;
  args: string[];
  profile: string;
  result: string;
};
if (
  !request.id ||
  !request.command ||
  !Array.isArray(request.args) ||
  !isAbsolute(request.result) ||
  !isAbsolute(request.profile)
)
  throw Error("invalid Codex worker input");
const keep = setInterval(() => {}, 1000);
process.once("SIGTERM", () => clearInterval(keep));
process.stdout.write("codex-registration-ready\n");
let stdout = "",
  stderr = "",
  overflow = false;
const child = spawn(request.command, request.args, {
  env: { ...process.env, CODEX_HOME: request.profile },
  stdio: ["ignore", "pipe", "pipe"],
  windowsHide: true,
});
const capture = (current: string, chunk: Buffer) => {
  if (Buffer.byteLength(current) + chunk.length > 65536) overflow = true;
  return (current + chunk.toString()).slice(0, 65536);
};
child.stdout.on("data", (chunk: Buffer) => {
  stdout = capture(stdout, chunk);
});
child.stderr.on("data", (chunk: Buffer) => {
  stderr = capture(stderr, chunk);
});
let saved = false;
const save = async (code: number) => {
  if (saved) return;
  saved = true;
  await writeFile(
    `${request.result}.next`,
    JSON.stringify({ id: request.id, code: overflow ? -1 : code, stdout, stderr }),
    { mode: 0o600, flush: true },
  );
  await rename(`${request.result}.next`, request.result);
};
child.once("error", () => {
  void save(-1);
});
child.once("close", (code) => {
  void save(code ?? -1);
});
