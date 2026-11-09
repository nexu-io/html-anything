import { type ChildProcess, spawn } from "node:child_process";
import { mkdir, mkdtemp, readFile, rm, stat, symlink, writeFile } from "node:fs/promises";
import { createServer } from "node:net";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createInterface } from "node:readline";
import { DatabaseSync } from "node:sqlite";
import { channel, namespace } from "@odsuite/protocol";
import { expect, it } from "vitest";
import { serve } from "@";
import { Resources } from "../../src/runtime/resource.js";

const module = new URL("../../dist/index.mjs", import.meta.url).href;
const body = `import {serve} from ${JSON.stringify(module)};
const [root,mode,endpoint]=process.argv.slice(1);
try {
  const service=await serve(endpoint,{root});
  const grant=request=>service.factory({channel:'stable',namespace:'main'}).grant(request);
  const staging=await grant({kind:'staging',name:'probe',owner:'attempt',scope:'attempt'});
  const port=await grant({kind:'port',name:'probe',owner:'attempt',scope:'attempt'});
  console.log(JSON.stringify({result:'owned',staging:staging.value,port:port.value}));
  process.stdin.resume();
  process.stdin.once('data',async()=>{await service.close();process.stdin.destroy();});
} catch(error) {console.log(JSON.stringify({result:'blocked',error:error.message}));}`;

