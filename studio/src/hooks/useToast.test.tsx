// @vitest-environment happy-dom
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { useToast } from './useToast';
import { StudioToast } from '../components/StudioToast';

let host: HTMLDivElement;
let root: Root;
let api: ReturnType<typeof useToast>;
globalThis.IS_REACT_ACT_ENVIRONMENT = true;
function Harness() {
  api = useToast();
  return <>{api.toasts.map(toast => <StudioToast key={toast.id} {...toast} onDismiss={() => api.dismissToast(toast.id)} />)}</>;
}
beforeEach(() => { vi.useFakeTimers(); host = document.createElement('div'); document.body.append(host); root = createRoot(host); act(() => root.render(<Harness />)); });
afterEach(() => { act(() => root.unmount()); host.remove(); vi.useRealTimers(); });
it('shows feedback without a close button and starts exiting after exactly 3 seconds', () => {
  act(() => { api.showToast('Copied element', 'info'); });
  expect(host.querySelector('button')).toBeNull();
  act(() => { vi.advanceTimersByTime(2999); });
  expect(api.toasts[0].leaving).toBeUndefined();
  act(() => { vi.advanceTimersByTime(1); });
  expect(api.toasts[0].leaving).toBe(true);
  act(() => { vi.advanceTimersByTime(160); });
  expect(api.toasts).toHaveLength(0);
});
it('keeps actionable error notices visible until dismissed and hides raw diagnostics', () => {
  act(() => { api.showToast('Could not save /private/project/file.html', 'error'); });
  act(() => { vi.advanceTimersByTime(10000); });
  expect(api.toasts).toHaveLength(1);
  expect(host.textContent).not.toContain('/private/');
  const close = host.querySelector<HTMLButtonElement>('[aria-label="Dismiss error"]')!;
  expect(close).not.toBeNull();
  act(() => close.click());
  act(() => { vi.advanceTimersByTime(160); });
  expect(api.toasts).toHaveLength(0);
});

it('announces brief failure feedback without actions and removes it after three seconds', () => {
  act(() => { api.showToast('Connection lost. Changes were not saved.', 'error', 'feedback'); });
  expect(host.querySelector('[role=alert]')?.textContent).toContain('Changes were not saved');
  expect(host.querySelector('button')).toBeNull();
  expect(host.querySelector('pre')).toBeNull();
  act(() => { vi.advanceTimersByTime(2999); });
  expect(api.toasts[0].leaving).toBeUndefined();
  act(() => { vi.advanceTimersByTime(161); });
  expect(api.toasts).toHaveLength(0);
});
