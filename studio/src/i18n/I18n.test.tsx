// @vitest-environment happy-dom
import React, { act, useState } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { I18nProvider, LOCALE_STORAGE_KEY, languages, readLocale, translate, useI18n } from './I18n';
import baseZhCN from './zh-CN.json';
import mvpZhCN from './mvp-zh-CN.json';
const zhCN = { ...baseZhCN, ...mvpZhCN };
import { FlatSelectRow } from '../components/editor/propertyPanelFlatSelectRow';
import { Section } from '../components/editor/propertyPanelPrimitives';
import { StudioToast } from '../components/StudioToast';
import { LintModal } from '../components/LintModal';
import { systemMessage } from './systemMessages';
import { HF_COLOR_GRADING_PRESETS, HF_COLOR_GRADING_PALETTES } from '@hyperframes/core/color-grading';
import { FlatColorGradingAccessory } from '../components/editor/propertyPanelFlatColorGradingAccessory';
import { normalizeHfColorGrading } from '@hyperframes/core/color-grading';
import { BLOCK_CATEGORIES } from '../utils/blockCategories';
import { EFFECT_GROUPS } from '../components/editor/propertyPanelFlatEffectSpecs';

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

it('covers every grade/effect label and keeps preset identifiers unchanged', () => {
  const labels = [...HF_COLOR_GRADING_PRESETS.map(p => p.label), ...HF_COLOR_GRADING_PALETTES.flatMap(p => [p.label, p.group]),
    ...EFFECT_GROUPS.flatMap(g => [g.label, ...g.effects.flatMap(e => [e.label, e.masterLabel,
      ...(e.settings ?? []).flatMap(c => [c.label, ...(c.kind === 'select' ? c.options.map(o => o.label) : [])])])])];
  for (const label of labels) {
    if (!label || label === 'HyperFrames') continue;
    expect(translate('zh-CN', label), label).not.toBe(label);
    expect(translate('en', label)).toBe(label);
  }
});

it('localizes system feedback without translating authored names or persisted history', () => {
  const zh = (message: string, values?: Record<string, string | number>) => translate('zh-CN', message, values);
  expect(systemMessage('Undid: Edit layer style', zh)).toBe('已撤销：编辑图层样式');
  expect(systemMessage('Copied 3 clips', zh)).toBe('已复制 3 个片段');
  expect(systemMessage('Unable to copy "Preview".', zh)).toBe('无法复制“Preview”。');
  expect(systemMessage("Can't undo: Preview.html changed since that edit.", zh)).toBe('无法撤销：Preview.html 在此次编辑后已发生变化。');
  expect(systemMessage('Undid: Edit layer style', (m, v) => translate('en', m, v))).toBe('Undid: Edit layer style');
  expect(systemMessage('Adding cosmic-orb…', zh)).toBe('正在添加 cosmic-orb…');
  expect(systemMessage('Undid: Add block: Cosmic Orb', zh)).toBe('已撤销：添加动效：Cosmic Orb');
  expect(systemMessage('Redid: Add component: Word Reveal', zh)).toBe('已重做：添加组件：Word Reveal');
  expect(systemMessage('Adding cosmic-orb…', (m, v) => translate('en', m, v))).toBe('Adding cosmic-orb…');
  expect(systemMessage("Couldn't find the current value in compositions/orb.html. It may have been edited by hand.", zh)).toBe('在 compositions/orb.html 中未找到当前值，文件可能已被手动修改。');
});

it('translates every official catalog category without changing English labels', () => {
  for (const category of BLOCK_CATEGORIES) {
    expect(translate('zh-CN', category.label)).not.toBe(category.label);
    expect(translate('en', category.label)).toBe(category.label);
  }
});

it('updates an already visible toast when the interface language changes', () => {
  function Feedback() {
    const { setLocale } = useI18n();
    return <><button onClick={() => setLocale('en')}>Switch</button><StudioToast message="Undid: Edit layer style" /></>;
  }
  act(() => root.render(<I18nProvider initialLocale="zh-CN"><Feedback /></I18nProvider>));
  expect(host.querySelector('[role="status"]')?.textContent).toContain('已撤销：编辑图层样式');
  act(() => host.querySelector('button')!.click());
  expect(host.querySelector('[role="status"]')?.textContent).toContain('Undid: Edit layer style');
});

