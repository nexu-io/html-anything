// @vitest-environment happy-dom
// The editor's template library is the shared gallery in web/template-gallery.ts, not HomeTemplates.
// These cases drive the real gallery DOM so a missing report at its handlers cannot pass on schema tests alone.
import { afterEach, expect, it, vi } from 'vitest';
import page from '../../../web/connect.html?raw';
import { mountConnection } from '../../../web/connect';

let controller: ReturnType<typeof mountConnection> | undefined;
afterEach(() => { controller?.destroy(); controller = undefined; document.body.replaceChildren(); vi.restoreAllMocks(); vi.unstubAllGlobals(); });

const info = { name: 'OpenMotion', version: '0.6.3', previewUrl: 'http://localhost:4173', dataDirectory: '/test/workspace',
  transport: { type: 'stdio', command: 'node', args: ['mcp.ts'], env: { MOTION_DATA_DIR: '/test/workspace' } }, tools: [] };
const template = { id: 'hf-moment-M1147', title: 'Private-looking title', author: 'Creator Name', description: 'Body', tags: [], role: 'a-roll', collection: 'moment', kind: 'reference' };

async function library(onTemplateEvent?: (event: Record<string, unknown>) => void) {
  vi.stubGlobal('matchMedia', () => ({ matches: false, addEventListener() {}, removeEventListener() {} }));
  vi.stubGlobal('IntersectionObserver', class { observe() {} disconnect() {} });
  vi.spyOn(HTMLMediaElement.prototype, 'pause').mockImplementation(() => {});
  vi.spyOn(HTMLMediaElement.prototype, 'load').mockImplementation(() => {});
  vi.stubGlobal('fetch', vi.fn(async (url: string) => Response.json(String(url).endsWith('/integration') ? info
    : { items: [template], total: 1, entryTotal: 1, catalogTotal: 1, offset: 0, next: null })));
  const root = document.createElement('div');
  root.innerHTML = '<input id="template-search"><button id="connection-templates"></button>' + page;
  document.body.append(root);
  controller = mountConnection(root, { locale: 'en', t: message => message, close() {}, useTemplate() {}, onTemplateEvent: onTemplateEvent as never });
  controller.resume();
  await vi.waitFor(() => expect(root.querySelectorAll('[data-template-id]')).toHaveLength(1));
  await vi.waitFor(() => expect(root.querySelector<HTMLButtonElement>('[data-copy-template]')!.disabled).toBe(false));
  return root;
}

it('reports copy click and the real copy result, preview, category and one search per query', async () => {
  const seen: Record<string, unknown>[] = [];
  const write = vi.spyOn(navigator.clipboard, 'writeText').mockResolvedValue();
  const root = await library(event => seen.push(event));

  root.querySelector<HTMLButtonElement>('[data-copy-template]')!.click();
  await vi.waitFor(() => expect(seen).toHaveLength(2));
  expect(seen).toEqual([
    { kind: 'copy_click', templateId: 'hf-moment-M1147' },
    { kind: 'copy_result', templateId: 'hf-moment-M1147', host: 'codex', status: 'clipboard_written' },
  ]);

  write.mockRejectedValue(new Error('NotAllowedError: /private/clipboard'));
  root.querySelector<HTMLButtonElement>('[data-copy-template]')!.click();
  await vi.waitFor(() => expect(seen).toHaveLength(4));
  expect(seen[3]).toEqual({ kind: 'copy_result', templateId: 'hf-moment-M1147', host: 'codex', status: 'manual_fallback_shown' });

  seen.length = 0;
  root.querySelector<HTMLButtonElement>('.connect-template-cover')!.click();
  const tabs = [...root.querySelectorAll<HTMLButtonElement>('[data-category]')];
  const other = tabs.find(tab => tab.getAttribute('aria-selected') !== 'true')!;
  other.click(); other.click();
  const search = document.getElementById('template-search') as HTMLInputElement;
  for (const value of ['p', 'pr', 'pro', '', 'x']) { search.value = value; search.dispatchEvent(new Event('input')); }
  expect(seen).toEqual([
    { kind: 'preview', templateId: 'hf-moment-M1147' },
    { kind: 'category', category: other.dataset.category },
    { kind: 'search' }, { kind: 'search' },
  ]);
  // The gallery hands over ids and categories only.
  expect(JSON.stringify(seen)).not.toMatch(/Private-looking|Creator Name|NotAllowedError/);
});

it('copies and previews the same with no listener, and when the listener throws', async () => {
  const write = vi.spyOn(navigator.clipboard, 'writeText').mockResolvedValue();
  let root = await library();
  root.querySelector<HTMLButtonElement>('[data-copy-template]')!.click();
  await vi.waitFor(() => expect(write).toHaveBeenCalledTimes(1));
  controller!.destroy(); document.body.replaceChildren();

  root = await library(() => { throw new Error('collector down'); });
  root.querySelector<HTMLButtonElement>('[data-copy-template]')!.click();
  await vi.waitFor(() => expect(write).toHaveBeenCalledTimes(2));
  root.querySelector<HTMLButtonElement>('.connect-template-cover')!.click();
  expect(root.querySelector<HTMLDialogElement>('#template-preview-dialog')!.open).toBe(true);
});
