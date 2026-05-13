"use client";

import { useCallback } from "react";
import { useStore } from "./store";
import { summarizeForAgent } from "./parsers/auto";

type ConvertReq = {
  taskId: string;
  agent: string;
  templateId: string;
  content: string;
  format?: string;
  /** Optional model override. "default" / undefined → no --model flag. */
  model?: string;
};

/** prefix logged when the run is sent in diff-edit mode (vs full regeneration) */
const DIFF_LOG_PREFIX = "🔁 diff-edit 模式";

// per-task abort controllers — multiple tasks can stream concurrently
const controllers = new Map<string, AbortController>();

export function useConvert() {
  const cancel = useCallback((taskId: string) => {
    const ctl = controllers.get(taskId);
    if (ctl) {
      ctl.abort();
      controllers.delete(taskId);
    }
    useStore.getState().setStatusFor(taskId, "idle");
  }, []);

  const run = useCallback(
    async (req: ConvertReq) => {
      const { taskId } = req;
      cancel(taskId);
      const ctl = new AbortController();
      controllers.set(taskId, ctl);
      const store = useStore.getState();
      store.setStatusFor(taskId, "running");
      store.resetHtmlFor(taskId);
      store.clearLogFor(taskId);
      store.resetStatsFor(taskId);
      const startedAt = Date.now();
      store.patchStatsFor(taskId, { startedAt });

      // Inline `asset:<id>` placeholders (created by upload-dropzone for
      // images) back into real `data:image/...` URLs before the agent
      // sees the prompt. Editor stays readable; agent gets the bytes.
      const taskWithAssets = store.tasks.find((t) => t.id === taskId);
      const assets = taskWithAssets?.assets ?? {};
      const inlinedContent = Object.keys(assets).length
        ? req.content.replace(/asset:([a-z0-9_]+)/gi, (m, id) => assets[id] ?? m)
        : req.content;

      const summary = summarizeForAgent(inlinedContent);
      const enrichedContent =
        summary.preview && summary.format !== "markdown" && summary.format !== "html" && summary.format !== "text"
          ? `${summary.preview}\n\n--- 原始内容 ---\n${summary.raw}`
          : summary.raw;

      const useModel = req.model && req.model !== "default" ? req.model : undefined;

      // diff-edit mode: if the task was loaded from a sample (or the user has
      // already converted once) AND the content has actually changed, we ship
      // the previous (baseContent, baseHtml) so the API can ask the agent for
      // minimal edits instead of a fresh regeneration. This preserves the
      // design system AND saves output tokens.
      const task = store.tasks.find((t) => t.id === taskId);
      const isEdit =
        !!task?.baseHtml &&
        !!task?.baseContent &&
        task.baseContent.trim() !== req.content.trim();
      const editPayload = isEdit
        ? {
            editFromHtml: task!.baseHtml!,
            editFromContent: task!.baseContent!,
          }
        : null;

      const payload = {
        agent: req.agent,
        templateId: req.templateId,
        content: enrichedContent,
        format: req.format ?? summary.format,
        ...(useModel ? { model: useModel } : {}),
        ...(editPayload ?? {}),
      };

      const sizeNote = `输入 ${enrichedContent.length.toLocaleString()} 字符 (${summary.format})`;
      store.pushLogFor(taskId, {
        kind: "info",
        text: isEdit
          ? `${DIFF_LOG_PREFIX} · ${req.agent}${useModel ? ` · 模型 ${useModel}` : ""} · 模板 ${req.templateId} · ${sizeNote} · 原 HTML ${(task!.baseHtml!.length / 1024).toFixed(1)} KB`
          : `准备调用 ${req.agent}${useModel ? ` · 模型 ${useModel}` : ""} · 模板 ${req.templateId} · ${sizeNote}`,
      });

      try {
        const res = await fetch("/api/convert", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
          signal: ctl.signal,
        });
        if (!res.ok || !res.body) {
          const text = await res.text().catch(() => res.statusText);
          throw new Error(`HTTP ${res.status}: ${text}`);
        }

        const reader = res.body.getReader();
        const dec = new TextDecoder();
        let buf = "";
        let lastEvent = "";

        while (true) {
          const { value, done } = await reader.read();
          if (done) break;
          buf += dec.decode(value, { stream: true });

          let blank: number;
          while ((blank = buf.indexOf("\n\n")) !== -1) {
            const block = buf.slice(0, blank);
            buf = buf.slice(blank + 2);
            const lines = block.split("\n");
            let event = lastEvent;
            const dataLines: string[] = [];
            for (const l of lines) {
              if (l.startsWith("event:")) event = l.slice(6).trim();
              else if (l.startsWith("data:")) dataLines.push(l.slice(5).trim());
            }
            lastEvent = event;
            if (!dataLines.length) continue;
            const dataStr = dataLines.join("\n");
            let data: unknown;
            try {
              data = JSON.parse(dataStr);
            } catch {
              continue;
            }
            handleEvent(taskId, event, data, startedAt);
          }
        }
        const endedAt = Date.now();
        useStore.getState().patchStatsFor(taskId, { endedAt, durationMs: endedAt - startedAt });
        useStore.getState().setStatusFor(taskId, "done");
        // record the just-finished (content, html) as the new diff-edit baseline
        // so the user's next edit goes through diff mode instead of full regen
        useStore.getState().commitBaseFor(taskId);
      } catch (err) {
        if ((err as Error)?.name === "AbortError") {
          useStore.getState().pushLogFor(taskId, { kind: "info", text: "已取消" });
          useStore.getState().setStatusFor(taskId, "idle");
          return;
        }
        useStore.getState().pushLogFor(taskId, {
          kind: "error",
          text: (err as Error)?.message ?? String(err),
        });
        useStore.getState().setStatusFor(taskId, "error");
      } finally {
        if (controllers.get(taskId) === ctl) controllers.delete(taskId);
      }
    },
    [cancel],
  );

  return { run, cancel };
}

