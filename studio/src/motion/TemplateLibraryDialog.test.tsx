// @vitest-environment happy-dom
import React, { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { I18nProvider, useI18n, translate } from '../i18n/I18n';
import { TemplateLibraryDialog } from './TemplateLibraryDialog';
import { trackMotion } from './tracking';
vi.mock('./tracking', () => ({ trackMotion: vi.fn(async () => 'queued') }));

globalThis.IS_REACT_ACT_ENVIRONMENT = true;
let root: Root, host: HTMLDivElement;
const items = [
  { id: 'one', title: 'First', author: 'Author', brand: 'Figma', uses: ['Demo'], styles: ['UI'], tags: [], kind: 'prism', hasHtmlProject: true, sortOrder: 2, featuredOrder: 0, motionDocumentUrl: 'https://example.com/motion.zip', motionGuideUrl: 'https://example.com/guide', styleDescription: 'Visual rules', reviewFocus: 'Production rules', posterUrl: '/one.jpg' },
  { id: 'two', title: 'Second', author: 'Author', brand: 'Other', uses: ['Launch'], tags: [], kind: 'prism', hasHtmlProject: false, sortOrder: 1, posterUrl: '/two.jpg' },
];
beforeEach(() => {
  vi.clearAllMocks();
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
it('uses published brand logos and tries the bundled logo before falling back to initials', async () => {
  vi.stubGlobal('fetch', vi.fn(async (url: string) => Response.json(url.endsWith('/integration') ? {} : {
    items: [{ ...items[0], brand: 'Notion', brandLogoUrl: 'https://example.com/notion.svg' }], catalogVersion: 'logos', next: null, total: 1,
  })));
  await mount();
  const brand = [...host.querySelectorAll<HTMLButtonElement>('aside button')].find(el => el.textContent?.includes('Notion'))!;
  const image = brand.querySelector('img')!;
  expect(image?.getAttribute('src')).toBe('https://example.com/notion.svg');
  await act(async () => image.dispatchEvent(new Event('error')));
  expect(image.getAttribute('src')).toMatch(/notion\.png$/);
  await act(async () => image.dispatchEvent(new Event('error')));
  expect(brand.querySelector('img')).toBeNull();
  expect(brand.textContent).toContain('NNotion');
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
  expect(trackMotion).toHaveBeenCalledWith('ui_click', { page_name: 'studio', area: 'templates', element: 'select_template' });
  expect(trackMotion).toHaveBeenCalledWith('template_instruction_copy_result', { host_product: 'mcp', copy_status: 'clipboard_written' });
  await act(async () => button('Second').click());
  expect(button('打开并编辑 ↗')).toBeUndefined();
});

it('reports clipboard fallback from the actual prompt without counting it as copied', async () => {
  await mount();
  await act(async () => button('First').click());
  await act(async () => button('复刻模板').click());
  vi.mocked(navigator.clipboard.writeText).mockRejectedValueOnce(new Error('PRIVATE_CLIPBOARD_ERROR'));
  await act(async () => host.querySelector<HTMLButtonElement>('button[aria-label=复制]')!.click());
  expect(trackMotion).toHaveBeenCalledWith('template_instruction_copy_result', { host_product: 'mcp', copy_status: 'manual_fallback_shown' });
  expect(host.querySelector<HTMLTextAreaElement>('textarea')!.value).toContain('First');
  expect(trackMotion).not.toHaveBeenCalledWith('template_instruction_copy_result', expect.objectContaining({ copy_status: 'clipboard_written' }));
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
