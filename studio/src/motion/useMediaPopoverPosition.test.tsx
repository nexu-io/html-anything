// @vitest-environment happy-dom
import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { expect, it, vi } from 'vitest';
import { useMediaPopoverPosition } from './useMediaPopoverPosition';
import { mediaPopoverAnchor } from './mediaPopoverPosition';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

it('repositions before paint when results grow, and follows the opener on scroll', async () => {
  const host = document.createElement('div'), opener = document.createElement('button');
  document.body.append(host, opener);
  const openerRect = vi.spyOn(opener, 'getBoundingClientRect').mockReturnValue(new DOMRect(700, 700, 80, 32));
  const nativeRect = HTMLElement.prototype.getBoundingClientRect;
  vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(function (this: HTMLElement) {
    return this.dataset.height ? new DOMRect(0, 0, 640, Number(this.dataset.height)) : nativeRect.call(this);
  });
  const anchor = mediaPopoverAnchor(opener);
  function Surface({ height }: { height: number }) {
    const popover = useMediaPopoverPosition(anchor, 640);
    return <aside ref={popover.ref} style={popover.style} data-height={height} />;
  }
  const root = createRoot(host);
  try {
    await act(async () => root.render(<Surface height={440} />));
    const panel = host.querySelector('aside')!;
    expect(Number.parseFloat(panel.style.top) + 440).toBe(692);
    // No resize event or observer delivery: the new content must anchor in its own commit.
    await act(async () => root.render(<Surface height={590} />));
    expect(Number.parseFloat(panel.style.top) + 590).toBe(692);
    openerRect.mockReturnValue(new DOMRect(600, 620, 80, 32));
    await act(async () => opener.dispatchEvent(new Event('scroll')));
    expect(Number.parseFloat(panel.style.top) + 590).toBe(612);
    opener.remove();
    openerRect.mockReturnValue(new DOMRect());
    expect(anchor.getBoundingClientRect().top).toBe(620);
  } finally {
    act(() => root.unmount());
    host.remove(); opener.remove(); vi.restoreAllMocks();
  }
});
