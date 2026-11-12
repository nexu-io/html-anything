/**
 * Block drop/add handlers for the Studio.
 * Extracted from App.tsx to keep file sizes under the 600-line limit.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { TimelineElement } from "../player";
import { usePlayerStore } from "../player";
import { addBlockToProject } from "../utils/blockInstaller";
import { selectAndRevealTimelineElement } from "../player/components/timelineDropReveal";
import type { BlockParam } from "@hyperframes/core/registry";
import type { RightPanelTab } from "../utils/studioHelpers";
import type { MediaOverlayPlacement } from "../components/editor/propertyPanelTypes";
import { beginPendingAssetDrop, updatePendingAssetDrop } from "../player/store/pendingAssetDrops";

interface BlockCtxDeps {
  activeCompPath: string | null;
  timelineElements: TimelineElement[];
  readProjectFile: (path: string) => Promise<string>;
  writeProjectFile: (path: string, content: string) => Promise<void>;
  recordEdit: (entry: {
    label: string;
    coalesceKey?: string;
    files: Record<string, { before: string; after: string }>;
  }) => Promise<void>;
  refreshFileTree: () => Promise<void>;
  reloadPreview: () => void;
  showToast: (message: string, tone?: "error" | "info") => number;
  dismissToast: (id: number) => void;
}

interface UseBlockHandlersParams {
  projectId: string | null;
  blockCtxDeps: BlockCtxDeps;
  previewIframeRef: React.RefObject<HTMLIFrameElement | null>;
  setRightCollapsed: (collapsed: boolean) => void;
  setRightPanelTab: (tab: RightPanelTab) => void;
}

export interface UseBlockHandlersResult {
  activeBlockParams: {
    blockName: string;
    blockTitle: string;
    params: BlockParam[];
    compositionPath: string;
  } | null;
  setActiveBlockParams: React.Dispatch<
    React.SetStateAction<UseBlockHandlersResult["activeBlockParams"]>
  >;
  handleAddBlock: (blockName: string) => void;
  handleTimelineBlockDrop: (blockName: string, placement: { start: number; track: number }) => Promise<void>;
  handleAddMediaOverlay: (blockName: string, placement: MediaOverlayPlacement) => Promise<void>;
  handlePreviewBlockDrop: (blockName: string, position: { left: number; top: number }) => void;
}

export function useBlockHandlers({
  projectId,
  blockCtxDeps,
  previewIframeRef,
  setRightCollapsed,
  setRightPanelTab,
}: UseBlockHandlersParams): UseBlockHandlersResult {
  const [activeBlockParams, setActiveBlockParams] =
    useState<UseBlockHandlersResult["activeBlockParams"]>(null);

  const blockCtx = useMemo(
    () => ({
      activeCompPath: blockCtxDeps.activeCompPath,
      timelineElements: blockCtxDeps.timelineElements,
      readProjectFile: blockCtxDeps.readProjectFile,
      writeProjectFile: blockCtxDeps.writeProjectFile,
      recordEdit: blockCtxDeps.recordEdit,
      refreshFileTree: blockCtxDeps.refreshFileTree,
      reloadPreview: blockCtxDeps.reloadPreview,
      showToast: blockCtxDeps.showToast,
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [
      blockCtxDeps.activeCompPath,
      blockCtxDeps.timelineElements,
      blockCtxDeps.readProjectFile,
      blockCtxDeps.writeProjectFile,
      blockCtxDeps.recordEdit,
      blockCtxDeps.refreshFileTree,
      blockCtxDeps.reloadPreview,
      blockCtxDeps.showToast,
    ],
  );

  // Serialize registry writes while keeping every accepted drop as its own operation.
  const installQueueRef = useRef(Promise.resolve());
  const scope = useMemo(() => ({}), [projectId, blockCtx.activeCompPath]);
  const scopeRef = useRef<object | null>(scope);
  scopeRef.current = scope;
  useEffect(() => {
    scopeRef.current = scope;
    return () => { scopeRef.current = null; };
  }, [scope]);
  const { showToast, dismissToast } = blockCtxDeps;
  const runBlockInstall = useCallback(
    (blockName: string, install: () => ReturnType<typeof addBlockToProject>, pendingId?: string) => {
      const work = installQueueRef.current.then(async () => {
        if (scopeRef.current !== scope) return null;
        const progress = pendingId ? null : showToast(`Adding ${blockName}…`, "info");
        try {
          const result = await install();
          if (scopeRef.current !== scope) return null;
          if (pendingId) updatePendingAssetDrop(pendingId, result
            ? { element: result.element, duration: result.element.duration,
                placement: { start: result.element.start, track: result.element.track } }
            : { failed: "add" });
          return result;
        } catch (error) {
          if (scopeRef.current === scope) {
            if (pendingId) updatePendingAssetDrop(pendingId, { failed: "add" });
            showToast(error instanceof Error ? error.message : "Failed to add block", "error");
          }
          return null;
        } finally {
          if (progress !== null) dismissToast(progress);
        }
      });
      installQueueRef.current = work.then(() => undefined, () => undefined);
      return work;
    },
    [showToast, dismissToast, scope],
  );

  const handleAddBlock = useCallback(
    (blockName: string) => {
      if (!projectId) return;
      // fallow-ignore-next-line complexity
      void (async () => {
        const result = await runBlockInstall(blockName, () =>
          addBlockToProject({
            projectId,
            blockName,
            ...blockCtx,
            previewIframe: previewIframeRef.current,
            currentTime: usePlayerStore.getState().currentTime,
          }),
        );
        if (result === null) return;
        const params = result?.block.type === "hyperframes:block" ? result.block.params : undefined;
        if (params?.length) {
          setActiveBlockParams({
            blockName: result!.block.name,
            blockTitle: result!.block.title,
            params,
            compositionPath: result!.compositionPath,
          });
          setRightCollapsed(false);
          setRightPanelTab("block-params");
        }
      })();
    },
    [projectId, blockCtx, previewIframeRef, runBlockInstall, setRightCollapsed, setRightPanelTab],
  );

  const handleTimelineBlockDrop = useCallback(
    async (blockName: string, placement: { start: number; track: number }) => {
      if (!projectId) return;
      const pendingId = beginPendingAssetDrop(blockName, placement);
      const result = await runBlockInstall(blockName, () =>
        addBlockToProject({
          projectId,
          blockName,
          placement,
          ...blockCtx,
          previewIframe: previewIframeRef.current,
          currentTime: usePlayerStore.getState().currentTime,
        }), pendingId,
      );
      if (result) selectAndRevealTimelineElement(result.hostKey);
    },
    [projectId, blockCtx, previewIframeRef, runBlockInstall],
  );

  const handleAddMediaOverlay = useCallback(
    async (blockName: string, placement: MediaOverlayPlacement) => {
      if (!projectId) return;
      const { compositionPath, ...timelinePlacement } = placement;
      await runBlockInstall(blockName, () =>
        addBlockToProject({
          projectId,
          blockName,
          ...blockCtx,
          activeCompPath: compositionPath ?? blockCtx.activeCompPath,
          placement: timelinePlacement,
          previewIframe: previewIframeRef.current,
          currentTime: usePlayerStore.getState().currentTime,
        }),
      );
    },
    [projectId, blockCtx, previewIframeRef, runBlockInstall],
  );

  const handlePreviewBlockDrop = useCallback(
    (blockName: string, position: { left: number; top: number }) => {
      if (!projectId) return;
      void runBlockInstall(blockName, () =>
        addBlockToProject({
          projectId,
          blockName,
          visualPosition: position,
          ...blockCtx,
          previewIframe: previewIframeRef.current,
          currentTime: usePlayerStore.getState().currentTime,
        }),
      ).then((result) => {
        if (result) selectAndRevealTimelineElement(result.hostKey);
      });
    },
    [projectId, blockCtx, previewIframeRef, runBlockInstall],
  );

  return {
    activeBlockParams,
    setActiveBlockParams,
    handleAddBlock,
    handleTimelineBlockDrop,
    handleAddMediaOverlay,
    handlePreviewBlockDrop,
  };
}
