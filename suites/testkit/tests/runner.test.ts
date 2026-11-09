import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

import { afterEach, describe, expect, it } from "vitest";

import { parse, run } from "@";

const root = fileURLToPath(new URL("../../..", import.meta.url));
const paths: string[] = [];

afterEach(async () => {
  await Promise.all(paths.splice(0).map((path) => rm(path, { force: true, recursive: true })));
});

describe("qualification runner", () => {
  it("records executable local evidence", async () => {
    const directory = await mkdtemp(join(tmpdir(), "testkit-"));
    paths.push(directory);
    const output = join(directory, "report.json");
    const report = await run({ output, root, chromium: true });

    expect(report.scenarios.filter((item) => item.status === "failed")).toEqual([]);
    expect(report.result).toBe("partial");
    expect(report.scenarios.find((item) => item.id === "PUB-10")?.status).toBe("passed");
    expect(report.scenarios.find((item) => item.id === "PKG-10")?.status).toBe("unqualified");
    expect(parse(JSON.parse(await readFile(output, "utf8")))).toEqual(report);
  }, 15000);
});
