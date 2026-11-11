import { redactDiagnostic } from '../../../scripts/diagnostic-redaction.mjs';

const storageKey = 'motion.local-diagnostics.v1';
type DiagnosticError = { time: string; kind: string; message: string; stack: string };
export function browserDiagnostics(): DiagnosticError[] {
  try {
    const text = localStorage.getItem(storageKey) || '[]';
    if (text.length > 24 * 1024) return [];
    const entries: unknown = JSON.parse(text);
    return Array.isArray(entries) ? entries.filter((entry): entry is DiagnosticError => entry && typeof entry === 'object'
      && Object.keys(entry).length === 4 && ['time', 'kind', 'message', 'stack'].every(key => typeof entry[key] === 'string' && entry[key].length <= 4096)).slice(-20) : [];
  } catch { return []; }
}

export function recordBrowserDiagnostic(kind: string, message: string, stack = '') {
  try {
    const clean = (text: string) => redactDiagnostic(text.slice(0, 8192)).slice(0, 4096);
    const event = { time: new Date().toISOString(), kind, message: clean(message), stack: clean(stack) };
    const entries = [...browserDiagnostics(), event].slice(-20);
    while (new TextEncoder().encode(JSON.stringify(entries)).length > 24 * 1024) entries.shift();
    try { localStorage.setItem(storageKey, JSON.stringify(entries)); } catch { /* Disk logging can still work without browser storage. */ }
    // The local backend persists a bounded copy for CLI export after a browser crash.
    void fetch('/motion-api/diagnostics/events', { method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ errors: [event] }) }).catch(() => {});
  } catch { /* Diagnostic capture must not break the editor or recurse on network failures. */ }
}
