/**
 * Shared, mutually exclusive project-asset and catalog previews.
 * The MVP displays either source in a modal preview; legacy asset previews
 * retain their floating card. Preview state never changes project content.
 *
 * State lives here so AssetsTab (sidebar) and PreviewPane (preview column)
 * can communicate without prop-drilling through the multi-layer EditorShell
 * tree. The store is project-scoped: NLEProvider (NLEContext.tsx) clears it
 * whenever `projectId` changes, so a preview opened in one project can't
 * bleed into another (the overlay itself stays mounted across project
 * switches — EditorShell isn't keyed by projectId).
 */
import { create } from "zustand";

interface AssetPreviewState {
  catalogPreview: { videoUrl?: string; posterUrl?: string; title: string } | null;
  setCatalogPreview: (preview: { videoUrl?: string; posterUrl?: string; title: string }) => void;
  /** Project-relative asset path currently being previewed, or null. */
  previewAsset: string | null;
  /** projectId for which the preview was opened (used to build the serve URL). */
  previewProjectId: string | null;
  /** Open a media preview for the given asset. */
  setPreviewAsset: (asset: string, projectId: string) => void;
  /** Close the preview overlay. */
  clearPreviewAsset: () => void;
}

export const useAssetPreviewStore = create<AssetPreviewState>((set) => ({
  catalogPreview: null,
  setCatalogPreview: (catalogPreview) => set({ catalogPreview, previewAsset: null, previewProjectId: null }),
  previewAsset: null,
  previewProjectId: null,
  setPreviewAsset: (asset, projectId) => set({ previewAsset: asset, previewProjectId: projectId, catalogPreview: null }),
  clearPreviewAsset: () => set({ previewAsset: null, previewProjectId: null, catalogPreview: null }),
}));
