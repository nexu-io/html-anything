import { randomUUID } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { digest } from "@odsuite/protocol";
import type { Context, Factory, Lease } from "@odsuite/sidecar";

export interface Result {
  id: string;
  code: number;
  stdout: string;
  stderr: string;
}
export async function command(
  options: { factory: Factory; context: Context; worker: string; codex: string; profile: string },
  args: string[],
) {
  const id = randomUUID(),
    input = join(options.context.roots.runtime, `codex-${id}.json`),
    result = `${input}.result`;
  const script = /\.[cm]?js$/i.test(options.codex);
  await writeFile(
    input,
    JSON.stringify({
      id,
      command: script ? process.execPath : options.codex,
      args: script ? [options.codex, ...args] : args,
      profile: options.profile,
      result,
    }),
    { mode: 0o600, flag: "wx" },
  );
  let lease: Lease | undefined;
  let receiptResult: Result | undefined;
  const failures: unknown[] = [];
  try {
    lease = await options.factory.start({
      service: "codexregistration",
      generation: digest(id),
      command: process.execPath,
      args: [options.worker, input],
      ready: "codex-registration-ready",
      timeout: 10000,
      env: { ELECTRON_RUN_AS_NODE: null },
    });
    const until = Date.now() + 15000;
    for (;;) {
      try {
        const raw = await readFile(result);
        if (raw.length > 512 * 1024) throw Error("Codex command receipt exceeds its bound");
        const receipt = JSON.parse(raw.toString()) as Result;
        if (
          receipt.id !== id ||
          !Number.isInteger(receipt.code) ||
          typeof receipt.stdout !== "string" ||
          typeof receipt.stderr !== "string"
        )
          throw Error("invalid Codex command receipt");
        receiptResult = receipt;
        break;
      } catch (error) {
        if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
      }
      if (Date.now() >= until)
        throw Error("Codex registration command timed out; reconcile the retained intent before retrying");
      await new Promise((done) => setTimeout(done, 25));
    }
  } catch (error) {
    failures.push(error);
  }
  if (lease) {
    try {
      const released = await options.factory.release(lease);
      if (released.status !== "stopped" || released.survivors.length)
        throw Error("Codex command tree did not retire; authority retained");
    } catch (error) {
      failures.push(error);
    }
  }
  if (failures.length)
    throw new AggregateError(failures, "Codex command or drain failed; registration intent retained");
  if (!receiptResult) throw Error("Codex command returned no receipt");
  return receiptResult;
}