function handleEvent(taskId: string, event: string, data: unknown, startedAt: number) {
  const d = data as Record<string, unknown>;
  const store = useStore.getState();
  const elapsed = Date.now() - startedAt;
  switch (event) {
    case "start": {
      const bin = String(d.bin ?? "");
      const promptBytes = Number(d.promptBytes ?? 0);
      store.patchStatsFor(taskId, { bin, promptBytes });
      store.pushLogFor(taskId, {
        kind: "start",
        elapsed,
        text: `spawn ${shortPath(bin)}  ·  prompt ${formatBytes(promptBytes)}`,
        data: { argv: d.argv },
      });
      break;
    }
    case "delta": {
      if (typeof d.text === "string") store.appendHtmlFor(taskId, d.text);
      break;
    }
    case "meta": {
      const key = String(d.key);
      const value = d.value;
      const patch: Partial<import("./store").RunStats> = {};
      if (key === "model" && typeof value === "string") patch.model = value;
      if (key === "duration_ms" && typeof value === "number") patch.durationMs = value;
      if (key === "cost_usd" && typeof value === "number") patch.costUsd = value;
      if (key === "usage" && value && typeof value === "object") {
        const u = value as Record<string, number>;
        patch.inputTokens = u.input_tokens;
        patch.outputTokens = u.output_tokens;
        patch.cacheReadTokens = u.cache_read_input_tokens;
        patch.cacheCreateTokens = u.cache_creation_input_tokens;
      }
      if (Object.keys(patch).length) store.patchStatsFor(taskId, patch);
      store.pushLogFor(taskId, {
        kind: "meta",
        elapsed,
        text: formatMeta(key, value),
        data: value,
      });
      break;
    }
    case "stderr": {
      if (typeof d.text === "string")
        store.pushLogFor(taskId, {
          kind: "stderr",
          elapsed,
          text: String(d.text).trim(),
        });
      break;
    }
    case "raw": {
      if (typeof d.text === "string")
        store.pushLogFor(taskId, { kind: "raw", elapsed, text: String(d.text) });
      break;
    }
    case "done": {
      store.pushLogFor(taskId, {
        kind: "done",
        elapsed,
        text: `agent 进程退出 (exit=${d.code ?? "?"})`,
      });
      break;
    }
    case "error": {
      store.pushLogFor(taskId, {
        kind: "error",
        elapsed,
        text: String(d.message ?? "agent error"),
      });
      break;
    }
  }
}

function formatBytes(n: number) {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / 1024 / 1024).toFixed(2)} MB`;
}

function shortPath(p: string) {
  if (!p) return "";
  return p.replace(/^.*\//, "…/");
}

function formatMeta(key: string, value: unknown): string {
  if (key === "model") return `model = ${value}`;
  if (key === "session") return `session = ${value}`;
  if (key === "cwd") return `cwd = ${value}`;
  if (key === "duration_ms") return `duration = ${value} ms`;
  if (key === "cost_usd") return `cost ≈ $${(value as number).toFixed(4)}`;
  if (key === "result") return `result = ${value}`;
  if (key === "rate_limit" && value && typeof value === "object") {
    const r = value as { status?: string; rateLimitType?: string };
    return `rate-limit: ${r.status} (${r.rateLimitType})`;
  }
  if (key === "usage" && value && typeof value === "object") {
    const u = value as Record<string, number>;
    const parts: string[] = [];
    if (u.input_tokens) parts.push(`in=${u.input_tokens}`);
    if (u.output_tokens) parts.push(`out=${u.output_tokens}`);
    if (u.cache_read_input_tokens) parts.push(`cache-read=${u.cache_read_input_tokens}`);
    if (u.cache_creation_input_tokens) parts.push(`cache-create=${u.cache_creation_input_tokens}`);
    return `usage: ${parts.join(" · ")}`;
  }
  if (key === "thinking") return `thinking ${(value as string).slice(0, 80)}…`;
  return `${key}: ${typeof value === "object" ? JSON.stringify(value).slice(0, 120) : String(value)}`;
}
