// @vitest-environment happy-dom
import { act } from 'react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { mountHost, cleanupMounted } from '../../components/ui/mountHost.testHelpers';
import { TimelineEditProvider } from '../../contexts/TimelineEditContext';
import { TimelineTrackAudioControls } from './TimelineTrackAudioControls';
import type { TimelineElement } from '../store/timelineElement';

const write = vi.fn(async () => ({ status: 'saved' as const }));
const clip = (id: string, tag: string, extra = {}): TimelineElement => ({ id, tag, start: 0, duration: 2, track: 1, ...extra });
const video = clip('video', 'video', { hasAudio: true, volume: 0.7 });
const audio = clip('audio', 'audio', { volume: 0.5 });
const render = (elements: TimelineElement[]) => mountHost(<TimelineEditProvider value={{ onSetElementsAttributeQuiet: write }}>
  <TimelineTrackAudioControls elements={elements} trackLabel="Track" isAudioOnly={false} hidden={false} onUnhide={() => {}} />
</TimelineEditProvider>);
beforeEach(() => write.mockClear());
afterEach(cleanupMounted);

it('mutes all audible clips in the row without changing video visibility or volume', async () => {
  const host = render([video, audio, clip('image', 'img')]);
  expect(host.querySelectorAll('button')).toHaveLength(1);
  await act(async () => host.querySelector<HTMLButtonElement>('[aria-label="Mute audio · Track"]')!.click());
  expect(write).toHaveBeenCalledExactlyOnceWith([{ element: video, value: 'true' }, { element: audio, value: 'true' }], 'muted', 'Mute audio');
});

it('unmutes authored muted media without resetting its gain', async () => {
  const muted = { ...video, muted: true };
  const host = render([muted]);
  await act(async () => host.querySelector<HTMLButtonElement>('[aria-label="Unmute audio · Track"]')!.click());
  expect(write).toHaveBeenCalledExactlyOnceWith([{ element: muted, value: null }], 'muted', 'Unmute audio');
});

it('commits a volume adjustment once on release for all clips', async () => {
  const host = render([video, audio]);
  await act(async () => host.querySelector<HTMLButtonElement>('[aria-label="Mute audio · Track"]')!.focus());
  const input = document.querySelector<HTMLInputElement>('input[aria-label="Volume"]')!;
  expect(input).not.toBeNull();
  act(() => {
    Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')!.set!.call(input, '45');
    input.dispatchEvent(new Event('input', { bubbles: true }));
  });
  expect(write).not.toHaveBeenCalled();
  await act(async () => input.dispatchEvent(new PointerEvent('pointerup', { bubbles: true })));
  expect(write).toHaveBeenCalledExactlyOnceWith([{ element: video, value: '0.45' }, { element: audio, value: '0.45' }], 'data-volume', 'Change volume');
});

it('does not offer audio controls on visual-only tracks', () => {
  const host = render([clip('image', 'img'), clip('silent', 'video', { hasAudio: false })]);
  expect(host.querySelector('button')).toBeNull();
});

it('opens the slider on hover without muting, and keeps it open when mute is clicked', async () => {
  const host = render([video]);
  const button = host.querySelector<HTMLButtonElement>('[aria-label="Mute audio · Track"]')!;
  await act(async () => {
    button.dispatchEvent(new MouseEvent('mouseenter', { bubbles: false }));
    button.dispatchEvent(new MouseEvent('mousemove', { bubbles: true }));
    await new Promise(resolve => setTimeout(resolve, 200));
  });
  expect(document.querySelector('input[aria-label="Volume"]')).not.toBeNull();
  expect(write).not.toHaveBeenCalled();
  await act(async () => button.click());
  expect(write).toHaveBeenCalledOnce();
  expect(document.querySelector('input[aria-label="Volume"]')).not.toBeNull();
});
