// @vitest-environment happy-dom
import { StudioHostContext } from './StudioHost';
import React, { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { TimelineMediaBar } from './TimelineMediaBar';
import { TimelineReadOnlyContext } from '../player/components/timelineReadOnly';
import type { TimelineState } from '../player/components/TimelineProvider';
import type { TimelineElement } from '../player/store/playerStore';
import { usePlayerStore } from '../player/store/playerStore';
import { I18nProvider } from '../i18n/I18n';
import { projectMediaPath, selectedMedia } from './timelineMediaSelection';
import { ArtifactViewActive } from './ArtifactViewState';

const hooks = vi.hoisted(() => ({ state: {} as TimelineState, open: vi.fn() }));
vi.mock('../player/components/EditModal', () => ({ EditPopover: ({ initialPrompt, rangeStart, rangeEnd, selectedElementKey }: { initialPrompt: string; rangeStart: number; rangeEnd: number; selectedElementKey?: string }) => <div data-testid="agent-edit" data-selected-key={selectedElementKey}>{initialPrompt} {rangeStart}–{rangeEnd}</div> }));
vi.mock('../player/components/TimelineProvider', () => ({ useTimelineContext: () => ({ state: hooks.state }) }));
vi.mock('./MediaGatewayContext', () => ({ useMediaGateway: () => ({ openGenerator: hooks.open, generationOpen: false }) }));
(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
let root: Root; let viewport: HTMLDivElement;
const clip = { id: 'image', key: 'main:image', tag: 'img', src: 'assets/original.png', label: 'Forest', start: 2, duration: 6, track: 1 } as TimelineElement;
beforeEach(() => {
  hooks.open.mockReset(); usePlayerStore.getState().reset();
  const host = document.createElement('div'); host.dataset.motionStudio = ''; document.body.append(host); root = createRoot(host);
  const timeline = document.createElement('div'); timeline.dataset.studioTimeline = ''; document.body.append(timeline);
  viewport = document.createElement('div'); timeline.append(viewport); viewport.scrollLeft = 40;
  vi.spyOn(viewport, 'getBoundingClientRect').mockReturnValue(new DOMRect(100, 500, 800, 300));
  vi.spyOn(timeline, 'getBoundingClientRect').mockReturnValue({ top: 460 } as DOMRect);
  hooks.state = { timelineReady: true, elements: [clip], selectedElementId: clip.key!, sessionEpoch: 1,
    canvas: { scrollRef: { current: viewport }, pps: 100, contentOrigin: 80 }, overlays: {} } as TimelineState;
});
afterEach(() => { act(() => root.unmount()); document.body.innerHTML = ''; vi.restoreAllMocks(); usePlayerStore.getState().reset(); });
async function render(readOnly = false) { await act(async () => root.render(<I18nProvider initialLocale="en"><TimelineReadOnlyContext.Provider value={readOnly ? () => {} : null}><TimelineMediaBar /></TimelineReadOnlyContext.Provider></I18nProvider>)); }
function button(label: string) { return Array.from(document.querySelectorAll('button')).find(b => b.textContent === label)!; }

it('opens image editing from the selected clip with the original media and exact timing, and supports dismiss/reopen', async () => {
  await render(); expect(document.body.textContent).toContain('2.0–8.0s');
  const prompt = document.querySelector('input')!;
  await act(async () => { Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')!.set!.call(prompt, 'make it sunset'); prompt.dispatchEvent(new Event('input', { bubbles: true })); });
  await act(async () => button('Edit image').click());
  expect(hooks.open).toHaveBeenCalledWith(expect.objectContaining({ intent: 'edit', prompt: 'make it sunset', modality: 'image', placement: { start: 2, duration: 6, track: 1 }, selection: expect.objectContaining({ path: 'assets/original.png', key: 'main:image' }) }));
  await act(async () => prompt.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true })));
  expect(document.querySelector('aside')).toBeNull();
  await act(async () => viewport.dispatchEvent(new PointerEvent('pointerup', { button: 0, clientX: 300, clientY: 550 })));
  expect(document.querySelector('aside')).not.toBeNull();
  await render(true); expect(document.querySelector('aside')).toBeNull();
});

it('range takes priority over a selected clip; ruler activation uses zoom and scroll coordinates without a selection', async () => {
  hooks.state.overlays = { ...hooks.state.overlays, showPopover: true, rangeSelection: { start: 8, end: 5, anchorX: 0, anchorY: 0 } };
  await render(); expect(button('Edit image')).toBeUndefined();
  await act(async () => button('Generate media').click());
  expect(hooks.open).toHaveBeenLastCalledWith(expect.objectContaining({ placement: { start: 5, duration: 3, track: 0 }, selection: undefined }));
  hooks.state.overlays.showPopover = false; hooks.state.selectedElementId = null;
  await render(); expect(document.querySelector('aside')).toBeNull();
  await act(async () => viewport.dispatchEvent(new PointerEvent('pointerup', { button: 0, clientX: 440, clientY: 505 })));
  expect(document.body.textContent).toContain('3.0–6.0s');
  await act(async () => button('Generate media').click());
  expect(hooks.open).toHaveBeenLastCalledWith(expect.objectContaining({ placement: { start: 3, duration: 3, track: 0 } }));
  await act(async () => usePlayerStore.setState({ isPlaying: true })); expect(document.querySelector('aside')).toBeNull();
});

it('reference selection resolves project media and rejects remote or locked media', () => {
  expect(projectMediaPath('/api/projects/demo/preview/assets/a%20b.png?v=2')).toBe('assets/a b.png');
  expect(projectMediaPath('../assets/a%20b.png', 'scenes/intro.html')).toBe('assets/a b.png');
  expect(projectMediaPath('https://example.com/a.png')).toBeNull();
  expect(projectMediaPath('../outside.png')).toBeNull();
  expect(selectedMedia({ ...clip, timelineLocked: true })).toBeUndefined();
});

it('anchors both surfaces to the selected track and follows scrolling instead of the timeline header', async () => {
  const element = document.createElement('div'); element.dataset.clip = 'true'; element.dataset.elId = clip.key;
  viewport.append(element);
  const rect = vi.spyOn(element, 'getBoundingClientRect').mockReturnValue(new DOMRect(340, 690, 180, 36));
  const nativeRect = HTMLElement.prototype.getBoundingClientRect;
  vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(function (this: HTMLElement) {
    return this.matches('.motion-timeline-media-bar') ? new DOMRect(0, 0, 680, 88) : nativeRect.call(this);
  });
  await render();
  const surface = document.querySelector<HTMLElement>('.motion-timeline-media-bar')!;
  expect(Number.parseFloat(surface.style.top) + 88).toBe(682);
  await act(async () => button('Generate media').click());
  const request = hooks.open.mock.lastCall![0];
  expect(request.anchor.getBoundingClientRect()).toEqual({ left: 340, right: 520, top: 690, bottom: 726 });
  rect.mockReturnValue(new DOMRect(240, 610, 180, 36));
  await act(async () => viewport.dispatchEvent(new Event('scroll')));
  expect(Number.parseFloat(surface.style.top) + 88).toBe(602);
  expect(request.anchor.getBoundingClientRect()).toEqual({ left: 240, right: 420, top: 610, bottom: 646 });
});

it('removes the portalled media actions while the owning Viewer is hidden and restores them with the Viewer', async () => {
  const renderActive = async (active: boolean) => act(async () => root.render(<I18nProvider initialLocale="en"><ArtifactViewActive.Provider value={active}><TimelineMediaBar /></ArtifactViewActive.Provider></I18nProvider>));
  await renderActive(true);
  expect(document.querySelector('.motion-timeline-media-bar')).not.toBeNull();
  await renderActive(false);
  expect(document.querySelector('.motion-timeline-media-bar')).toBeNull();
  await renderActive(true);
  expect(document.querySelector('.motion-timeline-media-bar')).not.toBeNull();
});

it('MVP keeps clip and range prompts for Agent without opening media generation', async () => {
  const mountMvp = () => act(async () => root.render(<StudioHostContext.Provider value={{ mvpEditor: true }}><TimelineMediaBar /></StudioHostContext.Provider>));
  await mountMvp();
  expect(button('Generate media')).toBeUndefined();
  expect(button('Edit image')).toBeUndefined();
  expect(button('Ask Agent')).toBeDefined();
  const prompt = document.querySelector('input')!;
  await act(async () => {
    Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')!.set!.call(prompt, 'Make this title larger');
    prompt.dispatchEvent(new Event('input', { bubbles: true }));
  });
  await act(async () => prompt.closest('form')!.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true })));
  expect(document.querySelector('[data-testid="agent-edit"]')?.textContent).toBe('Make this title larger 2–8');
  expect(document.querySelector('[data-testid="agent-edit"]')?.getAttribute('data-selected-key')).toBe('main:image');
  expect(hooks.open).not.toHaveBeenCalled();
  await act(async () => root.render(null));
  hooks.state.overlays = { ...hooks.state.overlays, showPopover: true, rangeSelection: { start: 8, end: 5, anchorX: 0, anchorY: 0 } };
  await mountMvp();
  await act(async () => button('Ask Agent').click());
  expect(document.querySelector('[data-testid="agent-edit"]')?.textContent).toBe(' 5–8');
  expect(document.querySelector('[data-testid="agent-edit"]')?.hasAttribute('data-selected-key')).toBe(false);
  expect(hooks.open).not.toHaveBeenCalled();
});

