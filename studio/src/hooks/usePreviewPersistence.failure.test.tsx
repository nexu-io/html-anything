// @vitest-environment happy-dom
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { expect, it, vi } from 'vitest';
import { usePreviewPersistence } from './usePreviewPersistence';
import { useToast } from './useToast';
import { saveFailureFeedback } from '../utils/saveFailureFeedback';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

it('shows one concise pause toast and preserves the failed save guard after it disappears', async () => {
  vi.useFakeTimers();
  const host = document.createElement('div');
  const root = createRoot(host);
  let persistence!: ReturnType<typeof usePreviewPersistence>;
  let toast!: ReturnType<typeof useToast>;
  function Harness() {
    toast = useToast();
    persistence = usePreviewPersistence({
      showToast: toast.showToast,
      readOptionalProjectFile: async () => '',
      writeProjectFile: async () => {},
      recordEdit: async () => {},
      previewIframeRef: { current: null },
      activeCompPathRef: { current: 'index.html' },
      reloadPreview: vi.fn(),
    });
    return null;
  }
  try {
    await act(async () => root.render(<Harness />));
    const error = new Error('Failed to fetch /private/' + 'long-source-path'.repeat(100));
    const save = vi.fn(async () => { throw error; });
    for (let i = 0; i < 5; i++) {
      await act(async () => { await expect(persistence.queueDomEditSave(save)).rejects.toBe(error); });
    }
    expect(toast.toasts).toHaveLength(1);
    expect(toast.toasts[0]).toMatchObject({ message: 'Connection lost. Changes were not saved.', tone: 'error', presentation: 'feedback' });
    act(() => vi.advanceTimersByTime(3000));
    act(() => vi.advanceTimersByTime(160));
    expect(toast.toasts).toHaveLength(0);
    expect(persistence.domEditSaveQueuePaused).toBe('Connection lost. Changes were not saved.');
    await expect(persistence.drainPendingDomEditSaves()).resolves.toMatchObject({ status: 'failed', error });
    await act(async () => { await expect(persistence.queueDomEditSave(save)).rejects.toThrow('Auto-save is paused'); });
    expect(save).toHaveBeenCalledTimes(5);
    expect(toast.toasts).toHaveLength(0);
  } finally {
    act(() => root.unmount());
    vi.useRealTimers();
  }
});

it('uses known causes without echoing diagnostics or inventing a connection failure', () => {
  expect(saveFailureFeedback(409, '/private/conflict.html')).toBe('The project changed elsewhere. Changes were not saved.');
  expect(saveFailureFeedback(403, '/private/secret.html')).toBe('No permission to save changes.');
  expect(saveFailureFeedback(null, 'EPERM /private/secret.html')).toBe('No permission to save changes.');
  expect(saveFailureFeedback(500, 'UnexpectedError at /private/source.ts:80')).toBe('Changes were not saved. Saving is paused.');
});