async function child(root: string, mode = "manager", endpoint = join(root, "manager.sock")) {
  const process = spawn(globalThis.process.execPath, ["--input-type=module", "-e", body, root, mode, endpoint], {
    stdio: ["pipe", "pipe", "pipe"],
  });
  const lines = createInterface({ input: process.stdout });
  const result = await new Promise<{ result: string; error?: string; port: string; staging: string }>(
    (done, reject) => {
      const timer = setTimeout(() => {
        process.kill("SIGKILL");
        reject(new Error("owner child timeout"));
      }, 5000);
      process.once("error", (error) => {
        clearTimeout(timer);
        reject(error);
      });
      process.once("exit", (code) => {
        clearTimeout(timer);
        reject(new Error(`owner exited before reply: ${code}`));
      });
      lines.once("line", (line) => {
        clearTimeout(timer);
        lines.close();
        done(JSON.parse(line));
      });
    },
  );
  return { process, result };
}
async function finish(child: ChildProcess, crash = false) {
  if (child.exitCode !== null || child.signalCode !== null) return;
  const ended = new Promise<void>((done) => child.once("exit", () => done()));
  if (crash) child.kill("SIGKILL");
  else child.stdin?.end("stop");
  await ended;
}
async function fixture(run: (root: string) => Promise<void>) {
  const root = await mkdtemp(join(tmpdir(), "ownership-"));
  try {
    await run(root);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
}

it.each([1, 2, 3])("elects exactly one real controller across endpoints at concurrent cold start (%i)", async () => {
  await fixture(async (root) => {
    const owners = await Promise.all(
      Array.from({ length: 4 }, (_, index) => child(root, "manager", join(root, `m${index}.sock`))),
    );
    try {
      expect(owners.filter((owner) => owner.result.result === "owned")).toHaveLength(1);
      expect(owners.filter((owner) => owner.result.result === "blocked")).toHaveLength(3);
      const winner = owners.find((owner) => owner.result.result === "owned");
      expect((await child(root, "manager", join(root, "contender.sock"))).result.result).toBe("blocked");
      expect(winner?.process.exitCode).toBeNull();
    } finally {
      await Promise.all(owners.map((owner) => finish(owner.process)));
    }
    const next = await child(root, "manager", join(root, "next.sock"));
    try {
      expect(next.result.result).toBe("owned");
    } finally {
      await finish(next.process);
    }
  });
});
it("protects a namespace across processes and fences closed resource handles", async () => {
  await fixture(async (root) => {
    const owner = await child(root, "resource");
    try {
      expect(owner.result.result).toBe("owned");
      const registry = join(root, "factories/stable/main/registry.json");
      const before = await readFile(registry, "utf8");
      await expect(Resources.open({ channel: channel("stable"), root, namespace: namespace("main") })).rejects.toThrow(
        "held",
      );
      expect(await readFile(registry, "utf8")).toBe(before);
      expect((await stat(owner.result.staging)).isDirectory()).toBe(true);
    } finally {
      await finish(owner.process);
    }
    const first = await Resources.open({ channel: channel("stable"), root, namespace: namespace("main") });
    await first.close();
    const next = await Resources.open({ channel: channel("stable"), root, namespace: namespace("main") });
    try {
      await expect(first.grant({ kind: "port", name: "late", owner: "late", scope: "attempt" })).rejects.toThrow(
        "closed",
      );
      await first.close();
      expect(() => first.snapshot()).toThrow("closed");
      expect(await next.grant({ kind: "port", name: "next", owner: "next", scope: "attempt" })).toMatchObject({
        kind: "port",
      });
    } finally {
      await next.close();
    }
  });
});
it.each(["manager", "resource"])("keeps interrupted %s authority and resources after a real SIGKILL", async (mode) => {
  await fixture(async (root) => {
    const owner = await child(root, mode);
    expect(owner.result.result).toBe("owned");
    const registry = join(root, "factories/stable/main/registry.json");
    const before = await readFile(registry, "utf8");
    await finish(owner.process, true);
    const reopen =
      mode === "manager"
        ? serve(join(root, "new.sock"), { root: root })
        : Resources.open({ channel: channel("stable"), root, namespace: namespace("main") });
    await expect(reopen).rejects.toThrow("interrupted; recovery required");
    expect(await readFile(registry, "utf8")).toBe(before);
    expect((await stat(owner.result.staging)).isDirectory()).toBe(true);
    const address = new URL(owner.result.port);
    const probe = createServer();
    await new Promise<void>((done, reject) => {
      probe.once("error", reject);
      probe.listen(Number(address.port), address.hostname, done);
    });
    await new Promise<void>((done) => probe.close(() => done()));
  });
});
it.each(["", "invalid sqlite"])("rejects partial/corrupt authority without changing its bytes: %j", async (bytes) => {
  await fixture(async (root) => {
    const file = join(root, "manager.sqlite");
    await writeFile(file, bytes);
    await expect(serve(join(root, "m.sock"))).rejects.toThrow("recovery required");
    expect(await readFile(file, "utf8")).toBe(bytes);
  });
});
it("rejects a missing or malformed committed record instead of interpreting it as absent", async () => {
  await fixture(async (root) => {
    const manager = await serve(join(root, "m.sock"));
    await manager.close();
    const db = new DatabaseSync(join(root, "manager.sqlite"));
    db.prepare("UPDATE authority SET record=? WHERE id=1").run('{"schema":1}');
    db.close();
    await expect(serve(join(root, "m.sock"))).rejects.toThrow("recovery required");
  });
});
it("retains uncertainty when a committed registry disappears and retries failed persistence accurately", async () => {
  await fixture(async (root) => {
    const host = await Resources.open({ channel: channel("stable"), root, namespace: namespace("main") });
    try {
      const grant = await host.grant({ kind: "staging", name: "probe", owner: "attempt", scope: "attempt" });
      const pending = join(root, "factories/stable/main/registry.tmp");
      await mkdir(pending);
      await expect(host.release(grant.lease)).rejects.toThrow();
      expect(host.snapshot().grants).toContainEqual(grant);
      await rm(pending, { recursive: true });
      await host.release(grant.lease);
      expect(host.snapshot().grants).toEqual([]);
    } finally {
      await host.close();
    }
    await rm(join(root, "factories/stable/main/registry.json"));
    await expect(Resources.open({ channel: channel("stable"), root, namespace: namespace("main") })).rejects.toThrow(
      "registry missing",
    );
  });
});
it.runIf(process.platform !== "win32")(
  "canonicalizes root aliases and rejects linked namespace directories",
  async () => {
    await fixture(async (root) => {
      const alias = join(root, "alias");
      await symlink(root, alias, "dir");
      const manager = await serve(join(root, "m.sock"));
      try {
        await expect(serve(join(root, "other.sock"), { root: alias })).rejects.toThrow("held");
      } finally {
        await manager.close();
      }
      const outside = await mkdtemp(join(tmpdir(), "outside-resource-"));
      try {
        await symlink(outside, join(root, "factories"), "dir");
        await expect(
          Resources.open({ channel: channel("stable"), root, namespace: namespace("main") }),
        ).rejects.toThrow("regular directory");
        await expect(stat(join(outside, "main"))).rejects.toMatchObject({ code: "ENOENT" });
      } finally {
        await rm(outside, { recursive: true, force: true });
      }
    });
  },
);
