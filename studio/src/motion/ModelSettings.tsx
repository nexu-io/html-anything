import { useEffect, useRef, useState } from 'react';
import { mediaProviders } from '../../../shared/gateway';
import { useI18n } from '../i18n/I18n';
import { gatewayRequest, type GatewayStatus } from './gatewayClient';

export function ModelSettings({ onClose }: { onClose: () => void }) {
  const { t } = useI18n(); const dialog = useRef<HTMLDialogElement>(null);
  const [data, setData] = useState<GatewayStatus | null>(null);
  const [keys, setKeys] = useState<Record<string, string>>({});
  const [origin, setOrigin] = useState('');
  const [busy, setBusy] = useState(false), [error, setError] = useState('');
  useEffect(() => { dialog.current?.showModal(); return () => dialog.current?.close(); }, []);
  useEffect(() => {
    let active = true;
    void gatewayRequest<GatewayStatus>('models/capabilities').then(value => { if (active) { setData(value); setOrigin(value.providers.find(p => p.id === 'opendesign')?.baseUrl ?? ''); } })
      .catch(error => { if (active) setError(error.message); });
    return () => { active = false; };
  }, []);
  async function change(action: () => Promise<unknown>) {
    setBusy(true); setError('');
    try { await action(); setData(await gatewayRequest<GatewayStatus>('models/capabilities')); window.dispatchEvent(new Event('motion:gateway-changed')); }
    catch (error) { setError(error instanceof Error ? error.message : String(error)); }
    finally { setBusy(false); }
  }
  return <dialog ref={dialog} className="motion-model-dialog motion-byok-dialog motion-media-surface" aria-labelledby="model-settings-title" onKeyDown={event => event.stopPropagation()} onCancel={event => { event.preventDefault(); onClose(); }}>
    <header><h2 id="model-settings-title">{t('Media providers')}</h2><button className="motion-media-close" onClick={onClose} aria-label={t('Close model settings')}>×</button></header>
    <p className="motion-media-muted">{t('Save a key to enable a provider.')}</p>
    {error && <p role="alert" className="motion-media-error">{t(error)}</p>}
    {!data && !error && <p role="status">{t('Loading providers…')}</p>}
    {data && <section className="motion-provider-grid">
      {/* Cloud setup is temporarily hidden; keep existing credentials and the service adapter available. */}
      {data.providers.filter(p => p.id !== 'opendesign' && mediaProviders.some(id => id === p.id)).map(provider => <article key={provider.id} className="motion-provider-card">
        <div className="motion-media-row"><strong>{provider.label}</strong><span className="motion-capability-badge" data-available={provider.configured}>{t(provider.configured ? 'Configured' : 'Not configured')}</span></div>
        <p className="motion-media-muted">{t(provider.reason)}</p>
        <div className="motion-byok-links"><a href={provider.id === 'fal' ? 'https://fal.ai/dashboard/keys' : provider.id === 'atlascloud' ? 'https://www.atlascloud.ai/console/api-keys' : provider.id === 'wavespeed' ? 'https://wavespeed.ai/accesskey' : 'https://open-design.ai/cloud/dashboard'} target="_blank" rel="noreferrer">{t('Get API key')}</a>
          <a href={`/motion-api/models/providers/${provider.id}/reference`} target="_blank" rel="noreferrer">{t('Usage guide')}</a></div>
        <form onSubmit={event => { event.preventDefault(); void change(async () => {
          await gatewayRequest(`models/providers/${provider.id}`, 'PUT', { ...(keys[provider.id]?.trim() ? { apiKey: keys[provider.id].trim() } : {}), ...(provider.id === 'opendesign' ? { baseUrl: origin.trim() } : {}) });
          setKeys(prev => ({ ...prev, [provider.id]: '' }));
        }); }}>
          {provider.id === 'opendesign' && <label>{t('API origin')}<input type="url" autoComplete="off" spellCheck={false} required value={origin} onChange={event => setOrigin(event.target.value)} aria-label="OpenDesign Cloud API origin" placeholder="https://…" /><small className="motion-media-muted">{t('Use the gateway address shown on your Cloud API key page.')}</small></label>}
          <label>{t('API key')}<input type="password" autoComplete="off" spellCheck={false} aria-label={`${provider.label} API key`} value={keys[provider.id] ?? ''} placeholder={provider.configured ? t('Key saved · enter to replace') : t('Paste your API key')} onChange={event => setKeys(prev => ({ ...prev, [provider.id]: event.target.value }))} /></label>
          <div className="motion-media-row"><button disabled={busy || (!keys[provider.id]?.trim() && !(provider.id === 'opendesign' && provider.configured && origin !== provider.baseUrl))}>{t('Save settings')}</button>
            {provider.credentialSource === 'stored' && <button type="button" disabled={busy} onClick={() => void change(async () => { await gatewayRequest(`models/providers/${provider.id}`, 'PUT', { apiKey: null }); setKeys(prev => ({ ...prev, [provider.id]: '' })); })}>{t('Remove saved key')}</button>}
          </div>
        </form>
        <small className="motion-media-muted">{t(provider.credentialSource === 'environment' ? 'Using environment key' : 'Keys stay on this computer and are never returned by the API.')}</small>
      </article>)}
    </section>}
  </dialog>;
}
