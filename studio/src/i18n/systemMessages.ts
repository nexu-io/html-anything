import { historyFailureMessage } from "./editorErrors";
import type { Translate } from './I18n';
import { historyEntryLabel } from './historyMessages';

// Only known system messages are interpreted. Captured names, paths and server
// details are passed through as values, never translated as interface labels.
const TEMPLATES = [
  "Copied element info for {name}. Paste it into any AI agent",
  "{label}: no change applied",
  "Applied color grading on {count} media item",
  "Applied color grading on {count} media items",
  "Cleared color grading on {count} media item",
  "Cleared color grading on {count} media items",
  "Use the razor tool ({key}) to split clips inside a sub-composition",
  "Couldn't save \"{name}\": {message}",
  "Couldn't apply color grading: {message}",
  "Couldn't assign element id: element not found in {path}",
  "Saved, but couldn't finish updating {path}: {message}",
  "Couldn't save the text edit: {message}",
  "Couldn't save {path}. Your latest edits are NOT persisted. Check the preview server; editing again retries the save.",
  "Deleting {name}...",
  "Deleted {name}. Use Undo to restore it.",
  "Deleted {name}. Use Undo to restore them.",
  "Not added: {message}",
  "Added {name}, {message}",
  "Froze a 2 s still at {time}s",
  "Recorded {count} keyframes",
  "Gesture commit failed: {message}",
  "Couldn't save animation: {message}",
  "Created transparent asset: {name}",

  'Split {count} clips at {time}s', 'Split {name} at {time}s',
  'Some animations use non-ID selectors ({selectors}) and were not retargeted',

  'Adding {name}…',
  "Couldn't find the current value in {path}. It may have been edited by hand.",
  '"{value}" appears {count}× in {path}. The panel can\'t tell which one belongs to this parameter, so it won\'t risk changing unrelated content. Edit the file directly to disambiguate.',
  "Up {value} dB",
  "Down {value} dB",
  "Cutting everything below {frequency}",
  "Muffled above {frequency}",
  "Sitting on {frequency}, doing nothing yet",
  "Lifting {frequency} by {value} dB",
  "Cutting {frequency} by {value} dB",
  "More weight below {frequency}",
  "Less weight below {frequency}",
  "More sparkle above {frequency}",
  "Less sparkle above {frequency}",
  "Peaks pulled down toward {value} dB",
  "Peaks pulled down toward {value} dBTP",
  "Closing gaps quieter than {value} dB",
  "Crushed to {value} bits",
  "Up {value} semitones",
  "Down {value} semitones",
  "Echo every {value} ms",
  "Sets {count} settings at once. Open Details to see where they land.",
  "{count}-band",
  'Copied {count} clips', 'Pasted {count} clips', 'Duplicated {count} clips',
  'Unable to copy "{name}".', 'Upload failed ({status})',
  'Failed to load {path}', 'Skipped (too large): {files}',
  "Couldn't create folder {path}: {message}", "Couldn't create {path}: {message}",
  "Couldn't delete {path}: {message}", "Couldn't rename {path}: {message}",
  "Couldn't duplicate {path}: {message}",
];
const patterns = TEMPLATES.map(template => {
  const keys: string[] = [];
  const pattern = template.split(/(\{\w+\})/).map(part => {
    if (/^\{\w+\}$/.test(part)) { keys.push(part.slice(1, -1)); return '(.+?)'; }
    return part.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }).join('');
  return { template, keys, regex: new RegExp(`^${pattern}$`, 's') };
});

export function systemMessage(message: string, t: Translate): string {
  const restore = /^VERSION_NOT_RESTORABLE: (Historical files are missing, unreadable or corrupt|Cannot stage historical file): (.+)$/s.exec(message);
  if (restore) return t(restore[1] === 'Cannot stage historical file'
    ? 'Could not prepare historical files for restoration: {files}. Your current project is unchanged.'
    : 'Historical files are missing, unreadable or damaged: {files}. This version was not restored. Your current project is unchanged.', { files: restore[2] });
  const plainHistory = /^(Undid|Redid) (.+)$/s.exec(message);
  if (plainHistory) return t(plainHistory[1] === 'Undid' ? 'Undid {label}' : 'Redid {label}', { label: historyEntryLabel(plainHistory[2], t) });
  const history = /^(Undid|Redid): (.+)$/s.exec(message);
  if (history) return t(history[1] === 'Undid' ? 'Undid: {label}' : 'Redid: {label}', {
    label: historyEntryLabel(history[2], t),
  });
  const failed = /^(Undo|Redo) failed: (.*)$/s.exec(message);
  if (failed) return t('{action} failed: {message}', { action: t(failed[1]), message: historyFailureMessage(failed[2], t) });
  const conflict = /^Can't (undo|redo): (.*) changed since that edit\.$/s.exec(message);
  if (conflict) return t("Can't {action}: {paths} changed since that edit.", {
    action: t(conflict[1]), paths: conflict[2],
  });
  for (const { template, keys, regex } of patterns) {
    const match = regex.exec(message);
    if (match) return t(template, Object.fromEntries(keys.map((key, index) => [key, key === "message" ? t(match[index + 1]) : match[index + 1]])));
  }
  return t(message);
}
