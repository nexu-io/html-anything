// @vitest-environment happy-dom
import { act, useState } from 'react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { mountHost, cleanupMounted } from '../../components/ui/mountHost.testHelpers';
import { TimelineEditProvider } from '../../contexts/TimelineEditContext';
import { TimelineTrackAudioControls } from './TimelineTrackAudioControls';
import type { TimelineElement } from '../store/timelineElement';

const probe = vi.hoisted(() => vi.fn());
vi.mock('../lib/mediaProbe', () => ({ probeMediaUrl: probe }));

const write = vi.fn(async () => ({ status: 'saved' as const }));
const clip = (id: string, tag: string, extra = {}): TimelineElement => ({ id, tag, start: 0, duration: 2, track: 1, ...extra });
const video = clip('video', 'video', { hasAudio: true, volume: 0.7 });
const audio = clip('audio', 'audio', { volume: 0.5 });
const render = (elements: TimelineElement[]) => mountHost(<TimelineEditProvider value={{ onSetElementsAttributeQuiet: write }}>
  <TimelineTrackAudioControls elements={elements} trackLabel="Track" isAudioOnly={false} hidden={false} onUnhide={() => {}} />
</TimelineEditProvider>);
beforeEach(() => { write.mockClear(); probe.mockReset(); probe.mockResolvedValue(null); });
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

it('shows muted output at the bottom of a 0–100 slider without overwriting saved gain', async () => {
  const host = render([{ ...video, muted: true }]);
  await act(async () => host.querySelector<HTMLButtonElement>('button')!.focus());
  const input = document.querySelector<HTMLInputElement>('input[aria-label="Volume"]')!;
  expect(input.min).toBe('0');
  expect(input.max).toBe('100');
  expect(input.value).toBe('0');
  expect(document.querySelector('[role="dialog"]')?.textContent).toBe('0%');
  expect(write).not.toHaveBeenCalled();
});

it('raising the muted slider saves volume and unmutes the track', async () => {
  const muted = { ...video, muted: true };
  const host = render([muted]);
  await act(async () => host.querySelector<HTMLButtonElement>('button')!.focus());
  const input = document.querySelector<HTMLInputElement>('input[aria-label="Volume"]')!;
  act(() => {
    Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')!.set!.call(input, '45');
    input.dispatchEvent(new Event('input', { bubbles: true }));
  });
  await act(async () => input.dispatchEvent(new PointerEvent('pointerup', { bubbles: true })));
  expect(write).toHaveBeenNthCalledWith(1, [{ element: muted, value: '0.45' }], 'data-volume', 'Change volume');
  expect(write).toHaveBeenNthCalledWith(2, [{ element: muted, value: null }], 'muted', 'Unmute audio');
});


it('keeps source-audio controls through unmute, mute and volume changes when manifest audio metadata is absent', async () => {
  probe.mockResolvedValue({ hasAudio: true });
  let update!: (element: TimelineElement) => void;
  const source = clip('sound', 'video', { src: '/sound.mp4', muted: true });
  function Harness() {
    const [element, setElement] = useState(source);
    update = setElement;
    return <TimelineEditProvider value={{ onSetElementsAttributeQuiet: write }}>
      <TimelineTrackAudioControls elements={[element]} trackLabel="Track" isAudioOnly={false} hidden={false} onUnhide={() => {}} />
    </TimelineEditProvider>;
  }
  let host!: HTMLElement;
  await act(async () => { host = mountHost(<Harness />); });
  expect(host.querySelector('[aria-label="Unmute audio · Track"]')).not.toBeNull();
  await act(async () => host.querySelector<HTMLButtonElement>('button')!.click());
  await act(async () => update({ ...source, muted: undefined, volume: 0.54 }));
  const speaker = host.querySelector<HTMLButtonElement>('[aria-label="Mute audio · Track"]');
  expect(speaker).not.toBeNull();
  await act(async () => speaker!.focus());
  expect(document.querySelector<HTMLInputElement>('input[aria-label="Volume"]')?.value).toBe('54');
  await act(async () => speaker!.click());
  expect(write).toHaveBeenLastCalledWith([{ element: { ...source, muted: undefined, volume: 0.54 }, value: 'true' }], 'muted', 'Mute audio');
  await act(async () => update({ ...source, muted: true, volume: 0.54 }));
  expect(host.querySelector('[aria-label="Unmute audio · Track"]')).not.toBeNull();
  expect(probe).toHaveBeenCalledTimes(1);
});

it('hides controls only when the source is confirmed silent and reevaluates replaced media', async () => {
  probe.mockImplementation(async (src: string) => ({ hasAudio: src === '/sound.mp4' }));
  let update!: (element: TimelineElement) => void;
  function Harness() {
    const [element, setElement] = useState(clip('media', 'video', { src: '/silent.mp4', muted: true }));
    update = setElement;
    return <TimelineTrackAudioControls elements={[element]} trackLabel="Track" isAudioOnly={false} hidden={false} onUnhide={() => {}} />;
  }
  let host!: HTMLElement;
  await act(async () => { host = mountHost(<Harness />); });
  expect(host.querySelector('button')).toBeNull();
  await act(async () => update(clip('media', 'video', { src: '/sound.mp4', volume: 0 })));
  expect(host.querySelector('button')).not.toBeNull();
});

it('retains unknown video controls if audio probing is unavailable', async () => {
  let host!: HTMLElement;
  await act(async () => { host = render([clip('unknown', 'video', { src: '/unavailable.mp4' })]); });
  expect(host.querySelector('[aria-label="Mute audio · Track"]')).not.toBeNull();
});
