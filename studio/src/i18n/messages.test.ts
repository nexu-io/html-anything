import { describe, expect, it } from 'vitest';
import { dictionaries, languages, translate, mvpMessages, isKnownMessage } from './messages';
import mvpUi from './mvp-ui.json';
import { historyEntryLabel } from './historyMessages';

describe('editor language resources', () => {
  it('offers the eleven requested languages and a complete vocabulary in each dictionary', () => {
    expect(languages.map(language => language.locale)).toEqual(['en', 'zh-CN', 'ja', 'ko', 'de', 'fr', 'ru', 'es', 'pt-BR', 'it', 'tr']);
    const keys = Object.keys(dictionaries['zh-CN']).sort();
    for (const [locale, dictionary] of Object.entries(dictionaries)) {
      expect(Object.keys(dictionary).sort(), locale).toEqual(keys);
      for (const [source, value] of Object.entries(dictionary)) {
        const placeholders = (message: string) => [...message.matchAll(/\{(\w+)\}/g)].map(match => match[1]).sort();
        for (const message of typeof value === 'string' ? [value] : Object.values(value)) {
          expect(message?.trim(), `${locale}: ${source}`).toBeTruthy();
          expect(placeholders(message!), `${locale}: ${source}`).toEqual(placeholders(source));
        }
      }
    }
  });

  it('selects Russian and German plural forms, including zero and fractional counts', () => {
    expect(translate('ru', '{count} files', { count: 1 })).toBe('1 файл');
    expect(translate('ru', '{count} files', { count: 2 })).toBe('2 файла');
    expect(translate('ru', '{count} files', { count: 5 })).toBe('5 файлов');
    expect(translate('ru', '{count} files', { count: 21 })).toBe('21 файл');
    expect(translate('ru', '{count} files', { count: 0 })).toBe('0 файлов');
    expect(translate('ru', '{count} files', { count: 1.5 })).toBe('1.5 файла');
    expect(translate('de', '{count} files', { count: 1 })).toBe('1 Datei');
    expect(translate('de', '{count} files', { count: 2 })).toBe('2 Dateien');
  });

  it('preserves authored interpolation values and unknown diagnostics across languages', () => {
    for (const { locale } of languages) {
      expect(translate(locale, 'Download {value0}', { value0: 'Preview.mp4' }), locale).toContain('Preview.mp4');
      expect(translate(locale, 'Unrecognized provider diagnostic: /assets/原稿.png')).toBe('Unrecognized provider diagnostic: /assets/原稿.png');
    }
  });

  it('localizes Prism cache warnings while retaining the original failure diagnostic', () => {
    for (const { locale } of languages) {
      const diagnostic = 'HTTP 503: /templates/原稿';
      expect(translate(locale, `模板更新失败，使用已缓存目录：${diagnostic}`)).toBe(translate(locale, 'Template update failed; using cached catalogue: {message}', { message: diagnostic }));
      expect(translate(locale, '模板缓存不可用，重新下载')).toBe(translate(locale, 'Template cache unavailable; downloading again'));
    }
  });
});

it('keeps Chinese additions interpolated and preserves fallback for unexposed advanced controls', () => {
  for (const [source, translated] of Object.entries(mvpMessages['zh-CN']!)) {
    expect(isKnownMessage(source)).toBe(true);
    expect(typeof translated).toBe('string');
    const values = Object.fromEntries([...source.matchAll(/\{(\w+)\}/g)].map(match => [match[1], 'sample']));
    expect(translate('zh-CN', source, values)).not.toMatch(/\{\w+\}/);
    for (const { locale } of languages.filter(language => language.locale !== 'zh-CN')) {
      if (!mvpMessages[locale]?.[source] && (locale === 'en' || !dictionaries[locale]?.[source])) expect(translate(locale, source, values)).toBe(translate('en', source, values));
    }
  }
});

it('covers phase-one additions in all nine other languages without losing placeholders', () => {
  const keys = Object.keys(mvpUi.de).sort();
  expect(Object.keys(mvpUi).sort()).toEqual(languages.map(l => l.locale).filter(l => l !== 'en' && l !== 'zh-CN').sort());
  for (const [locale, messages] of Object.entries(mvpUi)) {
    expect(Object.keys(messages).sort(), locale).toEqual(keys);
    for (const [source, value] of Object.entries(messages)) {
      expect(value.trim(), `${locale}: ${source}`).toBeTruthy();
      const placeholders = (text: string) => [...text.matchAll(/\{\w+\}/g)].map(match => match[0]).sort();
      expect(placeholders(value), `${locale}: ${source}`).toEqual(placeholders(source));
    }
  }
});

it('localizes audited controls and history without translating authored names', () => {
  expect(translate('de', 'Undo')).toBe('Rückgängig');
  expect(translate('ru', 'Align left')).toBe('По левому краю');
  expect(translate('ja', 'Expand')).toBe('展開');
  for (const { locale } of languages.filter(l => l.locale !== 'en')) {
    const t = (message: string, values?: Record<string, string | number>) => translate(locale, message, values);
    for (const key of ['Expand left panel', 'Split', 'Import files', 'Took {value0}', 'Edit layer style', 'Move timeline clips']) {
      expect(t(key), `${locale}: ${key}`).not.toBe(key);
    }
    expect(historyEntryLabel('Hide track 2', t)).toContain('2');
    expect(historyEntryLabel('Hide track 2', t)).not.toBe('Hide track 2');
    expect(historyEntryLabel('Undid: Move timeline clips', t)).toContain(t('Move timeline clips'));
    expect(historyEntryLabel('Add block: My Custom Title', t)).toContain('My Custom Title');
    expect(historyEntryLabel('My authored version name', t)).toBe('My authored version name');
  }
});
