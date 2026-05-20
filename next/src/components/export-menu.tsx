"use client";

import { useMemo, useState, useRef, useEffect } from "react";
import { useStore, selectActiveTask } from "@/lib/store";
import { useT } from "@/lib/i18n";
import { copyToWechat } from "@/lib/export/wechat";
import { copyToZhihu } from "@/lib/export/zhihu";
import { copyHtml, copyText } from "@/lib/export/clipboard";
import {
  copyIframeToClipboard,
  downloadIframeAsImage,
} from "@/lib/export/image";
import { downloadHtml } from "@/lib/export/download";
import { extractHtml } from "@/lib/extract-html";
import { parseDeck } from "@/lib/deck";
import {
  exportDeckPngZip,
  exportDeckPptx,
  exportDeckPrint,
} from "@/lib/export/deck";
import { parseHyperframes } from "@/lib/hyperframes";
import { exportRemotionZip } from "@/lib/export/remotion";

type ExportMenuProps = {
  iframeRef: React.MutableRefObject<HTMLIFrameElement | null>;
};

export function ExportMenu({ iframeRef }: ExportMenuProps) {
  const html = useStore((s) => selectActiveTask(s)?.html ?? "");
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const ref = useRef<HTMLDivElement>(null);
  const t = useT();

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (open && ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2200);
  };

  const wrap =
    (label: string, fn: () => Promise<void>) =>
    async () => {
      setBusy(true);
      try {
        await fn();
        showToast(`✓ ${label}`);
      } catch (e) {
        showToast(`✗ ${e instanceof Error ? e.message : t("export.error.generic")}`);
      } finally {
        setBusy(false);
        setOpen(false);
      }
    };

  const cleanHtml = () => extractHtml(html);
  // Re-parse for the deck section. Cheap because parseDeck is regex-only and
  // the menu only opens on user click.
  const deck = useMemo(() => parseDeck(extractHtml(html)), [html]);
  const hyperframes = useMemo(() => parseHyperframes(extractHtml(html)), [html]);

  const sections: Array<{
    title: string;
    actions: Array<{ id: string; label: string; emoji: string; fn: () => Promise<void> }>;
  }> = [
    {
      title: t("export.section.platform"),
      actions: [
        { id: "wechat", label: t("export.action.wechat"), emoji: "💬", fn: wrap(t("export.toast.wechat"), async () => { await copyToWechat(cleanHtml()); }) },
        { id: "zhihu",  label: t("export.action.zhihu"),  emoji: "🦓", fn: wrap(t("export.toast.zhihu"), async () => { await copyToZhihu(cleanHtml()); }) },
        { id: "twitter-img", label: t("export.action.twitterImg"), emoji: "🐦", fn: wrap(t("export.toast.image"), async () => {
          if (!iframeRef.current) throw new Error(t("export.error.previewNotReady")); await copyIframeToClipboard(iframeRef.current);
        }) },
      ],
    },
    {
      title: t("export.section.raw"),
      actions: [
        { id: "html", label: t("export.action.html"), emoji: "</>", fn: wrap(t("export.toast.html"), async () => { await copyHtml(cleanHtml()); }) },
        { id: "text", label: t("export.action.text"), emoji: "📝",  fn: wrap(t("export.toast.text"), async () => {
          const tmp = document.createElement("div"); tmp.innerHTML = cleanHtml(); await copyText(tmp.textContent ?? "");
        }) },
      ],
    },
    {
      title: t("export.section.download"),
      actions: [
        { id: "download-html", label: t("export.action.downloadHtml"), emoji: "💾", fn: wrap(t("export.toast.htmlSaved"), async () => { downloadHtml(cleanHtml()); }) },
        { id: "download-png",  label: t("export.action.downloadPng"),  emoji: "🖼️", fn: wrap(t("export.toast.imgSaved"), async () => {
          if (!iframeRef.current) throw new Error(t("export.error.previewNotReady")); await downloadIframeAsImage(iframeRef.current);
        }) },
      ],
    },
    ...(deck.isDeck
      ? [
          {
            title: t("export.section.deck", { n: deck.slides.length }),
            actions: [
              {
                id: "deck-pdf",
                label: t("export.action.deckPdf"),
                emoji: "📄",
                fn: wrap(t("export.toast.deckPdf"), async () => {
                  exportDeckPrint(deck.slides, deck.title);
                }),
              },
              {
                id: "deck-png-zip",
                label: t("export.action.deckPngZip"),
                emoji: "🗂️",
                fn: wrap(t("export.toast.deckPngZip"), async () => {
                  await exportDeckPngZip(deck.slides, deck.title);
                }),
              },
              {
                id: "deck-pptx",
                label: t("export.action.deckPptx"),
                emoji: "🎬",
                fn: wrap(t("export.toast.deckPptx"), async () => {
                  await exportDeckPptx(deck.slides, deck.title);
                }),
              },
            ],
          },
        ]
      : []),
    ...(hyperframes.isHyperframes
      ? [
          {
            title: t("export.section.hyperframes", { n: hyperframes.frames.length }),
            actions: [
              {
                id: "hyperframes-remotion-zip",
                label: t("export.action.remotionZip"),
                emoji: "🎞️",
                fn: wrap(t("export.toast.remotionZip"), async () => {
                  await exportRemotionZip(hyperframes, hyperframes.title, {
                    sourceHtml: cleanHtml(),
                  });
                }),
              },
            ],
          },
        ]
      : []),
  ];

  const disabled = !html || busy;

  return (
    <div className="relative" ref={ref}>
      <button onClick={() => setOpen((o) => !o)} disabled={disabled} className="btn-ink">
        {t("export.button")}
      </button>
      {open && (
        <div
          data-testid="export-menu"
          className="absolute right-0 z-30 mt-2 w-72 od-fade-in overflow-hidden rounded-2xl"
          style={{
            background: "var(--surface)",
            border: "1px solid var(--line-soft)",
            boxShadow: "0 30px 60px -20px rgba(21, 20, 15, 0.25)",
          }}
        >
          {sections.map((sec, sIdx) => (
            <div key={sec.title} style={sIdx ? { borderTop: "1px solid var(--line-faint)" } : undefined}>
              <div className="px-4 pt-3 pb-1.5 text-[10px] uppercase tracking-[0.18em] text-[var(--ink-faint)]">
                {sec.title}
              </div>
              <div className="px-1 pb-1">
                {sec.actions.map((a) => (
                  <button
                    key={a.id}
                    onClick={a.fn}
                    className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left text-[13px] hover:bg-[var(--paper)]"
                  >
                    <span className="w-6 text-center">{a.emoji}</span>
                    <span className="text-[var(--ink-soft)]">{a.label}</span>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
      {toast && (
        <div
          className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-full px-4 py-2 text-sm shadow-lg od-fade-in"
          style={{ background: "var(--ink)", color: "var(--paper)" }}
        >
          {toast}
        </div>
      )}
    </div>
  );
}
