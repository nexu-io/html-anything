import { RemixIcon } from "../../icons/RemixIcons";
import { clickOption, searchStarted, trackStudioClick } from "../../motion/editorTracking";
import { useMvpEditor } from "../../motion/StudioHost";
import { useI18n } from "../../i18n/I18n";
import { useMediaGateway } from "../../motion/MediaGatewayContext";
import { mediaPopoverAnchor } from "../../motion/mediaPopoverPosition";
import { buildProjectApiPath } from "../../utils/projectRouting";
// fallow-ignore-file code-duplication
import { memo, useState, useCallback, useRef, useMemo, useEffect } from "react";
import { SearchInput } from "../ui/SearchInput";
import { FilterChip } from "../ui/FilterChip";
import { MEDIA_EXT, FONT_EXT } from "../../utils/mediaTypes";
import { copyTextToClipboard } from "../../utils/clipboard";
import { usePlayerStore } from "../../player/store/playerStore";
import {
  type MediaCategory,
  type CopyFeedback,
  getCategory,
  basename,
  CATEGORY_LABELS,
  FILTER_ORDER,
} from "./assetHelpers";
import { AudioRow } from "./AudioRow";
import { AssetCard, FontRow } from "./AssetCard";
import { studioApiFetch } from "../../utils/studioApiFetch";

interface AssetsTabProps {
  projectId: string;
  assets: string[];
  onImport?: (files: FileList, entryPoint?: "assets_button" | "assets_drop") => void | Promise<void>;
  onDelete?: (path: string) => void;
  onRename?: (oldPath: string, newPath: string) => void;
  onAddAssetToTimeline?: (path: string) => void;
}

export type UsageFilter = "all" | "used" | "unused";

/** Filter assets by whether the composition references them. Pure — unit-tested. */
export function filterByUsage(
  assets: string[],
  usedPaths: Set<string>,
  usageFilter: UsageFilter,
): string[] {
  if (usageFilter === "used") return assets.filter((a) => usedPaths.has(a));
  if (usageFilter === "unused") return assets.filter((a) => !usedPaths.has(a));
  return assets;
}

/** Count used vs unused over a media set. Pure — unit-tested. */
export function countUsage(
  assets: string[],
  usedPaths: Set<string>,
): { used: number; unused: number } {
  let used = 0;
  for (const a of assets) if (usedPaths.has(a)) used++;
  return { used, unused: assets.length - used };
}

/**
 * Project-relative asset paths referenced by composition elements — the set the
 * "in use" badge, used-first sort, and usage filter all key on. Element src is
 * populated from the core runtime's `resolveNodeAssetUrl` which calls
 * `new URL(raw, document.baseURI).toString()`, turning authored relative paths
 * into fully-absolute URLs with percent-encoded characters, e.g.
 *   "assets/my file (1).mp4"
 *   → "http://localhost:3012/api/projects/demo/preview/assets/my%20file%20(1).mp4"
 *
 * This function normalizes every src shape to the bare project-relative path so
 * it matches the asset-list entries:
 *   - Absolute URL  → strip origin + /api/projects/<id>/preview/ prefix, decode %XX
 *   - Server-relative /api/…preview/… → same strip + decode
 *   - Relative "./"-prefixed or bare → strip leading ./ or /
 *   - ?query / #hash → dropped
 *
 * Pure — unit-tested.
 */
