// @vitest-environment happy-dom
import React, { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { TemplateMotionGuide } from './TemplateMotionGuide';
import { prepareMotionGuide, type GuideAppearance } from './templateMotionGuideDocument';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;
const appearance: GuideAppearance = { theme: 'light', background: '#f5f5f5', text: '#494949', muted: '#5c5c5c', surface: '#fafafa', border: '#dbdbdb' };
const source = '<html><head><link rel="stylesheet" href="guide.css"></head><body style="--paper:#96d93c"><h1>Guide</h1><iframe src="demo.html"></iframe><script src="runtime.js"></script></body></html>';
const url = 'https://example.com/guides/one.html';
let host: HTMLDivElement, root: Root;
beforeEach(() => {
  window.happyDOM.settings.enableIframePageLoading = false;
  document.documentElement.dataset.theme = 'paper';
  host = document.createElement('div'); document.body.append(host); root = createRoot(host);
});
afterEach(() => { act(() => root.unmount()); host.remove(); document.documentElement.removeAttribute('data-theme'); vi.restoreAllMocks(); vi.unstubAllGlobals(); });

it('preserves artwork, scripts and asset resolution inside the adapted guide', () => {
  const doc = new DOMParser().parseFromString(prepareMotionGuide(source, url, appearance), 'text/html');
  expect(doc.querySelector('base')?.href).toBe(url);
  expect(doc.querySelector('iframe')?.getAttribute('src')).toBe('demo.html');
  expect(doc.querySelector('script[src]')?.getAttribute('src')).toBe('runtime.js');
  expect(doc.body.style.getPropertyValue('--paper')).toBe('#96d93c');
  expect(doc.documentElement.style.getPropertyValue('--om-guide-background')).toBe('#f5f5f5');
  expect(doc.documentElement.dataset.openmotionGuide).toBe('light');
  expect(doc.querySelector('style')?.textContent).not.toMatch(/filter:|\.demo-stage.*background/);
});

it('syncs theme without re-fetching or replacing the guide document and keeps the sandbox', async () => {
  vi.stubGlobal('fetch', vi.fn(async () => new Response(source, { headers: { 'content-type': 'text/html' } })));
  await act(async () => root.render(<TemplateMotionGuide url={url} title="Guide" />));
  const frame = host.querySelector('iframe')!;
  const html = frame.srcdoc;
  const postMessage = vi.spyOn(frame.contentWindow!, 'postMessage');
  expect(frame.getAttribute('sandbox')).toBe('allow-scripts');
  expect(frame.getAttribute('referrerpolicy')).toBe('no-referrer');
  expect(frame.hasAttribute('src')).toBe(false);
  expect(fetch).toHaveBeenCalledWith(url, expect.objectContaining({ credentials: 'omit', referrerPolicy: 'no-referrer' }));
  await act(async () => { document.documentElement.removeAttribute('data-theme'); });
  expect(postMessage).toHaveBeenCalledWith(expect.objectContaining({ type: 'openmotion:guide-appearance', appearance: expect.objectContaining({ theme: 'dark' }) }), '*');
  expect(frame.srcdoc).toBe(html);
  expect(fetch).toHaveBeenCalledTimes(1);
});

it('falls back to the untouched remote iframe when CORS or the fetch fails', async () => {
  vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('Failed to fetch')));
  await act(async () => root.render(<TemplateMotionGuide url={url} title="Guide" />));
  const frame = host.querySelector('iframe')!;
  expect(frame.getAttribute('src')).toBe(url);
  expect(frame.hasAttribute('srcdoc')).toBe(false);
  expect(frame.getAttribute('sandbox')).toBe('allow-scripts');
});

it('aborts a stale guide and cannot overwrite a newer selection', async () => {
  let resolveFirst!: (value: Response) => void;
  const fetcher = vi.fn().mockImplementationOnce(() => new Promise<Response>(resolve => { resolveFirst = resolve; })).mockResolvedValue(new Response(source.replace('Guide', 'Second'), { headers: { 'content-type': 'text/html' } }));
  vi.stubGlobal('fetch', fetcher);
  await act(async () => root.render(<TemplateMotionGuide url={url} title="Guide" />));
  const signal = fetcher.mock.calls[0][1].signal as AbortSignal;
  await act(async () => root.render(<TemplateMotionGuide url="https://example.com/second.html" title="Second" />));
  expect(signal.aborted).toBe(true);
  await act(async () => resolveFirst(new Response(source, { headers: { 'content-type': 'text/html' } })));
  expect(host.querySelector('iframe')?.srcdoc).toContain('<h1>Second</h1>');
});
