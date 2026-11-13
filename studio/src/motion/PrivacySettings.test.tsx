// @vitest-environment happy-dom
import React, { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, expect, it, vi } from 'vitest';
import { I18nProvider, useI18n, translate } from '../i18n/I18n';
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
  for (let cycle = 0; cycle < 2; cycle++) {
    await act(async () => toggle.click()); expect(toggle.checked).toBe(true);
    expect(hooks.enabled).toHaveBeenLastCalledWith(true);
    await act(async () => toggle.click()); expect(toggle.checked).toBe(false);
    expect(hooks.enabled).toHaveBeenLastCalledWith(false);
  }
});

it('locks collection in test builds without overwriting the saved production preference', async () => {
  const fetcher = vi.fn(async () => Response.json({ enabled: false, preference: true, locked: true, reason: 'test_build' }));
  vi.stubGlobal('fetch', fetcher);
  const toggle = await open(); expect(toggle.checked).toBe(false); expect(toggle.disabled).toBe(true);
  await act(async () => toggle.click());
  expect(fetcher).toHaveBeenCalledTimes(1); expect(hooks.enabled).not.toHaveBeenCalled();
  expect(document.querySelector('[role=status]')?.textContent).toContain('disabled in test builds');
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

it('translates an existing failure without refetching or replacing the privacy form', async () => {
  const fetcher = vi.fn(async (_url: string, init?: RequestInit) => init?.method === 'PUT'
    ? Response.json({ error: 'failed' }, { status: 500 }) : Response.json({ enabled: true, preference: true, locked: false }));
  vi.stubGlobal('fetch', fetcher);
  function App() {
    const { setLocale } = useI18n();
    return <><button onClick={() => setLocale('ja')}>Japanese</button><PrivacySettings onClose={() => {}} /></>;
  }
  const container = document.createElement('div'); document.body.append(container); root = createRoot(container);
  await act(async () => root!.render(<I18nProvider initialLocale="en"><App /></I18nProvider>));
  const toggle = container.querySelector<HTMLInputElement>('input[type=checkbox]')!;
  await act(async () => toggle.click());
  expect(container.querySelector('[role=alert]')?.textContent).toBe('Could not save privacy settings.');
  await act(async () => container.querySelector('button')!.click());
  expect(container.querySelector('[role=alert]')?.textContent).toBe(translate('ja', 'Could not save privacy settings.'));
  expect(container.querySelector('input')).toBe(toggle);
  expect(toggle.checked).toBe(true);
  expect(fetcher).toHaveBeenCalledTimes(2);
});
