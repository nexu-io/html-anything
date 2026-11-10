import { execFile } from "node:child_process";
import { mkdir, mkdtemp, readFile, realpath, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { promisify } from "node:util";
import { afterEach, expect, it } from "vitest";
import {
  build,
  channelRoot,
  check,
  configuration,
  loadBuild,
  loadPackage,
  pack,
  selectedVersion,
  validateWorkflows,
} from "@";
import { revision } from "@/files.js";

const roots: string[] = [],
  execute = promisify(execFile);
afterEach(async () => {
  await Promise.all(roots.splice(0).map((p) => rm(p, { recursive: true, force: true })));
});
async function fixture() {
  const root = await realpath(await mkdtemp(join(tmpdir(), "pipeline-node-")));
  roots.push(root);
  await writeFile(join(root, "package.json"), JSON.stringify({ private: true, packageManager: "pnpm@11.13.0" }));
  await writeFile(join(root, "pnpm-workspace.yaml"), "packages:\n  - carriers/*\n");
  await writeFile(join(root, ".gitignore"), "node_modules/\n.artifacts/\n.state/\ndist/\npnpm-lock.yaml\n");
  await writeFile(
    join(root, "odsuite.yaml"),
    `schemaVersion: 1
runtime:
  appid: io.openmotion.fixture
  name: Fixture
  scheme: fixture
  version: 1.2.3
  channel: stable
  namespace: fixture
pipeline:
  carriers:
    standalone: carriers/standalone/dist
    codexplugin: carriers/codexplugin/dist
`,
  );
  for (const name of ["standalone", "codexplugin"]) {
    const dir = join(root, "carriers", name);
    await mkdir(dir, { recursive: true });
    await writeFile(
      join(dir, "package.json"),
      JSON.stringify({
        name: `fixture-${name}`,
        scripts: {
          build: "node build.mjs",
          test: "node -e \"if(process.env.ODSUITE_BUILD!==JSON.parse(require('node:fs').readFileSync('dist/runtime.json')).version)process.exit(1)\"",
        },
      }),
    );
    await writeFile(
      join(dir, "build.mjs"),
      `import{mkdir,writeFile}from'node:fs/promises';import{dirname}from'node:path';(async()=>{for(const file of ['main.mjs','LICENSE','NOTICE','web/index.html','daemon/main.mjs','render/worker.mjs']){await mkdir(dirname('dist/'+file),{recursive:true});await writeFile('dist/'+file,process.env.ODSUITE_BUILD)}await writeFile('dist/runtime.json',JSON.stringify({files:['main.mjs','LICENSE','NOTICE','web/index.html','daemon/main.mjs','render/worker.mjs'],carrier:'${name}',version:process.env.ODSUITE_BUILD,channel:process.env.ODSUITE_BUILD.includes('-')?process.env.ODSUITE_BUILD.split('-')[1].split('.')[0]:'stable'}));if('${name}'==='codexplugin'){await mkdir('dist/.codex-plugin',{recursive:true});await writeFile('dist/.codex-plugin/plugin.json',JSON.stringify({version:process.env.ODSUITE_BUILD}))}})();`,
    );
  }
  for (const args of [
    ["init", "-q"],
    ["add", "."],
    ["-c", "user.name=Fixture", "-c", "user.email=fixture@example.test", "commit", "-qm", "fixture"],
  ])
    await execute("git", args, { cwd: root });
  return root;
}
it("resolves version without a product checkout and rejects channel mismatch", async () => {
  expect(await selectedVersion({ root: "/missing", channel: "beta", base: "1.2.3", number: 4 })).toEqual({
    channel: "beta",
    version: "1.2.3-beta.4",
  });
  await expect(selectedVersion({ root: "/missing", channel: "beta", version: "1.2.3" })).rejects.toThrow("mismatch");
});
it("builds both carrier closures with one version and rejects modified materialized content", async () => {
  const root = await fixture(),
    before = await readFile(join(root, "odsuite.yaml"));
  const result = await build({ root, channel: "beta", number: 4 });
  expect(result.version).toBe("1.2.3-beta.4");
  for (const path of Object.values(result.carriers))
    expect(await readFile(join(root, path, "main.mjs"), "utf8")).toBe(result.version);
  expect(await loadBuild(root, "beta")).toEqual(result);
  expect(await readFile(join(root, "odsuite.yaml"))).toEqual(before);
  expect((await check(root, "beta", "tests")).result).toBe("passed");
  const packed = await pack(root, "beta");
  expect(await pack(root, "beta")).toEqual(packed);
  expect(Object.keys(packed.packages).sort()).toEqual(["codexplugin", "standalone"]);
  expect((await check(root, "beta", "artifacts")).result).toBe("passed");
  await writeFile(join(root, packed.packages.codexplugin!.path), "tampered");
  await expect(loadPackage(root, "beta")).rejects.toThrow();
  await expect(check(root, "beta", "artifacts")).rejects.toThrow();
  expect(JSON.parse(await readFile(join(channelRoot(root, "beta"), "checks/artifacts.json"), "utf8")).result).toBe(
    "failed",
  );
  await writeFile(join(root, result.carriers.standalone!, "main.mjs"), "tampered");
  await expect(loadBuild(root, "beta")).rejects.toThrow("fingerprint");
}, 30000);
it("invalidates old evidence on build failure and rejects escaped carrier outputs", async () => {
  const root = await fixture();
  await build({ root, channel: "stable" });
  await writeFile(join(root, "carriers/standalone/build.mjs"), "throw Error('injected');");
  await expect(build({ root, channel: "stable" })).rejects.toThrow();
  await expect(loadBuild(root, "stable")).rejects.toThrow();
  const file = join(root, "odsuite.yaml"),
    original = await readFile(file, "utf8");
  await writeFile(file, original.replace("carriers/standalone/dist", "../outside"));
  await expect(configuration(root, "stable")).rejects.toThrow("bounded");
}, 30000);
it("keeps channel workflows thin and does not attribute an enclosing checkout to nested consumers", async () => {
  const root = await fixture(),
    directory = join(root, ".github/workflows");
  await mkdir(directory, { recursive: true });
  const path = join(directory, "stable.release.yml");
  await writeFile(
    path,
    "jobs:\n  release:\n    steps:\n      - run: pnpm exec odsuite check --channel stable --gate tests\n",
  );
  await validateWorkflows(root);
  await writeFile(
    path,
    "jobs:\n  release:\n    steps:\n      - run: pnpm exec odsuite build --channel stable && echo hidden\n",
  );
  await expect(validateWorkflows(root)).rejects.toThrow("short");
  const nested = join(root, ".artifacts/consumer");
  await mkdir(nested, { recursive: true });
  expect(await revision(nested)).toBeNull();
});

it("rejects builders that ignore the selected version or swap carrier identity", async () => {
  const root = await fixture(),
    file = join(root, "carriers/standalone/build.mjs"),
    original = await readFile(file, "utf8");
  await writeFile(file, original.replaceAll("process.env.ODSUITE_BUILD", "'1.2.3'"));
  await expect(build({ root, channel: "beta", number: 2 })).rejects.toThrow("runtime identity mismatch");
  await expect(loadBuild(root, "beta")).rejects.toThrow();
  await writeFile(file, original.replace("carrier:'standalone'", "carrier:'codexplugin'"));
  await expect(build({ root, channel: "stable" })).rejects.toThrow();
}, 30000);

it("invalidates old quality evidence and refuses to label modified source as the built commit", async () => {
  const root = await fixture();
  await build({ root, channel: "stable" });
  expect((await check(root, "stable", "tests")).result).toBe("passed");
  const path = join(channelRoot(root, "stable"), "checks/tests.json");
  await writeFile(join(root, "carriers/standalone/build.mjs"), "throw Error('changed');");
  await expect(check(root, "stable", "tests")).rejects.toThrow("clean build commit");
  expect(JSON.parse(await readFile(path, "utf8")).result).toBe("failed");
  await rm(join(root, "carriers/standalone/dist/main.mjs"));
  await expect(check(root, "stable", "tests")).rejects.toThrow();
  // The immutable staged build is intact, but source gates still fail on dirty source.
  await rm(join(root, (await loadBuild(root, "stable")).carriers.standalone!, "main.mjs"));
  await expect(check(root, "stable", "tests")).rejects.toThrow();
  await expect(readFile(path)).rejects.toThrow();
}, 30000);
