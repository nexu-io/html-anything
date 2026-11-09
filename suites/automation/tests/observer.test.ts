import { spawn } from "node:child_process";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { expect, it } from "vitest";
import { waitGone } from "@";

it.runIf(process.platform === "darwin" && process.env.ODSUITE_RUNTIME_NATIVE === "1")(
  "stops the native observer when its validation parent is killed",
  async () => {
    const root = await mkdtemp(join(tmpdir(), "observer-owner-"));
    const entry = pathToFileURL(fileURLToPath(new URL("../dist/index.mjs", import.meta.url))).href;
    const program = `import{Observer}from ${JSON.stringify(entry)};const o=await Observer.open({directory:${JSON.stringify(root)},bundle:'io.openmotion.observerfixture'});console.log(JSON.stringify({pid:o.pid}));`;
    const parent = spawn(process.execPath, ["--input-type=module", "-e", program], {
      stdio: ["ignore", "pipe", "pipe"],
    });
    const exited = new Promise((done) => parent.once("exit", done));
    let output = "",
      errors = "",
      pid: number | undefined;
    parent.stdout.on("data", (b: Buffer) => {
      output += b.toString();
    });
    parent.stderr.on("data", (b: Buffer) => {
      errors += b.toString();
    });
    try {
      const deadline = Date.now() + 15000;
      while (!output.includes("\n") && parent.exitCode === null && Date.now() < deadline)
        await new Promise((done) => setTimeout(done, 20));
      if (!output.includes("\n")) throw new Error(`observer parent failed: ${errors}`);
      pid = JSON.parse(output.split("\n")[0] ?? "{}").pid;
      expect(Number.isSafeInteger(pid)).toBe(true);
    } finally {
      parent.kill("SIGKILL");
      await exited;
      try {
        if (pid) await waitGone(pid);
      } finally {
        await rm(root, { recursive: true, force: true });
      }
    }
  },
  20000,
);
