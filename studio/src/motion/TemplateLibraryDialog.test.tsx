// @vitest-environment happy-dom
import React, { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { I18nProvider, useI18n } from '../i18n/I18n';
import { TemplateLibraryDialog } from './TemplateLibraryDialog';
import { trackMotion } from './tracking';
import { validProperties } from '../../../tracking/core.ts';
import { studioEvents } from '../../../tracking/events.ts';

vi.mock('./tracking', () => ({ trackMotion: vi.fn(async () => 'queued') }));

globalThis.IS_REACT_ACT_ENVIRONMENT = true;
let root: Root, host: HTMLDivElement;
const items = [
  { id: 'one', title: 'First', author: 'Author', brand: 'Figma', uses: ['Demo'], styles: ['UI'], tags: [], kind: 'prism', hasHtmlProject: true, sortOrder: 2, featuredOrder: 0, motionDocumentUrl: 'https://example.com/motion.zip', motionGuideUrl: 'https://example.com/guide', styleDescription: 'Visual rules', reviewFocus: 'Production rules', posterUrl: '/one.jpg' },
  { id: 'two', title: 'Second', author: 'Author', brand: 'Other', uses: ['Launch'], tags: [], kind: 'prism', hasHtmlProject: false, sortOrder: 1, posterUrl: '/two.jpg' },
];
beforeEach(() => {
  window.happyDOM.settings.enableIframePageLoading = false;
  vi.stubGlobal('IntersectionObserver', class { observe() {} disconnect() {} });
  vi.spyOn(HTMLMediaElement.prototype, 'pause').mockImplementation(() => {});
  vi.spyOn(navigator.clipboard, 'writeText').mockResolvedValue();
  vi.stubGlobal('fetch', vi.fn(async (url: string) => Response.json(url.endsWith('/integration') ? {
    templateEnvironment: 'dev', transport: { env: {} },
  } : { items, catalogVersion: 'v1', next: null, total: 2 })));
  host = document.createElement('div'); document.body.append(host); root = createRoot(host);
});
afterEach(() => { act(() => root.unmount()); host.remove(); vi.restoreAllMocks(); vi.unstubAllGlobals(); });
const button = (label: string) => [...host.querySelectorAll<HTMLButtonElement>('button')].find(node => node.textContent === label)!;
async function mount(onOpen = vi.fn()) {
  await act(async () => root.render(<I18nProvider initialLocale="zh-CN"><TemplateLibraryDialog open busy={false} error="" onClose={() => {}} onOpen={onOpen} /></I18nProvider>));
  return onOpen;
}
it('shows featured/order and combines website facets without site chrome', async () => {
  await mount();
  expect(host.textContent).toContain('热门模板');
  expect([...host.querySelectorAll('[data-template-id]')].map(el => el.getAttribute('data-template-id'))).toEqual(['one', 'two', 'one']);
  expect(host.querySelector('nav')).toBeNull();
  expect(host.textContent).not.toContain('200+');
  await act(async () => [...host.querySelectorAll<HTMLButtonElement>('aside button')].find(el => el.textContent?.includes('Figma'))!.click());
  expect([...host.querySelectorAll('[data-template-id]')].map(el => el.getAttribute('data-template-id'))).toEqual(['one']);
  expect(host.textContent).not.toContain('热门模板');
  await act(async () => button('清除筛选').click());
  expect(host.querySelectorAll('[data-template-id]')).toHaveLength(3);
});
it('copies the requested remote DEV prompt and preserves editable opening', async () => {
  const onOpen = await mount();
  await act(async () => button('First').click());
  expect(host.querySelector('dialog[aria-label=模板预览] textarea')).toBeNull();
  expect(host.querySelector('iframe[title=动效说明]')?.getAttribute('src')).toBe('https://example.com/guide');
  expect(button('下载 motion.md').disabled).toBe(false);
  await act(async () => button('复刻模板').click());
  expect(host.querySelector('dialog[aria-label=复刻模板] textarea')).not.toBeNull();
  expect(host.querySelector('dialog[aria-label=模板预览] textarea')).toBeNull();
  await act(async () => host.querySelector<HTMLButtonElement>('button[aria-label=复制]')!.click());
  expect(navigator.clipboard.writeText).toHaveBeenCalledWith('使用说明：请使用 OpenMotion 插件。如未安装，请按 https://releases.open-design.ai/open-motion/dev/install.md 安装并接入后继续。\n指定模板：First（one）\n创作要求：基于模板，结合我的要求和附件创作，默认保留主要动效与风格，并交付 HTML 和 MP4。\n我的要求：\n');
  await act(async () => button('打开并编辑 ↗').click());
  expect(onOpen).toHaveBeenCalledWith('one');
  await act(async () => button('Second').click());
  expect(button('打开并编辑 ↗')).toBeUndefined();
});

it('reloads template data when the editor language changes and clears language-specific filters', async () => {
  function App() {
    const { setLocale } = useI18n();
    return <><button onClick={() => setLocale('ja')}>Japanese</button><TemplateLibraryDialog open busy={false} error="" onClose={() => {}} onOpen={() => {}} /></>;
  }
  vi.stubGlobal('fetch', vi.fn(async (url: string) => Response.json(url.endsWith('/integration') ? {
    templateEnvironment: 'dev', transport: { env: {} },
  } : { items: items.map(item => ({ ...item, title: url.includes('locale=ja') ? '日本語テンプレート' : item.title })), catalogVersion: 'v1', next: null, total: 2 })));
  await act(async () => root.render(<I18nProvider initialLocale="en"><App /></I18nProvider>));
  await act(async () => [...host.querySelectorAll<HTMLButtonElement>('aside button')].find(el => el.textContent?.includes('Figma'))!.click());
  await act(async () => button('Japanese').click());
  expect(fetch).toHaveBeenCalledWith(expect.stringContaining('locale=ja'), expect.anything());
  expect(host.textContent).toContain('日本語テンプレート');
  expect(host.textContent).not.toContain('First');
  expect(host.querySelectorAll('[data-template-id]')).toHaveLength(3);
});

const reported = () => vi.mocked(trackMotion).mock.calls.map(([event, properties]) => ({ event, ...(properties as Record<string, unknown>) }));
const named = (element: string) => reported().filter(item => item.element === element);
const input = (value: string) => { const box = host.querySelector<HTMLInputElement>('input[type=search]')!;
  Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')!.set!.call(box, value); box.dispatchEvent(new Event('input', { bubbles: true })); };

it('reports the browse, use, copy and download funnel with the shared sheet names, and every event passes the registry', async () => {
  vi.mocked(trackMotion).mockClear();
  await mount();
  expect(reported()[0]).toMatchObject({ event: 'surface_view', area: 'template_library', element: 'library', result_count: 2, page_name: 'studio' });

  await act(async () => [...host.querySelectorAll<HTMLButtonElement>('aside button')].find(el => el.textContent?.includes('Figma'))!.click());
  expect(named('category_select')[0]).toMatchObject({ event: 'ui_click', area: 'template_discovery', filter_group: 'brand', filter_value: 'figma', selected: true });
  expect(reported().at(-1)).toMatchObject({ event: 'template_filter_result', action: 'category_select', result_count: 1, applied_filter_count: 1 });

  await act(async () => button('First').click());
  const opened = named('open_detail')[0], shown = reported().find(item => item.element === 'detail')!;
  expect(opened).toMatchObject({ area: 'template_card', template_id: 'one', placement: 'catalog', position: 1, resource_kind: 'editable_project' });
  expect(shown).toMatchObject({ event: 'surface_view', area: 'template_detail', template_id: 'one', detail_mode: 'modal' });

  await act(async () => button('复刻模板').click());
  expect(named('start_use')[0]).toMatchObject({ area: 'template_detail', template_action: 'recreate', detail_view_id: shown.detail_view_id });
  expect(named('instruction')[0]).toMatchObject({ event: 'surface_view', area: 'template_instruction', instruction_kind: 'template_use' });
  await act(async () => host.querySelector<HTMLButtonElement>('button[aria-label=复制]')!.click());
  const click = named('copy_instruction')[0], result = reported().find(item => item.event === 'template_instruction_copy_result')!;
  expect(click).toMatchObject({ area: 'template_instruction', target_agent: 'codex', template_id: 'one' });
  expect(result).toMatchObject({ copy_status: 'clipboard_written', host_product: 'codex', copy_attempt_id: click.copy_attempt_id, detail_view_id: shown.detail_view_id });

  vi.stubGlobal('fetch', vi.fn(async () => new Response('', { status: 404 })));
  await act(async () => button('下载 motion.md').click());
  const download = named('download_guide')[0];
  expect(reported().at(-1)).toMatchObject({ event: 'resource_download_result', delivery_status: 'fetch_failed', error_code: 'HTTP_404', download_attempt_id: download.download_attempt_id });

  await act(async () => button('打开并编辑 ↗').click());
  expect(named('start_use')[1]).toMatchObject({ template_action: 'open_edit', resource_kind: 'editable_project' });
  for (const { event, ...properties } of reported()) expect(validProperties(studioEvents, event, properties), JSON.stringify({ event, ...properties })).toBe(true);
  // Titles, authors and brand display text never leave the browser; an option is reported as a lowercase id.
  expect(JSON.stringify(reported())).not.toMatch(/First|Author|Figma/);
});

it('reports one search per settled keyword with the keyword and result count, plus sort and filter options', async () => {
  vi.useFakeTimers();
  try {
    vi.mocked(trackMotion).mockClear();
    await mount();
    await act(async () => host.querySelector<HTMLButtonElement>('button[aria-label=搜索模板]')!.click());
    for (const value of ['s', 'se', ' second ']) await act(async () => input(value));
    expect(reported().some(item => item.event === 'template_search_result')).toBe(false);
    await act(async () => { vi.advanceTimersByTime(500); });
    const searches = () => reported().filter(item => item.event === 'template_search_result');
    expect(searches()).toHaveLength(1);
    expect(searches()[0]).toMatchObject({ search_keyword: 'second', query_length: 6, result_count: 1, outcome: 'success', area: 'template_discovery' });
    await act(async () => input(' second'));
    await act(async () => { vi.advanceTimersByTime(500); });
    expect(searches()).toHaveLength(1);
    await act(async () => input('x'.repeat(150)));
    await act(async () => { vi.advanceTimersByTime(500); });
    expect(searches()[1]).toMatchObject({ query_length: 150, result_count: 0 });
    expect(String(searches()[1].search_keyword)).toHaveLength(100);
    expect(searches()[1].search_id).not.toBe(searches()[0].search_id);
    // Text beyond the reported 100 characters still makes a different search.
    await act(async () => input('x'.repeat(150) + 'y'));
    await act(async () => { vi.advanceTimersByTime(500); });
    expect(searches()).toHaveLength(3);
    // Acting on results before typing settles reports the search first, so the click carries the current search id, not the previous one.
    await act(async () => input('first'));
    await act(async () => button('First').click());
    expect(searches()).toHaveLength(4);
    expect(searches()[3]).toMatchObject({ search_keyword: 'first', result_count: 1 });
    expect(named('open_detail')[0].search_id).toBe(searches()[3].search_id);
    await act(async () => { vi.advanceTimersByTime(500); });
    expect(searches()).toHaveLength(4);
    await act(async () => host.querySelector<HTMLButtonElement>('button[aria-label=关闭模板预览]')?.click());
    await act(async () => input('fir'));
    expect(named('sort_option')).toHaveLength(0);
    await act(async () => input(''));

    const sort = host.querySelector<HTMLSelectElement>('select')!;
    await act(async () => { sort.value = 'name'; sort.dispatchEvent(new Event('change', { bubbles: true })); });
    expect(named('sort_option')[0]).toMatchObject({ sort: 'name', previous_sort: 'recommended', changed: true });
    expect(reported().at(-1)).toMatchObject({ event: 'template_filter_result', action: 'sort_change', sort: 'name', result_count: 2 });
    await act(async () => host.querySelector<HTMLInputElement>('fieldset input[type=checkbox]')!.click());
    expect(named('filter_option')[0]).toMatchObject({ filter_group: 'brand', selected: true });
    expect(reported().at(-1)).toMatchObject({ event: 'template_filter_result', action: 'filter_apply', applied_filter_count: 1 });
    for (const { event, ...properties } of reported()) expect(validProperties(studioEvents, event, properties), JSON.stringify({ event, ...properties })).toBe(true);
  } finally { vi.useRealTimers(); }
});
