// @vitest-environment happy-dom
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { ErrorNotice } from './ErrorNotice';
import { errorNoticeMessage } from './errorNoticeMessage';
import { I18nProvider } from '../../i18n/I18n';
import { languages, translate } from '../../i18n/messages';
import errorUi from '../../i18n/error-ui.json';

vi.mock('../../motion/diagnostics', () => ({ recordBrowserDiagnostic: vi.fn(), browserDiagnostics: () => [], nextDiagnosticRequest: () => 'fixture-request', diagnosticsActive: () => false }));

let host: HTMLDivElement;
let root: Root;
globalThis.IS_REACT_ACT_ENVIRONMENT = true;
beforeEach(() => { host = document.createElement('div'); document.body.append(host); root = createRoot(host); });
afterEach(() => { act(() => root.unmount()); host.remove(); vi.restoreAllMocks(); });
const button = (label: string) => [...host.querySelectorAll('button')].find(node => node.textContent === label)!;

it('hides raw diagnostics until expanded and preserves them for copy', async () => {
  const message = 'ENOENT /assets/' + 'long-name'.repeat(100) + '\n<script>example</script>';
  const copy = vi.spyOn(navigator.clipboard, 'writeText').mockResolvedValue();
  act(() => root.render(<I18nProvider initialLocale="zh-CN"><ErrorNotice message={message} /></I18nProvider>));
  expect(host.textContent).toContain('所需文件已丢失');
  expect(host.textContent).not.toContain('/assets/');
  expect(host.querySelector('pre')).toBeNull();
  expect(button('重试')).toBeUndefined();
  act(() => button('错误详情').click());
  expect(host.querySelector('pre')?.textContent).toBe(message);
  expect(host.querySelector('script')).toBeNull();
  await act(async () => button('复制错误信息').click());
  expect(copy).toHaveBeenCalledWith(message);
  expect(host.querySelector('[role=status]')?.textContent).toBe('已复制');
});

it('only runs an explicitly provided action and prevents repeat clicks while busy', () => {
  const retry = vi.fn();
  const render = (busy: boolean) => act(() => root.render(<ErrorNotice message="Failed to fetch" action={{ label: 'Reconnect', run: retry, busy }} />));
  render(false);
  act(() => button('Reconnect').click());
  expect(retry).toHaveBeenCalledOnce();
  render(true);
  expect(button('Checking…').disabled).toBe(true);
  act(() => button('Checking…').click());
  expect(retry).toHaveBeenCalledOnce();
});

it('keeps details selectable when clipboard permission is denied', async () => {
  vi.spyOn(navigator.clipboard, 'writeText').mockRejectedValue(new Error('denied'));
  act(() => root.render(<ErrorNotice message="unknown diagnostic" />));
  act(() => button('Error details').click());
  await act(async () => button('Copy error information').click());
  expect(host.querySelector('[role=status]')?.textContent).toContain('Select the details');
  expect(host.querySelector('pre')?.tabIndex).toBe(0);
});

it('does not invent a diagnosis for unknown errors and distinguishes media failures', () => {
  expect(errorNoticeMessage('InternalError: private/path/code')).toBe('The operation could not be completed. See error details.');
  expect(errorNoticeMessage('Invalid data while decoding media', 'export')).toContain('Check or replace');
  expect(errorNoticeMessage('unsupported codec', 'export')).toBe('This file format is not supported.');
  expect(errorNoticeMessage('Save paused: this file changed elsewhere.')).toContain('Resolve the changes');
});

it('localizes every new error message in all supported non-English languages', () => {
  for (const { locale } of languages) {
    if (locale === 'en') continue;
    for (const key of Object.keys(errorUi['zh-CN'])) expect(translate(locale, key)).not.toBe(key);
  }
});
