// @vitest-environment happy-dom
import { afterEach, expect, it, vi } from 'vitest';
import page from '../../../web/connect.html?raw';
import { mountConnection } from '../../../web/connect';
import { dictionaries, languages, translate, type Locale } from './messages';

let controller: ReturnType<typeof mountConnection> | undefined;
afterEach(() => { controller?.destroy(); controller = undefined; document.body.replaceChildren(); vi.restoreAllMocks(); vi.unstubAllGlobals(); vi.useRealTimers(); });

it('keeps the current video frame visible when an animated gallery preview pauses', async () => {
  vi.stubGlobal('matchMedia', () => ({ matches: false, addEventListener() {}, removeEventListener() {} }));
  vi.stubGlobal('IntersectionObserver', class { observe() {} disconnect() {} });
  vi.spyOn(HTMLMediaElement.prototype, 'pause').mockImplementation(function (this: HTMLMediaElement) {
    this.dispatchEvent(new Event('pause'));
  });
  vi.spyOn(HTMLMediaElement.prototype, 'load').mockImplementation(() => {});
  const template = {
    id: 'prism', title: 'Published template', tags: [], collection: 'example', kind: 'prism',
    previewUrl: '/preview.mp4', posterUrl: '/poster.jpg',
  };
  vi.stubGlobal('fetch', vi.fn(async (url: string) => url.endsWith('/integration')
    ? new Response(null, { status: 503 })
    : Response.json({ items: [template], total: 1, entryTotal: 1, catalogTotal: 1, offset: 0, next: null })));
  const root = document.createElement('div');
  root.innerHTML = '<input id="template-search"><button id="connection-templates"></button>' + page;
  document.body.append(root);
  controller = mountConnection(root, { locale: 'en', t: message => message, close() {}, useTemplate() {} });
  controller.resume();
  await vi.waitFor(() => expect(root.querySelector('.connect-template-media video')).not.toBeNull());
  const video = root.querySelector<HTMLVideoElement>('.connect-template-media video')!;
  const poster = root.querySelector<HTMLImageElement>('.connect-template-media img')!;
  poster.dispatchEvent(new Event('load'));
  video.dispatchEvent(new Event('loadeddata'));
  expect(video.hidden).toBe(true);
  expect(poster.hidden).toBe(false);

  video.currentTime = 3.5;
  video.dispatchEvent(new Event('playing'));
  root.querySelector<HTMLButtonElement>('#toggle-previews')!.click();
  expect(video.hidden).toBe(false);
  expect(poster.hidden).toBe(true);
  expect(video.currentTime).toBe(3.5);
  localStorage.removeItem('openmotion.template-previews');
});

