import type { Translate } from './I18n';
import { formatStyleHistoryLabel } from './styleHistory';

// Translate system descriptions without changing persisted history or file paths.
export function historyEntryLabel(label: string, t: Translate): string {
  if (label === 'Changed outside the app') return t('External change');
  if (label.startsWith('Undid: ')) return t('Undo: {label}', { label: historyEntryLabel(label.slice(7), t) });
  if (label.startsWith('Redid: ')) return t('Redo: {label}', { label: historyEntryLabel(label.slice(7), t) });
  const style = formatStyleHistoryLabel(label, t);
  if (style) return style;
  const addedBlock = /^Add (block|component): (.+)$/s.exec(label);
  if (addedBlock) return t(addedBlock[1] === 'block' ? 'Add block: {name}' : 'Add component: {name}', { name: addedBlock[2] });
  const track = /^(Show|Hide) track (\d+)$/.exec(label);
  if (track) return t(track[1] === 'Show' ? 'Show track {number}' : 'Hide track {number}', { number: track[2] });
  const split = /^Split (\d+) clips at ([\d.]+)s$/.exec(label);
  if (split) return t('Split {count} clips at {time}s', { count: Number(split[1]), time: split[2] });
  const property = /^Edit (muted|volume|opacity|color|font-size|text|width|height|position)$/.exec(label)?.[1];
  return property ? t('Edit {property}', { property: t(property) }) : t(label);
}
