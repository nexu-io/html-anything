import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { isLocale, translate, type Locale, type MessageValues } from './messages';
export { languages, isLocale, translate, sourceMessage } from './messages';
export type { Locale, MessageValues, Translate } from './messages';
export const LOCALE_STORAGE_KEY = 'motion.studio.locale';

export function readLocale(): Locale {
  try { const saved = localStorage.getItem(LOCALE_STORAGE_KEY); if (isLocale(saved)) return saved; } catch { /* Private browsing can deny storage. */ }
  return 'zh-CN';
}

function languageTools(locale: Locale) {
  return {
    locale,
    t: (message: string, values?: MessageValues) => translate(locale, message, values),
    formatDate: (date: number | Date, options?: Intl.DateTimeFormatOptions) => new Intl.DateTimeFormat(locale, options).format(date),
    formatNumber: (number: number, options?: Intl.NumberFormatOptions) => new Intl.NumberFormat(locale, options).format(number),
  };
}

// Standalone upstream components keep English unless a product host provides a locale.
const I18nContext = createContext({ ...languageTools('en'), setLocale: (_locale: Locale) => {} });
export const useI18n = () => useContext(I18nContext);

export function I18nProvider({ children, initialLocale }: { children: ReactNode; initialLocale?: Locale }) {
  const [locale, updateLocale] = useState<Locale>(() => initialLocale ?? readLocale());
  const setLocale = useCallback((next: Locale) => {
    if (!isLocale(next)) return;
    updateLocale(next);
    try { localStorage.setItem(LOCALE_STORAGE_KEY, next); } catch { /* Switching still works without persistence. */ }
  }, []);
  useEffect(() => {
    document.documentElement.lang = locale;
    const onStorage = (event: StorageEvent) => {
      if (event.storageArea && event.storageArea !== localStorage) return;
      if (event.key === LOCALE_STORAGE_KEY || event.key === null) updateLocale(isLocale(event.newValue) ? event.newValue : 'zh-CN');
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, [locale]);
  const value = useMemo(() => ({ ...languageTools(locale), setLocale }), [locale, setLocale]);
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}
