import { useEffect, useRef, useState } from 'react';
import { useShownStudioTheme } from '../utils/studioTheme';
import { prepareMotionGuide, type GuideAppearance } from './templateMotionGuideDocument';

export function TemplateMotionGuide({ url, title }: { url: string; title: string }) {
  const frame = useRef<HTMLIFrameElement>(null);
  const theme = useShownStudioTheme();
  const latestTheme = useRef(theme);
  latestTheme.current = theme;
  const [document, setDocument] = useState<{ url: string; html?: string }>({ url: '' });
  function appearance(): GuideAppearance {
    const style = getComputedStyle(frame.current!);
    return {
      theme: latestTheme.current,
      background: style.backgroundColor,
      text: style.getPropertyValue('--motion-text').trim(),
      muted: style.getPropertyValue('--motion-muted').trim(),
      surface: style.getPropertyValue('--motion-panel').trim(),
      border: style.getPropertyValue('--motion-border').trim(),
    };
  }
  function syncAppearance() {
    // The iframe deliberately has an opaque origin, so targetOrigin must be '*'.
    frame.current?.contentWindow?.postMessage({ type: 'openmotion:guide-appearance', appearance: appearance() }, '*');
  }
  useEffect(() => { syncAppearance(); }, [theme]);
  useEffect(() => {
    const controller = new AbortController();
    async function load() {
      try {
        const response = await fetch(url, { signal: controller.signal, credentials: 'omit', referrerPolicy: 'no-referrer' });
        if (!response.ok || !response.headers.get('content-type')?.includes('text/html')) throw new Error('Guide unavailable');
        const source = await response.text();
        if (!controller.signal.aborted) setDocument({ url, html: prepareMotionGuide(source, response.url || url, appearance()) });
      } catch {
        // Keep guides usable when a remote host does not permit CORS reads.
        if (!controller.signal.aborted) setDocument({ url });
      }
    }
    void load();
    return () => controller.abort();
  }, [url]);
  const current = document.url === url ? document : undefined;
  return <iframe ref={frame} src={current && current.html === undefined ? url : undefined}
    srcDoc={current?.html ?? (current ? undefined : '')} title={title} onLoad={syncAppearance}
    sandbox="allow-scripts" loading="lazy" referrerPolicy="no-referrer" />;
}
