"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { parseDeck, type DeckSlide } from "@/lib/deck";
import { useT } from "@/lib/i18n";

type Props = {
  html: string;
  /** When `true`, the deck viewer is the visible tab — it can grab keyboard events. */
  active: boolean;
  /** Bubble out the latest main-slide iframe so screenshot/export can target it. */
  onMainIframe?: (el: HTMLIFrameElement | null) => void;
  /** Bubble out the parsed slides so the export menu can iterate them. */
  onSlides?: (slides: DeckSlide[]) => void;
};

export function DeckViewer({ html, active, onMainIframe, onSlides }: Props) {
  const t = useT();
  const parsed = useMemo(() => parseDeck(html), [html]);
  const slides = parsed.slides;
  const [index, setIndex] = useState(0);
  const [showNotes, setShowNotes] = useState(false);
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const mainIframeRef = useRef<HTMLIFrameElement | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Keep index in range when the deck shrinks (e.g. live re-render).
  useEffect(() => {
    if (index >= slides.length) setIndex(Math.max(0, slides.length - 1));
  }, [slides.length, index]);

  // Bubble the parsed slides up so the export menu can use them.
  useEffect(() => {
    onSlides?.(slides);
  }, [slides, onSlides]);

  // Bubble main iframe up so screenshot can re-use the existing helpers.
  useEffect(() => {
    onMainIframe?.(mainIframeRef.current);
  });

  const next = useCallback(() => setIndex((i) => Math.min(slides.length - 1, i + 1)), [slides.length]);
  const prev = useCallback(() => setIndex((i) => Math.max(0, i - 1)), []);

  // Keyboard nav (only when this tab is the active one — otherwise the
  // editor textarea would steal arrow keys, but we only listen for ←/→ on the
  // wrapper and on document while in fullscreen).
  useEffect(() => {
    if (!active) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLElement) {
        const tag = e.target.tagName;
        if (tag === "INPUT" || tag === "TEXTAREA" || e.target.isContentEditable) return;
      }
      if (e.key === "ArrowRight" || e.key === "PageDown" || e.key === " ") { e.preventDefault(); next(); }
      else if (e.key === "ArrowLeft" || e.key === "PageUp") { e.preventDefault(); prev(); }
      else if (e.key === "Home") { e.preventDefault(); setIndex(0); }
      else if (e.key === "End") { e.preventDefault(); setIndex(slides.length - 1); }
      else if (e.key === "f" || e.key === "F") { e.preventDefault(); enterFullscreen(); }
      else if (e.key === "n" || e.key === "N") { e.preventDefault(); setShowNotes((v) => !v); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [active, next, prev, slides.length]);

  // Track browser-level fullscreen state.
  useEffect(() => {
    const onFs = () => setIsFullscreen(document.fullscreenElement === wrapRef.current);
    document.addEventListener("fullscreenchange", onFs);
    return () => document.removeEventListener("fullscreenchange", onFs);
  }, []);

  const enterFullscreen = useCallback(() => {
    const el = wrapRef.current;
    if (!el) return;
    if (document.fullscreenElement === el) {
      document.exitFullscreen?.();
    } else {
      el.requestFullscreen?.().catch(() => {});
    }
  }, []);

  if (slides.length === 0) {
    return (
      <div className="grid h-full place-items-center text-[13px] text-[var(--ink-mute)]">
        {t("deck.empty")}
      </div>
    );
  }

  const current = slides[index];

  return (
    <div
      ref={wrapRef}
      className="relative flex h-full w-full flex-col"
      style={{ background: isFullscreen ? "#0a0a0a" : "var(--paper)" }}
    >
      {/* main slide canvas */}
      <div className="relative flex-1 overflow-hidden">
        <iframe
          key={current.id /* force-reload between slides for clean keyboard focus */}
          ref={mainIframeRef}
          title={`slide-${current.id}`}
          srcDoc={current.html}
          sandbox="allow-scripts allow-same-origin"
          className="h-full w-full"
          style={{ background: current.bg ?? "#fff", border: "0" }}
        />

        {/* floating prev/next arrows */}
        {slides.length > 1 && (
          <>
            <button
              onClick={prev}
              disabled={index === 0}
              aria-label={t("deck.prev")}
              className="absolute left-3 top-1/2 -translate-y-1/2 grid h-10 w-10 place-items-center rounded-full text-[18px] disabled:opacity-30 transition-opacity"
              style={{
                background: isFullscreen ? "rgba(255,255,255,0.10)" : "var(--surface)",
                color: isFullscreen ? "#fff" : "var(--ink)",
                border: isFullscreen ? "1px solid rgba(255,255,255,0.18)" : "1px solid var(--line)",
                boxShadow: isFullscreen ? "none" : "0 4px 14px -4px rgba(0,0,0,0.18)",
              }}
            >
              ‹
            </button>
            <button
              onClick={next}
              disabled={index === slides.length - 1}
              aria-label={t("deck.next")}
              className="absolute right-3 top-1/2 -translate-y-1/2 grid h-10 w-10 place-items-center rounded-full text-[18px] disabled:opacity-30 transition-opacity"
              style={{
                background: isFullscreen ? "rgba(255,255,255,0.10)" : "var(--surface)",
                color: isFullscreen ? "#fff" : "var(--ink)",
                border: isFullscreen ? "1px solid rgba(255,255,255,0.18)" : "1px solid var(--line)",
                boxShadow: isFullscreen ? "none" : "0 4px 14px -4px rgba(0,0,0,0.18)",
              }}
            >
              ›
            </button>
          </>
        )}

        {/* top-right toolbar — Present + Notes */}
        <div className="absolute right-3 top-3 flex items-center gap-1.5">
          {current.notes && (
            <button
              onClick={() => setShowNotes((v) => !v)}
              className="rounded-full px-3 py-1.5 text-[11px] font-medium"
              style={{
                background: showNotes
                  ? "var(--ink)"
                  : isFullscreen ? "rgba(255,255,255,0.10)" : "var(--surface)",
                color: showNotes
                  ? "var(--paper)"
                  : isFullscreen ? "#fff" : "var(--ink)",
                border: isFullscreen
                  ? "1px solid rgba(255,255,255,0.18)"
                  : "1px solid var(--line)",
              }}
              title={t("deck.notesTooltip")}
            >
              {t("deck.notes")} <span className="opacity-60">N</span>
            </button>
          )}
          <button
            onClick={enterFullscreen}
            className="rounded-full px-3 py-1.5 text-[11px] font-medium"
            style={{
              background: isFullscreen ? "rgba(255,255,255,0.10)" : "var(--ink)",
              color: isFullscreen ? "#fff" : "var(--paper)",
              border: isFullscreen ? "1px solid rgba(255,255,255,0.18)" : "1px solid var(--ink)",
            }}
            title={t("deck.presentTooltip")}
          >
            {isFullscreen ? t("deck.exitPresent") : t("deck.present")}
            <span className="ml-1 opacity-60">F</span>
          </button>
        </div>

        {/* page count badge — bottom-right of canvas */}
        <div
          className="absolute bottom-3 right-3 rounded-full px-3 py-1 text-[11px] font-medium tabular-nums"
          style={{
            background: isFullscreen ? "rgba(255,255,255,0.12)" : "var(--surface)",
            color: isFullscreen ? "#fff" : "var(--ink-soft)",
            border: isFullscreen ? "1px solid rgba(255,255,255,0.18)" : "1px solid var(--line)",
            fontFamily: "var(--font-mono)",
          }}
        >
          {index + 1} / {slides.length}
        </div>

        {/* speaker notes overlay */}
        {showNotes && current.notes && (
          <div
            className="absolute inset-x-3 bottom-14 max-h-[40%] overflow-auto rounded-2xl p-4 text-[13px] leading-relaxed"
            style={{
              background: isFullscreen ? "rgba(20,20,20,0.92)" : "var(--surface)",
              color: isFullscreen ? "#f5f5f5" : "var(--ink)",
              border: isFullscreen ? "1px solid rgba(255,255,255,0.10)" : "1px solid var(--line)",
              backdropFilter: "blur(14px)",
              boxShadow: "0 24px 60px -20px rgba(0,0,0,0.40)",
            }}
          >
            <div
              className="mb-2 text-[10px] uppercase tracking-[0.18em]"
              style={{ color: isFullscreen ? "rgba(255,255,255,0.55)" : "var(--ink-faint)" }}
            >
              {t("deck.notes")} · {t("deck.slideN", { n: index + 1, m: slides.length })}
            </div>
            <p className="whitespace-pre-wrap">{current.notes}</p>
          </div>
        )}
      </div>

      {/* thumbnail strip */}
      {!isFullscreen && (
        <ThumbStrip
          slides={slides}
          activeIndex={index}
          onPick={setIndex}
        />
      )}
    </div>
  );
}

function ThumbStrip({
  slides,
  activeIndex,
  onPick,
}: {
  slides: DeckSlide[];
  activeIndex: number;
  onPick: (i: number) => void;
}) {
  // Each thumb is a 200×112 (16:9) iframe scaled down — heavy if there are
  // many slides, so we render at most ~80; users with bigger decks scroll.
  return (
    <div
      className="flex gap-2 overflow-x-auto px-3 py-3"
      style={{ borderTop: "1px solid var(--line-faint)", background: "var(--surface)" }}
    >
      {slides.map((s, i) => {
        const active = i === activeIndex;
        return (
          <button
            key={s.id + ":" + i}
            onClick={() => onPick(i)}
            className="relative shrink-0 overflow-hidden rounded-lg transition-all"
            style={{
              width: 168,
              height: 96,
              background: s.bg ?? "#fff",
              border: active ? "2px solid var(--ink)" : "1px solid var(--line)",
              boxShadow: active ? "0 6px 18px -8px rgba(21,20,15,0.28)" : "none",
            }}
            title={`Slide ${i + 1}`}
          >
            <iframe
              title={`thumb-${s.id}`}
              srcDoc={s.html}
              sandbox="allow-same-origin"
              scrolling="no"
              tabIndex={-1}
              aria-hidden="true"
              style={{
                pointerEvents: "none",
                // Render at slide native width then visually shrink — avoids
                // the iframe trying to mobile-reflow Tailwind utility text.
                width: 1920,
                height: 1080,
                border: 0,
                transform: `scale(${168 / 1920})`,
                transformOrigin: "top left",
              }}
            />
            <span
              className="absolute bottom-1 left-1 rounded px-1.5 py-0.5 text-[9px] tabular-nums"
              style={{
                background: "rgba(0,0,0,0.55)",
                color: "#fff",
                fontFamily: "var(--font-mono)",
              }}
            >
              {i + 1}
            </span>
          </button>
        );
      })}
    </div>
  );
}
