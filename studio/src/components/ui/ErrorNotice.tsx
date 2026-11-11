import { useId, useState } from 'react';
import { useI18n } from '../../i18n/I18n';
import { RemixIcon } from '../../icons/RemixIcons';
import { errorNoticeMessage, type ErrorContext } from './errorNoticeMessage';
import './errorNotice.css';

export function ErrorNotice({ message, context = 'operation', compact = false, action, onDismiss }: {
  message: string;
  context?: ErrorContext;
  compact?: boolean;
  action?: { label: string; run: () => void; busy?: boolean };
  onDismiss?: () => void;
}) {
  const { t } = useI18n();
  const id = useId();
  const [expanded, setExpanded] = useState(false);
  const [copyState, setCopyState] = useState<'idle' | 'copied' | 'failed'>('idle');
  const summary = errorNoticeMessage(message, context);
  const copy = async () => {
    try { await navigator.clipboard.writeText(message); setCopyState('copied'); }
    catch { setCopyState('failed'); }
  };
  return <div className={`motion-error-notice${compact ? ' motion-error-notice-compact' : ''}`}>
    <div className="motion-error-notice-row">
      <p className="motion-error-notice-summary" role="alert">{t(summary)}</p>
      {onDismiss && <button type="button" className="motion-error-notice-close" aria-label={t('Dismiss error')} onClick={onDismiss}><RemixIcon name="close-line" size={14} /></button>}
    </div>
    <div className="motion-error-notice-actions">
      {action && <button type="button" className="motion-error-notice-action" onClick={action.run} disabled={action.busy}>{t(action.busy ? 'Checking…' : action.label)}</button>}
      <button type="button" aria-label={t(expanded ? 'Hide error details' : 'Error details')} aria-expanded={expanded} aria-controls={id} onClick={() => setExpanded(value => !value)}>{t(expanded ? 'Hide error details' : 'Error details')}</button>
    </div>
    {expanded && <div id={id} className="motion-error-notice-details">
      <pre tabIndex={0} aria-label={t('Error details')}>{message}</pre>
      <button type="button" onClick={() => void copy()}>{t(copyState === 'copied' ? 'Copied!' : 'Copy error information')}</button>
      <span role="status">{copyState === 'failed' ? t('Copy failed. Select the details to copy them.') : copyState === 'copied' ? t('Copied!') : ''}</span>
    </div>}
  </div>;
}
