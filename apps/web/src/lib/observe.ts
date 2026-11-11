import type { Observation, WorkspaceView } from "@open-motion/workspace/contract";
import type { Client } from "../api.js";
import type { Editor } from "./editor.js";

/** Bodies use existing bounded APIs; matching metadata fences prevent torn view publication. */
export async function observedView(
  client: Client,
  head: Observation,
  signal?: AbortSignal,
): Promise<WorkspaceView | undefined> {
  const selected = head.state.selection;
  const [session, project] = await Promise.all([
    selected.sessionId ? client.execute("session_get", { sessionId: selected.sessionId }, signal) : null,
    head.project
      ? client.execute(
          "project_read",
          { sessionId: head.project.sessionId, artifactId: head.project.artifactId },
          signal,
        )
      : null,
  ]);
  const fence = await client.execute("workspace_observe", {}, signal);
  if (fence.token !== head.token) return;
  const summary = head.state.sessions.find((entry) => entry.id === selected.sessionId);
  // Titles may change and return to the same value without a monotonic revision.
  if (session && session.title !== summary?.title) return;
  if ((session?.id ?? null) !== selected.sessionId || (project?.artifactId ?? null) !== selected.artifactId)
    throw Error("工作区快照身份不一致");
  if (
    project &&
    (project.revision !== head.project?.revision || project.history.version !== head.project.historyVersion)
  )
    throw Error("工作区快照读取不一致");
  return { state: head.state, session, project };
}

/** Per-view reader only. It neither writes nor establishes OS liveness. */
export function observeWorkspace(
  editor: Editor,
  options: { available(): boolean; generation(): number; changed(): void; status(value: string): void },
) {
  const controller = new AbortController();
  let timer: ReturnType<typeof setTimeout> | undefined, flight: Promise<void> | undefined;
  const poll = () => {
    if (controller.signal.aborted) return;
    flight = (async () => {
      if (!options.available() || !editor.initialized || editor.unconfirmed) return;
      try {
        const generation = options.generation();
        const changed = await editor.observe(
          controller.signal,
          () => options.available() && options.generation() === generation,
        );
        if (controller.signal.aborted) return;
        options.status("已连接");
        if (changed) options.changed();
      } catch {
        if (!controller.signal.aborted) options.status("工作区同步暂不可用，当前内容与草稿仍保留");
      }
    })().finally(() => {
      if (!controller.signal.aborted) timer = setTimeout(poll, 1500);
    });
  };
  timer = setTimeout(poll, 1500);
  return {
    async close() {
      controller.abort();
      clearTimeout(timer);
      await flight;
    },
  };
}
