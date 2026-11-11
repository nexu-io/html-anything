/** Prism locale aliases shared by the catalog and local clients. */
export function catalogLocale(locales: string[], requested: string, fallback: string): string {
  const normalize = (value: string) => value.toLowerCase() === 'zh' ? 'zh-cn' : value.toLowerCase();
  return [requested, 'en', fallback]
    .map(value => locales.find(locale => normalize(locale) === normalize(value)))
    .find(Boolean) ?? fallback;
}
