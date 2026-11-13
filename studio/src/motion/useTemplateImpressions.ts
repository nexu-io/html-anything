import { useEffect, useRef, type RefObject } from 'react';

/**
 * Calls `onSeen(id)` once a gallery card has stayed at least half visible, in a visible tab, for one unbroken second.
 * One observer serves the whole gallery. `resultKey` names the current search, filter and sort combination: when it
 * changes, cards still on screen are timed again. `onSeen` returns false to be asked again after another second.
 */
export function useTemplateImpressions(root: RefObject<HTMLElement | null>, catalogKey: string, enabled: boolean, resultKey: string, onSeen: (id: string) => boolean) {
  const seen = useRef(onSeen); seen.current = onSeen;
  const restart = useRef<() => void>(() => {});
  useEffect(() => {
    const container = root.current;
    if (!container || !enabled || typeof IntersectionObserver === 'undefined') return;
    const inView = new Set<string>(), timers = new Map<string, ReturnType<typeof setTimeout>>(), done = new Set<string>();
    const stop = (id: string) => { clearTimeout(timers.get(id)); timers.delete(id); };
    const start = (id: string) => {
      if (done.has(id) || !inView.has(id) || document.hidden || timers.has(id)) return;
      timers.set(id, setTimeout(() => { timers.delete(id); if (seen.current(id)) done.add(id); else start(id); }, 1000));
    };
    const observer = new IntersectionObserver(entries => {
      for (const entry of entries) {
        const id = (entry.target as HTMLElement).dataset.templateId!;
        if (entry.isIntersecting && entry.intersectionRatio >= 0.5) { inView.add(id); start(id); } else { inView.delete(id); stop(id); }
      }
    }, { root: container, threshold: 0.5 });
    container.querySelectorAll('[data-template-id]').forEach(element => observer.observe(element));
    const visibility = () => { for (const id of inView) { if (document.hidden) stop(id); else start(id); } };
    document.addEventListener('visibilitychange', visibility);
    restart.current = () => { done.clear(); for (const id of inView) { stop(id); start(id); } };
    return () => {
      restart.current = () => {};
      for (const id of [...timers.keys()]) stop(id);
      observer.disconnect(); document.removeEventListener('visibilitychange', visibility);
    };
  }, [root, catalogKey, enabled]);
  useEffect(() => { restart.current(); }, [resultKey]);
}
