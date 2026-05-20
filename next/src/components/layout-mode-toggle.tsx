"use client";

import { useStore, type LayoutMode } from "@/lib/store";
import { useT, type DictKey } from "@/lib/i18n";

const MODES: Array<{ id: LayoutMode; tipKey: DictKey; labelKey: DictKey; icon: React.ReactNode }> = [
  {
    id: "editor",
    tipKey: "layout.tip.editor",
    labelKey: "layout.label.editor",
    icon: (
      <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
        <rect x="1.5" y="2.5" width="13" height="11" rx="1.5" stroke="currentColor" strokeWidth="1.2" />
        <rect x="1.5" y="2.5" width="9" height="11" rx="1.5" fill="currentColor" opacity="0.85" />
      </svg>
    ),
  },
  {
    id: "split",
    tipKey: "layout.tip.split",
    labelKey: "layout.label.split",
    icon: (
      <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
        <rect x="1.5" y="2.5" width="13" height="11" rx="1.5" stroke="currentColor" strokeWidth="1.2" />
        <line x1="8" y1="2.5" x2="8" y2="13.5" stroke="currentColor" strokeWidth="1.2" />
      </svg>
    ),
  },
  {
    id: "preview",
    tipKey: "layout.tip.preview",
    labelKey: "layout.label.preview",
    icon: (
      <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
        <rect x="1.5" y="2.5" width="13" height="11" rx="1.5" stroke="currentColor" strokeWidth="1.2" />
        <rect x="5.5" y="2.5" width="9" height="11" rx="1.5" fill="currentColor" opacity="0.85" />
      </svg>
    ),
  },
];

export function LayoutModeToggle() {
  const mode = useStore((s) => s.layoutMode);
  const setMode = useStore((s) => s.setLayoutMode);
  const t = useT();
  return (
    <div
      className="flex items-center gap-0.5 rounded-full p-0.5"
      style={{ background: "var(--surface)", border: "1px solid var(--line)" }}
      role="radiogroup"
      aria-label={t("layout.aria.group")}
    >
      {MODES.map((m) => {
        const active = mode === m.id;
        return (
          <button
            key={m.id}
            role="radio"
            aria-checked={active}
            onClick={() => setMode(m.id)}
            title={t(m.tipKey)}
            aria-label={t(m.labelKey)}
            className="grid h-7 w-7 place-items-center rounded-full transition-colors"
            style={{
              background: active ? "var(--ink)" : "transparent",
              color: active ? "var(--paper)" : "var(--ink-mute)",
            }}
          >
            {m.icon}
          </button>
        );
      })}
    </div>
  );
}
