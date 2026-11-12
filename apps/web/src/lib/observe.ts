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

export type ConnectionState = "connecting" | "connected" | "disconnected";
/** Per-view serial reader only. Retry neither writes nor establishes OS liveness. */
export function observeWorkspace(
  editor: Editor,
  options: {
    available(): boolean;
    generation(): number;
    changed(): void;
    status(value: string, state: ConnectionState): void;
  },
) {
  const controller = new AbortController();
  let timer: ReturnType<typeof setTimeout> | undefined, flight: Promise<void> | undefined;
  let state: ConnectionState | undefined;
  const status = (value: string, next: ConnectionState) => {
    if (state === next) return;
    state = next;
    options.status(value, next);
  };
  const poll = (manual = false) => {
    if (controller.signal.aborted) return Promise.resolve();
    if (flight) return flight;
    clearTimeout(timer);
    flight = (async () => {
      if (!options.available() || !editor.initialized || editor.unconfirmed) return;
      try {
        if (manual || state === undefined) status("正在连接工作区，当前内容与草稿仍保留", "connecting");
        const generation = options.generation();
        const changed = await editor.observe(
          controller.signal,
          () => options.available() && options.generation() === generation,
        );
        if (controller.signal.aborted) return;
        status("已连接", "connected");
        if (changed) options.changed();
      } catch {
        if (!controller.signal.aborted)
          status(
            "工作区同步暂不可用，当前内容与草稿仍保留。请确认实例已启动；若实例已重启，请通过 odsuite status 获取当前入口。",
            "disconnected",
          );
      }
    })().finally(() => {
      flight = undefined;
      if (!controller.signal.aborted) timer = setTimeout(poll, 1500);
    });
    return flight;
  };
  timer = setTimeout(poll, 1500);
  return {
    retry: () => poll(true),
    async close() {
      controller.abort();
      clearTimeout(timer);
      await flight;
    },
  };
}
