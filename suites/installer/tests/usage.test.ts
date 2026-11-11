import { spawn } from "node:child_process";
import { randomUUID } from "node:crypto";
import { mkdir, mkdtemp, writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import { DatabaseSync } from "node:sqlite";
import { pathToFileURL } from "node:url";
import { channel, namespace } from "@odsuite/protocol";
import { bundle } from "@odsuite/release";
import { inspectRecovery, observeProcesses, readDirectory, recover } from "@odsuite/sidecar";
import { expect, it } from "vitest";
import { open } from "@";
import { hash } from "../src/archive.js";

async function fixture() {
  const base = resolve("../../.artifacts/installation-uses");
  await mkdir(base, { recursive: true });
  const root = await mkdtemp(join(base, "use-")),
    data = join(root, "runtime"),
    home = join(root, "home"),
    source = join(root, "source");
  await mkdir(source);
  await writeFile(join(source, "main.mjs"), "export const installed=true;");
  await writeFile(
    join(source, "runtime.json"),
    JSON.stringify({
      carrier: "codexplugin",
      version: "1.0.0",
      channel: "stable",
      files: ["main.mjs", "runtime.json"],
    }),
  );
  const bytes = await bundle(source),
    options = { home, product: "io.test.app", scope: { channel: channel("stable"), namespace: namespace("usage") } },
    s = await open(options);
  try {
    const receipt = await s.install({ data, requestId: randomUUID(), source: { bytes, sha256: hash(bytes) } });
    return {
      root,
      bytes,
      options,
      receipt,
      input: { requestId: receipt.requestId, application: receipt.path, data, carrier: receipt.carrier },
    };
  } finally {
    await s.close();
  }
}
it("binds uses to selected immutable receipts and deduplicates a real controller across reopen", async () => {
  const f = await fixture();
  let s = await open(f.options);
  try {
    for (const bad of [
      { ...f.input, data: join(f.root, "foreign") },
      { ...f.input, application: join(f.root, "foreign") },
      { ...f.input, carrier: "standalone" },
    ])
      await expect(s.use(bad)).rejects.toThrow("binding mismatch");
    const staged = await s.stage({
      data: f.input.data,
      requestId: randomUUID(),
      source: { bytes: f.bytes, sha256: hash(f.bytes) },
    });
    await expect(s.use({ ...f.input, requestId: staged.requestId })).rejects.toThrow("selected installation changed");
    expect(await s.uses()).toEqual([]);
    const use = await s.use(f.input);
    expect(use.controller.pid).toBe(process.pid);
    expect(await s.use(f.input)).toEqual(use);
    await s.close();
    s = await open(f.options);
    expect(await s.use(f.input)).toEqual(use);
    expect(await s.uses()).toEqual([{ ...use, state: "alive" }]);
    await expect(
      s.use({
        ...f.input,
        manager: {
          root: f.input.data,
          scope: f.options.scope,
          pid: process.pid,
          birth: use.controller.birth,
          incarnation: randomUUID(),
        },
      }),
    ).rejects.toThrow();
  } finally {
    await s.close();
  }
});
for (const interrupted of [false, true])
  it(`observes actual process lifetime after ${interrupted ? "SIGKILL and explicit recovery" : "installer closure"}`, async () => {
    const f = await fixture(),
      entry = pathToFileURL(resolve("dist/index.mjs")).href;
    const script = `import{open}from ${JSON.stringify(entry)};const f=JSON.parse(process.argv[1]),s=await open(f.options);const use=await s.use(f.input);if(!f.interrupted)await s.close();console.log(JSON.stringify(use));setInterval(()=>{},1000);`;
    const child = spawn(
      process.execPath,
      ["--input-type=module", "-e", script, JSON.stringify({ ...f, interrupted })],
      { stdio: ["ignore", "pipe", "pipe"] },
    );
    let output = "",
      errors = "";
    child.stdout.on("data", (b) => (output += b));
    child.stderr.on("data", (b) => (errors += b));
    const exited = new Promise<void>((done, reject) => {
      child.once("exit", () => done());
      child.once("error", reject);
    });
    try {
      await expect
        .poll(
          () => {
            if (child.exitCode !== null) throw Error(errors);
            return output.includes("\n");
          },
          { timeout: 10000 },
        )
        .toBe(true);
      const use = JSON.parse(output.trim()),
        authority = join(f.options.home, "authority", f.options.product);
      if (!interrupted) {
        expect((await readDirectory(authority)).manager.phase).toBe("closed");
        const s = await open(f.options);
        try {
          expect(await s.uses()).toEqual([{ ...use, state: "alive" }]);
        } finally {
          await s.close();
        }
      }
      expect(child.kill("SIGKILL")).toBe(true);
      await exited;
      if (interrupted) {
        await expect(open(f.options)).rejects.toThrow();
        const plan = await inspectRecovery(authority);
        expect(plan.phase).toBe("ready");
        await recover(authority, { expected: plan.fingerprint });
      }
      const s = await open(f.options);
      try {
        expect(await s.uses()).toEqual([{ ...use, state: "retired" }]);
        expect(await s.read("codexplugin")).toEqual(f.receipt);
      } finally {
        await s.close();
      }
      expect(await observeProcesses(authority)).toEqual([]);
    } finally {
      if (child.exitCode === null && child.signalCode === null) child.kill("SIGKILL");
      await exited;
    }
  }, 30000);

for (const format of [1, 2])
  it(`rejects discarded installation format ${format} without migrating or resetting history`, async () => {
    const f = await fixture(),
      s = await open(f.options),
      data = s.context.roots.data;
    await s.close();
    const db = new DatabaseSync(join(data, "installations.sqlite"));
    db.exec(`PRAGMA user_version=${format}`);
    db.close();
    await expect(open(f.options)).rejects.toThrow("unsupported installation journal format");
    const retained = new DatabaseSync(join(data, "installations.sqlite"), { readOnly: true });
    try {
      expect(retained.prepare("PRAGMA user_version").get()?.user_version).toBe(format);
      expect(retained.prepare("SELECT count(*) AS n FROM receipts").get()?.n).toBe(1);
    } finally {
      retained.close();
    }
  });
