// @vitest-environment happy-dom
import React, { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { GitHubLink } from './GitHubLink';
import { GITHUB_REPOSITORY, readRepositoryStars } from './githubRepository';

vi.mock('./githubRepository', async importOriginal => ({
  ...await importOriginal<typeof import('./githubRepository')>(), readRepositoryStars: vi.fn(),
}));
globalThis.IS_REACT_ACT_ENVIRONMENT = true;
let root: Root;
let container: HTMLDivElement;
beforeEach(() => {
  vi.useFakeTimers();
  vi.mocked(readRepositoryStars).mockReset();
  vi.spyOn(document, 'visibilityState', 'get').mockReturnValue('visible');
  container = document.createElement('div');
  document.body.append(container);
  root = createRoot(container);
});
afterEach(() => {
  act(() => root.unmount());
  container.remove();
  vi.restoreAllMocks();
  vi.useRealTimers();
});

it('preserves a safe, keyboard-accessible repository link while loading and on failure', async () => {
  let resolve!: (value: number | null) => void;
  vi.mocked(readRepositoryStars).mockReturnValue(new Promise(done => { resolve = done; }));
  act(() => root.render(<GitHubLink />));
  const link = container.querySelector('a')!;
  expect(link.href).toBe(GITHUB_REPOSITORY);
  expect(link.target).toBe('_blank');
  expect(link.rel).toBe('noopener noreferrer');
  expect(link.getAttribute('aria-label')).toBe('OpenMotion on GitHub');
  expect(link.textContent).toBe('');
  link.focus();
  expect(document.activeElement).toBe(link);
  await act(async () => resolve(null));
  expect(link.textContent).toBe('');
  expect(link.querySelector('svg')).not.toBeNull();
});

it('refreshes visible counts, hides failures and stops polling after unmount', async () => {
  vi.mocked(readRepositoryStars).mockResolvedValueOnce(9796).mockResolvedValueOnce(null).mockResolvedValueOnce(0);
  await act(async () => root.render(<GitHubLink />));
  const link = container.querySelector('a')!;
  expect(link.textContent).toBe('9.8K');
  expect(link.getAttribute('aria-label')).toContain('9,796');
  await act(async () => vi.advanceTimersByTimeAsync(60_000));
  expect(link.textContent).toBe('');
  vi.spyOn(document, 'visibilityState', 'get').mockReturnValue('hidden');
  await act(async () => vi.advanceTimersByTimeAsync(60_000));
  expect(readRepositoryStars).toHaveBeenCalledTimes(2);
  vi.spyOn(document, 'visibilityState', 'get').mockReturnValue('visible');
  await act(async () => document.dispatchEvent(new Event('visibilitychange')));
  expect(link.textContent).toBe('0');
  act(() => root.render(null));
  await act(async () => vi.advanceTimersByTimeAsync(60_000));
  expect(readRepositoryStars).toHaveBeenCalledTimes(3);
});
