import { expect, it } from "vitest";
import { run } from "@";

it("exposes local development help and refuses unknown, duplicate or incomplete control flags", async () => {
  let output = "";
  const io = {
    stdout: (s: string) => {
      output += s;
    },
    stderr: (s: string) => {
      output += s;
    },
  };
  expect(await run(["dev", "--help"], process.cwd(), io)).toBe(0);
  expect(output).toContain("pnpm exec");
  for (const args of [
    ["dev"],
    ["dev", "launch"],
    ["dev", "start", "--carrier"],
    ["dev", "start", "--carrier=standalone", "--carrier", "electron"],
    ["dev", "stop", "--watch=false"],
    ["dev", "start", "--watch=maybe"],
    ["dev", "status", "--global"],
  ]) {
    output = "";
    expect(await run(args, process.cwd(), io)).toBe(2);
    expect(JSON.parse(output)).toMatchObject({ ok: false });
  }
});
