import { randomUUID } from "node:crypto";
import { chmod, mkdir, mkdtemp, readFile, rename, symlink, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { DatabaseSync } from "node:sqlite";
import { fileURLToPath } from "node:url";
import { canonical, channel, namespace } from "@odsuite/protocol";
import { bundle, bundleEntries } from "@odsuite/release";
import { expect, it } from "vitest";
import { type Input, type Options, open } from "@";
import { hash } from "../src/archive.js";

async function fixture() {
  const base = fileURLToPath(new URL("../../../.artifacts/installer/", import.meta.url));
  await mkdir(base, { recursive: true });
  const root = await mkdtemp(join(base, "conflict-")),
    home = join(root, "home"),
    data = join(root, "runtime"),
    dir = join(root, "source");
  await mkdir(dir);
  const options: Options = {
    home,
    product: "io.test.motion",
    scope: { channel: channel("stable"), namespace: namespace("primary") },
  };
  const archive = async (version = "1.0.0") => {
    await writeFile(join(dir, "main.mjs"), "export default true;");
    await writeFile(
      join(dir, "runtime.json"),
      JSON.stringify({ carrier: "codexplugin", version, channel: "stable", files: ["main.mjs", "runtime.json"] }),
    );
    const bytes = await bundle(dir);
    return { bytes, sha256: hash(bytes) };
  };
  return { root, home, data, options, archive };
}
it("rejects an interrupted older selection after another committed intent without rewinding", async () => {
  const f = await fixture(),
    requestId = randomUUID();
  let fail = true;
  const session = await open({
    ...f.options,
    onCheckpoint: async (event) => {
      if (event.requestId === requestId && event.phase === "installed" && fail) {
        fail = false;
        throw Error("retained installed intent");
      }
    },
  });
  try {
    const input = { data: f.data, requestId, source: await f.archive() };
    await expect(session.install(input)).rejects.toThrow("retained installed intent");
    const newer = await session.install({ data: f.data, requestId: randomUUID(), source: await f.archive("1.1.0") });
    await expect(session.install(input)).rejects.toMatchObject({ code: "conflict" });
    expect(await session.read("codexplugin")).toEqual(newer);
  } finally {
    await session.close();
  }
}, 15000);
it("replays an atomically committed selection receipt after lost completion and a later selection", async () => {
  const f = await fixture(),
    requestId = randomUUID();
  let once = true;
  const session = await open({
    ...f.options,
    onCheckpoint: async (event) => {
      if (event.requestId === requestId && event.phase === "selected" && once) {
        once = false;
        throw Error("response lost after commit");
      }
    },
  });
  try {
    const input = { data: f.data, requestId, source: await f.archive() };
    await expect(session.install(input)).rejects.toThrow("response lost after commit");
    const original = await session.read("codexplugin"),
      newer = await session.install({ data: f.data, requestId: randomUUID(), source: await f.archive("1.1.0") });
    expect(
      await session.install({ ...input, source: { sha256: input.source.sha256, bytes: new Uint8Array() } }),
    ).toEqual(original);
    expect(await session.read("codexplugin")).toEqual(newer);
  } finally {
    await session.close();
  }
}, 15000);
it("does not follow an installed version symlink even when it points to the original verified bytes", async () => {
  const f = await fixture(),
    input = { data: f.data, requestId: randomUUID(), source: await f.archive() },
    first = await open(f.options);
  const receipt = await first.install(input);
  await first.close();
  const retained = join(f.root, "retained-version");
  await chmod(receipt.path, 0o700);
  await rename(receipt.path, retained);
  await symlink(retained, receipt.path, "dir");
  const cold = await open(f.options);
  try {
    await expect(cold.read("codexplugin")).rejects.toMatchObject({ code: "integrity" });
    await expect(cold.install(input)).rejects.toMatchObject({ code: "integrity" });
    expect(await readFile(join(retained, "main.mjs"), "utf8")).toBe("export default true;");
  } finally {
    await cold.close();
  }
}, 15000);
it("first-home product claims are atomic and reject a competing product", async () => {
  const f = await fixture(),
    other = { ...f.options, product: "io.other.product" },
    results = await Promise.allSettled([open(f.options), open(other)]);
  try {
    expect(results.filter((value) => value.status === "fulfilled")).toHaveLength(1);
    expect(results.filter((value) => value.status === "rejected")).toHaveLength(1);
    const policy = JSON.parse(await readFile(join(f.home, "product.json"), "utf8"));
    expect([f.options.product, other.product]).toContain(policy.product);
  } finally {
    for (const result of results) if (result.status === "fulfilled") await result.value.close();
  }
}, 15000);
it("rejects noncanonical, case-colliding and channel-mismatched sources before selection", async () => {
  const f = await fixture(),
    session = await open(f.options),
    valid = await f.archive();
  try {
    const entries = bundleEntries(valid.bytes),
      collision = Buffer.from(
        canonical({
          schema: 1,
          files: [...entries, { path: "MAIN.mjs", mode: 420, bytes: Buffer.from("collision").toString("base64") }].sort(
            (a, b) => (a.path < b.path ? -1 : 1),
          ),
        }),
      );
    for (const bytes of [collision, Buffer.from(` ${Buffer.from(valid.bytes).toString()}`)])
      await expect(
        session.install({ data: f.data, requestId: randomUUID(), source: { bytes, sha256: hash(bytes) } }),
      ).rejects.toMatchObject({ code: "invalid" });
    expect(await session.read("codexplugin")).toBeUndefined();
  } finally {
    await session.close();
  }
  const dev = await open({ ...f.options, scope: { channel: channel("dev"), namespace: namespace("primary") } });
  try {
    await expect(dev.install({ data: f.data, requestId: randomUUID(), source: valid })).rejects.toMatchObject({
      code: "invalid",
    });
  } finally {
    await dev.close();
  }
}, 15000);
it("pins the accepted intent and verified bytes against caller mutation during asynchronous staging", async () => {
  const f = await fixture(),
    source = await f.archive(),
    requestId = randomUUID();
  const input: Input = { data: f.data, requestId, source: { ...source, bytes: Buffer.from(source.bytes) } };
  const session = await open({
    ...f.options,
    onCheckpoint: async (event) => {
      if (event.phase === "intent") {
        input.requestId = "../../escape";
        input.data = f.root;
        input.source.sha256 = "0".repeat(64);
        input.source.bytes.fill(0);
      }
    },
  });
  try {
    const result = await session.install(input);
    expect(result.requestId).toBe(requestId);
    expect(result.digest).toBe(`sha256:${source.sha256}`);
    expect(await readFile(join(result.path, "main.mjs"), "utf8")).toBe("export default true;");
  } finally {
    await session.close();
  }
}, 15000);
it("rejects a corrupt receipt substituted from another verified version before reading source bytes", async () => {
  const f = await fixture(),
    session = await open(f.options),
    input = { data: f.data, requestId: randomUUID(), source: await f.archive() };
  try {
    await session.install(input);
    const other = await session.install({ data: f.data, requestId: randomUUID(), source: await f.archive("1.1.0") });
    const database = new DatabaseSync(join(session.context.roots.data, "installations.sqlite"));
    try {
      database
        .prepare("UPDATE receipts SET result=? WHERE id=?")
        .run(JSON.stringify({ ...other, requestId: input.requestId }), input.requestId);
    } finally {
      database.close();
    }
    await expect(
      session.install({ ...input, source: { sha256: input.source.sha256, bytes: new Uint8Array() } }),
    ).rejects.toMatchObject({ code: "integrity" });
    expect(await session.read("codexplugin")).toEqual(other);
  } finally {
    await session.close();
  }
}, 15000);
