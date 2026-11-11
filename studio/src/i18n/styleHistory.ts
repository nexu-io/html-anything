import type { Translate } from './messages';

const PREFIX = 'Edit layer style: ';
const propertyLabels: Record<string, string> = {
  opacity: 'Opacity', 'font-size': 'Font size', color: 'Color',
  'font-family': 'Font', 'text-align': 'Align', 'background-color': 'Background',
  'line-height': 'Line height', 'letter-spacing': 'Letter spacing',
  'border-radius': 'Radius',
};
const compact = (value: string, limit: number) => {
  const singleLine = value.replace(/\s+/g, ' ').trim();
  return singleLine.length > limit ? singleLine.slice(0, limit - 1) + '…' : singleLine;
};

/** Keep locale-neutral edit details in the existing history label contract. */
export function styleHistoryLabel(target: string, styles: Record<string, string>): string {
  const multiplier = styles['--hf-layer-opacity'];
  const changes = Object.entries(styles)
    .filter(([property]) => !(multiplier !== undefined && property === 'filter'))
    .map(([property, value]) => {
      const key = property === '--hf-layer-opacity' ? 'opacity' : property;
      const number = Number(value);
      const shown = key === 'opacity' && value.trim() && Number.isFinite(number)
        ? `${Math.round(number * 10000) / 100}%` : compact(value, 60);
      return [key, shown];
    });
  return PREFIX + JSON.stringify([compact(target, 48), changes]);
}

/** Old/plain labels remain readable; malformed metadata must never break history. */
export function formatStyleHistoryLabel(label: string, t: Translate): string | null {
  if (!label.startsWith(PREFIX)) return null;
  try {
    const data: unknown = JSON.parse(label.slice(PREFIX.length));
    if (!Array.isArray(data) || data.length !== 2 || typeof data[0] !== 'string' || !Array.isArray(data[1]) || !data[1].length) return null;
    const changes: string[] = [];
    for (const change of data[1]) {
      if (!Array.isArray(change) || change.length !== 2 || change.some(value => typeof value !== 'string')) return null;
      const [property, value] = change as [string, string];
      changes.push(`${t(propertyLabels[property] ?? property)}: ${value || t('Auto')}`);
    }
    return `${data[0]} · ${changes.join(' / ')}`;
  } catch { return null; }
}
