// @vitest-environment happy-dom
import React, { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { I18nProvider, useI18n, type Locale } from '../i18n/I18n';
import { TemplateLibraryDialog } from './TemplateLibraryDialog';
import { MAX_TEMPLATE_PLAYERS } from './useTemplatePlayback';
import { validProperties } from '../../../tracking/core.ts';
import { studioEvents } from '../../../tracking/events.ts';

const tracked = vi.hoisted(() => [] as { event: string; properties: Record<string, unknown> }[]);
vi.mock('./tracking', () => ({ trackMotion: async (event: string, properties: Record<string, unknown>) => { tracked.push({ event, properties }); return 'queued'; } }));

globalThis.IS_REACT_ACT_ENVIRONMENT = true;
let root: Root, host: HTMLDivElement;
const items = [
  { id: 'one', title: 'First', author: 'Author', authorName: 'Ada Designer', authorAvatarUrl: '/ada.jpg', brand: 'Figma', uses: ['Product launch', 'Product demo'], styles: ['UI'], tags: ['clean'], kind: 'prism', hasHtmlProject: true, sortOrder: 2, featuredOrder: 0, duration: 12, width: 1920, height: 1080, motionDocumentUrl: 'https://example.com/motion.zip', motionGuideUrl: 'https://example.com/guide', styleDescription: 'Visual rules', reviewFocus: 'Production rules', posterUrl: '/one.jpg', previewUrl: '/one.mp4' },
  { id: 'two', title: 'Second', author: 'Author', brand: 'Other', uses: ['Product launch'], styles: ['UI'], tags: ['clean'], kind: 'prism', hasHtmlProject: false, sortOrder: 1, duration: 30, posterUrl: '/two.jpg', previewUrl: '/two.mp4' },
  { id: 'three', title: 'Third', author: 'Elsewhere', brand: 'Other', uses: ['Brand promotion'], styles: ['3D'], tags: [], kind: 'prism', hasHtmlProject: false, sortOrder: 3, posterUrl: '/three.jpg' },
];
class Observer {
  static instances: Observer[] = [];
  elements: Element[] = [];
  disconnected = false;
  constructor(public callback: IntersectionObserverCallback, public options?: IntersectionObserverInit) { Observer.instances.push(this); }
  observe(element: Element) { this.elements.push(element); }
  disconnect() { this.disconnected = true; }
  emit(ratio = 1, subset = this.elements) { this.callback(subset.map(target => ({ target, isIntersecting: ratio > 0, intersectionRatio: ratio }) as IntersectionObserverEntry), this as unknown as IntersectionObserver); }
}
let motionPreference: EventTarget & { matches: boolean };
function fetchItems(data = items) {
  vi.stubGlobal('fetch', vi.fn(async (url: string) => Response.json(url.endsWith('/integration') ? { templateEnvironment: 'dev', transport: { env: {} } } : { items: data, catalogVersion: 'v1', next: null, total: data.length })));
}
beforeEach(() => {
  window.happyDOM.settings.enableIframePageLoading = false;
  Observer.instances = []; tracked.length = 0;
  vi.stubGlobal('IntersectionObserver', Observer);
  motionPreference = Object.assign(new EventTarget(), { matches: false });
  vi.stubGlobal('matchMedia', vi.fn(() => motionPreference));
  vi.spyOn(HTMLMediaElement.prototype, 'pause').mockImplementation(() => {});
  vi.spyOn(HTMLMediaElement.prototype, 'load').mockImplementation(() => {});
  vi.spyOn(HTMLMediaElement.prototype, 'play').mockImplementation(async function () { this.dispatchEvent(new Event('playing')); });
  vi.spyOn(navigator.clipboard, 'writeText').mockResolvedValue();
  fetchItems();
  host = document.createElement('div'); document.body.append(host); root = createRoot(host);
});
afterEach(() => { act(() => root.unmount()); host.remove(); vi.restoreAllMocks(); vi.unstubAllGlobals(); });
const button = (label: string, scope: ParentNode = host) => [...scope.querySelectorAll<HTMLButtonElement>('button')].find(node => node.getAttribute('aria-label') === label || node.textContent === label)!;
const cards = () => [...host.querySelectorAll('[data-template-id]')].map(el => el.getAttribute('data-template-id'));
const current = () => host.querySelector('dialog[aria-label="Template preview"] h2')?.textContent;
const preview = (title: string) => button(`Preview template ${title}`, host.querySelector('main')!).click();
const observer = () => Observer.instances.filter(item => !item.disconnected).at(-1)!;
const loadedVideos = () => host.querySelectorAll('main video[src]');
async function mount(locale: Locale = 'en', onOpen = vi.fn()) {
  await act(async () => root.render(<I18nProvider initialLocale={locale}><TemplateLibraryDialog open busy={false} error="" onClose={() => {}} onOpen={onOpen} /></I18nProvider>));
  return onOpen;
}
async function search(value: string) {
  await act(async () => {
    const input = host.querySelector<HTMLInputElement>('input[type=search]')!;
    Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')!.set!.call(input, value);
    input.dispatchEvent(new Event('input', { bubbles: true }));
  });
}
it('uses one ordered gallery without a duplicate featured section and combines category, search and facets', async () => {
  await mount();
  expect(host.textContent).not.toContain('Popular templates');
  expect(cards()).toEqual(['two', 'one', 'three']);
  await act(async () => button('Product launch films').click());
  expect(cards()).toEqual(['two', 'one']);
  const gallery = host.querySelector<HTMLDialogElement>('dialog[aria-label="Template library"]')!;
  gallery.scrollTop = 900;
  await search('Ada clean');
  expect(gallery.scrollTop).toBe(0);
  expect(cards()).toEqual(['one']);
  await act(async () => button('Clear filters').click());
  expect(cards()).toHaveLength(3);
  await act(async () => button('Filters').click());
  const checkbox = [...host.querySelectorAll<HTMLElement>('[role=menuitemcheckbox]')].find(el => el.textContent?.includes('Figma'))!;
  await act(async () => checkbox.click());
  expect(cards()).toEqual(['one']);
  expect(host.querySelector('[role=menu][aria-label=Filters]')).not.toBeNull();
  expect(host.querySelectorAll('dialog[open]')).toHaveLength(1);
  await act(async () => button('Remove filter Figma').click());
  expect(cards()).toHaveLength(3);
});
it('shows author avatars and falls back to initials for unavailable images', async () => {
  await mount();
  const card = host.querySelector('[data-template-id="one"]')!;
  const avatar = card.querySelector('img[src="/ada.jpg"]')!;
  await act(async () => avatar.dispatchEvent(new Event('error')));
  expect(card.querySelector('img[src="/ada.jpg"]')).toBeNull();
  expect(card.textContent).toContain('AFirst');
});
it('filters brand templates directly and preserves category, search and reset behavior', async () => {
  fetchItems([
    ...items,
    { ...items[0], id: 'unbranded', brand: '', sortOrder: 4 },
    { ...items[0], id: 'blank-brand', brand: '  ', sortOrder: 5 },
  ]);
  await mount();
  const categories = host.querySelector('[role=group][aria-label="Video purpose"]')!;
  expect(categories.children[1]).toBe(button('TOP 100 brands'));
  expect(cards()).toHaveLength(5);

  await act(async () => button('TOP 100 brands').click());
  expect(cards()).toEqual(['two', 'one', 'three']);
  expect(button('TOP 100 brands').getAttribute('aria-pressed')).toBe('true');
  expect(button('All').getAttribute('aria-pressed')).toBe('false');
  expect(host.querySelector('[role=menu]')).toBeNull();
  expect(events('ui_click', { element: 'category_select', filter_value: 'top-100-brands' })).toEqual([
    expect.objectContaining({ filter_group: 'brand', selected: true, applied_filter_count: 0 }),
  ]);
  expect(events('template_filter_result').at(-1)).toMatchObject({ action: 'category_select', result_count: 3, applied_filter_count: 1 });

  await act(async () => button('Product launch films').click());
  expect(cards()).toEqual(['two', 'one', 'unbranded', 'blank-brand']);
  expect(button('TOP 100 brands').getAttribute('aria-pressed')).toBe('false');
  await act(async () => button('TOP 100 brands').click());
  expect(cards()).toEqual(['two', 'one', 'three']);
  expect(button('Product launch films').getAttribute('aria-pressed')).toBe('false');

  await search('Ada');
  expect(cards()).toEqual(['one']);
  await act(async () => button('Remove filter TOP 100 brands').click());
  expect(cards()).toEqual(['one', 'unbranded', 'blank-brand']);
  expect(events('ui_click', { element: 'filter_option', filter_value: 'top-100-brands' }).at(-1)).toMatchObject({ selected: false, applied_filter_count: 1 });
  expect(events('template_filter_result').at(-1)).toMatchObject({ action: 'filter_apply', result_count: 3, applied_filter_count: 0 });
  await act(async () => button('TOP 100 brands').click());
  await act(async () => button('Clear filters').click());
  expect(cards()).toHaveLength(5);
  expect(button('All').getAttribute('aria-pressed')).toBe('true');

  await act(async () => button('TOP 100 brands').click());
  await act(async () => button('All').click());
  expect(cards()).toHaveLength(5);
  expect(button('Remove filter TOP 100 brands')).toBeUndefined();
  expect(events('template_filter_result').at(-1)).toMatchObject({ action: 'category_select', result_count: 5, applied_filter_count: 0 });
  for (const item of tracked) expect(validProperties(studioEvents, item.event, item.properties), JSON.stringify(item)).toBe(true);
});
it('tries the bundled brand logo after a published logo fails, then falls back to initials', async () => {
  fetchItems([{ ...items[0], brand: 'Notion', brandLogoUrl: 'https://example.com/notion.svg' } as typeof items[0]]);
  await mount();
  await act(async () => button('Filters').click());
  const label = [...host.querySelectorAll('[role=menuitemcheckbox]')].find(el => el.textContent === 'NNotion')!;
  const image = label.querySelector('img')!;
  expect(image.getAttribute('src')).toBe('https://example.com/notion.svg');
  await act(async () => image.dispatchEvent(new Event('error')));
  expect(image.getAttribute('src')).toMatch(/notion\.png$/);
  await act(async () => image.dispatchEvent(new Event('error')));
  expect(label.querySelector('img')).toBeNull();
  expect(label.textContent).toBe('NNotion');
});
it('copies the exact DEV prompt, retains guides and gates editable-project opening', async () => {
  const onOpen = await mount('zh-CN');
  await act(async () => button('预览模板 First', host.querySelector('main')!).click());
  expect(host.querySelector('iframe[title=动效说明]')).toBeNull();
  expect(host.querySelector('a[href="https://example.com/guide"]')).not.toBeNull();
  expect(button('下载 motion.md').disabled).toBe(false);
  await act(async () => button('复刻模板').click());
  expect(host.querySelector('dialog[aria-label=复刻模板]')).toBeNull();
  expect(document.querySelector('[data-feedback-layer]')?.textContent).toContain('已复制，发给 Agent 即可。');
  expect(navigator.clipboard.writeText).toHaveBeenCalledWith('使用说明：请使用 OpenMotion 插件。如未安装，请按 https://releases.open-design.ai/open-motion/dev/install.md 安装并接入后继续。\n指定模板：First（one）\n创作要求：基于模板，结合我的要求和附件创作，默认保留主要动效与风格，并交付 HTML 和 MP4。\n我的要求：\n');
  await act(async () => button('打开并编辑').click());
  expect(onOpen).toHaveBeenCalledWith('one');
  await act(async () => button('预览模板 Second', host.querySelector('main')!).click());
  expect(button('打开并编辑')).toBeUndefined();
});
it('random discovery honors filters, avoids consecutive repeats and handles a singleton', async () => {
  vi.spyOn(Math, 'random').mockReturnValue(0);
  await mount();
  await act(async () => button('Product launch films').click());
  await act(async () => button('Surprise me').click());
  expect(current()).toBe('Second');
  await act(async () => button('Close template preview').click());
  await act(async () => button('Surprise me').click());
  expect(current()).toBe('First');
  await act(async () => button('Close template preview').click());
  await search('Ada');
  await act(async () => button('Surprise me').click());
  expect(current()).toBe('First');
});
it('navigates the filtered order with wraparound and keyboard, then follows related metadata', async () => {
  await mount();
  await act(async () => button('Product launch films').click());
  await act(async () => preview('First'));
  await act(async () => button('Next template').click());
  expect(current()).toBe('Second');
  await act(async () => button('Close template preview').dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft', bubbles: true })));
  expect(current()).toBe('First');
  const detail = host.querySelector('dialog[aria-label="Template preview"]')!;
  await act(async () => button('Preview template Second', detail).click());
  expect(current()).toBe('Second');
  await act(async () => button('Other', detail).click());
  expect(detail.hasAttribute('open')).toBe(false);
  expect(cards()).toEqual(['two', 'three']);
});
it('returns an actionable empty state and disables random discovery for no matches', async () => {
  await mount(); await search('nothing-matches');
  expect(cards()).toHaveLength(0);
  expect(button('Surprise me').disabled).toBe(true);
  expect(host.textContent).toContain('No matching templates');
  await act(async () => button('Clear filters').click());
  expect(cards()).toHaveLength(3);
});
it('reloads localized catalog content and clears language-specific filters', async () => {
  function App() {
    const { setLocale } = useI18n();
    return <><button onClick={() => setLocale('ja')}>Japanese</button><TemplateLibraryDialog open busy={false} error="" onClose={() => {}} onOpen={() => {}} /></>;
  }
  vi.stubGlobal('fetch', vi.fn(async (url: string) => Response.json(url.endsWith('/integration') ? {} : { items: items.map(item => ({ ...item, title: url.includes('locale=ja') ? '日本語テンプレート' : item.title })), catalogVersion: 'v1', next: null, total: 3 })));
  await act(async () => root.render(<I18nProvider initialLocale="en"><App /></I18nProvider>));
  await act(async () => button('Product launch films').click());
  await act(async () => button('Japanese').click());
  expect(fetch).toHaveBeenCalledWith(expect.stringContaining('locale=ja'), expect.anything());
  expect(host.textContent).toContain('日本語テンプレート');
  expect(host.textContent).not.toContain('First');
  expect(cards()).toHaveLength(3);
});
it('bounds autoplay decoders, prioritizes hover without rebuilding observers, and releases offscreen sources', async () => {
  fetchItems(Array.from({ length: 14 }, (_, index) => ({ ...items[0], id: String(index), title: `Video ${index}` })));
  await mount();
  expect(loadedVideos()).toHaveLength(0);
  const pool = observer();
  await act(async () => pool.emit());
  expect(loadedVideos()).toHaveLength(MAX_TEMPLATE_PLAYERS);
  const last = host.querySelector<HTMLButtonElement>('[data-template-id="13"] button')!;
  await act(async () => last.dispatchEvent(new MouseEvent('mouseover', { bubbles: true })));
  expect(observer()).toBe(pool);
  expect(last.querySelector('video')?.hasAttribute('src')).toBe(true);
  expect(loadedVideos()).toHaveLength(MAX_TEMPLATE_PLAYERS);
  await act(async () => pool.emit(0));
  expect(loadedVideos()).toHaveLength(0);
  expect(HTMLMediaElement.prototype.pause).toHaveBeenCalled();
  expect(HTMLMediaElement.prototype.load).toHaveBeenCalled();
});
it('keeps autoplay automatic and releases players for detail, background tabs and reduced motion', async () => {
  await mount();
  await act(async () => observer().emit());
  expect(loadedVideos()).toHaveLength(2);
  expect(button('Autoplay previews')).toBeUndefined();
  vi.spyOn(document, 'hidden', 'get').mockReturnValue(true);
  await act(async () => document.dispatchEvent(new Event('visibilitychange')));
  expect(loadedVideos()).toHaveLength(0);
  vi.spyOn(document, 'hidden', 'get').mockReturnValue(false);
  await act(async () => document.dispatchEvent(new Event('visibilitychange')));
  expect(loadedVideos()).toHaveLength(2);
  await act(async () => { motionPreference.matches = true; motionPreference.dispatchEvent(new Event('change')); });
  expect(loadedVideos()).toHaveLength(0);
  await act(async () => { motionPreference.matches = false; motionPreference.dispatchEvent(new Event('change')); });
  await act(async () => preview('First'));
  expect(loadedVideos()).toHaveLength(0);
});
it('uses posters on autoplay rejection or failed media without dropping the template', async () => {
  vi.spyOn(HTMLMediaElement.prototype, 'play').mockRejectedValue(new Error('Autoplay blocked'));
  await mount();
  await act(async () => observer().emit());
  const video = host.querySelector<HTMLVideoElement>('main video')!;
  expect(video.style.opacity).toBe('0');
  await act(async () => video.dispatchEvent(new Event('error')));
  expect(video.hasAttribute('src')).toBe(false);
  expect(cards()).toHaveLength(3);
});

it('keeps data-saving connections poster-only until a visible card is focused', async () => {
  const connection = Object.assign(new EventTarget(), { saveData: true });
  Object.defineProperty(navigator, 'connection', { configurable: true, value: connection });
  try {
    await mount();
    await act(async () => observer().emit());
    expect(loadedVideos()).toHaveLength(0);
    await act(async () => button('Preview template First', host.querySelector('main')!).focus());
    expect(loadedVideos()).toHaveLength(1);
    await act(async () => { connection.saveData = false; connection.dispatchEvent(new Event('change')); });
    expect(loadedVideos()).toHaveLength(2);
  } finally { delete (navigator as Navigator & { connection?: EventTarget }).connection; }
});

it('does not duplicate a brand when the catalog has no author identity', async () => {
  fetchItems([{ ...items[0], author: '', authorName: undefined }]);
  await mount();
  await act(async () => preview('First'));
  const detail = host.querySelector('dialog[aria-label="Template preview"]')!;
  expect(detail.querySelector('strong')?.textContent).toBe('Figma');
  expect(detail.querySelector('strong + small')).toBeNull();
});


it('copies contribution instructions with the selected template without opening another dialog', async () => {
  await mount();
  expect(host.querySelector('a[href="https://github.com/nexu-io/openmotion/blob/main/CONTRIBUTING.md"]')?.textContent).toContain('Submit video');
  await act(async () => preview('First'));
  await act(async () => button('Recreate and submit').click());
  expect(navigator.clipboard.writeText).toHaveBeenCalledWith(expect.stringContaining('First (one)'));
  expect(navigator.clipboard.writeText).toHaveBeenCalledWith(expect.stringContaining('CONTRIBUTING.md'));
  expect(navigator.clipboard.writeText).toHaveBeenCalledWith(expect.stringContaining('pull request'));
  expect(host.querySelectorAll('dialog[open]')).toHaveLength(2);
  expect(document.querySelector('[data-feedback-layer]')?.textContent).toContain('Copied. Paste into your Agent.');
});

it('keeps failed clipboard content selectable inline, including the contribution instruction', async () => {
  vi.spyOn(navigator.clipboard, 'writeText').mockRejectedValue(new Error('Clipboard denied'));
  await mount();
  await act(async () => preview('First'));
  await act(async () => button('Recreate and submit').click());
  expect(host.querySelector<HTMLTextAreaElement>('textarea')?.value).toContain('pull request');
  expect(host.querySelectorAll('dialog[open]')).toHaveLength(2);
  expect(document.querySelector('[data-feedback-layer]')?.textContent).toContain('Copy failed. Select and copy the instruction below.');
});

it('uses the shared radio menu for sorting and industry filters inside the native dialog', async () => {
  await mount();
  expect(host.querySelector('select')).toBeNull();
  await act(async () => { button('Sort').click(); await new Promise(resolve => setTimeout(resolve, 0)); });
  const menu = host.querySelector('[role=menu][aria-label="Sort"]')!;
  expect(menu.closest('dialog')?.getAttribute('aria-label')).toBe('Template library');
  await act(async () => (menu.querySelector('[role=menuitemradio][data-unchecked]') as HTMLElement).click());
  expect(cards()).toEqual(['one', 'two', 'three']);
  await act(async () => { button('By industry').click(); await new Promise(resolve => setTimeout(resolve, 0)); });
  const industry = [...host.querySelectorAll<HTMLElement>('[role=menuitemradio]')].find(el => el.textContent === 'Design & creative tools')!;
  await act(async () => industry.click());
  expect(cards()).toEqual(['one']);
});

it('keeps a loading layout until the catalog arrives, without a false empty result', async () => {
  let finish!: (response: Response) => void;
  vi.stubGlobal('fetch', vi.fn((url: string) => url.endsWith('/integration') ? Promise.resolve(Response.json({})) : new Promise<Response>(resolve => { finish = resolve; })));
  await mount();
  expect(host.querySelector('main')?.getAttribute('aria-busy')).toBe('true');
  expect(host.textContent).not.toContain('No matching templates');
  await act(async () => finish(Response.json({ items, next: null, catalogVersion: 'v1' })));
  expect(cards()).toHaveLength(3);
  expect(host.querySelector('main')?.getAttribute('aria-busy')).toBe('false');
});

it('retains a usable poster and supports retry after detail video failure', async () => {
  await mount();
  await act(async () => preview('First'));
  const detail = host.querySelector('dialog[aria-label="Template preview"]')!;
  expect(detail.querySelector('[aria-busy=true]')).not.toBeNull();
  expect(detail.textContent).toContain('Loading preview…');
  const video = detail.querySelector('video')!;
  await act(async () => video.dispatchEvent(new Event('error')));
  expect(detail.querySelector('video')).toBeNull();
  expect(detail.querySelector('img[src="/one.jpg"]')).not.toBeNull();
  expect(detail.textContent).toContain('Preview unavailable. Try again.');
  await act(async () => button('Retry', detail).click());
  const retryVideo = detail.querySelector('video')!;
  expect(retryVideo.getAttribute('src')).toBe('/one.mp4');
  await act(async () => retryVideo.dispatchEvent(new Event('loadeddata')));
  expect(detail.querySelector('[aria-busy=true]')).toBeNull();
  expect(detail.textContent).not.toContain('Loading preview…');
});

it('shows a recoverable instruction error and copies only after a successful retry', async () => {
  vi.stubGlobal('fetch', vi.fn(async (url: string) => { if (url.endsWith('/integration')) throw new Error('Offline'); return Response.json({ items, next: null, catalogVersion: 'v1' }); }));
  await mount();
  await act(async () => preview('First'));
  expect(host.textContent).toContain('Could not load the instruction.');
  expect(button('Recreate template').disabled).toBe(true);
  expect(host.querySelector('[aria-label="Loading instruction…"]')).toBeNull();
  fetchItems();
  await act(async () => button('Retry').click());
  expect(button('Recreate template').disabled).toBe(false);
  await act(async () => button('Recreate template').click());
  expect(navigator.clipboard.writeText).toHaveBeenCalledWith(expect.stringContaining('First (one)'));
});

it('keeps discovery available while project status prevents editable opening', async () => {
  const onOpen = vi.fn(), onClose = vi.fn();
  await act(async () => root.render(<I18nProvider initialLocale="en"><TemplateLibraryDialog open busy={false} openingDisabled error="" onClose={onClose} onOpen={onOpen} /></I18nProvider>));
  await act(async () => preview('First'));
  expect(button('Open and edit').disabled).toBe(true);
  expect(button('Recreate template').disabled).toBe(false);
  expect(document.querySelector('[data-feedback-layer]')?.textContent ?? '').not.toContain('Preparing editable project');
  await act(async () => button('Open and edit').click());
  expect(onOpen).not.toHaveBeenCalled();
  await act(async () => button('Close template preview').click());
  await act(async () => button('Close template library').click());
  expect(onClose).toHaveBeenCalledOnce();
});

const events = (event: string, match: Record<string, unknown> = {}) => tracked.filter(item => item.event === event && Object.entries(match).every(([key, value]) => item.properties[key] === value)).map(item => item.properties);
const impressions = () => Observer.instances.filter(item => !item.disconnected && item.options?.threshold === 0.5).at(-1)!;
const uuid = /^[0-9a-f-]{36}$/;
it('distinguishes brand-filtered impressions even when all templates have a brand', async () => {
  vi.useFakeTimers();
  try {
    await mount();
    const card = [host.querySelector('[data-template-id="two"]')!];
    await act(async () => impressions().emit(1, card));
    await act(async () => { vi.advanceTimersByTime(1000); });
    expect(events('surface_view', { area: 'template_card' })).toHaveLength(1);

    await act(async () => button('TOP 100 brands').click());
    expect(cards()).toEqual(['two', 'one', 'three']);
    await act(async () => impressions().emit(1, card));
    await act(async () => { vi.advanceTimersByTime(1000); });
    expect(events('surface_view', { area: 'template_card' })).toEqual([
      expect.objectContaining({ template_id: 'two', applied_filter_count: 0 }),
      expect.objectContaining({ template_id: 'two', applied_filter_count: 1 }),
    ]);
    for (const item of tracked) expect(validProperties(studioEvents, item.event, item.properties), JSON.stringify(item)).toBe(true);
  } finally { vi.useRealTimers(); }
});
it('reports the library funnel with registered fields: library, card open, detail, instruction, copy and download', async () => {
  await mount();
  expect(events('surface_view', { area: 'template_library' })).toEqual([{ page_name: 'studio', area: 'template_library', element: 'library', result_count: 3 }]);
  await act(async () => preview('First'));
  expect(events('ui_click', { element: 'open_detail' })).toEqual([{ page_name: 'studio', area: 'template_card', element: 'open_detail', template_id: 'one', resource_kind: 'editable_project', placement: 'catalog', position: 2, sort: 'recommended', applied_filter_count: 0 }]);
  const [shown] = events('surface_view', { area: 'template_detail' });
  expect(shown).toMatchObject({ template_id: 'one', placement: 'catalog', position: 2, detail_mode: 'modal' });
  expect(shown.detail_view_id).toMatch(uuid);
  expect(events('surface_view', { area: 'template_instruction' })).toEqual([expect.objectContaining({ template_id: 'one', instruction_kind: 'template_use', detail_view_id: shown.detail_view_id })]);
  const detail = host.querySelector('dialog[aria-label="Template preview"]')!;
  await act(async () => button('Recreate template', detail).click());
  expect(events('ui_click', { element: 'start_use' })).toEqual([expect.objectContaining({ template_action: 'recreate', template_id: 'one', detail_view_id: shown.detail_view_id })]);
  expect(events('ui_click', { element: 'select_template' })).toHaveLength(0);
  expect(events('ui_click', { element: 'copy_template' })).toHaveLength(0);
  expect(events('ui_click', { element: 'copy_instruction' })).toHaveLength(0);
  expect(events('template_instruction_copy_result')).toEqual([expect.objectContaining({ copy_status: 'clipboard_written', host_product: 'codex', instruction_kind: 'template_use', template_id: 'one' })]);
  await act(async () => button('Recreate and submit', detail).click());
  expect(events('ui_click', { element: 'start_use', template_action: 'recreate_submit' })).toHaveLength(1);
  expect(events('template_instruction_copy_result', { instruction_kind: 'recreate_submit' })).toHaveLength(1);
  vi.mocked(navigator.clipboard.writeText).mockRejectedValueOnce(new Error('denied'));
  await act(async () => [...detail.querySelectorAll('button')].find(node => node.textContent === 'Copied' || node.textContent === 'Copy')!.click());
  const [click] = events('ui_click', { element: 'copy_instruction' });
  expect(events('template_instruction_copy_result', { copy_status: 'manual_fallback_shown' })).toEqual([expect.objectContaining({ copy_attempt_id: click.copy_attempt_id })]);
  vi.stubGlobal('fetch', vi.fn(async () => new Response('', { status: 404 })));
  await act(async () => button('Download motion.md', detail).click());
  const [download] = events('ui_click', { element: 'download_guide' });
  expect(events('resource_download_result')).toEqual([expect.objectContaining({ delivery_status: 'fetch_failed', error_code: 'HTTP_404', download_attempt_id: download.download_attempt_id, template_id: 'one' })]);
  for (const item of tracked) expect(validProperties(studioEvents, item.event, item.properties), JSON.stringify(item)).toBe(true);
});
it('reports discovery choices with the list they produced, and one search per settled keyword', async () => {
  vi.useFakeTimers();
  try {
    await mount();
    await act(async () => button('Product launch films').click());
    expect(events('ui_click', { element: 'category_select' })).toEqual([{ page_name: 'studio', area: 'template_discovery', element: 'category_select', filter_group: 'uses', filter_value: 'product-launch-films', selected: true, sort: 'recommended', applied_filter_count: 0 }]);
    expect(events('template_filter_result')).toEqual([{ page_name: 'studio', area: 'template_discovery', action: 'category_select', result_count: 2, outcome: 'success', sort: 'recommended', applied_filter_count: 1 }]);
    await search('Ad'); await search('Ada');
    expect(events('template_search_result')).toHaveLength(0);
    await act(async () => { vi.advanceTimersByTime(500); });
    const [found] = events('template_search_result');
    expect(found).toMatchObject({ search_keyword: 'Ada', query_length: 3, result_count: 1, applied_filter_count: 1 });
    await act(async () => { vi.advanceTimersByTime(2000); });
    expect(events('template_search_result')).toHaveLength(1);
    await act(async () => preview('First'));
    expect(events('ui_click', { element: 'open_detail' })[0]).toMatchObject({ search_id: found.search_id, position: 1 });
    await act(async () => host.querySelector<HTMLDialogElement>('dialog[aria-label="Template preview"]')!.close());
    await act(async () => button('Clear filters').click());
    expect(events('ui_click', { element: 'filter_clear' })).toHaveLength(1);
    expect(events('template_filter_result', { action: 'filter_clear' })).toEqual([expect.objectContaining({ result_count: 3, applied_filter_count: 0 })]);
    await act(async () => button('Sort').click());
    await act(async () => [...host.querySelectorAll<HTMLElement>('[role=menuitemradio]')].find(el => el.textContent === 'Duration')!.click());
    expect(events('ui_click', { element: 'sort_option' })).toEqual([expect.objectContaining({ sort: 'duration', previous_sort: 'recommended', changed: true })]);
    expect(events('template_filter_result', { action: 'sort_change' })).toHaveLength(1);
    await act(async () => button('Surprise me').click());
    expect(events('ui_click', { element: 'surprise_me' })).toEqual([expect.objectContaining({ result_count: 3, sort: 'duration' })]);
    expect(events('surface_view', { area: 'template_detail', placement: 'random' })).toHaveLength(1);
    await act(async () => button('Next template').click());
    expect(events('ui_click', { element: 'detail_next' })).toHaveLength(1);
    expect(events('surface_view', { area: 'template_detail', placement: 'navigation' })).toHaveLength(1);
    for (const item of tracked) expect(validProperties(studioEvents, item.event, item.properties), JSON.stringify(item)).toBe(true);
  } finally { vi.useRealTimers(); }
});
it('counts a card impression after an unbroken visible second, once per result set and never under the detail', async () => {
  vi.useFakeTimers();
  try {
    await mount();
    const seen = () => events('surface_view', { area: 'template_card' });
    const card = (id: string) => [host.querySelector(`[data-template-id="${id}"]`)!];
    await act(async () => impressions().emit(1, card('two')));
    await act(async () => { vi.advanceTimersByTime(900); });
    await act(async () => impressions().emit(0.3, card('two')));
    await act(async () => { vi.advanceTimersByTime(1000); });
    expect(seen()).toHaveLength(0);
    await act(async () => impressions().emit(1, card('two')));
    await act(async () => { vi.advanceTimersByTime(1000); });
    expect(seen()).toEqual([{ page_name: 'studio', area: 'template_card', element: 'card', template_id: 'two', resource_kind: 'reference', placement: 'catalog', position: 1, sort: 'recommended', applied_filter_count: 0 }]);
    await act(async () => { vi.advanceTimersByTime(3000); });
    expect(seen()).toHaveLength(1);
    await act(async () => button('Sort').click());
    await act(async () => [...host.querySelectorAll<HTMLElement>('[role=menuitemradio]')].find(el => el.textContent === 'Name Z–A')!.click());
    await act(async () => impressions().emit(1, card('two')));
    await act(async () => { vi.advanceTimersByTime(1000); });
    expect(seen()).toHaveLength(2);
    expect(seen()[1]).toMatchObject({ template_id: 'two', sort: 'reverse', position: 2 });
    await act(async () => preview('Third'));
    expect(Observer.instances.filter(item => !item.disconnected && item.options?.threshold === 0.5)).toHaveLength(0);
    await act(async () => { vi.advanceTimersByTime(3000); });
    expect(seen()).toHaveLength(2);
    for (const item of tracked) expect(validProperties(studioEvents, item.event, item.properties), JSON.stringify(item)).toBe(true);
  } finally { vi.useRealTimers(); }
});