it('renders a dismissible restore error with a localized summary and unchanged diagnostic details', () => {
  const dismiss = vi.fn();
  const message = 'VERSION_NOT_RESTORABLE: Historical files are missing, unreadable or corrupt: assets/原始配乐.wav';
  act(() => root.render(<I18nProvider initialLocale="zh-CN"><StudioToast message={message} tone="error" onDismiss={dismiss} /></I18nProvider>));
  const alert = host.querySelector('[role="alert"]')!;
  expect(alert.textContent).toBe('操作未能完成，可查看错误详情。');
  expect(host.textContent).not.toContain('assets/原始配乐.wav');
  expect(host.textContent).not.toContain('VERSION_NOT_RESTORABLE');
  act(() => host.querySelector<HTMLButtonElement>('button[aria-expanded]')!.click());
  expect(host.querySelector('pre')?.textContent).toBe(message);
  act(() => host.querySelector<HTMLButtonElement>('.motion-error-notice-close')!.click());
  expect(dismiss).toHaveBeenCalledOnce();
});

it('localizes the complete lint success dialog and updates it when the language changes', () => {
  function Results() {
    const { setLocale } = useI18n();
    return <><button onClick={() => setLocale('en')}>Switch</button><LintModal findings={[]} projectId="demo" onClose={vi.fn()} /></>;
  }
  act(() => root.render(<I18nProvider initialLocale="zh-CN"><Results /></I18nProvider>));
  const dialog = host.querySelector('[role="dialog"]')!;
  expect(dialog.getAttribute('aria-label')).toBe('项目检查结果');
  expect(dialog.querySelector('h2')?.textContent).toBe('所有检查均通过');
  expect(dialog.querySelector('p')?.textContent).toBe('项目检查结果');
  expect(dialog.textContent).toContain('未发现错误或警告，合成检查通过。');
  act(() => host.querySelector('button')!.click());
  expect(host.querySelector('[role="dialog"]')).toBe(dialog);
  expect(dialog.getAttribute('aria-label')).toBe('Project check results');
  expect(dialog.querySelector('h2')?.textContent).toBe('All checks passed');
  expect(dialog.querySelector('p')?.textContent).toBe('Project check results');
  expect(dialog.textContent).toContain('No errors or warnings found. Your composition looks good!');
  expect(dialog.textContent).not.toContain('HyperFrame');
});

it('uses OpenMotion in copied project-check instructions', async () => {
  const writeText = vi.spyOn(navigator.clipboard, 'writeText').mockResolvedValue();
  act(() => root.render(<I18nProvider initialLocale="en">
    <LintModal findings={[{ severity: 'error', message: 'Missing composition' }]} projectId="demo" onClose={vi.fn()} />
  </I18nProvider>));
  await act(async () => { [...host.querySelectorAll('button')].find(button => button.textContent === 'Copy to Agent')!.click(); });
  expect(writeText).toHaveBeenCalledWith('Fix these OpenMotion project check issues for project "demo":\n\n[error] Missing composition');
});

it('preserves custom console-error titles and original diagnostics in the shared lint dialog', () => {
  const message = 'ReferenceError: Preview is not defined';
  act(() => root.render(<I18nProvider initialLocale="zh-CN">
    <LintModal findings={[{ severity: 'error', message }]} projectId="demo" title="预览控制台错误" onClose={vi.fn()} />
  </I18nProvider>));
  const dialog = host.querySelector('[role="dialog"]')!;
  expect(dialog.getAttribute('aria-label')).toBe('预览控制台错误');
  expect(dialog.querySelector('p')?.textContent).toBe('预览控制台错误');
  expect(dialog.textContent).toContain(message);
  expect(dialog.textContent).not.toContain('HyperFrame');
});

