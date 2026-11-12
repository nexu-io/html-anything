import { SearchInput } from "../ui/SearchInput";
import { Popover } from "../ui/Popover";
import type { ReactElement } from "react";
import { useI18n } from "../../i18n/I18n";
import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { type ImportedFontAsset, type FontImportInput } from "./fontAssets";
import {
  FIELD,
  GENERIC_FONT_FAMILIES,
  LABEL,
  sortFontOptions,
  uniqueFontFamilies,
  uniqueFontOptions,
  type FontOption,
} from "./propertyPanelHelpers";
import { useTrackDesignInput } from "../../contexts/DesignPanelInputContext";
import { runWhenInputIdle } from "./overlayFrameLoop";
import { studioApiFetch } from "../../utils/studioApiFetch";
import { useStudioShellContextOptional } from "../../contexts/StudioContext";

/* ------------------------------------------------------------------ */
/*  Font helper functions                                              */
/* ------------------------------------------------------------------ */

function splitFontFamilies(value: string): string[] {
  const families: string[] = [];
  let current = "";
  let quote: '"' | "'" | null = null;
  for (const char of value) {
    if ((char === '"' || char === "'") && !quote) {
      quote = char;
      continue;
    }
    if (char === quote) {
      quote = null;
      continue;
    }
    if (char === "," && !quote) {
      if (current.trim()) families.push(current.trim());
      current = "";
      continue;
    }
    current += char;
  }
  if (current.trim()) families.push(current.trim());
  return families.map((f) => f.replace(/^["']|["']$/g, "").trim()).filter(Boolean);
}

function primaryFontFamily(value: string): string {
  return splitFontFamilies(value)[0] ?? "inherit";
}

function quoteFontFamily(family: string): string {
  const trimmed = family.trim();
  if (GENERIC_FONT_FAMILIES.has(trimmed.toLowerCase())) return trimmed;
  return `"${trimmed.replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"`;
}

function buildFontFamilyValue(family: string): string {
  const trimmed = family.trim();
  if (!trimmed) return "inherit";
  if (GENERIC_FONT_FAMILIES.has(trimmed.toLowerCase())) return trimmed;
  return `${quoteFontFamily(trimmed)}, ui-sans-serif, system-ui, sans-serif`;
}

function collectDocumentFontFamilies(doc?: Document | null): string[] {
  const fontSet = doc?.fonts;
  if (!fontSet) return [];
  return Array.from(fontSet, (ff) => ff.family.replace(/^["']|["']$/g, "").trim())
    .filter(Boolean)
    .sort((a, b) => a.localeCompare(b));
}

function fontSearchKey(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "");
}

function fontMatchesQuery(family: string, query: string): boolean {
  const normalizedQuery = query.trim().toLowerCase();
  if (!normalizedQuery) return true;
  if (family.toLowerCase().includes(normalizedQuery)) return true;
  return fontSearchKey(family).includes(fontSearchKey(normalizedQuery));
}

async function loadImportedFontStylesheet(asset: ImportedFontAsset): Promise<void> {
  if (typeof document === "undefined") return;
  const face = new FontFace(asset.family, `url(${JSON.stringify(asset.url)})`, { weight: asset.weight ?? "normal", style: asset.style ?? "normal" });
  await face.load();
  document.fonts.add(face);
}

type FontLists = {
  loaded: boolean;
  installed: string[];
};

let fontLists: FontLists = {
  loaded: false,
  installed: [],
};
let fontListsRequest: Promise<void> | null = null;
const fontListListeners = new Set<() => void>();

async function fetchFontList(url: string): Promise<string[]> {
  const data = (await (await studioApiFetch(url)).json()) as { fonts?: unknown };
  if (!Array.isArray(data.fonts)) throw new Error(`${url} returned no font list`);
  return data.fonts as string[];
}

function loadFontLists(): void {
  if (fontLists.loaded) return;
  fontListsRequest ??= fetchFontList("/api/fonts")
    .then((installed) => {
      runWhenInputIdle(() => {
        fontLists = { loaded: true, installed: uniqueFontFamilies(installed) };
        for (const listener of fontListListeners) listener();
        return true;
      });
    })
    .catch(() => {
      fontListsRequest = null;
    });
}

function subscribeFontLists(listener: () => void): () => void {
  fontListListeners.add(listener);
  loadFontLists();
  return () => fontListListeners.delete(listener);
}

/* ------------------------------------------------------------------ */
/*  FontFamilyField                                                    */
/* ------------------------------------------------------------------ */

export function FontFamilyField({
  value,
  disabled,
  flat,
  importedFonts,
  onImportFonts,
  onCommit,
}: {
  value: string;
  disabled?: boolean;
  flat?: boolean;
  importedFonts: ImportedFontAsset[];
  onImportFonts?: (files: FontImportInput) => Promise<ImportedFontAsset[]>;
  onCommit: (nextValue: string) => void;
}) {
  const { t } = useI18n();
  const shell = useStudioShellContextOptional();
  const previewDocument = shell?.previewIframeRef.current?.contentDocument;
  const track = useTrackDesignInput();
  const currentFamily = primaryFontFamily(value);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const fontInputRef = useRef<HTMLInputElement | null>(null);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(-1);
  const lists = useSyncExternalStore(subscribeFontLists, () => fontLists);
  const [importingFonts, setImportingFonts] = useState(false);
  const [fontNotice, setFontNotice] = useState<string | null>(null);
  const commitFontFamily = (nextValue: string) => {
    if (nextValue !== value) track("select", "Font family");
    return onCommit(nextValue);
  };

  useEffect(() => {
    if (open) loadFontLists();
  }, [open]);

  const handleImportFonts = async (files: FileList | File[] | null) => {
    if (!files?.length || !onImportFonts) return;
    setImportingFonts(true);
    setFontNotice(null);
    try {
      const imported = await onImportFonts(files);
      for (const font of imported) await loadImportedFontStylesheet(font);
      const first = imported[0];
      if (first) {
        await commitFontFamily(buildFontFamilyValue(first.family));
        setQuery("");
        setOpen(false);
      } else {
        setFontNotice("No supported font files were imported.");
      }
    } catch {
      setFontNotice("This font could not be loaded. The current font was kept.");
    } finally {
      setImportingFonts(false);
    }
  };

  const projectFontAssets = useMemo(
    () =>
      uniqueFontOptions(
        importedFonts.map((f): FontOption => ({ family: f.family, source: "Imported" })),
      ),
    [importedFonts],
  );

  const options = useMemo(() => {
    if (!open) return [];
    const documentFonts = collectDocumentFontFamilies(previewDocument);
    return sortFontOptions(
      uniqueFontOptions([
        { family: currentFamily, source: "Current" },
        ...documentFonts.map((f): FontOption => ({ family: f, source: "Document" })),
        ...projectFontAssets,
        ...lists.installed.map(
          (f): FontOption => ({ family: f, source: "Local" }),
        ),
      ]),
    );
  }, [open, currentFamily, lists, previewDocument, projectFontAssets]);

  const filteredOptions = useMemo(() => {
    const matches = options.filter((o) => fontMatchesQuery(o.family, query));
    if (query.trim()) return matches.slice(0, 200);
    const bySource = new Map<string, FontOption[]>();
    for (const m of matches) {
      const list = bySource.get(m.source) ?? [];
      list.push(m);
      bySource.set(m.source, list);
    }
    const result: FontOption[] = [];
    for (const s of ["Current", "Document", "Imported"]) result.push(...(bySource.get(s) ?? []));
    result.push(...(bySource.get("Local") ?? []).slice(0, 80));
    return result;
  }, [options, query]);

  const importSystemFont = async (family: string): Promise<ImportedFontAsset | null> => {
    if (!onImportFonts) return null;
    const imported = await onImportFonts(family);
    return (
      imported.find((a) => a.family.toLowerCase() === family.toLowerCase()) ?? imported[0] ?? null
    );
  };

  const commitFamily = async (option: FontOption) => {
    const needsImport = option.source === "Local";

    if (needsImport) {
      setImportingFonts(true);
      setFontNotice(null);
      try {
        const imported = await importSystemFont(option.family);
        if (imported) {
          await loadImportedFontStylesheet(imported);
          await commitFontFamily(buildFontFamilyValue(imported.family));
          setQuery("");
          setOpen(false);
        } else {
          // Committing an un-imported family would render a silent fallback,
          // so surface the failure and keep the current font instead.
          setFontNotice(`Couldn't import "${option.family}", so the font was not applied.`);
        }
      } catch (error) {
        console.error("Local font could not be applied", error);
        setFontNotice(`Couldn't import "${option.family}", so the font was not applied.`);
      } finally {
        setImportingFonts(false);
      }
      return;
    }
    setImportingFonts(true);
    setFontNotice(null);
    try {
      const imported = importedFonts.find((font) => font.family.toLowerCase() === option.family.toLowerCase());
      if (imported) await loadImportedFontStylesheet(imported);
      else if (!GENERIC_FONT_FAMILIES.has(option.family.toLowerCase()) && previewDocument?.fonts) {
        const faces = await previewDocument.fonts.load(`16px ${quoteFontFamily(option.family)}`);
        if (faces.length === 0) throw new Error("Font is unavailable");
      }
      await commitFontFamily(buildFontFamilyValue(option.family));
      setQuery("");
      setOpen(false);
    } catch {
      setFontNotice(`Couldn't load "${option.family}", so the font was not applied.`);
    } finally { setImportingFonts(false); }
  };

  const dropdown = open && (
    <div className="flex max-h-[min(360px,var(--available-height))] min-h-0 flex-col">
      <div className="grid shrink-0 grid-cols-[minmax(0,1fr)_auto] gap-2 border-b border-neutral-800 p-2">
        <SearchInput
          ref={inputRef}
          aria-label={t("Search fonts")}
          value={query}
          disabled={disabled || importingFonts}
          placeholder={t("Search fonts")}
          onChange={(e) => {
            setQuery(e.target.value);
            setActiveIndex(-1);
          }}
          onKeyDown={(e) => {
            if (e.key === "Escape") {
              e.preventDefault();
              setOpen(false);
              return;
            }
            if (e.key === "ArrowDown" || e.key === "ArrowUp") {
              e.preventDefault();
              if (filteredOptions.length === 0) return;
              const delta = e.key === "ArrowDown" ? 1 : -1;
              const next =
                activeIndex < 0 && delta === 1
                  ? 0
                  : (activeIndex + delta + filteredOptions.length) % filteredOptions.length;
              setActiveIndex(next);
              document
                .querySelector(`[data-font-option-index="${next}"]`)
                ?.scrollIntoView({ block: "nearest" });
              return;
            }
            const target = filteredOptions[activeIndex] ?? filteredOptions[0];
            if (e.key === "Enter" && target) {
              e.preventDefault();
              commitFamily(target);
            }
          }}
          role="combobox"
          aria-expanded={open}
          aria-autocomplete="list"
          className="min-w-0"
        />
        <button
          type="button"
          disabled={disabled || importingFonts || !onImportFonts}
          onClick={() => fontInputRef.current?.click()}
          className="rounded-lg border border-neutral-700 bg-neutral-900 px-2.5 text-[10px] font-medium text-neutral-400 transition-colors hover:border-neutral-600 hover:text-neutral-100 disabled:cursor-not-allowed disabled:text-text-off"
        >
          {importingFonts ? "..." : t("Import")}
        </button>
        <input
          ref={fontInputRef}
          type="file"
          accept=".ttf,.otf,.ttc,.woff,.woff2,font/*"
          multiple
          aria-label={t("Import local font files")}
          disabled={disabled || importingFonts || !onImportFonts}
          className="hidden"
          onChange={async (event) => {
            await handleImportFonts(event.target.files);
            event.target.value = "";
          }}
        />
      </div>
      {fontNotice && (
        <div className="border-b border-neutral-800 px-3 py-2 text-[10px] leading-4 text-neutral-500">
          {fontNotice}
        </div>
      )}
      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-1">
        {filteredOptions.length === 0 ? (
          <div className="px-2 py-3 text-[11px] text-neutral-500">{t("No fonts found.")}</div>
        ) : (
          filteredOptions.map((option, index) => (
            <button
              key={`${option.source}-${option.family}`}
              type="button"
              data-font-option-index={index}
              disabled={disabled || importingFonts}
              onClick={() => commitFamily(option)}
              className={`flex w-full min-w-0 items-center justify-between gap-3 rounded-lg px-2 py-2 text-left text-[11px] transition-colors ${
                index === activeIndex
                  ? "bg-neutral-800 text-neutral-50"
                  : option.family === currentFamily
                    ? "bg-studio-accent/15 text-neutral-50"
                    : "text-neutral-300 hover:bg-neutral-900 hover:text-neutral-100"
              }`}
            >
              <span className="flex min-w-0 items-center gap-1.5">
                <span title={option.family} className="truncate font-medium" style={{ fontFamily: `"${option.family}"` }}>
                  {option.family}
                </span>

              </span>
              <span className="shrink-0 text-[9px] uppercase tracking-[0.14em] text-neutral-600">
                {t(option.source)}
              </span>
            </button>
          ))
        )}
      </div>
    </div>
  );

  const renderPicker = (trigger: ReactElement) => (
    <Popover
      open={open}
      onOpenChange={setOpen}
      trigger={trigger}
      align="end"
      aria-label={t("Font family")}
      initialFocus={inputRef}
      className="w-64 max-w-[calc(100vw-16px)] overflow-hidden p-0"
    >
      {dropdown}
    </Popover>
  );

  if (flat) {
    return (
      <div className="relative flex min-h-[30px] items-center justify-between">
        <span className="text-[11px] text-panel-text-2">{t("Font")}</span>
        {renderPicker(<button
          type="button"
          data-flat-font-trigger="true"
          disabled={disabled || importingFonts}
          className="flex items-center gap-1.5 disabled:cursor-not-allowed"
        >
          <span
            className="max-w-[200px] truncate font-mono text-[11px] text-panel-text-0"
            style={{ fontFamily: value }}
          >
            {currentFamily}
          </span>
          <svg
            width="10"
            height="10"
            viewBox="0 0 10 10"
            fill="currentColor"
            className="shrink-0 text-panel-text-5"
          >
            <path d="M2 3l3 4 3-4z" />
          </svg>
        </button>)}
      </div>
    );
  }

  return (
    <div className="relative grid min-w-0 gap-1.5">
      <span className={LABEL}>{t("Font family")}</span>
      {renderPicker(<button
        type="button"
        disabled={disabled || importingFonts}
        className={`${FIELD} flex h-10 items-center justify-between gap-3 text-left hover:border-neutral-700 disabled:cursor-not-allowed`}
      >
        <span
          className="min-w-0 flex-1 truncate text-[11px] font-medium text-neutral-100"
          style={{ fontFamily: value }}
        >
          {currentFamily}
        </span>
        <span className="shrink-0 text-[10px] uppercase tracking-[0.14em] text-neutral-600">
          {t("Font")}</span>
      </button>)}
    </div>
  );
}
