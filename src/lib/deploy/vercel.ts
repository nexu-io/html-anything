import { randomUUID } from "node:crypto";
import { DeployError, type DeployConfig } from "./config";
import {
  normalizeDeploymentUrl,
  waitForReachableDeploymentUrl,
} from "./url-check";

/**
 * One-shot Vercel preview deployment for a single HTML document. Adapted
 * 1:1 from open-design's `deployToVercel` but with the multi-file resource
 * tree collapsed away — html-anything tasks are always a single
 * `index.html` (CSS / images are inlined at convert time).
 */

const VERCEL_API = "https://api.vercel.com";

/** A flat file payload — `data` is the raw body, base64 happens here. */
export type DeployFile = {
  file: string; // path within the deployment, e.g. "index.html"
  data: string | Buffer;
  contentType?: string; // currently only used by Cloudflare Pages
};

export type VercelDeployResult = {
  providerId: "vercel";
  url: string;
  deploymentId: string;
  target: "preview";
  status: "ready" | "protected" | "link-delayed";
  statusMessage: string;
  reachableAt?: number;
};

type VercelJson = Record<string, unknown> & {
  id?: string;
  uid?: string;
  url?: string;
  alias?: string[] | unknown[];
  aliases?: string[] | unknown[];
  readyState?: string;
  error?: { code?: string; message?: string };
  message?: string;
};

function vercelTeamQuery(config: DeployConfig): string {
  const params = new URLSearchParams();
  if (config.teamId) params.set("teamId", config.teamId);
  else if (config.teamSlug) params.set("slug", config.teamSlug);
  const s = params.toString();
  return s ? `?${s}` : "";
}

async function readVercelJson(resp: Response): Promise<VercelJson> {
  try {
    return (await resp.json()) as VercelJson;
  } catch {
    throw new DeployError(
      "Vercel returned a non-JSON response.",
      resp.status || 502,
    );
  }
}

function vercelError(json: VercelJson, status: number): DeployError {
  const code = json?.error?.code;
  const message =
    json?.error?.message ||
    json?.message ||
    `Vercel request failed (${status}).`;
  if (code === "forbidden" || /permission/i.test(String(message))) {
    return new DeployError(
      "You don't have permission to create a project on this Vercel account.",
      status,
      json,
    );
  }
  return new DeployError(String(message), status, json);
}

function deploymentUrl(json: VercelJson | null | undefined): string {
  const aliasArr = (json?.alias ?? []) as unknown[];
  const url = json?.url || (typeof aliasArr[0] === "string" ? aliasArr[0] : "");
  if (!url) return "";
  const s = String(url);
  return /^https?:\/\//i.test(s) ? s : `https://${s}`;
}

function deploymentUrlCandidates(...responses: Array<VercelJson | null>): string[] {
  const urls: string[] = [];
  for (const json of responses) {
    if (!json) continue;
    if (typeof json.url === "string") urls.push(json.url);
    for (const alias of (json.alias ?? []) as unknown[]) {
      if (typeof alias === "string") urls.push(alias);
    }
    for (const alias of (json.aliases ?? []) as unknown[]) {
      if (typeof alias === "string") urls.push(alias);
      else if (alias && typeof alias === "object") {
        const a = alias as Record<string, unknown>;
        if (typeof a.domain === "string") urls.push(a.domain);
        else if (typeof a.url === "string") urls.push(a.url);
      }
    }
  }
  return [...new Set(urls.map(normalizeDeploymentUrl).filter(Boolean))];
}

async function pollVercelDeployment(
  config: DeployConfig,
  id: string,
): Promise<VercelJson | null> {
  let last: VercelJson | null = null;
  for (let i = 0; i < 30; i += 1) {
    await new Promise((resolve) => setTimeout(resolve, i < 5 ? 1000 : 2000));
    const resp = await fetch(
      `${VERCEL_API}/v13/deployments/${encodeURIComponent(id)}${vercelTeamQuery(config)}`,
      { headers: { Authorization: `Bearer ${config.token}` } },
    );
    const json = await readVercelJson(resp);
    if (!resp.ok) throw vercelError(json, resp.status);
    last = json;
    if (json.readyState === "READY" || json.readyState === "ERROR") return json;
  }
  return last;
}

function safeProjectLabel(raw: string, maxLength: number): string {
  return String(raw)
    .normalize("NFKD")
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, maxLength)
    .replace(/-+$/g, "");
}

export function safeVercelProjectName(raw: string): string {
  return (
    safeProjectLabel(raw, 80) || `html-anything-${randomUUID().slice(0, 8)}`
  );
}

export async function deployToVercel({
  config,
  files,
  taskId,
}: {
  config: DeployConfig;
  files: DeployFile[];
  taskId: string;
}): Promise<VercelDeployResult> {
  if (!config?.token) {
    throw new DeployError("Vercel token is required.", 400);
  }
  if (!files.length) {
    throw new DeployError("No files to deploy.", 400);
  }

  const createResp = await fetch(
    `${VERCEL_API}/v13/deployments${vercelTeamQuery(config)}`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${config.token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: safeVercelProjectName(`html-anything-${taskId}`),
        files: files.map((f) => ({
          file: f.file,
          data: Buffer.from(f.data).toString("base64"),
          encoding: "base64",
        })),
        projectSettings: { framework: null },
      }),
    },
  );

  const created = await readVercelJson(createResp);
  if (!createResp.ok) throw vercelError(created, createResp.status);

  const deploymentId = String(created.id || created.uid || "");
  const initialUrl = deploymentUrl(created);
  const ready = deploymentId
    ? await pollVercelDeployment(config, deploymentId)
    : created;

  if (ready?.readyState === "ERROR") {
    throw new DeployError(
      ready?.error?.message || "Vercel deployment failed.",
      502,
      ready,
    );
  }

  const candidates = deploymentUrlCandidates(ready, created);
  const link = await waitForReachableDeploymentUrl(
    candidates.length ? candidates : [initialUrl],
    { providerLabel: "Vercel" },
  );

  return {
    providerId: "vercel",
    url: link.url || deploymentUrl(ready) || initialUrl,
    deploymentId,
    target: "preview",
    status: link.status,
    statusMessage: link.statusMessage,
    reachableAt: link.reachableAt,
  };
}