it.each([0, 1, 2, 4])('restores a preview after returning from its source with readyState %s', async readyState => {
  vi.stubGlobal('matchMedia', () => ({ matches: false, addEventListener() {}, removeEventListener() {} }));
  vi.stubGlobal('IntersectionObserver', class { observe() {} disconnect() {} });
  const hidden = vi.spyOn(document, 'hidden', 'get').mockReturnValue(false);
  const load = vi.spyOn(HTMLMediaElement.prototype, 'load').mockImplementation(() => {});
  vi.spyOn(HTMLMediaElement.prototype, 'pause').mockImplementation(() => {});
  const template = { id: 'prism', title: 'Published template', tags: [], collection: 'example',
    kind: 'prism', previewUrl: '/preview.mp4', sourceUrl: 'https://x.com/creator/status/123' };
  vi.stubGlobal('fetch', vi.fn(async (url: string) => url.endsWith('/integration')
    ? new Response(null, { status: 503 })
    : Response.json({ items: [template], total: 1, entryTotal: 1, catalogTotal: 1, offset: 0, next: null })));
  const root = document.createElement('div');
  root.innerHTML = '<input id="template-search"><button id="connection-templates"></button>' + page;
  document.body.append(root);
  controller = mountConnection(root, { locale: 'en', t: message => message, close() {}, useTemplate() {} });
  controller.resume();
  await vi.waitFor(() => expect(root.querySelector('.connect-template-cover')).not.toBeNull());
  root.querySelector<HTMLButtonElement>('.connect-template-cover')!.click();
  const video = root.querySelector<HTMLVideoElement>('#template-preview-stage video')!;
  const ready = vi.spyOn(video, 'readyState', 'get').mockReturnValue(readyState);
  const play = vi.spyOn(video, 'play');
  const setVisibility = (isHidden: boolean) => {
    hidden.mockReturnValue(isHidden);
    document.dispatchEvent(new Event('visibilitychange'));
  };

  video.currentTime = 3.5;
  const source = root.querySelector<HTMLAnchorElement>('#preview-source a')!;
  expect(source.href).toBe(template.sourceUrl);
  expect(source.target).toBe('_blank');
  setVisibility(true);
  setVisibility(false);
  expect(load).toHaveBeenCalledTimes(1);
  expect(video.autoplay).toBe(false);
  video.currentTime = 0;
  video.dispatchEvent(new Event('loadedmetadata'));
  expect(video.currentTime).toBe(3.5);
  video.dispatchEvent(new Event('loadeddata'));
  expect(root.querySelector<HTMLElement>('#preview-error')!.hidden).toBe(true);
  expect(play).not.toHaveBeenCalled();

  // A second return during recovery retains the original position and one restore handler.
  video.currentTime = 6;
  setVisibility(true);
  setVisibility(false);
  video.currentTime = 0;
  ready.mockReturnValue(0);
  setVisibility(true);
  setVisibility(false);
  expect(load).toHaveBeenCalledTimes(3);
  video.dispatchEvent(new Event('loadedmetadata'));
  expect(video.currentTime).toBe(6);
  video.currentTime = 8;
  video.dispatchEvent(new Event('loadedmetadata'));
  expect(video.currentTime).toBe(8);

  // Back/forward cache lifecycle events can also restore the same open dialog.
  window.dispatchEvent(new Event('pagehide'));
  window.dispatchEvent(new Event('pageshow'));
  expect(load).toHaveBeenCalledTimes(4);
  video.currentTime = 0;
  video.dispatchEvent(new Event('loadedmetadata'));
  expect(video.currentTime).toBe(8);

  // Closing a recovering preview removes its listeners before reopening it.
  setVisibility(true);
  setVisibility(false);
  const dialog = root.querySelector<HTMLDialogElement>('#template-preview-dialog')!;
  dialog.close();
  dialog.dispatchEvent(new Event('close'));
  const loadsAfterClose = load.mock.calls.length;
  video.currentTime = 0;
  video.dispatchEvent(new Event('loadedmetadata'));
  setVisibility(true);
  setVisibility(false);
  expect(video.currentTime).toBe(0);
  expect(load).toHaveBeenCalledTimes(loadsAfterClose);
  root.querySelector<HTMLButtonElement>('.connect-template-cover')!.click();
  const reopened = root.querySelector<HTMLVideoElement>('#template-preview-stage video')!;
  expect(reopened).not.toBe(video);
  expect(reopened.getAttribute('src')).toBe(template.previewUrl);
  reopened.currentTime = 2;
  setVisibility(true);
  setVisibility(false);
  reopened.currentTime = 0;
  reopened.dispatchEvent(new Event('loadedmetadata'));
  expect(reopened.currentTime).toBe(2);
});

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

it('reloads localized catalog data while preserving the chosen client, search and setup instructions', async () => {
  vi.stubGlobal('matchMedia', () => ({ matches: false, addEventListener() {}, removeEventListener() {} }));
  vi.stubGlobal('IntersectionObserver', class { observe() {} disconnect() {} });
  vi.spyOn(HTMLMediaElement.prototype, 'pause').mockImplementation(() => {});
  vi.spyOn(HTMLMediaElement.prototype, 'load').mockImplementation(() => {});
  vi.spyOn(navigator.clipboard, 'writeText').mockResolvedValue();
  const info = { name: 'OpenMotion', version: '0.6.2', previewUrl: 'http://localhost:4173', dataDirectory: '/test/workspace', transport: { type: 'stdio', command: 'node', args: ['mcp.ts'], env: { MOTION_DATA_DIR: '/test/workspace' } }, tools: [{ name: 'openmotion_import_assets', description: 'Import assets' }, { name: 'openmotion_list_templates', description: 'List templates' }, { name: 'openmotion_get_template', description: 'Template details' }] };
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
    const instruction = root.querySelector('#setup-prompt')!.textContent;
  for (const { locale } of languages) {
    controller.setLanguage(locale, t(locale));
    await vi.waitFor(() => expect(root.querySelectorAll('[data-template-id]')).toHaveLength(1));
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
    expect(fetch).toHaveBeenCalledWith(expect.stringContaining('locale=' + encodeURIComponent(locale)), expect.anything());
    expect(root.querySelector('.connect-template-title')?.textContent).toBe('Preview');
    expect(root.querySelector('#setup-prompt')?.textContent).toBe(instruction);
  }
  root.querySelector<HTMLButtonElement>('#copy-setup')!.click();
  await vi.waitFor(() => expect(navigator.clipboard.writeText).toHaveBeenCalledWith(instruction));
});
