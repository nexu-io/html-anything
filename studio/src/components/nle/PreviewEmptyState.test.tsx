// @vitest-environment happy-dom
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { expect, it, vi } from 'vitest';
import { PreviewEmptyState } from './PreviewEmptyState';
import { PreviewReadOnlyProvider } from '../editor/previewReadOnlyContext';
const gateway = vi.hoisted(() => ({ importFiles: vi.fn() }));
vi.mock('../../motion/MediaGatewayContext', () => ({ useMediaGateway: () => gateway }));
globalThis.IS_REACT_ACT_ENVIRONMENT = true;
it('opens the existing importer, omits decorative media icons and respects write protection', () => {
  const host = document.createElement('div'); const root = createRoot(host);
  act(() => root.render(<PreviewEmptyState />));
  expect(host.textContent).toContain('Drop video, audio or images here');
  expect(host.querySelector('svg')).toBeNull();
  act(() => host.querySelector('button')!.click()); expect(gateway.importFiles).toHaveBeenCalledOnce();
  act(() => root.render(<PreviewReadOnlyProvider readOnly><PreviewEmptyState /></PreviewReadOnlyProvider>));
  expect(host.querySelector('button')!.disabled).toBe(true);
  act(() => host.querySelector('button')!.click()); expect(gateway.importFiles).toHaveBeenCalledOnce();
  act(() => root.unmount());
});
