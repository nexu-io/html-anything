import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, expect, it } from "vitest";
import { alive, runElectron } from "@";

const roots: string[] = [];
afterEach(async () => {
  await Promise.all(roots.splice(0).map((root) => rm(root, { recursive: true, force: true })));
});
async function fixture() {
  const root = await mkdtemp(join(tmpdir(), "automation-"));
  roots.push(root);
  const source = join(root, "host.cjs"),
    receipt = join(root, "ready.json");
  await writeFile(
    source,
    `const fs=require('node:fs');const receipt=process.argv[2];
if(process.env.ODSUITE_AUTOMATION!=='1')throw Error('automation missing');
if(process.env.ODSUITE_RECEIPT!==receipt)throw Error('receipt routing missing');
fs.writeFileSync(receipt+'.env',JSON.stringify({probe:process.env.ODSUITE_PROBE,automation:process.env.ODSUITE_AUTOMATION}));
if(process.argv[3]==='failure'){console.error('expected startup failure');process.exit(1)}
fs.writeFileSync(receipt,JSON.stringify({pid:process.pid,automation:{enabled:true,policy:process.platform==='darwin'?'accessory':'default',shown:false,focused:false,visible:false,focusable:false}}));
if(process.env.ODSUITE_PROBE==='1')fs.writeFileSync(receipt+'.stop.json',JSON.stringify({status:'stopped',survivors:[]}));
else setInterval(()=>{},1000);`,
  );
  return { source, receipt };
}
it("forces background flags for both normal exit and long-running kill modes", async () => {
  const { source, receipt } = await fixture();
  for (const mode of ["exit", "kill"] as const) {
    const result = await runElectron({
      name: mode,
      executable: process.execPath,
      args: [source, receipt],
      receipt,
      mode,
      env: { ODSUITE_AUTOMATION: "0", ODSUITE_PROBE: mode === "kill" ? "1" : "0" },
    });
    expect(JSON.parse(await readFile(`${receipt}.env`, "utf8"))).toEqual({
      automation: "1",
      probe: mode === "kill" ? "0" : "1",
    });
    expect(alive(result.pid)).toBe(false);
    expect(result.exit.signal).toBe(mode === "kill" ? "SIGKILL" : null);
  }
});
it("checks the expected startup failure and handles an unavailable executable without leaking a process", async () => {
  const { source, receipt } = await fixture();
  await expect(
    runElectron({
      name: "failure",
      executable: process.execPath,
      args: [source, receipt, "failure"],
      receipt,
      mode: "failure",
      message: "expected startup failure",
    }),
  ).resolves.toMatchObject({ exit: { code: 1 } });
  await expect(
    runElectron({ name: "missing", executable: "/missing/odsuite-host", receipt, mode: "exit" }),
  ).rejects.toThrow();
});
