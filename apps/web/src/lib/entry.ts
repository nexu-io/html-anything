import { parseEntry } from "@open-motion/daemon/contract";
import { Fault, type Input, type State } from "@open-motion/workspace/contract";
import type { Client } from "../api.js";
/** One explicit entry intent. Lost responses retain the original selection preconditions and request. */
export class EntryLoader {
  readonly target;
  pending = false;
  private intent?: Input<"artifact_enter">;
  constructor(
    readonly fragment: string,
    private client: Client,
  ) {
    this.target = parseEntry(fragment);
  }
  async load(): Promise<State> {
    if (!this.intent) {
      const state = await this.client.execute("workspace_state", {}),
        selected = state.selection,
        current =
          selected.sessionId && selected.artifactId
            ? await this.client.execute("project_read", {
                sessionId: selected.sessionId,
                artifactId: selected.artifactId,
              })
            : null;
      this.intent = {
        requestId: crypto.randomUUID(),
        sessionId: this.target.sessionId,
        artifactId: this.target.artifactId,
        expectedRevision: this.target.revision,
        expectedHistory: this.target.historyVersion,
        expectedSelection: selected.revision,
        expectedCurrent: current ? { artifactId: current.artifactId, revision: current.revision } : null,
      };
    }
    this.pending = true;
    try {
      const selected = await this.client.execute("artifact_enter", this.intent);
      this.pending = false;
      const state = await this.client.execute("workspace_state", {});
      if (
        state.selection.revision !== selected.revision ||
        state.selection.sessionId !== selected.sessionId ||
        state.selection.artifactId !== selected.artifactId
      )
        throw new Error("entry selection changed; request a fresh explicit entry");
      return state;
    } catch (error) {
      if (error instanceof Fault && error.code !== "integrity") this.pending = false;
      throw error;
    }
  }
}
