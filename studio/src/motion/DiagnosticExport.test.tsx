// @vitest-environment happy-dom
import React, { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { I18nProvider, useI18n, translate } from '../i18n/I18n';
import { DiagnosticExport } from './DiagnosticExport';
import { recordBrowserDiagnostic } from './diagnostics';

vi.mock('./diagnostics', () => ({ browserDiagnostics: () => [], nextDiagnosticRequest: () => 'fixture-request', recordBrowserDiagnostic: vi.fn() }));
beforeEach(() => vi.clearAllMocks());
let root: Root | undefined;
afterEach(() => { act(() => root?.unmount()); root = undefined; document.body.innerHTML = ''; localStorage.clear(); vi.restoreAllMocks(); vi.unstubAllGlobals(); });
async function render() {
  const container = document.createElement('div'); document.body.append(container); root = createRoot(container);
  await act(async () => root!.render(<I18nProvider initialLocale="zh-CN"><DiagnosticExport /></I18nProvider>));
  return container.querySelector('button')!;
}

it('downloads one local ZIP, disables duplicate clicks and releases the browser URL', async () => {
  let finish!: (value: Response) => void;
  const fetcher = vi.fn(() => new Promise<Response>(resolve => { finish = resolve; }));
  vi.stubGlobal('fetch', fetcher);
  const create = vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:diagnostic-fixture');
  const revoke = vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {});
  const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function (this: HTMLAnchorElement) {
    expect(this.download).toBe('openmotion-diagnostics-fixture.zip');
  });
  const button = await render(); expect(button.textContent).toBe('导出诊断 ZIP');
  await act(async () => { button.click(); button.click(); });
  expect(button.disabled).toBe(true); expect(fetcher).toHaveBeenCalledTimes(1);
  expect(document.querySelector('[role=status]')).toBeNull();
  expect(fetcher.mock.calls[0][0]).toBe('/motion-api/diagnostics');
  await act(async () => finish(new Response('ZIP', { headers: { 'Content-Type': 'application/zip', 'Content-Disposition': 'attachment; filename="openmotion-diagnostics-fixture.zip"' } })));
  expect(recordBrowserDiagnostic).toHaveBeenCalledWith('activity_diagnostic_export', expect.stringContaining('outcome=download_triggered'));
  expect(button.disabled).toBe(false); expect(create).toHaveBeenCalledTimes(1); expect(click).toHaveBeenCalledTimes(1);
  expect(document.querySelector('[role=status]')?.textContent).toBe('已发起下载，请查看浏览器下载列表。openmotion-diagnostics-fixture.zip');
  await vi.waitFor(() => expect(revoke).toHaveBeenCalledWith('blob:diagnostic-fixture'), { timeout: 1500 });
  await act(async () => button.click());
  expect(document.querySelector('[role=status]')).toBeNull();
  await act(async () => finish(new Response('', { status: 429 })));
  expect(document.querySelector('[role=status]')).toBeNull();
  expect(document.querySelector('[role=alert]')?.textContent).toContain('30 秒');
});

it('shows a localized rate-limit error and never starts a failed download', async () => {
  vi.stubGlobal('fetch', vi.fn(async () => new Response('', { status: 429 })));
  const create = vi.spyOn(URL, 'createObjectURL');
  const button = await render(); await act(async () => button.click());
  expect(document.querySelector('[role=alert]')?.textContent).toContain('30 秒'); expect(create).not.toHaveBeenCalled();
  expect(recordBrowserDiagnostic).toHaveBeenCalledWith('diagnostic_export_failed', expect.stringContaining('status=429'));
  expect(recordBrowserDiagnostic).not.toHaveBeenCalledWith('activity_diagnostic_export', expect.stringContaining('outcome=download_triggered'));
});

it('updates a visible download failure when the language changes without retrying', async () => {
  const fetcher = vi.fn(async () => new Response('', { status: 429 }));
  vi.stubGlobal('fetch', fetcher);
  function App() {
    const { setLocale } = useI18n();
    return <><button onClick={() => setLocale('de')}>German</button><DiagnosticExport /></>;
  }
  const container = document.createElement('div'); document.body.append(container); root = createRoot(container);
  await act(async () => root!.render(<I18nProvider initialLocale="en"><App /></I18nProvider>));
  await act(async () => container.querySelectorAll('button')[1].click());
  await act(async () => container.querySelector('button')!.click());
  expect(container.querySelector('[role=alert]')?.textContent).toBe(translate('de', 'Please wait 30 seconds before exporting diagnostics again.'));
  expect(fetcher).toHaveBeenCalledTimes(1);
});
