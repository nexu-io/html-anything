import { useRef, useState } from 'react';
import { useI18n } from '../i18n/I18n';
import { browserDiagnostics } from './diagnostics';

export function DiagnosticExport() {
  const { t } = useI18n();
  const pending = useRef(false);
  const [busy, setBusy] = useState(false), [error, setError] = useState('');
  async function download() {
    if (pending.current) return;
    pending.current = true; setBusy(true); setError('');
    try {
      const response = await fetch('/motion-api/diagnostics', { method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ errors: browserDiagnostics() }) });
      if (response.status === 429) throw new Error('Please wait 30 seconds before exporting diagnostics again.');
      if (!response.ok) throw new Error('Could not export diagnostics. Use the command line if Studio cannot connect.');
      const blob = await response.blob();
      const url = URL.createObjectURL(blob), link = document.createElement('a');
      link.href = url; link.download = response.headers.get('Content-Disposition')?.match(/filename="([\w.-]+\.zip)"/)?.[1] || 'openmotion-diagnostics.zip';
      try { document.body.append(link); link.click(); }
      finally { link.remove(); setTimeout(() => URL.revokeObjectURL(url), 1000); }
    } catch (error) { setError(t(error instanceof Error && error.message === 'Please wait 30 seconds before exporting diagnostics again.'
      ? error.message : 'Could not export diagnostics. Use the command line if Studio cannot connect.')); }
    finally { pending.current = false; setBusy(false); }
  }
  return <div className="motion-diagnostic-export">
    <button type="button" onClick={() => void download()} disabled={busy}>{t(busy ? 'Preparing diagnostics…' : 'Export diagnostic ZIP')}</button>
    <p className="motion-media-muted">{t('Saves logs on your device with sensitive values redacted. No upload. Review the ZIP before sharing.')}</p>
    {error && <p role="alert">{error}</p>}
  </div>;
}
