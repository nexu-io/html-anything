import { RemixIcon } from "../icons/RemixIcons";
import { createContext } from "react";
import { useI18n } from '../i18n/I18n';
import { setStudioTheme, useShownStudioTheme } from "../utils/studioTheme";
import { IconButton, Tooltip } from "./ui";

// hyperframes.dev's theme toggle: the same sun and moon, revealing the new theme in a circle from
// the button. A page that paints no frame aborts the transition; the theme is applied by then.
let latest: ViewTransition | null = null;

function reveal(transition: ViewTransition, at: string, radiusPct: number) {
  latest = transition;
  const done = () => {
    if (latest === transition) delete document.documentElement.dataset.themeReveal;
  };
  void transition.finished.then(done, done);
  void transition.ready.then(
    () => {
      document.documentElement.animate(
        { clipPath: [`circle(0% ${at})`, `circle(${radiusPct}% ${at})`] },
        { duration: 500, easing: "ease-in-out", pseudoElement: "::view-transition-new(root)" },
      );
    },
    () => {},
  );
}

function origin(e: React.MouseEvent<HTMLButtonElement>): [number, number] {
  if (e.detail > 0) return [e.clientX, e.clientY];
  const box = e.currentTarget.getBoundingClientRect();
  return [box.left + box.width / 2, box.top + box.height / 2];
}

/** On only in Studio's own app; a host that embeds Studio owns its theme. */
export const ShowThemeToggle = createContext(false);

function cannotReveal(): boolean {
  return (
    !document.startViewTransition ||
    window.matchMedia?.("(prefers-reduced-motion: reduce)").matches === true
  );
}

const iconProps = {
  width: "14",
  height: "14",
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: "2",
  strokeLinecap: "round",
  strokeLinejoin: "round",
  "aria-hidden": true,
} as const;

export function ThemeToggle() {
  const { t } = useI18n();
  const isDark = useShownStudioTheme() === "dark";
  const label = t(isDark ? 'Switch to light theme' : 'Switch to dark theme');

  function toggle(e: React.MouseEvent<HTMLButtonElement>) {
    const apply = () => setStudioTheme(isDark ? "light" : "dark");
    if (cannotReveal()) return apply();
    const [x, y] = origin(e);
    const w = window.innerWidth;
    const h = window.innerHeight;
    const maxRadius = Math.hypot(Math.max(x, w - x), Math.max(y, h - y));
    const at = `at ${(x / w) * 100}% ${(y / h) * 100}%`;
    const radiusPct = (maxRadius / (Math.hypot(w, h) / Math.SQRT2)) * 100;
    // The switch stays synchronous inside the callback: rendering is paused during it.
    document.documentElement.dataset.themeReveal = "";
    reveal(document.startViewTransition(apply), at, radiusPct);
  }

  return (
    <Tooltip label={label} side="bottom">
      <IconButton
        onClick={toggle}
        aria-label={label}
        icon={
          isDark ? (
            <RemixIcon name="sun-line" {...iconProps} />
          ) : (
            <RemixIcon name="moon-line" {...iconProps} />
          )
        }
      />
    </Tooltip>
  );
}