export function deriveUsedPaths(elements: Array<{ src?: string }>): Set<string> {
  const paths = new Set<string>();
  for (const el of elements) {
    if (!el.src) continue;
    let s = el.src;

    // Strip absolute origin if present (http://host/path → /path)
    try {
      const u = new URL(s);
      s = u.pathname + (u.search ? u.search : "") + (u.hash ? u.hash : "");
    } catch {
      // Not a valid absolute URL — leave as-is (relative path)
    }

    s = s
      .replace(/^\/api\/projects\/[^/]+\/preview\//, "") // strip the dev serve prefix
      .replace(/^\.?\//, "") // strip leading ./ or /
      .split(/[?#]/)[0]; // drop query / hash

    // Decode percent-encoded characters (spaces, parens, etc.) so the path
    // matches the plain-text asset-list entries the server returns.
    try {
      s = decodeURIComponent(s);
    } catch {
      // Malformed encoding — use as-is
    }

    if (s) paths.add(s);
  }
  return paths;
}

/** Import trigger. An import is an await, so the button owns the pending state
 *  instead of leaving the author clicking a control that looks idle. */
function ImportButton({ importing, onClick }: { importing: boolean; onClick: () => void }) {
  const { t } = useI18n();
  return (
    <button
      onClick={onClick}
      disabled={importing}
      aria-busy={importing}
      aria-label={t("Import media")}
      title={t("Import media")}
      className="flex shrink-0 items-center justify-center gap-1 rounded-md bg-panel-input px-2 py-[5px] text-[11px] font-medium text-panel-text-3 enabled:hover:text-panel-text-1 enabled:active:scale-[0.98] disabled:opacity-60 transition-colors"
    >
      {importing ? (
        <RemixIcon name="loader-4-line" size={14} className="animate-spin" />
      ) : (
        <RemixIcon name="add-line" size={14} />
      )}
      {importing ? t("Importing…") : t("Import")}
    </button>
  );
}

/** Empty list body. A query that matched nothing says so and offers a way out;
 *  a genuinely empty project gets the drop hint. */
function EmptyState({
  searchQuery,
  onClearSearch,
}: {
  searchQuery: string;
  onClearSearch: () => void;
}) {
  const { t } = useI18n();
  if (searchQuery) {
    return (
      <div className="flex flex-col items-center justify-center h-full px-4 gap-2">
        <p className="text-[11px] text-neutral-500 text-center">
          {t("No assets match “")}{searchQuery}&rdquo;
        </p>
        <button
          type="button"
          onClick={onClearSearch}
          className="px-2.5 py-1 text-[11px] font-medium rounded-md bg-panel-input text-panel-text-3 hover:text-panel-text-1 active:scale-[0.98] transition-colors"
        >
          {t("Clear search")}</button>
      </div>
    );
  }
  return (
    <div className="flex items-center justify-center h-full px-4">
      <div className="motion-panel-empty-content motion-assets-empty-drop">
        <RemixIcon name="upload-2-line" size={18} className="text-text-off" />
        <p className="text-[10px] text-neutral-600 text-center">{t("Drop media files here")}</p>
      </div>
    </div>
  );
}

export const AssetsTab = memo(function AssetsTab({
  projectId,
  assets,
  onImport,
  onDelete,
  onRename,
  onAddAssetToTimeline,
}: AssetsTabProps) {
  const { t } = useI18n();
  const mediaGateway = useMediaGateway();
  const mvp = useMvpEditor();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [copyFeedback, setCopyFeedback] = useState<CopyFeedback>(null);
  const [importing, setImporting] = useState(false);
  const [activeFilter, setActiveFilter] = useState<MediaCategory | "all">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const chooseFilter = (next: MediaCategory | "all") => {
    if (next !== activeFilter) trackStudioClick("assets", "asset_filter", projectId, undefined, clickOption(next));
    setActiveFilter(next);
  };
  const [manifest, setManifest] = useState<
    Map<string, { description?: string; duration?: number; width?: number; height?: number }>
  >(new Map());

  const manifest404Ref = useRef<Set<string>>(new Set());
  const assetsKey = assets.join("|");
  useEffect(() => {
    if (manifest404Ref.current.has(projectId)) return;
    let cancelled = false;
    studioApiFetch(buildProjectApiPath(projectId, `/preview/.media/manifest.jsonl`))
      .then((r) => {
        if (!r.ok) {
          manifest404Ref.current.add(projectId);
          return "";
        }
        return r.text();
      })
      .then((text) => {
        if (cancelled || !text) return;
        const m = new Map<
          string,
          { description?: string; duration?: number; width?: number; height?: number }
        >();
        for (const line of text.split("\n")) {
          if (!line.trim()) continue;
          try {
            const rec = JSON.parse(line);
            if (rec.path) m.set(rec.path, rec);
          } catch {
            /* skip */
          }
        }
        setManifest(m);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [projectId, assetsKey]);

  const handleImport = useCallback(
    async (files: FileList, entryPoint: "assets_button" | "assets_drop") => {
      if (!onImport) return;
      setImporting(true);
      try {
        await onImport(files, entryPoint);
      } finally {
        setImporting(false);
      }
    },
    [onImport],
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      if (e.dataTransfer.files.length) void handleImport(e.dataTransfer.files, "assets_drop");
    },
    [handleImport],
  );

  const handleCopyPath = useCallback(async (path: string) => {
    const copied = await copyTextToClipboard(path);
    setCopyFeedback({ path, ok: copied });
    setTimeout(() => setCopyFeedback(null), copied ? 1500 : 3000);
  }, []);
  const elements = usePlayerStore((s) => s.elements);
  const usedPaths = useMemo(() => deriveUsedPaths(elements), [elements]);

  // Unfiltered pool — header controls (search, chips) are gated on THIS, not
  // the search-filtered list, so a no-match query can't unmount its own input.
  const allMediaAssets = useMemo(
    () => assets.filter((a) => MEDIA_EXT.test(a) || FONT_EXT.test(a)),
    [assets],
  );

  const mediaAssets = useMemo(() => {
    const all = allMediaAssets;
    if (!searchQuery) return all;
    const q = searchQuery.toLowerCase();
    return all.filter((a) => {
      if (basename(a).toLowerCase().includes(q)) return true;
      const rec = manifest.get(a);
      return rec?.description?.toLowerCase().includes(q);
    });
  }, [allMediaAssets, searchQuery, manifest]);

  const categorized = useMemo(() => {
    const groups: Record<MediaCategory, string[]> = { audio: [], images: [], video: [], fonts: [] };
    for (const a of mediaAssets) {
      const cat = getCategory(a);
      if (cat) groups[cat].push(a);
    }
    // Sort: used assets first within each category
    for (const cat of FILTER_ORDER) {
      groups[cat].sort((a, b) => {
        const aUsed = usedPaths.has(a) ? 0 : 1;
        const bUsed = usedPaths.has(b) ? 0 : 1;
        return aUsed - bUsed;
      });
    }
    return groups;
  }, [mediaAssets, usedPaths]);
  const counts = useMemo(() => {
    const c: Record<string, number> = { all: mediaAssets.length };
    for (const cat of FILTER_ORDER) c[cat] = categorized[cat].length;
    return c;
  }, [mediaAssets, categorized]);
  const visibleCategories =
    activeFilter === "all"
      ? FILTER_ORDER.filter((c) => categorized[c].length > 0)
      : [activeFilter as MediaCategory].filter((c) => categorized[c].length > 0);
  return (
    <div
      className={`flex-1 flex flex-col min-h-0 transition-colors ${dragOver ? "bg-studio-accent/5" : ""}`}
      onDragOver={(e) => {
        e.preventDefault();
        setDragOver(true);
      }}
      onDragLeave={() => setDragOver(false)}
      onDrop={handleDrop}
    >
      <div className={`shrink-0 space-y-1.5 border-b ${mvp ? "border-transparent" : "border-panel-border"} px-2 py-2`} data-assets-toolbar>
        <div className="flex items-center gap-1.5">
          <SearchInput
            value={searchQuery}
            onChange={(e) => {
              if (searchStarted(searchQuery, e.target.value)) trackStudioClick("assets", "asset_search", projectId);
              setSearchQuery(e.target.value);
            }}
            placeholder={t("Search assets...")}
            aria-label={t("Search assets")}
            className="min-w-0 flex-1"
          />
          {onImport && <ImportButton importing={importing} onClick={() => fileInputRef.current?.click()} />}
        </div>
        {!mvp && onImport && mediaGateway && <button className="motion-asset-generate" onClick={event => mediaGateway.openGenerator({ anchor: mediaPopoverAnchor(event.currentTarget) })}>{t("Generate media")}</button>}
        {onImport && (
          <input
            ref={fileInputRef}
            type="file"
            accept="video/*,image/*,audio/*,font/*"
            multiple
            className="hidden"
            onChange={(e) => {
              if (e.target.files?.length) {
                void handleImport(e.target.files, "assets_button");
                e.target.value = "";
              }
            }}
          />
        )}

        {/* Filter chips */}
        {allMediaAssets.length > 0 && (
          <div className="flex gap-1.5 flex-wrap">
            <FilterChip
              onClick={() => chooseFilter("all")}
              active={activeFilter === "all"}
            >
              {t("All")}{" "}{counts.all}
            </FilterChip>
            {FILTER_ORDER.map((cat) =>
              counts[cat] > 0 || activeFilter === cat ? (
                <FilterChip
                  key={cat}
                  onClick={() => chooseFilter(activeFilter === cat ? "all" : cat)}
                  active={activeFilter === cat}
                >
                  {t(CATEGORY_LABELS[cat])} {counts[cat]}
                </FilterChip>
              ) : null,
            )}
          </div>
        )}
      </div>

      <div
        className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-2 py-1 [scrollbar-gutter:stable]"
        role="region"
        aria-label={t("Project assets")}
        tabIndex={0}
        data-assets-list
      >
        {mediaAssets.length === 0 ? (
          <EmptyState searchQuery={searchQuery} onClearSearch={() => setSearchQuery("")} />
        ) : (
          visibleCategories.map((cat) => (
            <div key={cat} className="mb-1">
              {activeFilter === "all" && visibleCategories.length > 1 && (
                <div className="flex items-center gap-2 px-2 py-1.5">
                  <h3 className="text-[12px] font-semibold text-panel-text-1">
                    {t(CATEGORY_LABELS[cat])}
                  </h3>
                  <span className="text-[11px] text-panel-text-5">{categorized[cat].length}</span>
                </div>
              )}
              {cat === "audio" &&
                categorized[cat].map((a) => (
                  <AudioRow
                    key={a}
                    projectId={projectId}
                    asset={a}
                    used={usedPaths.has(a)}
                    meta={manifest.get(a)}
                    onCopy={handleCopyPath}
                    copyFeedback={copyFeedback}
                    onDelete={onDelete}
                    onRename={onRename}
                    onAddAssetToTimeline={onAddAssetToTimeline}
                  />
                ))}
              {(cat === "images" || cat === "video") && (
                <div className="hf-media-card-grid pb-1">
                  {categorized[cat].map((a) => (
                    <AssetCard
                      key={a}
                      projectId={projectId}
                      asset={a}
                      used={usedPaths.has(a)}
                      duration={manifest.get(a)?.duration}
                      onCopy={handleCopyPath}
                      copyFeedback={copyFeedback}
                      onDelete={onDelete}
                      onRename={onRename}
                      onAddAssetToTimeline={onAddAssetToTimeline}
                    />
                  ))}
                </div>
              )}
              {cat === "fonts" &&
                categorized[cat].map((a) => (
                  <FontRow
                    key={a}
                    asset={a}
                    used={usedPaths.has(a)}
                    onCopy={handleCopyPath}
                    copyFeedback={copyFeedback}
                    onDelete={onDelete}
                    onRename={onRename}
                    onAddAssetToTimeline={onAddAssetToTimeline}
                  />
                ))}
            </div>
          ))
        )}
      </div>
    </div>
  );
});
