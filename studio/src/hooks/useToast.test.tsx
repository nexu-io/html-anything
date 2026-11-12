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

it('coalesces repeated feedback and restarts its dismissal window', () => {
  act(() => { api.showToast('Connection lost. Changes were not saved.', 'error', 'feedback'); });
  act(() => { vi.advanceTimersByTime(2000); });
  act(() => { api.showToast('Connection lost. Changes were not saved.', 'error', 'feedback'); });
  expect(api.toasts).toHaveLength(1);
  act(() => { vi.advanceTimersByTime(2000); });
  expect(api.toasts[0].leaving).toBeUndefined();
  act(() => { vi.advanceTimersByTime(1160); });
  expect(api.toasts).toHaveLength(0);
});

it('shows one compact notice for repeated errors without diagnostic controls', () => {
  act(() => {
    api.showToast('InternalError: /private/example.html', 'error');
    api.showToast('InternalError: /private/example.html', 'error');
  });
  expect(api.toasts).toHaveLength(1);
  expect(host.querySelector('[role=alert]')?.textContent).toBe('Action not completed. Please try again.');
  expect(host.textContent).not.toContain('/private/');
  expect(host.querySelector('[aria-label="Error details"]')).toBeNull();
  expect(host.querySelectorAll('button')).toHaveLength(1);
  expect(host.querySelector('pre')).toBeNull();
  act(() => { vi.advanceTimersByTime(10000); });
  expect(api.toasts).toHaveLength(1);
});

it.each([
  ['Could not save: ENOENT /private/project.html', 'Required file not found.'],
  ['Could not save: EACCES /private/project.html', 'No permission to access this file.'],
  ['Could not save: Failed to fetch', 'Connection lost.'],
  ['The preview did not reload (timeout). It was still waiting for ready.', 'Preview update timed out.'],
  ['The preview did not reload (load failed).', 'Preview could not be updated.'],
  ['Failed to save position', 'Changes could not be saved.'],
  ['revision mismatch conflict', 'The project changed elsewhere.'],
  ['unsupported video codec', 'This file format is not supported.'],
])('shows a concise cause for %s', (raw, summary) => {
  act(() => api.showToast(raw, 'error'));
  expect(host.querySelector('[role=alert]')?.textContent).toBe(summary);
  expect(host.querySelector('[aria-label="Error details"]')).toBeNull();
  expect(host.innerHTML).not.toContain('/private/');
});
