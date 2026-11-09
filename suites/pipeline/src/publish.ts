import { readFile, realpath } from "node:fs/promises";
import { basename, join } from "node:path";
import { loadBuild, loadPackage } from "./build.js";
import { gates } from "./check.js";
import { channelRoot } from "./config.js";
import { execute, hash, json, located, read, revision } from "./files.js";
import type { CheckReceipt, Gate } from "./types.js";

export interface Publication {
  root: string;
  channel: string;
  repository: string;
  mode: "draft" | "release" | "prerelease";
  require: Gate[];
  platform?: string;
  arch?: string;
  token?: string;
  request?: typeof fetch;
}
export async function publish(options: Publication) {
  const root = await realpath(options.root),
    lane = options.channel;
  if (
    !/^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/.test(options.repository) ||
    !["draft", "release", "prerelease"].includes(options.mode)
  )
    throw new Error("invalid release destination or mode");
  if (options.require.some((gate) => !gates.includes(gate))) throw new Error("unknown required quality gate");
  const build = await loadBuild(root, lane),
    packaged = await loadPackage(root, lane, options.platform, options.arch);
  if (
    !build.source ||
    (await revision(root)) !== build.source ||
    (await execute("git", ["status", "--porcelain"], { cwd: root })).stdout.trim()
  )
    throw new Error("publication requires the clean source commit recorded by build");
  const checks = await Promise.all(
    options.require.map(async (gate) => {
      const receipt = await read<CheckReceipt>(join(channelRoot(root, lane), "checks", `${gate}.json`));
      if (
        receipt.schema !== 1 ||
        receipt.channel !== lane ||
        receipt.gate !== gate ||
        receipt.result !== "passed" ||
        receipt.fingerprint !== build.fingerprint ||
        receipt.source !== build.source ||
        (["artifacts", "installed", "desktop"].includes(gate) && receipt.artifact !== packaged.artifact.sha256)
      )
        throw new Error(`required ${gate} quality evidence is missing or stale`);
      return { gate, result: receipt.result, ...(receipt.artifact ? { artifact: receipt.artifact } : {}) };
    }),
  );
  const token = options.token ?? process.env.GITHUB_TOKEN;
  if (!token) throw new Error("GITHUB_TOKEN is required for publication");
  const request = options.request ?? fetch;
  const headers = {
    Accept: "application/vnd.github+json",
    Authorization: `Bearer ${token}`,
    "X-GitHub-Api-Version": "2026-03-10",
  };
  const base = `https://api.github.com/repos/${options.repository}`,
    tag = `v${build.version}`;
  const existing = await request(`${base}/git/ref/tags/${encodeURIComponent(tag)}`, {
    headers,
    signal: AbortSignal.timeout(30000),
  });
  if (existing.status !== 404)
    throw new Error(existing.ok ? "release version tag already exists" : `tag lookup failed: ${existing.status}`);
  const response = await request(`${base}/releases`, {
    method: "POST",
    headers: { ...headers, "Content-Type": "application/json" },
    body: JSON.stringify({
      tag_name: tag,
      target_commitish: build.source,
      name: `${build.manifest.identity.name} ${build.version}`,
      draft: true,
      prerelease: options.mode === "prerelease",
      body: `Channel: ${lane}\nSource: ${build.source}\nGeneration: ${build.generation}\nChecks: ${checks.map((item) => item.gate).join(", ")}`,
    }),
    signal: AbortSignal.timeout(30000),
  });
  if (response.status !== 201) throw new Error(`release creation failed: ${response.status}`);
  const release = (await response.json()) as { id: number; html_url: string; upload_url: string };
  if (!Number.isSafeInteger(release.id)) throw new Error("invalid release response");
  const upload = new URL(release.upload_url.replace(/\{.*$/, ""));
  if (upload.protocol !== "https:" || upload.hostname !== "uploads.github.com")
    throw new Error("invalid release upload endpoint");
  const state = {
    schema: 1,
    channel: lane,
    version: build.version,
    source: build.source,
    id: release.id,
    url: release.html_url,
    state: "draft-incomplete",
  };
  const output = join(channelRoot(root, lane), "publication.json");
  await json(output, state);
  const artifact = await readFile(await located(root, packaged.artifact.path));
  if (hash(artifact) !== packaged.artifact.sha256) throw new Error("artifact changed before upload; draft retained");
  const metadata = Buffer.from(
    JSON.stringify({
      schema: 1,
      manifest: build.manifest,
      source: build.source,
      generation: build.generation,
      platform: packaged.platform,
      arch: packaged.arch,
      artifact: {
        name: basename(packaged.artifact.path),
        sha256: packaged.artifact.sha256,
        bytes: packaged.artifact.bytes,
      },
      checks,
    }),
  );
  for (const [name, bytes] of [
    [basename(packaged.artifact.path), artifact],
    ["release.json", metadata],
  ] as const) {
    const url = new URL(upload);
    url.searchParams.set("name", name);
    const uploaded = await request(url, {
      method: "POST",
      headers: { ...headers, "Content-Type": "application/octet-stream" },
      body: bytes,
      signal: AbortSignal.timeout(180000),
    });
    if (uploaded.status !== 201) throw new Error(`release asset upload failed: ${uploaded.status}; draft retained`);
    const asset = (await uploaded.json()) as { size: number; digest?: string };
    if (asset.size !== bytes.length || (asset.digest && asset.digest !== `sha256:${hash(bytes)}`))
      throw new Error("uploaded artifact evidence mismatch; draft retained");
  }
  if (options.mode !== "draft") {
    const promoted = await request(`${base}/releases/${release.id}`, {
      method: "PATCH",
      headers: { ...headers, "Content-Type": "application/json" },
      body: JSON.stringify({ draft: false, prerelease: options.mode === "prerelease", make_latest: "false" }),
      signal: AbortSignal.timeout(30000),
    });
    if (!promoted.ok) throw new Error(`release promotion failed: ${promoted.status}; draft retained`);
  }
  state.state = options.mode === "draft" ? "draft-ready" : "published";
  await json(output, state);
  return state;
}
