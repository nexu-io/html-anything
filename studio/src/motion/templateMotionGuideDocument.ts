export type GuideAppearance = {
  theme: 'light' | 'dark';
  background: string;
  text: string;
  muted: string;
  surface: string;
  border: string;
};

// These selectors affect the guide's chrome, never the artwork in its nested demo frames.
const guideStyles = `
html[data-openmotion-guide] { color-scheme: var(--om-guide-scheme); }
html[data-openmotion-guide] body { background: var(--om-guide-background) !important; }
html[data-openmotion-guide="dark"] {
  --bg: var(--om-guide-background); --fg: var(--om-guide-text);
  --muted: var(--om-guide-muted); --line: var(--om-guide-border); --soft: var(--om-guide-surface);
}
html[data-openmotion-guide="dark"] body { color: var(--om-guide-text) !important; }
html[data-openmotion-guide="dark"] :is(.intro, .board-heading, .rule-label, .production, #source-view) :is(h1,h2,h3,strong),
html[data-openmotion-guide="dark"] :is(.quiet, .beat>span, .tab.active, .wordmark) { color: var(--om-guide-text) !important; }
html[data-openmotion-guide="dark"] :is(.type-sheet p, .swatch code, .intro-copy, .intro-copy p, .rule-copy p, .rule-copy ul, .production p, .production li, .board-heading p, .roles, .roles .label, .eyebrow, .tiny, .filmstrip figcaption, .rule-label>span, .beat b, .beat small, th, td, footer, footer p, .demo-controls button, .demo-controls output, .demo-controls select, .demo-params label, .demo-params input[type=text], .demo-presets button, .demo figcaption) { color: var(--om-guide-muted) !important; }
html[data-openmotion-guide="dark"] :is(.type-sheet, .palette, .overview, .shell, .rule.text-only, #source-view pre, .demo-controls, .demo-params, .demo figcaption) { background: var(--om-guide-surface) !important; }
html[data-openmotion-guide="dark"] :is(.identity, .palette, .overview, .type-baseline, .quiet, .shell, .rule, .roles, .roles span, .timeline-sheet, .beats, .beat, .production, .production-rules, footer, th, td, .demo, .demo-controls, .demo-params, .demo-presets button, .demo-params input) { border-color: var(--om-guide-border) !important; }
`;

/** Keep the remote document and its resource base intact inside the existing opaque-origin sandbox. */
export function prepareMotionGuide(source: string, url: string, appearance: GuideAppearance): string {
  const doc = new DOMParser().parseFromString(source, 'text/html');
  if (!doc.querySelector('base[href]')) {
    const base = doc.createElement('base');
    base.href = url;
    doc.head.prepend(base);
  }
  const root = doc.documentElement;
  root.dataset.openmotionGuide = appearance.theme;
  root.style.setProperty('--om-guide-scheme', appearance.theme);
  for (const key of ['background', 'text', 'muted', 'surface', 'border'] as const) {
    root.style.setProperty(`--om-guide-${key}`, appearance[key]);
  }
  const style = doc.createElement('style');
  style.textContent = guideStyles;
  doc.head.append(style);
  const bridge = doc.createElement('script');
  bridge.textContent = `(() => {
    window.addEventListener('message', event => {
      if (event.source !== parent || event.data?.type !== 'openmotion:guide-appearance') return;
      const value = event.data.appearance;
      if (!value || !['light', 'dark'].includes(value.theme)) return;
      const root = document.documentElement;
      root.dataset.openmotionGuide = value.theme;
      root.style.setProperty('--om-guide-scheme', value.theme);
      for (const key of ['background', 'text', 'muted', 'surface', 'border']) {
        if (typeof value[key] === 'string' && CSS.supports('color', value[key])) root.style.setProperty('--om-guide-' + key, value[key]);
      }
    });
  })();`;
  doc.body.append(bridge);
  return '<!doctype html>' + root.outerHTML;
}
