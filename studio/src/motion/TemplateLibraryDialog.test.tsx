// @vitest-environment happy-dom
import React, { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { I18nProvider, useI18n, translate } from '../i18n/I18n';
import { TemplateLibraryDialog } from './TemplateLibraryDialog';

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
it('shows loading placeholders without zero counts, then restores the loaded catalog', async () => {
  let resolveCatalog!: (response: Response) => void;
  vi.stubGlobal('fetch', vi.fn((url: string) => url.endsWith('/integration')
    ? Promise.resolve(Response.json({}))
    : new Promise<Response>(resolve => { resolveCatalog = resolve; })));
  await mount();
  expect(host.querySelector('main')?.getAttribute('aria-busy')).toBe('true');
  expect(host.querySelector('[role=status][aria-label="正在读取模板…"]')).not.toBeNull();
  expect(host.textContent).not.toContain('0 个模板');
  expect(host.querySelector('aside button')?.textContent).toBe('全部模板');
  expect(host.querySelector<HTMLButtonElement>('button[aria-label=搜索模板]')?.disabled).toBe(true);
  expect(host.querySelector<HTMLButtonElement>('button[aria-label=关闭模板库]')?.disabled).toBe(false);
  await act(async () => resolveCatalog(Response.json({ items, catalogVersion: 'v1', next: null, total: 2 })));
  expect(host.querySelector('[role=status][aria-label="正在读取模板…"]')).toBeNull();
  expect(host.querySelector('main')?.getAttribute('aria-busy')).toBe('false');
  expect(host.querySelectorAll('[data-template-id]')).toHaveLength(3);
  expect(host.querySelector<HTMLButtonElement>('button[aria-label=搜索模板]')?.disabled).toBe(false);
});

it('replaces loading placeholders with an actionable error and preserves the empty state', async () => {
  vi.stubGlobal('fetch', vi.fn(async (url: string) => {
    if (url.endsWith('/integration')) return Response.json({});
    throw new Error('Catalog unavailable');
  }));
  await mount();
  expect(host.querySelector('[role=alert]')?.textContent).toContain('Catalog unavailable');
  expect(host.querySelector('main')?.getAttribute('aria-busy')).toBe('false');
  expect(host.querySelector('[role=status][aria-label="正在读取模板…"]')).toBeNull();
  vi.stubGlobal('fetch', vi.fn(async (url: string) => Response.json(url.endsWith('/integration') ? {} : { items: [], catalogVersion: 'v1', next: null, total: 0 })));
  await act(async () => button('重试').click());
  expect(host.querySelector('[role=alert]')).toBeNull();
  expect(host.textContent).toContain(translate('zh-CN', 'No matching templates. Try another name, creator or style.'));
  expect(host.textContent).toContain('0 个模板');
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

it('localizes facet labels consistently while retaining brand names and filter values', async () => {
  vi.stubGlobal('fetch', vi.fn(async (url: string) => Response.json(url.endsWith('/integration') ? {} : {
    items: [{ ...items[0], brand: 'Linear', uses: ['Landscape'] }], catalogVersion: 'v1', next: null, total: 1,
  })));
  await mount();
  const aside = host.querySelector('aside')!;
  expect(aside.textContent).toContain(translate('zh-CN', 'Landscape'));
  const brand = [...aside.querySelectorAll<HTMLButtonElement>('button')].find(el => el.textContent?.includes('Linear'))!;
  await act(async () => brand.click());
  expect(host.textContent).toContain('Linear ×');
  expect(host.textContent).not.toContain(translate('zh-CN', 'Linear'));
  const checkbox = [...host.querySelectorAll<HTMLInputElement>('fieldset input')].find(el => el.parentElement?.textContent === 'Linear')!;
  expect(checkbox.checked).toBe(true);
  expect(host.querySelectorAll('[data-template-id]')).toHaveLength(1);
});
