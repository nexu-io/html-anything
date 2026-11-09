import assert from "node:assert/strict";
import { mkdir, mkdtemp, realpath, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { build } from "plist";
import { it } from "vitest";
import { location, open } from "../src/domain.js";

it("closes and reopens the shared installation authority without retaining database locks", async () => {
  const root = await realpath(await mkdtemp(join(tmpdir(), "installer-domain-"))),
    target = join(root, "probe.app"),
    product = "io.openmotion.probe";
  await mkdir(join(target, "Contents/MacOS"), { recursive: true });
  await writeFile(
    join(target, "Contents/Info.plist"),
    build({ CFBundleIdentifier: product, CFBundleShortVersionString: "0.1.0", CFBundleExecutable: "probe" }),
  );
  await writeFile(join(target, "Contents/MacOS/probe"), "executable");
  for (let i = 0; i < 3; i++) {
    const domain = await open(location(target, product, "stable"), target, product, "stable");
    assert.equal((await domain.factory.resources()).grants.find((g) => g.kind === "installation")?.value, target);
    await assert.rejects(open(domain.root, target, product, "stable"), /held/);
    await domain.close();
  }
});
