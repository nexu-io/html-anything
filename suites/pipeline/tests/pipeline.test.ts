import { execFile } from "node:child_process";
import { mkdir, mkdtemp, readFile, realpath, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, relative } from "node:path";
import { promisify } from "node:util";
import { target } from "@odsuite/pack";
import { afterEach, expect, it } from "vitest";
import {
  build,
  channelRoot,
  check,
  configuration,
  loadBuild,
  type PackReceipt,
  publish,
  selectedVersion,
  validateWorkflows,
} from "@";
import { hash, inventory, json, pnpmCommand, revision } from "@/files.js";

const roots: string[] = [],
  exec = promisify(execFile);
it("resolves the pnpm JavaScript entry behind Windows cmd shims without a shell", async () => {
  const root = await realpath(await mkdtemp(join(tmpdir(), "pipeline-pnpm-")));
  roots.push(root);
  const bin = join(root, "node_modules/.bin"),
    pkg = join(root, "node_modules/pnpm");
  await mkdir(bin, { recursive: true });
  await mkdir(join(pkg, "bin"), { recursive: true });
  await writeFile(join(bin, "pnpm.cmd"), "@echo off\n");
  await writeFile(
    join(pkg, "package.json"),
    JSON.stringify({
      name: "pnpm",
      exports: { ".": "./package.json" },
      bin: { pnpm: "bin/pnpm.cjs" },
    }),
  );
  await writeFile(join(pkg, "bin/pnpm.cjs"), "process.stdout.write(JSON.stringify(process.argv.slice(2)));");
  const command = await pnpmCommand({ Path: bin }, "win32");
  expect(command.file).toBe(process.execPath);
  expect(
    JSON.parse((await exec(command.file, [...command.prefix, "space value", "a&b", "$(literal)"])).stdout),
  ).toEqual(["space value", "a&b", "$(literal)"]);
  await expect(pnpmCommand({ PATH: "" }, "win32")).rejects.toThrow("cannot locate");
});
afterEach(async () => {
  await Promise.all(roots.splice(0).map((root) => rm(root, { recursive: true, force: true })));
});
async function fixture() {
  const root = await realpath(await mkdtemp(join(tmpdir(), "pipeline-")));
  roots.push(root);
  await writeFile(join(root, "package.json"), JSON.stringify({ private: true, packageManager: "pnpm@11.13.0" }));
  await writeFile(join(root, "pnpm-workspace.yaml"), "packages:\n  - carriers/*\n  - apps/*\n");
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
  carrier: 1
pipeline:
  carrier: carriers/electron
  capsule: apps/capsule
  daemon: apps/daemon
  web: apps/web
  blobs:
    probe: apps/capsule/dist/probe.bin
`,
  );
  for (const name of ["carrier", "capsule", "daemon", "web"]) {
    const dir = name === "carrier" ? join(root, "carriers", "electron") : join(root, "apps", name);
    await mkdir(dir, { recursive: true });
    await writeFile(
      join(dir, "package.json"),
      JSON.stringify({
        name: `fixture-${name}`,
        type: "module",
        scripts: { build: "node build.mjs", test: 'node -e "process.exit(0)"' },
      }),
    );
    await writeFile(
      join(dir, "build.mjs"),
      `import{mkdir,writeFile}from'node:fs/promises';await mkdir('dist',{recursive:true});
await writeFile('dist/index.mjs','export const fixture='+JSON.stringify(process.env.ODSUITE_BUILD)+';');
await writeFile('dist/probe.bin','fixture');`,
    );
  }
  await exec("git", ["init", "-q"], { cwd: root });
  await exec("git", ["add", "."], { cwd: root });
  await exec("git", ["-c", "user.name=Fixture", "-c", "user.email=fixture@example.test", "commit", "-qm", "fixture"], {
    cwd: root,
  });
  return root;
}
async function packageFixture(root: string, lane: string) {
  const built = await loadBuild(root, lane),
    selected = target();
  const base = join(channelRoot(root, lane), "packages", `${selected.platform}-${selected.arch}`);
  const app = join(base, "application"),
    archive = join(base, "fixture.zip");
  await mkdir(app, { recursive: true });
  await writeFile(join(app, "main"), "fixture");
  await writeFile(archive, "archive");
  const receipt: PackReceipt = {
    schema: 1,
    ...selected,
    channel: lane,
    version: built.version,
    source: built.source,
    fingerprint: built.fingerprint,
    package: {
      app: relative(root, app),
      executable: relative(root, join(app, "main")),
      resources: relative(root, app),
    },
    inventory: await inventory(app),
    artifact: { path: relative(root, archive), sha256: hash("archive"), bytes: 7 },
  };
  await json(join(base, "package.json"), receipt);
  return receipt;
}
it("versions independently of product layout and rejects inconsistent channel selections", async () => {
  expect(await selectedVersion({ root: "/missing", channel: "qa2", base: "1.2.3", number: 4 })).toEqual({
    channel: "qa2",
    version: "1.2.3-qa2.4",
  });
  expect(await selectedVersion({ root: "/missing", channel: "stable", version: "1.2.3" })).toEqual({
    channel: "stable",
    version: "1.2.3",
  });
  await expect(selectedVersion({ root: "/missing", channel: "local", base: "1.2.3" })).rejects.toThrow("reserved");
  await expect(selectedVersion({ root: "/missing", channel: "qa2", version: "1.2.3" })).rejects.toThrow("mismatch");
});
it("routes two outputs from one carrier module and rejects escaping output paths", async () => {
  const root = await fixture();
  const file = join(root, "odsuite.yaml");
  const original = await readFile(file, "utf8");
  const declared = original
    .replace("capsule: apps/capsule", "capsule: carriers/electron")
    .replace("  blobs:", "  outputs:\n    capsule: dist/capsule\n  blobs:");
  await writeFile(file, declared);
  const config = await configuration(root, "stable");
  expect(config.units.capsule).toBe(config.units.carrier);
  expect(config.outputs.capsule).toBe("dist/capsule");
  await writeFile(file, declared.replace("dist/capsule", "../escape"));
  await expect(configuration(root, "stable")).rejects.toThrow("bounded dist path");
});
it("builds immutable product-owned channel content without rewriting source configuration", async () => {
  const root = await fixture(),
    before = await readFile(join(root, "odsuite.yaml"));
  const stable = await build({ root, channel: "stable" });
  const beta = await build({ root, channel: "beta", number: 4 });
  expect(stable.version).toBe("1.2.3");
  expect(beta.version).toBe("1.2.3-beta.4");
  expect(beta.manifest.identity.appid).toBe("io.openmotion.fixture.beta");
  expect(stable.generation).not.toBe(beta.generation);
  expect(await readFile(join(root, "odsuite.yaml"))).toEqual(before);
  const host = JSON.parse(await readFile(join(root, beta.carrier, "host.json"), "utf8"));
  expect(host.manifest).toEqual(beta.manifest);
  expect(await loadBuild(root, "stable")).toEqual(stable);
  await writeFile(join(root, beta.carrier, "host.json"), "{}");
  await expect(loadBuild(root, "beta")).rejects.toThrow("fingerprint");
}, 30000);
it("rejects failed builds and escaped sources instead of reusing successful evidence", async () => {
  const root = await fixture();
  await build({ root, channel: "stable" });
  await writeFile(join(root, "carriers/electron/build.mjs"), "throw new Error('injected build failure');");
  await expect(build({ root, channel: "stable" })).rejects.toThrow();
  await expect(loadBuild(root, "stable")).rejects.toThrow();
  const config = await readFile(join(root, "odsuite.yaml"), "utf8");
  await writeFile(join(root, "odsuite.yaml"), config.replace("carrier: carriers/electron", "carrier: ../outside"));
  await expect(configuration(root, "stable")).rejects.toThrow();
}, 30000);
it("records independent quality failures and checks both archived and materialized bytes", async () => {
  const root = await fixture();
  await build({ root, channel: "stable" });
  const packaged = await packageFixture(root, "stable");
  expect((await check(root, "stable", "tests")).result).toBe("passed");
  expect((await check(root, "stable", "artifacts")).artifact).toBe(packaged.artifact.sha256);
  await writeFile(join(root, packaged.artifact.path), "tampered");
  await expect(check(root, "stable", "artifacts")).rejects.toThrow("integrity");
  expect(JSON.parse(await readFile(join(channelRoot(root, "stable"), "checks/artifacts.json"), "utf8")).result).toBe(
    "failed",
  );
}, 30000);
it("publishes through a draft, enforces only explicit gates and leaves failures unpromoted", async () => {
  const root = await fixture();
  await build({ root, channel: "beta", number: 1 });
  await packageFixture(root, "beta");
  await check(root, "beta", "artifacts");
  const calls: { url: string; method: string; body?: unknown }[] = [];
  const request: typeof fetch = async (input, init) => {
    const url = String(input),
      method = init?.method ?? "GET";
    calls.push({ url, method, body: typeof init?.body === "string" ? JSON.parse(init.body) : undefined });
    if (method === "GET") return new Response("", { status: 404 });
    if (url.includes("uploads.github.com"))
      return Response.json({ size: Buffer.isBuffer(init?.body) ? init.body.length : 0 }, { status: 201 });
    return Response.json(
      {
        id: 1,
        html_url: "https://github.com/owner/repo/releases/1",
        upload_url: "https://uploads.github.com/repos/owner/repo/releases/1/assets{?name,label}",
      },
      { status: method === "POST" ? 201 : 200 },
    );
  };
  const result = await publish({
    root,
    channel: "beta",
    repository: "owner/repo",
    mode: "prerelease",
    require: ["artifacts"],
    token: "fixture",
    request,
  });
  expect(result.state).toBe("published");
  const artifacts = JSON.parse(await readFile(join(channelRoot(root, "beta"), "checks/artifacts.json"), "utf8"));
  await json(join(channelRoot(root, "beta"), "checks/desktop.json"), {
    ...artifacts,
    gate: "desktop",
    artifact: "wrong-archive",
  });
  await expect(
    publish({
      root,
      channel: "beta",
      repository: "owner/repo",
      mode: "prerelease",
      require: ["desktop"],
      token: "fixture",
      request,
    }),
  ).rejects.toThrow("quality evidence");
  expect(calls.at(-1)?.method).toBe("PATCH");
  expect(calls.find((item) => item.method === "POST" && item.url.endsWith("/releases"))?.body).toMatchObject({
    draft: true,
    prerelease: true,
  });
  await expect(
    publish({
      root,
      channel: "beta",
      repository: "owner/repo",
      mode: "release",
      require: ["tests"],
      token: "fixture",
      request,
    }),
  ).rejects.toThrow();
  const failing: typeof fetch = async (input, init) =>
    String(input).includes("uploads.github.com") ? new Response("", { status: 500 }) : request(input, init);
  const before = calls.length;
  await expect(
    publish({
      root,
      channel: "beta",
      repository: "owner/repo",
      mode: "release",
      require: ["artifacts"],
      token: "fixture",
      request: failing,
    }),
  ).rejects.toThrow("draft retained");
  expect(calls.slice(before).some((item) => item.method === "PATCH")).toBe(false);
}, 30000);

it("keeps release workflows declarative while allowing different explicit quality steps", async () => {
  const root = await fixture();
  await mkdir(join(root, ".github/workflows"), { recursive: true });
  const file = join(root, ".github/workflows/stable.release.yml");
  await writeFile(
    file,
    "jobs:\n  release:\n    steps:\n      - run: pnpm exec odsuite check --channel stable --gate tests\n",
  );
  await validateWorkflows(root);
  await writeFile(
    file,
    "jobs:\n  release:\n    steps:\n      - run: pnpm exec odsuite build --channel stable && echo hidden\n",
  );
  await expect(validateWorkflows(root)).rejects.toThrow("short");
  await writeFile(file, "jobs:\n  release:\n    steps:\n      - uses: ./local-release-action\n");
  await expect(validateWorkflows(root)).rejects.toThrow("local actions");
});

it("does not claim an outer checkout commit for a nested independent consumer", async () => {
  const root = await fixture(),
    nested = join(root, ".artifacts", "consumer");
  await mkdir(nested, { recursive: true });
  expect(await revision(root)).toMatch(/^[0-9a-f]{40}$/);
  expect(await revision(nested)).toBeNull();
});
