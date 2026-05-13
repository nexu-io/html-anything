"use client";

import { useCallback, useRef, useState } from "react";
import { useStore } from "./store";

type DraftReq = {
  instruction: string;
  context?: string;
};

type DraftStatus = "idle" | "running" | "done" | "error";

/**
 * Streams a markdown draft from the selected coding agent and appends it
 * to the active task's textarea content as it arrives. Mirrors the SSE
 * conventions of `useConvert()` (start / delta / meta / done events) but
 * targets `task.content` instead of `task.html` and uses `/api/draft`,
 * which prompts the agent for plain markdown — never HTML.
 */
export function useDraft() {
  const [status, setStatus] = useState<DraftStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const ctlRef = useRef<AbortController | null>(null);
  // Marker we add to task.content right before streaming starts so we can
  // keep appending exactly to that point even if the user types elsewhere
  // mid-stream. We swap in a non-printing zero-width sentinel.
  const insertOffsetRef = useRef<number>(0);

  const cancel = useCallback(() => {
    ctlRef.current?.abort();
    ctlRef.current = null;
  }, []);

  const run = useCallback(async (req: DraftReq) => {
    cancel();
    const store = useStore.getState();
    const agent = store.selectedAgent;
    if (!agent) {
      setStatus("error");
      setError("先在右上角选择一个 agent");
      return;
    }
    const taskId = store.activeTaskId;
    const agentModels = store.agentModels;
    const model =
      agentModels[agent] && agentModels[agent] !== "default"
        ? agentModels[agent]
        : undefined;

    const ctl = new AbortController();
    ctlRef.current = ctl;
    setStatus("running");
    setError(null);

    // Snapshot insertion point: end of current content, with a separating
    // blank line if the user already has content. We append from here.
    const before = store.tasks.find((t) => t.id === taskId)?.content ?? "";
    const sep = before.length > 0 && !before.endsWith("\n\n") ? (before.endsWith("\n") ? "\n" : "\n\n") : "";
    const baseLen = before.length + sep.length;
    insertOffsetRef.current = baseLen;
    if (sep) store.setContent(before + sep);

    try {
      const res = await fetch("/api/draft", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          agent,
          instruction: req.instruction,
          context: req.context ?? before,
          ...(model ? { model } : {}),
        }),
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
      let appended = "";

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
          let data: unknown;
          try {
            data = JSON.parse(dataLines.join("\n"));
          } catch {
            continue;
          }
          if (event === "delta") {
            const d = data as { text?: string };
            if (typeof d.text === "string") {
              appended += d.text;
              const current = useStore.getState().tasks.find((t) => t.id === taskId)?.content ?? "";
              // Splice at the recorded base offset; user can still edit
              // outside the streamed range without losing in-flight tokens.
              const head = current.slice(0, insertOffsetRef.current);
              const tail = current.slice(insertOffsetRef.current + appended.length - d.text.length);
              useStore.getState().setContent(head + appended + tail);
            }
          } else if (event === "error") {
            const d = data as { message?: string };
            throw new Error(d.message ?? "draft error");
          }
        }
      }
      setStatus("done");
    } catch (err) {
      if ((err as Error)?.name === "AbortError") {
        setStatus("idle");
        return;
      }
      setStatus("error");
      setError((err as Error)?.message ?? String(err));
    } finally {
      if (ctlRef.current === ctl) ctlRef.current = null;
    }
  }, [cancel]);

  return { run, cancel, status, error };
}
