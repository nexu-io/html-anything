import { describe, expect, it } from 'vitest';
import { dictionaries, languages, translate } from './messages';

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
