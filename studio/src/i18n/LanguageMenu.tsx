import { Menu, MenuRadioGroup, MenuRadioItem } from '../components/ui';
import { MotionIcon } from '../motion/icons';
import { useI18n, languages, isLocale } from './I18n';

export function LanguageMenu({ onChange }: { onChange?: (locale: string) => void } = {}) {
  const { t, locale, setLocale } = useI18n();
  return <Menu aria-label={t('Language')} className="motion-language-menu" align="end" trigger={
    <button type="button" className="motion-button motion-button-quiet motion-language-button" aria-label={t('Language')}>
      <MotionIcon name="globe" size={14} /><span>{languages.find(language => language.locale === locale)!.label}</span>
    </button>
  }>
    <MenuRadioGroup className="motion-language-options" value={locale} onValueChange={value => { if (isLocale(value)) { if (value !== locale) onChange?.(value); setLocale(value); } }}>
      {languages.map(language => <MenuRadioItem closeOnClick key={language.locale} value={language.locale}><span lang={language.locale}>{language.label}</span></MenuRadioItem>)}
    </MenuRadioGroup>
  </Menu>;
}
