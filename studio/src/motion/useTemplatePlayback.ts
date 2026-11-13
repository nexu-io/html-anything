import { useEffect, useRef, useState, type RefObject } from 'react';

export const MAX_TEMPLATE_PLAYERS = 8;
/** One observer and a bounded decoder budget for the whole gallery. No offscreen video sources. */
export function useTemplatePlayback(root: RefObject<HTMLElement | null>, catalogKey: string, enabled: boolean, autoplay: boolean, priority: string | null) {
  const [active, setActive] = useState<Set<string>>(new Set());
  const controls = useRef({ autoplay, priority });
  const refresh = useRef<() => void>(() => {});
  useEffect(() => { controls.current = { autoplay, priority }; refresh.current(); }, [autoplay, priority]);
  useEffect(() => {
    const container = root.current;
    if (!container || !enabled) { setActive(new Set()); return; }
    const media = matchMedia('(prefers-reduced-motion: reduce)');
    const compact = matchMedia('(max-width: 699px)');
    const connection = (navigator as Navigator & { connection?: EventTarget & { saveData?: boolean } }).connection;
    const visible = new Map<string, number>();
    const update = () => {
      const { autoplay, priority } = controls.current;
      const allowed = autoplay && !document.hidden && !media.matches;
      const candidates = [...visible].sort((a, b) => Number(b[0] === priority) - Number(a[0] === priority) || b[1] - a[1]);
      const ids = allowed ? candidates.filter(([id]) => !connection?.saveData || id === priority).slice(0, compact.matches ? 4 : MAX_TEMPLATE_PLAYERS).map(([id]) => id) : [];
      setActive(previous => previous.size === ids.length && ids.every(id => previous.has(id)) ? previous : new Set(ids));
    };
    refresh.current = update;
    const observer = new IntersectionObserver(entries => {
      for (const entry of entries) {
        const id = (entry.target as HTMLElement).dataset.templateId!;
        if (entry.isIntersecting && entry.intersectionRatio >= 0.2) visible.set(id, entry.intersectionRatio);
        else visible.delete(id);
      }
      update();
    }, { root: container, threshold: [0, 0.2, 0.5, 1] });
    container.querySelectorAll('[data-template-id][data-has-video="true"]').forEach(element => observer.observe(element));
    document.addEventListener('visibilitychange', update);
    media.addEventListener('change', update); compact.addEventListener('change', update);
    connection?.addEventListener('change', update);
    update();
    return () => {
      refresh.current = () => {};
      observer.disconnect(); document.removeEventListener('visibilitychange', update);
      media.removeEventListener('change', update); compact.removeEventListener('change', update); connection?.removeEventListener('change', update);
    };
  }, [root, catalogKey, enabled]);
  return active;
}
