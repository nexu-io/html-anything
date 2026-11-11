// @vitest-environment happy-dom
import React, { act, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { afterEach, expect, it, vi } from 'vitest';
import { ConnectionDialog } from './ConnectionDialog';
import { I18nProvider } from '../i18n/I18n';

vi.mock('../../../web/connect', () => ({ mountConnection: () => ({
  destroy() {}, suspend() {}, resume() {}, showTemplates() {}, setLanguage() {},
}) }));
Reflect.set(globalThis, 'IS_REACT_ACT_ENVIRONMENT', true);
afterEach(() => { vi.unstubAllGlobals(); vi.restoreAllMocks(); document.body.innerHTML = ''; });

it.each(['escape', 'close'])('restores focus after conditional unmount via %s, including repeated opens', async method => {
  vi.stubGlobal('fetch', vi.fn(async () => Response.json({ items: [], next: null, catalogVersion: 'test' })));
  const host = document.createElement('div'); document.body.append(host);
  const root = createRoot(host);
  vi.spyOn(HTMLDialogElement.prototype, 'showModal').mockImplementation(function () {
    this.setAttribute('open', ''); this.querySelector<HTMLButtonElement>('button')?.focus();
  });
  const close = vi.spyOn(HTMLDialogElement.prototype, 'close').mockImplementation(function () { this.removeAttribute('open'); });
  function Harness() {
    const [trigger, setTrigger] = useState<HTMLElement | null>(null);
    return <><button onClick={event => setTrigger(event.currentTarget)}>Library</button>
      {trigger && <ConnectionDialog open section="templates" returnFocus={trigger} busy={false} error="" onClose={() => setTrigger(null)} onOpen={() => {}} />}</>;
  }
  try {
    await act(async () => root.render(<I18nProvider><Harness /></I18nProvider>));
    const trigger = host.querySelector('button')!;
    for (let i = 0; i < 2; i++) {
      await act(async () => trigger.click());
      expect(document.activeElement).toBe(host.querySelector('dialog button'));
      const dialog = host.querySelector('dialog')!;
      await act(async () => {
        if (method === 'escape') dialog.dispatchEvent(new Event('cancel', { bubbles: false, cancelable: true }));
        else host.querySelector<HTMLButtonElement>('dialog header button')!.click();
      });
      expect(host.querySelector('dialog')).toBeNull();
      expect(document.activeElement).toBe(trigger);
    }
    expect(close).toHaveBeenCalledTimes(2);
  } finally { act(() => root.unmount()); host.remove(); }
});
