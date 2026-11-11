// @vitest-environment happy-dom
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { expect, it, vi } from 'vitest';
import { NativeRuntimeNotice, componentProgress } from './NativeRuntimeNotice';
import { I18nProvider } from '../i18n/I18n';
Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
it('keeps technical progress collapsed, with retry and readiness without remounting the editor', async () => {
  const host = document.createElement('div'); document.body.append(host);
  const root = createRoot(host), retry = vi.fn();
  const runtime = { managed: true, components: [{ id: 'browser' as const, stage: 'downloading' as const, receivedBytes: 25, totalBytes: 100 }], capabilities: { capture: false, media: true, export: false } };
  const render = (status: any) => act(() => root.render(<I18nProvider initialLocale="zh-CN"><NativeRuntimeNotice status={status} checking={false} onRetry={retry} /></I18nProvider>));
  render({ ok: false, runtime });
  expect(host.textContent).toContain('可继续编辑'); expect(host.textContent).not.toContain('25%');
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
});
