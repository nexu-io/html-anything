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

export type PreviewAddAction = () => unknown;
type CatalogPreview = { videoUrl?: string; posterUrl?: string; title: string; onAdd?: PreviewAddAction };

interface AssetPreviewState {
  previewAdd: PreviewAddAction | undefined;
  catalogPreview: CatalogPreview | null;
  setCatalogPreview: (preview: CatalogPreview) => void;
  /** Project-relative asset path currently being previewed, or null. */
  previewAsset: string | null;
  /** projectId for which the preview was opened (used to build the serve URL). */
  previewProjectId: string | null;
  /** Open a media preview for the given asset. */
  setPreviewAsset: (asset: string, projectId: string, onAdd?: PreviewAddAction) => void;
  /** Close the preview overlay. */
  clearPreviewAsset: () => void;
}

export const useAssetPreviewStore = create<AssetPreviewState>((set) => ({
  previewAdd: undefined,
  catalogPreview: null,
  setCatalogPreview: (catalogPreview) => set({ catalogPreview, previewAsset: null, previewProjectId: null, previewAdd: catalogPreview.onAdd }),
  previewAsset: null,
  previewProjectId: null,
  setPreviewAsset: (asset, projectId, previewAdd) => set({ previewAsset: asset, previewProjectId: projectId, catalogPreview: null, previewAdd }),
  clearPreviewAsset: () => set({ previewAsset: null, previewProjectId: null, catalogPreview: null, previewAdd: undefined }),
}));