it('updates runtime grading feedback without rebuilding the grading controls', () => {
  function GradingFeedback() {
    const { setLocale } = useI18n();
    return <><button onClick={() => setLocale('en')}>Switch</button>
      <FlatColorGradingAccessory state={{ grading: normalizeHfColorGrading('neutral')!, compareEnabled: false,
        runtimeStatus: { state: 'inactive', message: 'No grading applied' }, commitCompare: vi.fn(), resetGrading: vi.fn() }} /></>;
  }
  act(() => root.render(<I18nProvider initialLocale="zh-CN"><GradingFeedback /></I18nProvider>));
  const status = host.querySelector('[data-flat-grade-status-message]')!;
  expect(status.textContent).toBe('尚未应用调色');
  act(() => host.querySelector('button')!.click());
  expect(host.querySelector('[data-flat-grade-status-message]')).toBe(status);
  expect(status.textContent).toBe('No grading applied');
});

it('localizes media option labels in both languages without changing serialized values', () => {
  const options = ['fast', 'balanced', 'best', 'contain', 'cover', 'fill', 'none', 'scale-down', 'left top', 'right top', 'left bottom', 'right bottom', 'Montage', 'Hero', 'Bullet', 'Jump cut', 'Flash in', 'Flash out', 'Ramp in', 'Ramp out', 'Slow-mo middle'];
  const change = vi.fn();
  function Options() {
    const { setLocale } = useI18n();
    return <><button onClick={() => setLocale('en')}>Switch</button><FlatSelectRow label="Fit" value="contain" options={options} tier="default" onChange={change} /></>;
  }
  act(() => root.render(<I18nProvider initialLocale="zh-CN"><Options /></I18nProvider>));
  const select = host.querySelector('select')!;
  for (const option of select.options) {
    expect(option.textContent, option.value).not.toBe(option.value);
    expect(options).toContain(option.value);
  }
  act(() => { select.value = 'cover'; select.dispatchEvent(new Event('change', { bubbles: true })); });
  expect(change).toHaveBeenCalledWith('cover');
  act(() => host.querySelector('button')!.click());
  expect(host.querySelector('select')).toBe(select);
  for (const option of select.options) expect(option.textContent).toBe(option.value);
});

it('localizes dynamic split and grading feedback without translating user names', () => {
  const zh = (m: string, v?: Record<string, string | number>) => translate('zh-CN', m, v);
  expect(systemMessage('Split Preview at 2.94s', zh)).toBe('已在 2.94 秒处分割 Preview');
  expect(systemMessage('Split 2 clips at 2.94s', zh)).toBe('已在 2.94 秒处分割 2 个片段');
  expect(systemMessage('Applied color grading on 2 media items', zh)).toBe('已为 2 个素材应用调色');
  expect(systemMessage('Split Preview at 2.94s', (m, v) => translate('en', m, v))).toBe('Split Preview at 2.94s');
});

it('localizes singular, plural and parameterized undo/redo operations without changing clip names', () => {
  const zh = (m: string, v?: Record<string, string | number>) => translate('zh-CN', m, v);
  const en = (m: string, v?: Record<string, string | number>) => translate('en', m, v);
  for (const label of ['Duplicate clip', 'Duplicate clips', 'Paste clip', 'Paste clips', 'Split timeline clip', 'Edit text']) {
    expect(systemMessage(`Undid: ${label}`, zh)).not.toContain(label);
    expect(systemMessage(`Redid: ${label}`, zh)).not.toContain(label);
    expect(systemMessage(`Redid: ${label}`, en)).toBe(`Redid: ${label}`);
  }
  expect(systemMessage('Undid: Split 2 clips at 1.50s', zh)).toBe(`已撤销：${translate('zh-CN', 'Split {count} clips at {time}s', {count: 2, time: '1.50'})}`);
  expect(systemMessage('Split Preview at 1.50s', zh)).toContain('Preview');
  expect(translate('zh-CN', 'Split (move playhead inside clip)')).toBe('分割（请将播放头移到片段内）');
  expect(systemMessage('Undo failed: fetch failed', zh)).toBe('撤销失败：无法连接预览服务，请检查连接后重试。');
  expect(systemMessage('Redo failed: unexpected internal error', zh)).not.toContain('unexpected');
});
