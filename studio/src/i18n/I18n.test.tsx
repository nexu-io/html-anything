// @vitest-environment happy-dom
import React, { act, useState } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { I18nProvider, LOCALE_STORAGE_KEY, languages, readLocale, translate, useI18n } from './I18n';
import zhCN from './zh-CN.json';
import { FlatSelectRow } from '../components/editor/propertyPanelFlatSelectRow';
import { Section } from '../components/editor/propertyPanelPrimitives';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;
let root: Root;
let host: HTMLDivElement;
beforeEach(() => {
  localStorage.clear();
  host = document.createElement('div'); document.body.append(host); root = createRoot(host);
});
afterEach(() => { act(() => root.unmount()); host.remove(); vi.restoreAllMocks(); });

function EditorState() {
  const { t, locale, setLocale } = useI18n();
  const [draft, setDraft] = useState('Preview');
  return <>
    <button onClick={() => setLocale(locale === 'en' ? 'zh-CN' : 'en')}>{t('Language')}</button>
    <h1>{t('Preview')}</h1>
    <input aria-label="Authored text" value={draft} onChange={event => setDraft(event.target.value)} />
    <iframe title="Composition" srcDoc="<h1>Preview</h1>" />
  </>;
}

it('switches immediately, retains the editor subtree, and remembers the selected language', () => {
  act(() => root.render(<I18nProvider><EditorState /></I18nProvider>));
  const input = host.querySelector('input')!;
  const preview = host.querySelector('iframe');
  expect(host.querySelector('h1')?.textContent).toBe('预览');
  expect(document.documentElement.lang).toBe('zh-CN');
  act(() => host.querySelector('button')!.click());
  expect(host.querySelector('h1')?.textContent).toBe('Preview');
  expect(document.documentElement.lang).toBe('en');
  expect(readLocale()).toBe('en');
  expect(host.querySelector('input')).toBe(input);
  expect(input.value).toBe('Preview');
  expect(host.querySelector('iframe')).toBe(preview);
  expect(preview?.srcdoc).toBe('<h1>Preview</h1>');
  act(() => window.dispatchEvent(new StorageEvent('storage', { key: LOCALE_STORAGE_KEY, newValue: 'zh-CN' })));
  expect(host.querySelector('h1')?.textContent).toBe('预览');
});

it('falls back to Chinese for unsupported preferences and switches when persistence is unavailable', () => {
  localStorage.setItem(LOCALE_STORAGE_KEY, 'invalid');
  expect(readLocale()).toBe('zh-CN');
  vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => { throw new Error('denied'); });
  vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new Error('denied'); });
  expect(readLocale()).toBe('zh-CN');
  act(() => root.render(<I18nProvider><EditorState /></I18nProvider>));
  act(() => host.querySelector('button')!.click());
  expect(host.querySelector('h1')?.textContent).toBe('Preview');
});

it.each(languages)('preserves authored values, commits and section identifiers in $locale', ({ locale }) => {
  const commit = vi.fn();
  function Property() {
    const { t } = useI18n();
    return <Section title='Style' icon={null}>
      <FlatSelectRow label="Fit" value="cover" options={['cover', 'contain']} tier="explicitCustom" onChange={commit} />
    </Section>;
  }
  act(() => root.render(<I18nProvider initialLocale={locale}><Property /></I18nProvider>));
  expect(host.querySelector('section')?.dataset.panelSection).toBe('style');
  const select = host.querySelector('select')!;
  expect(select.value).toBe('cover');
  expect(select.options[0].value).toBe('cover');
  act(() => { select.value = 'contain'; select.dispatchEvent(new Event('change', { bubbles: true })); });
  expect(commit).toHaveBeenCalledWith('contain');
});

it('restores and synchronizes every supported preference without replacing editor content', () => {
  function Controls() {
    const { setLocale } = useI18n();
    return <>{languages.map(language => <button key={language.locale} data-locale={language.locale} onClick={() => setLocale(language.locale)}>{language.label}</button>)}<EditorState /></>;
  }
  act(() => root.render(<I18nProvider><Controls /></I18nProvider>));
  const input = host.querySelector('input'), preview = host.querySelector('iframe');
  for (const { locale } of languages) {
    act(() => host.querySelector<HTMLButtonElement>(`[data-locale="${locale}"]`)!.click());
    expect(readLocale()).toBe(locale);
    expect(document.documentElement.lang).toBe(locale);
    expect(host.querySelector('h1')?.textContent).toBe(translate(locale, 'Preview'));
    expect(host.querySelector('input')).toBe(input);
    expect(host.querySelector('iframe')).toBe(preview);
    act(() => window.dispatchEvent(new StorageEvent('storage', { key: LOCALE_STORAGE_KEY, newValue: locale })));
    expect(document.documentElement.lang).toBe(locale);
  }
  act(() => window.dispatchEvent(new StorageEvent('storage', { key: LOCALE_STORAGE_KEY, newValue: 'unsupported' })));
  expect(document.documentElement.lang).toBe('zh-CN');
  act(() => window.dispatchEvent(new StorageEvent('storage', { key: LOCALE_STORAGE_KEY, newValue: 'ja' })));
  act(() => window.dispatchEvent(new StorageEvent('storage', { key: null })));
  expect(document.documentElement.lang).toBe('zh-CN');
});

it('preserves interpolated content and formats English plurals without translating file names', () => {
  expect(translate('zh-CN', 'Download {value0}', { value0: 'Preview.mp4' })).toBe('下载 Preview.mp4');
  expect(translate('en', '{count} files', { count: 1 })).toBe('1 file');
  expect(translate('en', '{count} files', { count: 2 })).toBe('2 files');
  expect(translate('zh-CN', '{count} files', { count: 0 })).toBe('0 个文件');
  expect(translate('en', 'Unknown message')).toBe('Unknown message');
});

it('keeps all translated interpolation placeholders present and intact', () => {
  const placeholders = (value: string) => [...value.matchAll(/\{(\w+)\}/g)].map(match => match[1]).sort();
  for (const [source, translated] of Object.entries(zhCN)) {
    expect(placeholders(translated), source).toEqual(placeholders(source));
  }
});

it.each(languages)('keeps every native property section identifier stable in $locale', ({ locale }) => {
  const titles = ['Animation', 'Layout', 'Color grading', 'Text', 'Flex', 'Radius', 'Stroke', 'Effects', 'Clip', 'Transparency', 'Fill', 'Timing', 'Image', 'Video', 'Audio'];
  act(() => root.render(<I18nProvider initialLocale={locale}>{titles.map(title => <Section key={title} title={title} icon={null}><span /></Section>)}</I18nProvider>));
  expect([...host.querySelectorAll('section')].map(section => section.dataset.panelSection)).toEqual(['animation', 'layout', 'color-grading', 'text', 'flex', 'radius', 'stroke', 'effects', 'clip', 'transparency', 'fill', 'timing', 'image', 'video', 'audio']);
  expect([...host.querySelectorAll('h3')].map(title => title.textContent)).toEqual(titles.map(title => translate(locale, title)));
});