it('dismisses after leaving the opener and popover, but protects a focused draft', async () => {
  await render();
  vi.useFakeTimers();
  try {
    const leave = () => document.body.dispatchEvent(new PointerEvent('pointermove', { bubbles: true, clientX: 1, clientY: 1 }));
    await act(async () => leave());
    await act(async () => vi.advanceTimersByTime(349));
    expect(document.querySelector('aside')).not.toBeNull();
    await act(async () => vi.advanceTimersByTime(1));
    expect(document.querySelector('aside')).toBeNull();
    await act(async () => viewport.dispatchEvent(new PointerEvent('pointerup', { button: 0, clientX: 300, clientY: 550 })));
    const input = document.querySelector('input')!;
    await act(async () => { input.focus(); leave(); vi.advanceTimersByTime(1000); });
    expect(document.querySelector('aside')).not.toBeNull();
    const outsideControl = document.createElement('button');
    outsideControl.addEventListener('pointerdown', event => event.stopPropagation());
    document.body.append(outsideControl);
    await act(async () => outsideControl.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true })));
    outsideControl.remove();
    expect(document.querySelector('aside')).toBeNull();
  } finally { vi.useRealTimers(); }
});

it('keeps drafts attached to their target when selecting another clip and reopening', async () => {
  await render();
  const input = document.querySelector('input')!;
  await act(async () => {
    Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')!.set!.call(input, 'Title only');
    input.dispatchEvent(new Event('input', { bubbles: true }));
  });
  const other = { ...clip, id: 'note', key: 'main:note', label: 'Note' };
  hooks.state.elements = [clip, other]; hooks.state.selectedElementId = other.key;
  await render();
  expect(document.querySelector('input')!.value).toBe('');
  hooks.state.selectedElementId = clip.key!;
  await render();
  expect(document.querySelector('input')!.value).toBe('Title only');
  hooks.state.sessionEpoch = 2;
  await render();
  expect(document.querySelector('input')!.value).toBe('');
});
