import { randomUUID } from "node:crypto";
import { chmod, mkdir, mkdtemp, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { channel, namespace } from "@odsuite/protocol";
import { bundle } from "@odsuite/release";
import { observeProcesses, readDirectory } from "@odsuite/sidecar";
import { expect, it } from "vitest";
import { open, type Session } from "@";
import { hash } from "../src/archive.js";

async function fixture() {
  const base = fileURLToPath(new URL("../../../.artifacts/installer/", import.meta.url));
  await mkdir(base, { recursive: true });
  const root = await mkdtemp(join(base, "install-")),
    home = join(root, "home"),
    data = join(root, "runtime"),
    product = "io.test.motion",
    scope = { channel: channel("stable"), namespace: namespace("primary") };
  const archive = async (version = "1.0.0", carrier = "codexplugin", content = "export const value=1;") => {
    const source = await mkdtemp(join(root, "source-"));
    await writeFile(join(source, "main.mjs"), content);
    await writeFile(join(source, "NOTICE"), "Apache-2.0 fixture");
    await writeFile(
      join(source, "runtime.json"),
      JSON.stringify({ carrier, version, channel: "stable", files: ["main.mjs", "NOTICE", "runtime.json"] }),
    );
    const bytes = await bundle(source);
    return { bytes, sha256: hash(bytes) };
  };
  return { root, home, data, product, scope, archive, options: { home, product, scope } };
}
it("installs immutable closures for both carriers in one sidecar factory and replays original receipts after later selection", async () => {
  const f = await fixture(),
    session = await open(f.options),
    source = await f.archive(),
    command = { data: f.data, requestId: randomUUID(), source };
  try {
    expect(session.context.identity.service).toBe("installer");
    const result = await session.install(command);
    expect(result).toMatchObject({
      requestId: command.requestId,
      product: f.product,
      carrier: "codexplugin",
      version: "1.0.0",
      digest: `sha256:${source.sha256}`,
      data: f.data,
      channel: "stable",
      namespace: "primary",
    });
    expect(await readFile(join(result.path, "main.mjs"), "utf8")).toBe("export const value=1;");
    expect(await session.read("codexplugin")).toEqual(result);
    expect(await session.install({ ...command, source: { sha256: source.sha256, bytes: new Uint8Array() } })).toEqual(
      result,
    );
    const next = await session.install({ data: f.data, requestId: randomUUID(), source: await f.archive("1.1.0") });
    expect(await session.read("codexplugin")).toEqual(next);
    expect(await session.install(command)).toEqual(result);
    expect(await session.read("codexplugin")).toEqual(next);
    const standalone = await session.install({
      data: f.data,
      requestId: randomUUID(),
      source: await f.archive("1.1.0", "standalone"),
    });
    expect(standalone.carrier).toBe("standalone");
    expect((await session.factory.resources()).grants.filter((grant) => grant.kind === "installation")).toHaveLength(1);
    expect((await session.factory.resources()).grants.find((grant) => grant.kind === "installation")?.value).toBe(
      join(f.home, "applications", f.product, "stable", "primary"),
    );
    await expect(session.install({ ...command, data: join(f.root, "otherdata") })).rejects.toMatchObject({
      code: "idempotency",
    });
    await expect(
      session.install({ ...command, source: await f.archive("1.0.0", "codexplugin", "changed") }),
    ).rejects.toMatchObject({ code: "idempotency" });
    await expect(
      session.install({
        data: f.data,
        requestId: randomUUID(),
        source: await f.archive("1.0.0", "codexplugin", "changed"),
      }),
    ).rejects.toMatchObject({ code: "conflict" });
  } finally {
    await session.close();
  }
  expect((await readDirectory(join(f.home, "authority", f.product))).manager.phase).toBe("closed");
  expect(await observeProcesses(join(f.home, "authority", f.product))).toEqual([]);
  const cold = await open(f.options);
  try {
    expect((await cold.read("codexplugin"))?.version).toBe("1.1.0");
  } finally {
    await cold.close();
  }
}, 15000);
it("rejects source corruption, runtime overlap and unowned or conflicting homes without installing", async () => {
  const f = await fixture(),
    session = await open(f.options),
    source = await f.archive();
  try {
    await expect(
      session.install({ data: f.data, requestId: randomUUID(), source: { ...source, bytes: Buffer.from("wrong") } }),
    ).rejects.toMatchObject({ code: "invalid" });
    for (const data of [f.home, join(f.home, "authority", "runtime"), join(f.home, "applications", "runtime")])
      await expect(session.install({ data, requestId: randomUUID(), source })).rejects.toMatchObject({
        code: "invalid",
      });
    expect(await session.read("codexplugin")).toBeUndefined();
    await expect(open(f.options)).rejects.toThrow("held");
    await expect(open({ ...f.options, product: "io.other.product" })).rejects.toMatchObject({ code: "conflict" });
  } finally {
    await session.close();
  }
  const unowned = join(f.root, "unowned");
  await mkdir(unowned);
  await writeFile(join(unowned, "keep.txt"), "foreign");
  await expect(open({ ...f.options, home: unowned })).rejects.toMatchObject({ code: "conflict" });
  expect(await readFile(join(unowned, "keep.txt"), "utf8")).toBe("foreign");
}, 15000);
it("detects corrupted immutable installation repeatedly without overwriting it or losing the receipt", async () => {
  const f = await fixture();
  let session: Session = await open(f.options);
  const input = { data: f.data, requestId: randomUUID(), source: await f.archive() };
  try {
    const value = await session.install(input);
    await session.close();
    await chmod(join(value.path, "main.mjs"), 0o644);
    await writeFile(join(value.path, "main.mjs"), "corruption");
    session = await open(f.options);
    await expect(session.read("codexplugin")).rejects.toMatchObject({ code: "integrity" });
    await expect(session.install(input)).rejects.toMatchObject({ code: "integrity" });
    expect(await readFile(join(value.path, "main.mjs"), "utf8")).toBe("corruption");
  } finally {
    await session.close();
  }
}, 15000);
