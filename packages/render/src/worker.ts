import { readFile, rename, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { setTimeout } from "node:timers/promises";
import { digest } from "@odsuite/protocol";
import { encode } from "./encode.js";
import { type Progress, specification } from "./jobs/contract.js";
import { verify } from "./verify.js";

const [root, expected] = process.argv.slice(2);
if (!root || !expected) throw Error("worker requires a granted execution root and input digest");
const controller = new AbortController(),
  hold = globalThis.setInterval(() => {}, 1000);
process.once("SIGTERM", () => {
  controller.abort(Error("render stopped"));
  globalThis.clearInterval(hold);
});
process.once("SIGINT", () => {
  controller.abort(Error("render stopped"));
  globalThis.clearInterval(hold);
});
const save = async (value: unknown) => {
  await writeFile(join(root, "result.next"), JSON.stringify(value), { mode: 0o600, flush: true });
  await rename(join(root, "result.next"), join(root, "result.json"));
};
process.stdout.write("render-ready\n");
try {
  const raw = await readFile(join(root, "input.json"));
  if (digest(raw) !== expected) throw Error("fixed render input integrity mismatch");
  const input = JSON.parse(raw.toString()),
    spec = specification.parse(input.spec);
  let tools: { browser: string; ffmpeg: string; ffprobe: string } | undefined;
  while (!tools) {
    controller.signal.throwIfAborted();
    try {
      tools = JSON.parse(await readFile(join(root, "launch.json"), "utf8"));
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
    }
    if (!tools) await setTimeout(25, undefined, { signal: controller.signal });
  }
  process.env.HYPERFRAMES_NO_TELEMETRY = "1";
  process.env.HYPERFRAMES_FFMPEG_PATH = tools.ffmpeg;
  process.env.HYPERFRAMES_FFPROBE_PATH = tools.ffprobe;
  const progress = async (phase: Progress) => save({ phase });
  await encode({ ...input, spec, browser: tools.browser, signal: controller.signal, progress });
  await progress("verifying");
  const verification = await verify(input.output, spec, tools, controller.signal);
  await save({ phase: "succeeded", verification });
} catch (error) {
  await save({ phase: "failed", error: error instanceof Error ? error.message : String(error) });
}
// Completion is business state. The manager still owns retirement of this entire process tree.
if (controller.signal.aborted) globalThis.clearInterval(hold);
