// @vitest-environment happy-dom
import React, { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { editorEntryVisibility, allEditorEntriesVisible, type EditorEntryVisibility } from './editorEntryVisibility';
import { StudioHostContext } from './StudioHost';
import { MotionTimelineMedia } from './MotionTimelineMedia';
import { AssetsTab } from '../components/sidebar/AssetsTab';
import { TimelineEmptyState } from '../player/components/TimelineEmptyState';
import { TimelineToolbar } from '../components/TimelineToolbar';
import { usePlayerStore } from '../player/store/playerStore';

const gateway = vi.hoisted(() => ({ bindTimeline: vi.fn(), openGenerator: vi.fn(), importFiles: vi.fn(), generationOpen: false }));
vi.mock('./MediaGatewayContext', () => ({ useMediaGateway: () => gateway }));
vi.mock('../contexts/StudioContext', () => ({ useStudioShellContextOptional: () => null }));
globalThis.IS_REACT_ACT_ENVIRONMENT = true;
const roots: Root[] = [];
beforeEach(() => vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('', { status: 404 }))));
afterEach(() => {
  act(() => roots.splice(0).forEach(root => root.unmount()));
  document.body.innerHTML = '';
  usePlayerStore.getState().reset();
  vi.clearAllMocks();
  vi.unstubAllGlobals();
});
function render(children: React.ReactNode) {
  const host = document.createElement('div'); document.body.append(host);
  const root = createRoot(host); roots.push(root);
  const update = (entries: EditorEntryVisibility) => act(() => root.render(
    <StudioHostContext.Provider value={{ entryVisibility: entries }}>{children}</StudioHostContext.Provider>,
  ));
  update(editorEntryVisibility);
  return { host, update };
}
it('hides and restores generation across assets, the toolbar and empty timeline without unbinding import', () => {
  const { host, update } = render(<>
    <AssetsTab projectId="p" assets={[]} onImport={vi.fn()} />
    <MotionTimelineMedia projectId="p" compositionId="main" disabled={false} onFileDrop={vi.fn()} />
    <TimelineEmptyState isDragOver={false} onFileDrop onDragOver={vi.fn()} onDragLeave={vi.fn()} onDrop={vi.fn()} />
  </>);
  const generators = () => [...host.querySelectorAll('button')].filter(button => button.textContent === 'Generate media');
  expect(generators()).toHaveLength(0);
  expect(host.textContent).not.toContain('generate media');
  expect(host.querySelector('input[type="file"]')).not.toBeNull();
  expect(gateway.bindTimeline).toHaveBeenCalledWith(expect.objectContaining({ importFiles: expect.any(Function), replace: expect.any(Function) }));
  act(() => host.querySelector<HTMLButtonElement>('.motion-timeline-media-actions button')!.click());
  expect(gateway.importFiles).toHaveBeenCalledOnce();
  update({ ...editorEntryVisibility, generateMedia: true });
  expect(generators()).toHaveLength(3);
  expect(gateway.bindTimeline).toHaveBeenCalledTimes(1);
  act(() => generators()[0].click());
  expect(gateway.openGenerator).toHaveBeenCalledOnce();
});
it('restores keyframe buttons independently and preserves recording state and other toolbar actions', () => {
  usePlayerStore.setState({ autoKeyframeEnabled: true });
  const { host, update } = render(<TimelineToolbar />);
  const controls = () => host.querySelector('[aria-label="Auto-record manual edits as keyframes"]');
  expect(controls()).toBeNull();
  expect(host.querySelector('[aria-label="Linked Selection"]')).not.toBeNull();
  expect(host.querySelector('[aria-label="Toggle timeline snapping"]')).not.toBeNull();
  expect(usePlayerStore.getState().autoKeyframeEnabled).toBe(true);
  update({ ...editorEntryVisibility, timelineKeyframeControls: true });
  expect(controls()).not.toBeNull();
  expect(usePlayerStore.getState().autoKeyframeEnabled).toBe(true);
  expect(allEditorEntriesVisible).toEqual({ generateMedia: true, timelineKeyframeControls: true });
});
