import { describe, expect, it } from 'vitest';
import { mediaPopoverPosition } from './mediaPopoverPosition';

const viewport = { left: 0, top: 0, width: 1920, height: 960 };
const panel = { width: 640, height: 440 };

describe('media popover placement', () => {
  it('sits directly above the empty timeline button and a lower selected track', () => {
    for (const anchor of [
      { left: 1133, right: 1208, top: 784, bottom: 816 },
      { left: 820, right: 960, top: 720, bottom: 756 },
    ]) {
      const result = mediaPopoverPosition(anchor, panel, viewport);
      expect(result.top + panel.height).toBe(anchor.top - 8);
      expect(result.left + panel.width / 2).toBe((anchor.left + anchor.right) / 2);
    }
  });

  it('flips below an opener near the top and stays inside the right edge', () => {
    const result = mediaPopoverPosition({ left: 1840, right: 1900, top: 50, bottom: 82 }, panel, viewport);
    expect(result.top).toBe(90);
    expect(result.left + panel.width).toBe(viewport.width - 12);
    expect(result.maxHeight).toBeGreaterThan(panel.height);
  });

  it('limits a tall result panel to the larger side without covering the opener', () => {
    const anchor = { left: 280, right: 320, top: 300, bottom: 336 };
    const result = mediaPopoverPosition(anchor, { width: 366, height: 900 }, { ...viewport, width: 390, height: 640 });
    expect(result.left).toBe(12);
    expect(result.top).toBe(344);
    expect(result.top + result.maxHeight).toBe(628);
  });

  it('keeps an offscreen anchor and oversized content within the visible viewport', () => {
    const result = mediaPopoverPosition({ left: -200, right: -100, top: 1300, bottom: 1340 }, { ...panel, height: 2000 }, viewport);
    expect(result.left).toBe(12);
    expect(result.top).toBe(12);
    expect(result.top + result.maxHeight).toBeLessThan(viewport.height);
  });
});
