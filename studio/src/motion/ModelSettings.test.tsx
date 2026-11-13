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

it('shows only the two BYOK providers; saving a key enables it and clears the secret input', async () => {
  let configured = false; const writes: unknown[] = [];
  vi.stubGlobal('fetch', vi.fn(async (url: string, init?: RequestInit) => {
    if (init?.method === 'PUT') { const body = JSON.parse(String(init.body)); writes.push(body); configured = !!body.apiKey; return Response.json({}); }
    if (url.includes('capabilities')) return Response.json({ providers: [
      { id: 'fal', label: 'fal.ai', configured, credentialSource: configured ? 'stored' : 'none', reason: 'API key required' },
      { id: 'opendesign', label: 'OpenDesign Cloud', configured: false, credentialSource: 'none', baseUrl: '', reason: 'API key required' },
      { id: 'codex', label: 'Codex', configured: true }, { id: 'atlascloud', label: 'Atlas Cloud' }], routes: {} });
    return Response.json({ models: [], nextOffset: null });
  }));
  await mount();
  expect(document.body.textContent).toContain('Media providers');
  expect(document.body.textContent).not.toContain('Atlas Cloud'); expect(document.body.textContent).not.toContain('Codex');
  expect(document.querySelector('input[type="checkbox"]')).toBeNull();
  expect(document.querySelector('a[href="/motion-api/models/providers/fal/reference"]')).not.toBeNull();
  await act(async () => type('fal.ai API key', 'private-fal-test'));
  const form = document.querySelector('input[aria-label="fal.ai API key"]')!.closest('form')!;
  await act(async () => form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true })));
  expect(writes).toEqual([{ apiKey: 'private-fal-test' }]);
  expect(document.querySelector<HTMLInputElement>('[aria-label="fal.ai API key"]')!.value).toBe('');
  expect(form.closest('article')!.textContent).toContain('Configured');
  expect(document.body.textContent).not.toContain('private-fal-test');
  await act(async () => Array.from(form.querySelectorAll('button')).find(el => el.textContent === 'Remove saved key')!.click());
  expect(writes[1]).toEqual({ apiKey: null });
  expect(form.closest('article')!.textContent).toContain('Not configured');
});

it('saves the Cloud workspace key together with the gateway address', async () => {
  const writes: unknown[] = [];
  vi.stubGlobal('fetch', vi.fn(async (url: string, init?: RequestInit) => {
    if (init?.method === 'PUT') { writes.push(JSON.parse(String(init.body))); return Response.json({}); }
    if (url.includes('capabilities')) return Response.json({ providers: [{ id: 'opendesign', label: 'OpenDesign Cloud', configured: false, baseUrl: '', reason: 'API key required' }], routes: {} });
    return Response.json({ models: [], nextOffset: null });
  }));
  await mount();
  await act(async () => { type('OpenDesign Cloud API origin', 'https://cloud.example'); type('OpenDesign Cloud API key', 'private-cloud-test'); });
  await act(async () => document.querySelector('form')!.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true })));
  expect(writes).toEqual([{ apiKey: 'private-cloud-test', baseUrl: 'https://cloud.example' }]);
  expect(document.querySelector<HTMLInputElement>('[aria-label="OpenDesign Cloud API key"]')!.value).toBe('');
});
