import { useEffect, useRef, useState } from 'react';
import { trackStudioClick } from './editorTracking';
import { useI18n } from '../i18n/I18n';
import { motionApi } from './useWorkspace';
import { setMotionTrackingEnabled } from './tracking';

type Status = { enabled: boolean; preference: boolean; locked: boolean; reason?: 'test_build' | 'environment' | null };
export function PrivacySettings({ onClose }: { onClose: () => void }) {
  const { t } = useI18n(), dialog = useRef<HTMLDialogElement>(null);
  const [status, setStatus] = useState<Status | null>(null), [busy, setBusy] = useState(false), [error, setError] = useState('');
  useEffect(() => { dialog.current?.showModal(); return () => dialog.current?.close(); }, []);
  useEffect(() => {
    const controller = new AbortController();
    void motionApi<Status>('/tracking/preferences', { signal: controller.signal }).then(setStatus)
      .catch(() => { if (!controller.signal.aborted) setError(t('Could not load privacy settings.')); });
    return () => controller.abort();
  }, [t]);
  async function change(enabled: boolean) {
    if (!enabled) setMotionTrackingEnabled(false);
    setBusy(true); setError('');
    try {
      const next = await motionApi<Status>('/tracking/preferences', { method: 'PUT', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ enabled }) });
      setStatus(next); setMotionTrackingEnabled(next.enabled);
      // Reported after the saved preference applies, so turning sharing off sends nothing.
      trackStudioClick('project_drawer', 'usage_data_toggle', undefined, undefined, next.enabled ? 'on' : 'off');
    } catch { setError(t('Could not save privacy settings.')); }
    finally { setBusy(false); }
  }
  return <dialog ref={dialog} className="motion-model-dialog motion-media-surface motion-privacy-dialog" aria-labelledby="privacy-settings-title" onCancel={event => { event.preventDefault(); onClose(); }}>
    <header><h2 id="privacy-settings-title">{t('Privacy settings')}</h2><button className="motion-media-close" aria-label={t('Close')} onClick={onClose}>×</button></header>
    <section><label className="motion-media-toggle"><input type="checkbox" checked={status?.enabled ?? false} disabled={!status || busy || status.locked} onChange={event => void change(event.target.checked)} />{t('Share usage data')}</label>
      <p>{t('Send feature usage, error categories and approximate region to improve OpenMotion. Prompts and project contents are excluded.')}</p>
      <p className="motion-media-muted">{t('This setting applies to MCP and Studio on this installation and is kept after restart.')}</p>
      {status?.locked && <p role="status">{t(status.reason === 'test_build' ? 'Usage data collection is disabled in test builds.' : 'Disabled by your environment settings.')}</p>}
      {error && <p role="alert">{error}</p>}
    </section>
  </dialog>;
}
