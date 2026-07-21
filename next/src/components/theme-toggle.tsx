"use client";

import { useSyncExternalStore } from "react";
import { useT } from "@/lib/i18n";

type Theme = "light" | "dark";

// The boot script in layout.tsx applies data-theme before hydration, so the
// <html> attribute — not React state — is the source of truth for the theme.
function readTheme(): Theme {
  return document.documentElement.dataset.theme === "dark" ? "dark" : "light";
}

function subscribe(onChange: () => void): () => void {
  const observer = new MutationObserver(onChange);
  observer.observe(document.documentElement, { attributeFilter: ["data-theme"] });
  return () => observer.disconnect();
}

export function ThemeToggle() {
  // Server snapshot matches the SSR markup; useSyncExternalStore re-reads the
  // live attribute before first paint, so a dark reload never shows the light
  // icon, a stale aria-pressed, or a no-op first click.
  const theme = useSyncExternalStore(subscribe, readTheme, () => "light");
  const t = useT();

  const toggle = () => {
    const next: Theme = readTheme() === "dark" ? "light" : "dark";
    document.documentElement.dataset.theme = next; // observer re-renders us
    try {
      localStorage.setItem("html-anything-theme", next);
    } catch {
      /* private mode — theme still applies for this session */
    }
  };

  const label = t("toolbar.toggleTheme");
  return (
    <button
      onClick={toggle}
      className="grid h-9 w-9 place-items-center rounded-full border text-[var(--ink-soft)] transition-all hover:border-[var(--ink)]/30 hover:text-[var(--ink)]"
      style={{ background: "var(--surface)", borderColor: "var(--line)" }}
      title={label}
      aria-label={label}
      aria-pressed={theme === "dark"}
    >
      {theme === "dark" ? (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="4" />
          <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
        </svg>
      ) : (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
        </svg>
      )}
    </button>
  );
}
