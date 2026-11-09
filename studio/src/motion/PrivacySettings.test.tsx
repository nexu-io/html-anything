// @vitest-environment happy-dom
import React, { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, expect, it, vi } from 'vitest';
import { I18nProvider } from '../i18n/I18n';
import { PrivacySettings } from './PrivacySettings';

const hooks = vi.hoisted(() => ({ enabled: vi.fn() }));
vi.mock('./tracking', () => ({ setMotionTrackingEnabled: hooks.enabled }));
let root: Root | undefined;
afterEach(() => { act(() => root?.unmount()); root = undefined; document.body.innerHTML = ''; vi.unstubAllGlobals(); vi.clearAllMocks(); });
async function open() {
  const container = document.createElement('div'); document.body.append(container); root = createRoot(container);
  await act(async () => root!.render(<I18nProvider initialLocale="en"><PrivacySettings onClose={() => {}} /></I18nProvider>));
  return container.querySelector<HTMLInputElement>('input[type=checkbox]')!;
}

it('shows the enabled default and persists a user opt-out while stopping browser collection', async () => {
  const requests: RequestInit[] = [];
  vi.stubGlobal('fetch', vi.fn(async (_url: string, init?: RequestInit) => {
    requests.push(init ?? {});
    const enabled = init?.body ? JSON.parse(String(init.body)).enabled : true;
    return Response.json({ enabled, preference: enabled, locked: false });
  }));
  const toggle = await open(); expect(toggle.checked).toBe(true); expect(toggle.disabled).toBe(false);
  await act(async () => toggle.click());
  expect(toggle.checked).toBe(false);
  expect(requests[1].method).toBe('PUT'); expect(JSON.parse(String(requests[1].body))).toEqual({ enabled: false });
  expect(hooks.enabled).toHaveBeenCalledWith(false);
});

it('shows an environment lock and never offers to override it', async () => {
  vi.stubGlobal('fetch', vi.fn(async () => Response.json({ enabled: false, preference: true, locked: true })));
  const toggle = await open(); expect(toggle.checked).toBe(false); expect(toggle.disabled).toBe(true);
  expect(document.body.textContent).toContain('Disabled by your environment settings.');
});

it('reports save failure without falsely claiming the installation has opted out', async () => {
  vi.stubGlobal('fetch', vi.fn(async (_url: string, init?: RequestInit) => init?.method === 'PUT'
    ? Response.json({ error: 'failed' }, { status: 500 }) : Response.json({ enabled: true, preference: true, locked: false })));
  const toggle = await open(); await act(async () => toggle.click());
  expect(toggle.checked).toBe(true); expect(document.querySelector('[role=alert]')?.textContent).toContain('Could not save');
  expect(hooks.enabled).toHaveBeenCalledWith(false);
});
