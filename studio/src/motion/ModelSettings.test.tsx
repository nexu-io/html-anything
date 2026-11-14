// @vitest-environment happy-dom
import React, { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, expect, it, vi } from 'vitest';
import { ModelSettings } from './ModelSettings';
import { I18nProvider } from '../i18n/I18n';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
let root: Root | undefined;
afterEach(() => { act(() => root?.unmount()); root = undefined; document.body.innerHTML = ''; vi.restoreAllMocks(); vi.unstubAllGlobals(); });
function type(label: string, value: string) {
  const el = document.querySelector<HTMLInputElement>(`[aria-label="${label}"]`)!;
  Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')!.set!.call(el, value);
  el.dispatchEvent(new Event('input', { bubbles: true }));
}
async function mount() {
  vi.spyOn(HTMLDialogElement.prototype, 'showModal').mockImplementation(function () { this.setAttribute('open', ''); });
  vi.spyOn(HTMLDialogElement.prototype, 'close').mockImplementation(function () { this.removeAttribute('open'); });
  const host = document.createElement('div'); document.body.append(host); root = createRoot(host);
  await act(async () => root!.render(<I18nProvider initialLocale="en"><ModelSettings onClose={() => {}} /></I18nProvider>));
}

it('shows the three visible BYOK providers; saving a key enables it and clears the secret input', async () => {
  let configured = false; const writes: unknown[] = [];
  vi.stubGlobal('fetch', vi.fn(async (url: string, init?: RequestInit) => {
    if (init?.method === 'PUT') { const body = JSON.parse(String(init.body)); writes.push(body); configured = !!body.apiKey; return Response.json({}); }
    if (url.includes('capabilities')) return Response.json({ providers: [
      { id: 'fal', label: 'fal.ai', configured, credentialSource: configured ? 'stored' : 'none', reason: 'API key required' },
      { id: 'opendesign', label: 'OpenDesign Cloud', configured: false, credentialSource: 'none', baseUrl: '', reason: 'API key required' },
      { id: 'codex', label: 'Codex', configured: true }, { id: 'atlascloud', label: 'Atlas Cloud', configured: false, reason: 'API key required' }, { id: 'wavespeed', label: 'WaveSpeedAI', configured: false, reason: 'API key required' }], routes: {} });
    return Response.json({ models: [], nextOffset: null });
  }));
  await mount();
  expect(document.body.textContent).toContain('Media generation settings');
  expect(document.body.textContent).toContain('Atlas Cloud'); expect(document.body.textContent).toContain('WaveSpeedAI'); expect(document.body.textContent).not.toContain('Codex');
  expect(document.querySelectorAll('.motion-provider-card')).toHaveLength(3);
  expect(document.body.textContent).not.toContain('OpenDesign Cloud');
  expect(document.querySelector('input[type="checkbox"]')).toBeNull();
  expect(document.querySelector('a[href="/motion-api/models/providers/fal/reference"]')).not.toBeNull();
  await act(async () => type('fal.ai API key', 'private-fal-test'));
  const form = document.querySelector('input[aria-label="fal.ai API key"]')!.closest('form')!;
  await act(async () => form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true })));
  expect(writes).toEqual([{ apiKey: 'private-fal-test' }]);
  expect(document.querySelector<HTMLInputElement>('[aria-label="fal.ai API key"]')!.value).toBe('');
  expect(form.closest('article')!.textContent).toContain('Configured');
  expect(document.body.textContent).not.toContain('private-fal-test');
  expect(document.querySelector('details')).toBeNull();
  expect(vi.mocked(fetch).mock.calls.every(([url]) => String(url).includes('/models/providers/') || String(url).endsWith('/models/capabilities'))).toBe(true);
  await act(async () => Array.from(form.querySelectorAll('button')).find(el => el.textContent === 'Remove saved key')!.click());
  expect(writes[1]).toEqual({ apiKey: null });
  expect(form.closest('article')!.textContent).toContain('Not configured');
});

for (const configured of [false, true]) it(`hides Cloud settings without changing its ${configured ? 'saved' : 'empty'} configuration`, async () => {
  vi.stubGlobal('fetch', vi.fn(async (url: string, init?: RequestInit) => {
    expect(init?.method).not.toBe('PUT');
    expect(url).toBe('/motion-api/models/capabilities');
    return Response.json({ providers: [{ id: 'opendesign', label: 'OpenDesign Cloud', configured, credentialSource: configured ? 'stored' : 'none', baseUrl: 'https://cloud.example', reason: '' }], routes: {} });
  }));
  await mount();
  expect(document.body.textContent).not.toContain('OpenDesign Cloud');
  expect(document.querySelector('[aria-label="OpenDesign Cloud API key"]')).toBeNull();
  expect(document.querySelector('[aria-label="OpenDesign Cloud API origin"]')).toBeNull();
  expect(document.querySelector('a[href="/motion-api/models/providers/opendesign/reference"]')).toBeNull();
  expect(fetch).toHaveBeenCalledTimes(1);
});

for (const [id, label] of [['atlascloud', 'Atlas Cloud'], ['wavespeed', 'WaveSpeedAI']]) it(`saves and removes ${label} credentials without loading models`, async () => {
  let configured = false; const writes: unknown[] = [];
  vi.stubGlobal('fetch', vi.fn(async (url: string, init?: RequestInit) => {
    if (init?.method === 'PUT') { expect(url).toBe(`/motion-api/models/providers/${id}`); const body = JSON.parse(String(init.body)); writes.push(body); configured = !!body.apiKey; return Response.json({}); }
    expect(url).toBe('/motion-api/models/capabilities');
    return Response.json({ providers: [{ id, label, configured, credentialSource: configured ? 'stored' : 'none', reason: '' }], routes: {} });
  }));
  await mount();
  await act(async () => type(`${label} API key`, 'private-new-provider'));
  await act(async () => document.querySelector('form')!.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true })));
  expect(writes).toEqual([{ apiKey: 'private-new-provider' }]);
  expect(document.querySelector<HTMLInputElement>(`[aria-label="${label} API key"]`)!.value).toBe('');
  expect(document.body.textContent).toContain('Configured'); expect(document.querySelector('details')).toBeNull();
  await act(async () => Array.from(document.querySelectorAll('button')).find(el => el.textContent === 'Remove saved key')!.click());
  expect(writes[1]).toEqual({ apiKey: null }); expect(document.body.textContent).toContain('Not configured');
});
