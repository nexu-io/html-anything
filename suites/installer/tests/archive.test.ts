import assert from "node:assert/strict";
import { mkdir, mkdtemp, readFile, realpath, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { build, buildBinary } from "plist";
import { it } from "vitest";
import { extract } from "../src/archive.js";
import { bundle, hash } from "../src/files.js";

function zip(entries: { name: string; body?: string; mode?: number }[]) {
  const chunks: Buffer[] = [],
    central: Buffer[] = [];
  let offset = 0;
  for (const entry of entries) {
    const name = Buffer.from(entry.name),
      body = Buffer.from(entry.body ?? ""),
      local = Buffer.alloc(30),
      head = Buffer.alloc(46);
    local.writeUInt32LE(0x04034b50, 0);
    local.writeUInt16LE(20, 4);
    local.writeUInt32LE(body.length, 18);
    local.writeUInt32LE(body.length, 22);
    local.writeUInt16LE(name.length, 26);
    head.writeUInt32LE(0x02014b50, 0);
    head.writeUInt16LE(0x0314, 4);
    head.writeUInt16LE(20, 6);
    head.writeUInt32LE(body.length, 20);
    head.writeUInt32LE(body.length, 24);
    head.writeUInt16LE(name.length, 28);
    head.writeUInt32LE(((entry.mode ?? 0o100644) << 16) >>> 0, 38);
    head.writeUInt32LE(offset, 42);
    chunks.push(local, name, body);
    central.push(head, name);
    offset += local.length + name.length + body.length;
  }
  const end = Buffer.alloc(22),
    body = Buffer.concat(central);
  end.writeUInt32LE(0x06054b50, 0);
  end.writeUInt16LE(entries.length, 8);
  end.writeUInt16LE(entries.length, 10);
  end.writeUInt32LE(body.length, 12);
  end.writeUInt32LE(offset, 16);
  return Buffer.concat([...chunks, body, end]);
}
it("materializes files and bounded internal links while preserving executability", async () => {
  const root = await realpath(await mkdtemp(join(tmpdir(), "installer-zip-")));
  const app = await extract(
    zip([
      { name: "probe.app/Contents/hello", body: "hello", mode: 0o100755 },
      { name: "probe.app/link", body: "Contents/hello", mode: 0o120777 },
    ]),
    join(root, "stage"),
    "probe.app",
  );
  assert.equal(await readFile(join(app, "link"), "utf8"), "hello");
}, 10000);
it("rejects traversal, external links, duplicate names and privileged/special entries before escaping", async () => {
  const cases = [
    [{ name: "probe.app/../../escape", body: "bad" }],
    [{ name: "probe.app/link", body: "../../escape", mode: 0o120777 }],
    [
      { name: "probe.app/x", body: "a" },
      { name: "probe.app/x", body: "b" },
    ],
    [{ name: "probe.app/x", body: "bad", mode: 0o104755 }],
    [{ name: "probe.app/x", body: "bad", mode: 0o020666 }],
  ];
  for (const entries of cases) {
    const root = await realpath(await mkdtemp(join(tmpdir(), "installer-badzip-")));
    await assert.rejects(extract(zip(entries), join(root, "stage"), "probe.app"));
    await assert.rejects(readFile(join(root, "escape")), /ENOENT/);
  }
});

it("reads XML and binary bundle metadata and hashes raw ASAR bytes", async () => {
  const root = await realpath(await mkdtemp(join(tmpdir(), "installer-bundle-")));
  await mkdir(join(root, "Contents/MacOS"), { recursive: true });
  await mkdir(join(root, "Contents/Resources"));
  await writeFile(join(root, "Contents/MacOS/probe"), "executable");
  const info = {
    CFBundleIdentifier: "io.openmotion.probe",
    CFBundleShortVersionString: "0.2.0",
    CFBundleExecutable: "probe",
  };
  for (const bytes of [build(info), buildBinary(info)]) {
    await writeFile(join(root, "Contents/Info.plist"), bytes);
    assert.equal((await bundle(root, { appid: "io.openmotion.probe", version: "0.2.0" })).version, "0.2.0");
    await assert.rejects(bundle(root, { appid: "io.openmotion.probe", version: "0.1.0" }), /mismatch/);
  }
  await writeFile(join(root, "Contents/Resources/app.asar"), Buffer.from([0, 1, 2, 3]));
  const before = await hash(root);
  await writeFile(join(root, "Contents/Resources/app.asar"), Buffer.from([0, 1, 2, 4]));
  assert.notEqual(await hash(root), before);
});
