"use client";

import { useCallback, useState } from "react";
import { useStore, type DeploymentRecord, type DeploymentStatus } from "./store";

/**
 * Client-side wrapper around POST /api/deploy. Owns the loading / error /
 * latest-result state so individual call sites don't have to re-implement
 * it. On success, also persists the deployment to the store's per-task
 * ring buffer so the history dropdown can render it.
 */

type DeployStatus = "idle" | "deploying" | "done" | "error";

type ApiSuccess = {
  providerId: string;
  url: string;
  deploymentId?: string;
  target: string;
  status: DeploymentStatus;
  statusMessage?: string;
  reachableAt?: number;
};

type ApiError = {
  error: string;
  code?: string;
  details?: unknown;
};

function shortHashSync(input: string): string {
  // Tiny FNV-1a → 12 hex chars. Not cryptographic, just a fingerprint to
  // tell which version of the html each historical URL points to.
  let h = 0x811c9dc5;
  for (let i = 0; i < input.length; i += 1) {
    h ^= input.charCodeAt(i);
    h = (h + ((h << 1) + (h << 4) + (h << 7) + (h << 8) + (h << 24))) >>> 0;
  }
  return h.toString(16).padStart(8, "0").slice(0, 12);
}

export function useDeploy() {
  const [status, setStatus] = useState<DeployStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const [latest, setLatest] = useState<DeploymentRecord | null>(null);
  const pushDeploymentFor = useStore((s) => s.pushDeploymentFor);

  const reset = useCallback(() => {
    setStatus("idle");
    setError(null);
    setLatest(null);
  }, []);

  const deploy = useCallback(
    async ({
      taskId,
      provider,
      html,
    }: {
      taskId: string;
      provider: string;
      html: string;
    }) => {
      setStatus("deploying");
      setError(null);
      setLatest(null);
      try {
        const res = await fetch("/api/deploy", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ taskId, provider, html }),
        });
        const json = (await res.json()) as ApiSuccess | ApiError;
        if (!res.ok) {
          const err = json as ApiError;
          throw new Error(err.error || `HTTP ${res.status}`);
        }
        const ok = json as ApiSuccess;
        const record: DeploymentRecord = {
          id: `d_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`,
          provider: ok.providerId,
          url: ok.url,
          deploymentId: ok.deploymentId,
          htmlHash: shortHashSync(html),
          htmlBytes: html.length,
          status: ok.status,
          statusMessage: ok.statusMessage,
          deployedAt: Date.now(),
          reachableAt: ok.reachableAt,
        };
        pushDeploymentFor(taskId, record);
        setLatest(record);
        setStatus("done");
        return record;
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        setError(msg);
        setStatus("error");
        return null;
      }
    },
    [pushDeploymentFor],
  );

  return { status, error, latest, deploy, reset };
}
