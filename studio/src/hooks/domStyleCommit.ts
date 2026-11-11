import type { PatchOperation } from "../utils/sourcePatcher";
import { styleEditKind, withEditKind } from "../motion/editorTracking";
import { styleHistoryLabel } from "../i18n/styleHistory";
import {
  cssPropertyName,
  isImageBackgroundValue,
  isManualGeometryStyleProperty,
  normalizeDomEditStyleValue,
} from "../utils/studioHelpers";
import { injectPreviewGoogleFont, injectPreviewImportedFont } from "../utils/studioFontHelpers";
import {
  buildDomEditStylePatchOperation,
  findElementsForSelection,
  getDomEditTargetKey,
  type DomEditSelection,
} from "../components/editor/domEditing";
import type { ImportedFontAsset } from "../components/editor/fontAssets";
import type { PersistDomEditOperations } from "./domEditCommitTypes";
import { reportDomEditPersistFailure } from "./domEditPersistFailure";
import {
  bumpDomEditCommitMapVersion,
  domEditCommitDeclined,
  runReportedDomEditCommit,
  type DomEditCommitOutcome,
} from "./domEditCommitRunner";

const IMAGE_BACKGROUND_FIT: Array<[string, string]> = [
  ["background-position", "center"],
  ["background-repeat", "no-repeat"],
  ["background-size", "contain"],
];

export interface DomStyleCommitContext {
  activeCompPath: string | null;
  previewIframeRef: React.RefObject<HTMLIFrameElement | null>;
  persistDomEditOperations: PersistDomEditOperations;
  showToast: (message: string, tone?: "error" | "info") => void;
  /** Latest-commit versions per target and property set; keep one map per caller. */
  versions: Map<string, symbol>;
  resolveImportedFontAsset?: (fontFamilyValue: string) => ImportedFontAsset | null;
  resync?: (selection: DomEditSelection) => void;
}

/** Applies inline styles live and saves them as one source patch and one undo step. */
// fallow-ignore-next-line complexity
export async function commitDomStyles(
  context: DomStyleCommitContext,
  selection: DomEditSelection,
  stylesInEitherCase: Record<string, string>,
): Promise<DomEditCommitOutcome> {
  const styles = Object.fromEntries(
    Object.entries(stylesInEitherCase).map(([property, value]) => [
      cssPropertyName(property),
      value,
    ]),
  );
  const entries = Object.entries(styles);
  if (entries.length === 0) return domEditCommitDeclined("no-selection");
  if (entries.some(([property]) => isManualGeometryStyleProperty(property)))
    return domEditCommitDeclined("geometry-property");
  if (!selection.capabilities.canEditStyles) return domEditCommitDeclined("styles-not-editable");

  const { activeCompPath, previewIframeRef, persistDomEditOperations, showToast } = context;
  // One version per element and property, so a failed save never reverts a later edit's property.
  const targetKey = getDomEditTargetKey(selection);
  const owned = entries.map(([property]) => ({
    property,
    isLatest: bumpDomEditCommitMapVersion(context.versions, `${targetKey}:${property}`),
  }));
  const ownsAny = () => owned.some(({ isLatest }) => isLatest());
  const fontFamily = styles["font-family"];
  const importedFont =
    fontFamily !== undefined ? (context.resolveImportedFontAsset?.(fontFamily) ?? null) : null;
  const doc = previewIframeRef.current?.contentDocument;
  const operations: PatchOperation[] = [];
  const liveStyles: Array<[string, string]> = [];
  for (const [property, value] of entries) {
    const normalized = normalizeDomEditStyleValue(property, value);
    operations.push(buildDomEditStylePatchOperation(property, normalized));
    liveStyles.push([property, normalized]);
    if (property === "background-image" && isImageBackgroundValue(value)) {
      for (const [fit, fitValue] of IMAGE_BACKGROUND_FIT) {
        if (fit in styles) continue;
        operations.push(buildDomEditStylePatchOperation(fit, fitValue));
        liveStyles.push([fit, fitValue]);
      }
    }
  }
  const editedElements = new Map<HTMLElement, Map<string, string>>();

  return runReportedDomEditCommit({
    capture: () => {
      if (!doc) return;
      for (const el of findElementsForSelection(doc, selection, activeCompPath)) {
        editedElements.set(el, new Map(entries.map(([property]) => [property, el.style.getPropertyValue(property)])));
      }
    },
    apply: () => {
      for (const el of editedElements.keys()) {
        for (const [property, value] of liveStyles) el.style.setProperty(property, value);
      }
      if (fontFamily !== undefined && doc) {
        injectPreviewGoogleFont(doc, fontFamily);
        if (importedFont) injectPreviewImportedFont(doc, importedFont);
      }
    },
    persist: () =>
      {
        const label = styleHistoryLabel(selection.textContent || selection.label || selection.id || selection.tagName, Object.fromEntries(entries.map(([property, value]) => [property, normalizeDomEditStyleValue(property, value)])));
        // The label only pairs this commit with its history entry in memory; the reported value is the kind.
        return withEditKind(label, styleEditKind(entries.map(([property]) => property)), () =>
          persistDomEditOperations(selection, operations, {
            label,
            // Inline styles are already live, so a reload would only blank the preview.
            skipRefresh: true,
            importedFont: importedFont ?? undefined,
          }),
        );
      },
    shouldRevert: ownsAny,
    revert: () => {
      // ponytail: background-image fit styles are not reverted here.
      for (const [el, previousInline] of editedElements) {
        for (const { property, isLatest } of owned) {
          const previous = previousInline.get(property);
          if (previous === undefined || !isLatest()) continue;
          if (previous === "") el.style.removeProperty(property);
          else el.style.setProperty(property, previous);
        }
      }
    },
    onError: (error) => reportDomEditPersistFailure(selection, operations, error, showToast),
    shouldResync: ownsAny,
    resync: () => context.resync?.(selection),
    onFinally: () => owned.forEach(({ isLatest }) => isLatest.release()),
  });
}
