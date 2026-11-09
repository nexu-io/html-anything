// @vitest-environment happy-dom
import { afterEach, expect, it, vi } from 'vitest';
import page from '../../../web/connect.html?raw';
import { mountConnection } from '../../../web/connect';
import { translate, type Locale } from './messages';

let controller: ReturnType<typeof mountConnection> | undefined;
afterEach(() => { controller?.destroy(); controller = undefined; document.body.replaceChildren(); vi.restoreAllMocks(); vi.unstubAllGlobals(); });

it('updates live dialog labels while preserving the chosen client, search, preview and copied instructions', async () => {
  vi.stubGlobal('matchMedia', () => ({ matches: false, addEventListener() {}, removeEventListener() {} }));
  vi.stubGlobal('IntersectionObserver', class { observe() {} disconnect() {} });
  vi.spyOn(HTMLMediaElement.prototype, 'pause').mockImplementation(() => {});
  vi.spyOn(HTMLMediaElement.prototype, 'load').mockImplementation(() => {});
  vi.spyOn(navigator.clipboard, 'writeText').mockResolvedValue();
  const info = { name: 'OpenMotion', version: '0.6.2', previewUrl: 'http://localhost:4173', dataDirectory: '/test/workspace', transport: { type: 'stdio', command: 'node', args: ['mcp.ts'], env: { MOTION_DATA_DIR: '/test/workspace' } }, tools: [{ name: 'motion_import_assets', description: 'Import assets' }] };
  const template = { id: 'reference', title: 'Preview', author: 'Creator', description: 'Original template description', tags: [], collection: 'moment', kind: 'reference' };
  vi.stubGlobal('fetch', vi.fn(async (url: string) => new Response(JSON.stringify(url.endsWith('/integration') ? info : { items: [template], total: 1, entryTotal: 1, catalogTotal: 1, offset: 0, next: null }))));
  const root = document.createElement('div');
  root.innerHTML = '<input id="template-search"><button id="connection-templates"></button>' + page;
  document.body.append(root);
  const t = (locale: Locale) => (message: string, values?: Record<string, string | number>) => translate(locale, message, values);
  controller = mountConnection(root, { locale: 'zh-CN', t: t('zh-CN'), close() {}, useTemplate() {} });
  controller.resume();
  await vi.waitFor(() => expect(root.querySelectorAll('[data-template-id]')).toHaveLength(1));
  root.querySelector<HTMLButtonElement>('#host-claude')!.click();
  const search = root.querySelector<HTMLInputElement>('#template-search')!;
  search.value = 'keep this query';
  const card = root.querySelector('[data-template-id]'), video = root.querySelector('video');
  const instruction = root.querySelector('#setup-prompt')!.textContent;
  for (const locale of ['ja', 'de', 'ru', 'pt-BR', 'en'] as const) {
    controller.setLanguage(locale, t(locale));
    expect(root.querySelector('#host-claude')?.getAttribute('aria-selected')).toBe('true');
    expect(root.querySelector('#config-description')?.textContent).toBe(translate(locale, 'Use this configuration to connect, keeping your existing services.'));
    expect(root.querySelector('#service-status')?.textContent).toBe(translate(locale, 'Workspace reachable · v{version}', { version: '0.6.2' }));
    expect(root.querySelector('#connect-title')?.textContent).toContain('Claude Code');
    expect(search.value).toBe('keep this query');
    expect(root.querySelector('[data-template-id]')).toBe(card);
    expect(root.querySelector('video')).toBe(video);
    expect(root.querySelector('.connect-template-title')?.textContent).toBe('Preview');
    expect(root.querySelector('#setup-prompt')?.textContent).toBe(instruction);
  }
  root.querySelector<HTMLButtonElement>('#copy-setup')!.click();
  await vi.waitFor(() => expect(navigator.clipboard.writeText).toHaveBeenCalledWith(instruction));
});
