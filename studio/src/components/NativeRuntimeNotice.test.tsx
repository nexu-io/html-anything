// @vitest-environment happy-dom
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { expect, it, vi } from 'vitest';
import { NativeRuntimeNotice, componentProgress, componentRemainingSeconds } from './NativeRuntimeNotice';
import { I18nProvider, languages, translate, useI18n } from '../i18n/I18n';
Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
it('keeps technical progress collapsed, with retry and readiness without remounting the editor', async () => {
  const host = document.createElement('div'); document.body.append(host);
  const root = createRoot(host), retry = vi.fn();
  const runtime = { managed: true, components: [{ id: 'browser' as const, stage: 'downloading' as const, receivedBytes: 25, totalBytes: 100 }], capabilities: { capture: false, media: true, export: false } };
  const render = (status: any) => act(() => root.render(<I18nProvider initialLocale="zh-CN"><NativeRuntimeNotice status={status} checking={false} onRetry={retry} /></I18nProvider>));
  render({ ok: false, runtime });
  expect(host.textContent).toContain('可继续编辑'); expect(host.textContent).not.toContain('25%');
  act(() => Array.from(host.querySelectorAll('button')).find(button => button.textContent === '重试')!.click());
  expect(retry).toHaveBeenCalledOnce();
  retry.mockClear();
  await act(async () => { Array.from(host.querySelectorAll('button')).find(button => button.textContent === '查看进度')!.click(); });
  expect(document.body.textContent).toContain('25%');
  render({ ok: false, runtime: { ...runtime, components: [{ id: 'browser', stage: 'failed', error: 'Offline' }] } });
  act(() => Array.from(host.querySelectorAll('button')).find(button => button.textContent === '重试')!.click()); expect(retry).toHaveBeenCalledOnce();
  expect(document.body.textContent).toContain('Offline');
  render({ ok: true, runtime: { ...runtime, capabilities: { capture: true, media: true, export: true } } });
  expect(host.textContent).toBe('');
  act(() => root.unmount()); host.remove();
});
it('does not invent progress or confuse completed transfer with readiness', () => {
  expect(componentProgress({ id: 'browser', stage: 'downloading', receivedBytes: 25 })).toBeNull();
  expect(componentProgress({ id: 'browser', stage: 'checking', receivedBytes: 100, totalBytes: 100 })).toBeNull();
  expect(componentRemainingSeconds({ id: 'browser', stage: 'downloading', receivedBytes: 25, totalBytes: 100, downloadStartedAt: 1000, updatedAt: 3000 }, 3000)).toBe(6);
  expect(componentRemainingSeconds({ id: 'browser', stage: 'downloading', receivedBytes: 25, totalBytes: 100, downloadStartedAt: 1000, updatedAt: 3000 }, 15000)).toBeNull();
  expect(componentRemainingSeconds({ id: 'browser', stage: 'checking', receivedBytes: 25, totalBytes: 100, downloadStartedAt: 1000, updatedAt: 3000 })).toBeNull();
  expect(componentRemainingSeconds({ id: 'browser', stage: 'downloading', receivedBytes: 25 })).toBeNull();
});

it('updates an open preparation panel in all eleven languages and keeps import retry available', async () => {
  const host = document.createElement('div'); document.body.append(host);
  const root = createRoot(host), retry = vi.fn();
  function Notice() {
    const { setLocale } = useI18n();
    return <>{languages.map(({ locale }) => <button key={locale} data-locale={locale} onClick={() => setLocale(locale)}>{locale}</button>)}
      <input defaultValue="Authored title" />
      <NativeRuntimeNotice checking={false} onRetry={retry} pendingImport={{ count: 2, retry }} status={{
        ok: false,
        runtime: { managed: true, components: [
          { id: 'browser', stage: 'failed', errorCode: 'disk_space', error: 'ENOSPC /cache/original' },
          { id: 'media', stage: 'ready' },
        ], capabilities: { capture: false, media: true, export: false } },
      }} /></>;
  }
  try {
    act(() => root.render(<I18nProvider initialLocale="en"><Notice /></I18nProvider>));
    const input = host.querySelector('input');
    await act(async () => [...host.querySelectorAll('button')].find(b => b.textContent === 'View progress')!.click());
    const panel = document.querySelector('[data-base-ui-portal]');
    for (const { locale } of languages) {
      act(() => host.querySelector<HTMLButtonElement>(`[data-locale="${locale}"]`)!.click());
      expect(host.querySelector('input')).toBe(input);
      expect(document.querySelector('[data-base-ui-portal]')).toBe(panel);
      for (const key of ['Video export is not ready', 'Rendering component', 'Media components', 'Preparation failed', 'Ready', 'Not enough disk space. Free some space and retry.']) {
        expect(document.body.textContent, `${locale}: ${key}`).toContain(translate(locale, key));
      }
      expect(document.body.textContent).toContain(translate(locale, 'Files waiting for import: {count}', { count: 2 }));
      expect(document.body.textContent).toContain('ENOSPC /cache/original');
    }
    await act(async () => [...host.querySelectorAll('button')].find(b => b.textContent === translate('tr', 'Continue import'))!.click());
    expect(retry).toHaveBeenCalledOnce();
  } finally { act(() => root.unmount()); host.remove(); }
});
