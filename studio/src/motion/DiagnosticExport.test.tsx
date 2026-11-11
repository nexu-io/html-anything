// @vitest-environment happy-dom
import React, { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, expect, it, vi } from 'vitest';
import { I18nProvider } from '../i18n/I18n';
import { DiagnosticExport } from './DiagnosticExport';
import { browserDiagnostics, recordBrowserDiagnostic } from './diagnostics';

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
  expect(fetcher.mock.calls[0][0]).toBe('/motion-api/diagnostics');
  await act(async () => finish(new Response('ZIP', { headers: { 'Content-Type': 'application/zip', 'Content-Disposition': 'attachment; filename="openmotion-diagnostics-fixture.zip"' } })));
  expect(button.disabled).toBe(false); expect(create).toHaveBeenCalledTimes(1); expect(click).toHaveBeenCalledTimes(1);
  await vi.waitFor(() => expect(revoke).toHaveBeenCalledWith('blob:diagnostic-fixture'), { timeout: 1500 });
});

it('shows a localized rate-limit error and never starts a failed download', async () => {
  vi.stubGlobal('fetch', vi.fn(async () => new Response('', { status: 429 })));
  const create = vi.spyOn(URL, 'createObjectURL');
  const button = await render(); await act(async () => button.click());
  expect(document.querySelector('[role=alert]')?.textContent).toContain('30 秒'); expect(create).not.toHaveBeenCalled();
});

it('persists redacted bounded errors across reloads, sends only to the local backend, and tolerates unavailable storage', () => {
  const fetcher = vi.fn(async () => Response.json({ accepted: 1 })); vi.stubGlobal('fetch', fetcher);
  for (let i = 0; i < 50; i++) recordBrowserDiagnostic('failure', `api_key=fixture-private ${i} ` + '错误'.repeat(1500));
  const events = browserDiagnostics();
  expect(events.length).toBeGreaterThan(0); expect(events.length).toBeLessThanOrEqual(20);
  expect(localStorage.getItem('motion.local-diagnostics.v1')).not.toContain('fixture-private');
  expect(new TextEncoder().encode(localStorage.getItem('motion.local-diagnostics.v1')!).length).toBeLessThanOrEqual(24 * 1024);
  expect(fetcher.mock.calls.every(([url]) => url === '/motion-api/diagnostics/events')).toBe(true);
  vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => { throw new Error('Storage unavailable'); });
  expect(() => recordBrowserDiagnostic('failure', 'still safe')).not.toThrow();
});
