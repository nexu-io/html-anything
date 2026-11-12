// @vitest-environment happy-dom

import React, { act } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { mountReactHarness } from "./domSelectionTestHarness";
import { useBlockHandlers, type UseBlockHandlersResult } from "./useBlockHandlers";
import { usePlayerStore } from "../player/store/playerStore";

(globalThis as unknown as { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

vi.mock("../utils/blockInstaller", () => ({
  addBlockToProject: async (opts: { showToast: (message: string) => void }) => {
    opts.showToast("Installing catalog items needs hyperframes preview");
    return null;
  },
}));

afterEach(() => {
  document.body.innerHTML = "";
  usePlayerStore.getState().reset();
});

describe("useBlockHandlers", () => {
  it("leaves only the error toast when an install fails", async () => {
    const events: string[] = [];
    let nextId = 0;
    const showToast = (message: string) => {
      events.push(`show ${message}`);
      return ++nextId;
    };
    const dismissToast = (id: number) => events.push(`dismiss ${id}`);
    let handlers: UseBlockHandlersResult | undefined;
    function Harness() {
      handlers = useBlockHandlers({
        projectId: "demo",
        blockCtxDeps: {
          activeCompPath: null,
          timelineElements: [],
          readProjectFile: async () => "",
          writeProjectFile: async () => {},
          recordEdit: async () => {},
          refreshFileTree: async () => {},
          reloadPreview: () => {},
          showToast,
          dismissToast,
        },
        previewIframeRef: { current: null },
        setRightCollapsed: () => {},
        setRightPanelTab: () => {},
      });
      return null;
    }
    const root = mountReactHarness(<Harness />);

    await act(async () => {
      handlers!.handleAddBlock("x-post");
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    expect(events).toEqual([
      "show Installing catalog items needs hyperframes preview",
    ]);
    expect(usePlayerStore.getState().pendingAssetDrops[0].failed).toBe("add");
    act(() => root.unmount());
  });
});
