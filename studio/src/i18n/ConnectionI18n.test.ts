// @vitest-environment happy-dom
import { afterEach, expect, it, vi } from 'vitest';
import page from '../../../web/connect.html?raw';
import { mountConnection } from '../../../web/connect';
import { dictionaries, languages, translate, type Locale } from './messages';

let controller: ReturnType<typeof mountConnection> | undefined;
afterEach(() => { controller?.destroy(); controller = undefined; document.body.replaceChildren(); vi.restoreAllMocks(); vi.unstubAllGlobals(); vi.useRealTimers(); });

it('polls cache warnings independently of publication changes and preserves gallery cards', async () => {
  vi.useFakeTimers();
  vi.stubGlobal('matchMedia', () => ({ matches: false, addEventListener() {}, removeEventListener() {} }));
  vi.stubGlobal('IntersectionObserver', class { observe() {} disconnect() {} });
  let warning: string | undefined;
  const info = { version: '0.6.3', previewUrl: 'http://localhost:4173', transport: { type: 'stdio', command: 'node', args: ['mcp.ts'] }, tools: [] };
  const template = { id: 'prism', title: 'Published template', tags: [], collection: 'example', kind: 'prism' };
  vi.stubGlobal('fetch', vi.fn(async (url: string) => Response.json(url.endsWith('/integration') ? info : {
    items: [template], total: 1, entryTotal: 1, catalogTotal: 1, offset: 0, next: null,
    catalogVersion: 'same-publication', warning,
  })));
  const root = document.createElement('div');
  root.innerHTML = '<input id="template-search"><button id="connection-templates"></button>' + page;
  document.body.append(root);
  controller = mountConnection(root, { locale: 'en', t: message => message, close() {}, useTemplate() {} });
  controller.resume();
  await vi.advanceTimersByTimeAsync(1);
  const card = root.querySelector('[data-template-id]');
  expect(card).not.toBeNull();
  warning = 'Template refresh failed; using cached catalogue';
  await vi.advanceTimersByTimeAsync(5_000);
  expect(root.querySelector<HTMLElement>('#catalog-error')!.hidden).toBe(false);
  expect(root.querySelector('#catalog-error-text')!.textContent).toBe(warning);
  expect(root.querySelector('[data-template-id]')).toBe(card);
  warning = undefined;
  await vi.advanceTimersByTimeAsync(5_000);
  expect(root.querySelector<HTMLElement>('#catalog-error')!.hidden).toBe(true);
  expect(root.querySelector('[data-template-id]')).toBe(card);
});

it('updates live dialog labels while preserving the chosen client, search, preview and copied instructions', async () => {
  vi.stubGlobal('matchMedia', () => ({ matches: false, addEventListener() {}, removeEventListener() {} }));
  vi.stubGlobal('IntersectionObserver', class { observe() {} disconnect() {} });
  vi.spyOn(HTMLMediaElement.prototype, 'pause').mockImplementation(() => {});
  vi.spyOn(HTMLMediaElement.prototype, 'load').mockImplementation(() => {});
  vi.spyOn(navigator.clipboard, 'writeText').mockResolvedValue();
  const info = { name: 'OpenMotion', version: '0.6.2', previewUrl: 'http://localhost:4173', dataDirectory: '/test/workspace', transport: { type: 'stdio', command: 'node', args: ['mcp.ts'], env: { MOTION_DATA_DIR: '/test/workspace' } }, tools: [{ name: 'motion_import_assets', description: 'Import assets' }, { name: 'motion_list_templates', description: 'List templates' }, { name: 'motion_get_template', description: 'Template details' }] };
  const template = { id: 'reference', title: 'Preview', author: 'Creator', description: 'Original template description', tags: [], role: 'a-roll', collection: 'moment', kind: 'reference' };
  const warning = '模板更新失败，使用已缓存目录：HTTP 503';
  vi.stubGlobal('fetch', vi.fn(async (url: string) => new Response(JSON.stringify(url.endsWith('/integration') ? info : { items: [template], total: 1, entryTotal: 1, catalogTotal: 1, offset: 0, next: null, warning }))));
  const root = document.createElement('div');
  root.innerHTML = '<input id="template-search"><button id="connection-templates"></button>' + page;
  document.body.append(root);
  const t = (locale: Locale) => (message: string, values?: Record<string, string | number>) => translate(locale, message, values);
  controller = mountConnection(root, { locale: 'zh-CN', t: t('zh-CN'), close() {}, useTemplate() {} });
  controller.resume();
  await vi.waitFor(() => expect(root.querySelectorAll('[data-template-id]')).toHaveLength(1));
  expect(root.querySelector('.connect-template-category')?.textContent).toBe('口播剪辑');
  root.querySelector<HTMLButtonElement>('.connect-template-cover')!.click();
  root.querySelector<HTMLButtonElement>('#host-claude')!.click();
  const search = root.querySelector<HTMLInputElement>('#template-search')!;
  search.value = 'keep this query';
  const card = root.querySelector('[data-template-id]'), video = root.querySelector('video');
  const instruction = root.querySelector('#setup-prompt')!.textContent;
  for (const { locale } of languages) {
    controller.setLanguage(locale, t(locale));
    const category = locale === 'en' ? 'A-roll Cuts' : dictionaries[locale]['A-roll Cuts'];
    expect(root.querySelector('.connect-template-category')?.textContent).toBe(category);
    expect(root.querySelector('.connect-template-category')?.getAttribute('title')).toBe(category);
    expect(root.querySelector('#preview-detail')?.textContent).toBe(category);
    expect(root.querySelector('#host-claude')?.getAttribute('aria-selected')).toBe('true');
    expect(root.querySelector('#config-description')?.textContent).toBe(translate(locale, 'Use this configuration to connect, keeping your existing services.'));
    expect(root.querySelector('#service-status')?.textContent).toBe(translate(locale, 'Workspace reachable · v{version}', { version: '0.6.2' }));
    expect(root.querySelector('#connect-title')?.textContent).toContain('Claude Code');
    expect(root.querySelector('#tool-list')?.textContent).toContain(translate(locale, 'Get the template catalogue and local index.'));
    expect(root.querySelector('#tool-list')?.textContent).toContain(translate(locale, 'Read the details and files for one template.'));
    expect(root.querySelector('#catalog-error-text')?.textContent).toBe(translate(locale, warning));
    expect(search.value).toBe('keep this query');
    expect(root.querySelector('[data-template-id]')).toBe(card);
    expect(root.querySelector('video')).toBe(video);
    expect(root.querySelector('.connect-template-title')?.textContent).toBe('Preview');
    expect(root.querySelector('#setup-prompt')?.textContent).toBe(instruction);
  }
  root.querySelector<HTMLButtonElement>('#copy-setup')!.click();
  await vi.waitFor(() => expect(navigator.clipboard.writeText).toHaveBeenCalledWith(instruction));
});
