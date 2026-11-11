// @vitest-environment happy-dom
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { afterEach, expect, it } from 'vitest';
import { isEmptyPreviewDocument, useEmptyPreview } from './useEmptyPreview';
import { usePlayerStore } from '../../player/store/playerStore';
import { usePreviewIframeStore } from '../../player/store/previewIframeStore';
globalThis.IS_REACT_ACT_ENVIRONMENT = true;
afterEach(() => { usePlayerStore.getState().reset(); usePreviewIframeStore.getState().setIframe(null); document.body.replaceChildren(); });
it('recognizes blank roots without hiding static content, media or unloaded previews', () => {
  const doc = new DOMParser().parseFromString('<body><div data-composition-id="main"></div><script>init()</script></body>', 'text/html');
  expect(isEmptyPreviewDocument(doc)).toBe(true);
  const root = doc.querySelector('div')!;
  for (const content of ['Hello', '<h1>Title</h1>', '<img src="a.png">', '<audio src="a.wav"></audio>', '<canvas></canvas>']) {
    root.innerHTML = content;
    expect(isEmptyPreviewDocument(doc)).toBe(false);
  }
  expect(isEmptyPreviewDocument(null)).toBe(false);
  expect(isEmptyPreviewDocument(new DOMParser().parseFromString('<body>Loading</body>', 'text/html'))).toBe(false);
});
it('only enables empty UI for a loaded matching session and updates after content insertion', async () => {
  const iframe = document.createElement('iframe'); document.body.append(iframe);
  iframe.contentDocument!.body.innerHTML = '<div data-composition-id="main"></div>';
  usePreviewIframeStore.getState().setIframe(iframe);
  usePlayerStore.setState({ timelineReady: false, timelineProjectId: 'p', elements: [] });
  const host = document.createElement('div'); document.body.append(host); const root = createRoot(host);
  function Harness({ enabled = true, project = 'p' }) { return <span>{String(useEmptyPreview(project, enabled))}</span>; }
  await act(async () => root.render(<Harness />)); expect(host.textContent).toBe('false');
  await act(async () => usePlayerStore.setState({ timelineReady: true })); expect(host.textContent).toBe('true');
  await act(async () => { iframe.contentDocument!.querySelector('div')!.textContent = 'Static title'; }); expect(host.textContent).toBe('false');
  await act(async () => { iframe.contentDocument!.querySelector('div')!.textContent = ''; }); expect(host.textContent).toBe('true');
  await act(async () => root.render(<Harness enabled={false} />)); expect(host.textContent).toBe('false');
  await act(async () => root.render(<Harness project="other" />)); expect(host.textContent).toBe('false');
  act(() => root.unmount());
});
