import type { NativeComponent } from '../../../shared/native-runtime';
import type { FfmpegStatus } from './renders/useFfmpegStatus';
import { useI18n } from '../i18n/I18n';
import { Button, Popover } from './ui';
import { RemixIcon } from '../icons/RemixIcons';

const names = { browser: 'Rendering component', media: 'Media components', ffmpeg: 'Media processing', ffprobe: 'Media inspection' };
const stages = { idle: 'Waiting to prepare', waiting: 'Waiting for shared download', downloading: 'Downloading', verifying: 'Verifying download', extracting: 'Extracting', checking: 'Checking component', ready: 'Ready', failed: 'Preparation failed' };
const reasons: Record<string, string> = { integrity: 'Download verification failed. Retry the download.', disk_space: 'Not enough disk space. Free some space and retry.', permission: 'Cannot write the preparation cache. Check folder permissions.', platform: 'This platform needs compatible video components.', download: 'Download failed. Check your connection and retry.', checking: 'The component could not be prepared. Retry or inspect the details.' };
export function componentProgress(component: NativeComponent): number | null {
  return component.stage === 'downloading' && component.totalBytes && component.receivedBytes !== undefined
    ? Math.min(100, Math.floor(component.receivedBytes / component.totalBytes * 100)) : null;
}

export function NativeRuntimeNotice({ status, checking, onRetry, pendingImport }: { pendingImport?: { count: number; retry: () => void }; status: FfmpegStatus | null; checking: boolean; onRetry: () => void }) {
  const { t } = useI18n();
  const runtime = status?.runtime;
  if (!runtime || status.ok && !status.runtimeUnavailable && !pendingImport) return null;
  const failed = runtime.components.some(component => component.stage === 'failed');
  const retryable = failed || runtime.components.some(component => component.stage === 'idle') || status.runtimeUnavailable;
  const headline = status.runtimeUnavailable ? 'Preparation progress unavailable' : status.ok ? 'Your files are ready to import' : failed ? 'Video features are not ready' : 'Preparing video features';
  return (
    <div data-testid="native-runtime-notice" className="flex min-h-9 shrink-0 items-center justify-between gap-2 border-b border-border-strong bg-surface px-3 py-1 text-step-11 text-text-2">
      <div className="flex min-w-0 items-center gap-2" role="status" aria-live="polite">
        {failed || status.runtimeUnavailable ? <span aria-hidden="true" className="size-1.5 shrink-0 rounded-full bg-warning" /> : status.ok ? null : <RemixIcon name="loader-4-line" size={12} className="shrink-0 animate-spin motion-reduce:animate-none" />}
        <span className="truncate">{t(headline)}</span>
        {!status.ok && <span className="hidden shrink-0 text-text-4 sm:inline">{t('You can keep editing')}</span>}
      </div>
      <div className="flex shrink-0 items-center gap-1">
        {pendingImport && runtime.capabilities.media && !status.runtimeUnavailable && <Button size="sm" variant="secondary" onClick={pendingImport.retry}>{t('Continue import')}</Button>}
        {retryable && <Button size="sm" variant="ghost" disabled={checking} onClick={onRetry}>{t(checking ? 'Checking…' : 'Retry')}</Button>}
        <Popover align="end" aria-label={t('Video preparation')} className="w-72 max-w-[calc(100vw-16px)]" trigger={<Button size="sm" variant="ghost">{t('View progress')}</Button>}>
          <div className="mb-2 flex items-center justify-between gap-3 font-medium">
            <span>{t('Video preparation')}</span>
            <span className="text-text-4">{runtime.components.filter(component => component.stage === 'ready').length}/{runtime.components.length}</span>
          </div>
          <ul>
            {runtime.components.map(component => <li key={component.id} className="border-b border-border-strong py-2 last:border-0">
              <div className="flex items-center justify-between gap-4">
                <span>{t(names[component.id])}</span>
                <span className="text-text-4">{componentProgress(component) !== null ? `${componentProgress(component)}%` : t(stages[component.stage])}</span>
              </div>
              {component.stage === 'failed' && <p className="mt-1 text-warning-ink">{t(reasons[component.errorCode ?? 'checking'] ?? reasons.checking)}</p>}
            </li>)}
          </ul>
          {pendingImport && <p className="mt-2 text-text-4">{t('Files waiting for import: {count}', { count: pendingImport.count })}</p>}
          {runtime.components.some(component => component.error) && <details className="mt-2 text-text-4"><summary className="cursor-pointer">{t('Technical details')}</summary><p className="mt-1 break-all">{runtime.components.filter(component => component.error).map(component => component.error).join('\n')}</p></details>}
        </Popover>
      </div>
    </div>
  );
}
