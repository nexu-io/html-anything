'use client';

import { useEffect, useRef, useState } from 'react';
import { useT } from '@/lib/i18n';
import { selectActiveTask, useStore } from '@/lib/store';

type PreviewSummary = {
  hasPreview: boolean;
  canonicalUrl?: string;
  expiresAt?: string | null;
  updatedAt?: string;
};

type PublishResponse = {
  operation: 'create' | 'update';
  preview: PreviewSummary;
};

type ApiError = {
  error?: string;
};

type ActionStatus = 'idle' | 'loading' | 'sharing' | 'updating' | 'revoking';

const EMPTY_PREVIEW: PreviewSummary = { hasPreview: false };

export function TempmdShareControl() {
  const task = useStore(selectActiveTask);
  const locale = useStore((state) => state.locale);
  const t = useT();
  const containerRef = useRef<HTMLDivElement>(null);
  const [preview, setPreview] = useState<PreviewSummary>(EMPTY_PREVIEW);
  const [status, setStatus] = useState<ActionStatus>('loading');
  const [panelOpen, setPanelOpen] = useState(false);
  const [disclosureOpen, setDisclosureOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setPreview(EMPTY_PREVIEW);
    if (!task?.id) {
      setStatus('idle');
      setError(null);
      return;
    }
    const controller = new AbortController();
    setStatus('loading');
    setError(null);
    fetch(`/api/share/tempmd?taskId=${encodeURIComponent(task.id)}`, {
      cache: 'no-store',
      signal: controller.signal,
    })
      .then(async (response) => {
        const body = (await response.json()) as PreviewSummary | ApiError;
        if (!response.ok) throw new Error(apiErrorMessage(body, response.status));
        setPreview(body as PreviewSummary);
      })
      .catch((requestError: unknown) => {
        if (!controller.signal.aborted) {
          setError(requestError instanceof Error ? requestError.message : String(requestError));
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setStatus('idle');
      });
    return () => controller.abort();
  }, [task?.id]);

  useEffect(() => {
    if (!panelOpen && !disclosureOpen) return;
    const closeOnOutsideClick = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) {
        setPanelOpen(false);
        setDisclosureOpen(false);
      }
    };
    document.addEventListener('mousedown', closeOnOutsideClick);
    return () => document.removeEventListener('mousedown', closeOnOutsideClick);
  }, [panelOpen, disclosureOpen]);

  useEffect(() => {
    if (!copied) return;
    const timeout = setTimeout(() => setCopied(false), 1500);
    return () => clearTimeout(timeout);
  }, [copied]);

  const html = task?.html ?? '';
  const busy = ['sharing', 'updating', 'revoking'].includes(status);
  const disabled =
    busy || status === 'loading' || (!preview.hasPreview && html.length === 0);

  const publish = async () => {
    if (!task || !html || busy) return;
    const operation = preview.hasPreview ? 'updating' : 'sharing';
    setStatus(operation);
    setError(null);
    setDisclosureOpen(false);
    try {
      const response = await fetch('/api/share/tempmd', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ taskId: task.id, html }),
      });
      const body = (await response.json()) as PublishResponse | ApiError;
      if (!response.ok) throw new Error(apiErrorMessage(body, response.status));
      setPreview((body as PublishResponse).preview);
      setPanelOpen(true);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : String(requestError));
      setPanelOpen(true);
    } finally {
      setStatus('idle');
    }
  };

  const revoke = async () => {
    if (!task || busy || !preview.hasPreview) return;
    if (!window.confirm(t('share.tempmd.revokeConfirm'))) return;
    setStatus('revoking');
    setError(null);
    try {
      const response = await fetch('/api/share/tempmd', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ taskId: task.id }),
      });
      const body = (await response.json()) as { preview?: PreviewSummary } | ApiError;
      if (!response.ok) throw new Error(apiErrorMessage(body, response.status));
      setPreview(EMPTY_PREVIEW);
      setPanelOpen(false);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : String(requestError));
    } finally {
      setStatus('idle');
    }
  };

  const copy = async () => {
    if (!preview.canonicalUrl) return;
    try {
      await navigator.clipboard.writeText(preview.canonicalUrl);
      setCopied(true);
    } catch {
      // The visible URL remains selectable if clipboard permission is denied.
    }
  };

  const onPrimaryClick = () => {
    setError(null);
    if (preview.hasPreview) {
      setPanelOpen((open) => !open);
      setDisclosureOpen(false);
      return;
    }
    setDisclosureOpen(true);
    setPanelOpen(false);
  };

  return (
    <div ref={containerRef} className='relative inline-flex'>
      <button
        type='button'
        onClick={onPrimaryClick}
        disabled={disabled}
        aria-expanded={panelOpen || disclosureOpen}
        title={html.length === 0 ? t('share.tempmd.disabled') : t('share.tempmd.button')}
        className='rounded-full border px-3 py-1.5 text-[12px] font-medium transition-all hover:border-[var(--coral)] disabled:cursor-not-allowed disabled:opacity-45'
        style={{
          background: preview.hasPreview ? 'var(--coral-soft)' : 'var(--surface)',
          borderColor: preview.hasPreview ? 'var(--coral)' : 'var(--line)',
          color: preview.hasPreview ? 'var(--coral)' : 'var(--ink-soft)',
        }}
      >
        {status === 'sharing'
          ? t('share.tempmd.sharing')
          : status === 'updating'
            ? t('share.tempmd.updating')
            : status === 'revoking'
              ? t('share.tempmd.revoking')
              : `⏱ ${t('share.tempmd.button')}`}
      </button>

      {disclosureOpen && (
        <div
          role='dialog'
          aria-label={t('share.tempmd.disclosureTitle')}
          className='absolute right-0 top-[calc(100%+6px)] z-50 w-[340px] rounded-xl p-4 text-[12px] shadow-xl'
          style={{
            background: 'var(--paper)',
            border: '1px solid var(--line-soft)',
            color: 'var(--ink)',
          }}
        >
          <div className='font-semibold'>{t('share.tempmd.disclosureTitle')}</div>
          <p className='mt-2 leading-relaxed text-[var(--ink-mute)]'>
            {t('share.tempmd.disclosureBody')}
          </p>
          <p className='mt-2 leading-relaxed text-[var(--ink-mute)]'>
            {t('share.tempmd.disclosureExpiry')}
          </p>
          <div className='mt-4 flex justify-end gap-2'>
            <button
              type='button'
              onClick={() => setDisclosureOpen(false)}
              className='rounded-full border px-3 py-1.5 hover:bg-[var(--surface)]'
              style={{ borderColor: 'var(--line)', color: 'var(--ink-soft)' }}
            >
              {t('share.tempmd.cancel')}
            </button>
            <button type='button' onClick={() => void publish()} className='btn-ink'>
              {t('share.tempmd.confirm')}
            </button>
          </div>
        </div>
      )}

      {panelOpen && (
        <div
          className='absolute right-0 top-[calc(100%+6px)] z-50 w-[340px] rounded-xl p-3 text-[11px] shadow-xl'
          style={{
            background: 'var(--paper)',
            border: `1px solid ${error ? 'var(--coral)' : 'var(--line-soft)'}`,
            color: 'var(--ink)',
          }}
        >
          {error ? (
            <>
              <div className='font-semibold text-[var(--coral)]'>
                {t('share.tempmd.error')}
              </div>
              <div className='mt-1 leading-relaxed text-[var(--ink-mute)]'>{error}</div>
            </>
          ) : (
            <>
              <div className='font-semibold'>{t('share.tempmd.ready')}</div>
              {preview.canonicalUrl && (
                <a
                  href={preview.canonicalUrl}
                  target='_blank'
                  rel='noreferrer noopener'
                  className='mt-1 block truncate font-mono text-[var(--coral)] hover:underline'
                  title={preview.canonicalUrl}
                >
                  {preview.canonicalUrl}
                </a>
              )}
              <div className='mt-1 text-[10.5px] text-[var(--ink-faint)]'>
                {formatExpiry(preview.expiresAt, locale, t)}
              </div>
              <div className='mt-3 flex flex-wrap gap-1.5'>
                <button type='button' onClick={() => void copy()} className='share-action'>
                  {copied ? t('share.tempmd.copied') : t('deploy.success.copy')}
                </button>
                {preview.canonicalUrl && (
                  <a
                    href={preview.canonicalUrl}
                    target='_blank'
                    rel='noreferrer noopener'
                    className='share-action no-underline'
                  >
                    {t('deploy.success.open')}
                  </a>
                )}
                <button
                  type='button'
                  onClick={() => void publish()}
                  disabled={busy || !html}
                  className='share-action'
                >
                  {t('share.tempmd.update')}
                </button>
                <button
                  type='button'
                  onClick={() => void revoke()}
                  disabled={busy}
                  className='share-action text-[var(--coral)]'
                >
                  {t('share.tempmd.revoke')}
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

function apiErrorMessage(body: unknown, status: number): string {
  return isRecord(body) && typeof body.error === 'string'
    ? body.error
    : `HTTP ${status}`;
}

function formatExpiry(
  value: string | null | undefined,
  locale: 'en' | 'zh-CN',
  t: ReturnType<typeof useT>,
): string {
  if (!value) return t('share.tempmd.noExpiry');
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return t('share.tempmd.noExpiry');
  return t('share.tempmd.expires', {
    date: new Intl.DateTimeFormat(locale, {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(date),
  });
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
